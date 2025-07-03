# Music MCP

Opening up access to music listening apps and creating better music choices.

## Spotify MCP Server

A Model Context Protocol (MCP) server that provides Spotify Web API integration for Claude Desktop. Built with TypeScript and Node.js.

### Features

- **Search**: Search for tracks, albums, artists, and playlists
- **Playback Control**: Play, pause, skip tracks, control volume
- **Queue Management**: Add tracks to queue and view current queue
- **Device Management**: List and control Spotify devices
- **Detailed Information**: Get comprehensive details about tracks, albums, artists, and playlists
- **Advanced Controls**: Set shuffle, repeat modes, and volume

### Prerequisites

- Node.js 18+ and npm
- Spotify Premium account (required for playback control)
- Spotify application credentials

### Setup

#### 1. Spotify App Registration

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Set redirect URI to `http://localhost:8888`
4. Note your Client ID and Client Secret

#### 2. Environment Configuration

Create a `.env` file in the project root:

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8888
```

#### 3. Installation

```bash
npm install
npm run build
```

#### 4. Testing

Test the MCP server with the inspector:

```bash
npx @modelcontextprotocol/inspector npm run dev
```

#### 5. Claude Desktop Integration

Add to your `claude_desktop_config.json`:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "spotify": {
      "command": "node",
      "args": ["/path/to/spotify-mcp/dist/index.js"],
      "env": {
        "SPOTIFY_CLIENT_ID": "your_client_id",
        "SPOTIFY_CLIENT_SECRET": "your_client_secret",
        "SPOTIFY_REDIRECT_URI": "http://localhost:8888"
      }
    }
  }
}
```

### Available Tools

#### Search and Discovery
- `search_spotify`: Search for music content
- `get_item_details`: Get detailed information about tracks, albums, artists, or playlists

#### Playback Control
- `get_current_track`: Get currently playing track information
- `get_playback_state`: Get detailed playback state
- `control_playback`: Play, pause, skip tracks
- `set_volume`: Control playback volume
- `set_shuffle`: Enable/disable shuffle mode
- `set_repeat`: Set repeat mode (off, track, context)

#### Queue and Device Management
- `manage_queue`: Add tracks to queue or get current queue
- `get_devices`: List available Spotify devices

### Development Commands

```bash
npm run build      # Build TypeScript
npm run dev        # Run in development mode
npm run start      # Run built server
npm run lint       # Lint code
npm run typecheck  # Type checking
```

### Authentication

This server uses Spotify's Client Credentials flow for authentication, which provides access to:
- Search functionality
- Track/album/artist/playlist information
- Playback control (requires Spotify Premium)

Note: User authentication flow is not implemented, so some user-specific features may not be available.

### Troubleshooting

1. **No devices available**: Make sure Spotify is open on at least one device
2. **Playback control fails**: Ensure you have Spotify Premium
3. **Authentication errors**: Verify your client credentials are correct
4. **Build errors**: Make sure you're using Node.js 18+

## License

MIT
