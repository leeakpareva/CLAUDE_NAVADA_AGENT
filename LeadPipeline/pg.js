/**
 * NAVADA Lead Pipeline — PostgreSQL sync layer
 * Mirrors all SQLite data to Postgres for pgAdmin4 visibility
 */

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'Automation', '.env') });

if (!process.env.PG_PASSWORD) {
  console.error('[SECURITY] PG_PASSWORD environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  host: '127.0.0.1',
  port: 5433,
  user: 'postgres',
  password: process.env.PG_PASSWORD,
  database: 'navada_pipeline',
});

// ─── SYNC FUNCTIONS ───────────────────────────────────────────

async function syncLead(lead) {
  const q = `
    INSERT INTO leads (id, company, contact_name, contact_role, contact_email, contact_linkedin,
      sector, location, stage, funding, company_desc, navada_fit, service_match,
      priority, score, status, source, notes, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
    ON CONFLICT (id) DO UPDATE SET
      company=$2, contact_name=$3, contact_role=$4, contact_email=$5, contact_linkedin=$6,
      sector=$7, location=$8, stage=$9, funding=$10, company_desc=$11, navada_fit=$12,
      service_match=$13, priority=$14, score=$15, status=$16, source=$17, notes=$18, updated_at=$20
  `;
  await pool.query(q, [
    lead.id, lead.company, lead.contact_name, lead.contact_role, lead.contact_email,
    lead.contact_linkedin, lead.sector, lead.location, lead.stage, lead.funding,
    lead.company_desc, lead.navada_fit, lead.service_match, lead.priority, lead.score,
    lead.status, lead.source, lead.notes, lead.created_at, lead.updated_at,
  ]);
}

async function syncEvent(event) {
  const q = `
    INSERT INTO events (id, lead_id, event_type, event_detail, event_data, actor, channel, timestamp)
    VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8)
    ON CONFLICT (id) DO NOTHING
  `;
  let eventData = null;
  if (event.event_data) {
    try { eventData = typeof event.event_data === 'string' ? event.event_data : JSON.stringify(event.event_data); } catch (e) { eventData = null; }
  }
  await pool.query(q, [
    event.id, event.lead_id, event.event_type, event.event_detail,
    eventData, event.actor, event.channel, event.timestamp,
  ]);
}

async function syncTask(task) {
  const q = `
    INSERT INTO tasks (id, lead_id, title, description, due_date, status, priority, assigned_to, created_at, completed_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT (id) DO UPDATE SET
      status=$6, completed_at=$10
  `;
  await pool.query(q, [
    task.id, task.lead_id, task.title, task.description, task.due_date,
    task.status, task.priority, task.assigned_to, task.created_at, task.completed_at,
  ]);
}

async function syncAll(sqliteDb) {
  const leads = sqliteDb.prepare('SELECT * FROM leads').all();
  const events = sqliteDb.prepare('SELECT * FROM events').all();
  const tasks = sqliteDb.prepare('SELECT * FROM tasks').all();

  // Reset sequences to avoid conflicts
  if (leads.length > 0) {
    const maxLeadId = Math.max(...leads.map(l => l.id));
    await pool.query(`SELECT setval('leads_id_seq', $1, true)`, [maxLeadId]);
  }

  for (const lead of leads) await syncLead(lead);
  for (const event of events) await syncEvent(event);
  for (const task of tasks) await syncTask(task);

  if (events.length > 0) {
    const maxEventId = Math.max(...events.map(e => e.id));
    await pool.query(`SELECT setval('events_id_seq', $1, true)`, [maxEventId]);
  }
  if (tasks.length > 0) {
    const maxTaskId = Math.max(...tasks.map(t => t.id));
    await pool.query(`SELECT setval('tasks_id_seq', $1, true)`, [maxTaskId]);
  }

  return { leads: leads.length, events: events.length, tasks: tasks.length };
}

// ─── QUERY (for dashboard) ────────────────────────────────────

async function getLeads() {
  const { rows } = await pool.query('SELECT * FROM leads ORDER BY priority DESC, score DESC');
  return rows;
}

async function getLeadById(id) {
  const { rows } = await pool.query('SELECT * FROM leads WHERE id = $1', [id]);
  return rows[0];
}

async function getEvents(leadId, limit = 50) {
  if (leadId) {
    const { rows } = await pool.query('SELECT * FROM events WHERE lead_id = $1 ORDER BY timestamp DESC LIMIT $2', [leadId, limit]);
    return rows;
  }
  const { rows } = await pool.query(`
    SELECT e.*, l.company FROM events e
    LEFT JOIN leads l ON e.lead_id = l.id
    ORDER BY e.timestamp DESC LIMIT $1
  `, [limit]);
  return rows;
}

async function getTasks(status = 'pending') {
  const { rows } = await pool.query(`
    SELECT t.*, l.company, l.contact_name FROM tasks t
    LEFT JOIN leads l ON t.lead_id = l.id
    WHERE t.status = $1
    ORDER BY t.priority DESC, t.due_date ASC
  `, [status]);
  return rows;
}

async function getStats() {
  const leads = await pool.query('SELECT COUNT(*) as count FROM leads');
  const byStatus = await pool.query('SELECT status, COUNT(*) as count FROM leads GROUP BY status');
  const events = await pool.query('SELECT COUNT(*) as count FROM events');
  const tasks = await pool.query("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'");
  const avgScore = await pool.query("SELECT COALESCE(AVG(score), 0) as avg FROM leads WHERE status != 'lost'");

  return {
    total_leads: parseInt(leads.rows[0].count),
    by_status: byStatus.rows,
    total_events: parseInt(events.rows[0].count),
    pending_tasks: parseInt(tasks.rows[0].count),
    avg_score: parseFloat(avgScore.rows[0].avg).toFixed(1),
  };
}

module.exports = { pool, syncLead, syncEvent, syncTask, syncAll, getLeads, getLeadById, getEvents, getTasks, getStats };
