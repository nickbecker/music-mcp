import axios, { AxiosInstance } from 'axios';
import { SpotifyAuth } from './auth.js';
import { 
  SpotifyTrack, 
  SpotifySearchResults, 
  SpotifyCurrentlyPlaying, 
  SpotifyPlaybackState,
  SpotifyQueue,
  SpotifyDevice
} from './types.js';

export class SpotifyClient {
  private api: AxiosInstance;
  private auth: SpotifyAuth;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.auth = new SpotifyAuth(clientId, clientSecret, redirectUri);

    this.api = axios.create({
      baseURL: 'https://api.spotify.com/v1',
      timeout: 10000,
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(async (config) => {
      try {
        const token = await this.auth.getValidAccessToken();
        config.headers.Authorization = `Bearer ${token}`;
        console.error(`Making API request to ${config.url} with token: ${token.substring(0, 20)}...`);
      } catch (error) {
        console.error(`Authentication failed for ${config.url}:`, error);
        throw new Error(`Authentication required: ${error instanceof Error ? error.message : 'Unknown auth error'}`);
      }
      return config;
    });
  }

  // Auth management methods
  generateAuthUrl(): string {
    return this.auth.generateAuthUrl();
  }

  async handleAuthCallback(code: string, state: string): Promise<void> {
    await this.auth.exchangeCodeForToken(code, state);
  }

  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  clearAuth(): void {
    this.auth.clearTokens();
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
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`Failed to get current track (${status}): ${message}`);
      }
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
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`Failed to get playback state (${status}): ${message}`);
      }
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
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`Failed to get devices (${status}): ${message}`);
      }
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

  // User-specific data methods
  async getRecentlyPlayed(limit: number = 20): Promise<any> {
    try {
      const response = await this.api.get('/me/player/recently-played', {
        params: { limit: Math.min(limit, 50) }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get recently played:', error);
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`Failed to get recently played tracks (${status}): ${message}`);
      }
      throw new Error('Failed to get recently played tracks');
    }
  }

  async getTopTracks(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit: number = 20): Promise<any> {
    try {
      const response = await this.api.get('/me/top/tracks', {
        params: { time_range: timeRange, limit: Math.min(limit, 50) }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get top tracks:', error);
      throw new Error('Failed to get top tracks');
    }
  }

  async getTopArtists(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit: number = 20): Promise<any> {
    try {
      const response = await this.api.get('/me/top/artists', {
        params: { time_range: timeRange, limit: Math.min(limit, 50) }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get top artists:', error);
      throw new Error('Failed to get top artists');
    }
  }

  async getUserPlaylists(limit: number = 50): Promise<any> {
    try {
      const response = await this.api.get('/me/playlists', {
        params: { limit: Math.min(limit, 50) }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get user playlists:', error);
      throw new Error('Failed to get user playlists');
    }
  }

  async getSavedTracks(limit: number = 20, offset: number = 0): Promise<any> {
    try {
      const response = await this.api.get('/me/tracks', {
        params: { limit: Math.min(limit, 50), offset }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get saved tracks:', error);
      throw new Error('Failed to get saved tracks');
    }
  }

  async getSavedAlbums(limit: number = 20, offset: number = 0): Promise<any> {
    try {
      const response = await this.api.get('/me/albums', {
        params: { limit: Math.min(limit, 50), offset }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get saved albums:', error);
      throw new Error('Failed to get saved albums');
    }
  }

  async getUserProfile(): Promise<any> {
    try {
      const response = await this.api.get('/me');
      return response.data;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`Failed to get user profile (${status}): ${message}`);
      }
      throw new Error('Failed to get user profile');
    }
  }
}