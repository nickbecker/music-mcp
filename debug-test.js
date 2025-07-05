#!/usr/bin/env node

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';

async function debugSpotifyAPI() {
  try {
    // Load real tokens
    const tokenPath = path.join(os.homedir(), '.spotify-mcp-tokens.json');
    
    if (!fs.existsSync(tokenPath)) {
      console.error('❌ No token file found. Please authenticate first.');
      return;
    }
    
    const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    console.log('✅ Loaded tokens');
    console.log(`Token expires: ${new Date(tokenData.expires_at)}`);
    console.log(`Scopes: ${tokenData.scope}`);
    
    const api = axios.create({
      baseURL: 'https://api.spotify.com/v1',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    // Test 1: Basic user profile (should always work)
    console.log('\n🧪 Testing /me endpoint...');
    try {
      const userResponse = await api.get('/me');
      console.log(`✅ User profile: ${userResponse.data.display_name} (${userResponse.data.country}) - ${userResponse.data.product} account`);
    } catch (error) {
      console.error(`❌ User profile failed: ${error.response?.status} - ${error.response?.data?.error?.message || error.message}`);
    }

    // Test 2: Recently played (the failing endpoint)
    console.log('\n🧪 Testing /me/player/recently-played endpoint...');
    try {
      const recentResponse = await api.get('/me/player/recently-played', {
        params: { limit: 5 }
      });
      console.log(`✅ Recently played: ${recentResponse.data.items?.length || 0} tracks`);
      if (recentResponse.data.items?.length > 0) {
        console.log(`   Latest: ${recentResponse.data.items[0].track.name} by ${recentResponse.data.items[0].track.artists[0].name}`);
      }
    } catch (error) {
      console.error(`❌ Recently played failed: ${error.response?.status} - ${error.response?.data?.error?.message || error.message}`);
      console.error(`Full error response:`, error.response?.data);
    }

    // Test 3: Devices
    console.log('\n🧪 Testing /me/player/devices endpoint...');
    try {
      const devicesResponse = await api.get('/me/player/devices');
      console.log(`✅ Devices: ${devicesResponse.data.devices?.length || 0} found`);
      devicesResponse.data.devices?.forEach(device => {
        console.log(`   ${device.name} (${device.type}) - ${device.is_active ? 'Active' : 'Inactive'}`);
      });
    } catch (error) {
      console.error(`❌ Devices failed: ${error.response?.status} - ${error.response?.data?.error?.message || error.message}`);
    }

    // Test 4: Current playback
    console.log('\n🧪 Testing /me/player endpoint...');
    try {
      const playbackResponse = await api.get('/me/player');
      if (playbackResponse.status === 204 || !playbackResponse.data) {
        console.log('ℹ️ No active playback session');
      } else {
        console.log(`✅ Current playback: ${playbackResponse.data.item?.name} - ${playbackResponse.data.is_playing ? 'Playing' : 'Paused'}`);
      }
    } catch (error) {
      console.error(`❌ Current playback failed: ${error.response?.status} - ${error.response?.data?.error?.message || error.message}`);
    }

  } catch (error) {
    console.error('💥 Debug test failed:', error.message);
  }
}

debugSpotifyAPI();