import crypto from 'crypto';

const sessions = new Map();
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

function parseCookies(req) {
  const cookies = {};
  (req.headers.cookie || '').split(';').forEach(c => {
    const [key, val] = c.trim().split('=');
    if (key) cookies[key.trim()] = (val || '').trim();
  });
  return cookies;
}

export function requireAuth(req, res, next) {
  const cookies = parseCookies(req);
  const token = cookies.admin_session;
  const session = sessions.get(token);

  if (!token || !session || (Date.now() - session.created > SESSION_TTL)) {
    if (token) sessions.delete(token);
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.redirect('/admin/login');
  }
  next();
}

export function handleLogin(req, res) {
  const { password } = req.body;
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  const token = crypto.randomUUID();
  sessions.set(token, { created: Date.now() });
  res.setHeader('Set-Cookie', `admin_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
  res.json({ success: true });
}

export function handleLogout(req, res) {
  const cookies = parseCookies(req);
  if (cookies.admin_session) sessions.delete(cookies.admin_session);
  res.setHeader('Set-Cookie', 'admin_session=; Path=/; HttpOnly; Max-Age=0');
  res.json({ success: true });
}
