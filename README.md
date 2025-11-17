# The Best AI - Music Playlist Database

A database-driven website to store and browse music playlists organized by year, with MongoDB full-text search functionality.

## Features

- **View playlists by year** - Browse all playlists created in a specific year
- **View available years** - See which years have playlists
- **Full-text search** - Search for tracks using MongoDB's full-text search
- **Database-driven** - All data stored in MongoDB, read-only web interface
- **Vercel deployment** - Easily deploy to Vercel with serverless functions

## Project Structure

```
thebestai/
├── api/
│   ├── _db.js            # MongoDB connection and schema helper
│   ├── years.js          # GET /api/years
│   ├── playlists.js      # GET /api/playlists?year=YYYY
│   ├── search.js         # GET /api/search?q=QUERY
│   └── health.js         # GET /api/health
├── public/
│   ├── index.html        # Main page
│   ├── style.css         # Styling
│   └── script.js         # Frontend logic
├── server/
│   └── index.js          # Express server (legacy, for reference)
├── package.json          # Dependencies
├── vercel.json           # Vercel configuration
├── .env.example          # Environment variables template
└── README.md             # This file
```

## Database Schema

The MongoDB `best` collection stores individual track documents with the following structure:

```json
{
  "_id": ObjectId,
  "year": "string",
  "playlistFolder": "string",
  "playlist": "string",
  "track": "string",
  "album": "string",
  "artist": "string",
  "albumArtist": "string",
  "duration": "number",
  "time": "string",
  "genre": "string",
  "trackNumber": "number",
  "author": "string"
}
```

**Example Document:**
```json
{
  "_id": "5c425c23d79687af85bc63c7",
  "year": "2007",
  "playlistFolder": "2007 - 50 Best Right Now",
  "playlist": "Alex's 50",
  "track": "Easy Listen' Blues",
  "album": "The Trio",
  "artist": "Oscar Peterson",
  "albumArtist": "",
  "duration": 466.8659973,
  "time": "7:46",
  "genre": "Jazz",
  "trackNumber": 3,
  "author": "Alex"
}
```

## Setup

### Local Development

1. Clone the repository
2. Copy `.env.example` to `.env` and configure MongoDB URI:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Install Vercel CLI (if not already installed):
   ```bash
   npm install -g vercel
   ```
5. Start the development server with Vercel:
   ```bash
   vercel dev
   ```
   This runs the app with Vercel's serverless environment, recognizing the `api/` routes.
6. Open `http://localhost:3000` in your browser

**Note:** Use `vercel dev` for local testing, not `npm start`. The app uses Vercel serverless API routes (`api/` directory) for backend functionality.

### MongoDB Full-Text Search Setup

Ensure your MongoDB collection has a text index on the searchable fields:

```javascript
db.best.createIndex({
  "track": "text",
  "artist": "text",
  "album": "text",
  "playlist": "text",
  "author": "text",
  "genre": "text"
})
```

## Deployment to Vercel

### Prerequisites
- Vercel account (https://vercel.com)
- GitHub repository with this code
- MongoDB Atlas URI (or other MongoDB instance with network access)

### Deployment Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Select "Import Git Repository"
   - Choose your repository
   - Click "Import"

3. **Configure Environment Variables**
   - In Vercel project settings, go to "Environment Variables"
   - Add `MONGODB_URI` with your MongoDB connection string
   - Add `PORT` (optional, defaults to 3000)
   - Redeploy after adding variables

4. **Enable Serverless Functions**
   - Vercel automatically converts your Express app to serverless functions
   - The `vercel.json` configuration handles routing

5. **Test Deployment**
   - Visit your Vercel deployment URL
   - Test all functionality (years, playlists, search)

## API Endpoints

- `GET /api/years` - Get all years with playlists
- `GET /api/playlists/:year` - Get all playlists for a specific year
- `GET /api/search?q=query` - Search tracks using MongoDB full-text search
- `GET /api/health` - Health check endpoint

## Important Notes

- The web interface is **read-only** - data can only be modified via direct database access
- Full-text search requires a text index on the MongoDB collection
- MongoDB Atlas free tier supports text search
- Ensure your MongoDB instance has network access enabled for Vercel's IP addresses
