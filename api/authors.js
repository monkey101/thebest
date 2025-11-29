const connectDB = require('./_db');

module.exports = async (req, res) => {
  try {
    const Track = await connectDB();
    const authors = await Track.distinct('author');
    const sortedAuthors = authors.filter(a => a).sort();
    res.status(200).json(sortedAuthors);
  } catch (error) {
    console.error('Error fetching authors:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch authors',
      details: error.stack
    });
  }
};
