const connectDB = require('./_db');

module.exports = async (req, res) => {
  const { author } = req.query;
  if (!author) {
    return res.status(400).json({ error: 'Author is required' });
  }
  try {
    const Track = await connectDB();
    const tracks = await Track.find({ author }).sort({ year: -1, playlist: 1, trackNumber: 1 });
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
    res.status(200).json(playlists);
  } catch (error) {
    console.error('Error fetching playlists by author:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch playlists',
      details: error.stack
    });
  }
};
