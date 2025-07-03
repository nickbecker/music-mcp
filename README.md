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

#### ✅ Working Tools (Public Data Access)
- **`search_spotify`**: Search for tracks, albums, artists, and playlists in Spotify's catalog
- **`get_item_details`**: Get detailed information about any public Spotify item (track, album, artist, playlist)

#### ❌ Removed Tools (Require User Authentication)
These tools have been removed because they require user authentication which is not supported with Client Credentials flow:
- Playback control tools (play, pause, skip, volume, shuffle, repeat)
- Queue management tools
- Device management tools
- Current playback status tools

### Development Commands

```bash
npm run build      # Build TypeScript
npm run dev        # Run in development mode
npm run start      # Run built server
npm run lint       # Lint code
npm run typecheck  # Type checking
```

### Authentication & Limitations

**IMPORTANT**: This server currently uses Spotify's Client Credentials flow, which **only supports public data access**. 

### ✅ Available Features:
- **Search**: Search for tracks, albums, artists, and playlists
- **Public Information**: Get detailed information about any public Spotify content

### ❌ NOT Available (Requires User Authentication):
- Playback control (play, pause, skip, volume)
- Queue management
- Device management
- User-specific data (currently playing, playlists, etc.)

### Why These Limitations Exist:
Spotify's Client Credentials flow is designed for accessing **public catalog data only**. User playback control requires **Authorization Code flow** with user consent, which is more complex to implement securely in an MCP context.

### Future Improvements:
To support playback control, this server would need:
1. OAuth2 Authorization Code flow implementation
2. Secure token storage and refresh mechanism
3. User consent flow for required scopes

### Troubleshooting

1. **"User authentication required" errors**: This is expected behavior for playback controls. See limitations above.
2. **Search fails**: Verify your client credentials are correct
3. **Build errors**: Make sure you're using Node.js 18+
4. **No search results**: Check your search query and ensure you have a valid internet connection

## License

MIT
