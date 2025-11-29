#!/usr/bin/env python3
"""
Script to find tracks with missing genres and populate them using Last.fm API.
Queries MongoDB for tracks with empty/null genres and looks up genre information.
"""
import os
import sys
from dotenv import load_dotenv
from pymongo import MongoClient
from get_genre_search import get_genre

# Load environment variables
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
LASTFM_API_KEY = os.getenv("LASTFM_API_KEY")

if not MONGODB_URI:
    raise SystemExit("ERROR: MONGODB_URI missing in .env")

if not LASTFM_API_KEY:
    raise SystemExit("ERROR: LASTFM_API_KEY missing in .env")


def connect_to_mongodb():
    """Connect to MongoDB and return the database and collection."""
    try:
        client = MongoClient(MONGODB_URI)
        # Extract database name from URI or default to 'surflog'
        db = client.get_database()
        collection = db['best']
        return client, collection
    except Exception as e:
        raise SystemExit(f"ERROR: Could not connect to MongoDB: {e}")


def find_tracks_with_missing_genres(collection):
    """Find all tracks with empty or null genre field."""
    query = {
        "$or": [
            {"genre": {"$exists": False}},
            {"genre": None},
            {"genre": ""},
            {"genre": " "}  # Also catch whitespace-only strings
        ]
    }

    # Only return fields we need
    projection = {
        "_id": 1,
        "track": 1,
        "artist": 1,
        "album": 1,
        "year": 1,
        "playlist": 1
    }

    tracks = list(collection.find(query, projection))
    return tracks


def get_genre_for_track(artist, track):
    """Get genre for a track using Last.fm API."""
    try:
        genre = get_genre(artist, track)
        if not genre:
            return "unknown"
        #genre = map_tags_to_genre(tags)
        return genre
    except Exception as e:
        print(f"  ERROR fetching genre: {e}", file=sys.stderr)
        return "error"


def main():
    print("Connecting to MongoDB...")
    client, collection = connect_to_mongodb()

    print("Finding tracks with missing genres...")
    tracks = find_tracks_with_missing_genres(collection)

    total = len(tracks)
    print(f"Found {total} tracks with missing genres\n")

    if total == 0:
        print("No tracks need genre updates!")
        client.close()
        return

    # Process each track
    for idx, track_doc in enumerate(tracks, 1):
        track_name = track_doc.get('track', 'Unknown Track')
        artist_name = track_doc.get('artist', 'Unknown Artist')
        album = track_doc.get('album', 'Unknown Album')
        year = track_doc.get('year', 'Unknown Year')

        print(f"[{idx}/{total}] {artist_name} - {track_name}")
        print(f"         Album: {album} ({year})")

        # Get genre from Last.fm
        genre = get_genre_for_track(artist_name, track_name)

        print(f"         Genre found: {genre}")
        print()

    client.close()
    print("Done!")


if __name__ == "__main__":
    main()
