#!/usr/bin/env node

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';

async function compareAccounts() {
  try {
    const tokenPath = path.join(os.homedir(), '.spotify-mcp-tokens.json');
    
    if (!fs.existsSync(tokenPath)) {
      console.error('❌ No token file found. Please authenticate first.');
      return;
    }
    
    const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    
    const api = axios.create({
      baseURL: 'https://api.spotify.com/v1',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    console.log('🔍 Account Diagnostic Test\n');

    // Get user profile info
    try {
      const userResponse = await api.get('/me');
      const user = userResponse.data;
      
      console.log('👤 Account Information:');
      console.log(`   Display Name: ${user.display_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Country: ${user.country}`);
      console.log(`   Product: ${user.product} (${user.product === 'premium' ? '✅ Premium' : '⚠️  Free'})`);
      console.log(`   Followers: ${user.followers.total}`);
      console.log(`   Account ID: ${user.id}`);
      
    } catch (error) {
      console.error(`❌ Failed to get user info: ${error.response?.status} - ${error.response?.data?.error?.message}`);
      return;
    }

    // Test specific scopes
    console.log('\n🔐 Testing API Endpoint Access:');
    
    const endpoints = [
      { name: 'Recently Played', url: '/me/player/recently-played', params: { limit: 1 } },
      { name: 'Top Tracks', url: '/me/top/tracks', params: { limit: 1 } },
      { name: 'Saved Tracks', url: '/me/tracks', params: { limit: 1 } },
      { name: 'Playlists', url: '/me/playlists', params: { limit: 1 } },
      { name: 'Devices', url: '/me/player/devices', params: {} },
      { name: 'Current Playback', url: '/me/player', params: {} }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await api.get(endpoint.url, { params: endpoint.params });
        console.log(`   ✅ ${endpoint.name}: OK`);
      } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;
        console.log(`   ❌ ${endpoint.name}: ${status} - ${message}`);
      }
    }

    console.log('\n📋 Token Scopes:');
    console.log(`   ${tokenData.scope}`);
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

compareAccounts();