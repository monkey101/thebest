const connectDB = require('./_db');

module.exports = async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Search query required' });
  }
  try {
    const Track = await connectDB();
    const results = await Track.aggregate([
      {
        $search: {
          index: 'default',
          compound: {
            should: [
              {
                text: {
                  query: q,
                  path: 'track',
                  score: { boost: { value: 3 } }
                }
              },
              {
                text: {
                  query: q,
                  path: 'artist',
                  score: { boost: { value: 2 } }
                }
              },
              {
                text: {
                  query: q,
                  path: 'album',
                  score: { boost: { value: 1.5 } }
                }
              }
            ],
            minimumShouldMatch: 1
          }
        }
      },
      {
        $addFields: {
          score: { $meta: 'searchScore' }
        }
      },
      {
        $match: {
          score: { $gte: 1 }
        }
      },
      {
        $sort: {
          score: -1
        }
      },
      {
        $limit: 100
      }
    ]);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({
      error: error.message || 'Search failed',
      details: error.stack
    });
  }
};
