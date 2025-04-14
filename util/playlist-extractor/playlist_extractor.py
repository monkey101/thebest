#!/usr/bin/env python3

import os
import sys
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import pandas as pd
from dotenv import load_dotenv
import re
import json
import argparse

def extract_playlist_id(uri):
    """Extract playlist ID from Spotify URI."""
    pattern = r'playlist:([a-zA-Z0-9]+)'
    match = re.search(pattern, uri)
    if not match:
        raise ValueError(f"Invalid Spotify playlist URI: {uri}")
    return match.group(1)

def get_spotify_client():
    """Initialize and return an authenticated Spotify client."""
    load_dotenv()
    
    client_id = os.getenv('SPOTIFY_CLIENT_ID')
    client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')
    
    if not client_id or not client_secret:
        raise ValueError("Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env file")
    
    sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
        client_id=client_id,
        client_secret=client_secret,
        redirect_uri='http://localhost:8888/callback',
        scope='playlist-read-private playlist-read-collaborative'
    ))
    return sp

def get_playlist_metadata(sp, playlist_id):
    """Fetch playlist metadata from a playlist id."""
    playlist = sp.playlist(playlist_id)
    if not playlist:
        raise ValueError("Playlist not found")
    return playlist
     
def get_playlist_tracks(sp, playlist_id):
    """Fetch all tracks from a playlist."""
    results = sp.playlist_tracks(playlist_id)
    tracks = results['items']
    
    while results['next']:
        results = sp.next(results)
        tracks.extend(results['items'])
    
    return tracks

def ms_to_min_sec(ms):
    """Convert milliseconds to minutes and seconds format (MM:SS)."""
    seconds = int(ms / 1000)
    minutes = seconds // 60
    remaining_seconds = seconds % 60
    return f"{minutes}:{remaining_seconds:02d}"

def extract_track_data(track, author_name, playlist_name, playlist_folder_name, year, index):
    """Extract relevant metadata from a track."""
    track_data = track['track']
    return {
        'year': year,
        'playlistFolder': playlist_folder_name,
        'playlist': playlist_name,
        'track': track_data['name'],
        'album': track_data['album']['name'],
        'artist': track_data['artists'][0]['name'],
        'albumArtist': "",
        'duration': track_data['duration_ms'],
        'time': ms_to_min_sec(track_data['duration_ms']),
        'genre': "",
        'trackNumber': index,
        'author': author_name
    }

def process_playlist(sp, playlist_uri, author_name, playlist_folder_name, year):
    """Process a single playlist and return its track data."""
    playlist_id = extract_playlist_id(playlist_uri)
    playlist = get_playlist_metadata(sp, playlist_id)
    
    print(f"Fetching tracks from playlist '{playlist['name']}' by {author_name}...")
    tracks = get_playlist_tracks(sp, playlist_id)
    
    print(f"Processing {len(tracks)} tracks...")
    track_data = []
    for index, track in enumerate(tracks):
        print(f"Processing track {index + 1} of {len(tracks)}...")
        track_data.append(extract_track_data(track, author_name, playlist['name'], playlist_folder_name, year, index))
    
    return track_data

def update_playlist_owners(sp, json_data):
    """Update playlist owners in the JSON data."""
    print("\nUpdating playlist owners...")
    for playlist in json_data['children']:
        if playlist['type'] != 'playlist':
            continue
            
        playlist_id = extract_playlist_id(playlist['uri'])
        playlist_metadata = get_playlist_metadata(sp, playlist_id)
        
        # Update the author field with the playlist owner's display name
        playlist['author'] = playlist_metadata['owner']['display_name']
        print(f"Updated owner for playlist {playlist_metadata['name']}: {playlist['author']}")
    
    return json_data

def main():
    """
    Main function to extract Spotify playlist data and save it to a CSV file.

    This function performs the following tasks:
    1. Parses command-line arguments to determine the input JSON file and optional flags.
    2. Reads and validates the JSON file containing playlist folder structure and metadata.
    3. Authenticates with the Spotify API using client credentials from the .env file.
    4. If the '--update-owners' flag is provided, updates the playlist owners in the JSON file.
    5. Processes each playlist in the folder structure to extract track metadata.
    6. Saves the extracted track data to a CSV file named after the playlist folder.

    Command-line arguments:
    - json_file: Path to the JSON file containing playlist information.
    - --update-owners: Optional flag to update playlist owners in the JSON file.

    Raises:
    - ValueError: If the JSON file is invalid or required fields are missing.
    - Exception: For any other errors encountered during execution.

    Example usage:
    - Extract playlist data to CSV:
      python playlist_extractor.py playlists.json
    - Update playlist owners in the JSON file:
      python playlist_extractor.py playlists.json --update-owners
    """
    parser = argparse.ArgumentParser(description='Extract Spotify playlist data to CSV')
    parser.add_argument('json_file', help='JSON file containing playlist information')
    parser.add_argument('--update-owners', action='store_true', help='Update playlist owners in the JSON file')
    args = parser.parse_args()
    
    try:
        with open(args.json_file, 'r') as f:
            data = json.load(f)
        
        if data['type'] != 'folder':
            raise ValueError("JSON file must contain a folder structure")
        
        if not data['name']:
            raise ValueError("Folder name is required")
        playlist_folder_name = data['name']
        
        if not data['year']:
            raise ValueError("Party Year is required")
        party_year = data['year']
        
        sp = get_spotify_client()
        
        # Update playlist owners if requested
        if args.update_owners:
            data = update_playlist_owners(sp, data)
            # Save the updated JSON back to the file
            with open(args.json_file, 'w') as f:
                json.dump(data, f, indent=4)
            print(f"\nUpdated playlist owners saved to {args.json_file}")
            return
        
        # Process playlists and create CSV
        all_tracks = []
        for playlist in data['children']:
            if playlist['type'] != 'playlist':
                continue
                
            track_data = process_playlist(
                sp,
                playlist['uri'],
                playlist['author'],
                playlist_folder_name,
                party_year
            )
            all_tracks.extend(track_data)
        
        # Create DataFrame and save to CSV
        df = pd.DataFrame(all_tracks)
        output_file = f"{playlist_folder_name}_tracks.csv"
        df.to_csv(output_file, index=False)
        print(f"\nSuccessfully saved {len(all_tracks)} tracks from {len(data['children'])} playlists to {output_file}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()