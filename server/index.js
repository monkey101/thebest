const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bestai';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB Connection
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Database Schema
const trackSchema = new mongoose.Schema({
  year: String,
  playlistFolder: String,
  playlist: String,
  track: String,
  album: String,
  artist: String,
  albumArtist: String,
  duration: Number,
  time: String,
  genre: String,
  trackNumber: Number,
  author: String
});

// Add text index for full-text search
trackSchema.index({
  'track': 'text',
  'artist': 'text',
  'album': 'text',
  'playlist': 'text',
  'author': 'text',
  'genre': 'text'
});

const Track = mongoose.model('best', trackSchema, 'best');

// API Routes

// Get all years with tracks
app.get('/api/years', async (req, res) => {
  try {
    const years = await Track.distinct('year').sort();
    res.json(years);
  } catch (error) {
    console.error('Error fetching years:', error);
    res.status(500).json({ error: 'Failed to fetch years' });
  }
});

// Get all playlists for a specific year
app.get('/api/playlists/:year', async (req, res) => {
  try {
    const { year } = req.params;
    const tracks = await Track.find({ year: year }).sort({ playlist: 1, trackNumber: 1 });
    
    // Group tracks by playlist
    const playlistsMap = {};
    tracks.forEach(track => {
      if (!playlistsMap[track.playlist]) {
        playlistsMap[track.playlist] = {
          playlist: track.playlist,
          playlistFolder: track.playlistFolder,
          author: track.author,
          year: track.year,
          tracks: []
        };
      }
      playlistsMap[track.playlist].tracks.push(track);
    });
    
    const playlists = Object.values(playlistsMap);
    res.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

// Search tracks using MongoDB full-text search
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    console.log(q);

    const results = await Track.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).limit(100);

    res.json(results);
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve index.html for any unmatched routes (SPA support)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
