-- for dumping track info
tell application "Music"
	set playlistYears to {}
	set songList to {}
	set myFolder to folder playlist "The Best"
	set targetYearFolder to folder playlist "2022: Family Style"

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
		repeat with aPlaylist in (get user playlists)
			set aPlaylistName to aPlaylist's name
			try
				if aPlaylist's parent = yearFolder then
					if yearFolder = targetYearFolder then
						--log aPlaylistName
						repeat with t in aPlaylist's tracks
							--logs all properties of a track
							--set props to get properties of t
							--log props
							set tAlbum to t's album
							set tName to t's name
							set tArtist to t's artist
							set tGenre to t's genre
							set tAlbumArtist to t's album artist
							set tDuration to t's duration
							set tTime to t's time
							set tTrackNumber to t's track number
							-- add genre, duration, etc here and TSV format
							set end of songList to ("Song: 2022 -- " & aPlaylistName & " -- " & tName & " -- " & tArtist & " -- " & tAlbum & " -- " & tGenre & " -- " & tAlbumArtist & " -- " & tDuration & " -- " & tTime & " -- " & tTrackNumber)
						end repeat
					end if
				end if
			end try
		end repeat
	end repeat
	return songList
end tell


