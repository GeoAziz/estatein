// OAuth authentication service for Google and Apple

import axios from 'axios';
import * as jwt from 'jsonwebtoken';

export interface GoogleTokenPayload {
  iss: string;
  sub: string;
  aud: string;
  iat: number;
  exp: number;
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
}

export interface AppleTokenPayload {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string;
  nonce?: string;
  email?: string;
  email_verified?: string;
  is_private_email?: string;
  real_user_status?: number;
}

export interface OAuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
}

class GoogleOAuthProvider {
  private clientId: string;
  private clientSecret: string;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  async verifyToken(idToken: string): Promise<GoogleTokenPayload> {
    try {
      // Verify and decode the ID token
      const ticket = await this.verifyIdToken(idToken);
      return ticket.getPayload() as unknown as GoogleTokenPayload;
    } catch (error) {
      throw new Error(`Google token verification failed: ${error}`);
    }
  }

  async verifyIdToken(token: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?id_token=${token}`
      );
      return {
        getPayload: () => response.data,
      };
    } catch (error) {
      throw new Error('Invalid Google ID token');
    }
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<any> {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      return response.data;
    } catch (error) {
      throw new Error(`Google token exchange failed: ${error}`);
    }
  }

  extractUser(payload: GoogleTokenPayload): OAuthUser {
    return {
      id: `google_${payload.sub}`,
      email: payload.email,
      name: payload.name,
      avatar: payload.picture,
    };
  }
}

class AppleOAuthProvider {
  private clientId: string;
  private teamId: string;
  private keyId: string;
  private privateKey: string;

  constructor(clientId: string, teamId: string, keyId: string, privateKey: string) {
    this.clientId = clientId;
    this.teamId = teamId;
    this.keyId = keyId;
    this.privateKey = privateKey;
  }

  private generateClientSecret(): string {
    const header = {
      alg: 'ES256',
      typ: 'JWT',
      kid: this.keyId,
    };

    const payload = {
      iss: this.teamId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15777000, // 6 months
      aud: 'https://appleid.apple.com',
      sub: this.clientId,
    };

    return jwt.sign(payload, this.privateKey, {
      algorithm: 'ES256',
      header,
    });
  }

  async verifyToken(idToken: string): Promise<AppleTokenPayload> {
    try {
      // Get Apple's public keys
      const response = await axios.get('https://appleid.apple.com/auth/keys');
      const keys = response.data.keys;

      // Verify the token
      const decoded = jwt.decode(idToken, { complete: true }) as any;

      if (!decoded) {
        throw new Error('Invalid token format');
      }

      // Find the key used to sign the token
      const key = keys.find((k: any) => k.kid === decoded.header.kid);

      if (!key) {
        throw new Error('Key not found');
      }

      // Convert JWK to PEM
      const publicKey = this.jwkToPem(key);

      // Verify the signature
      jwt.verify(idToken, publicKey, {
        algorithms: ['RS256'],
        audience: this.clientId,
        issuer: 'https://appleid.apple.com',
      });

      return decoded.payload as AppleTokenPayload;
    } catch (error) {
      throw new Error(`Apple token verification failed: ${error}`);
    }
  }

  async exchangeCodeForToken(code: string): Promise<any> {
    try {
      const clientSecret = this.generateClientSecret();

      const response = await axios.post('https://appleid.apple.com/auth/token', {
        client_id: this.clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
      });

      return response.data;
    } catch (error) {
      throw new Error(`Apple token exchange failed: ${error}`);
    }
  }

  extractUser(payload: AppleTokenPayload, userInfo?: any): OAuthUser {
    return {
      id: `apple_${payload.sub}`,
      email: payload.email || userInfo?.email || '',
      name: userInfo?.name?.firstName
        ? `${userInfo.name.firstName} ${userInfo.name.lastName || ''}`
        : 'Apple User',
    };
  }

  private jwkToPem(jwk: any): string {
    // This is a simplified version. In production, use a library like 'jwk-to-pem'
    // For now, we'll construct the PEM format from JWK
    const crypto = require('crypto');

    if (jwk.kty === 'RSA') {
      const modulusBuffer = Buffer.from(jwk.n, 'base64');
      const exponentBuffer = Buffer.from(jwk.e, 'base64');

      const publicKey = crypto.createPublicKey({
        key: {
          kty: 'RSA',
          n: modulusBuffer,
          e: exponentBuffer,
        },
        format: 'jwk',
      });

      return publicKey.export({ format: 'pem', type: 'spki' });
    }

    throw new Error('Unsupported key type');
  }
}

export function createGoogleProvider(clientId: string, clientSecret: string): GoogleOAuthProvider {
  return new GoogleOAuthProvider(clientId, clientSecret);
}

export function createAppleProvider(
  clientId: string,
  teamId: string,
  keyId: string,
  privateKey: string
): AppleOAuthProvider {
  return new AppleOAuthProvider(clientId, teamId, keyId, privateKey);
}
