import unittest
from unittest.mock import patch, MagicMock
from playlist_extractor import (
    extract_playlist_id,
    get_spotify_client,
    get_playlist_metadata,
    get_playlist_tracks,
    ms_to_min_sec,
    extract_track_data,
    process_playlist,
)

class TestPlaylistExtractor(unittest.TestCase):

    def test_extract_playlist_id_valid(self):
        uri = "spotify:playlist:12345abcde"
        self.assertEqual(extract_playlist_id(uri), "12345abcde")

    def test_extract_playlist_id_invalid(self):
        uri = "spotify:track:12345abcde"
        with self.assertRaises(ValueError):
            extract_playlist_id(uri)

    @patch("playlist_extractor.spotipy.Spotify")
    def test_get_spotify_client(self, mock_spotify):
        with patch("playlist_extractor.SpotifyOAuth") as mock_auth:
            mock_auth.return_value = MagicMock()
            client = get_spotify_client()
            self.assertIsNotNone(client)
            mock_spotify.assert_called_once()

    @patch("playlist_extractor.spotipy.Spotify")
    def test_get_playlist_metadata(self, mock_spotify):
        mock_spotify.return_value.playlist.return_value = {"name": "Test Playlist"}
        sp = mock_spotify()
        playlist_metadata = get_playlist_metadata(sp, "12345abcde")
        self.assertEqual(playlist_metadata["name"], "Test Playlist")

    @patch("playlist_extractor.spotipy.Spotify")
    def test_get_playlist_tracks(self, mock_spotify):
        mock_spotify.return_value.playlist_tracks.return_value = {
            "items": [{"track": {"name": "Track 1"}}],
            "next": None,
        }
        sp = mock_spotify()
        tracks = get_playlist_tracks(sp, "12345abcde")
        self.assertEqual(len(tracks), 1)
        self.assertEqual(tracks[0]["track"]["name"], "Track 1")

    def test_ms_to_min_sec(self):
        self.assertEqual(ms_to_min_sec(123456), "2:03")
        self.assertEqual(ms_to_min_sec(60000), "1:00")

    def test_extract_track_data(self):
        track = {
            "track": {
                "name": "Track 1",
                "album": {"name": "Album 1"},
                "artists": [{"name": "Artist 1"}],
                "duration_ms": 180000,
            }
        }
        data = extract_track_data(track, "Author", "Playlist", "Folder", 2023, 1)
        self.assertEqual(data["track"], "Track 1")
        self.assertEqual(data["artist"], "Artist 1")
        self.assertEqual(data["time"], "3:00")

    @patch("playlist_extractor.spotipy.Spotify")
    def test_process_playlist(self, mock_spotify):
        mock_spotify.return_value.playlist.return_value = {"name": "Test Playlist"}
        mock_spotify.return_value.playlist_tracks.return_value = {
            "items": [{"track": {"name": "Track 1", "album": {"name": "Album 1"}, "artists": [{"name": "Artist 1"}], "duration_ms": 180000}}],
            "next": None,
        }
        sp = mock_spotify()
        track_data = process_playlist(sp, "spotify:playlist:12345abcde", "Author", "Folder", 2023)
        self.assertEqual(len(track_data), 1)
        self.assertEqual(track_data[0]["track"], "Track 1")

if __name__ == "__main__":
    unittest.main()
