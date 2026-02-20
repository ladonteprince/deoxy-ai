import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getDb } from './db/schema.js';
import { initDb } from './db/schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(join(__dirname, 'public')));

// --- API Routes ---

// GET /api/categories
app.get('/api/categories', (req, res) => {
  const db = getDb();
  const cats = db.prepare(`
    SELECT c.*, COUNT(co.id) as company_count
    FROM categories c
    LEFT JOIN companies co ON co.category_id = c.id
    GROUP BY c.id
    ORDER BY c.sort_order
  `).all();
  db.close();
  res.json(cats);
});

// GET /api/companies
app.get('/api/companies', (req, res) => {
  const db = getDb();
  const { category, featured, search, limit = 50, offset = 0 } = req.query;

  let sql = `
    SELECT co.*, cat.name as category_name, cat.slug as category_slug
    FROM companies co
    LEFT JOIN categories cat ON cat.id = co.category_id
    WHERE 1=1
  `;
  const params = [];

  if (category) {
    sql += ' AND cat.slug = ?';
    params.push(category);
  }
  if (featured === '1') {
    sql += ' AND co.featured = 1';
  }
  if (search) {
    sql += ' AND (co.name LIKE ? OR co.description LIKE ? OR co.tags LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  sql += ' ORDER BY co.featured DESC, co.rating DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const companies = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as n FROM companies').get().n;
  db.close();

  res.json({ companies, total });
});

// GET /api/companies/:slug
app.get('/api/companies/:slug', (req, res) => {
  const db = getDb();
  const company = db.prepare(`
    SELECT co.*, cat.name as category_name, cat.slug as category_slug
    FROM companies co
    LEFT JOIN categories cat ON cat.id = co.category_id
    WHERE co.slug = ?
  `).get(req.params.slug);
  db.close();

  if (!company) return res.status(404).json({ error: 'Not found' });
  res.json(company);
});

// GET /api/research
app.get('/api/research', (req, res) => {
  const db = getDb();
  const { category, featured, search, limit = 50, offset = 0 } = req.query;

  let sql = 'SELECT * FROM research_papers WHERE 1=1';
  const params = [];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (featured === '1') {
    sql += ' AND featured = 1';
  }
  if (search) {
    sql += ' AND (title LIKE ? OR summary LIKE ? OR tags LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  sql += ' ORDER BY featured DESC, pub_date DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const papers = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as n FROM research_papers').get().n;
  db.close();

  res.json({ papers, total });
});

// GET /api/research/:slug
app.get('/api/research/:slug', (req, res) => {
  const db = getDb();
  const paper = db.prepare('SELECT * FROM research_papers WHERE slug = ?').get(req.params.slug);
  db.close();

  if (!paper) return res.status(404).json({ error: 'Not found' });
  res.json(paper);
});

// POST /api/subscribe
app.post('/api/subscribe', (req, res) => {
  const { email, source = 'website' } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const db = getDb();
  try {
    db.prepare('INSERT INTO subscribers (email, source) VALUES (?, ?)').run(email.toLowerCase().trim(), source);
    const count = db.prepare('SELECT COUNT(*) as n FROM subscribers').get().n;
    db.close();
    res.json({ success: true, message: 'Subscribed to The Helix!', total_subscribers: count });
  } catch (err) {
    db.close();
    if (err.message.includes('UNIQUE')) {
      return res.json({ success: true, message: 'You\'re already subscribed!' });
    }
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET /api/search
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ companies: [], papers: [] });

  const db = getDb();
  const term = `%${q}%`;

  const companies = db.prepare(`
    SELECT co.*, cat.name as category_name
    FROM companies co
    LEFT JOIN categories cat ON cat.id = co.category_id
    WHERE co.name LIKE ? OR co.description LIKE ? OR co.tags LIKE ?
    ORDER BY co.rating DESC LIMIT 10
  `).all(term, term, term);

  const papers = db.prepare(`
    SELECT * FROM research_papers
    WHERE title LIKE ? OR summary LIKE ? OR tags LIKE ?
    ORDER BY featured DESC LIMIT 10
  `).all(term, term, term);

  db.close();
  res.json({ companies, papers });
});

// GET /api/stats
app.get('/api/stats', (req, res) => {
  const db = getDb();
  const companies = db.prepare('SELECT COUNT(*) as n FROM companies').get().n;
  const papers = db.prepare('SELECT COUNT(*) as n FROM research_papers').get().n;
  const categories = db.prepare('SELECT COUNT(*) as n FROM categories').get().n;
  const subscribers = db.prepare('SELECT COUNT(*) as n FROM subscribers').get().n;
  db.close();
  res.json({ companies, papers, categories, subscribers });
});

// SPA fallback — serve index.html for non-API routes
app.get('/{*splat}', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Ensure DB exists
initDb();

app.listen(PORT, () => {
  console.log(`Deoxy.ai server running at http://localhost:${PORT}`);
});
