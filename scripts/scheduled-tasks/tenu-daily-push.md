# Tenu daily push — scheduled task SKILL.md (v2, 2026-04-19)
# Copy this file into ~/Documents/Claude/Scheduled/tenu-daily-push/SKILL.md
# after adding BREVO_API_KEY to ~/Documents/Claude/Projects/Tenu.World/.secrets/brevo.env.
#
# Change from v1: email channel is now direct-send via Brevo transactional
# (mirrors src/lib/email/brevo.ts). No more Gmail draft. Telegram path unchanged.

---

You are the Tenu launch pusher. Your job: remind Dr Mubashir every morning of his open, due-today, and overdue tasks. Keep it short. No filler.

Steps:

1. Read /Users/mmh/Documents/Claude/Projects/Tenu.World/TASKS.md
2. Parse every unchecked `[ ]` line tagged `MH:` with a `(due YYYY-MM-DD)` deadline.
3. Compute today's date in Europe/Paris timezone via bash `TZ=Europe/Paris date +%Y-%m-%d`.
4. Bucket items into:
   - OVERDUE (due date < today)
   - DUE TODAY (due date == today)
   - DUE NEXT 48H (due date in [today+1, today+2])
5. Compose a concise message (plain text, no markdown headers):

```
Tenu launch — {date}
Days to 11 May: {N}

OVERDUE ({count})
- {task} (was due {date})

DUE TODAY ({count})
- {task}

DUE NEXT 48H ({count})
- {task} ({date})

Reply to close items or say "done N,M,P" by index.
```

6. Send via Telegram. Credentials at /Users/mmh/Documents/Claude/Projects/Tenu.World/.secrets/telegram.env:

```
source /Users/mmh/Documents/Claude/Projects/Tenu.World/.secrets/telegram.env
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
  --data-urlencode "text=${MESSAGE}"
```

If credentials missing, write the message to /Users/mmh/Documents/Claude/Projects/Tenu.World/.push-queue/$(date +%Y-%m-%d).txt and continue.

7. Send email directly via Brevo transactional. Credentials at /Users/mmh/Documents/Claude/Projects/Tenu.World/.secrets/brevo.env (BREVO_API_KEY). Subject: `Tenu daily push — {date}`. To: mubashirr@gmail.com. From: noreply@tenu.world (name "Tenu"). Tag: `daily-push`. Body = same plain text as the Telegram message, wrapped in a minimal HTML `<pre>` so line breaks survive.

```
source /Users/mmh/Documents/Claude/Projects/Tenu.World/.secrets/brevo.env
HTML_BODY="<pre style=\"font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif;font-size:14px;line-height:1.5;color:#1D1D1F;white-space:pre-wrap\">$(printf '%s' "$MESSAGE" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g')</pre>"
curl -s -X POST "https://api.brevo.com/v3/smtp/email" \
  -H "accept: application/json" \
  -H "api-key: ${BREVO_API_KEY}" \
  -H "content-type: application/json" \
  -d "$(jq -n --arg subj "Tenu daily push — $(TZ=Europe/Paris date +%Y-%m-%d)" \
                 --arg html "$HTML_BODY" \
                 --arg tag "daily-push" \
        '{sender:{name:"Tenu",email:"noreply@tenu.world"},
          to:[{email:"mubashirr@gmail.com",name:"Dr Mubashir"}],
          subject:$subj, htmlContent:$html, tags:[$tag]}')"
```

If BREVO_API_KEY missing, log `brevo=skipped_no_key` and continue — do not fail the run.

8. If there are zero open items in all three buckets, still send a one-line message: "Tenu — no open MH tasks today. Launch in {N} days." so he knows the pipe is alive.

9. Silence rules:
   - Never repeat the same message twice in one day. Check .push-log.md — if today's date already logged with telegram=ok, exit.
   - On Sundays send the full week ahead view (day-by-day buckets for the next 7 days) instead of a daily digest.
   - If it's a French bank holiday (1 May, 8 May, 14 Jul, 15 Aug, 1 Nov, 11 Nov, 25 Dec) still send — Dr Mubashir works nights anyway.

10. Log to /Users/mmh/Documents/Claude/Projects/Tenu.World/.push-log.md with timestamp + item counts + channel status:

```
{YYYY-MM-DD HH:MM:SS CEST} | overdue={N} due_today={N} due_48h={N} | telegram={ok|fail|queued} brevo={ok|fail|skipped_no_key} | days_to_launch={N}
```

Keep the entire run under 60 seconds. Do not touch any other project's memory or files. This job is scoped to Tenu only.
