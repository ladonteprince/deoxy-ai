import 'dotenv/config';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateSellingPoint(paper) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: `You are a sales strategist for Deoxy.ai, a DNA beauty directory targeting 25-year-old beauty models and beauty industry executives.

Given this research paper, write a compelling 2-3 sentence selling narrative that could be used to pitch DNA beauty products to brands, investors, or consumers.

Title: ${paper.title}
Journal: ${paper.journal || 'N/A'}
Summary: ${paper.summary}
Consumer Relevance: ${paper.consumer_relevance || ''}
Category: ${paper.category}

Make it persuasive, specific, and grounded in the science. Start with a strong hook. Reference specific findings and numbers when available. Do NOT use generic marketing language.`
    }],
    temperature: 0.7,
    max_tokens: 300,
  });
  return completion.choices[0].message.content;
}

export async function generateEvidenceBrief(brief, papers) {
  const papersContext = papers.map((p, i) =>
    `[${i + 1}] "${p.title}" (${p.journal}, ${p.pub_date})\n    Summary: ${p.summary}\n    Consumer Relevance: ${p.consumer_relevance || ''}`
  ).join('\n\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: `You are a research director at Deoxy.ai creating an evidence brief for sales and business development in the DNA beauty space.

Brief Title: ${brief.title}
Selling Angle: ${brief.selling_angle}
Description: ${brief.description || ''}

Research Papers:
${papersContext}

Create a 1-page evidence brief (500-700 words) in markdown that:
1. Opens with a compelling executive summary (2-3 sentences)
2. Presents the key evidence organized by theme
3. Cites specific papers using [1], [2], etc.
4. Ends with "The Bottom Line" — a 2-sentence sales-ready conclusion
5. Includes a "References" section listing the papers

The audience is beauty industry executives and brand partners.
Tone: Authoritative but accessible. Confident but not hype.`
    }],
    temperature: 0.6,
    max_tokens: 1500,
  });
  return completion.choices[0].message.content;
}

export async function generateInsight(topic, papers) {
  // Find relevant papers via keyword matching
  const keywords = topic.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const relevant = papers
    .map(p => {
      const text = `${p.title} ${p.summary} ${p.consumer_relevance || ''} ${p.tags}`.toLowerCase();
      const score = keywords.reduce((s, kw) => s + (text.includes(kw) ? 1 : 0), 0);
      return { ...p, score };
    })
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  // If no keyword matches, use all papers
  const usePapers = relevant.length > 0 ? relevant : papers.slice(0, 8);

  const papersContext = usePapers.map((p, i) =>
    `[${i + 1}] (ID:${p.id}) "${p.title}" - ${p.summary} (${p.journal})`
  ).join('\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: `You are a research intelligence analyst for Deoxy.ai, a DNA beauty directory targeting 25-year-old beauty models.

Topic/Question: "${topic}"

Research in our database:
${papersContext}

Write a compelling, evidence-backed response (300-500 words) that:
1. Directly answers the question/addresses the topic
2. Cites specific research findings using [1], [2], etc.
3. Connects the science to practical beauty/skincare implications
4. Includes specific numbers, percentages, or findings when available
5. Ends with a forward-looking statement

The audience is a beauty brand executive or investor you're trying to convince.
Be specific, authoritative, and persuasive — but never fabricate data.

At the very end, add a line: CITED_IDS: followed by a comma-separated list of the paper IDs you referenced (the numbers after ID: in the paper list).`
    }],
    temperature: 0.7,
    max_tokens: 1000,
  });

  const content = completion.choices[0].message.content;
  // Extract cited IDs
  const match = content.match(/CITED_IDS:\s*(.+)/);
  let citedIds = [];
  if (match) {
    citedIds = match[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  }
  const response = content.replace(/\nCITED_IDS:.*$/, '').trim();

  return { response, citedIds };
}

export async function generateBlogFromPaper(paper) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: `You are a science writer for Deoxy.ai targeting beauty-conscious women in their 20s. Write a blog post (600-800 words) about this research.

Title: ${paper.title}
Summary: ${paper.summary}
Consumer Relevance: ${paper.consumer_relevance || ''}
Category: ${paper.category}

Write in markdown with:
- A compelling headline (not the paper title)
- An engaging opening hook
- The key finding explained simply
- Why it matters for the reader's beauty routine
- What to watch for next
- A brief "The Science" section for detail

No CTAs or promotional content. Be informative and trustworthy.`
    }],
    temperature: 0.8,
  });
  return completion.choices[0].message.content;
}
