-- for dumping track info
tell application "iTunes"
	set playlistYears to {}
	set songList to {}
	set myFolder to folder playlist "The Best"

	repeat with aPlaylist in (get folder playlists)
		try
			set aParent to aPlaylist's parent
			if aParent = myFolder then
				set aName to aPlaylist's name
				set end of playlistYears to aName
			end if
		end try
	end repeat


	repeat with yearList in playlistYears
		set yearFolder to folder playlist yearList
		set folderName to yearFolder's name
		log folderName
		repeat with aPlaylist in (get user playlists)
			set aPlaylistName to aPlaylist's name
			try
				if aPlaylist's parent = yearFolder then
					log aPlaylistName
					repeat with t in aPlaylist's tracks
						set tAlbum to t's album
						set tName to t's name
						set tArtist to t's artist
						-- add genre, duration, etc here and TSV format
						set end of songList to ("Song: " & tName & " - " & tArtist & " - " & tAlbum)
					end repeat
				end if
			end try
		end repeat
	end repeat
	return songList
end tell
