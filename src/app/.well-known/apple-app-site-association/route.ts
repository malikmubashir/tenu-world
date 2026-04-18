import { NextResponse } from "next/server";

// Force static: this manifest is fetched by Apple's CDN, not the user
// agent, and never varies per-request. `output: 'export'` (MOBILE_BUILD=1)
// silently drops dynamic route handlers, so `force-static` keeps it in
// the export even though we return from a route file.
export const dynamic = "force-static";

// TODO(MH): after Apple Developer enrolment, replace TEAMID with the
// 10-character Team ID from developer.apple.com → Membership. Format
// is <TEAMID>.<BUNDLE_ID>. The Apple CDN fetches this file every time
// an app with a matching Associated Domains entitlement is installed,
// so a wrong TeamID means Universal Links silently fail.
const APP_ID = "TEAMID.world.tenu.app";

const PAYLOAD = {
  applinks: {
    details: [
      {
        appIDs: [APP_ID],
        components: [
          { "/": "/auth/callback*", comment: "Magic-link email callback" },
          { "/": "/app-home/*", comment: "Deep-link into app home" },
          { "/": "/inspection/*", comment: "Deep-link into a specific inspection" },
          { "/": "/report/*", comment: "Deep-link into a report view" },
          { "/": "/dispute/*", comment: "Deep-link into a dispute flow" },
        ],
      },
    ],
  },
  // Shared-web-credentials — lets Safari save magic-link passwords to
  // the same app identity. Harmless if unused.
  webcredentials: {
    apps: [APP_ID],
  },
};

export function GET() {
  return NextResponse.json(PAYLOAD, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
