// ============================================
// DEOXY.AI — Main JavaScript
// ============================================

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
document.addEventListener('DOMContentLoaded', () => {
  initNavScroll();
  initCounters();
  initScrollReveal();
  initSearch();
  initMobileNav();
  initSmoothScroll();
});
