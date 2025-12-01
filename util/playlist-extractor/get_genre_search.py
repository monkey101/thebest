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
# Canonical genre taxonomy (~30 genres)
# ---------------------------------------------------------
CANONICAL_GENRES = {
    "Rock/Pop": ["rock", "alternative", "indie", "hard rock", "no wave", "rockabilly", "surf rock", "punk rock", "classic rock", "punk", "grunge", "progressive rock", "noise rock", "garage rock", "psychedelic rock", "pop", "dance", "synthpop", "k-pop", "electropop", "j-pop", "metal", "heavy metal", "death metal", "black metal", "nu metal"],
    "Hip-hop/Rap": ["hip hop", "rap", "trap", "boom bap", "trip hop", "old school", "hip-hop", "gangsta rap"],
    "Electronic": ["electronic", "edm", "house", "techno", "trance", "drum and bass", "electro", "garage house"],
    "R&B/Soul": ["r&b", "rnb", "soul", "neo-soul", "funk", "disco", "motown","doo-wop", "doo wop", "quiet storm"],
    "Jazz": ["jazz", "swing", "bebop", "latin jazz"],
    "Country": ["country", "alt-country", "bluegrass", "country rock","alt-country"],
    "Reggae": ["reggae", "ska", "dub", "dancehall"],
    "Blues/Folk": ["blues", "folk", "singer-songwriter", "americana"],
    "Gospel": ["gospel", "christian", "spritiuals"],
    "Classical": ["classical", "orchestral", "baroque"],
    "Latin": ["latin", "reggaeton", "bachata", "salsa", "cumbia", "latin soul"],
    "World": ["world", "afrobeats", "hong kong", "celtic","ghana", "afrobeat", "afropop", "lebanon", "cabo verde", "cape verde", "arab", "nigerian", "hawaiian", "african", "balkan", "croatia", "french", "france", "congo-brazzaville", "italian", "traditional", "haiti", "spanish", "korean", "calypso","bollywood", "pakistani"],
    "Brazilian": ["brazilian", "brazil", "bossa nova", "samba", "mpb"],
    "Soundtrack": ["soundtrack", "score"],
    "Comedy/Spoken Word": ["comedy", "spoken word", "stand-up", "stand up"],
}

TAG_TO_CANONICAL = {
    tag: canonical
    for canonical, tags in CANONICAL_GENRES.items()
    for tag in tags
}

# ---------------------------------------------------------
# Last.fm API helpers
# ---------------------------------------------------------
def lastfm_get_info(artist, track):
    url = (
        "https://ws.audioscrobbler.com/2.0/"
        f"?method=track.getInfo&api_key={API_KEY}"
        f"&artist={quote_plus(artist)}&track={quote_plus(track)}&format=json"
    )
    r = requests.get(url, timeout=10)
    data = r.json()
    return data.get("track")


def lastfm_search(artist, track):
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

    best = matches[0]
    return best.get("artist"), best.get("name")


def lastfm_artist_tags(artist):
    url = (
        "https://ws.audioscrobbler.com/2.0/"
        f"?method=artist.getTopTags&api_key={API_KEY}"
        f"&artist={quote_plus(artist)}&format=json"
    )
    r = requests.get(url, timeout=10)
    data = r.json()

    tags = data.get("toptags", {}).get("tag", [])
    return [t["name"].lower() for t in tags]


def extract_track_tags(track_data):
    if not track_data:
        return []
    tags = track_data.get("toptags", {}).get("tag", [])
    return [t["name"].lower() for t in tags]


# ---------------------------------------------------------
# Genre mapping
# ---------------------------------------------------------
def map_to_canonical(tags):
    print (tags)
    for tag in tags:
        if tag in TAG_TO_CANONICAL:
            return TAG_TO_CANONICAL[tag]


# ---------------------------------------------------------
# Main logic: track → artist → fallback search
# ---------------------------------------------------------
def get_genre(artist, track):
    # ---- 1. Track-level tags ----
    info = lastfm_get_info(artist, track)
    track_tags = extract_track_tags(info)

    genre = map_to_canonical(track_tags)
    if genre:
        return genre

    # ---- 2. Artist-level tags (fallback) ----
    artist_tags = lastfm_artist_tags(artist)
    genre = map_to_canonical(artist_tags)
    if genre:
        return genre

    # ---- 3. Fallback search ----
    fallback = lastfm_search(artist, track)
    if fallback:
        corrected_artist, corrected_track = fallback

        info = lastfm_get_info(corrected_artist, corrected_track)
        track_tags = extract_track_tags(info)

        genre = map_to_canonical(track_tags)
        if genre:
            return genre

        artist_tags = lastfm_artist_tags(corrected_artist)
        genre = map_to_canonical(artist_tags)
        if genre:
            return genre

    return "Unknown"


# ---------------------------------------------------------
# CLI
# ---------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Get canonical genre for a track using Last.fm with fallback search & artist fallback.")
    parser.add_argument("artist")
    parser.add_argument("track")
    args = parser.parse_args()

    genre = get_genre(args.artist, args.track)
    print(genre)


if __name__ == "__main__":
    main()
