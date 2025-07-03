import { SpotifyClient } from '../src/spotify-client.js';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SpotifyClient', () => {
  let client: SpotifyClient;
  const mockCreate = jest.fn();
  const mockGet = jest.fn();
  const mockPost = jest.fn();
  const mockPut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock axios.create
    mockCreate.mockReturnValue({
      get: mockGet,
      post: mockPost,
      put: mockPut,
      interceptors: {
        request: {
          use: jest.fn(),
        },
      },
    });
    mockedAxios.create = mockCreate;
    
    // Mock direct axios.post for token refresh
    mockedAxios.post = jest.fn();
    
    client = new SpotifyClient('test_client_id', 'test_client_secret', 'http://localhost:8888');
  });

  describe('constructor', () => {
    it('should initialize with correct parameters', () => {
      expect(mockCreate).toHaveBeenCalledWith({
        baseURL: 'https://api.spotify.com/v1',
        timeout: 10000,
      });
    });

    it('should setup request interceptor', () => {
      const mockAxiosInstance = mockCreate.mock.results[0]?.value;
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });
  });

  describe('token management', () => {
    it('should refresh token when none exists', async () => {
      const mockTokenResponse = {
        data: {
          access_token: 'test_token',
          expires_in: 3600,
          token_type: 'Bearer',
        },
      };
      
      mockedAxios.post.mockResolvedValueOnce(mockTokenResponse);
      mockGet.mockResolvedValueOnce({ data: { tracks: { items: [] } } });

      await client.search('test');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://accounts.spotify.com/api/token',
        expect.any(URLSearchParams),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: expect.stringContaining('Basic '),
          },
        }
      );
    });

    it('should handle token refresh failure', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Token refresh failed'));

      await expect(client.search('test')).rejects.toThrow('Failed to authenticate with Spotify');
    });
  });

  describe('search', () => {
    beforeEach(() => {
      const mockTokenResponse = {
        data: {
          access_token: 'test_token',
          expires_in: 3600,
          token_type: 'Bearer',
        },
      };
      mockedAxios.post.mockResolvedValue(mockTokenResponse);
    });

    it('should search for tracks successfully', async () => {
      const mockSearchResponse = {
        data: {
          tracks: {
            items: [
              {
                id: 'track_id',
                name: 'Test Track',
                artists: [{ id: 'artist_id', name: 'Test Artist' }],
              },
            ],
          },
        },
      };
      
      mockGet.mockResolvedValueOnce(mockSearchResponse);

      const result = await client.search('test track');

      expect(mockGet).toHaveBeenCalledWith('/search', {
        params: {
          q: 'test track',
          type: 'track',
          limit: 10,
        },
      });
      expect(result).toEqual(mockSearchResponse.data);
    });

    it('should search with custom parameters', async () => {
      const mockSearchResponse = { data: { albums: { items: [] } } };
      mockGet.mockResolvedValueOnce(mockSearchResponse);

      await client.search('test', ['album', 'artist'], 20);

      expect(mockGet).toHaveBeenCalledWith('/search', {
        params: {
          q: 'test',
          type: 'album,artist',
          limit: 20,
        },
      });
    });

    it('should handle search errors', async () => {
      mockGet.mockRejectedValueOnce(new Error('Search failed'));

      await expect(client.search('test')).rejects.toThrow('Failed to search Spotify');
    });
  });

  describe('getCurrentTrack', () => {
    it('should throw authentication error', async () => {
      await expect(client.getCurrentTrack()).rejects.toThrow('User authentication required');
    });
  });

  describe('playback control', () => {
    it('should throw authentication error for startPlayback', async () => {
      await expect(client.startPlayback()).rejects.toThrow('User authentication required');
    });

    it('should throw authentication error for pausePlayback', async () => {
      await expect(client.pausePlayback()).rejects.toThrow('User authentication required');
    });

    it('should throw authentication error for skipToNext', async () => {
      await expect(client.skipToNext()).rejects.toThrow('User authentication required');
    });

    it('should throw authentication error for skipToPrevious', async () => {
      await expect(client.skipToPrevious()).rejects.toThrow('User authentication required');
    });
  });

  describe('queue management', () => {
    it('should throw authentication error for addToQueue', async () => {
      await expect(client.addToQueue('spotify:track:123')).rejects.toThrow('User authentication required');
    });

    it('should throw authentication error for getQueue', async () => {
      await expect(client.getQueue()).rejects.toThrow('User authentication required');
    });
  });

  describe('device management', () => {
    it('should throw authentication error for getDevices', async () => {
      await expect(client.getDevices()).rejects.toThrow('User authentication required');
    });
  });

  describe('volume and settings control', () => {
    it('should throw authentication error for setVolume', async () => {
      await expect(client.setVolume(75)).rejects.toThrow('User authentication required');
    });

    it('should throw authentication error for setShuffle', async () => {
      await expect(client.setShuffle(true)).rejects.toThrow('User authentication required');
    });

    it('should throw authentication error for setRepeat', async () => {
      await expect(client.setRepeat('track')).rejects.toThrow('User authentication required');
    });
  });
});