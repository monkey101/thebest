const connectDB = require('./_db');

module.exports = async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Search query required' });
  }
  try {
    const Track = await connectDB();
    const results = await Track.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).limit(100);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ 
      error: error.message || 'Search failed',
      details: error.stack
    });
  }
};
