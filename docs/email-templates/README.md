# Email templates

Seven templates. All stacked multilingual (FR → EN → ZH → AR in one file)
because at sign-in time we don't yet know the user's native language, and
Supabase only allows one template per auth event. One email, four languages,
reader picks the block that speaks to them.

Palette matches the live tenu.world site: Apple ink `#1D1D1F`, band `#EEEEF1`,
canvas `#FFFFFF`, hairline `#D2D2D7`, emerald CTA `#059669`, navy chrome
`#0B1F3A`, muted `#6E6E73`. Table layout, inline styles, 560 px max width,
system-font stack (SF Arabic / PingFang SC / Geeza Pro / Segoe UI / Arial).

## Supabase auth templates (six)

Paste each into **Supabase Dashboard → Authentication → Emails**, matching
the template name to the slot.

| File | Supabase slot | Supabase var | Expiry |
|------|--------------|--------------|--------|
| `supabase-confirm-signup.html` | Confirm signup | `{{ .TokenHash }}` + `{{ .Type }}` | 1 h |
| `supabase-invite.html` | Invite user | `{{ .TokenHash }}` + `{{ .Type }}` | 24 h |
| `supabase-magic-link.html` | Magic Link | `{{ .TokenHash }}` + `{{ .Type }}` | 1 h, single use |
| `supabase-change-email.html` | Change email address | `{{ .TokenHash }}` + `{{ .Type }}` | 1 h |
| `supabase-reset-password.html` | Reset password | `{{ .TokenHash }}` + `{{ .Type }}` | 1 h |
| `supabase-reauthentication.html` | Reauthentication | `{{ .Token }}` (6-digit OTP) | 10 min |

**URL pattern** for all click-through templates:

```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type={{ .Type }}
```

This replaces the legacy `{{ .ConfirmationURL }}` which broke across browsers
(PKCE verifier mismatch when the user opens the link in a different browser
from the one that requested it). Matches the `verifyOtp` call in
`src/app/auth/callback/route.ts`. Closes task #48.

Reauthentication is the exception: it surfaces `{{ .Token }}` as a 6-digit
code because Supabase expects the user to type the code back into the calling
app, not click a URL.

**Subjects** (set these in the Supabase template form):
- Confirm signup: `Tenu · confirmez votre email / confirm your email / 确认邮箱 / أكّد بريدك`
- Invite: `Tenu · invitation / 邀请 / دعوة`
- Magic link: `Tenu · lien de connexion / sign-in link / 登录链接 / رابط تسجيل الدخول`
- Change email: `Tenu · nouvelle adresse / new email / 新邮箱 / بريد جديد`
- Reset password: `Tenu · mot de passe / reset password / 重置密码 / كلمة المرور`
- Reauthentication: `Tenu · code de vérification / verification code / 验证码 / رمز التحقق`

## Brevo welcome (one)

`brevo-welcome.html` — not a Supabase auth email. Transactional through Brevo,
fired server-side from `/auth/callback` the first time a `profiles` row is
INSERTed for a user.

**Where to paste:** Brevo dashboard → Transactional → Templates → New. Save
once, note the single template ID.

**Params:**
- `params.first_name` — optional, falls back to empty
- `params.start_url` — optional, defaults to `https://tenu.world/inspect/new`

**Wiring** (to do, in `src/app/auth/callback/route.ts`):

```ts
if (isFirstLogin) {
  await brevo.sendTransacEmail({
    to: [{ email: user.email }],
    templateId: Number(process.env.BREVO_TEMPLATE_WELCOME!),
    params: {
      first_name: profile.full_name?.split(" ")[0] ?? "",
      start_url: `${SITE_URL}/inspect/new`,
    },
  });
}
```

Single env var now: `BREVO_TEMPLATE_WELCOME`. The previous per-locale IDs
(`BREVO_TEMPLATE_WELCOME_FR` / `_EN`) collapse into one.

## Stacked-template design

Each block inside a file is identical in structure:
1. Locale label (`Français`, `English`, `简体中文`, `العربية`) — small, muted
2. Headline — 20 px, 600 weight
3. One-line instruction — 15 px body
4. CTA button — emerald pill, one label per language (or the code block for reauth)
5. One-line expiry / security caveat — 13 px muted

Blocks are separated by 1-px hairlines. The AR block carries `dir="rtl"` scoped
to its cell, with flipped alignment and an Arabic-tuned line-height. The outer
email stays LTR so Outlook desktop doesn't mirror the whole layout.

The reauthentication template lifts the OTP code to the top — one shared code
serves all four languages, so there's no reason to repeat it per block.

## Rendering notes

- `<table>` layout for Outlook, inline styles throughout (Gmail clipping
  aside).
- Wordmark is type-only — no web font. Falls back to SF Pro → Segoe UI → Arial.
- Disc mark served from `https://tenu.world/apple-icon` (180 × 180 PNG via
  Next's icon route). Gmail image proxy handles it.
- Button CTAs use `bgcolor` + inline `background` + `border-radius: 9999px` on
  the `<td>` so Outlook renders a rounded pill rather than a square.

## Testing

1. **Supabase templates** — in each dashboard slot, click "Send test email",
   then request the real flow (signup, magic link, etc.) and inspect in Gmail,
   Apple Mail, Outlook web.
2. **Brevo welcome** — "Send test email" in the Brevo template editor, then
   trigger a real first-signup from staging.
3. **Plain-text fallback** — Supabase auto-generates one. Brevo does not; add
   a plain-text version under "Text version" once the HTML is approved. A
   four-language plain-text version is acceptable; separate each block with
   `---`.
4. **Arabic RTL sanity** — check AR block on iOS Mail (SF Arabic), Gmail Web
   (Segoe UI fallback), and at least one Android client. Confirm the CTA
   button sits right-aligned inside its block while the envelope stays LTR.
5. **Native-speaker review** — ZH and AR copy was drafted without a native
   reviewer. Have both checked before 11 May.
