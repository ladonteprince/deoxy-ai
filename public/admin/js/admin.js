/* ============================================================
   Deoxy.ai Admin Panel — Shared JavaScript Utilities
   ============================================================ */

/**
 * API helper with automatic auth-error redirection.
 * All admin API calls should go through this function.
 *
 * @param {string} path    - API path relative to /api/admin (e.g. '/posts')
 * @param {object} options - Fetch options (method, body, headers, etc.)
 *                           Pass `raw: true` to get the raw Response object.
 * @returns {Promise<object|Response|null>}
 */
async function api(path, options = {}) {
  const { raw, headers: extraHeaders, body, ...rest } = options;

  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  const fetchOpts = { headers, ...rest };

  // Stringify body if it's an object (skip for FormData, strings, etc.)
  if (body !== undefined) {
    fetchOpts.body = typeof body === 'object' && !(body instanceof FormData)
      ? JSON.stringify(body)
      : body;

    // Don't set Content-Type for FormData — browser sets it with boundary
    if (body instanceof FormData) {
      delete headers['Content-Type'];
    }
  }

  try {
    const res = await fetch(`/api/admin${path}`, fetchOpts);

    if (res.status === 401) {
      window.location.href = '/admin/login';
      return null;
    }

    if (raw) return res;

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || data.message || `Request failed (${res.status})`);
    }

    return data;
  } catch (err) {
    // Network errors or JSON parse failures
    if (err.message === 'Failed to fetch') {
      showToast('Network error — please check your connection', 'error');
    }
    throw err;
  }
}

/* -----------------------------------------------------------
   Navigation
   ----------------------------------------------------------- */

/**
 * Highlights the active sidebar nav link based on the current URL path.
 */
function initNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.sidebar-nav a').forEach(a => {
    const href = a.getAttribute('href');
    // Exact match or prefix match for sub-pages (e.g. /admin/posts/123)
    const isActive = path === href || (href !== '/admin' && path.startsWith(href));
    a.classList.toggle('active', isActive);
  });
}

/* -----------------------------------------------------------
   Logout
   ----------------------------------------------------------- */

/**
 * Binds the logout button click handler.
 */
function initLogout() {
  document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await api('/logout', { method: 'POST' });
    } catch {
      // Even if the API call fails, redirect to login
    }
    window.location.href = '/admin/login';
  });
}

/* -----------------------------------------------------------
   Toast Notifications
   ----------------------------------------------------------- */

/** @type {HTMLElement[]} Active toast stack */
const _toastStack = [];

/**
 * Shows a toast notification at the bottom-right of the screen.
 *
 * @param {string} message - Text to display
 * @param {'success'|'error'|'warning'|'info'} type - Toast variant
 * @param {number} duration - Auto-dismiss in ms (default 3000)
 */
function showToast(message, type = 'success', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `admin-toast admin-toast-${type}`;
  toast.textContent = message;

  // Stack toasts vertically if multiple are active
  const offset = _toastStack.reduce((acc, t) => acc + t.offsetHeight + 8, 0);
  toast.style.transform = `translateY(${-offset}px)`;

  document.body.appendChild(toast);
  _toastStack.push(toast);

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.classList.add('visible');
    toast.style.transform = `translateY(${-offset}px)`;
  });

  // Auto-dismiss
  const timer = setTimeout(() => dismissToast(toast), duration);

  // Allow click to dismiss early
  toast.addEventListener('click', () => {
    clearTimeout(timer);
    dismissToast(toast);
  });
}

/**
 * Removes a toast and re-stacks remaining toasts.
 * @param {HTMLElement} toast
 */
function dismissToast(toast) {
  toast.classList.remove('visible');
  const idx = _toastStack.indexOf(toast);
  if (idx > -1) _toastStack.splice(idx, 1);

  // Re-calculate positions for remaining toasts
  let offset = 0;
  _toastStack.forEach(t => {
    t.style.transform = `translateY(${-offset}px)`;
    offset += t.offsetHeight + 8;
  });

  setTimeout(() => toast.remove(), 300);
}

/* -----------------------------------------------------------
   Modal Helpers
   ----------------------------------------------------------- */

/**
 * Opens a modal by its DOM id.
 * @param {string} id - The modal element's id attribute
 */
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

/**
 * Closes a modal by its DOM id.
 * @param {string} id - The modal element's id attribute
 */
function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

/**
 * Closes all open modals.
 */
function closeAllModals() {
  document.querySelectorAll('.admin-modal.open').forEach(m => {
    m.classList.remove('open');
  });
  document.body.style.overflow = '';
}

/* -----------------------------------------------------------
   Clipboard
   ----------------------------------------------------------- */

/**
 * Copies text to the clipboard and shows a toast.
 * @param {string} text - Text to copy
 */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard');
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    showToast('Copied to clipboard');
  }
}

/* -----------------------------------------------------------
   Date Formatting
   ----------------------------------------------------------- */

/**
 * Formats a date string or Date into a short human-readable format.
 * @param {string|Date|null} d
 * @returns {string}
 */
function fmtDate(d) {
  if (!d) return '\u2014';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '\u2014';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats a date into a relative time string (e.g. "2 hours ago").
 * @param {string|Date} d
 * @returns {string}
 */
function fmtRelative(d) {
  if (!d) return '\u2014';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '\u2014';

  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return fmtDate(d);
}

/* -----------------------------------------------------------
   Category Badge Helper
   ----------------------------------------------------------- */

/**
 * Returns the CSS class string for a category badge.
 * @param {string} category
 * @returns {string}
 */
function badgeClass(category) {
  const map = {
    skin: 'skin',
    beauty: 'beauty',
    nutrition: 'nutrition',
    longevity: 'longevity',
    'precision-wellness': 'wellness',
  };
  return `admin-badge admin-badge-${map[category] || 'default'}`;
}

/**
 * Returns the CSS class string for a status badge.
 * @param {string} status
 * @returns {string}
 */
function statusBadgeClass(status) {
  const map = {
    draft: 'draft',
    published: 'published',
    archived: 'archived',
  };
  return `admin-badge admin-badge-status admin-badge-${map[status] || 'default'}`;
}

/* -----------------------------------------------------------
   Tags Parser
   ----------------------------------------------------------- */

/**
 * Safely parses a tags value that may be a JSON string or array.
 * @param {string|string[]|null} tags
 * @returns {string[]}
 */
function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // If it's a comma-separated string, split it
    if (typeof tags === 'string' && tags.includes(',')) {
      return tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    return tags ? [tags] : [];
  }
}

/* -----------------------------------------------------------
   Simple Markdown Renderer
   ----------------------------------------------------------- */

/**
 * Converts a markdown string into basic HTML.
 * Supports: headings (h1-h4), bold, italic, links, lists,
 * blockquotes, inline code, citation superscripts, and paragraphs.
 *
 * @param {string} md - Raw markdown string
 * @returns {string} HTML string
 */
function renderMarkdown(md) {
  if (!md) return '';

  let html = md
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (fenced)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="lang-${lang}">${code.trim()}</code></pre>`;
  });

  // Inline code (must come before other inline transforms)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headings (must process from h4 to h1 to avoid conflicts)
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // Bold & italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Citation superscripts  [1], [2], etc.
  html = html.replace(/\[(\d+)\]/g, '<sup class="cite">[$1]</sup>');

  // Unordered list items
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');

  // Wrap consecutive <li> elements in <ul>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Paragraphs: wrap lines that aren't already block-level elements
  html = html.replace(/\n\n/g, '\n</p><p>\n');

  // Wrap in paragraph tags
  const blockTags = /^<(h[1-4]|ul|ol|li|pre|blockquote|hr|p)/;
  html = html
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (blockTags.test(trimmed)) return trimmed;
      return `<p>${trimmed}</p>`;
    })
    .join('\n');

  // Clean up empty paragraphs and double wraps
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>(<(h[1-4]|ul|ol|pre|blockquote|hr)[^>]*>)/g, '$1');
  html = html.replace(/(<\/(h[1-4]|ul|ol|pre|blockquote|hr)>)<\/p>/g, '$1');

  return html;
}

/* -----------------------------------------------------------
   Sidebar Toggle (Mobile)
   ----------------------------------------------------------- */

/**
 * Initializes the mobile sidebar toggle behavior.
 */
function initSidebarToggle() {
  const toggle = document.querySelector('.admin-sidebar-toggle');
  const sidebar = document.querySelector('.admin-sidebar');
  const overlay = document.querySelector('.admin-sidebar-overlay');

  if (!toggle || !sidebar) return;

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay?.classList.toggle('visible');
  });

  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
  });
}

/* -----------------------------------------------------------
   Keyboard Shortcuts
   ----------------------------------------------------------- */

/**
 * Initializes global keyboard shortcuts for the admin panel.
 */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Escape closes modals
    if (e.key === 'Escape') {
      closeAllModals();
    }

    // Cmd/Ctrl+K focuses search input
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.querySelector('.admin-search input');
      searchInput?.focus();
    }
  });
}

/* -----------------------------------------------------------
   Confirm Dialog
   ----------------------------------------------------------- */

/**
 * Shows a confirmation dialog using the admin modal pattern.
 * Returns a promise that resolves to true (confirm) or false (cancel).
 *
 * @param {string} message - Confirmation message
 * @param {object} opts - Options
 * @param {string} opts.title - Dialog title (default: "Confirm")
 * @param {string} opts.confirmText - Confirm button text (default: "Confirm")
 * @param {string} opts.cancelText - Cancel button text (default: "Cancel")
 * @param {boolean} opts.danger - Use danger styling for confirm button
 * @returns {Promise<boolean>}
 */
function confirmDialog(message, opts = {}) {
  const {
    title = 'Confirm',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    danger = false,
  } = opts;

  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-content" style="max-width: 420px;">
        <div class="admin-modal-header">
          <h2>${title}</h2>
        </div>
        <div class="admin-modal-body">
          <p style="color: var(--text-secondary); font-size: 0.9375rem; line-height: 1.6;">${message}</p>
        </div>
        <div class="admin-modal-footer">
          <button class="admin-btn" data-action="cancel">${cancelText}</button>
          <button class="admin-btn ${danger ? 'admin-btn-danger' : 'admin-btn-primary'}" data-action="confirm">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Animate in
    requestAnimationFrame(() => modal.classList.add('open'));

    const cleanup = (result) => {
      modal.classList.remove('open');
      setTimeout(() => modal.remove(), 300);
      document.body.style.overflow = '';
      resolve(result);
    };

    // Button handlers
    modal.querySelector('[data-action="confirm"]').addEventListener('click', () => cleanup(true));
    modal.querySelector('[data-action="cancel"]').addEventListener('click', () => cleanup(false));

    // Backdrop click = cancel
    modal.addEventListener('click', (e) => {
      if (e.target === modal) cleanup(false);
    });

    document.body.style.overflow = 'hidden';
  });
}

/* -----------------------------------------------------------
   Debounce Utility
   ----------------------------------------------------------- */

/**
 * Returns a debounced version of the given function.
 * @param {Function} fn
 * @param {number} delay - Debounce delay in ms
 * @returns {Function}
 */
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* -----------------------------------------------------------
   Truncate Text
   ----------------------------------------------------------- */

/**
 * Truncates text to a maximum length, appending an ellipsis if needed.
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
function truncate(text, maxLength = 80) {
  if (!text || text.length <= maxLength) return text || '';
  return text.slice(0, maxLength).trimEnd() + '\u2026';
}

/* -----------------------------------------------------------
   Initialization — Runs on every admin page
   ----------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initLogout();
  initSidebarToggle();
  initKeyboardShortcuts();

  // Close modals on backdrop click
  document.querySelectorAll('.admin-modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });

  // Close modals on [data-close-modal] click
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close-modal');
      if (modalId) {
        closeModal(modalId);
      } else {
        // Close the nearest parent modal
        btn.closest('.admin-modal')?.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });
});
