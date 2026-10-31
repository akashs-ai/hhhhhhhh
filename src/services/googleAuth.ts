/**
 * Google Identity Services (GIS) OAuth 2.0 Integration for Google Calendar.
 * Uses user-configured Google Cloud Project client ID (VITE_GOOGLE_CLIENT_ID).
 * No client secrets are stored or exposed in browser code.
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: any) => void;
            error_callback?: (error: any) => void;
            prompt?: string;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
          revoke?: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

export interface GoogleAuthUser {
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  uid?: string;
}

export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'email',
  'profile',
  'openid',
];

// Fallback auth object to preserve backward compatibility for any legacy callers
export const auth: any = {
  currentUser: null,
};

// In-memory token cache (never stored in localStorage or persistent storage)
let cachedAccessToken: string | null = null;
let cachedGoogleUser: GoogleAuthUser | null = null;
let isSigningIn = false;
let pendingSignInPromise: Promise<{ user: GoogleAuthUser; accessToken: string } | null> | null = null;

/**
 * Returns the currently active VITE_GOOGLE_CLIENT_ID from Vite environment.
 */
export const getGoogleClientId = (): string => {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
};

/**
 * Checks if the Google Client ID is configured.
 */
export const isGoogleClientConfigured = (): boolean => {
  return Boolean(getGoogleClientId());
};

/**
 * Ensures Google Identity Services (accounts.google.com/gsi/client) is loaded.
 */
export const ensureGsiLoaded = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services library.')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services library.'));
    document.head.appendChild(script);
  });
};

/**
 * Initializes Google OAuth listeners or preloads GIS library.
 */
export const initGoogleAuth = (
  onAuthSuccess?: (user: GoogleAuthUser, token: string) => void,
  onAuthFailure?: () => void
): (() => void) => {
  ensureGsiLoaded().catch((err) => {
    console.warn('[GoogleAuth] Failed to initialize Google Identity Services:', err);
  });

  if (cachedGoogleUser && cachedAccessToken) {
    if (onAuthSuccess) onAuthSuccess(cachedGoogleUser, cachedAccessToken);
  } else if (!cachedGoogleUser && onAuthFailure) {
    // idle state
  }

  return () => {
    // Cleanup handler
  };
};

/**
 * Authenticates the user with Google Identity Services using initTokenClient.
 * Opens the Google OAuth popup and requests calendar.events scope.
 * Returns { user, accessToken } or null if cancelled/closed.
 */
export const googleSignIn = async (): Promise<{ user: GoogleAuthUser; accessToken: string } | null> => {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error(
      'Google OAuth Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file with your OAuth Web Client ID.'
    );
  }

  if (pendingSignInPromise) {
    return pendingSignInPromise;
  }

  pendingSignInPromise = (async () => {
    try {
      isSigningIn = true;
      await ensureGsiLoaded();

      if (!window.google?.accounts?.oauth2?.initTokenClient) {
        throw new Error('Google Identity Services SDK is not available in the current browser window.');
      }

      const tokenResult = await new Promise<{ accessToken: string } | null>((resolve, reject) => {
        let settled = false;

        try {
          const client = window.google!.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: CALENDAR_SCOPES.join(' '),
            callback: (response: any) => {
              if (settled) return;
              settled = true;

              if (response.error) {
                const errType = response.error;
                const errDesc = response.error_description || errType;
                if (errType === 'access_denied') {
                  reject(
                    new Error(
                      'Access denied: Google Cloud requires adding this account to the OAuth test users list in the Google Cloud Console for project "CIT Scheduling Platform".'
                    )
                  );
                } else if (errType === 'popup_closed' || errType === 'user_cancel') {
                  console.warn('[GoogleAuth] Popup closed or cancelled by user.');
                  resolve(null);
                } else {
                  reject(new Error(errDesc || `Google OAuth error: ${errType}`));
                }
                return;
              }

              if (!response.access_token) {
                console.warn('[GoogleAuth] No access token received in OAuth response.');
                resolve(null);
                return;
              }

              resolve({ accessToken: response.access_token });
            },
            error_callback: (error: any) => {
              if (settled) return;
              settled = true;
              const errType = error?.type || '';
              if (errType === 'popup_closed' || errType === 'user_cancel') {
                console.warn('[GoogleAuth] Popup closed by user before completing sign-in.');
                resolve(null);
              } else {
                reject(new Error(error?.message || `OAuth popup failure: ${errType || 'Unknown error'}`));
              }
            },
          });

          // Trigger popup token request
          client.requestAccessToken({ prompt: '' });
        } catch (initErr: any) {
          settled = true;
          reject(initErr);
        }
      });

      if (!tokenResult) {
        return null;
      }

      cachedAccessToken = tokenResult.accessToken;

      // Retrieve user email from Google's tokeninfo endpoint or primary calendar
      let userEmail = '';
      try {
        const infoRes = await fetch(
          `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(tokenResult.accessToken)}`
        );
        if (infoRes.ok) {
          const info = await infoRes.json();
          userEmail = info.email || '';
        }
      } catch (err: any) {
        console.warn('[GoogleAuth] Could not fetch user email from tokeninfo:', err?.message);
      }

      if (!userEmail) {
        try {
          const calRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
            headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
          });
          if (calRes.ok) {
            const calData = await calRes.json();
            userEmail = calData.id || '';
          }
        } catch (calErr: any) {
          console.warn('[GoogleAuth] Could not fetch primary calendar email:', calErr?.message);
        }
      }

      const user: GoogleAuthUser = {
        email: userEmail || null,
        displayName: userEmail ? userEmail.split('@')[0] : 'Google User',
        uid: userEmail || 'google-user',
      };

      cachedGoogleUser = user;
      return { user, accessToken: tokenResult.accessToken };
    } finally {
      isSigningIn = false;
      pendingSignInPromise = null;
    }
  })();

  return pendingSignInPromise;
};

export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getCachedGoogleUser = (): GoogleAuthUser | null => {
  return cachedGoogleUser;
};

export const googleSignOut = async (): Promise<void> => {
  if (cachedAccessToken && typeof window !== 'undefined' && window.google?.accounts?.oauth2?.revoke) {
    try {
      window.google.accounts.oauth2.revoke(cachedAccessToken, () => {});
    } catch (_) {}
  }
  cachedAccessToken = null;
  cachedGoogleUser = null;
};
