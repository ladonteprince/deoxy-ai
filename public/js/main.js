// ============================================
// DEOXY.AI — Main JavaScript (API-Connected)
// ============================================

const API_BASE = '';

// --- Load Companies from API ---
async function loadCompanies() {
  const grid = document.getElementById('directoryGrid');
  if (!grid) return;

  try {
    const res = await fetch(`${API_BASE}/api/companies?featured=1&limit=9`);
    const { companies, total } = await res.json();

    if (!companies.length) return;

    grid.innerHTML = companies.map(co => {
      const tags = co.tags ? JSON.parse(co.tags) : [];
      const stars = '&#9733;'.repeat(Math.round(co.rating)) + '&#9734;'.repeat(5 - Math.round(co.rating));
      const badge = co.badge ? `<span class="listing-badge ${co.badge === 'new' ? 'badge-new' : ''}">${co.badge === 'featured' ? 'Featured' : co.badge === 'new' ? 'New' : 'Popular'}</span>` : '';

      return `
        <article class="listing-card">
          <div class="listing-header">
            <div class="listing-logo" style="background: ${co.logo_gradient || 'linear-gradient(135deg, #6c5ce7, #00cec9)'};">${co.logo_initials || co.name.slice(0, 2).toUpperCase()}</div>
            <div class="listing-meta">
              <h3>${co.name}</h3>
              <span class="listing-org">${co.category_name || ''}${co.country ? ' &middot; ' + co.country : ''}</span>
            </div>
            ${badge}
          </div>
          <p class="listing-desc">${co.description || ''}</p>
          <div class="listing-tags">
            ${tags.slice(0, 3).map(t => `<span>${t}</span>`).join('')}
          </div>
          <div class="listing-footer">
            <div class="listing-rating">
              <span class="stars">${stars}</span>
              <span class="rating-count">${co.rating}</span>
            </div>
            <a href="${co.website || '#'}" target="_blank" class="listing-link">Visit &rarr;</a>
          </div>
        </article>
      `;
    }).join('');

    // Update CTA count
    const cta = grid.parentElement.querySelector('.directory-cta .btn-outline');
    if (cta) cta.textContent = `View All ${total}+ Companies →`;
  } catch (err) {
    console.error('Failed to load companies:', err);
  }
}

// --- Load Research from API ---
async function loadResearch() {
  const grid = document.getElementById('researchGrid');
  if (!grid) return;

  try {
    const res = await fetch(`${API_BASE}/api/research?limit=9`);
    const { papers, total } = await res.json();

    if (!papers.length) return;

    grid.innerHTML = papers.map(p => {
      const tags = p.tags ? JSON.parse(p.tags) : [];
      return `
        <article class="research-card">
          <div class="research-journal">${p.journal || 'Research'} ${p.pub_date ? p.pub_date.split('-')[0] : ''}</div>
          <h3>${p.title}</h3>
          <p>${p.summary || ''}</p>
          <div class="listing-tags">
            ${tags.slice(0, 3).map(t => `<span>${t}</span>`).join('')}
          </div>
        </article>
      `;
    }).join('');

    const cta = grid.parentElement.querySelector('.directory-cta .btn-outline');
    if (cta) cta.textContent = `View All ${total}+ Research Papers →`;
  } catch (err) {
    console.error('Failed to load research:', err);
  }
}

// --- Load Categories from API ---
async function loadCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;

  try {
    const res = await fetch(`${API_BASE}/api/categories`);
    const categories = await res.json();

    if (!categories.length) return;

    const icons = [
      '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/></svg>',
      '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
      '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>',
      '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L12 22M12 2C8 6 4 8 4 12C4 16 8 18 12 22M12 2C16 6 20 8 20 12C20 16 16 18 12 22"/></svg>',
      '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
      '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>',
    ];

    grid.innerHTML = categories.map((cat, i) => `
      <a href="#directory" class="category-card ${i === 0 ? 'category-featured' : ''}" data-category="${cat.slug}">
        <div class="category-icon">${icons[i] || icons[0]}</div>
        <h3>${cat.name}</h3>
        <p>${cat.description || ''}</p>
        <span class="category-count">${cat.company_count} companies</span>
      </a>
    `).join('');
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

// --- Load Stats from API ---
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/api/stats`);
    const stats = await res.json();

    const counters = document.querySelectorAll('.stat-number[data-count]');
    counters.forEach(el => {
      const label = el.nextElementSibling?.textContent?.toLowerCase() || '';
      if (label.includes('compan')) el.dataset.count = stats.companies;
      else if (label.includes('paper') || label.includes('research')) el.dataset.count = stats.papers;
      else if (label.includes('categor')) el.dataset.count = stats.categories;
    });
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// --- Live Search ---
function initLiveSearch() {
  const input = document.getElementById('heroSearch');
  const btn = document.querySelector('.search-btn');
  if (!input) return;

  let timeout;
  input.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => performSearch(input.value), 300);
  });

  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      performSearch(input.value);
    });
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performSearch(input.value);
    }
  });
}

async function performSearch(query) {
  if (!query || query.length < 2) {
    loadCompanies();
    loadResearch();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`);
    const { companies, papers } = await res.json();

    const dirGrid = document.getElementById('directoryGrid');
    const resGrid = document.getElementById('researchGrid');

    if (dirGrid && companies.length) {
      dirGrid.innerHTML = companies.map(co => {
        const tags = co.tags ? JSON.parse(co.tags) : [];
        return `
          <article class="listing-card">
            <div class="listing-header">
              <div class="listing-logo" style="background: ${co.logo_gradient || 'linear-gradient(135deg, #6c5ce7, #00cec9)'};">${co.logo_initials || co.name.slice(0, 2).toUpperCase()}</div>
              <div class="listing-meta">
                <h3>${co.name}</h3>
                <span class="listing-org">${co.category_name || ''}</span>
              </div>
            </div>
            <p class="listing-desc">${co.description || ''}</p>
            <div class="listing-tags">${tags.slice(0, 3).map(t => `<span>${t}</span>`).join('')}</div>
            <div class="listing-footer">
              <div class="listing-rating"><span class="stars">${'&#9733;'.repeat(Math.round(co.rating))}</span><span class="rating-count">${co.rating}</span></div>
              <a href="${co.website || '#'}" target="_blank" class="listing-link">Visit &rarr;</a>
            </div>
          </article>
        `;
      }).join('');
    } else if (dirGrid) {
      dirGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px;">No companies found for this search.</p>';
    }

    if (resGrid && papers.length) {
      resGrid.innerHTML = papers.map(p => {
        const tags = p.tags ? JSON.parse(p.tags) : [];
        return `
          <article class="research-card">
            <div class="research-journal">${p.journal || 'Research'}</div>
            <h3>${p.title}</h3>
            <p>${p.summary || ''}</p>
            <div class="listing-tags">${tags.slice(0, 3).map(t => `<span>${t}</span>`).join('')}</div>
          </article>
        `;
      }).join('');
    } else if (resGrid) {
      resGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px;">No research papers found for this search.</p>';
    }

    // Scroll to directory section
    const dirSection = document.getElementById('directory');
    if (dirSection) dirSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    console.error('Search failed:', err);
  }
}

// --- Email Capture (The Helix Newsletter) ---
function initEmailCapture() {
  document.querySelectorAll('.subscribe-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const btn = form.querySelector('button');
      const msg = form.querySelector('.subscribe-msg');
      if (!input) return;

      const email = input.value.trim();
      if (!email || !email.includes('@')) {
        if (msg) { msg.textContent = 'Please enter a valid email.'; msg.className = 'subscribe-msg error'; }
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Subscribing...';

      try {
        const res = await fetch(`${API_BASE}/api/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, source: form.dataset.source || 'website' }),
        });
        const data = await res.json();

        if (msg) {
          msg.textContent = data.message || 'Subscribed!';
          msg.className = 'subscribe-msg success';
        }
        input.value = '';
      } catch {
        if (msg) { msg.textContent = 'Something went wrong. Try again.'; msg.className = 'subscribe-msg error'; }
      } finally {
        btn.disabled = false;
        btn.textContent = 'Subscribe';
      }
    });
  });
}

// --- Navbar Scroll Effect ---
function initNavScroll() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// --- Stat Counter Animation ---
function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-count]');
  if (!counters.length) return;

  const animate = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const duration = 2000;
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((el) => observer.observe(el));
}

// --- Scroll Reveal ---
function initScrollReveal() {
  const targets = document.querySelectorAll(
    '.category-card, .listing-card, .research-card, .feature, .submit-card, .section-header'
  );
  targets.forEach((el) => el.classList.add('reveal'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 60);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  targets.forEach((el) => observer.observe(el));
}

// --- Search Tags ---
function initSearch() {
  const tags = document.querySelectorAll('.search-tags .tag');
  const input = document.getElementById('heroSearch');
  tags.forEach((tag) => {
    tag.addEventListener('click', () => {
      if (input) {
        input.value = tag.textContent;
        input.focus();
        performSearch(tag.textContent);
      }
    });
  });
}

// --- Mobile Nav ---
function initMobileNav() {
  const toggle = document.getElementById('mobileToggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    const isOpen = links.style.display === 'flex';
    links.style.display = isOpen ? 'none' : 'flex';
    links.style.flexDirection = 'column';
    links.style.position = 'absolute';
    links.style.top = '100%';
    links.style.left = '0';
    links.style.right = '0';
    links.style.background = 'rgba(5,5,16,0.95)';
    links.style.backdropFilter = 'blur(20px)';
    links.style.padding = '24px';
    links.style.gap = '20px';
    links.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
  });
}

// --- Smooth Scroll ---
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// --- Init ---
document.addEventListener('DOMContentLoaded', async () => {
  // Load live data from API
  await loadStats();

  // Init UI
  initNavScroll();
  initCounters();
  initScrollReveal();
  initSearch();
  initLiveSearch();
  initMobileNav();
  initSmoothScroll();
  initEmailCapture();

  // Load dynamic content
  loadCategories();
  loadCompanies();
  loadResearch();
});
