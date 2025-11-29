#!/usr/bin/env python3
import os
import argparse
import requests
from urllib.parse import quote_plus
from dotenv import load_dotenv

# ---------------------------------------------------------
# Load API key
# ---------------------------------------------------------
load_dotenv()
API_KEY = os.getenv("LASTFM_API_KEY")

if not API_KEY:
    raise SystemExit("ERROR: LASTFM_API_KEY missing in .env")


# ---------------------------------------------------------
# Canonical genre taxonomy (example ~30 genres)
# ---------------------------------------------------------
CANONICAL_GENRES = {
    "Rock": ["rock", "alternative", "indie", "hard rock", "classic rock", "punk", "grunge"],
    "Pop": ["pop", "dance", "synthpop", "k-pop", "electropop", "j-pop"],
    "Hip Hop": ["hip hop", "rap", "trap", "boom bap"],
    "Electronic": ["electronic", "edm", "house", "techno", "trance", "drum and bass"],
    "Metal": ["metal", "heavy metal", "death metal", "black metal", "nu metal"],
    "R&B": ["r&b", "rnb", "soul", "neo-soul"],
    "Folk": ["folk", "singer-songwriter", "americana"],
    "Jazz": ["jazz", "swing", "bebop"],
    "Country": ["country", "alt-country"],
    "Reggae": ["reggae", "ska", "dub"],
    "Blues": ["blues"],
    "Classical": ["classical", "orchestral", "baroque"],
    "Latin": ["latin", "reggaeton", "bachata", "salsa"],
    "World": ["world", "afrobeats", "celtic"],
    "Soundtrack": ["soundtrack", "score"],
}

# Build reverse lookup
TAG_TO_CANONICAL = {
    tag: canonical
    for canonical, tags in CANONICAL_GENRES.items()
    for tag in tags
}

# ---------------------------------------------------------
# Last.fm API helpers
# ---------------------------------------------------------
def lastfm_get_info(artist, track):
    """Fetches track.getInfo from Last.fm"""
    url = (
        "https://ws.audioscrobbler.com/2.0/"
        f"?method=track.getInfo&api_key={API_KEY}"
        f"&artist={quote_plus(artist)}&track={quote_plus(track)}&format=json"
    )

    r = requests.get(url, timeout=10)
    data = r.json()

    # Structure when missing:
    # {'error': 6, 'message': 'Track not found'}
    if "track" not in data:
        return None

    return data["track"]


def lastfm_search(artist, track):
    """Fallback search: returns the best canonical match"""
    url = (
        "https://ws.audioscrobbler.com/2.0/"
        f"?method=track.search&api_key={API_KEY}"
        f"&track={quote_plus(track)}&artist={quote_plus(artist)}&format=json"
    )

    r = requests.get(url, timeout=10)
    data = r.json()

    try:
        matches = data["results"]["trackmatches"]["track"]
    except (KeyError, TypeError):
        return None

    if not matches:
        return None

    # Choose first result (Last.fm sorts by relevance)
    best = matches[0]
    print(best.get("name"), best.get("artist"))

    return best.get("artist"), best.get("name")


def extract_tags(track_data):
    """Extracts Last.fm tags from track.getInfo"""
    if not track_data:
        return []

    tags = track_data.get("toptags", {}).get("tag", [])
    return [t["name"].lower() for t in tags]


# ---------------------------------------------------------
# Genre mapping
# ---------------------------------------------------------
def map_to_canonical(tags):
    for tag in tags:
        if tag in TAG_TO_CANONICAL:
            return TAG_TO_CANONICAL[tag]
    return "unknown"


# ---------------------------------------------------------
# Main logic (with fallback search)
# ---------------------------------------------------------
def get_genre(artist, track):
    # Step 1: Try direct getInfo
    info = lastfm_get_info(artist, track)
    tags = extract_tags(info)
    print(tags)

    if tags:
        return map_to_canonical(tags)

    # Step 2: Fallback search
    fallback = lastfm_search(artist, track)
    if fallback:
        corrected_artist, corrected_track = fallback
        info = lastfm_get_info(corrected_artist, corrected_track)
        tags = extract_tags(info)
        if tags:
            return map_to_canonical(tags)

    return "unknown"


# ---------------------------------------------------------
# CLI
# ---------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Get canonical genre for a track using Last.fm with fallback search")
    parser.add_argument("artist")
    parser.add_argument("track")
    args = parser.parse_args()

    genre = get_genre(args.artist, args.track)
    print(genre)


if __name__ == "__main__":
    main()
