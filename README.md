# Music MCP

Opening up access to music listening apps and creating better music choices.

## Spotify MCP Server

A Model Context Protocol (MCP) server that provides Spotify Web API integration for Claude Desktop. Built with TypeScript and Node.js.

### Features

- **User Authentication**: OAuth2 Authorization Code flow with PKCE for secure user authentication
- **Search**: Search for tracks, albums, artists, and playlists
- **Playback Control**: Play, pause, skip tracks, control volume (requires authentication)
- **Queue Management**: Add tracks to queue and view current queue (requires authentication)
- **Device Management**: List and control Spotify devices (requires authentication)
- **User Data Access**: Get personal playlists, saved tracks, top tracks/artists, and listening history
- **Detailed Information**: Get comprehensive details about tracks, albums, artists, and playlists
- **Advanced Controls**: Set shuffle, repeat modes, and volume (requires authentication)

### Prerequisites

- Node.js 18+ and npm
- Spotify account (Free or Premium - Premium required for full playback control)
- Spotify application credentials
- Access to a web browser for initial authorization

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

#### Authentication Tools
- **`spotify_authorize`**: Generate authorization URL for user authentication
- **`spotify_auth_status`**: Check current authentication status

#### Public Data Access (No Authentication Required)
- **`search_spotify`**: Search for tracks, albums, artists, and playlists in Spotify's catalog
- **`get_item_details`**: Get detailed information about any public Spotify item (track, album, artist, playlist)

#### User-Specific Features (Requires Authentication)

**Playback Control:**
- **`get_current_track`**: Get currently playing track
- **`get_playback_state`**: Get current playback state and device info
- **`play_track`**: Start playback of specific tracks or context (album, playlist)
- **`pause_playback`**: Pause current playback
- **`skip_to_next`**: Skip to next track
- **`skip_to_previous`**: Skip to previous track
- **`set_volume`**: Set playback volume (0-100%)

**Queue Management:**
- **`add_to_queue`**: Add track to playback queue
- **`get_queue`**: View current playback queue

**Device Management:**
- **`get_devices`**: List available Spotify devices

**Personal Data:**
- **`get_recently_played`**: Get recently played tracks
- **`get_top_tracks`**: Get user's top tracks (short/medium/long term)
- **`get_top_artists`**: Get user's top artists (short/medium/long term)
- **`get_user_playlists`**: Get user's playlists
- **`get_saved_tracks`**: Get user's liked/saved tracks
- **`get_saved_albums`**: Get user's saved albums
- **`get_user_profile`**: Get user profile information

### Development Commands

```bash
npm run build      # Build TypeScript
npm run dev        # Run in development mode
npm run start      # Run built server
npm run lint       # Lint code
npm run typecheck  # Type checking
```

### Authentication & Setup

**NEW**: This server now supports **full user authentication** using OAuth2 Authorization Code flow with PKCE!

#### First-Time Setup
1. Use the `spotify_authorize` tool to get an authorization URL
2. Visit the URL in your browser and authorize the application
3. The server will automatically handle the callback and store your tokens securely
4. All user-specific features are now available!

#### Authentication Features:
- **Secure Token Storage**: Tokens are stored securely in your home directory
- **Automatic Token Refresh**: Expired tokens are automatically refreshed
- **PKCE Security**: Uses Proof Key for Code Exchange for enhanced security
- **Comprehensive Scopes**: Supports all major Spotify features

#### Required Scopes:
The server requests these scopes for full functionality:
- `user-read-private`, `user-read-email` - Basic profile access
- `user-library-read`, `user-library-modify` - Access to saved tracks/albums
- `user-read-playback-state`, `user-modify-playback-state` - Playback control
- `user-read-currently-playing`, `user-read-recently-played` - Listening history
- `user-top-read` - Top tracks and artists
- `playlist-read-private`, `playlist-read-collaborative` - Playlist access
- `playlist-modify-private`, `playlist-modify-public` - Playlist management
- `user-follow-read`, `user-follow-modify` - Following artists/users

### Troubleshooting

1. **"No tokens available" errors**: Use `spotify_authorize` tool to authenticate first
2. **"Invalid state parameter" errors**: Try the authorization process again
3. **Search fails**: Verify your client credentials are correct in the environment
4. **Build errors**: Make sure you're using Node.js 18+
5. **Authorization callback timeout**: The callback server times out after 5 minutes
6. **Token refresh failures**: Clear tokens using `spotify_auth_status` and re-authorize

## License

MIT
