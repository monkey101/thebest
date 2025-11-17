const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bestai';

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

trackSchema.index({
  'track': 'text',
  'artist': 'text',
  'album': 'text',
  'playlist': 'text',
  'author': 'text',
  'genre': 'text'
});

const Track = mongoose.models.best || mongoose.model('best', trackSchema, 'best');

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
  return Track;
}

module.exports = connectDB;
