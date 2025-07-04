import { createHash, randomBytes } from 'crypto';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import axios from 'axios';

interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  scope: string;
}

export class SpotifyAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private tokenPath: string;
  private scopes = [
    'user-read-private',
    'user-read-email',
    'user-library-read',
    'user-library-modify',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-read-recently-played',
    'user-top-read',
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-private',
    'playlist-modify-public',
    'user-follow-read',
    'user-follow-modify',
  ];

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.tokenPath = join(homedir(), '.spotify-mcp-tokens.json');
  }

  generateAuthUrl(): string {
    const state = randomBytes(16).toString('hex');
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
    
    // Store these for later use
    this.saveTemporaryData({ state, codeVerifier });
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope: this.scopes.join(' '),
      redirect_uri: this.redirectUri,
      state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, state: string): Promise<void> {
    const tempData = this.loadTemporaryData();
    
    if (!tempData || tempData.state !== state) {
      throw new Error('Invalid state parameter');
    }

    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', 
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
          code_verifier: tempData.codeVerifier,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const tokenData: TokenData = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_at: Date.now() + (response.data.expires_in * 1000),
        scope: response.data.scope,
      };

      this.saveTokens(tokenData);
      this.clearTemporaryData();
      
    } catch (error) {
      console.error('Token exchange failed:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  async getValidAccessToken(): Promise<string> {
    const tokenData = this.loadTokens();
    
    if (!tokenData) {
      throw new Error('No tokens available. Please authorize first.');
    }

    // Check if token is expired
    if (Date.now() >= tokenData.expires_at - 60000) { // Refresh 1 minute early
      if (!tokenData.refresh_token) {
        throw new Error('Access token expired and no refresh token available. Please re-authorize.');
      }
      
      await this.refreshToken(tokenData.refresh_token);
      return this.loadTokens()!.access_token;
    }

    return tokenData.access_token;
  }

  private async refreshToken(refreshToken: string): Promise<void> {
    try {
      const response = await axios.post('https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.clientId,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
          },
        }
      );

      const tokenData: TokenData = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token || refreshToken, // Keep old refresh token if new one not provided
        expires_at: Date.now() + (response.data.expires_in * 1000),
        scope: response.data.scope,
      };

      this.saveTokens(tokenData);
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Failed to refresh access token. Please re-authorize.');
    }
  }

  isAuthenticated(): boolean {
    const tokenData = this.loadTokens();
    return tokenData !== null;
  }

  clearTokens(): void {
    try {
      if (existsSync(this.tokenPath)) {
        writeFileSync(this.tokenPath, '');
      }
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  private saveTokens(tokenData: TokenData): void {
    try {
      writeFileSync(this.tokenPath, JSON.stringify(tokenData, null, 2), { mode: 0o600 });
    } catch (error) {
      console.error('Failed to save tokens:', error);
      throw new Error('Failed to save authentication tokens');
    }
  }

  private loadTokens(): TokenData | null {
    try {
      if (!existsSync(this.tokenPath)) {
        return null;
      }
      
      const data = readFileSync(this.tokenPath, 'utf8');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load tokens:', error);
      return null;
    }
  }

  private saveTemporaryData(data: { state: string; codeVerifier: string }): void {
    const tempPath = join(homedir(), '.spotify-mcp-temp.json');
    try {
      writeFileSync(tempPath, JSON.stringify(data), { mode: 0o600 });
    } catch (error) {
      console.error('Failed to save temporary data:', error);
    }
  }

  private loadTemporaryData(): { state: string; codeVerifier: string } | null {
    const tempPath = join(homedir(), '.spotify-mcp-temp.json');
    try {
      if (!existsSync(tempPath)) {
        return null;
      }
      
      const data = readFileSync(tempPath, 'utf8');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load temporary data:', error);
      return null;
    }
  }

  private clearTemporaryData(): void {
    const tempPath = join(homedir(), '.spotify-mcp-temp.json');
    try {
      if (existsSync(tempPath)) {
        writeFileSync(tempPath, '');
      }
    } catch (error) {
      console.error('Failed to clear temporary data:', error);
    }
  }
}