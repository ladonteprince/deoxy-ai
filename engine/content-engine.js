import 'dotenv/config';
import OpenAI from 'openai';
import { getDb } from '../db/schema.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BIORXIV_API = 'https://api.biorxiv.org/details/biorxiv';

// --- 1. Fetch recent papers from bioRxiv ---
async function fetchBiorxivPapers(daysBack = 7) {
  const end = new Date();
  const start = new Date(end - daysBack * 24 * 60 * 60 * 1000);
  const fmt = (d) => d.toISOString().split('T')[0];

  const keywords = [
    'skin aging gene',
    'nutrigenomics',
    'epigenetic clock',
    'CRISPR skin',
    'hair follicle gene',
    'telomere therapy',
    'biological age',
    'collagen gene editing',
    'melanocyte stem',
    'longevity cosmeceutical',
    'dermatogenomics',
    'pharmacogenomics beauty',
  ];

  const url = `${BIORXIV_API}/${fmt(start)}/${fmt(end)}/0/50`;
  console.log(`Fetching bioRxiv papers from ${fmt(start)} to ${fmt(end)}...`);

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.collection || !data.collection.length) {
      console.log('No papers found in date range. Trying keyword search...');
      return await searchBiorxivByKeywords(keywords, fmt(start), fmt(end));
    }

    // Filter for relevant papers
    const relevant = data.collection.filter((paper) => {
      const text = `${paper.title} ${paper.abstract}`.toLowerCase();
      return keywords.some((kw) => text.includes(kw.toLowerCase()));
    });

    console.log(`Found ${data.collection.length} total, ${relevant.length} relevant papers`);
    return relevant;
  } catch (err) {
    console.error('bioRxiv fetch failed:', err.message);
    return [];
  }
}

async function searchBiorxivByKeywords(keywords, startDate, endDate) {
  const results = [];
  for (const kw of keywords.slice(0, 5)) {
    try {
      const url = `https://api.biorxiv.org/details/biorxiv/${startDate}/${endDate}/0/10`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.collection) {
        const matches = data.collection.filter((p) =>
          `${p.title} ${p.abstract}`.toLowerCase().includes(kw.toLowerCase())
        );
        results.push(...matches);
      }
    } catch { /* skip */ }
  }
  // Deduplicate by DOI
  const seen = new Set();
  return results.filter((p) => {
    if (seen.has(p.doi)) return false;
    seen.add(p.doi);
    return true;
  });
}

// --- 2. Summarize paper with OpenAI ---
async function summarizePaper(paper) {
  const prompt = `You are a science writer for Deoxy.ai, a directory at the intersection of DNA, beauty, health, and longevity.

Summarize this research paper for a consumer audience. Be specific about findings but make it accessible.

Title: ${paper.title}
Authors: ${paper.authors || 'N/A'}
Abstract: ${paper.abstract || paper.summary || 'N/A'}

Respond in JSON format:
{
  "summary": "2-3 sentence plain-English summary of the key finding",
  "consumer_relevance": "1-2 sentences on why this matters for someone interested in DNA-based beauty, health, or longevity",
  "category": "one of: skin, beauty, nutrition, longevity, precision-wellness",
  "tags": ["3-5 relevant tags"],
  "blog_hook": "A compelling 1-sentence hook that could open a blog post about this research"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (err) {
    console.error('OpenAI summarization failed:', err.message);
    return null;
  }
}

// --- 3. Store processed paper in database ---
function storePaper(paper, analysis) {
  const db = getDb();

  const slug = paper.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);

  try {
    db.prepare(`
      INSERT OR IGNORE INTO research_papers (title, slug, journal, pub_date, summary, consumer_relevance, tags, category, source_url, doi, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      paper.title,
      slug,
      paper.server || 'bioRxiv',
      paper.date || new Date().toISOString().split('T')[0],
      analysis.summary,
      analysis.consumer_relevance,
      JSON.stringify(analysis.tags),
      analysis.category,
      `https://doi.org/${paper.doi}`,
      paper.doi,
      0
    );
    console.log(`  Stored: ${paper.title.slice(0, 60)}...`);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      console.log(`  Skipped (duplicate): ${paper.title.slice(0, 60)}...`);
    } else {
      console.error(`  Error storing: ${err.message}`);
    }
  }
  db.close();
}

// --- 4. Generate blog draft from paper ---
async function generateBlogDraft(paper, analysis) {
  const prompt = `You are a science writer for Deoxy.ai. Write a blog post (600-800 words) about this research finding.

The audience is health-conscious consumers interested in DNA, beauty, and longevity — not scientists. Be informative, not sensational. Link the science to practical implications.

Title: ${paper.title}
Summary: ${analysis.summary}
Consumer Relevance: ${analysis.consumer_relevance}
Category: ${analysis.category}

Write in markdown format with:
- A compelling headline (not the paper title)
- An engaging opening hook
- The key finding explained simply
- Why it matters for the reader
- What to watch for next
- A brief "The Science" section for those who want more detail

Do NOT include any call-to-action or promotional content.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
    });

    return completion.choices[0].message.content;
  } catch (err) {
    console.error('Blog generation failed:', err.message);
    return null;
  }
}

function storeBlogDraft(title, body, paperId) {
  const db = getDb();
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);

  try {
    db.prepare(`
      INSERT OR IGNORE INTO blog_drafts (title, slug, body, related_paper_id)
      VALUES (?, ?, ?, ?)
    `).run(title, slug, body, paperId);
    console.log(`  Blog draft stored: ${title.slice(0, 60)}...`);
  } catch (err) {
    console.error(`  Blog storage error: ${err.message}`);
  }
  db.close();
}

// --- 5. Main engine pipeline ---
async function runContentEngine(options = {}) {
  const { daysBack = 7, maxPapers = 10, generateBlogs = false } = options;

  console.log('\n=== DEOXY.AI CONTENT ENGINE ===');
  console.log(`Searching bioRxiv (last ${daysBack} days)...\n`);

  // Step 1: Fetch papers
  const papers = await fetchBiorxivPapers(daysBack);
  if (!papers.length) {
    console.log('No relevant papers found. Try increasing daysBack.');
    return { processed: 0, blogs: 0 };
  }

  console.log(`\nProcessing ${Math.min(papers.length, maxPapers)} papers with OpenAI...\n`);

  let processed = 0;
  let blogs = 0;

  for (const paper of papers.slice(0, maxPapers)) {
    console.log(`Processing: ${paper.title.slice(0, 70)}...`);

    // Step 2: Summarize with AI
    const analysis = await summarizePaper(paper);
    if (!analysis) continue;

    // Step 3: Store in database
    storePaper(paper, analysis);
    processed++;

    // Step 4: Optionally generate blog draft
    if (generateBlogs) {
      const blogBody = await generateBlogDraft(paper, analysis);
      if (blogBody) {
        const blogTitle = analysis.blog_hook || `New Research: ${paper.title}`;
        storeBlogDraft(blogTitle, blogBody, null);
        blogs++;
      }
    }

    // Rate limiting
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n=== DONE: ${processed} papers processed, ${blogs} blog drafts created ===\n`);
  return { processed, blogs };
}

// --- 6. Manual paper ingestion (for papers not on bioRxiv) ---
async function ingestManualPaper({ title, abstract, journal, date, url, doi }) {
  console.log(`\nManually ingesting: ${title.slice(0, 60)}...`);

  const analysis = await summarizePaper({ title, abstract, authors: '', summary: abstract });
  if (!analysis) return null;

  const paper = { title, doi: doi || '', date, server: journal };
  storePaper(paper, analysis);

  return analysis;
}

// --- CLI Runner ---
const args = process.argv.slice(2);
const command = args[0] || 'run';

if (command === 'run') {
  const days = parseInt(args[1]) || 30;
  runContentEngine({ daysBack: days, maxPapers: 10, generateBlogs: args.includes('--blogs') });
} else if (command === 'ingest') {
  // Example: node engine/content-engine.js ingest "Paper Title" "Abstract text" "Nature" "2025" "https://..."
  ingestManualPaper({
    title: args[1] || '',
    abstract: args[2] || '',
    journal: args[3] || 'Manual',
    date: args[4] || new Date().toISOString().split('T')[0],
    url: args[5] || '',
  });
} else {
  console.log(`
Deoxy.ai Content Engine

Usage:
  node engine/content-engine.js run [days] [--blogs]   Fetch & process bioRxiv papers
  node engine/content-engine.js ingest "title" "abstract" "journal" "date" "url"

Examples:
  npm run engine                    # Fetch last 30 days
  npm run engine -- run 7           # Fetch last 7 days
  npm run engine -- run 30 --blogs  # Fetch + generate blog drafts
  `);
}

export { runContentEngine, ingestManualPaper, summarizePaper };
