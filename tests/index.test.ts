import { jest } from '@jest/globals';

// Mock the SpotifyClient before importing the main module
jest.mock('../src/spotify-client.js');

import { SpotifyClient } from '../src/spotify-client.js';

const MockedSpotifyClient = SpotifyClient as jest.MockedClass<typeof SpotifyClient>;

describe('SpotifyMCPServer', () => {
  let mockSpotifyClient: jest.Mocked<SpotifyClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock instance
    mockSpotifyClient = {
      search: jest.fn(),
      getCurrentTrack: jest.fn(),
      getPlaybackState: jest.fn(),
      startPlayback: jest.fn(),
      pausePlayback: jest.fn(),
      skipToNext: jest.fn(),
      skipToPrevious: jest.fn(),
      addToQueue: jest.fn(),
      getQueue: jest.fn(),
      getDevices: jest.fn(),
      getTrack: jest.fn(),
      getAlbum: jest.fn(),
      getArtist: jest.fn(),
      getPlaylist: jest.fn(),
      setVolume: jest.fn(),
      setShuffle: jest.fn(),
      setRepeat: jest.fn(),
    } as any;

    MockedSpotifyClient.mockImplementation(() => mockSpotifyClient);
  });

  describe('Environment validation', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should throw error when SPOTIFY_CLIENT_ID is missing', async () => {
      delete process.env.SPOTIFY_CLIENT_ID;
      process.env.SPOTIFY_CLIENT_SECRET = 'test_secret';

      // Import dynamically to trigger constructor
      const { SpotifyMCPServer } = await import('../src/index.js');
      
      expect(() => new (SpotifyMCPServer as any)()).toThrow(
        'SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set'
      );
    });

    it('should throw error when SPOTIFY_CLIENT_SECRET is missing', async () => {
      process.env.SPOTIFY_CLIENT_ID = 'test_id';
      delete process.env.SPOTIFY_CLIENT_SECRET;

      const { SpotifyMCPServer } = await import('../src/index.js');
      
      expect(() => new (SpotifyMCPServer as any)()).toThrow(
        'SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set'
      );
    });

    it('should use default redirect URI when not provided', async () => {
      process.env.SPOTIFY_CLIENT_ID = 'test_id';
      process.env.SPOTIFY_CLIENT_SECRET = 'test_secret';
      delete process.env.SPOTIFY_REDIRECT_URI;

      const { SpotifyMCPServer } = await import('../src/index.js');
      new (SpotifyMCPServer as any)();

      expect(MockedSpotifyClient).toHaveBeenCalledWith(
        'test_id',
        'test_secret',
        'http://localhost:8888'
      );
    });
  });

  describe('Tool implementations', () => {
    beforeEach(() => {
      process.env.SPOTIFY_CLIENT_ID = 'test_id';
      process.env.SPOTIFY_CLIENT_SECRET = 'test_secret';
      process.env.SPOTIFY_REDIRECT_URI = 'http://localhost:8888';
    });

    it('should handle search_spotify tool', async () => {
      const mockSearchResults = {
        tracks: {
          items: [{
            id: 'track_1',
            name: 'Test Track',
            artists: [{
              id: 'artist_1',
              name: 'Test Artist',
              external_urls: { spotify: 'https://open.spotify.com/artist/123' },
              uri: 'spotify:artist:123'
            }],
            album: {
              id: 'album_1',
              name: 'Test Album',
              artists: [{
                id: 'artist_1',
                name: 'Test Artist',
                external_urls: { spotify: 'https://open.spotify.com/artist/123' },
                uri: 'spotify:artist:123'
              }],
              external_urls: { spotify: 'https://open.spotify.com/album/123' },
              uri: 'spotify:album:123',
              release_date: '2023-01-01',
              total_tracks: 10
            },
            duration_ms: 180000,
            explicit: false,
            external_urls: { spotify: 'https://open.spotify.com/track/123' },
            uri: 'spotify:track:123'
          }],
          total: 1,
        },
      };
      
      mockSpotifyClient.search.mockResolvedValueOnce(mockSearchResults);

      const { SpotifyMCPServer } = await import('../src/index.js');
      const server = new (SpotifyMCPServer as any)();
      
      const result = await server.handleSearch({
        query: 'test query',
        types: ['track'],
        limit: 10,
      });

      expect(mockSpotifyClient.search).toHaveBeenCalledWith('test query', ['track'], 10);
      expect(result.content[0].text).toContain('Test Track');
    });

    it('should handle get_current_track tool with authentication error', async () => {
      mockSpotifyClient.getCurrentTrack.mockRejectedValueOnce(new Error('User authentication required'));

      const { SpotifyMCPServer } = await import('../src/index.js');
      const server = new (SpotifyMCPServer as any)();
      
      const result = await server.handleGetCurrentTrack();

      expect(mockSpotifyClient.getCurrentTrack).toHaveBeenCalled();
      expect(result.content[0].text).toContain('User authentication required');
    });


    it('should handle control_playback tool - play action with authentication error', async () => {
      mockSpotifyClient.startPlayback.mockRejectedValueOnce(new Error('User authentication required'));

      const { SpotifyMCPServer } = await import('../src/index.js');
      const server = new (SpotifyMCPServer as any)();
      
      const result = await server.handleControlPlayback({
        action: 'play',
        uri: 'spotify:track:123',
        device_id: 'device_1',
      });

      expect(result.content[0].text).toContain('User authentication required');
    });

    it('should handle manage_queue tool - add action with authentication error', async () => {
      mockSpotifyClient.addToQueue.mockRejectedValueOnce(new Error('User authentication required'));

      const { SpotifyMCPServer } = await import('../src/index.js');
      const server = new (SpotifyMCPServer as any)();
      
      const result = await server.handleManageQueue({
        action: 'add',
        uri: 'spotify:track:123',
      });

      expect(result.content[0].text).toContain('User authentication required');
    });

    it('should handle get_item_details tool - track', async () => {
      const mockTrack = {
        id: 'track_1',
        name: 'Test Track',
        artists: [{ 
          id: 'artist_1', 
          name: 'Test Artist',
          external_urls: { spotify: 'https://open.spotify.com/artist/123' },
          uri: 'spotify:artist:123'
        }],
        album: {
          id: 'album_1',
          name: 'Test Album',
          artists: [{ 
            id: 'artist_1', 
            name: 'Test Artist',
            external_urls: { spotify: 'https://open.spotify.com/artist/123' },
            uri: 'spotify:artist:123'
          }],
          external_urls: { spotify: 'https://open.spotify.com/album/123' },
          uri: 'spotify:album:123',
          release_date: '2023-01-01',
          total_tracks: 10
        },
        duration_ms: 180000,
        explicit: false,
        external_urls: { spotify: 'https://open.spotify.com/track/123' },
        uri: 'spotify:track:123'
      };
      
      mockSpotifyClient.getTrack.mockResolvedValueOnce(mockTrack);

      const { SpotifyMCPServer } = await import('../src/index.js');
      const server = new (SpotifyMCPServer as any)();
      
      const result = await server.handleGetItemDetails({
        id: 'track_1',
        type: 'track',
      });

      expect(mockSpotifyClient.getTrack).toHaveBeenCalledWith('track_1');
      expect(result.content[0].text).toContain('Test Track');
    });

    it('should handle set_volume tool with authentication error', async () => {
      mockSpotifyClient.setVolume.mockRejectedValueOnce(new Error('User authentication required'));

      const { SpotifyMCPServer } = await import('../src/index.js');
      const server = new (SpotifyMCPServer as any)();
      
      const result = await server.handleSetVolume({
        volume: 75,
        device_id: 'device_1',
      });

      expect(result.content[0].text).toContain('User authentication required');
    });

    it('should handle errors gracefully', async () => {
      mockSpotifyClient.search.mockRejectedValueOnce(new Error('API Error'));

      const { SpotifyMCPServer } = await import('../src/index.js');
      const server = new (SpotifyMCPServer as any)();
      
      const result = await server.handleSearch({
        query: 'test',
      });

      expect(result.content[0].text).toBe('Error: API Error');
    });

    it('should handle unknown playback action', async () => {
      const { SpotifyMCPServer } = await import('../src/index.js');
      const server = new (SpotifyMCPServer as any)();
      
      const result = await server.handleControlPlayback({
        action: 'unknown_action',
      });

      expect(result.content[0].text).toBe('Error: Unknown playback action: unknown_action');
    });

    it('should handle missing URI for queue add', async () => {
      const { SpotifyMCPServer } = await import('../src/index.js');
      const server = new (SpotifyMCPServer as any)();
      
      const result = await server.handleManageQueue({
        action: 'add',
      });

      expect(result.content[0].text).toBe('Error: URI is required for add action');
    });
  });
});