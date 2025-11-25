const connectDB = require('./_db');

module.exports = async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Search query required' });
  }
  try {
    const Track = await connectDB();

    // Search across all three fields: track, artist, album
    const [trackResults, artistResults, albumResults] = await Promise.all([
      // Track suggestions
      Track.aggregate([
        {
          $search: {
            index: 'default',
            autocomplete: {
              query: q,
              path: 'track',
              fuzzy: {
                maxEdits: 1,
                prefixLength: 1
              }
            }
          }
        },
        { $limit: 5 },
        {
          $group: {
            _id: null,
            suggestions: { $addToSet: '$track' }
          }
        },
        {
          $project: {
            _id: 0,
            suggestions: 1
          }
        }
      ]),
      // Artist suggestions
      Track.aggregate([
        {
          $search: {
            index: 'default',
            autocomplete: {
              query: q,
              path: 'artist',
              fuzzy: {
                maxEdits: 1,
                prefixLength: 1
              }
            }
          }
        },
        { $limit: 5 },
        {
          $group: {
            _id: null,
            suggestions: { $addToSet: '$artist' }
          }
        },
        {
          $project: {
            _id: 0,
            suggestions: 1
          }
        }
      ]),
      // Album suggestions
      Track.aggregate([
        {
          $search: {
            index: 'default',
            autocomplete: {
              query: q,
              path: 'album',
              fuzzy: {
                maxEdits: 1,
                prefixLength: 1
              }
            }
          }
        },
        { $limit: 5 },
        {
          $group: {
            _id: null,
            suggestions: { $addToSet: '$album' }
          }
        },
        {
          $project: {
            _id: 0,
            suggestions: 1
          }
        }
      ])
    ]);

    const tracks = trackResults.length > 0 ? trackResults[0].suggestions : [];
    const artists = artistResults.length > 0 ? artistResults[0].suggestions : [];
    const albums = albumResults.length > 0 ? albumResults[0].suggestions : [];

    // Return grouped suggestions by field type
    const groupedSuggestions = [];

    if (tracks.length > 0) {
      groupedSuggestions.push({
        type: 'track',
        label: 'Tracks',
        suggestions: tracks
      });
    }

    if (artists.length > 0) {
      groupedSuggestions.push({
        type: 'artist',
        label: 'Artists',
        suggestions: artists
      });
    }

    if (albums.length > 0) {
      groupedSuggestions.push({
        type: 'album',
        label: 'Albums',
        suggestions: albums
      });
    }

    res.status(200).json(groupedSuggestions);
  } catch (error) {
    console.error('Error autocomplete:', error);
    res.status(500).json({
      error: error.message || 'Autocomplete failed',
      details: error.stack
    });
  }
};
