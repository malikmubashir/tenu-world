# Tenu — Week 1 Build Guide

**Period:** 2026-04-03 to 2026-04-10  
**Goal:** tenu.world live on Webflow, Cloudflare R2 set up, Stripe ready, Brevo configured, waitlist validated

---

## Day 1 (Thursday 3 April) — Validation + Webflow start

### Task 1 — Waitlist post (30 min) ⚠️ DO THIS FIRST
Post in Chinese student community before building anything else.

**Where:** Largest Chinese student Facebook group in France or WeChat group  
**Message (Chinese):**
"我们正在开发一款工具，帮助在法国和英国的国际学生了解他们的租房权利和保护押金。完全支持中文。留下您的邮箱，率先免费体验并享受特别优惠。"

**Where to post (English):**
- Reddit r/france: "Built a multilingual tool for international tenants in France — deposit risk check + dispute support. Testing demand. LOCATAIRE25 for 40% off at launch."

**Decision:** If 20+ signups in 48h → proceed. If not → reposition messaging before continuing.

### Task 2 — Webflow account + domain connection (45 min)
1. Go to webflow.com → create account with Global Apex email
2. New site → Blank site → name it "Tenu"
3. Site Settings → Publishing → Custom Domains → Add: `tenu.world`
4. Copy the two DNS records Webflow provides (A record + CNAME)
5. Go to Namecheap → tenu.world → Manage → Advanced DNS
6. Add the A record and CNAME exactly as shown
7. Delete any pre-existing A records from Namecheap
8. Back in Webflow → click Verify (wait 5–30 min for propagation)

**DNS records to add:**
- Type: A | Host: @ | Value: 75.2.70.75
- Type: CNAME | Host: www | Value: proxy-ssl.webflow.com

---

## Day 2 (Friday 4 April) — Landing page build

### Task 3 — Build EN landing page (2–3 hours)

**Page structure:**
1. **Nav:** Logo (Tenu) | EN / FR / AR switcher | CTA button
2. **Hero:** "Your deposit. Your rights. Your language." + subheadline + Start CTA
3. **How it works:** 3-step icons (Document / Analyse / Protect)
4. **Pricing:** Simple card — €15 launch / €35 with dispute
5. **Trust:** GDPR badge + "EU servers" + "Not legal advice" note
6. **Footer:** Privacy policy link | Contact: hello@tenu.world

**Hero copy (EN):**
- H1: Your deposit. Your rights. Your language.
- Sub: Tenu helps international tenants in France and the UK document their home, understand their rights, and challenge unfair deposit deductions — in their own language.
- CTA: Start my inspection →

**Add language detection script** to Site Settings → Custom Code → Head:
```html
<script>
(function(){
  var lang = navigator.language || 'en';
  var path = window.location.pathname;
  if(path === '/' || path === '') {
    var map = {'fr':'fr','ar':'ar','zh':'zh','ja':'ja','hi':'hi','ur':'ur','es':'es','it':'it','uk':'uk'};
    var code = lang.split('-')[0].toLowerCase();
    if(map[code]) window.location.replace('/'+map[code]);
  }
})();
</script>
```

### Task 4 — Duplicate for FR and AR versions (1 hour)
- Duplicate EN page → rename to /fr → translate all copy (copy from 06-Marketing-GTM/02-Landing-Page-Copy.md)
- Duplicate EN page → rename to /ar → translate + add dir="rtl" in Page Settings → Custom Attributes → dir = rtl

---

## Day 3 (Saturday 5 April) — Cloudflare R2 + Stripe

### Task 5 — Cloudflare R2 setup (30 min)
1. cloudflare.com → create free account
2. Left sidebar → R2 Object Storage → Create bucket
3. Name: `tenu-photos-eu`
4. Location: **Europe (EU)** — this is mandatory for GDPR
5. Settings → Public access → **OFF** (never enable)
6. Settings → Enable CORS for Make.com domain
7. Profile → API Tokens → Create Token → R2 edit permissions
8. Save: Account ID, Access Key ID, Secret Access Key (you will need these in Week 3 for Make.com)

### Task 6 — Stripe setup (45 min)
1. stripe.com → create account → business name: Global Apex / Tenu
2. Settings → Business details → Primary currency: EUR
3. Products → Add product: "Tenu Inspection Report" → €15 one-time
4. Payment Links → Create from product → Enable discount codes
5. Add metadata fields: `language`, `jurisdiction`, `rooms`, `dispute`
6. Promotions → Coupons → Create all 6 codes:
   - STUDENT25: 40% off, expires 60 days from today
   - UMMAH25: 40% off, expires 60 days from today
   - LOCATAIRE25: 40% off, expires 30 days from today
   - MOVE2025: 40% off, no expiry
   - LAUNCH25: 40% off, expires 30 days from today
   - EXPAT25: 40% off, expires 60 days from today
7. Developers → Webhooks → Add endpoint (placeholder URL for now, update in Week 3):
   - Event: `payment_intent.succeeded`

---

## Day 4 (Sunday 6 April) — Brevo email setup

### Task 7 — Brevo configuration (1 hour)
1. brevo.com → create free account
2. Settings → Senders & IP → Domains → Add: `tenu.world`
3. Copy DNS records Brevo provides → add to Namecheap Advanced DNS
4. Verify domain (24h propagation)
5. Create email templates (copy from below):

**Template 1 — Report delivered (EN)**
- Subject: Your Tenu inspection report is ready
- From: reports@tenu.world
- Body: "Hi {{FIRSTNAME}}, your inspection report for {{ADDRESS}} is attached. Review each room's risk score and take recommended actions before your landlord's inspection. If you purchased dispute support, your dispute letter is included on the final pages. — The Tenu team"

**Template 2 — Report delivered (FR)**
- Subject: Votre rapport d'inspection Tenu est prêt
- Body: "Bonjour {{FIRSTNAME}}, votre rapport d'inspection pour {{ADDRESS}} est joint. Consultez le score de risque de chaque pièce et prenez les mesures recommandées. Si vous avez souscrit au soutien litige, votre courrier figure aux dernières pages. — L'équipe Tenu"

**Template 3 — 14-day outcome survey (EN)**
- Subject: Did you get your deposit back?
- Body: "Hi {{FIRSTNAME}}, it's been two weeks since you used Tenu. We'd love to know: did you recover your deposit? {{SURVEY_LINK}} — takes 30 seconds."

---

## Day 5–6 (Mon–Tue 7–8 April) — Review + legal search

### Task 8 — Check waitlist results
- Count signups from Day 1 posts
- If 20+ → confirm you proceed to Week 2
- If under 20 → adjust messaging, try one more channel

### Task 9 — Find FR avocat
- Search: Barreau de Paris → Find a Lawyer → Droit immobilier / Droit locatif
- Or: ask in network (HEC GEMM colleagues, Global Apex clients)
- Send enquiry email: "Je cherche un avocat spécialisé en droit locatif pour un avis juridique sur un outil numérique d'aide aux locataires. Budget €500–1,000 pour une revue de 2 heures."
- Book appointment for Week 2

### Task 10 — Find UK solicitor
- Search: Law Society "Find a Solicitor" → Housing law → London or Manchester
- Send email: "I am building a tenant rights tool and need a legal opinion on whether our AI-generated dispute letters constitute reserved legal activity under the Legal Services Act 2007. Budget £400–800 for a 1-hour consultation."
- Book appointment for Week 2

---

## Day 7 (Wednesday 9 April) — Week 1 review

### Check all done:
- [ ] tenu.world live on Webflow with EN, FR, AR pages
- [ ] Language detection script live
- [ ] Cloudflare R2 bucket created (EU region, private)
- [ ] Stripe account live with all 6 discount codes
- [ ] Brevo account live, domain verified, 3 templates created
- [ ] Waitlist test done and results recorded
- [ ] FR avocat appointment booked
- [ ] UK solicitor appointment booked

### Record and decide:
- How many waitlist signups? → Document in Airtable
- What feedback did you get from posts? → Document
- Any concerns about Week 2 scope? → Document

---

*Week 2 starts: 2026-04-10 — Tally form + Claude prompts*
