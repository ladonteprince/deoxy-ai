import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'deoxy.db');

export function getDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      category_id INTEGER REFERENCES categories(id),
      description TEXT,
      website TEXT,
      logo_initials TEXT,
      logo_gradient TEXT,
      org_label TEXT,
      rating REAL DEFAULT 0,
      tags TEXT, -- JSON array
      featured INTEGER DEFAULT 0,
      badge TEXT, -- 'featured', 'new', 'popular', null
      country TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS research_papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      journal TEXT,
      pub_date TEXT,
      summary TEXT,
      consumer_relevance TEXT,
      tags TEXT, -- JSON array
      category TEXT, -- skin, beauty, nutrition, longevity, precision-wellness
      source_url TEXT,
      doi TEXT,
      featured INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      source TEXT DEFAULT 'website', -- where they signed up
      subscribed_at TEXT DEFAULT (datetime('now')),
      confirmed INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS blog_drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      body TEXT,
      status TEXT DEFAULT 'draft', -- draft, review, published
      generated_by TEXT DEFAULT 'ai',
      related_paper_id INTEGER REFERENCES research_papers(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS evidence_briefs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      selling_angle TEXT,
      generated_brief TEXT,
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS evidence_brief_papers (
      brief_id INTEGER REFERENCES evidence_briefs(id) ON DELETE CASCADE,
      paper_id INTEGER REFERENCES research_papers(id) ON DELETE CASCADE,
      sort_order INTEGER DEFAULT 0,
      PRIMARY KEY (brief_id, paper_id)
    );

    CREATE TABLE IF NOT EXISTS company_papers (
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      paper_id INTEGER REFERENCES research_papers(id) ON DELETE CASCADE,
      relationship TEXT DEFAULT 'supports',
      PRIMARY KEY (company_id, paper_id)
    );

    CREATE TABLE IF NOT EXISTS generated_insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      response TEXT NOT NULL,
      cited_paper_ids TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS selling_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paper_id INTEGER REFERENCES research_papers(id) ON DELETE CASCADE,
      narrative TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_companies_category ON companies(category_id);
    CREATE INDEX IF NOT EXISTS idx_companies_featured ON companies(featured);
    CREATE INDEX IF NOT EXISTS idx_research_category ON research_papers(category);
    CREATE INDEX IF NOT EXISTS idx_research_featured ON research_papers(featured);
    CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
    CREATE INDEX IF NOT EXISTS idx_briefs_angle ON evidence_briefs(selling_angle);
    CREATE INDEX IF NOT EXISTS idx_selling_paper ON selling_points(paper_id);
  `);

  db.close();
  console.log('Database initialized at', DB_PATH);
}
