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
    try {
      const response = await this.api.get('/me/player/currently-playing');
      return response.data || null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 204) {
        return null; // No track playing
      }
      console.error('Failed to get current track:', error);
      throw new Error('Failed to get current track');
    }
  }

  async getPlaybackState(): Promise<SpotifyPlaybackState | null> {
    try {
      const response = await this.api.get('/me/player');
      return response.data || null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 204) {
        return null;
      }
      console.error('Failed to get playback state:', error);
      throw new Error('Failed to get playback state');
    }
  }

  async startPlayback(deviceId?: string, contextUri?: string, uris?: string[]): Promise<void> {
    try {
      const body: any = {};
      if (contextUri) {
        body.context_uri = contextUri;
      }
      if (uris) {
        body.uris = uris;
      }

      const params = deviceId ? { device_id: deviceId } : {};
      
      await this.api.put('/me/player/play', body, { params });
    } catch (error) {
      console.error('Failed to start playback:', error);
      throw new Error('Failed to start playback');
    }
  }

  async pausePlayback(deviceId?: string): Promise<void> {
    try {
      const params = deviceId ? { device_id: deviceId } : {};
      await this.api.put('/me/player/pause', {}, { params });
    } catch (error) {
      console.error('Failed to pause playback:', error);
      throw new Error('Failed to pause playback');
    }
  }

  async skipToNext(deviceId?: string): Promise<void> {
    try {
      const params = deviceId ? { device_id: deviceId } : {};
      await this.api.post('/me/player/next', {}, { params });
    } catch (error) {
      console.error('Failed to skip to next track:', error);
      throw new Error('Failed to skip to next track');
    }
  }

  async skipToPrevious(deviceId?: string): Promise<void> {
    try {
      const params = deviceId ? { device_id: deviceId } : {};
      await this.api.post('/me/player/previous', {}, { params });
    } catch (error) {
      console.error('Failed to skip to previous track:', error);
      throw new Error('Failed to skip to previous track');
    }
  }

  async addToQueue(uri: string, deviceId?: string): Promise<void> {
    try {
      const params: any = { uri };
      if (deviceId) {
        params.device_id = deviceId;
      }
      await this.api.post('/me/player/queue', {}, { params });
    } catch (error) {
      console.error('Failed to add to queue:', error);
      throw new Error('Failed to add to queue');
    }
  }

  async getQueue(): Promise<SpotifyQueue> {
    try {
      const response = await this.api.get('/me/player/queue');
      return response.data;
    } catch (error) {
      console.error('Failed to get queue:', error);
      throw new Error('Failed to get queue');
    }
  }

  async getDevices(): Promise<SpotifyDevice[]> {
    try {
      const response = await this.api.get('/me/player/devices');
      return response.data.devices || [];
    } catch (error) {
      console.error('Failed to get devices:', error);
      throw new Error('Failed to get devices');
    }
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
    try {
      const params: any = { volume_percent: Math.max(0, Math.min(100, volumePercent)) };
      if (deviceId) {
        params.device_id = deviceId;
      }
      await this.api.put('/me/player/volume', {}, { params });
    } catch (error) {
      console.error('Failed to set volume:', error);
      throw new Error('Failed to set volume');
    }
  }

  async setShuffle(state: boolean, deviceId?: string): Promise<void> {
    try {
      const params: any = { state };
      if (deviceId) {
        params.device_id = deviceId;
      }
      await this.api.put('/me/player/shuffle', {}, { params });
    } catch (error) {
      console.error('Failed to set shuffle:', error);
      throw new Error('Failed to set shuffle');
    }
  }

  async setRepeat(state: 'off' | 'track' | 'context', deviceId?: string): Promise<void> {
    try {
      const params: any = { state };
      if (deviceId) {
        params.device_id = deviceId;
      }
      await this.api.put('/me/player/repeat', {}, { params });
    } catch (error) {
      console.error('Failed to set repeat:', error);
      throw new Error('Failed to set repeat');
    }
  }
}