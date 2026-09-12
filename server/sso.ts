// ============================================================
// Toggle Mail – Toggle Account SSO Client (OAuth 2.0 + PKCE)
// Centralized SSO integration — same flow as Toggle Calendar.
//
// Endpoints (wired by the Vite middleware in vite.config.ts):
//  - /auth/login     -> starts the SSO redirect (PKCE + state cookie)
//  - /auth/callback  -> validates state, exchanges the code, sets session
//  - /auth/logout    -> clears the local session + central SSO session
//  - /auth/me        -> JSON session info for the front-end (auto-refresh)
//
// Registered in the auth service as:
//   clientId: 'toggle-mail', audience: 'toggle-mail',
//   redirect URI: http://localhost:4400/auth/callback
// ============================================================

import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

const AUTH_BASE_URL = process.env.AUTH_BASE_URL || 'http://localhost:4000';

const STATE_COOKIE = 'tm_oauth_state';
const SESSION_COOKIE = 'tm_sso_session';
const STATE_COOKIE_MAX_AGE = 10 * 60;             // 10 minutes
const SESSION_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days (refresh token TTL)

const CLIENT_ID = 'toggle-mail';
const REDIRECT_URI = `${process.env.APP_BASE_URL || 'http://localhost:4400'}/auth/callback`;
const SCOPES = ['profile.read', 'offline_access'];

/* ------------------------------------------------------------- session types */

export interface SSOUser {
  id: string;
  email: string;
  displayName: string;
  avatarText: string;
  role: string;
  tenantId: string;
}

interface AppSession {
  access_token: string;
  refresh_token: string;
  scope: string;
  user: { user_id: string; email: string };
  expires_at: number;
}

/* ------------------------------------------------------------------- cookies */

function parseCookies(req: IncomingMessage): Record<string, string> {
  const cookies: Record<string, string> = {};
  const header = req.headers.cookie || '';
  for (const pair of header.split(';')) {
    const trimmed = pair.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    cookies[trimmed.slice(0, idx)] = decodeURIComponent(trimmed.slice(idx + 1));
  }
  return cookies;
}

function appendSetCookie(res: ServerResponse, parts: string) {
  const existing = res.getHeader('Set-Cookie');
  const list = existing ? (Array.isArray(existing) ? existing : [existing]) : [];
  list.push(parts);
  res.setHeader('Set-Cookie', list);
}

function setCookie(res: ServerResponse, name: string, value: string, maxAge?: number) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (maxAge !== undefined) parts.push(`Max-Age=${maxAge}`);
  appendSetCookie(res, parts.join('; '));
}

function clearCookie(res: ServerResponse, name: string) {
  setCookie(res, name, '', 0);
}

/* ---------------------------------------------------------------------- PKCE */

function base64url(buffer: Buffer): string {
  return buffer.toString('base64url');
}

function createPkcePair() {
  const codeVerifier = base64url(crypto.randomBytes(48));
  const codeChallenge = base64url(crypto.createHash('sha256').update(codeVerifier).digest());
  return { codeVerifier, codeChallenge };
}

/* --------------------------------------------------------------------- flows */

/**
 * GET /auth/login — start the SSO redirect.
 * `opts.prompt = 'login'` forces re-authentication at the central service
 * (used by "Add another account"), ignoring any existing central session.
 */
export function beginSsoLogin(
  _req: IncomingMessage,
  res: ServerResponse,
  opts: { prompt?: 'login' } = {}
): void {
  const state = crypto.randomUUID();
  const { codeVerifier, codeChallenge } = createPkcePair();

  setCookie(res, STATE_COOKIE, base64url(Buffer.from(JSON.stringify({ state, codeVerifier }))), STATE_COOKIE_MAX_AGE);

  const authorizeUrl = new URL('/authorize', AUTH_BASE_URL);
  authorizeUrl.searchParams.set('client_id', CLIENT_ID);
  authorizeUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('scope', SCOPES.join(' '));
  authorizeUrl.searchParams.set('code_challenge', codeChallenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');
  if (opts.prompt) {
    authorizeUrl.searchParams.set('prompt', opts.prompt);
  }

  res.statusCode = 302;
  res.setHeader('Location', authorizeUrl.toString());
  res.end();
}

/**
 * GET /auth/callback — validate state, exchange the code, establish session.
 */
export async function handleAuthCallback(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const parsed = new URL(req.url || '/', 'http://local');
  const code = String(parsed.searchParams.get('code') || '');
  const returnedState = String(parsed.searchParams.get('state') || '');
  const error = String(parsed.searchParams.get('error') || '');

  const raw = parseCookies(req)[STATE_COOKIE] || '';
  let expectedState = '';
  let codeVerifier = '';
  try {
    const parsedCookie = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    expectedState = String(parsedCookie.state || '');
    codeVerifier = String(parsedCookie.codeVerifier || '');
  } catch { /* treat as missing */ }

  clearCookie(res, STATE_COOKIE);

  if (error || !code || !returnedState || returnedState !== expectedState || !codeVerifier) {
    sendJson(res, 400, { error: 'Sign-in could not be completed.', reason: 'Invalid or expired state. Restart the sign-in flow.' });
    return;
  }

  const tokenResponse = await fetch(new URL('/token', AUTH_BASE_URL), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier
    })
  });

  const payload: any = await tokenResponse.json();
  if (!tokenResponse.ok || !payload.access_token) {
    sendJson(res, 502, { error: payload.error || 'Token exchange failed.' });
    return;
  }

  const claims = decodeJwtPayload(payload.access_token);
  const session: AppSession = {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token || '',
    scope: payload.scope || '',
    user: {
      user_id: payload.user?.user_id || claims.sub || '',
      email: payload.user?.email || claims.email || ''
    },
    expires_at: Date.now() + (Number(payload.expires_in) || 900) * 1000
  };

  setCookie(res, SESSION_COOKIE, base64url(Buffer.from(JSON.stringify(session))), SESSION_COOKIE_MAX_AGE);

  res.statusCode = 302;
  res.setHeader('Location', '/');
  res.end();
}

/**
 * GET /auth/logout — clear the local session, then sign out of the central
 * Toggle Account session too.
 */
export function handleLogout(res: ServerResponse): void {
  clearCookie(res, SESSION_COOKIE);
  clearCookie(res, STATE_COOKIE);
  res.statusCode = 302;
  res.setHeader('Location', new URL('/logout', AUTH_BASE_URL).toString());
  res.end();
}

/**
 * GET /auth/me — JSON session info for the front-end. Silently refreshes an
 * expired access token using the stored refresh token.
 */
export async function handleSessionInfo(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const session = readSession(req);

  if (!session) {
    sendJson(res, 401, { signed_in: false });
    return;
  }

  let current = session;
  if (Date.now() > current.expires_at && current.refresh_token) {
    const refreshed = await refreshSession(res, current);
    if (refreshed) current = refreshed;
    else {
      sendJson(res, 401, { signed_in: false });
      return;
    }
  }

  sendJson(res, 200, {
    signed_in: true,
    user: current.user,
    scope: current.scope,
    auth_service: AUTH_BASE_URL
  });
}

/**
 * GET /auth/add-account — start a fresh SSO redirect with `prompt=login`,
 * forcing the central auth to re-authenticate so a different Toggle Account
 * can be signed in. The app session is replaced when the new account returns.
 */
export function beginAddAccount(req: IncomingMessage, res: ServerResponse): void {
  beginSsoLogin(req, res, { prompt: 'login' });
}

/**
 * Router used by the Vite middleware. Returns true when the request was an
 * SSO endpoint and has been fully handled.
 */
export async function handleSsoRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url || '/', 'http://local');
  switch (url.pathname) {
    case '/auth/login':
      beginSsoLogin(req, res);
      return true;
    case '/auth/add-account':
      beginAddAccount(req, res);
      return true;
    case '/auth/callback':
      await handleAuthCallback(req, res);
      return true;
    case '/auth/logout':
      handleLogout(res);
      return true;
    case '/auth/me':
      await handleSessionInfo(req, res);
      return true;
    default:
      return false;
  }
}

/* ------------------------------------------------- API session identity hook */

/**
 * Resolves the signed-in Toggle Account user from the request's session
 * cookie (falls back to the local dev profile before SSO is connected).
 * Called by server/api.ts with the request headers.
 */
export function extractSSOUser(headers: Record<string, string | string[] | undefined>): SSOUser {
  const cookieHeader = typeof headers.cookie === 'string' ? headers.cookie : '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  if (match) {
    try {
      const session = JSON.parse(Buffer.from(decodeURIComponent(match[1]), 'base64url').toString('utf8'));
      const email = String(session?.user?.email || '');
      if (email) {
        const localPart = email.split('@')[0];
        return {
          id: String(session.user.user_id || `usr_${localPart}`),
          email,
          displayName: localPart.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          avatarText: email.substring(0, 2).toUpperCase(),
          role: 'user',
          tenantId: 'pk_sovereign_main',
        };
      }
    } catch { /* fall through to dev profile */ }
  }

  // Default active profile for local development before Central SSO sign-in.
  return {
    id: 'usr_sso_default',
    email: 'kazam@togglemail.pk',
    displayName: 'Kazam Mahmood',
    avatarText: 'KM',
    role: 'admin',
    tenantId: 'pk_sovereign_main',
  };
}

/* ------------------------------------------------------------------- helpers */

function readSession(req: IncomingMessage): AppSession | null {
  const raw = parseCookies(req)[SESSION_COOKIE] || '';
  if (!raw) return null;
  try {
    const session = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (!session?.access_token) return null;
    return session as AppSession;
  } catch {
    return null;
  }
}

async function refreshSession(res: ServerResponse, session: AppSession): Promise<AppSession | null> {
  try {
    const response = await fetch(new URL('/token', AUTH_BASE_URL), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: session.refresh_token,
        client_id: CLIENT_ID
      })
    });

    const payload: any = await response.json();
    if (!response.ok || !payload.access_token) return null;

    const refreshed: AppSession = {
      ...session,
      access_token: payload.access_token,
      refresh_token: payload.refresh_token || session.refresh_token,
      scope: payload.scope || session.scope,
      expires_at: Date.now() + (Number(payload.expires_in) || 900) * 1000
    };

    setCookie(res, SESSION_COOKIE, base64url(Buffer.from(JSON.stringify(refreshed))), SESSION_COOKIE_MAX_AGE);
    return refreshed;
  } catch {
    return null;
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function decodeJwtPayload(token: string): Record<string, any> {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return {};
  }
}
