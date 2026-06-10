import { describe, it, expect, vi, beforeEach } from "vitest";

// #T146 regression suite — profiles schema vocabulary.
// The live database (and supabase/schema.sql, the canonical shape) uses
// full_name / preferred_language. notify.ts previously selected the
// retired migration-001 vocabulary (display_name / locale), which made
// every scan-complete / dispute-ready email silently lose the recipient
// name and fall back to English.

const { sendBrevoFn, pushFn, selectFn } = vi.hoisted(() => {
  return {
    sendBrevoFn: vi.fn(),
    pushFn: vi.fn().mockResolvedValue(undefined),
    selectFn: vi.fn(),
  };
});

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table !== "profiles") {
        throw new Error(`unexpected table: ${table}`);
      }
      return { select: selectFn };
    },
  }),
}));

// Partial mock: templates import escapeHtml from the same module, keep it real.
vi.mock("./brevo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./brevo")>();
  return {
    ...actual,
    sendBrevoTransactional: sendBrevoFn,
  };
});

vi.mock("@/lib/notifications/push", () => ({
  sendPushNotification: pushFn,
}));

interface ProfileRow {
  email: string | null;
  full_name: string | null;
  preferred_language: string | null;
}

function wireProfile(row: ProfileRow | null): void {
  selectFn.mockReturnValue({
    eq: () => ({
      maybeSingle: () =>
        Promise.resolve({ data: row, error: null }),
    }),
  });
}

describe("notify.ts profile loading (#T146)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendBrevoFn.mockResolvedValue({ ok: true, status: 201 });
  });

  it("selects the canonical schema columns (full_name, preferred_language)", async () => {
    wireProfile({
      email: "marie@example.com",
      full_name: "Marie Dupont",
      preferred_language: "fr",
    });

    const { notifyScanComplete } = await import("./notify");
    const res = await notifyScanComplete({
      userId: "user-1",
      inspectionId: "insp-1",
      pdfUrl: null,
    });

    expect(res.ok).toBe(true);
    expect(selectFn).toHaveBeenCalledWith("email, full_name, preferred_language");
  });

  it("maps full_name to the recipient name and preferred_language to the locale", async () => {
    wireProfile({
      email: "marie@example.com",
      full_name: "Marie Dupont",
      preferred_language: "fr",
    });

    const { notifyScanComplete } = await import("./notify");
    const { scanCompleteSubject } = await import("./templates/scan-complete");

    await notifyScanComplete({
      userId: "user-1",
      inspectionId: "insp-1",
      pdfUrl: null,
    });

    expect(sendBrevoFn).toHaveBeenCalledTimes(1);
    const call = sendBrevoFn.mock.calls[0][0] as {
      to: { email: string; name?: string };
      subject: string;
    };
    expect(call.to.email).toBe("marie@example.com");
    expect(call.to.name).toBe("Marie Dupont");
    expect(call.subject).toBe(scanCompleteSubject("fr"));
  });

  it("coerces the blank full_name written by handle_new_user to the generic greeting", async () => {
    wireProfile({
      email: "li@example.com",
      full_name: "",
      preferred_language: "en",
    });

    const { notifyScanComplete } = await import("./notify");
    await notifyScanComplete({
      userId: "user-2",
      inspectionId: "insp-2",
      pdfUrl: null,
    });

    const call = sendBrevoFn.mock.calls[0][0] as {
      to: { email: string; name?: string };
    };
    expect(call.to.name).toBeUndefined();
  });

  it("returns a typed failure when the profile is missing", async () => {
    wireProfile(null);

    const { notifyDisputeReady } = await import("./notify");
    const res = await notifyDisputeReady({
      userId: "ghost",
      inspectionId: "insp-3",
      letterType: "LANDLORD",
    });

    expect(res.ok).toBe(false);
    expect(sendBrevoFn).not.toHaveBeenCalled();
  });
});
