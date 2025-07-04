#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolResult,
  TextContent,
} from '@modelcontextprotocol/sdk/types.js';
import { SpotifyClient } from './spotify-client.js';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { URL } from 'url';

// Load environment variables
dotenv.config();

export class SpotifyMCPServer {
  private server: Server;
  private spotifyClient: SpotifyClient;

  constructor() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:8888';

    if (!clientId || !clientSecret) {
      throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set');
    }

    this.spotifyClient = new SpotifyClient(clientId, clientSecret, redirectUri);
    this.server = new Server(
      {
        name: 'spotify-mcp',
        version: '0.2.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'spotify_authorize',
            description: 'Generate authorization URL for Spotify user authentication',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'spotify_auth_status',
            description: 'Check if user is authenticated with Spotify',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'spotify_clear_auth',
            description: 'Clear stored authentication tokens (logout)',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'search_spotify',
            description: 'Search for tracks, albums, artists, or playlists on Spotify',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query',
                },
                types: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['track', 'album', 'artist', 'playlist'],
                  },
                  description: 'Types of content to search for',
                  default: ['track'],
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results to return',
                  default: 10,
                  minimum: 1,
                  maximum: 50,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_item_details',
            description: 'Get detailed information about a Spotify item (track, album, artist, playlist)',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Spotify ID of the item',
                },
                type: {
                  type: 'string',
                  enum: ['track', 'album', 'artist', 'playlist'],
                  description: 'Type of the item',
                },
              },
              required: ['id', 'type'],
            },
          },
          {
            name: 'get_current_track',
            description: 'Get currently playing track (requires user authentication)',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_playback_state',
            description: 'Get current playback state (requires user authentication)',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'play_track',
            description: 'Start playback of tracks or context (requires user authentication)',
            inputSchema: {
              type: 'object',
              properties: {
                uris: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Spotify URIs to play',
                },
                context_uri: {
                  type: 'string',
                  description: 'Spotify context URI (album, playlist, etc.)',
                },
                device_id: {
                  type: 'string',
                  description: 'Device ID to play on',
                },
              },
            },
          },
          {
            name: 'pause_playback',
            description: 'Pause current playback (requires user authentication)',
            inputSchema: {
              type: 'object',
              properties: {
                device_id: {
                  type: 'string',
                  description: 'Device ID to pause',
                },
              },
            },
          },
          {
            name: 'skip_to_next',
            description: 'Skip to next track (requires user authentication)',
            inputSchema: {
              type: 'object',
              properties: {
                device_id: {
                  type: 'string',
                  description: 'Device ID',
                },
              },
            },
          },
          {
            name: 'skip_to_previous',
            description: 'Skip to previous track (requires user authentication)',
            inputSchema: {
              type: 'object',
              properties: {
                device_id: {
                  type: 'string',
                  description: 'Device ID',
                },
              },
            },
          },
          {
            name: 'set_volume',
            description: 'Set playback volume (requires user authentication)',
            inputSchema: {
              type: 'object',
              properties: {
                volume_percent: {
                  type: 'number',
                  description: 'Volume percentage (0-100)',
                  minimum: 0,
                  maximum: 100,
                },
                device_id: {
                  type: 'string',
                  description: 'Device ID',
                },
              },
              required: ['volume_percent'],
            },
          },
          {
            name: 'add_to_queue',
            description: 'Add track to queue (requires user authentication)',
            inputSchema: {
              type: 'object',
              properties: {
                uri: {
                  type: 'string',
                  description: 'Spotify URI of track to add',
                },
                device_id: {
                  type: 'string',
                  description: 'Device ID',
                },
              },
              required: ['uri'],
            },
          },
          {
            name: 'get_queue',
            description: 'Get current playback queue (requires user authentication)',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_devices',
            description: 'Get available playback devices (requires user authentication)',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_recently_played',
            description: 'Get recently played tracks (requires user authentication)',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Number of tracks to return (max 50)',
                  default: 20,
                  minimum: 1,
                  maximum: 50,
                },
              },
            },
          },
          {
            name: 'get_top_tracks',
            description: 'Get user\'s top tracks (requires user authentication)',
            inputSchema: {
              type: 'object',
              properties: {
                time_range: {
                  type: 'string',
                  enum: ['short_term', 'medium_term', 'long_term'],
                  description: 'Time range for top tracks',
                  default: 'medium_term',
                },
                limit: {
                  type: 'number',
                  description: 'Number of tracks to return (max 50)',
                  default: 20,
                  minimum: 1,
                  maximum: 50,
                },
              },
            },
          },
          {
            name: 'get_top_artists',
            description: 'Get user\'s top artists (requires user authentication)',
            inputSchema: {
              type: 'object',
              properties: {
                time_range: {
                  type: 'string',
                  enum: ['short_term', 'medium_term', 'long_term'],
                  description: 'Time range for top artists',
                  default: 'medium_term',
                },
                limit: {
                  type: 'number',
                  description: 'Number of artists to return (max 50)',
                  default: 20,
                  minimum: 1,
                  maximum: 50,
                },
              },
            },
          },
          {
            name: 'get_user_playlists',
            description: 'Get user\'s playlists (requires user authentication)',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Number of playlists to return (max 50)',
                  default: 20,
                  minimum: 1,
                  maximum: 50,
                },
              },
            },
          },
          {
            name: 'get_saved_tracks',
            description: 'Get user\'s saved/liked tracks (requires user authentication)',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Number of tracks to return (max 50)',
                  default: 20,
                  minimum: 1,
                  maximum: 50,
                },
                offset: {
                  type: 'number',
                  description: 'Offset for pagination',
                  default: 0,
                  minimum: 0,
                },
              },
            },
          },
          {
            name: 'get_saved_albums',
            description: 'Get user\'s saved albums (requires user authentication)',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Number of albums to return (max 50)',
                  default: 20,
                  minimum: 1,
                  maximum: 50,
                },
                offset: {
                  type: 'number',
                  description: 'Offset for pagination',
                  default: 0,
                  minimum: 0,
                },
              },
            },
          },
          {
            name: 'get_user_profile',
            description: 'Get user profile information (requires user authentication)',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ] as Tool[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'spotify_authorize':
            return await this.handleAuthorize(args);
          case 'spotify_auth_status':
            return await this.handleAuthStatus(args);
          case 'spotify_clear_auth':
            return await this.handleClearAuth(args);
          case 'search_spotify':
            return await this.handleSearch(args);
          case 'get_item_details':
            return await this.handleGetItemDetails(args);
          case 'get_current_track':
            return await this.handleGetCurrentTrack(args);
          case 'get_playback_state':
            return await this.handleGetPlaybackState(args);
          case 'play_track':
            return await this.handlePlayTrack(args);
          case 'pause_playback':
            return await this.handlePausePlayback(args);
          case 'skip_to_next':
            return await this.handleSkipToNext(args);
          case 'skip_to_previous':
            return await this.handleSkipToPrevious(args);
          case 'set_volume':
            return await this.handleSetVolume(args);
          case 'add_to_queue':
            return await this.handleAddToQueue(args);
          case 'get_queue':
            return await this.handleGetQueue(args);
          case 'get_devices':
            return await this.handleGetDevices(args);
          case 'get_recently_played':
            return await this.handleGetRecentlyPlayed(args);
          case 'get_top_tracks':
            return await this.handleGetTopTracks(args);
          case 'get_top_artists':
            return await this.handleGetTopArtists(args);
          case 'get_user_playlists':
            return await this.handleGetUserPlaylists(args);
          case 'get_saved_tracks':
            return await this.handleGetSavedTracks(args);
          case 'get_saved_albums':
            return await this.handleGetSavedAlbums(args);
          case 'get_user_profile':
            return await this.handleGetUserProfile(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
            } as TextContent,
          ],
        };
      }
    });
  }

  private async handleSearch(args: any): Promise<CallToolResult> {
    const { query, types = ['track'], limit = 10 } = args;
    const results = await this.spotifyClient.search(query, types, limit);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2),
        } as TextContent,
      ],
    };
  }


  private async handleAuthorize(args: any): Promise<CallToolResult> {
    const authUrl = this.spotifyClient.generateAuthUrl();
    
    // Start a simple HTTP server to handle the callback
    this.startCallbackServer();
    
    return {
      content: [
        {
          type: 'text',
          text: `Please visit this URL to authorize Spotify access:\n\n${authUrl}\n\nAfter authorization, you'll be redirected to localhost:8888. The authorization will be automatically processed.`,
        } as TextContent,
      ],
    };
  }

  private async handleAuthStatus(args: any): Promise<CallToolResult> {
    const isAuthenticated = this.spotifyClient.isAuthenticated();
    
    return {
      content: [
        {
          type: 'text',
          text: isAuthenticated ? 'User is authenticated with Spotify' : 'User is not authenticated. Use spotify_authorize to get started.',
        } as TextContent,
      ],
    };
  }

  private async handleClearAuth(args: any): Promise<CallToolResult> {
    this.spotifyClient.clearAuth();
    
    return {
      content: [
        {
          type: 'text',
          text: 'Authentication tokens cleared. Use spotify_authorize to authenticate with a different account.',
        } as TextContent,
      ],
    };
  }

  private async handleGetItemDetails(args: any): Promise<CallToolResult> {
    const { id, type } = args;
    
    let details;
    switch (type) {
      case 'track':
        details = await this.spotifyClient.getTrack(id);
        break;
      case 'album':
        details = await this.spotifyClient.getAlbum(id);
        break;
      case 'artist':
        details = await this.spotifyClient.getArtist(id);
        break;
      case 'playlist':
        details = await this.spotifyClient.getPlaylist(id);
        break;
      default:
        throw new Error(`Unknown item type: ${type}`);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(details, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleGetCurrentTrack(args: any): Promise<CallToolResult> {
    const currentTrack = await this.spotifyClient.getCurrentTrack();
    
    return {
      content: [
        {
          type: 'text',
          text: currentTrack ? JSON.stringify(currentTrack, null, 2) : 'No track currently playing',
        } as TextContent,
      ],
    };
  }

  private async handleGetPlaybackState(args: any): Promise<CallToolResult> {
    const playbackState = await this.spotifyClient.getPlaybackState();
    
    return {
      content: [
        {
          type: 'text',
          text: playbackState ? JSON.stringify(playbackState, null, 2) : 'No active playback session',
        } as TextContent,
      ],
    };
  }

  private async handlePlayTrack(args: any): Promise<CallToolResult> {
    const { uris, context_uri, device_id } = args;
    await this.spotifyClient.startPlayback(device_id, context_uri, uris);
    
    return {
      content: [
        {
          type: 'text',
          text: 'Playback started successfully',
        } as TextContent,
      ],
    };
  }

  private async handlePausePlayback(args: any): Promise<CallToolResult> {
    const { device_id } = args;
    await this.spotifyClient.pausePlayback(device_id);
    
    return {
      content: [
        {
          type: 'text',
          text: 'Playback paused successfully',
        } as TextContent,
      ],
    };
  }

  private async handleSkipToNext(args: any): Promise<CallToolResult> {
    const { device_id } = args;
    await this.spotifyClient.skipToNext(device_id);
    
    return {
      content: [
        {
          type: 'text',
          text: 'Skipped to next track',
        } as TextContent,
      ],
    };
  }

  private async handleSkipToPrevious(args: any): Promise<CallToolResult> {
    const { device_id } = args;
    await this.spotifyClient.skipToPrevious(device_id);
    
    return {
      content: [
        {
          type: 'text',
          text: 'Skipped to previous track',
        } as TextContent,
      ],
    };
  }

  private async handleSetVolume(args: any): Promise<CallToolResult> {
    const { volume_percent, device_id } = args;
    await this.spotifyClient.setVolume(volume_percent, device_id);
    
    return {
      content: [
        {
          type: 'text',
          text: `Volume set to ${volume_percent}%`,
        } as TextContent,
      ],
    };
  }

  private async handleAddToQueue(args: any): Promise<CallToolResult> {
    const { uri, device_id } = args;
    await this.spotifyClient.addToQueue(uri, device_id);
    
    return {
      content: [
        {
          type: 'text',
          text: 'Track added to queue successfully',
        } as TextContent,
      ],
    };
  }

  private async handleGetQueue(args: any): Promise<CallToolResult> {
    const queue = await this.spotifyClient.getQueue();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(queue, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleGetDevices(args: any): Promise<CallToolResult> {
    const devices = await this.spotifyClient.getDevices();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(devices, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleGetRecentlyPlayed(args: any): Promise<CallToolResult> {
    const { limit = 20 } = args;
    const recentlyPlayed = await this.spotifyClient.getRecentlyPlayed(limit);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(recentlyPlayed, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleGetTopTracks(args: any): Promise<CallToolResult> {
    const { time_range = 'medium_term', limit = 20 } = args;
    const topTracks = await this.spotifyClient.getTopTracks(time_range, limit);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(topTracks, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleGetTopArtists(args: any): Promise<CallToolResult> {
    const { time_range = 'medium_term', limit = 20 } = args;
    const topArtists = await this.spotifyClient.getTopArtists(time_range, limit);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(topArtists, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleGetUserPlaylists(args: any): Promise<CallToolResult> {
    const { limit = 20 } = args;
    const playlists = await this.spotifyClient.getUserPlaylists(limit);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(playlists, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleGetSavedTracks(args: any): Promise<CallToolResult> {
    const { limit = 20, offset = 0 } = args;
    const savedTracks = await this.spotifyClient.getSavedTracks(limit, offset);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(savedTracks, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleGetSavedAlbums(args: any): Promise<CallToolResult> {
    const { limit = 20, offset = 0 } = args;
    const savedAlbums = await this.spotifyClient.getSavedAlbums(limit, offset);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(savedAlbums, null, 2),
        } as TextContent,
      ],
    };
  }

  private async handleGetUserProfile(args: any): Promise<CallToolResult> {
    const userProfile = await this.spotifyClient.getUserProfile();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(userProfile, null, 2),
        } as TextContent,
      ],
    };
  }

  private startCallbackServer(): void {
    const server = createServer((req, res) => {
      if (req.url?.startsWith('/')) {
        const url = new URL(req.url, 'http://localhost:8888');
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`<h1>Authorization failed</h1><p>Error: ${error}</p>`);
          server.close();
          return;
        }

        if (code && state) {
          this.spotifyClient.handleAuthCallback(code, state)
            .then(() => {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end('<h1>Authorization successful!</h1><p>You can close this window and return to Claude.</p>');
              server.close();
            })
            .catch((err) => {
              res.writeHead(400, { 'Content-Type': 'text/html' });
              res.end(`<h1>Authorization failed</h1><p>Error: ${err.message}</p>`);
              server.close();
            });
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>Missing authorization parameters</h1>');
          server.close();
        }
      }
    });

    server.listen(8888, () => {
      console.error('Authorization callback server listening on port 8888');
    });

    // Close server after 5 minutes if no callback received
    setTimeout(() => {
      server.close();
    }, 5 * 60 * 1000);
  }


  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Spotify MCP server running on stdio');
    console.error('Use spotify_authorize tool to authenticate with your Spotify account');
  }
}

async function main() {
  try {
    const server = new SpotifyMCPServer();
    await server.run();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (import.meta.url === new URL(import.meta.url).href) {
  main().catch(console.error);
}