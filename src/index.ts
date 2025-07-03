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
        ] as Tool[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'search_spotify':
            return await this.handleSearch(args);
          case 'get_item_details':
            return await this.handleGetItemDetails(args);
          default:
            throw new Error(`Unknown tool: ${name}. Available tools: search_spotify, get_item_details`);
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