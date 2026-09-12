// ============================================================
// Toggle Mail – SSO Session & User Context Hook
// Centralized SSO integration ready
// ============================================================

export interface SSOUser {
  id: string;
  email: string;
  displayName: string;
  avatarText: string;
  role: string;
  tenantId: string;
}

export function extractSSOUser(headers: Record<string, string | string[] | undefined>): SSOUser {
  // Check for headers passed by a Centralized SSO proxy (e.g. OAuth2 Proxy, Authelia, Cloudflare Access, etc.)
  const headerEmail = (headers['x-user-email'] || headers['x-auth-request-email'] || headers['x-sso-email']) as string | undefined;
  const headerName  = (headers['x-user-name']  || headers['x-auth-request-name']  || headers['x-sso-name']) as string | undefined;
  const headerId    = (headers['x-user-id']    || headers['x-auth-request-user']  || headers['x-sso-user-id']) as string | undefined;

  if (headerEmail) {
    return {
      id: headerId || `usr_${headerEmail.split('@')[0]}`,
      email: headerEmail,
      displayName: headerName || headerEmail.split('@')[0],
      avatarText: (headerName || headerEmail).substring(0, 2).toUpperCase(),
      role: 'user',
      tenantId: 'pk_sovereign_main',
    };
  }

  // Default active profile for local development before Centralized SSO is connected
  return {
    id: 'usr_sso_default',
    email: 'kazam@togglemail.pk',
    displayName: 'Kazam Mahmood',
    avatarText: 'KM',
    role: 'admin',
    tenantId: 'pk_sovereign_main',
  };
}
