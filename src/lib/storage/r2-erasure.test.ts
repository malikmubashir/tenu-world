import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Art. 17 R2 purge suite — account deletion must erase the blobs, not
// just the DB rows (docs/architecture/04-Security.md §8.5, resolved
// 2026-06-11). Covers: photo keys + PDF keys are deleted, missing
// objects are tolerated (idempotent), partial failures are collected
// without aborting, and batches respect the 1000-key DeleteObjects cap.

// The module is `server-only`; neutralise the marker under vitest.
vi.mock("server-only", () => ({}));

const sendFn = vi.hoisted(() => vi.fn());

vi.mock("@aws-sdk/client-s3", () => {
  class FakeCommand {
    constructor(public input: Record<string, unknown>) {}
  }
  return {
    S3Client: class {
      send = sendFn;
    },
    ListObjectsV2Command: class ListObjectsV2Command extends FakeCommand {},
    DeleteObjectsCommand: class DeleteObjectsCommand extends FakeCommand {},
  };
});

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  collectUserR2Keys,
  keyFromR2Url,
  purgeUserR2Objects,
} from "./r2-erasure";

const USER = "11111111-2222-3333-4444-555555555555";

// ── helpers ──────────────────────────────────────────────────────────

function isList(cmd: unknown): boolean {
  return (cmd as { constructor: { name: string } }).constructor.name ===
    "ListObjectsV2Command";
}

function deletedKeysOf(cmd: unknown): string[] {
  const input = (cmd as { input: { Delete: { Objects: { Key: string }[] } } })
    .input;
  return input.Delete.Objects.map((o) => o.Key);
}

/** Default send: empty listing, clean (Quiet) delete responses. */
function wireDefaultS3(listedKeys: string[] = []) {
  sendFn.mockImplementation((cmd: unknown) => {
    if (isList(cmd)) {
      return Promise.resolve({
        Contents: listedKeys.map((Key) => ({ Key })),
        IsTruncated: false,
      });
    }
    return Promise.resolve({}); // DeleteObjects, Quiet: no errors
  });
}

/** Minimal fake admin client returning canned rows per table/filter. */
function makeAdmin(rows: {
  inspections?: Record<string, unknown>[];
  photosByInspection?: Record<string, unknown>[];
  rooms?: Record<string, unknown>[];
  photosByRoom?: Record<string, unknown>[];
  letters?: Record<string, unknown>[];
}): SupabaseClient {
  return {
    from(table: string) {
      return {
        select() {
          return {
            eq: () =>
              Promise.resolve({
                data:
                  table === "inspections"
                    ? rows.inspections ?? []
                    : rows.letters ?? [],
                error: null,
              }),
            in: (column: string) =>
              Promise.resolve({
                data:
                  table === "rooms"
                    ? rows.rooms ?? []
                    : column === "inspection_id"
                      ? rows.photosByInspection ?? []
                      : rows.photosByRoom ?? [],
                error: null,
              }),
          };
        },
      };
    },
  } as unknown as SupabaseClient;
}

beforeEach(() => {
  sendFn.mockReset();
  process.env.R2_ACCOUNT_ID = "acct";
  process.env.R2_BUCKET_NAME = "tenu-bucket";
  process.env.R2_ACCESS_KEY_ID = "key";
  process.env.R2_SECRET_ACCESS_KEY = "secret";
  delete process.env.R2_PUBLIC_URL;
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── keyFromR2Url ─────────────────────────────────────────────────────

describe("keyFromR2Url", () => {
  it("derives the key from a path-style cloudflarestorage URL (bucket stripped)", () => {
    expect(
      keyFromR2Url(
        `https://acct.r2.cloudflarestorage.com/tenu-bucket/${USER}/reports/insp-123.pdf`,
      ),
    ).toBe(`${USER}/reports/insp-123.pdf`);
  });

  it("derives the key from an R2_PUBLIC_URL-prefixed URL", () => {
    process.env.R2_PUBLIC_URL = "https://cdn.tenu.world";
    expect(keyFromR2Url(`https://cdn.tenu.world/${USER}/room-1/p.jpg`)).toBe(
      `${USER}/room-1/p.jpg`,
    );
  });

  it("returns null for empty or unparsable values", () => {
    expect(keyFromR2Url(null)).toBeNull();
    expect(keyFromR2Url("")).toBeNull();
    expect(keyFromR2Url("not a url")).toBeNull();
  });
});

// ── collectUserR2Keys ────────────────────────────────────────────────

describe("collectUserR2Keys", () => {
  it("collects photo keys, contract PDFs, scan-report PDFs and letter PDFs", async () => {
    const admin = makeAdmin({
      inspections: [
        {
          id: "insp-1",
          contract_pdf_r2_key: `${USER}/contracts/lease.pdf`,
          risk_score: {
            pdfUrl: `https://acct.r2.cloudflarestorage.com/tenu-bucket/${USER}/reports/insp-1.pdf`,
          },
        },
        { id: "insp-2", contract_pdf_r2_key: null, risk_score: null },
      ],
      photosByInspection: [
        { r2_key: `${USER}/room-a/1.jpg` },
        { r2_key: `${USER}/room-a/2.jpg` },
      ],
      rooms: [{ id: "room-a" }, { id: "room-b" }],
      // overlap with the inspection_id query — must be deduped
      photosByRoom: [
        { r2_key: `${USER}/room-a/1.jpg` },
        { r2_key: `${USER}/room-b/3.jpg` },
      ],
      letters: [
        {
          letter_pdf_url: `https://acct.r2.cloudflarestorage.com/tenu-bucket/${USER}/letters/l-1.pdf`,
        },
        { letter_pdf_url: null },
      ],
    });

    const keys = await collectUserR2Keys(admin, USER);
    expect(keys.sort()).toEqual(
      [
        `${USER}/contracts/lease.pdf`,
        `${USER}/reports/insp-1.pdf`,
        `${USER}/room-a/1.jpg`,
        `${USER}/room-a/2.jpg`,
        `${USER}/room-b/3.jpg`,
        `${USER}/letters/l-1.pdf`,
      ].sort(),
    );
  });

  it("returns an empty list when the user has no data", async () => {
    const keys = await collectUserR2Keys(makeAdmin({}), USER);
    expect(keys).toEqual([]);
  });
});

// ── purgeUserR2Objects ───────────────────────────────────────────────

describe("purgeUserR2Objects", () => {
  it("deletes the union of DB-recorded keys and the userId/ prefix listing", async () => {
    // listing finds an orphan blob whose DB row is gone + one duplicate
    wireDefaultS3([`${USER}/room-x/orphan.jpg`, `${USER}/room-a/1.jpg`]);

    const result = await purgeUserR2Objects(USER, [
      `${USER}/room-a/1.jpg`,
      `${USER}/reports/insp-1.pdf`,
    ]);

    const listCalls = sendFn.mock.calls.filter(([cmd]) => isList(cmd));
    expect(listCalls).toHaveLength(1);
    expect(
      (listCalls[0][0] as { input: { Prefix: string } }).input.Prefix,
    ).toBe(`${USER}/`);

    const deleteCalls = sendFn.mock.calls.filter(([cmd]) => !isList(cmd));
    expect(deleteCalls).toHaveLength(1);
    expect(deletedKeysOf(deleteCalls[0][0]).sort()).toEqual(
      [
        `${USER}/room-a/1.jpg`,
        `${USER}/reports/insp-1.pdf`,
        `${USER}/room-x/orphan.jpg`,
      ].sort(),
    );
    expect(result).toEqual({ attempted: 3, deleted: 3, failed: [] });
  });

  it("tolerates already-missing objects (404/NoSuchKey) as idempotent success", async () => {
    sendFn.mockImplementation((cmd: unknown) => {
      if (isList(cmd)) return Promise.resolve({ Contents: [] });
      return Promise.resolve({
        Errors: [
          { Key: `${USER}/room-a/gone.jpg`, Code: "NoSuchKey", Message: "x" },
        ],
      });
    });

    const result = await purgeUserR2Objects(USER, [
      `${USER}/room-a/gone.jpg`,
      `${USER}/reports/insp-1.pdf`,
    ]);
    expect(result.failed).toEqual([]);
    expect(result.deleted).toBe(2);
  });

  it("collects per-key failures and still resolves (erasure proceeds)", async () => {
    sendFn.mockImplementation((cmd: unknown) => {
      if (isList(cmd)) return Promise.resolve({ Contents: [] });
      return Promise.resolve({
        Errors: [
          {
            Key: `${USER}/reports/stuck.pdf`,
            Code: "InternalError",
            Message: "we encountered an internal error",
          },
        ],
      });
    });

    const result = await purgeUserR2Objects(USER, [
      `${USER}/reports/stuck.pdf`,
      `${USER}/room-a/1.jpg`,
    ]);
    expect(result.deleted).toBe(1);
    expect(result.failed).toEqual([
      {
        key: `${USER}/reports/stuck.pdf`,
        error: "InternalError: we encountered an internal error",
      },
    ]);
  });

  it("marks a whole failed batch for manual sweep and continues with later batches", async () => {
    // 1500 keys → two DeleteObjects batches; make the first one throw.
    const keys = Array.from({ length: 1500 }, (_, i) => `${USER}/p/${i}.jpg`);
    let deleteCallCount = 0;
    sendFn.mockImplementation((cmd: unknown) => {
      if (isList(cmd)) return Promise.resolve({ Contents: [] });
      deleteCallCount += 1;
      if (deleteCallCount === 1) {
        return Promise.reject(new Error("connection reset"));
      }
      return Promise.resolve({});
    });

    const result = await purgeUserR2Objects(USER, keys);

    const deleteCalls = sendFn.mock.calls.filter(([cmd]) => !isList(cmd));
    expect(deleteCalls).toHaveLength(2);
    expect(deletedKeysOf(deleteCalls[0][0])).toHaveLength(1000);
    expect(deletedKeysOf(deleteCalls[1][0])).toHaveLength(500);
    expect(result.attempted).toBe(1500);
    expect(result.deleted).toBe(500);
    expect(result.failed).toHaveLength(1000);
    expect(result.failed[0].error).toBe("connection reset");
  });

  it("survives a listing failure and still deletes DB-recorded keys", async () => {
    sendFn.mockImplementation((cmd: unknown) => {
      if (isList(cmd)) return Promise.reject(new Error("list denied"));
      return Promise.resolve({});
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await purgeUserR2Objects(USER, [`${USER}/room-a/1.jpg`]);
    expect(result).toEqual({ attempted: 1, deleted: 1, failed: [] });
    expect(warnSpy).toHaveBeenCalled();
  });

  it("paginates a truncated prefix listing", async () => {
    let listCallCount = 0;
    sendFn.mockImplementation((cmd: unknown) => {
      if (isList(cmd)) {
        listCallCount += 1;
        if (listCallCount === 1) {
          return Promise.resolve({
            Contents: [{ Key: `${USER}/a.jpg` }],
            IsTruncated: true,
            NextContinuationToken: "tok",
          });
        }
        return Promise.resolve({
          Contents: [{ Key: `${USER}/b.jpg` }],
          IsTruncated: false,
        });
      }
      return Promise.resolve({});
    });

    const result = await purgeUserR2Objects(USER, []);
    expect(listCallCount).toBe(2);
    expect(result.attempted).toBe(2);
    expect(result.deleted).toBe(2);
  });

  it("throws when R2 is not configured (caller logs for manual sweep)", async () => {
    delete process.env.R2_ACCOUNT_ID;
    await expect(purgeUserR2Objects(USER, ["k"])).rejects.toThrow(
      "R2 not configured",
    );
  });
});
