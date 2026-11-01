/**
 * Google Identity Services (GIS) OAuth 2.0 Integration.
 * 
 * ARCHITECTURAL SEPARATION OF SCOPES:
 * 1. STUDENT SIGN-IN:
 *    - Strictly requests NON-SENSITIVE OpenID Connect scopes: 'openid', 'email', 'profile'.
 *    - Does NOT request any Google Calendar scopes or sensitive permissions.
 *    - Does NOT use incremental authorization (include_granted_scopes is false/omitted).
 *    - DOES NOT trigger Google's "Google hasn't verified this app" warning screen!
 * 
 * 2. GOOGLE CALENDAR SYNC (OPTIONAL):
 *    - Completely separated authorization flow ('googleCalendarAuthorize').
 *    - Strictly requested ONLY when an authenticated user explicitly clicks "Connect Google Calendar".
 *    - Requests 'https://www.googleapis.com/auth/calendar.events'.
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
            include_granted_scopes?: boolean;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
          revoke?: (token: string, done?: () => void) => void;
        };
        id?: {
          initialize: (config: any) => void;
          prompt: (notification?: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          revoke: (hint: string, callback?: () => void) => void;
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

/**
 * Standard OpenID Connect scopes for Student Authentication (Non-Sensitive).
 * These are non-sensitive scopes under Google OAuth policies and DO NOT require
 * Google verification or trigger the unverified-app warning screen.
 */
export const STUDENT_SIGNIN_SCOPES = ['openid', 'email', 'profile'];

/**
 * Google Calendar Scope for Optional Timetable Synchronization.
 * This sensitive scope is ONLY requested during explicit Google Calendar connection.
 */
export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
];

// Fallback auth object to preserve backward compatibility for legacy callers
export const auth: any = {
  currentUser: null,
};

// In-memory token cache (never stored in localStorage or persistent storage)
let cachedAccessToken: string | null = null;
let cachedCalendarToken: string | null = null;
let cachedGoogleUser: GoogleAuthUser | null = null;
let runtimeClientId: string | null = null;
let isSigningIn = false;
let pendingSignInPromise: Promise<{ user: GoogleAuthUser; accessToken: string } | null> | null = null;

/**
 * Sets runtime-detected Google Client ID.
 */
export const setRuntimeClientId = (id: string | null): void => {
  runtimeClientId = id ? id.trim() : null;
};

/**
 * Returns the currently active VITE_GOOGLE_CLIENT_ID from Vite environment or backend config.
 */
export const getGoogleClientId = (): string => {
  const envId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  return envId || runtimeClientId || '';
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
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      let checks = 0;
      const interval = setInterval(() => {
        checks++;
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval);
          resolve();
        } else if (checks > 50) {
          clearInterval(interval);
          reject(new Error('Timed out waiting for Google Identity Services library to initialize.'));
        }
      }, 50);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      let checks = 0;
      const interval = setInterval(() => {
        checks++;
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval);
          resolve();
        } else if (checks > 30) {
          clearInterval(interval);
          resolve();
        }
      }, 30);
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services library.'));
    document.head.appendChild(script);
  });
};

/**
 * Initializes Google OAuth listeners, preloads GIS library, and fetches backend client ID if needed.
 */
export const initGoogleAuth = (
  onAuthSuccess?: (user: GoogleAuthUser, token: string) => void,
  onAuthFailure?: () => void
): (() => void) => {
  if (!getGoogleClientId() && typeof window !== 'undefined') {
    fetch('/api/calendar/config')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.client_id) {
          setRuntimeClientId(data.client_id);
        }
      })
      .catch(() => {});
  }

  ensureGsiLoaded().catch((err) => {
    console.warn('[GoogleAuth] Failed to initialize Google Identity Services:', err);
  });

  if (cachedGoogleUser && cachedAccessToken) {
    if (onAuthSuccess) onAuthSuccess(cachedGoogleUser, cachedAccessToken);
  } else if (!cachedGoogleUser && onAuthFailure) {
    // idle state
  }

  return () => {};
};

/**
 * Student Google Sign-In Flow (OpenID Connect / Non-Sensitive Scopes ONLY).
 * 
 * CRITICAL FIX:
 * - Scopes are strictly limited to: 'openid email profile'.
 * - NEVER requests calendar.events or calendar.readonly.
 * - Does NOT set include_granted_scopes: true (ensures no inherited calendar scopes).
 * - Bypasses Google's "Google hasn't verified this app" warning completely.
 */
export const googleStudentSignIn = async (): Promise<{ user: GoogleAuthUser; accessToken: string } | null> => {
  if (typeof window === 'undefined') return null;

  if (isSigningIn && pendingSignInPromise) {
    return pendingSignInPromise;
  }

  pendingSignInPromise = (async () => {
    try {
      isSigningIn = true;
      let clientId = getGoogleClientId();

      if (!clientId) {
        try {
          const cfgRes = await fetch('/api/calendar/config');
          if (cfgRes.ok) {
            const cfg = await cfgRes.json();
            if (cfg.client_id) {
              setRuntimeClientId(cfg.client_id);
              clientId = cfg.client_id;
            }
          }
        } catch (_) {}
      }

      if (!clientId) {
        throw new Error(
          'Google OAuth Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your environment variables.'
        );
      }

      await ensureGsiLoaded();

      if (!window.google?.accounts?.oauth2?.initTokenClient) {
        throw new Error('Google Identity Services SDK is not available in the current browser window.');
      }

      const tokenResult = await new Promise<{ accessToken: string } | null>((resolve, reject) => {
        let settled = false;

        try {
          const client = window.google!.accounts.oauth2.initTokenClient({
            client_id: clientId,
            // Strictly basic identity scopes only — zero sensitive calendar permissions
            scope: STUDENT_SIGNIN_SCOPES.join(' '),
            prompt: 'select_account',
            include_granted_scopes: false,
            callback: (response: any) => {
              if (settled) return;
              settled = true;

              if (response.error) {
                const errType = response.error;
                const errDesc = response.error_description || errType;
                if (errType === 'popup_closed' || errType === 'user_cancel') {
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
              } else if (errType === 'popup_failed_to_open') {
                reject(
                  new Error('Popup blocked: Please allow popups for this site in your browser to sign in with Google.')
                );
              } else {
                reject(new Error(error?.message || `OAuth popup failure: ${errType || 'Unknown error'}`));
              }
            },
          });

          client.requestAccessToken({ prompt: 'select_account' });
        } catch (initErr: any) {
          settled = true;
          reject(initErr);
        }
      });

      if (!tokenResult) {
        return null;
      }

      cachedAccessToken = tokenResult.accessToken;

      // Retrieve user profile from Google's standard userinfo endpoint
      let userEmail = '';
      let userName = '';
      let userPhoto = '';

      try {
        const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
        });
        if (infoRes.ok) {
          const info = await infoRes.json();
          userEmail = info.email || '';
          userName = info.name || info.given_name || '';
          userPhoto = info.picture || '';
        }
      } catch (err: any) {
        console.warn('[GoogleAuth] Could not fetch user profile from userinfo:', err?.message);
      }

      if (!userEmail) {
        try {
          const tRes = await fetch(
            `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(tokenResult.accessToken)}`
          );
          if (tRes.ok) {
            const tData = await tRes.json();
            userEmail = tData.email || '';
          }
        } catch (_) {}
      }

      const user: GoogleAuthUser = {
        email: userEmail || null,
        displayName: userName || (userEmail ? userEmail.split('@')[0] : 'Google User'),
        photoURL: userPhoto || null,
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

/**
 * Optional Google Calendar Authorization Flow.
 * 
 * Exclusively called when an authenticated user explicitly clicks
 * "Connect Google Calendar" in their timetable / dashboard view.
 * Requests 'https://www.googleapis.com/auth/calendar.events'.
 */
export const googleCalendarAuthorize = async (): Promise<{ user: GoogleAuthUser; accessToken: string } | null> => {
  if (typeof window === 'undefined') return null;

  let clientId = getGoogleClientId();
  if (!clientId) {
    try {
      const cfgRes = await fetch('/api/calendar/config');
      if (cfgRes.ok) {
        const cfg = await cfgRes.json();
        if (cfg.client_id) {
          setRuntimeClientId(cfg.client_id);
          clientId = cfg.client_id;
        }
      }
    } catch (_) {}
  }

  if (!clientId) {
    throw new Error(
      'Google OAuth Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your environment variables.'
    );
  }

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
        prompt: 'consent',
        callback: (response: any) => {
          if (settled) return;
          settled = true;

          if (response.error) {
            const errType = response.error;
            const errDesc = response.error_description || errType;
            if (errType === 'access_denied') {
              reject(
                new Error(
                  'Access denied: Google Cloud authorization was rejected or cancelled.'
                )
              );
            } else if (errType === 'popup_closed' || errType === 'user_cancel') {
              console.warn('[GoogleAuth] Calendar popup closed or cancelled by user.');
              resolve(null);
            } else {
              reject(new Error(errDesc || `Google Calendar OAuth error: ${errType}`));
            }
            return;
          }

          if (!response.access_token) {
            console.warn('[GoogleAuth] No access token received in Calendar OAuth response.');
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
            resolve(null);
          } else if (errType === 'popup_failed_to_open') {
            reject(
              new Error('Popup blocked: Please allow popups for this site in your browser to link Google Calendar.')
            );
          } else {
            reject(new Error(error?.message || `Calendar OAuth failure: ${errType || 'Unknown error'}`));
          }
        },
      });

      client.requestAccessToken({ prompt: 'consent' });
    } catch (initErr: any) {
      settled = true;
      reject(initErr);
    }
  });

  if (!tokenResult) {
    return null;
  }

  cachedCalendarToken = tokenResult.accessToken;

  // Retrieve user email
  let userEmail = '';
  try {
    const infoRes = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(tokenResult.accessToken)}`
    );
    if (infoRes.ok) {
      const info = await infoRes.json();
      userEmail = info.email || '';
    }
  } catch (_) {}

  if (!userEmail) {
    try {
      const calRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
        headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
      });
      if (calRes.ok) {
        const calData = await calRes.json();
        userEmail = calData.id || '';
      }
    } catch (_) {}
  }

  const user: GoogleAuthUser = {
    email: userEmail || null,
    displayName: userEmail ? userEmail.split('@')[0] : 'Google User',
    uid: userEmail || 'google-calendar-user',
  };

  return { user, accessToken: tokenResult.accessToken };
};

/**
 * Backward compatibility alias: defaults to the secure, non-sensitive Student Sign-In.
 */
export const googleSignIn = googleStudentSignIn;

export const getGoogleAccessToken = (): string | null => {
  return cachedCalendarToken || cachedAccessToken;
};

export const getCachedGoogleUser = (): GoogleAuthUser | null => {
  return cachedGoogleUser;
};

export const googleSignOut = async (): Promise<void> => {
  const tokenToRevoke = cachedCalendarToken || cachedAccessToken;
  if (tokenToRevoke && typeof window !== 'undefined' && window.google?.accounts?.oauth2?.revoke) {
    try {
      window.google.accounts.oauth2.revoke(tokenToRevoke, () => {});
    } catch (_) {}
  }
  cachedAccessToken = null;
  cachedCalendarToken = null;
  cachedGoogleUser = null;
};
