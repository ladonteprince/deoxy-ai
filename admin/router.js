import { Router } from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { requireAuth, handleLogin, handleLogout } from './auth.js';
import { generateSellingPoint, generateEvidenceBrief, generateInsight, generateBlogFromPaper } from './openai-helpers.js';
import { getDb } from '../db/schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const adminDir = join(__dirname, '..', 'public', 'admin');

// ========== API Router ==========
const adminRouter = Router();

// Auth (unprotected)
adminRouter.post('/login', handleLogin);
adminRouter.post('/logout', handleLogout);

// Everything below requires auth
adminRouter.use(requireAuth);

// --- Dashboard ---
adminRouter.get('/dashboard', (req, res) => {
  const db = getDb();
  const companies = db.prepare('SELECT COUNT(*) as n FROM companies').get().n;
  const papers = db.prepare('SELECT COUNT(*) as n FROM research_papers').get().n;
  const subscribers = db.prepare('SELECT COUNT(*) as n FROM subscribers').get().n;
  const briefs = db.prepare('SELECT COUNT(*) as n FROM evidence_briefs').get().n;

  const blogStats = {};
  for (const s of ['draft', 'review', 'published']) {
    blogStats[s] = db.prepare('SELECT COUNT(*) as n FROM blog_drafts WHERE status = ?').get(s).n;
  }

  const recentPapers = db.prepare(
    "SELECT id, title, journal, pub_date, category, featured FROM research_papers ORDER BY created_at DESC LIMIT 10"
  ).all();

  db.close();
  res.json({ companies, papers, subscribers, briefs, blogStats, recentPapers });
});

// --- Research CRUD ---
adminRouter.get('/research', (req, res) => {
  const db = getDb();
  const { category, search, limit = 50, offset = 0 } = req.query;
  let sql = 'SELECT * FROM research_papers WHERE 1=1';
  const params = [];

  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (search) {
    sql += ' AND (title LIKE ? OR summary LIKE ? OR tags LIKE ?)';
    const t = `%${search}%`;
    params.push(t, t, t);
  }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const papers = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as n FROM research_papers').get().n;
  db.close();
  res.json({ papers, total });
});

adminRouter.get('/research/:id', (req, res) => {
  const db = getDb();
  const paper = db.prepare('SELECT * FROM research_papers WHERE id = ?').get(req.params.id);
  if (!paper) { db.close(); return res.status(404).json({ error: 'Not found' }); }
  const sellingPoints = db.prepare('SELECT * FROM selling_points WHERE paper_id = ? ORDER BY created_at DESC').all(paper.id);
  db.close();
  res.json({ ...paper, sellingPoints });
});

adminRouter.post('/research', (req, res) => {
  const db = getDb();
  const { title, journal, pub_date, summary, consumer_relevance, tags, category, source_url, featured } = req.body;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
  try {
    const result = db.prepare(
      'INSERT INTO research_papers (title, slug, journal, pub_date, summary, consumer_relevance, tags, category, source_url, featured) VALUES (?,?,?,?,?,?,?,?,?,?)'
    ).run(title, slug, journal, pub_date, summary, consumer_relevance, JSON.stringify(tags || []), category, source_url, featured ? 1 : 0);
    db.close();
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    db.close();
    res.status(400).json({ error: err.message });
  }
});

adminRouter.put('/research/:id', (req, res) => {
  const db = getDb();
  const { title, journal, pub_date, summary, consumer_relevance, tags, category, source_url, featured } = req.body;
  db.prepare(
    'UPDATE research_papers SET title=?, journal=?, pub_date=?, summary=?, consumer_relevance=?, tags=?, category=?, source_url=?, featured=? WHERE id=?'
  ).run(title, journal, pub_date, summary, consumer_relevance, typeof tags === 'string' ? tags : JSON.stringify(tags || []), category, source_url, featured ? 1 : 0, req.params.id);
  db.close();
  res.json({ success: true });
});

adminRouter.delete('/research/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM research_papers WHERE id = ?').run(req.params.id);
  db.close();
  res.json({ success: true });
});

// --- Selling Points ---
adminRouter.post('/research/:id/selling-point', async (req, res) => {
  const db = getDb();
  const paper = db.prepare('SELECT * FROM research_papers WHERE id = ?').get(req.params.id);
  if (!paper) { db.close(); return res.status(404).json({ error: 'Paper not found' }); }
  db.close();

  try {
    const narrative = await generateSellingPoint(paper);
    const db2 = getDb();
    db2.prepare('INSERT INTO selling_points (paper_id, narrative) VALUES (?, ?)').run(paper.id, narrative);
    db2.close();
    res.json({ success: true, narrative });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Content Engine ---
adminRouter.post('/research/run-engine', async (req, res) => {
  res.json({ success: true, message: 'Content engine started. Check server logs for progress.' });
  // Run asynchronously after response
  try {
    const { runContentEngine } = await import('../engine/content-engine.js');
    await runContentEngine({ daysBack: req.body.days || 7, maxPapers: 10, generateBlogs: false });
  } catch (err) {
    console.error('Content engine error:', err.message);
  }
});

// --- Evidence Briefs ---
adminRouter.get('/briefs', (req, res) => {
  const db = getDb();
  const briefs = db.prepare(`
    SELECT eb.*, COUNT(ebp.paper_id) as paper_count
    FROM evidence_briefs eb
    LEFT JOIN evidence_brief_papers ebp ON ebp.brief_id = eb.id
    GROUP BY eb.id ORDER BY eb.created_at DESC
  `).all();
  db.close();
  res.json(briefs);
});

adminRouter.get('/briefs/:id', (req, res) => {
  const db = getDb();
  const brief = db.prepare('SELECT * FROM evidence_briefs WHERE id = ?').get(req.params.id);
  if (!brief) { db.close(); return res.status(404).json({ error: 'Not found' }); }
  const papers = db.prepare(`
    SELECT rp.*, ebp.sort_order FROM research_papers rp
    JOIN evidence_brief_papers ebp ON ebp.paper_id = rp.id
    WHERE ebp.brief_id = ? ORDER BY ebp.sort_order
  `).all(brief.id);
  db.close();
  res.json({ ...brief, papers });
});

adminRouter.post('/briefs', (req, res) => {
  const db = getDb();
  const { title, description, selling_angle, paper_ids } = req.body;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
  try {
    const result = db.prepare(
      'INSERT INTO evidence_briefs (title, slug, description, selling_angle) VALUES (?,?,?,?)'
    ).run(title, slug, description, selling_angle);
    const briefId = result.lastInsertRowid;
    if (paper_ids && paper_ids.length) {
      const insert = db.prepare('INSERT INTO evidence_brief_papers (brief_id, paper_id, sort_order) VALUES (?,?,?)');
      paper_ids.forEach((pid, i) => insert.run(briefId, pid, i));
    }
    db.close();
    res.json({ success: true, id: briefId });
  } catch (err) {
    db.close();
    res.status(400).json({ error: err.message });
  }
});

adminRouter.put('/briefs/:id', (req, res) => {
  const db = getDb();
  const { title, description, selling_angle } = req.body;
  db.prepare('UPDATE evidence_briefs SET title=?, description=?, selling_angle=?, updated_at=datetime("now") WHERE id=?')
    .run(title, description, selling_angle, req.params.id);
  db.close();
  res.json({ success: true });
});

adminRouter.delete('/briefs/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM evidence_briefs WHERE id = ?').run(req.params.id);
  db.close();
  res.json({ success: true });
});

adminRouter.post('/briefs/:id/papers', (req, res) => {
  const db = getDb();
  const { paper_ids } = req.body;
  db.prepare('DELETE FROM evidence_brief_papers WHERE brief_id = ?').run(req.params.id);
  if (paper_ids && paper_ids.length) {
    const insert = db.prepare('INSERT INTO evidence_brief_papers (brief_id, paper_id, sort_order) VALUES (?,?,?)');
    paper_ids.forEach((pid, i) => insert.run(req.params.id, pid, i));
  }
  db.close();
  res.json({ success: true });
});

adminRouter.post('/briefs/:id/generate', async (req, res) => {
  const db = getDb();
  const brief = db.prepare('SELECT * FROM evidence_briefs WHERE id = ?').get(req.params.id);
  if (!brief) { db.close(); return res.status(404).json({ error: 'Not found' }); }
  const papers = db.prepare(`
    SELECT rp.* FROM research_papers rp
    JOIN evidence_brief_papers ebp ON ebp.paper_id = rp.id
    WHERE ebp.brief_id = ? ORDER BY ebp.sort_order
  `).all(brief.id);
  db.close();

  if (papers.length < 2) return res.status(400).json({ error: 'Need at least 2 papers' });

  try {
    const generated = await generateEvidenceBrief(brief, papers);
    const db2 = getDb();
    db2.prepare('UPDATE evidence_briefs SET generated_brief=?, status="final", updated_at=datetime("now") WHERE id=?')
      .run(generated, brief.id);
    db2.close();
    res.json({ success: true, brief: generated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Companies ---
adminRouter.get('/companies', (req, res) => {
  const db = getDb();
  const companies = db.prepare(`
    SELECT co.*, cat.name as category_name,
    (SELECT COUNT(*) FROM company_papers cp WHERE cp.company_id = co.id) as linked_papers
    FROM companies co LEFT JOIN categories cat ON cat.id = co.category_id
    ORDER BY co.name
  `).all();
  db.close();
  res.json(companies);
});

adminRouter.put('/companies/:id', (req, res) => {
  const db = getDb();
  const fields = req.body;
  const sets = [];
  const vals = [];
  for (const [k, v] of Object.entries(fields)) {
    if (['name', 'description', 'website', 'rating', 'featured', 'badge', 'country', 'org_label', 'tags'].includes(k)) {
      sets.push(`${k} = ?`);
      vals.push(v);
    }
  }
  if (sets.length) {
    sets.push('updated_at = datetime("now")');
    vals.push(req.params.id);
    db.prepare(`UPDATE companies SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  }
  db.close();
  res.json({ success: true });
});

adminRouter.post('/companies/:id/papers', (req, res) => {
  const db = getDb();
  const { paper_ids, relationship = 'supports' } = req.body;
  db.prepare('DELETE FROM company_papers WHERE company_id = ?').run(req.params.id);
  if (paper_ids && paper_ids.length) {
    const insert = db.prepare('INSERT INTO company_papers (company_id, paper_id, relationship) VALUES (?,?,?)');
    paper_ids.forEach(pid => insert.run(req.params.id, pid, relationship));
  }
  db.close();
  res.json({ success: true });
});

// --- Blog Pipeline ---
adminRouter.get('/blogs', (req, res) => {
  const db = getDb();
  const { status } = req.query;
  let sql = 'SELECT b.*, rp.title as paper_title FROM blog_drafts b LEFT JOIN research_papers rp ON rp.id = b.related_paper_id';
  const params = [];
  if (status) { sql += ' WHERE b.status = ?'; params.push(status); }
  sql += ' ORDER BY b.created_at DESC';
  const blogs = db.prepare(sql).all(...params);
  db.close();
  res.json(blogs);
});

adminRouter.get('/blogs/:id', (req, res) => {
  const db = getDb();
  const blog = db.prepare('SELECT * FROM blog_drafts WHERE id = ?').get(req.params.id);
  db.close();
  if (!blog) return res.status(404).json({ error: 'Not found' });
  res.json(blog);
});

adminRouter.put('/blogs/:id', (req, res) => {
  const db = getDb();
  const { title, body, status } = req.body;
  db.prepare('UPDATE blog_drafts SET title=?, body=?, status=?, updated_at=datetime("now") WHERE id=?')
    .run(title, body, status, req.params.id);
  db.close();
  res.json({ success: true });
});

adminRouter.delete('/blogs/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM blog_drafts WHERE id = ?').run(req.params.id);
  db.close();
  res.json({ success: true });
});

adminRouter.post('/blogs/generate/:paperId', async (req, res) => {
  const db = getDb();
  const paper = db.prepare('SELECT * FROM research_papers WHERE id = ?').get(req.params.paperId);
  db.close();
  if (!paper) return res.status(404).json({ error: 'Paper not found' });

  try {
    const body = await generateBlogFromPaper(paper);
    const title = body.split('\n')[0].replace(/^#+\s*/, '').trim() || `Research: ${paper.title}`;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
    const db2 = getDb();
    const result = db2.prepare('INSERT INTO blog_drafts (title, slug, body, related_paper_id) VALUES (?,?,?,?)')
      .run(title, slug, body, paper.id);
    db2.close();
    res.json({ success: true, id: result.lastInsertRowid, title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Subscribers ---
adminRouter.get('/subscribers', (req, res) => {
  const db = getDb();
  const subs = db.prepare('SELECT * FROM subscribers ORDER BY subscribed_at DESC').all();
  const total = subs.length;
  db.close();
  res.json({ subscribers: subs, total });
});

adminRouter.get('/subscribers/export', (req, res) => {
  const db = getDb();
  const subs = db.prepare('SELECT email, source, subscribed_at FROM subscribers ORDER BY subscribed_at DESC').all();
  db.close();
  const csv = 'email,source,subscribed_at\n' + subs.map(s => `${s.email},${s.source},${s.subscribed_at}`).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=deoxy-subscribers.csv');
  res.send(csv);
});

// --- Insight Generator ---
adminRouter.post('/insights/generate', async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'Topic required' });

  const db = getDb();
  const allPapers = db.prepare('SELECT * FROM research_papers').all();
  db.close();

  try {
    const { response, citedIds } = await generateInsight(topic, allPapers);
    const db2 = getDb();
    const result = db2.prepare('INSERT INTO generated_insights (topic, response, cited_paper_ids) VALUES (?,?,?)')
      .run(topic, response, JSON.stringify(citedIds));
    db2.close();
    res.json({ success: true, id: result.lastInsertRowid, response, citedIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.get('/insights', (req, res) => {
  const db = getDb();
  const insights = db.prepare('SELECT * FROM generated_insights ORDER BY created_at DESC').all();
  db.close();
  res.json(insights);
});

adminRouter.delete('/insights/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM generated_insights WHERE id = ?').run(req.params.id);
  db.close();
  res.json({ success: true });
});

// ========== Page Router ==========
const adminPageRouter = Router();

adminPageRouter.get('/login', (req, res) => {
  res.sendFile(join(adminDir, 'login.html'));
});

adminPageRouter.use(requireAuth);

const pages = ['index', 'research', 'briefs', 'companies', 'pipeline', 'subscribers', 'insights'];
adminPageRouter.get('/', (req, res) => res.sendFile(join(adminDir, 'index.html')));
for (const page of pages.slice(1)) {
  adminPageRouter.get(`/${page}`, (req, res) => res.sendFile(join(adminDir, `${page}.html`)));
}

export { adminRouter, adminPageRouter };
