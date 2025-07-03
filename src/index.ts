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

// Load environment variables
dotenv.config();

class SpotifyMCPServer {
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
            name: 'get_current_track',
            description: 'Get information about the currently playing track',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_playback_state',
            description: 'Get detailed playback state information',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'control_playback',
            description: 'Control Spotify playback (play, pause, next, previous)',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['play', 'pause', 'next', 'previous'],
                  description: 'Playback action to perform',
                },
                uri: {
                  type: 'string',
                  description: 'Spotify URI to play (only for play action)',
                },
                device_id: {
                  type: 'string',
                  description: 'Target device ID (optional)',
                },
              },
              required: ['action'],
            },
          },
          {
            name: 'manage_queue',
            description: 'Add tracks to queue or get current queue',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['add', 'get'],
                  description: 'Queue action to perform',
                },
                uri: {
                  type: 'string',
                  description: 'Spotify URI to add to queue (required for add action)',
                },
                device_id: {
                  type: 'string',
                  description: 'Target device ID (optional)',
                },
              },
              required: ['action'],
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
            name: 'get_devices',
            description: 'Get list of available Spotify devices',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'set_volume',
            description: 'Set playback volume',
            inputSchema: {
              type: 'object',
              properties: {
                volume: {
                  type: 'number',
                  description: 'Volume percentage (0-100)',
                  minimum: 0,
                  maximum: 100,
                },
                device_id: {
                  type: 'string',
                  description: 'Target device ID (optional)',
                },
              },
              required: ['volume'],
            },
          },
          {
            name: 'set_shuffle',
            description: 'Enable or disable shuffle mode',
            inputSchema: {
              type: 'object',
              properties: {
                state: {
                  type: 'boolean',
                  description: 'Enable (true) or disable (false) shuffle',
                },
                device_id: {
                  type: 'string',
                  description: 'Target device ID (optional)',
                },
              },
              required: ['state'],
            },
          },
          {
            name: 'set_repeat',
            description: 'Set repeat mode',
            inputSchema: {
              type: 'object',
              properties: {
                state: {
                  type: 'string',
                  enum: ['off', 'track', 'context'],
                  description: 'Repeat mode: off, track, or context',
                },
                device_id: {
                  type: 'string',
                  description: 'Target device ID (optional)',
                },
              },
              required: ['state'],
            },
          },
        ] as Tool[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'search_spotify':
            return await this.handleSearch(args);
          case 'get_current_track':
            return await this.handleGetCurrentTrack();
          case 'get_playback_state':
            return await this.handleGetPlaybackState();
          case 'control_playback':
            return await this.handleControlPlayback(args);
          case 'manage_queue':
            return await this.handleManageQueue(args);
          case 'get_item_details':
            return await this.handleGetItemDetails(args);
          case 'get_devices':
            return await this.handleGetDevices();
          case 'set_volume':
            return await this.handleSetVolume(args);
          case 'set_shuffle':
            return await this.handleSetShuffle(args);
          case 'set_repeat':
            return await this.handleSetRepeat(args);
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

  private async handleGetCurrentTrack(): Promise<CallToolResult> {
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

  private async handleGetPlaybackState(): Promise<CallToolResult> {
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

  private async handleControlPlayback(args: any): Promise<CallToolResult> {
    const { action, uri, device_id } = args;
    
    switch (action) {
      case 'play':
        if (uri) {
          if (uri.includes(':track:')) {
            await this.spotifyClient.startPlayback(device_id, undefined, [uri]);
          } else {
            await this.spotifyClient.startPlayback(device_id, uri);
          }
        } else {
          await this.spotifyClient.startPlayback(device_id);
        }
        break;
      case 'pause':
        await this.spotifyClient.pausePlayback(device_id);
        break;
      case 'next':
        await this.spotifyClient.skipToNext(device_id);
        break;
      case 'previous':
        await this.spotifyClient.skipToPrevious(device_id);
        break;
      default:
        throw new Error(`Unknown playback action: ${action}`);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Successfully executed ${action} command`,
        } as TextContent,
      ],
    };
  }

  private async handleManageQueue(args: any): Promise<CallToolResult> {
    const { action, uri, device_id } = args;
    
    switch (action) {
      case 'add':
        if (!uri) {
          throw new Error('URI is required for add action');
        }
        await this.spotifyClient.addToQueue(uri, device_id);
        return {
          content: [
            {
              type: 'text',
              text: 'Successfully added track to queue',
            } as TextContent,
          ],
        };
      case 'get':
        const queue = await this.spotifyClient.getQueue();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(queue, null, 2),
            } as TextContent,
          ],
        };
      default:
        throw new Error(`Unknown queue action: ${action}`);
    }
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

  private async handleGetDevices(): Promise<CallToolResult> {
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

  private async handleSetVolume(args: any): Promise<CallToolResult> {
    const { volume, device_id } = args;
    await this.spotifyClient.setVolume(volume, device_id);
    
    return {
      content: [
        {
          type: 'text',
          text: `Successfully set volume to ${volume}%`,
        } as TextContent,
      ],
    };
  }

  private async handleSetShuffle(args: any): Promise<CallToolResult> {
    const { state, device_id } = args;
    await this.spotifyClient.setShuffle(state, device_id);
    
    return {
      content: [
        {
          type: 'text',
          text: `Successfully ${state ? 'enabled' : 'disabled'} shuffle`,
        } as TextContent,
      ],
    };
  }

  private async handleSetRepeat(args: any): Promise<CallToolResult> {
    const { state, device_id } = args;
    await this.spotifyClient.setRepeat(state, device_id);
    
    return {
      content: [
        {
          type: 'text',
          text: `Successfully set repeat mode to ${state}`,
        } as TextContent,
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Spotify MCP server running on stdio');
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