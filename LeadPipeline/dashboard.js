/**
 * NAVADA Lead Pipeline — Web Dashboard + WebSocket + JSON API
 * Real-time updates, mobile-first, NAVADA-branded
 * Port 3100 — locked, always running via PM2
 */

const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const pg = require('./pg');
const app = express();
const server = http.createServer(app);
const PORT = 3100;

// ─── WEBSOCKET ────────────────────────────────────────────────
const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
  ws.on('error', () => clients.delete(ws));
  // Send initial data immediately
  sendFullState(ws);
});

async function sendFullState(ws) {
  try {
    const [stats, leads, tasks, events] = await Promise.all([
      pg.getStats(), pg.getLeads(), pg.getTasks(), pg.getEvents(null, 20),
    ]);
    const payload = JSON.stringify({ type: 'full_state', data: { stats, leads, tasks, events }, ts: Date.now() });
    if (ws.readyState === 1) ws.send(payload);
  } catch (e) { /* ignore */ }
}

function broadcast(type, data) {
  const msg = JSON.stringify({ type, data, ts: Date.now() });
  for (const ws of clients) {
    if (ws.readyState === 1) ws.send(msg);
  }
}

// Push updates every 5 seconds
setInterval(async () => {
  if (clients.size === 0) return;
  try {
    const [stats, leads, tasks, events] = await Promise.all([
      pg.getStats(), pg.getLeads(), pg.getTasks(), pg.getEvents(null, 20),
    ]);
    broadcast('full_state', { stats, leads, tasks, events });
  } catch (e) { /* ignore */ }
}, 5000);

// ─── HELPERS ──────────────────────────────────────────────────
const STATUS_COLORS = {
  new: '#3498DB', researching: '#9B59B6', outreach_drafted: '#F39C12',
  outreach_sent: '#E67E22', responded: '#2ECC71', meeting_scheduled: '#27AE60',
  proposal_sent: '#1ABC9C', negotiating: '#16A085', won: '#2ECC71',
  lost: '#E74C3C', nurturing: '#95A5A6', archived: '#7F8C8D',
};

function timeSince(d) {
  if (!d) return '\u2014';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.floor(hrs / 24) + 'd ago';
}

// ─── JSON API (for Vercel frontend) ───────────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/api/state', async (req, res) => {
  try {
    const [stats, leads, tasks, events] = await Promise.all([
      pg.getStats(), pg.getLeads(), pg.getTasks(), pg.getEvents(null, 30),
    ]);
    res.json({ stats, leads, tasks, events, ts: Date.now() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/leads', async (req, res) => {
  try { res.json(await pg.getLeads()); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/lead/:id', async (req, res) => {
  try {
    const lead = await pg.getLeadById(parseInt(req.params.id));
    const events = await pg.getEvents(lead.id, 50);
    res.json({ lead, events });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/tasks', async (req, res) => {
  try { res.json(await pg.getTasks(req.query.status || 'pending')); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/events', async (req, res) => {
  try { res.json(await pg.getEvents(null, parseInt(req.query.limit) || 100)); } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── FULL SPA (single page, WebSocket-driven) ─────────────────
app.get('/{*path}', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NAVADA Lead Pipeline</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;background:#fff;color:#333;-webkit-font-smoothing:antialiased}
  a{color:#111;text-decoration:none;cursor:pointer}a:hover{text-decoration:underline}
  .header{background:#000;padding:20px 28px;display:flex;justify-content:space-between;align-items:center}
  .header h1{font-size:20px;font-weight:800;color:#fff;letter-spacing:.15em}
  .header p{font-size:10px;color:#999;letter-spacing:.08em;text-transform:uppercase;margin-top:3px}
  .live{display:flex;align-items:center;gap:6px;font-size:11px;color:#2ECC71}
  .live .dot{width:8px;height:8px;border-radius:50%;background:#2ECC71;animation:pulse 2s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
  .nav{background:#fafafa;border-bottom:1px solid #eaeaea;padding:10px 28px;display:flex;gap:20px;flex-wrap:wrap}
  .nav a{font-size:13px;color:#666;font-weight:500;padding-bottom:2px}
  .nav a.active{color:#000;border-bottom:2px solid #000}
  .content{padding:24px 28px}
  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:28px}
  .stat{background:#fafafa;padding:16px;border-radius:6px}
  .stat .num{font-size:28px;font-weight:700;color:#111}
  .stat .label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-top:2px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.05em;padding:8px 10px;border-bottom:2px solid #111}
  td{padding:10px;border-bottom:1px solid #f0f0f0;vertical-align:top}
  tr:hover{background:#fafafa}
  .badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;color:#fff;letter-spacing:.03em}
  .card{background:#fafafa;border-radius:6px;padding:20px;margin-bottom:16px}
  .card h3{font-size:16px;margin-bottom:4px}.card .meta{font-size:12px;color:#888;margin-bottom:12px}
  .card .detail{font-size:13px;line-height:1.6;color:#555}
  .kv{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee;font-size:13px}
  .kv .k{color:#888}.kv .v{font-weight:600;color:#111;text-align:right;max-width:60%}
  .ev{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #f5f5f5;font-size:13px;flex-wrap:wrap}
  .ev-type{background:#f0f0f0;padding:2px 8px;border-radius:3px;font-size:11px;color:#555;white-space:nowrap}
  .ev-time{color:#aaa;font-size:11px;white-space:nowrap;margin-left:auto}
  .score-bar{background:#eee;border-radius:4px;height:8px;width:80px;display:inline-block;vertical-align:middle}
  .score-fill{height:8px;border-radius:4px}.score-num{font-size:12px;color:#666;margin-left:4px}
  .footer{padding:20px 28px;border-top:1px solid #eee;margin-top:40px;font-size:10px;color:#aaa}
  @media(max-width:600px){.stats{grid-template-columns:repeat(2,1fr)}table{font-size:12px}td,th{padding:6px 4px}.ev{font-size:12px}}
</style>
</head>
<body>
<div class="header">
  <div><h1>NAVADA</h1><p>Lead Pipeline</p></div>
  <div class="live"><span class="dot"></span>LIVE</div>
</div>
<div class="nav">
  <a onclick="showView('dashboard')" id="nav-dashboard" class="active">Dashboard</a>
  <a onclick="showView('leads')" id="nav-leads">Leads</a>
  <a onclick="showView('tasks')" id="nav-tasks">Tasks</a>
  <a onclick="showView('events')" id="nav-events">Events</a>
</div>
<div class="content" id="app">Loading...</div>
<div class="footer">NAVADA Lead Pipeline &middot; Real-time via WebSocket &middot; Data synced to PostgreSQL</div>

<script>
const SC={new:'#3498DB',researching:'#9B59B6',outreach_drafted:'#F39C12',outreach_sent:'#E67E22',responded:'#2ECC71',meeting_scheduled:'#27AE60',proposal_sent:'#1ABC9C',negotiating:'#16A085',won:'#2ECC71',lost:'#E74C3C',nurturing:'#95A5A6'};
let state={stats:{},leads:[],tasks:[],events:[]};
let view='dashboard';
let detailId=null;

function badge(s){return '<span class="badge" style="background:'+(SC[s]||'#888')+'">'+s+'</span>'}
function ago(d){if(!d)return'\\u2014';const m=Math.floor((Date.now()-new Date(d))/60000);if(m<60)return m+'m ago';const h=Math.floor(m/60);if(h<24)return h+'h ago';return Math.floor(h/24)+'d ago'}
function sbar(s){const c=s>=85?'#2ECC71':s>=70?'#F39C12':'#E74C3C';return '<div class="score-bar"><div class="score-fill" style="background:'+c+';width:'+Math.min(s,100)+'%"></div></div><span class="score-num">'+s+'</span>'}

function showView(v,id){
  view=v;detailId=id||null;
  document.querySelectorAll('.nav a').forEach(a=>a.classList.remove('active'));
  const n=document.getElementById('nav-'+v);if(n)n.classList.add('active');
  render();
}

function render(){
  const el=document.getElementById('app');
  if(view==='dashboard')el.innerHTML=renderDashboard();
  else if(view==='leads')el.innerHTML=renderLeads();
  else if(view==='tasks')el.innerHTML=renderTasks();
  else if(view==='events')el.innerHTML=renderEvents();
  else if(view==='detail')el.innerHTML=renderDetail();
}

function renderDashboard(){
  const s=state.stats;
  const lr=state.leads.map(l=>'<tr><td><a onclick="showView(\\'detail\\','+l.id+')" style="font-weight:600;cursor:pointer">'+l.company+'</a></td><td>'+l.contact_name+'</td><td>'+badge(l.status)+'</td><td>'+sbar(l.score)+'</td><td>'+(l.sector||'\\u2014')+'</td><td style="font-size:11px;color:#888">'+ago(l.updated_at)+'</td></tr>').join('');
  const tr=state.tasks.slice(0,8).map(t=>'<tr><td>'+t.title+'</td><td>'+(t.company||'\\u2014')+'</td><td>'+t.assigned_to+'</td><td style="font-size:11px;color:#888">'+(t.due_date?new Date(t.due_date).toLocaleDateString('en-GB'):'\\u2014')+'</td></tr>').join('');
  const ev=state.events.slice(0,10).map(e=>'<div class="ev"><span class="ev-type">'+e.event_type.replace(/_/g,' ')+'</span><span>'+(e.company||'\\u2014')+' \\u2014 '+(e.event_detail||'').substring(0,60)+'</span><span class="ev-time">'+ago(e.timestamp)+'</span></div>').join('');
  return '<div class="stats"><div class="stat"><div class="num">'+(s.total_leads||0)+'</div><div class="label">Total Leads</div></div><div class="stat"><div class="num">'+(s.total_events||0)+'</div><div class="label">Events</div></div><div class="stat"><div class="num">'+(s.pending_tasks||0)+'</div><div class="label">Tasks</div></div><div class="stat"><div class="num">'+(s.avg_score||0)+'</div><div class="label">Avg Score</div></div></div><h2 style="font-size:16px;margin-bottom:12px">Pipeline</h2><div style="overflow-x:auto"><table><thead><tr><th>Company</th><th>Contact</th><th>Status</th><th>Score</th><th>Sector</th><th>Updated</th></tr></thead><tbody>'+lr+'</tbody></table></div><h2 style="font-size:16px;margin:28px 0 12px">Pending Tasks</h2><div style="overflow-x:auto"><table><thead><tr><th>Task</th><th>Company</th><th>Assigned</th><th>Due</th></tr></thead><tbody>'+tr+'</tbody></table></div><h2 style="font-size:16px;margin:28px 0 12px">Recent Events</h2>'+ev;
}

function renderLeads(){
  return '<h2 style="font-size:16px;margin-bottom:16px">All Leads ('+state.leads.length+')</h2>'+state.leads.map(l=>'<div class="card"><h3><a onclick="showView(\\'detail\\','+l.id+')" style="cursor:pointer">'+l.company+'</a> '+badge(l.status)+'</h3><div class="meta">'+l.contact_name+' &middot; '+(l.contact_role||'')+' &middot; '+(l.sector||'')+'</div><div class="kv"><span class="k">Score</span><span class="v">'+sbar(l.score)+'</span></div><div class="kv"><span class="k">Funding</span><span class="v">'+(l.funding||'\\u2014')+'</span></div><div class="kv"><span class="k">Fit</span><span class="v">'+(l.navada_fit||'\\u2014')+'</span></div></div>').join('');
}

function renderTasks(){
  const p=state.tasks.filter(t=>t.status==='pending');
  const rows=p.map(t=>'<tr><td>'+t.title+'</td><td>'+(t.company||'\\u2014')+'</td><td>'+t.assigned_to+'</td><td>'+t.priority+'/5</td><td style="font-size:11px;color:#888">'+(t.due_date?new Date(t.due_date).toLocaleDateString('en-GB'):'\\u2014')+'</td></tr>').join('');
  return '<h2 style="font-size:16px;margin-bottom:12px">Pending Tasks ('+p.length+')</h2><div style="overflow-x:auto"><table><thead><tr><th>Task</th><th>Company</th><th>Assigned</th><th>Priority</th><th>Due</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}

function renderEvents(){
  const ev=state.events.map(e=>'<div class="ev"><span class="ev-type">'+e.event_type.replace(/_/g,' ')+'</span><span style="flex:1">'+(e.company||'\\u2014')+' \\u2014 '+(e.event_detail||'').substring(0,80)+'</span><span class="ev-time">'+ago(e.timestamp)+'</span></div>').join('');
  return '<h2 style="font-size:16px;margin-bottom:16px">All Events ('+state.events.length+')</h2>'+ev;
}

function renderDetail(){
  const l=state.leads.find(x=>x.id===detailId);
  if(!l)return '<p>Lead not found</p>';
  const fields=[['Company',l.company],['Contact',l.contact_name],['Role',l.contact_role||'\\u2014'],['Email',l.contact_email||'Not found yet'],['LinkedIn',l.contact_linkedin?'<a href="'+l.contact_linkedin+'" target="_blank">View</a>':'\\u2014'],['Sector',l.sector],['Location',l.location],['Stage',l.stage],['Funding',l.funding],['Status',badge(l.status)],['Score',sbar(l.score)],['Priority',l.priority+'/5'],['Source',l.source]];
  const fh=fields.map(f=>'<div class="kv"><span class="k">'+f[0]+'</span><span class="v">'+(f[1]||'\\u2014')+'</span></div>').join('');
  // Events for this lead from state
  const lev=state.events.filter(e=>e.lead_id===l.id);
  const evh=lev.map(e=>'<div class="ev"><span class="ev-type">'+e.event_type.replace(/_/g,' ')+'</span><span>'+(e.event_detail||'').substring(0,80)+'</span><span class="ev-time">'+ago(e.timestamp)+'</span></div>').join('');
  return '<a onclick="showView(\\'dashboard\\')" style="font-size:12px;color:#888;cursor:pointer">&larr; Back</a><div class="card" style="margin-top:12px"><h3>'+l.company+'</h3><div class="meta">'+l.contact_name+' &middot; '+(l.contact_role||'')+' &middot; '+(l.location||'')+'</div>'+fh+'</div><div class="card"><h3 style="font-size:14px">NAVADA Fit</h3><div class="detail">'+(l.navada_fit||'\\u2014')+'</div></div><div class="card"><h3 style="font-size:14px">Service Match</h3><div class="detail">'+(l.service_match||'\\u2014')+'</div></div><div class="card"><h3 style="font-size:14px">Company Description</h3><div class="detail">'+(l.company_desc||'\\u2014')+'</div></div><div class="card"><h3 style="font-size:14px">Notes</h3><div class="detail">'+(l.notes||'\\u2014')+'</div></div><h2 style="font-size:16px;margin:28px 0 12px">Timeline ('+lev.length+' events)</h2>'+(evh||'<p style="color:#888;font-size:13px">No events</p>');
}

// ─── WEBSOCKET CLIENT ─────────────────────────────────────────
let ws;
function connect(){
  const proto=location.protocol==='https:'?'wss:':'ws:';
  ws=new WebSocket(proto+'//'+location.host);
  ws.onmessage=function(e){
    const msg=JSON.parse(e.data);
    if(msg.type==='full_state'){state=msg.data;render();}
  };
  ws.onclose=function(){setTimeout(connect,2000);};
  ws.onerror=function(){ws.close();};
}
connect();

// Fallback polling if WS not available
setInterval(async()=>{
  if(ws&&ws.readyState===1)return;
  try{const r=await fetch('/api/state');state=await r.json();render();}catch(e){}
},8000);
</script>
</body>
</html>`);
});

// ─── START ────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log(`NAVADA Lead Pipeline Dashboard running on http://0.0.0.0:${PORT}`);
  console.log(`Access: http://192.168.0.36:${PORT}`);
  console.log('WebSocket: live real-time updates enabled');
});
