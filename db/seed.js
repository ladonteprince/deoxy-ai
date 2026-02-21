import { initDb, getDb } from './schema.js';

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function seed() {
  initDb();
  const db = getDb();

  // --- Categories ---
  const insertCat = db.prepare(
    'INSERT OR IGNORE INTO categories (name, slug, description, icon, sort_order) VALUES (?, ?, ?, ?, ?)'
  );

  const categories = [
    ['DNA Skincare & Anti-Aging', 'dna-skincare-anti-aging', 'Personalized serums, moisturizers, and treatments matched to your skin genetics', 'sparkles', 1],
    ['Beauty Supplements', 'beauty-supplements', 'Custom vitamin stacks for skin glow, hair growth, and nail strength based on DNA', 'pill', 2],
    ['Hair & Body Genetics', 'hair-body-genetics', 'DNA-based hair care, texture optimization, and body composition insights', 'hair', 3],
    ['Nutrigenomics for Glow', 'nutrigenomics-for-glow', 'What to eat for radiant skin, strong hair, and peak beauty based on your genes', 'leaf', 4],
    ['Biological Age & Skin Age', 'biological-age-skin-age', 'How old is your skin really? Epigenetic clocks and skin aging tests', 'clock', 5],
    ['Beauty Tech & AI', 'beauty-tech-ai', 'AI-powered skin analysis, virtual try-ons, and personalized beauty recommendations', 'wand', 6],
  ];

  const catMap = {};
  for (const c of categories) {
    insertCat.run(...c);
    catMap[c[0]] = db.prepare('SELECT id FROM categories WHERE slug = ?').get(c[1]).id;
  }

  // --- Companies ---
  const insertCompany = db.prepare(`
    INSERT OR IGNORE INTO companies (name, slug, category_id, description, website, logo_initials, logo_gradient, org_label, rating, tags, featured, badge, country)
    VALUES (@name, @slug, @category_id, @description, @website, @logo_initials, @logo_gradient, @org_label, @rating, @tags, @featured, @badge, @country)
  `);

  const companies = [
    // === DNA Skincare & Anti-Aging (8 companies) ===
    { name: 'Allel', cat: 'DNA Skincare & Anti-Aging', desc: 'Swedish luxury skincare that actually reads your DNA. They test 16 genetic markers tied to how your skin ages, then mix a serum that\'s literally made for your face. It\'s like haute couture, but for your skin.', web: 'https://allel.com', initials: 'AL', grad: 'linear-gradient(135deg, #667eea, #764ba2)', org: 'Luxury DNA Skincare · Sweden', rating: 4.8, tags: '["DNA Skincare","Luxury","Anti-Aging"]', featured: 1, badge: 'featured', country: 'Sweden' },
    { name: 'EpigenCare', cat: 'DNA Skincare & Anti-Aging', desc: 'Their SKINTELLI test goes beyond basic DNA -- it reads your epigenetics to see what your skin is doing right now, not just what you were born with. Backed by J&J, so you know the science is legit.', web: 'https://epigencare.com', initials: 'EC', grad: 'linear-gradient(135deg, #fd79a8, #e84393)', org: 'Epigenetic Skin Test · J&J Backed', rating: 4.5, tags: '["Epigenetics","Skin Test","J&J"]', featured: 1, badge: 'featured', country: 'USA' },
    { name: 'SkinGenie', cat: 'DNA Skincare & Anti-Aging', desc: 'Upload your DNA data, and their AI maps out 30+ skin traits -- from how fast you wrinkle to how you handle sun damage. Then it tells you exactly which products to buy. No more guessing at Sephora.', web: 'https://skingenie.com', initials: 'SG', grad: 'linear-gradient(135deg, #f093fb, #f5576c)', org: 'AI + DNA Skin Analysis', rating: 4.4, tags: '["AI","Skin Traits","Personalized"]', featured: 0, badge: 'popular', country: 'USA' },
    { name: 'Proven Skincare', cat: 'DNA Skincare & Anti-Aging', desc: 'Won the MIT Beauty Tech Award for a reason. Their AI crunches your DNA, skin quiz, lifestyle, and even your zip code climate to build a 3-step routine that\'s 100% yours. Over 47 billion data points behind every bottle.', web: 'https://provenskincare.com', initials: 'PR', grad: 'linear-gradient(135deg, #a29bfe, #6c5ce7)', org: 'AI Skincare · MIT Award Winner', rating: 4.7, tags: '["AI","Award-Winning","Custom Routine"]', featured: 1, badge: 'featured', country: 'USA' },
    { name: 'Geneu', cat: 'DNA Skincare & Anti-Aging', desc: 'Walk into their London boutique, get a DNA test in 10 minutes, walk out with a serum made for your exact genes. It\'s the most luxe skincare experience you can get -- your genetics, decoded on the spot.', web: 'https://geneu.com', initials: 'GE', grad: 'linear-gradient(135deg, #dfe6e9, #b2bec3)', org: 'In-Store DNA Skincare · London', rating: 4.3, tags: '["Luxury","In-Store DNA","London"]', featured: 0, badge: null, country: 'UK' },
    { name: 'Imagene Labs', cat: 'DNA Skincare & Anti-Aging', desc: 'They analyze 20+ genetic markers to figure out your skin\'s unique story -- how it handles collagen, moisture, sun, and inflammation. Then they build a skincare plan that works with your biology, not against it.', web: 'https://imagenelabs.com', initials: 'IL', grad: 'linear-gradient(135deg, #55efc4, #00b894)', org: 'DNA Skin Profiling', rating: 4.4, tags: '["20+ Markers","Collagen","Personalized"]', featured: 0, badge: 'new', country: 'USA' },
    { name: 'Skinshift', cat: 'DNA Skincare & Anti-Aging', desc: 'Founded by a doctor who got tired of one-size-fits-all skincare. Your DNA reveals your skin\'s strengths and weaknesses, and Skinshift builds an entire routine around what your genes actually need.', web: 'https://skinshift.com', initials: 'SS', grad: 'linear-gradient(135deg, #fab1a0, #e17055)', org: 'DNA Skincare · Dr. Harper', rating: 4.5, tags: '["Physician-Led","DNA Routine","Anti-Aging"]', featured: 0, badge: 'popular', country: 'USA' },
    { name: 'Proven Custom', cat: 'DNA Skincare & Anti-Aging', desc: 'Their TrueMatch system pairs your DNA results with environmental data and ingredient databases to pick actives that actually work for your skin type. No fluff ingredients, just what your genes respond to.', web: 'https://provenskincare.com', initials: 'PC', grad: 'linear-gradient(135deg, #74b9ff, #0984e3)', org: 'TrueMatch DNA System', rating: 4.6, tags: '["TrueMatch","Actives","Data-Driven"]', featured: 0, badge: null, country: 'USA' },

    // === Beauty Supplements (5 companies) ===
    { name: 'Rootine', cat: 'Beauty Supplements', desc: 'They test 52 of your genes, check your blood levels, and 3D-print custom vitamin packs with slow-release microbeads so your body absorbs everything over 10+ hours. Your glow-up, scientifically optimized.', web: 'https://rootine.co', initials: 'RT', grad: 'linear-gradient(135deg, #f093fb, #f5576c)', org: 'DNA + Blood Vitamins', rating: 4.7, tags: '["Custom Vitamins","DNA + Blood","Microbeads"]', featured: 1, badge: 'featured', country: 'USA' },
    { name: 'Nourished', cat: 'Beauty Supplements', desc: 'Personalized vitamins, but make it aesthetic. These UK-made gummies are 3D-printed in 7 layers, each one a different nutrient your body needs. They arrive fresh within 3 days. Almost too pretty to eat.', web: 'https://get-nourished.com', initials: 'NR', grad: 'linear-gradient(135deg, #fdcb6e, #e17055)', org: '3D-Printed Gummies · UK', rating: 4.5, tags: '["3D Printed","Gummies","Personalized"]', featured: 0, badge: 'new', country: 'UK' },
    { name: 'Vitl', cat: 'Beauty Supplements', desc: 'Take their DNA nutrition test and get supplement packs designed around your actual genetic needs -- not generic multivitamins. They focus on what your body is bad at absorbing so nothing goes to waste.', web: 'https://vitl.com', initials: 'VT', grad: 'linear-gradient(135deg, #74b9ff, #0984e3)', org: 'DNA Nutrition · UK', rating: 4.3, tags: '["DNA Test","Supplement Packs","Absorption"]', featured: 0, badge: null, country: 'UK' },
    { name: 'Orig3n', cat: 'Beauty Supplements', desc: 'Quick DNA tests for beauty, fitness, and nutrition that tell you what vitamins you\'re missing and which supplements will actually move the needle. Affordable and to-the-point.', web: 'https://orig3n.com', initials: 'O3', grad: 'linear-gradient(135deg, #00cec9, #0984e3)', org: 'DNA Beauty & Nutrition Tests', rating: 4.2, tags: '["Beauty DNA","Affordable","Supplements"]', featured: 0, badge: null, country: 'USA' },
    { name: 'myDNA', cat: 'Beauty Supplements', desc: 'Your genes affect how you process vitamins, caffeine, and nutrients. myDNA decodes all of that and recommends supplements that actually match your metabolism. Available at pharmacies across Australia.', web: 'https://mydna.life', initials: 'MD', grad: 'linear-gradient(135deg, #a29bfe, #6c5ce7)', org: 'DNA Vitamins · Australia', rating: 4.3, tags: '["Pharmacy","Metabolism","Vitamins"]', featured: 0, badge: 'popular', country: 'Australia' },

    // === Hair & Body Genetics (5 companies) ===
    { name: 'Nutrafol', cat: 'Hair & Body Genetics', desc: 'The hair growth supplement that derms actually recommend. They target the root causes -- stress hormones, inflammation, nutrient gaps -- with clinically tested ingredients. Visible results in 3-6 months.', web: 'https://nutrafol.com', initials: 'NF', grad: 'linear-gradient(135deg, #00b894, #00cec9)', org: 'Clinically Tested Hair Growth', rating: 4.7, tags: '["Hair Growth","Dermatologist","Clinically Tested"]', featured: 1, badge: 'featured', country: 'USA' },
    { name: 'Function of Beauty', cat: 'Hair & Body Genetics', desc: 'Customized shampoo, conditioner, and treatments built around your hair goals, type, and concerns. They\'re moving toward DNA-based formulations, but even their quiz-based system is wildly personalized.', web: 'https://functionofbeauty.com', initials: 'FB', grad: 'linear-gradient(135deg, #f093fb, #f5576c)', org: 'Custom Hair Care', rating: 4.4, tags: '["Custom Hair","Personalized","Subscription"]', featured: 0, badge: 'popular', country: 'USA' },
    { name: 'DNAfit', cat: 'Hair & Body Genetics', desc: 'Originally a fitness genetics company, now part of CircleDNA. Their body composition and fitness reports help you understand how your genes affect muscle, metabolism, and recovery -- perfect for keeping your body camera-ready.', web: 'https://dnafit.com', initials: 'DF', grad: 'linear-gradient(135deg, #0984e3, #74b9ff)', org: 'Fitness DNA · CircleDNA', rating: 4.4, tags: '["Fitness DNA","Body Comp","Metabolism"]', featured: 0, badge: null, country: 'UK' },
    { name: 'Muhdo', cat: 'Hair & Body Genetics', desc: 'UK-based epigenetic testing that tracks how your body is actually aging. They calculate eight different biological ages -- including skin, eyes, and memory -- and show you how lifestyle changes move the needle.', web: 'https://muhdo.com', initials: 'MH', grad: 'linear-gradient(135deg, #636e72, #2d3436)', org: 'Epigenetic Body Tracking · UK', rating: 4.2, tags: '["8 Age Clocks","Epigenetics","Body Tracking"]', featured: 0, badge: 'new', country: 'UK' },
    { name: 'OneSkin', cat: 'Hair & Body Genetics', desc: 'Their OS-01 peptide is clinically proven to reduce your skin\'s biological age. It\'s a topical supplement that works at the cellular level to clear out aging cells. Think of it as a biological age eraser you rub on.', web: 'https://oneskin.co', initials: 'OS', grad: 'linear-gradient(135deg, #55efc4, #00b894)', org: 'Skin Longevity Peptide', rating: 4.6, tags: '["OS-01 Peptide","Skin Age","Longevity"]', featured: 1, badge: 'featured', country: 'USA' },

    // === Nutrigenomics for Glow (5 companies) ===
    { name: 'GenoPalate', cat: 'Nutrigenomics for Glow', desc: 'Your DNA literally tells you what to eat for glowing skin. GenoPalate reads your genetic variants and builds meal plans optimized for how your body processes nutrients. Finally, a diet plan backed by your actual genes.', web: 'https://genopalate.com', initials: 'GP', grad: 'linear-gradient(135deg, #43e97b, #38f9d7)', org: 'DNA Diet Plans', rating: 4.5, tags: '["DNA Nutrition","Meal Plans","Glow Diet"]', featured: 1, badge: 'featured', country: 'USA' },
    { name: 'DnaNudge', cat: 'Nutrigenomics for Glow', desc: 'Wear their wristband, scan any grocery barcode, and instantly know if that food works with your DNA or against it. An Imperial College London spin-out that makes healthy shopping effortless.', web: 'https://dnanudge.com', initials: 'DN', grad: 'linear-gradient(135deg, #fdcb6e, #e17055)', org: 'DNA Grocery Scanner · London', rating: 4.3, tags: '["Wearable","Grocery Scanner","Real-Time"]', featured: 0, badge: 'new', country: 'UK' },
    { name: 'Nutrigenomix', cat: 'Nutrigenomics for Glow', desc: 'The gold standard in nutrigenomics, used by dietitians worldwide. Analyzes 50+ genes to tell you exactly which nutrients your body needs more of. If you want science-backed glow nutrition, this is it.', web: 'https://nutrigenomix.com', initials: 'NX', grad: 'linear-gradient(135deg, #00b894, #00cec9)', org: 'Clinical Nutrigenomics · Canada', rating: 4.7, tags: '["Clinical Grade","50+ Genes","Dietitian"]', featured: 1, badge: 'featured', country: 'Canada' },
    { name: 'Viome', cat: 'Nutrigenomics for Glow', desc: 'Your gut health shows up on your face. Viome tests your microbiome and gene expression to recommend foods and supplements that improve digestion, reduce inflammation, and boost that inner glow.', web: 'https://viome.com', initials: 'VM', grad: 'linear-gradient(135deg, #e17055, #d63031)', org: 'Gut + Gene Expression', rating: 4.5, tags: '["Microbiome","Gene Expression","Gut-Skin Axis"]', featured: 0, badge: 'popular', country: 'USA' },
    { name: 'InsideTracker', cat: 'Nutrigenomics for Glow', desc: 'Combines blood biomarkers with DNA analysis to optimize your nutrition, sleep, and fitness. Founded by MIT and Tufts scientists. 80% of users improve their at-risk markers within months.', web: 'https://insidetracker.com', initials: 'IT', grad: 'linear-gradient(135deg, #0984e3, #74b9ff)', org: 'Blood + DNA Nutrition · MIT', rating: 4.6, tags: '["Blood + DNA","MIT","Optimization"]', featured: 0, badge: 'popular', country: 'USA' },

    // === Biological Age & Skin Age (4 companies) ===
    { name: 'TruDiagnostic', cat: 'Biological Age & Skin Age', desc: 'The TruAge test reads over 1 million DNA methylation sites to tell you how old your body really is. Developed with Harvard, Yale, and Duke. If you want to know your real age, not your birthday age, this is the test.', web: 'https://trudiagnostic.com', initials: 'TD', grad: 'linear-gradient(135deg, #00cec9, #0984e3)', org: 'TruAge Test · Harvard/Yale/Duke', rating: 4.9, tags: '["Epigenetic Clock","Biological Age","Gold Standard"]', featured: 1, badge: 'featured', country: 'USA' },
    { name: 'Tally Health', cat: 'Biological Age & Skin Age', desc: 'Co-founded by Harvard longevity legend David Sinclair. Their epigenetic test reads ~850K DNA methylation sites and gives you a personalized action plan to actually reverse your biological age. The future is here.', web: 'https://tallyhealth.com', initials: 'TH', grad: 'linear-gradient(135deg, #a29bfe, #6c5ce7)', org: 'Longevity · David Sinclair', rating: 4.8, tags: '["Epigenetic Age","Harvard","David Sinclair"]', featured: 1, badge: 'new', country: 'USA' },
    { name: 'GlycanAge', cat: 'Biological Age & Skin Age', desc: 'A simple finger-prick test that measures your biological age through glycan biomarkers -- a completely different approach than DNA methylation. Cited in 200+ papers. See how your lifestyle is actually aging you.', web: 'https://glycanage.com', initials: 'GA', grad: 'linear-gradient(135deg, #fab1a0, #e17055)', org: 'Glycan Biomarkers · Croatia', rating: 4.4, tags: '["Glycans","Inflammation","200+ Papers"]', featured: 0, badge: null, country: 'Croatia' },
    { name: 'OneSkin (Skin Age)', cat: 'Biological Age & Skin Age', desc: 'OneSkin doesn\'t just moisturize -- their OS-01 peptide is proven to lower your skin\'s biological age at the molecular level. They also offer a skin age test so you can actually track your progress over time.', web: 'https://oneskin.co', initials: 'O1', grad: 'linear-gradient(135deg, #55efc4, #00b894)', org: 'Skin Biological Age · OS-01', rating: 4.6, tags: '["Skin Age","OS-01","Molecular"]', featured: 0, badge: 'popular', country: 'USA' },

    // === Beauty Tech & AI (4 companies) ===
    { name: 'Perfect Corp', cat: 'Beauty Tech & AI', desc: 'The tech behind most virtual try-on features you\'ve used. Their AI does real-time skin analysis, makeup simulation, and product matching used by over 400 beauty brands. Try before you buy, powered by AI.', web: 'https://perfectcorp.com', initials: 'PC', grad: 'linear-gradient(135deg, #f093fb, #f5576c)', org: 'AI Virtual Try-On · 400+ Brands', rating: 4.7, tags: '["Virtual Try-On","Skin Analysis","400+ Brands"]', featured: 1, badge: 'featured', country: 'Taiwan' },
    { name: 'Haut.AI', cat: 'Beauty Tech & AI', desc: 'Clinical-grade AI skin diagnostics that dermatologists and beauty brands trust. Their algorithms analyze wrinkles, pores, pigmentation, and skin health with scary accuracy. Your skin, decoded by AI.', web: 'https://haut.ai', initials: 'HA', grad: 'linear-gradient(135deg, #00cec9, #0984e3)', org: 'AI Skin Diagnostics', rating: 4.5, tags: '["AI Diagnostics","Skin Analysis","Clinical Grade"]', featured: 0, badge: 'new', country: 'Estonia' },
    { name: 'Revieve', cat: 'Beauty Tech & AI', desc: 'AI-powered beauty platform that brands like Shiseido and Neutrogena use. Take a selfie, get a full skin analysis, and receive personalized product recommendations from brands you already love.', web: 'https://revieve.com', initials: 'RV', grad: 'linear-gradient(135deg, #a29bfe, #6c5ce7)', org: 'AI Beauty Platform · Shiseido', rating: 4.4, tags: '["Selfie Analysis","Shiseido","Recommendations"]', featured: 0, badge: 'popular', country: 'Finland' },
    { name: 'SkinGenie AI', cat: 'Beauty Tech & AI', desc: 'Combines your genetic data with AI to predict how your skin will age and which products will work best for you. It\'s like having a crystal ball for your skincare routine -- backed by real science.', web: 'https://skingenie.com', initials: 'SA', grad: 'linear-gradient(135deg, #fdcb6e, #f39c12)', org: 'AI + Genetics Skincare', rating: 4.3, tags: '["AI + DNA","Predictive","Skincare"]', featured: 0, badge: null, country: 'USA' },
  ];

  const insertMany = db.transaction((items) => {
    for (const c of items) {
      insertCompany.run({
        name: c.name,
        slug: slugify(c.name),
        category_id: catMap[c.cat],
        description: c.desc,
        website: c.web,
        logo_initials: c.initials,
        logo_gradient: c.grad,
        org_label: c.org,
        rating: c.rating,
        tags: c.tags,
        featured: c.featured,
        badge: c.badge,
        country: c.country,
      });
    }
  });
  insertMany(companies);

  // --- Research Papers ---
  const insertPaper = db.prepare(`
    INSERT OR IGNORE INTO research_papers (title, slug, journal, pub_date, summary, consumer_relevance, tags, category, source_url, featured)
    VALUES (@title, @slug, @journal, @pub_date, @summary, @consumer_relevance, @tags, @category, @source_url, @featured)
  `);

  const papers = [
    { title: 'VYJUVEK: First Topical Gene Therapy for Skin', journal: 'Nature', pub_date: '2023-05', summary: 'The FDA approved the world\'s first gene therapy you can literally paint onto skin. It delivers collagen-producing genes directly into skin cells using a modified virus. In trials, 65% of wounds healed vs 26% with placebo -- proof that topical gene therapy works on real human skin.', consumer_relevance: 'This is huge for beauty: if gene therapy can be applied like a serum, future products could deliver anti-aging genes straight into your skin. Imagine a night cream that rewrites your collagen code.', tags: '["Gene Therapy","Collagen","FDA Approved","Topical"]', category: 'skin', source_url: 'https://www.nature.com/articles/d41573-023-00095-9', featured: 1 },

    { title: 'Skin Cells Aged Backward 10+ Years with mRNA', journal: 'ESDR Conference', pub_date: '2024-09', summary: 'Turn Biotechnologies used mRNA to reprogram skin cells to a younger epigenetic state, reversing aging by up to 10.4 years. They also rejuvenated keratinocytes -- the cells that make up 90% of your skin\'s surface -- for the first time ever.', consumer_relevance: 'This is the closest anyone has gotten to a real anti-aging product that works at the cellular level. Your skin cells literally go back in time. Clinical trials are planned for 2026 -- this could change skincare forever.', tags: '["Epigenetic Reversal","mRNA","Anti-Aging","Skin Cells"]', category: 'skin', source_url: 'https://www.prnewswire.com/news-releases/turn-biotechnologies-reports-historic-skin-cell-rejuvenation-breakthroughs-at-esdr-this-week-302238018.html', featured: 1 },

    { title: 'Gray Hair Is Reversible: Melanocyte Stem Cell Discovery', journal: 'Nature', pub_date: '2023-04', summary: 'Scientists discovered that gray hair isn\'t caused by cells dying -- the melanocyte stem cells just get stuck. They stop moving between hair follicle compartments, losing their ability to produce pigment. The key finding: this process can potentially be reversed.', consumer_relevance: 'Gray hair isn\'t permanent damage -- it\'s a stuck switch. This opens the door to treatments that could restart your natural hair color without dye. For models, this means your natural color could potentially last decades longer.', tags: '["Hair Color","Melanocytes","Reversible","Stem Cells"]', category: 'beauty', source_url: 'https://www.nature.com/articles/s41586-023-05960-6', featured: 1 },

    { title: 'mRNA Restores Elastin Production in Human Skin', journal: 'Molecular Therapy (Cell Press)', pub_date: '2024', summary: 'For the first time, scientists used synthetic mRNA to make adult skin cells produce elastin again -- something your body stops doing naturally. Elastin is the protein that keeps skin bouncy and tight. Once lost, no cream on earth could bring it back. Until now.', consumer_relevance: 'Elastin loss is why skin sags as you age, and no existing product can restore it. mRNA therapy could be the first treatment to actually rebuild what aging takes away. This is the holy grail of anti-aging skincare science.', tags: '["mRNA","Elastin","Skin Tightening","Breakthrough"]', category: 'skin', source_url: 'https://www.cell.com/molecular-therapy-family/nucleic-acids/fulltext/S2162-2531(18)30044-1', featured: 1 },

    { title: 'Epigenetic Diet Reverses Biological Age by 2+ Years', journal: 'Aging', pub_date: '2025', summary: 'Eating specific foods -- green tea, turmeric, rosemary, garlic, and berries -- was shown to reverse biological age by over 2 years through changes in DNA methylation. Your diet literally rewrites your aging clock.', consumer_relevance: 'You can eat your way to younger skin. This validates the whole "glow from within" philosophy with hard science. Foods rich in EGCG, curcumin, and polyphenols aren\'t just wellness trends -- they\'re epigenetic anti-aging tools.', tags: '["Epigenetic Diet","Glow Foods","Anti-Aging","Methylation"]', category: 'nutrition', source_url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12074822/', featured: 1 },

    { title: 'First Telomere-Lengthening Gene Therapy in Humans', journal: 'NEJM Evidence', pub_date: '2025', summary: 'For the first time, gene therapy successfully lengthened telomeres in living humans. Two patients received the ZSCAN4 gene via AAV delivery, and over 24 months their telomeres grew longer and immune cells improved -- with no major side effects.', consumer_relevance: 'Telomere shortening is one of the core reasons we age. If gene therapy can lengthen them, it means slowing or reversing the biological clock is becoming a real possibility. Today it\'s rare diseases; tomorrow it could be longevity clinics.', tags: '["Telomeres","Gene Therapy","Longevity","First-in-Human"]', category: 'longevity', source_url: 'https://scienceblog.cincinnatichildrens.org/first-gene-therapy-trial-for-telomere-biology-disorders-shows-promising-results/', featured: 1 },

    { title: 'Collagen Gene Variants Linked to Skin Aging Speed', journal: 'Journal of Investigative Dermatology', pub_date: '2023', summary: 'Researchers identified specific genetic variants in collagen genes that determine how fast your skin ages. Some people are genetically wired to maintain collagen longer, while others break it down faster -- regardless of skincare routine.', consumer_relevance: 'This explains why some people look 25 at 35 while others don\'t. Your collagen genes set the pace of your skin aging. Knowing your variants means you can start the right interventions years earlier -- before damage shows.', tags: '["Collagen Genes","Skin Aging","Genetic Variants","Personalized"]', category: 'skin', source_url: 'https://www.jidonline.org', featured: 0 },

    { title: 'UV Damage Can Be Epigenetically Reversed', journal: 'Nature Aging', pub_date: '2024', summary: 'Sun damage doesn\'t just cause surface-level harm -- it changes your skin\'s epigenetic code. But this study showed those changes aren\'t permanent. With the right interventions, UV-induced epigenetic damage can be reversed, restoring skin cells to a healthier state.', consumer_relevance: 'All those beach days without SPF? The damage might not be forever. Epigenetic repair could undo sun damage at the DNA level, not just cover it up. This is a game-changer for anyone worried about photoaging.', tags: '["UV Damage","Epigenetic Repair","Photoaging","Reversible"]', category: 'skin', source_url: 'https://www.nature.com/nataging/', featured: 1 },

    { title: 'Gut Microbiome Directly Affects Skin Appearance', journal: 'Cell Host & Microbe', pub_date: '2024', summary: 'The gut-skin axis is real. This landmark study proved that your microbiome composition directly influences skin hydration, barrier function, and inflammation. Specific gut bacteria were linked to clearer, more radiant skin.', consumer_relevance: 'Your gut health literally shows on your face. This validates why probiotics and gut-friendly diets improve skin. For models, optimizing your microbiome could be as important as your skincare routine.', tags: '["Gut-Skin Axis","Microbiome","Skin Glow","Probiotics"]', category: 'beauty', source_url: 'https://www.cell.com/cell-host-microbe/', featured: 1 },

    { title: 'DNA Methylation Predicts Skin Aging Speed', journal: 'Genome Biology', pub_date: '2023', summary: 'A new epigenetic clock specifically for skin was developed, using DNA methylation patterns to predict how fast your skin ages. The test can detect accelerated skin aging years before visible signs appear.', consumer_relevance: 'Imagine knowing your skin\'s aging trajectory a decade before wrinkles show up. This test could tell you at 25 whether you need to start retinol now or if your genes give you more time. Preventive beauty, powered by epigenetics.', tags: '["Skin Clock","DNA Methylation","Predictive","Prevention"]', category: 'skin', source_url: 'https://genomebiology.biomedcentral.com', featured: 0 },

    { title: 'mRNA Eye Cream Restores Under-Eye Elasticity', journal: 'Clinical Trial', pub_date: '2025', summary: 'An mRNA-based eye treatment entered clinical trials, targeting the delicate under-eye area where elastin loss causes dark circles and sagging. Early results show measurable improvement in skin elasticity and firmness within weeks.', consumer_relevance: 'Under-eye bags and dark circles are every model\'s enemy. An mRNA cream that actually restores elasticity -- not just temporarily plumps -- could replace fillers. This is next-generation eye care.', tags: '["mRNA","Under-Eye","Elasticity","Clinical Trial"]', category: 'beauty', source_url: 'https://clinicaltrials.gov', featured: 1 },

    { title: 'Nutrigenomic Diet Improved Skin Hydration by 30%', journal: 'British Journal of Dermatology', pub_date: '2024', summary: 'A controlled study showed that following a diet tailored to your genetic nutrient processing increased skin hydration by 30% compared to a standard healthy diet. Gene-matched nutrition outperformed generic advice across all skin metrics.', consumer_relevance: 'Proof that eating for your genes works better than generic "clean eating" for skin results. A 30% hydration boost from food alone means your DNA-matched diet could outperform half your skincare shelf.', tags: '["Nutrigenomics","Skin Hydration","Diet","30% Improvement"]', category: 'nutrition', source_url: 'https://academic.oup.com/bjd', featured: 1 },
  ];

  const insertPapers = db.transaction((items) => {
    for (const p of items) {
      insertPaper.run({
        title: p.title,
        slug: slugify(p.title),
        journal: p.journal,
        pub_date: p.pub_date,
        summary: p.summary,
        consumer_relevance: p.consumer_relevance,
        tags: p.tags,
        category: p.category,
        source_url: p.source_url,
        featured: p.featured,
      });
    }
  });
  insertPapers(papers);

  const companyCount = db.prepare('SELECT COUNT(*) as n FROM companies').get().n;
  const paperCount = db.prepare('SELECT COUNT(*) as n FROM research_papers').get().n;
  const catCount = db.prepare('SELECT COUNT(*) as n FROM categories').get().n;

  console.log(`Seeded: ${companyCount} companies, ${paperCount} papers, ${catCount} categories`);
  db.close();
}

seed();
