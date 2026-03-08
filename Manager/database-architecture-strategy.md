# NAVADA Database Architecture & Strategy Plan
**Created**: 2026-03-04
**Status**: Under Discussion (REMOVE BY 2026-03-05 4:00 PM)

---

## Current Database Landscape (10 Systems, 4 Locations)

### HP Laptop (Local)
| DB | Type | Port | Data | Size |
|----|------|------|------|------|
| pipeline.db | SQLite | - | Leads, CRM, sales pipeline | 76KB |
| flix.db | SQLite | - | Video streaming metadata | 20KB |
| osint.db | SQLite | - | OSINT intelligence data | 32KB |
| mlflow.db | SQLite | - | ML experiment tracking | 612KB |
| analytics.db | SQLite | - | System analytics | 12KB |
| Elasticsearch | Docker | 9200 | Telegram logs, PM2 logs, automation logs | Rolling |
| Prometheus | Docker | 9091 | System metrics (30-day retention) | Time-series |

### Oracle Cloud VM (132.145.46.184)
| DB | Type | Port | Data |
|----|------|------|------|
| PostgreSQL | Docker | 5433 | Prospect pipeline, contacts, emails, audit |
| Oracle XE 21 | Docker | 1521 | Empty/fresh (XEPDB1 ready, not yet used) |

### Cloud Services
| DB | Type | Data |
|----|------|------|
| ChromaDB Cloud | Vector store | RAG knowledge base (462+ chunks), semantic cache |

### AWS (Available but unused)
| DB | Type | Status |
|----|------|--------|
| AWS RDS | Not created | Lambda API exists, no DB backend yet |

---

## Problems

1. Data silos: Lead pipeline (SQLite) and Prospect pipeline (PostgreSQL) are separate systems tracking similar things with no cross-query ability
2. Oracle DB sitting empty: 12GB RAM on Oracle Cloud but Oracle XE has zero tables
3. No unified query layer: Answering "show me all contacts across all systems" requires querying 3 different databases manually
4. No backups: None of the SQLite databases are backed up
5. ChromaDB free tier limits: 300 record Get limit/month could bottleneck
6. AWS Lambda API has no database: Serverless endpoint has nowhere to persist data

---

## Proposed Architecture: Option A + C Combined (Recommended)

### Architecture Diagram

```
                        +--------------------------+
                        |   ORACLE XE (Cloud VM)   |
                        |   Central Data Warehouse  |
                        |   132.145.46.184:1521     |
                        |                           |
                        |  XEPDB1:                  |
                        |  +- contacts (unified)    |
                        |  +- leads + prospects     |
                        |  +- email_audit           |
                        |  +- trading_history       |
                        |  +- automation_runs       |
                        |  +- analytics_rollups     |
                        +-----------+---------------+
                                    |
                    +---------------+----------------+
                    |               |                |
           +--------v--+    +------v------+   +-----v-------+
           | HP Laptop  |    | PostgreSQL  |   | AWS Lambda  |
           | (Edge)     |    | (Prospect)  |   | (API)       |
           |            |    |             |   |             |
           | SQLite x5  |    | navada_     |   | Read-only   |
           | (fast local|    | pipeline    |   | Oracle      |
           |  writes)   |    | (stays as   |   | connection  |
           |            |    |  working    |   | for public  |
           | ELK Stack  |    |  DB)        |   | API queries |
           | Prometheus |    |             |   |             |
           +------------+    +-------------+   +-------------+
                    |               |
                    +-------+-------+
                            |
                    +-------v-------+
                    |   ChromaDB    |
                    |   (Vectors)   |
                    |   RAG + Cache |
                    +---------------+

    +------------------------------------------------------+
    |              DuckDB (Federation Layer)                |
    |         Query ALL databases from one SQL prompt       |
    +---+--------+--------+--------+--------+--------------+
        |        |        |        |        |
     SQLite  Postgres  Oracle  CSV/JSON  Parquet
```

### Strategy

1. Oracle XE as the central warehouse: unified truth for contacts, leads, prospects, trading
2. DuckDB as the federated query layer: ad-hoc analytics across all sources
3. Keep SQLite for fast local writes: sync to Oracle nightly
4. Keep PostgreSQL as prospect working DB: sync to Oracle nightly
5. Add a nightly backup script: dump SQLite + PostgreSQL to Oracle Cloud storage
6. Build a /data Telegram command: natural language queries across all databases

### New Automations to Build
| Script | Schedule | Purpose |
|--------|----------|---------|
| db-sync.js | Daily 9:30 PM | Sync SQLite + PostgreSQL to Oracle |
| db-backup.js | Daily 11 PM | Dump all DBs to Oracle Cloud volume |
| db-federated.js | On-demand | DuckDB federation layer for cross-DB queries |

### Unified Contact Schema (Oracle)

```sql
CREATE TABLE navada_contacts (
    id NUMBER GENERATED ALWAYS AS IDENTITY,
    name VARCHAR2(200),
    email VARCHAR2(200),
    phone VARCHAR2(50),
    source VARCHAR2(50),     -- 'lead_pipeline', 'prospect', 'inspire', 'manual'
    source_id VARCHAR2(100), -- ID in the source system
    company VARCHAR2(200),
    role VARCHAR2(200),
    status VARCHAR2(50),     -- 'active', 'cold', 'converted', 'unsubscribed'
    tags VARCHAR2(500),      -- JSON array: ["inspire", "client", "prospect"]
    first_contact DATE,
    last_contact DATE,
    notes CLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Open Questions

1. Option A, B, C, or the combined A+C?
2. Oracle XE priority: build schema now or federation layer first?
3. Unified contacts: merge Lead + Prospect into one Oracle table, or keep separate with a view?
4. AWS RDS: spin up managed PostgreSQL on AWS, or is Oracle Cloud sufficient?
5. Trading data: should Alpaca paper trade history go into Oracle for long-term analysis?

---

## Decision Log

- 2026-03-04: Strategy document created, awaiting Lee's decision
