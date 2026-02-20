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

    CREATE INDEX IF NOT EXISTS idx_companies_category ON companies(category_id);
    CREATE INDEX IF NOT EXISTS idx_companies_featured ON companies(featured);
    CREATE INDEX IF NOT EXISTS idx_research_category ON research_papers(category);
    CREATE INDEX IF NOT EXISTS idx_research_featured ON research_papers(featured);
    CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
  `);

  db.close();
  console.log('Database initialized at', DB_PATH);
}
