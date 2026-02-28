/**
 * NAVADA Prospect Pipeline — PostgreSQL Schema + CRUD
 * Tables: prospect_companies, prospect_contacts, prospect_emails, prospect_audit, prospect_notes
 * Uses the same PostgreSQL instance as pg.js (navada_pipeline on port 5433)
 */

const { pool } = require('./pg');

// ─── SCHEMA ──────────────────────────────────────────────────

const SCHEMA_SQL = `
-- Companies we're targeting
CREATE TABLE IF NOT EXISTS prospect_companies (
    id              SERIAL PRIMARY KEY,
    company_name    TEXT NOT NULL,
    domain          TEXT,
    sector          TEXT,
    size            TEXT,
    location        TEXT,
    website         TEXT,
    linkedin_url    TEXT,
    description     TEXT,
    ai_signal       TEXT,
    source          TEXT NOT NULL,
    source_url      TEXT,
    status          TEXT DEFAULT 'new',
    priority        INT DEFAULT 3,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Decision-makers / contacts at those companies
CREATE TABLE IF NOT EXISTS prospect_contacts (
    id              SERIAL PRIMARY KEY,
    company_id      INT REFERENCES prospect_companies(id),
    full_name       TEXT NOT NULL,
    role            TEXT,
    email           TEXT,
    email_verified  BOOLEAN DEFAULT FALSE,
    email_source    TEXT,
    linkedin_url    TEXT,
    phone           TEXT,
    is_decision_maker BOOLEAN DEFAULT TRUE,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Every outreach email sent or received
CREATE TABLE IF NOT EXISTS prospect_emails (
    id              SERIAL PRIMARY KEY,
    contact_id      INT REFERENCES prospect_contacts(id),
    company_id      INT REFERENCES prospect_companies(id),
    direction       TEXT NOT NULL,
    email_type      TEXT NOT NULL,
    subject         TEXT,
    body_preview    TEXT,
    message_id      TEXT,
    status          TEXT DEFAULT 'sent',
    sent_at         TIMESTAMPTZ,
    replied_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Immutable audit log
CREATE TABLE IF NOT EXISTS prospect_audit (
    id              SERIAL PRIMARY KEY,
    entity_type     TEXT NOT NULL,
    entity_id       INT NOT NULL,
    action          TEXT NOT NULL,
    old_value       TEXT,
    new_value       TEXT,
    actor           TEXT DEFAULT 'system',
    detail          TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Draft emails awaiting Lee's approval before sending
CREATE TABLE IF NOT EXISTS prospect_drafts (
    id              SERIAL PRIMARY KEY,
    contact_id      INT REFERENCES prospect_contacts(id),
    company_id      INT REFERENCES prospect_companies(id),
    email_type      TEXT NOT NULL,
    to_email        TEXT NOT NULL,
    subject         TEXT NOT NULL,
    body_html       TEXT NOT NULL,
    body_preview    TEXT,
    status          TEXT DEFAULT 'pending',
    reviewed_at     TIMESTAMPTZ,
    reviewed_by     TEXT,
    reject_reason   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Notes / interaction log
CREATE TABLE IF NOT EXISTS prospect_notes (
    id              SERIAL PRIMARY KEY,
    company_id      INT REFERENCES prospect_companies(id),
    contact_id      INT REFERENCES prospect_contacts(id),
    note_type       TEXT DEFAULT 'general',
    content         TEXT NOT NULL,
    author          TEXT DEFAULT 'lee',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pc_status ON prospect_companies(status);
CREATE INDEX IF NOT EXISTS idx_pc_sector ON prospect_companies(sector);
CREATE INDEX IF NOT EXISTS idx_pc_domain ON prospect_companies(domain);
CREATE INDEX IF NOT EXISTS idx_pcon_company ON prospect_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_pcon_email ON prospect_contacts(email);
CREATE INDEX IF NOT EXISTS idx_pe_contact ON prospect_emails(contact_id);
CREATE INDEX IF NOT EXISTS idx_pe_company ON prospect_emails(company_id);
CREATE INDEX IF NOT EXISTS idx_pa_entity ON prospect_audit(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_pa_created ON prospect_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_pn_company ON prospect_notes(company_id);
CREATE INDEX IF NOT EXISTS idx_pn_contact ON prospect_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_pd_status ON prospect_drafts(status);
CREATE INDEX IF NOT EXISTS idx_pd_contact ON prospect_drafts(contact_id);
`;

async function initSchema() {
  await pool.query(SCHEMA_SQL);
  console.log('[prospect-db] Schema initialized');
}

// ─── AUDIT LOGGING ───────────────────────────────────────────

async function logAudit(entityType, entityId, action, detail, { oldValue, newValue, actor = 'system' } = {}) {
  await pool.query(
    `INSERT INTO prospect_audit (entity_type, entity_id, action, old_value, new_value, actor, detail)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [entityType, entityId, action,
     oldValue ? JSON.stringify(oldValue) : null,
     newValue ? JSON.stringify(newValue) : null,
     actor, detail]
  );
}

// ─── COMPANIES ───────────────────────────────────────────────

async function createCompany(data) {
  const { rows } = await pool.query(
    `INSERT INTO prospect_companies
       (company_name, domain, sector, size, location, website, linkedin_url, description, ai_signal, source, source_url, status, priority, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [data.company_name, data.domain || null, data.sector || null, data.size || null,
     data.location || null, data.website || null, data.linkedin_url || null,
     data.description || null, data.ai_signal || null, data.source,
     data.source_url || null, data.status || 'new', data.priority || 3, data.notes || null]
  );
  const company = rows[0];
  await logAudit('company', company.id, 'created', `Company added: ${company.company_name}`, { newValue: company, actor: data.actor || 'system' });
  return company;
}

async function updateCompany(id, data) {
  const old = await getCompanyById(id);
  if (!old) throw new Error(`Company ${id} not found`);

  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, val] of Object.entries(data)) {
    if (['id', 'created_at', 'actor'].includes(key)) continue;
    fields.push(`${key} = $${idx}`);
    values.push(val);
    idx++;
  }
  fields.push(`updated_at = NOW()`);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE prospect_companies SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  const updated = rows[0];
  await logAudit('company', id, 'updated', `Company updated: ${updated.company_name}`, { oldValue: old, newValue: updated, actor: data.actor || 'system' });
  return updated;
}

async function getCompanyById(id) {
  const { rows } = await pool.query('SELECT * FROM prospect_companies WHERE id = $1', [id]);
  return rows[0];
}

async function getCompanyByDomain(domain) {
  const { rows } = await pool.query('SELECT * FROM prospect_companies WHERE domain = $1', [domain]);
  return rows[0];
}

async function getCompaniesByStatus(status) {
  const { rows } = await pool.query('SELECT * FROM prospect_companies WHERE status = $1 ORDER BY priority ASC, created_at DESC', [status]);
  return rows;
}

async function getAllCompanies() {
  const { rows } = await pool.query('SELECT * FROM prospect_companies ORDER BY priority ASC, created_at DESC');
  return rows;
}

async function searchCompanies(query) {
  const { rows } = await pool.query(
    `SELECT * FROM prospect_companies
     WHERE company_name ILIKE $1 OR sector ILIKE $1 OR domain ILIKE $1 OR description ILIKE $1
     ORDER BY priority ASC`,
    [`%${query}%`]
  );
  return rows;
}

// ─── CONTACTS ────────────────────────────────────────────────

async function createContact(data) {
  const { rows } = await pool.query(
    `INSERT INTO prospect_contacts
       (company_id, full_name, role, email, email_verified, email_source, linkedin_url, phone, is_decision_maker, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [data.company_id, data.full_name, data.role || null, data.email || null,
     data.email_verified || false, data.email_source || null,
     data.linkedin_url || null, data.phone || null,
     data.is_decision_maker !== undefined ? data.is_decision_maker : true,
     data.notes || null]
  );
  const contact = rows[0];
  await logAudit('contact', contact.id, 'created', `Contact added: ${contact.full_name}`, { newValue: contact, actor: data.actor || 'system' });
  return contact;
}

async function updateContact(id, data) {
  const old = await getContactById(id);
  if (!old) throw new Error(`Contact ${id} not found`);

  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, val] of Object.entries(data)) {
    if (['id', 'created_at', 'actor'].includes(key)) continue;
    fields.push(`${key} = $${idx}`);
    values.push(val);
    idx++;
  }
  fields.push(`updated_at = NOW()`);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE prospect_contacts SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  const updated = rows[0];
  await logAudit('contact', id, 'updated', `Contact updated: ${updated.full_name}`, { oldValue: old, newValue: updated, actor: data.actor || 'system' });
  return updated;
}

async function getContactById(id) {
  const { rows } = await pool.query('SELECT * FROM prospect_contacts WHERE id = $1', [id]);
  return rows[0];
}

async function getContactsByCompany(companyId) {
  const { rows } = await pool.query('SELECT * FROM prospect_contacts WHERE company_id = $1 ORDER BY is_decision_maker DESC, created_at ASC', [companyId]);
  return rows;
}

async function getContactByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM prospect_contacts WHERE email = $1', [email.toLowerCase()]);
  return rows[0];
}

async function getUnverifiedContacts() {
  const { rows } = await pool.query(
    `SELECT c.*, pc.company_name, pc.domain
     FROM prospect_contacts c
     JOIN prospect_companies pc ON c.company_id = pc.id
     WHERE (c.email IS NULL OR c.email_verified = FALSE)
     ORDER BY pc.priority ASC, c.created_at ASC`
  );
  return rows;
}

async function getVerifiedContacts() {
  const { rows } = await pool.query(
    `SELECT c.*, pc.company_name, pc.domain, pc.sector
     FROM prospect_contacts c
     JOIN prospect_companies pc ON c.company_id = pc.id
     WHERE c.email IS NOT NULL AND c.email_verified = TRUE
     ORDER BY pc.priority ASC`
  );
  return rows;
}

// ─── EMAILS ──────────────────────────────────────────────────

async function createEmail(data) {
  const { rows } = await pool.query(
    `INSERT INTO prospect_emails
       (contact_id, company_id, direction, email_type, subject, body_preview, message_id, status, sent_at, replied_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [data.contact_id, data.company_id, data.direction, data.email_type,
     data.subject || null, data.body_preview || null, data.message_id || null,
     data.status || 'sent', data.sent_at || new Date().toISOString(), data.replied_at || null]
  );
  const email = rows[0];
  await logAudit('email', email.id, 'email_sent', `${data.direction} ${data.email_type} to contact ${data.contact_id}`, { newValue: email, actor: data.actor || 'system' });
  return email;
}

async function getEmailsByContact(contactId) {
  const { rows } = await pool.query('SELECT * FROM prospect_emails WHERE contact_id = $1 ORDER BY created_at ASC', [contactId]);
  return rows;
}

async function getEmailsByCompany(companyId) {
  const { rows } = await pool.query('SELECT * FROM prospect_emails WHERE company_id = $1 ORDER BY created_at ASC', [companyId]);
  return rows;
}

async function getUnansweredIntros(daysOld = 4) {
  const { rows } = await pool.query(
    `SELECT pe.*, pc.full_name, pc.email, pco.company_name
     FROM prospect_emails pe
     JOIN prospect_contacts pc ON pe.contact_id = pc.id
     JOIN prospect_companies pco ON pe.company_id = pco.id
     WHERE pe.direction = 'outbound'
       AND pe.email_type = 'intro'
       AND pe.status = 'sent'
       AND pe.replied_at IS NULL
       AND pe.sent_at < NOW() - INTERVAL '${daysOld} days'
       AND NOT EXISTS (
         SELECT 1 FROM prospect_emails pe2
         WHERE pe2.contact_id = pe.contact_id
           AND pe2.direction = 'outbound'
           AND pe2.email_type LIKE 'followup_%'
       )
     ORDER BY pe.sent_at ASC`
  );
  return rows;
}

async function getUnansweredFollowups(daysOld = 4) {
  const { rows } = await pool.query(
    `SELECT pe.*, pc.full_name, pc.email, pco.company_name
     FROM prospect_emails pe
     JOIN prospect_contacts pc ON pe.contact_id = pc.id
     JOIN prospect_companies pco ON pe.company_id = pco.id
     WHERE pe.direction = 'outbound'
       AND pe.email_type = 'followup_1'
       AND pe.status = 'sent'
       AND pe.replied_at IS NULL
       AND pe.sent_at < NOW() - INTERVAL '${daysOld} days'
       AND NOT EXISTS (
         SELECT 1 FROM prospect_emails pe2
         WHERE pe2.contact_id = pe.contact_id
           AND pe2.direction = 'inbound'
       )
     ORDER BY pe.sent_at ASC`
  );
  return rows;
}

async function markEmailReplied(contactId) {
  await pool.query(
    `UPDATE prospect_emails SET replied_at = NOW(), status = 'replied'
     WHERE contact_id = $1 AND direction = 'outbound' AND replied_at IS NULL`,
    [contactId]
  );
}

async function getContactsReadyForOutreach() {
  const { rows } = await pool.query(
    `SELECT c.*, pc.company_name, pc.domain, pc.sector, pc.ai_signal, pc.description as company_desc
     FROM prospect_contacts c
     JOIN prospect_companies pc ON c.company_id = pc.id
     WHERE c.email IS NOT NULL
       AND c.email_verified = TRUE
       AND pc.status IN ('new', 'qualified', 'researching')
       AND NOT EXISTS (
         SELECT 1 FROM prospect_emails pe
         WHERE pe.contact_id = c.id AND pe.direction = 'outbound'
       )
     ORDER BY pc.priority ASC, c.created_at ASC`
  );
  return rows;
}

// ─── NOTES ───────────────────────────────────────────────────

async function createNote(data) {
  const { rows } = await pool.query(
    `INSERT INTO prospect_notes (company_id, contact_id, note_type, content, author)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [data.company_id || null, data.contact_id || null, data.note_type || 'general',
     data.content, data.author || 'lee']
  );
  const note = rows[0];
  const entityType = data.contact_id ? 'contact' : 'company';
  const entityId = data.contact_id || data.company_id;
  await logAudit(entityType, entityId, 'note_added', `Note: ${data.content.substring(0, 100)}`, { actor: data.author || 'lee' });
  return note;
}

async function getNotesByCompany(companyId) {
  const { rows } = await pool.query('SELECT * FROM prospect_notes WHERE company_id = $1 ORDER BY created_at DESC', [companyId]);
  return rows;
}

async function getNotesByContact(contactId) {
  const { rows } = await pool.query('SELECT * FROM prospect_notes WHERE contact_id = $1 ORDER BY created_at DESC', [contactId]);
  return rows;
}

// ─── AUDIT QUERIES ───────────────────────────────────────────

async function getAuditByEntity(entityType, entityId) {
  const { rows } = await pool.query(
    'SELECT * FROM prospect_audit WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC',
    [entityType, entityId]
  );
  return rows;
}

async function getRecentAudit(limit = 50) {
  const { rows } = await pool.query('SELECT * FROM prospect_audit ORDER BY created_at DESC LIMIT $1', [limit]);
  return rows;
}

// ─── DRAFTS (approval gate) ──────────────────────────────────

async function createDraft(data) {
  const { rows } = await pool.query(
    `INSERT INTO prospect_drafts
       (contact_id, company_id, email_type, to_email, subject, body_html, body_preview, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'pending')
     RETURNING *`,
    [data.contact_id, data.company_id, data.email_type, data.to_email,
     data.subject, data.body_html, data.body_preview || data.body_html.replace(/<[^>]+>/g, ' ').substring(0, 500).trim()]
  );
  const draft = rows[0];
  await logAudit('draft', draft.id, 'created', `Draft ${data.email_type} for ${data.to_email}`, { newValue: { subject: data.subject, to: data.to_email }, actor: 'system' });
  return draft;
}

async function getPendingDrafts() {
  const { rows } = await pool.query(
    `SELECT d.*, pc.full_name, pco.company_name, pco.sector
     FROM prospect_drafts d
     JOIN prospect_contacts pc ON d.contact_id = pc.id
     JOIN prospect_companies pco ON d.company_id = pco.id
     WHERE d.status = 'pending'
     ORDER BY d.created_at ASC`
  );
  return rows;
}

async function getDraftById(id) {
  const { rows } = await pool.query('SELECT * FROM prospect_drafts WHERE id = $1', [id]);
  return rows[0];
}

async function approveDraft(id, reviewedBy = 'lee') {
  const { rows } = await pool.query(
    `UPDATE prospect_drafts SET status = 'approved', reviewed_at = NOW(), reviewed_by = $2
     WHERE id = $1 AND status = 'pending' RETURNING *`,
    [id, reviewedBy]
  );
  if (rows.length === 0) return null;
  await logAudit('draft', id, 'approved', `Draft approved by ${reviewedBy}`, { actor: reviewedBy });
  return rows[0];
}

async function rejectDraft(id, reason = '', reviewedBy = 'lee') {
  const { rows } = await pool.query(
    `UPDATE prospect_drafts SET status = 'rejected', reviewed_at = NOW(), reviewed_by = $2, reject_reason = $3
     WHERE id = $1 AND status = 'pending' RETURNING *`,
    [id, reviewedBy, reason]
  );
  if (rows.length === 0) return null;
  await logAudit('draft', id, 'rejected', `Draft rejected: ${reason}`, { actor: reviewedBy });
  return rows[0];
}

async function approveAll(reviewedBy = 'lee') {
  const { rows } = await pool.query(
    `UPDATE prospect_drafts SET status = 'approved', reviewed_at = NOW(), reviewed_by = $1
     WHERE status = 'pending' RETURNING *`,
    [reviewedBy]
  );
  for (const draft of rows) {
    await logAudit('draft', draft.id, 'approved', `Draft approved by ${reviewedBy}`, { actor: reviewedBy });
  }
  return rows;
}

// ─── STATS ───────────────────────────────────────────────────

async function getProspectStats() {
  const companies = await pool.query('SELECT COUNT(*) as count FROM prospect_companies');
  const byStatus = await pool.query('SELECT status, COUNT(*) as count FROM prospect_companies GROUP BY status ORDER BY count DESC');
  const contacts = await pool.query('SELECT COUNT(*) as count FROM prospect_contacts');
  const verified = await pool.query('SELECT COUNT(*) as count FROM prospect_contacts WHERE email_verified = TRUE');
  const emailsSent = await pool.query("SELECT COUNT(*) as count FROM prospect_emails WHERE direction = 'outbound'");
  const replies = await pool.query("SELECT COUNT(*) as count FROM prospect_emails WHERE direction = 'inbound'");
  const auditCount = await pool.query('SELECT COUNT(*) as count FROM prospect_audit');

  const totalSent = parseInt(emailsSent.rows[0].count);
  const totalReplies = parseInt(replies.rows[0].count);

  return {
    total_companies: parseInt(companies.rows[0].count),
    companies_by_status: byStatus.rows,
    total_contacts: parseInt(contacts.rows[0].count),
    verified_emails: parseInt(verified.rows[0].count),
    emails_sent: totalSent,
    replies_received: totalReplies,
    response_rate: totalSent > 0 ? ((totalReplies / totalSent) * 100).toFixed(1) + '%' : '0%',
    total_audit_entries: parseInt(auditCount.rows[0].count),
  };
}

// ─── EXPORTS ─────────────────────────────────────────────────

module.exports = {
  pool,
  initSchema,
  logAudit,
  // Companies
  createCompany,
  updateCompany,
  getCompanyById,
  getCompanyByDomain,
  getCompaniesByStatus,
  getAllCompanies,
  searchCompanies,
  // Contacts
  createContact,
  updateContact,
  getContactById,
  getContactsByCompany,
  getContactByEmail,
  getUnverifiedContacts,
  getVerifiedContacts,
  // Emails
  createEmail,
  getEmailsByContact,
  getEmailsByCompany,
  getUnansweredIntros,
  getUnansweredFollowups,
  markEmailReplied,
  getContactsReadyForOutreach,
  // Drafts (approval gate)
  createDraft,
  getPendingDrafts,
  getDraftById,
  approveDraft,
  rejectDraft,
  approveAll,
  // Notes
  createNote,
  getNotesByCompany,
  getNotesByContact,
  // Audit
  getAuditByEntity,
  getRecentAudit,
  // Stats
  getProspectStats,
};

// ─── CLI ─────────────────────────────────────────────────────

if (require.main === module) {
  const cmd = process.argv[2];
  (async () => {
    try {
      if (cmd === 'init') {
        await initSchema();
        console.log('[prospect-db] All tables and indexes created.');
      } else if (cmd === 'stats') {
        await initSchema();
        const stats = await getProspectStats();
        console.log('\n=== Prospect Pipeline Stats ===');
        console.log(JSON.stringify(stats, null, 2));
      } else {
        console.log('Usage: node prospect-db.js <init|stats>');
      }
    } catch (err) {
      console.error('[prospect-db] Error:', err.message);
    } finally {
      await pool.end();
    }
  })();
}
