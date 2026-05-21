#!/usr/bin/env python3
"""
Tenu task tracker dashboard builder.
Reads TASKS.md, emits self-contained HTML with task numbers, charts, and full task text.
Run: python3 scripts/dashboard-build.py
Output: dashboard.html (canonical) + dashboard-YYYY-MM-DD.html (dated snapshot)
"""
import re, html, datetime, pathlib, sys

REPO = pathlib.Path(__file__).resolve().parent.parent
TASKS_MD = REPO / 'TASKS.md'
TODAY = datetime.date.today().isoformat()
LAUNCH = '2026-07-15'

def parse():
    raw = TASKS_MD.read_text()
    section = "Unsectioned"
    items = []
    for line in raw.splitlines():
        if line.startswith('## ') or line.startswith('### '):
            section = line.lstrip('#').strip(); continue
        m = re.match(r'^\- \[( |>|x|\-)\] ((?:MH|CC)(?: \(nights\))?): (.+)$', line)
        if not m: continue
        status_ch, owner, body = m.groups()
        status = {' ':'open','>':'in_progress','x':'done','-':'dropped'}[status_ch]
        if status in ('done','dropped'): continue
        pm = re.search(r'\(p:(\d)[^)]*\)', body)
        dm = re.search(r'due\s*(\d{4}-\d{2}-\d{2})', body)
        prio = pm.group(1) if pm else '1'
        due = dm.group(1) if dm else ''
        parts = body.split(' — ', 1)
        title_with_meta = parts[0]
        note = parts[1] if len(parts) == 2 else ''
        title = re.sub(r'\s*\([^)]*(?:p:\d|due\s*\d{4})[^)]*\)\s*', ' ', title_with_meta).strip()
        items.append({'section':section,'owner':owner,'title':title,'priority':prio,
                      'due':due,'status':status,'note':note,'file_order':len(items)+1})
    return items

def esc(s): return html.escape(s or '')

def render(items):
    # Assign #N by file order, then sort for display
    by_prio = {'0':[],'1':[],'2':[]}
    for it in items: by_prio[it['priority']].append(it)
    for k in by_prio:
        by_prio[k].sort(key=lambda it:(it['due'] or '9999-99-99', it['owner']))

    def due_class(d):
        if not d: return ''
        if d < TODAY: return 'overdue'
        if d == TODAY: return 'today'
        return ''

    def render_item(it):
        cls = it['status']
        due_html = f'<span class="due {due_class(it["due"])}">{esc(it["due"]) or "—"}</span>'
        sec = esc(it['section'][:60])
        note_html = f'<div class="note">{esc(it["note"])}</div>' if it['note'] else ''
        badge = '<span class="badge">IN PROGRESS</span>' if it['status']=='in_progress' else ''
        owner_class = 'who-mh' if it['owner'].startswith('MH') else 'who-cc'
        return f'''
        <article class="item {cls}" id="task-{it['file_order']:03d}">
          <header>
            <span class="id">#{it['file_order']:03d}</span>
            <span class="who {owner_class}">{esc(it['owner'])}</span>
            <span class="prio p{it['priority']}">P{it['priority']}</span>
            {due_html}
            <span class="sec">{sec}</span>
            {badge}
          </header>
          <p class="title">{esc(it['title'])}</p>
          {note_html}
        </article>'''

    def render_block(prio_key, label, color):
        body = ''.join(render_item(it) for it in by_prio[prio_key])
        return f'''
        <section class="block block-p{prio_key}">
          <h2><span class="dot" style="background:{color}"></span>{label} <span class="count">({len(by_prio[prio_key])})</span></h2>
          <div class="items">{body}</div>
        </section>'''

    overdue = sum(1 for it in items if it['due'] and it['due'] < TODAY)
    in_prog = sum(1 for it in items if it['status']=='in_progress')
    mh = sum(1 for it in items if it['owner'].startswith('MH'))
    cc = sum(1 for it in items if it['owner'].startswith('CC'))
    days_to_launch = (datetime.date.fromisoformat(LAUNCH) - datetime.date.today()).days

    return f'''<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>tenu — task tracker · {TODAY}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<style>
  :root{{--paper:#F4F1EA;--ink:#1D1D1F;--navy:#0B1F3A;--emerald:#059669;--rule:#E5E0D5;--muted:#6B6B70;--amber:#B45309;--crimson:#B91C1C;--soft:#FAF8F2;--chip:#EFEAD9}}
  *{{box-sizing:border-box}}
  html,body{{margin:0;background:var(--paper);color:var(--ink);font:14px/1.55 Inter,system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased}}
  body{{padding:24px 28px 96px}}
  .wrap{{max-width:1240px;margin:0 auto}}
  header.top{{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1px solid var(--rule);padding-bottom:18px;margin-bottom:20px}}
  h1{{font:500 28px/1.1 'Inter Tight',Inter,sans-serif;letter-spacing:-0.04em;margin:0;color:var(--navy)}}
  h1 .tag{{color:var(--emerald)}}
  h2{{font:500 18px/1.2 'Inter Tight',Inter,sans-serif;letter-spacing:-0.02em;margin:0 0 12px;color:var(--navy);display:flex;align-items:center;gap:10px}}
  h2 .dot{{width:10px;height:10px;border-radius:3px;display:inline-block}}
  h2 .count{{color:var(--muted);font-weight:400;font-size:15px}}
  .meta{{text-align:right;font-size:13px;color:var(--muted)}}
  .meta b{{color:var(--ink);font-weight:500}}
  .kpi{{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:20px}}
  .stat{{background:#fff;border:1px solid var(--rule);border-radius:8px;padding:14px 16px}}
  .stat .n{{font:500 28px/1 'Inter Tight',sans-serif;color:var(--navy);letter-spacing:-0.03em}}
  .stat .lbl{{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.07em;margin-top:4px}}
  .stat.bad .n{{color:var(--crimson)}} .stat.warn .n{{color:var(--amber)}} .stat.good .n{{color:var(--emerald)}}
  .alert{{background:#FFF7ED;border:1px solid #FED7AA;color:#7C2D12;border-radius:8px;padding:13px 16px;margin-bottom:18px;font-size:13.5px}}
  .crit{{background:#FEF2F2;border:1px solid #FECACA;color:#7F1D1D;border-radius:8px;padding:13px 16px;margin-bottom:18px;font-size:13.5px}}
  .charts{{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:24px}}
  .card{{background:#fff;border:1px solid var(--rule);border-radius:8px;padding:18px}}
  canvas{{max-height:220px}}
  .block{{margin-bottom:32px}}
  .block-p0 h2 .count{{color:var(--crimson)}}
  .items{{display:grid;grid-template-columns:1fr;gap:8px}}
  .item{{background:#fff;border:1px solid var(--rule);border-left:3px solid var(--rule);border-radius:6px;padding:10px 14px;scroll-margin-top:80px}}
  .item.in_progress{{border-left-color:var(--amber);background:#FFFBEB}}
  .block-p0 .item{{border-left-color:#FCA5A5}}
  .block-p0 .item.in_progress{{border-left-color:var(--amber)}}
  .block-p1 .item{{border-left-color:#FCD34D}}
  .block-p2 .item{{border-left-color:#93C5FD}}
  .item header{{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:5px;font-size:12px;border:none;padding:0}}
  .id{{font:500 12px ui-monospace,SFMono-Regular,Menlo,monospace;background:var(--navy);color:#fff;padding:2px 8px;border-radius:4px;letter-spacing:0.04em}}
  .who{{padding:2px 8px;border-radius:4px;background:var(--chip);color:var(--navy);font-weight:500;letter-spacing:0.04em;font-size:11px}}
  .who-mh{{background:#E0E7FF;color:#3730A3}}
  .who-cc{{background:#D1FAE5;color:#065F46}}
  .prio{{padding:2px 7px;border-radius:99px;font-size:10.5px;letter-spacing:0.04em;font-weight:500}}
  .prio.p0{{background:#FEE2E2;color:#991B1B}}
  .prio.p1{{background:#FEF3C7;color:#92400E}}
  .prio.p2{{background:#DBEAFE;color:#1E40AF}}
  .due{{font-variant-numeric:tabular-nums;color:var(--muted);font-size:12px}}
  .due.overdue{{color:var(--crimson);font-weight:500}}
  .due.today{{color:var(--amber);font-weight:500}}
  .sec{{color:var(--muted);font-size:11px;margin-left:auto;font-style:italic}}
  .badge{{background:var(--amber);color:#fff;font-size:10px;padding:1px 6px;border-radius:3px;letter-spacing:0.05em}}
  .item .title{{margin:4px 0 0;font-size:14px;color:var(--ink);line-height:1.5}}
  .item .note{{margin-top:6px;font-size:12.5px;color:var(--muted);line-height:1.5;padding-top:6px;border-top:1px dashed var(--rule);font-style:italic;white-space:pre-wrap}}
  .phase-strip{{display:grid;grid-template-columns:repeat(8,1fr);gap:6px;margin-bottom:20px}}
  .ph{{background:#fff;border:1px solid var(--rule);border-radius:6px;padding:10px;font-size:11px;text-align:center}}
  .ph .nm{{font-weight:500;color:var(--navy);font-size:12px}}
  .ph .dt{{color:var(--muted);margin-top:3px;font-variant-numeric:tabular-nums}}
  .ph.active{{background:#ECFDF5;border-color:#A7F3D0}}
  .ph.todo{{opacity:.6}}
  .ph.partial{{background:#FFF7ED;border-color:#FED7AA}}
  .toc{{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0;padding:12px;background:#fff;border:1px solid var(--rule);border-radius:8px;font-size:11.5px}}
  .toc a{{color:var(--navy);text-decoration:none;font:500 11px ui-monospace,SFMono-Regular,Menlo,monospace;padding:3px 7px;border:1px solid var(--rule);border-radius:4px;background:var(--soft)}}
  .toc a:hover{{background:var(--emerald);color:#fff;border-color:var(--emerald)}}
  footer{{margin-top:32px;padding-top:16px;border-top:1px solid var(--rule);font-size:12px;color:var(--muted);display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px}}
  code{{font:12.5px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;background:var(--soft);padding:1px 5px;border-radius:3px}}
</style></head><body><div class="wrap">

<header class="top">
  <div>
    <h1>tenu <span class="tag">·</span> task tracker</h1>
    <div style="font-size:13px;color:var(--muted);margin-top:6px">SSOT view. Every open task numbered, in full, grouped by priority. Refer to tasks by #ID.</div>
  </div>
  <div class="meta">
    <div><b>{datetime.date.today().strftime('%A %d %B %Y')}</b></div>
    <div>Public launch <b>{LAUNCH}</b> · T<b>-{days_to_launch} days</b></div>
    <div>Regenerated <code>{TODAY}</code> · source <code>TASKS.md</code></div>
  </div>
</header>

<div class="crit">
  <b>Critical path · Phase 1B starts today:</b> dispute-letter avocat brief still not sent. FR opinion window 31 May to 7 Jun. The brief must go this week or the window slips.
</div>

<div class="alert">
  <b>Data note:</b> Line-level due dates re-baselined 2026-05-21 against the six-phase plan. 1A RGPD 18-31 May, 1B legal 21 May - 13 Jun, Phase 2 tech 21 May - 6 Jun, Phase 4 paid funnel 15-22 Jun, Phase 5 native 29 Jun - 13 Jul. Public launch target 15 Jul.
</div>

<div class="kpi">
  <div class="stat"><div class="n">{len(items)}</div><div class="lbl">Total open</div></div>
  <div class="stat bad"><div class="n">{len(by_prio['0'])}</div><div class="lbl">P0 · blocks launch</div></div>
  <div class="stat warn"><div class="n">{len(by_prio['1'])}</div><div class="lbl">P1 · important</div></div>
  <div class="stat"><div class="n">{len(by_prio['2'])}</div><div class="lbl">P2 · post-launch</div></div>
  <div class="stat bad"><div class="n">{overdue}</div><div class="lbl">Overdue vs today</div></div>
</div>

<div class="phase-strip">
  <div class="ph partial"><div class="nm">Phase 0</div><div class="dt">18-20 May<br>reconcile</div></div>
  <div class="ph active"><div class="nm">Phase 1A</div><div class="dt">18-31 May<br>RGPD</div></div>
  <div class="ph active"><div class="nm">Phase 1B</div><div class="dt">21 May - 13 Jun<br>legal letter</div></div>
  <div class="ph active"><div class="nm">Phase 2</div><div class="dt">21 May - 6 Jun<br>tech</div></div>
  <div class="ph todo"><div class="nm">Phase 3</div><div class="dt">8-12 Jun<br>PMF waitlist</div></div>
  <div class="ph todo"><div class="nm">Phase 4</div><div class="dt">15-22 Jun<br>paid funnel</div></div>
  <div class="ph todo"><div class="nm">Phase 5</div><div class="dt">29 Jun - 13 Jul<br>native</div></div>
  <div class="ph todo"><div class="nm">Phase 6</div><div class="dt">15 Jul+<br>public</div></div>
</div>

<div class="charts">
  <div class="card"><h2>Priority mix</h2><canvas id="c1"></canvas></div>
  <div class="card"><h2>Owner split</h2><canvas id="c2"></canvas></div>
</div>

<div class="toc"><b style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.07em;padding-right:8px;align-self:center">Quick jump:</b>
{''.join(f'<a href="#task-{it["file_order"]:03d}" title="{esc(it["title"][:80])}">#{it["file_order"]:03d}</a>' for it in sorted(items, key=lambda x: x['file_order']))}
</div>

{render_block('0','P0 — blocks launch','#EF4444')}
{render_block('1','P1 — important','#F59E0B')}
{render_block('2','P2 — post-launch','#3B82F6')}

<footer>
  <div>Regenerated by <code>scripts/dashboard-build.py</code> · self-contained · Chart.js 4.4.1 via CDN</div>
  <div>{len(items)} tasks · {overdue} overdue · {in_prog} in progress · IDs stable while TASKS.md order is preserved</div>
</footer>

</div><script>
new Chart(document.getElementById('c1'),{{type:'bar',data:{{labels:['P0','P1','P2'],datasets:[{{data:[{len(by_prio['0'])},{len(by_prio['1'])},{len(by_prio['2'])}],backgroundColor:['#FCA5A5','#FCD34D','#93C5FD'],borderColor:['#B91C1C','#B45309','#1E40AF'],borderWidth:1,borderRadius:4}}]}},options:{{indexAxis:'y',plugins:{{legend:{{display:false}}}},scales:{{x:{{beginAtZero:true,grid:{{color:'#E5E0D5'}}}},y:{{grid:{{display:false}}}}}}}}}});
new Chart(document.getElementById('c2'),{{type:'doughnut',data:{{labels:['MH (Dr Mubashir)','CC (Claude)'],datasets:[{{data:[{mh},{cc}],backgroundColor:['#3730A3','#065F46'],borderColor:'#fff',borderWidth:2}}]}},options:{{plugins:{{legend:{{position:'bottom'}}}},cutout:'62%'}}}});
</script></body></html>'''

if __name__ == '__main__':
    items = parse()
    out = render(items)
    (REPO / 'dashboard.html').write_text(out)
    (REPO / f'dashboard-{TODAY}.html').write_text(out)
    print(f"Built dashboard.html + dashboard-{TODAY}.html · {len(items)} tasks", file=sys.stderr)
