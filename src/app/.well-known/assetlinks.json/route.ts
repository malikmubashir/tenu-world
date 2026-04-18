import { NextResponse } from "next/server";

export const dynamic = "force-static";

// TODO(MH): after keystore generation on the Mac, replace the
// placeholder fingerprint with the SHA-256 of the release signing
// certificate. Get it via:
//   keytool -list -v -keystore ~/tenu-release.keystore -alias tenu | grep SHA256
// Then paste the upper-case colon-separated string below. Play Services
// downloads this file on install and refuses to verify App Links if the
// fingerprint doesn't match — the result is users getting a "Open with"
// chooser every time they tap a tenu.world link.
const RELEASE_SHA256 = "REPLACE_WITH_SHA256_FROM_KEYSTORE";

// Optional: Google's Play App Signing gives the store a second
// fingerprint (the upload certificate, separate from your local
// release certificate). Add it to the same array when present.
const PAYLOAD = [
  {
    relation: [
      "delegate_permission/common.handle_all_urls",
      "delegate_permission/common.get_login_creds",
    ],
    target: {
      namespace: "android_app",
      package_name: "world.tenu.app",
      sha256_cert_fingerprints: [RELEASE_SHA256],
    },
  },
];

export function GET() {
  return NextResponse.json(PAYLOAD, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
