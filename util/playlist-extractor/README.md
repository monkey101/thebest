# Spotify Playlist Extractor

A command-line tool to extract track metadata from Spotify playlists into CSV format.

## Setup

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Create a Spotify Developer account and create a new application at https://developer.spotify.com/dashboard

3. Get your Client ID and Client Secret from your Spotify application

4. Create a `.env` file in the project root with the following content:
```
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

## Usage

Create a JSON file containing your playlist information in the following format:
```json
{
    "name": "Folder Name",
    "type": "folder",
    "uri": "spotify:user:username:folder:folder_id",
    "children": [
        {
            "type": "playlist",
            "author": "Author Name",
            "uri": "spotify:playlist:playlist_id"
        }
    ]
}
```

Use the utility `./spotifyfolders  <folder-uri> > 2024-fireside-folders.json`
This will dump all the playlist folders to a JSON file with the correct format. 

### Update Playlist Owners

Add the year at the top level of the file so it looks like:
```
    "name": "2024 - SHIRE",
    "year": "2024", <==
    "type": "folder",
```

To update the playlist owners in your JSON file:
```bash
python playlist_extractor.py playlists.json --update-owners
```

This will:
1. Look up each playlist's owner on Spotify
2. Update the `author` field in the JSON file with the owner's display name
3. Save the updated JSON back to the same file


### Fix up the Playlist JSON File

* Replace the spotify owner name with the name used in "The Best" (eg., "mooshi" = "Ian")

### Extract Playlist Data to CSV

Run the script with your JSON file to extract playlist data:
```bash
python playlist_extractor.py playlists.json
```

The script will:
1. Authenticate with your Spotify account
2. Extract all tracks from each playlist in the JSON file
3. Save all track metadata to a single CSV file named `{folder_name}_tracks.csv`


## Output CSV Format

The CSV file will contain the following columns:
- track_name
- artist_name
- album_name
- duration_ms (duration in milliseconds)
- duration (duration in MM:SS format)
- popularity
- release_date
- track_id
- artist_id
- album_id
- author_name
- playlist_name
- index 