import axios, { AxiosInstance } from 'axios';
import { 
  SpotifyTrack, 
  SpotifySearchResults, 
  SpotifyCurrentlyPlaying, 
  SpotifyPlaybackState,
  SpotifyQueue,
  SpotifyDevice,
  SpotifyTokenResponse
} from './types.js';

export class SpotifyClient {
  private api: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;

    this.api = axios.create({
      baseURL: 'https://api.spotify.com/v1',
      timeout: 10000,
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(async (config) => {
      await this.ensureValidToken();
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.refreshToken();
    }
  }

  private async refreshToken(): Promise<void> {
    try {
      const response = await axios.post<SpotifyTokenResponse>(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'client_credentials',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1 min early
    } catch (error) {
      console.error('Failed to refresh Spotify token:', error);
      throw new Error('Failed to authenticate with Spotify');
    }
  }

  async search(query: string, types: string[] = ['track'], limit: number = 10): Promise<SpotifySearchResults> {
    try {
      const response = await this.api.get('/search', {
        params: {
          q: query,
          type: types.join(','),
          limit,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Search failed:', error);
      throw new Error('Failed to search Spotify');
    }
  }

  async getCurrentTrack(): Promise<SpotifyCurrentlyPlaying | null> {
    throw new Error('User authentication required: getCurrentTrack requires user authorization. Client Credentials flow only supports public data access.');
  }

  async getPlaybackState(): Promise<SpotifyPlaybackState | null> {
    throw new Error('User authentication required: getPlaybackState requires user authorization. Client Credentials flow only supports public data access.');
  }

  async startPlayback(deviceId?: string, contextUri?: string, uris?: string[]): Promise<void> {
    throw new Error('User authentication required: startPlayback requires user authorization. Client Credentials flow only supports public data access.');
  }

  async pausePlayback(deviceId?: string): Promise<void> {
    throw new Error('User authentication required: pausePlayback requires user authorization. Client Credentials flow only supports public data access.');
  }

  async skipToNext(deviceId?: string): Promise<void> {
    throw new Error('User authentication required: skipToNext requires user authorization. Client Credentials flow only supports public data access.');
  }

  async skipToPrevious(deviceId?: string): Promise<void> {
    throw new Error('User authentication required: skipToPrevious requires user authorization. Client Credentials flow only supports public data access.');
  }

  async addToQueue(uri: string, deviceId?: string): Promise<void> {
    throw new Error('User authentication required: addToQueue requires user authorization. Client Credentials flow only supports public data access.');
  }

  async getQueue(): Promise<SpotifyQueue> {
    throw new Error('User authentication required: getQueue requires user authorization. Client Credentials flow only supports public data access.');
  }

  async getDevices(): Promise<SpotifyDevice[]> {
    throw new Error('User authentication required: getDevices requires user authorization. Client Credentials flow only supports public data access.');
  }

  async getTrack(trackId: string): Promise<SpotifyTrack> {
    try {
      const response = await this.api.get(`/tracks/${trackId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get track:', error);
      throw new Error('Failed to get track');
    }
  }

  async getAlbum(albumId: string): Promise<any> {
    try {
      const response = await this.api.get(`/albums/${albumId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get album:', error);
      throw new Error('Failed to get album');
    }
  }

  async getArtist(artistId: string): Promise<any> {
    try {
      const response = await this.api.get(`/artists/${artistId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get artist:', error);
      throw new Error('Failed to get artist');
    }
  }

  async getPlaylist(playlistId: string): Promise<any> {
    try {
      const response = await this.api.get(`/playlists/${playlistId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get playlist:', error);
      throw new Error('Failed to get playlist');
    }
  }

  async setVolume(volumePercent: number, deviceId?: string): Promise<void> {
    throw new Error('User authentication required: setVolume requires user authorization. Client Credentials flow only supports public data access.');
  }

  async setShuffle(state: boolean, deviceId?: string): Promise<void> {
    throw new Error('User authentication required: setShuffle requires user authorization. Client Credentials flow only supports public data access.');
  }

  async setRepeat(state: 'off' | 'track' | 'context', deviceId?: string): Promise<void> {
    throw new Error('User authentication required: setRepeat requires user authorization. Client Credentials flow only supports public data access.');
  }
}