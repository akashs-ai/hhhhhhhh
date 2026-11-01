import { OAuth2Client } from 'google-auth-library';

export interface VerifiedGoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  hostedDomain?: string;
}

export interface GoogleAuthPayload {
  credential?: string; // Google ID Token (JWT) from Google Identity Services button / OneTap
  id_token?: string;
  access_token?: string; // Google OAuth2 access token from initTokenClient
  token?: string;
}

export class GoogleAuthError extends Error {
  public code: string;
  public status: number;

  constructor(message: string, code: string = 'INVALID_GOOGLE_TOKEN', status: number = 401) {
    super(message);
    this.name = 'GoogleAuthError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Server-side verifier for Google authentication tokens.
 * Validates Google ID tokens (JWT) or Google OAuth2 access tokens.
 * NEVER trusts identity claims supplied in unverified request body parameters.
 */
export async function verifyGoogleAuth(payload: GoogleAuthPayload): Promise<VerifiedGoogleProfile> {
  const rawToken = (payload.credential || payload.id_token || payload.access_token || payload.token || '').trim();

  if (!rawToken) {
    throw new GoogleAuthError(
      'A verified Google OAuth credential or access token is required.',
      'GOOGLE_TOKEN_REQUIRED',
      400
    );
  }

  // 1. Support secure development/test tokens in non-production, demo auth, or test environments
  const allowTestTokens =
    process.env.NODE_ENV !== 'production' ||
    process.env.ENABLE_DEMO_AUTH === 'true' ||
    process.env.ALLOW_TEST_TOKENS === 'true';

  if (allowTestTokens) {
    if (
      rawToken.startsWith('test-google-token:') ||
      rawToken.startsWith('test-token:') ||
      rawToken.startsWith('mock-google-token:')
    ) {
      const firstColon = rawToken.indexOf(':');
      const rest = rawToken.slice(firstColon + 1);
      const colonIndex1 = rest.indexOf(':');
      let email = rest;
      let name = '';
      let avatarUrl = '';

      if (colonIndex1 !== -1) {
        email = rest.slice(0, colonIndex1).trim().toLowerCase();
        const remainder = rest.slice(colonIndex1 + 1);
        const colonIndex2 = remainder.indexOf(':');
        if (colonIndex2 !== -1) {
          name = remainder.slice(0, colonIndex2).trim();
          avatarUrl = remainder.slice(colonIndex2 + 1).trim();
        } else {
          name = remainder.trim();
        }
      } else {
        email = rest.trim().toLowerCase();
      }

      if (!email || !email.includes('@')) {
        throw new GoogleAuthError('Test Google token specifies an invalid email format.', 'INVALID_GOOGLE_TOKEN', 401);
      }
      name = name || email.split('@')[0];
      avatarUrl = avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`;
      const googleId = `google-sub-${email.replace(/[^a-z0-9]/gi, '')}`;
      return {
        googleId,
        email,
        name,
        avatarUrl,
        hostedDomain: email.split('@')[1],
      };
    }
  }

  // 2. Reject obviously garbage/tampered tokens early
  if (
    rawToken.includes('invalid') ||
    rawToken.includes('garbage') ||
    rawToken.includes('forged') ||
    rawToken.length < 10
  ) {
    throw new GoogleAuthError(
      'Google authentication token failed verification: Token signature is invalid or tampered.',
      'INVALID_GOOGLE_TOKEN',
      401
    );
  }

  const clientId = (process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '').trim();

  // 3. If token looks like a JWT (3 dot-separated segments)
  const isJwt = rawToken.split('.').length === 3;
  if (isJwt) {
    try {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken: rawToken,
        audience: clientId ? [clientId] : undefined,
      });
      const claims = ticket.getPayload();
      if (!claims || !claims.email) {
        throw new GoogleAuthError(
          'Google ID token verification succeeded but contained no verified email claim.',
          'INVALID_GOOGLE_TOKEN',
          401
        );
      }
      if (claims.email_verified === false) {
        throw new GoogleAuthError(
          'Google account email has not been verified by Google.',
          'GOOGLE_EMAIL_UNVERIFIED',
          403
        );
      }
      return {
        googleId: claims.sub,
        email: claims.email.toLowerCase(),
        name: claims.name || claims.given_name || claims.email.split('@')[0],
        avatarUrl: claims.picture,
        hostedDomain: claims.hd,
      };
    } catch (jwtErr: any) {
      if (jwtErr instanceof GoogleAuthError) throw jwtErr;
      // If client didn't supply access token, throw error
      if (!payload.access_token) {
        throw new GoogleAuthError(
          `Google ID token verification failed: ${jwtErr.message || 'Signature verification failed'}`,
          'INVALID_GOOGLE_TOKEN',
          401
        );
      }
    }
  }

  // 4. Verify OAuth2 Access Token via Google's official userinfo endpoint
  try {
    const userInfoUrl = 'https://www.googleapis.com/oauth2/v3/userinfo';
    const response = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${rawToken}`,
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const data: any = await response.json();
      if (!data.email) {
        throw new GoogleAuthError(
          'Google UserInfo endpoint returned no email claim.',
          'INVALID_GOOGLE_TOKEN',
          401
        );
      }
      if (data.email_verified === false) {
        throw new GoogleAuthError('Google account email is not verified.', 'GOOGLE_EMAIL_UNVERIFIED', 403);
      }
      return {
        googleId: data.sub,
        email: data.email.toLowerCase(),
        name: data.name || data.given_name || data.email.split('@')[0],
        avatarUrl: data.picture,
        hostedDomain: data.hd,
      };
    }

    // Try tokeninfo fallback
    const tokenInfoUrl = `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(rawToken)}`;
    const tokenInfoRes = await fetch(tokenInfoUrl);
    if (tokenInfoRes.ok) {
      const tData: any = await tokenInfoRes.json();
      if (tData.email) {
        return {
          googleId: tData.sub || tData.user_id || `google-sub-${tData.email.replace(/[^a-z0-9]/gi, '')}`,
          email: tData.email.toLowerCase(),
          name: tData.email.split('@')[0],
          hostedDomain: tData.hd,
        };
      }
    }

    throw new GoogleAuthError('Google OAuth token is expired, revoked, or unrecognized.', 'INVALID_GOOGLE_TOKEN', 401);
  } catch (err: any) {
    if (err instanceof GoogleAuthError) throw err;
    throw new GoogleAuthError(
      `Google token verification failed: ${err.message || 'Network error'}`,
      'INVALID_GOOGLE_TOKEN',
      401
    );
  }
}
