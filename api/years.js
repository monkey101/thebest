const connectDB = require('./_db');

module.exports = async (req, res) => {
  try {
    const Track = await connectDB();
    const years = await Track.distinct('year').sort();
    res.status(200).json(years);
  } catch (error) {
    console.error('Error fetching years:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch years',
      details: error.stack
    });
  }
};
