// Tab Navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const tabName = e.target.dataset.tab;
    // Clear all parameters when clicking top-level tabs
    switchToTab(tabName, {}, true);
  });
});

// Function to switch tabs and update URL
function switchToTab(tabName, params = {}, clearAll = false) {
  // Update active tab button
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

  // Update active tab content
  document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
  document.getElementById(tabName)?.classList.add('active');

  // Update URL
  const url = new URL(window.location);

  if (clearAll) {
    // Clear all search params and only set tab
    url.search = '';
    url.searchParams.set('tab', tabName);
  } else {
    url.searchParams.set('tab', tabName);

    // Add additional params
    Object.keys(params).forEach(key => {
      if (params[key]) {
        url.searchParams.set(key, params[key]);
      } else {
        url.searchParams.delete(key);
      }
    });
  }

  window.history.pushState({}, '', url);
}

// Load URL state on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Load dropdowns first
  await Promise.all([loadYears(), loadAuthors()]);

  // Parse URL parameters
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  const year = params.get('year');
  const author = params.get('author');
  const search = params.get('q');
  const chartYear = params.get('chartYear');
  const chartAuthor = params.get('chartAuthor');

  // Handle tab navigation
  if (tab) {
    switchToTab(tab);

    // Handle year and/or author parameters for playlists tab
    if (tab === 'playlists' && (year || author)) {
      // Dropdowns are now populated, load playlists with filters
      loadPlaylists({ year, author });
    }

    // Handle search parameter for search tab
    if (tab === 'search' && search) {
      setTimeout(() => {
        searchInput.value = search;
        performSearch();
      }, 100);
    }

    // Handle chartYear and chartAuthor parameters for charts tab
    if (tab === 'charts' && (chartYear || chartAuthor)) {
      // Wait for charts to render, then apply filters
      setTimeout(async () => {
        await renderCharts();
        if (chartYear) {
          const chartYearSelect = document.getElementById('chartYearSelect');
          if (chartYearSelect) {
            chartYearSelect.value = chartYear;
          }
        }
        if (chartAuthor) {
          const chartAuthorSelect = document.getElementById('chartAuthorSelect');
          if (chartAuthorSelect) {
            chartAuthorSelect.value = chartAuthor;
          }
        }
        applyChartFilters();
      }, 100);
    }
  }

  // Handle browser back/forward buttons
  window.addEventListener('popstate', () => {
    location.reload();
  });
});

// Load all years
async function loadYears() {
  try {
    const response = await fetch('/api/years');
    const years = await response.json();

    const yearsList = document.getElementById('yearsList');
    const yearSelect = document.getElementById('yearSelect');

    yearsList.innerHTML = '';

    if (years.length === 0) {
      yearsList.innerHTML = '<p class="loading">No playlists found</p>';
      return;
    }

    // Create year buttons for Years tab
    years.forEach(year => {
      const btn = document.createElement('button');
      btn.className = 'year-btn';
      btn.textContent = year;
      btn.addEventListener('click', () => loadPlaylistsByYear(year));
      yearsList.appendChild(btn);

      // Add to select dropdown
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading years:', error);
    document.getElementById('yearsList').innerHTML = '<p class="error">Error loading years</p>';
  }
}

// Load all authors
async function loadAuthors() {
  try {
    const response = await fetch('/api/authors');
    const authors = await response.json();

    const authorSelect = document.getElementById('authorSelect');

    if (authors.length === 0) {
      return;
    }

    // Add to select dropdown
    authors.forEach(author => {
      const option = document.createElement('option');
      option.value = author;
      option.textContent = author;
      authorSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading authors:', error);
  }
}

// Load playlists with filters (year and/or author)
async function loadPlaylists(filters = {}) {
  try {
    // Filter out null/undefined values
    const cleanFilters = {};
    if (filters.year) cleanFilters.year = filters.year;
    if (filters.author) cleanFilters.author = filters.author;

    const { year, author } = cleanFilters;

    // Update dropdown values
    const yearSelect = document.getElementById('yearSelect');
    const authorSelect = document.getElementById('authorSelect');

    if (yearSelect) yearSelect.value = year || '';
    if (authorSelect) authorSelect.value = author || '';

    // Build query parameters
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (author) params.append('author', author);

    // If no filters provided, show instruction message
    if (!year && !author) {
      const playlistsList = document.getElementById('playlistsList');
      playlistsList.innerHTML = '<p class="loading">Select a year or author to view playlists</p>';
      return;
    }

    // Switch to playlists tab with parameters
    switchToTab('playlists', cleanFilters);

    const response = await fetch(`/api/playlists?${params.toString()}`);
    const playlists = await response.json();

    const playlistsList = document.getElementById('playlistsList');
    playlistsList.innerHTML = '';

    if (playlists.length === 0) {
      let filterText = [];
      if (year) filterText.push(`year ${year}`);
      if (author) filterText.push(`author ${escapeHtml(author)}`);
      playlistsList.innerHTML = `<p class="loading">No playlists found for ${filterText.join(' and ')}</p>`;
      return;
    }

    playlists.forEach(playlist => {
      const item = createPlaylistElement(playlist);
      playlistsList.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading playlists:', error);
    document.getElementById('playlistsList').innerHTML = '<p class="error">Error loading playlists</p>';
  }
}

// Load playlists for a specific year (kept for backward compatibility)
async function loadPlaylistsByYear(year) {
  const author = document.getElementById('authorSelect')?.value;
  await loadPlaylists({ year, author: author || undefined });
}

// Load playlists for a specific author (kept for backward compatibility)
async function loadPlaylistsByAuthor(author) {
  const year = document.getElementById('yearSelect')?.value;
  await loadPlaylists({ year: year || undefined, author });
}

// Load playlists when year is selected from dropdown
document.getElementById('yearSelect')?.addEventListener('change', (e) => {
  const year = e.target.value || undefined;
  const author = document.getElementById('authorSelect')?.value || undefined;
  loadPlaylists({ year, author });
});

// Load playlists when author is selected from dropdown
document.getElementById('authorSelect')?.addEventListener('change', (e) => {
  const author = e.target.value || undefined;
  const year = document.getElementById('yearSelect')?.value || undefined;
  loadPlaylists({ year, author });
});

// Create playlist DOM element
function createPlaylistElement(playlist) {
  const div = document.createElement('div');
  div.className = 'playlist-item';
  
  const tracksCount = (playlist.tracks || []).length;
  
  let html = `
    <h3>${escapeHtml(playlist.playlist)}</h3>
    <div class="playlist-meta">
      <span><strong>Author:</strong> ${escapeHtml(playlist.author)}</span>
      <span><strong>Year:</strong> ${playlist.year}</span>
      <span><strong>Folder:</strong> ${escapeHtml(playlist.playlistFolder)}</span>
      <span class="tracks-count">${tracksCount} tracks</span>
    </div>
  `;
  
  if (playlist.tracks && playlist.tracks.length > 0) {
    html += '<div class="tracks-list">';
    playlist.tracks.slice(0, 10).forEach((track) => {

      html += `
        <div class="track-item">
          <h3>
            ${escapeHtml(track.track)}
            <a href="https://open.spotify.com/search/${encodeURIComponent(track.track + ' ' + track.artist)}"
               target="_blank"
               class="spotify-link"
               title="Play on Spotify">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </a>
          </h3>
          <div class="playlist-meta">
            <span><strong>Artist:</strong> <a href="#" class="artist-link" data-artist="${escapeHtml(track.artist)}">${escapeHtml(track.artist)}</a></span>
            <span><strong>Album:</strong> <a href="#" class="album-link" data-album="${escapeHtml(track.album)}">${escapeHtml(track.album)}</a></span>
          </div>
          <p><small>Genre: ${track.genre || 'N/A'} | Duration: ${track.time || 'N/A'}</small></p>
        </div>
      `;
    });
    if (playlist.tracks.length > 10) {
      html += '<div class="hidden-tracks" style="display: none;"></div>';
      html += `<p class="show-more-link" style="padding: 10px; text-align: center; color: #1db954; cursor: pointer; user-select: none; text-decoration: underline;">+${playlist.tracks.length - 10} more tracks (click to show)</p>`;
    }
    html += '</div>';
  }

  div.innerHTML = html;

  // Add click event listeners to all artist links in this playlist
  const artistLinks = div.querySelectorAll('.artist-link');
  artistLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const artistName = e.target.dataset.artist;

      // Set search input and perform search
      searchInput.value = artistName;
      hideAutocomplete();
      performSearch();
    });
  });

  // Add click event listeners to all album links in this playlist
  const albumLinks = div.querySelectorAll('.album-link');
  albumLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const albumName = e.target.dataset.album;

      // Set search input and perform search
      searchInput.value = albumName;
      hideAutocomplete();
      performSearch();
    });
  });

  // Add click event listener for "show more" link
  const showMoreLink = div.querySelector('.show-more-link');
  if (showMoreLink) {
    showMoreLink.addEventListener('click', () => {
      const hiddenTracksContainer = div.querySelector('.hidden-tracks');

      if (hiddenTracksContainer.style.display === 'none') {
        // Show remaining tracks
        let hiddenTracksHtml = '';
        playlist.tracks.slice(10).forEach((track) => {
          hiddenTracksHtml += `
            <div class="track-item">
              <h3>
                ${escapeHtml(track.track)}
                <a href="https://open.spotify.com/search/${encodeURIComponent(track.track + ' ' + track.artist)}"
                   target="_blank"
                   class="spotify-link"
                   title="Play on Spotify">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </a>
              </h3>
              <div class="playlist-meta">
                <span><strong>Artist:</strong> <a href="#" class="artist-link" data-artist="${escapeHtml(track.artist)}">${escapeHtml(track.artist)}</a></span>
                <span><strong>Album:</strong> <a href="#" class="album-link" data-album="${escapeHtml(track.album)}">${escapeHtml(track.album)}</a></span>
              </div>
              <p><small>Genre: ${track.genre || 'N/A'} | Duration: ${track.time || 'N/A'}</small></p>
            </div>
          `;
        });

        hiddenTracksContainer.innerHTML = hiddenTracksHtml;
        hiddenTracksContainer.style.display = 'block';

        // Add event listeners to newly added artist and album links
        const newArtistLinks = hiddenTracksContainer.querySelectorAll('.artist-link');
        newArtistLinks.forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const artistName = e.target.dataset.artist;
            searchInput.value = artistName;
            hideAutocomplete();
            performSearch();
          });
        });

        const newAlbumLinks = hiddenTracksContainer.querySelectorAll('.album-link');
        newAlbumLinks.forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const albumName = e.target.dataset.album;
            searchInput.value = albumName;
            hideAutocomplete();
            performSearch();
          });
        });

        showMoreLink.textContent = 'Show less';
      } else {
        // Hide tracks
        hiddenTracksContainer.style.display = 'none';
        showMoreLink.textContent = `+${playlist.tracks.length - 10} more tracks (click to show)`;
      }
    });
  }

  return div;
}

// Search functionality
document.getElementById('searchBtn')?.addEventListener('click', performSearch);

// Autocomplete functionality
let autocompleteTimeout;
let selectedAutocompleteIndex = -1;

const searchInput = document.getElementById('searchInput');
const autocompleteDropdown = document.getElementById('autocompleteDropdown');

searchInput?.addEventListener('input', (e) => {
  const query = e.target.value.trim();

  // Clear previous timeout
  clearTimeout(autocompleteTimeout);

  if (query.length < 2) {
    hideAutocomplete();
    return;
  }

  // Debounce autocomplete requests
  autocompleteTimeout = setTimeout(() => {
    fetchAutocomplete(query);
  }, 300);
});

searchInput?.addEventListener('keydown', (e) => {
  const items = autocompleteDropdown?.querySelectorAll('.autocomplete-item');

  if (!items || items.length === 0) {
    if (e.key === 'Enter') {
      hideAutocomplete();
      performSearch();
    }
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedAutocompleteIndex = Math.min(selectedAutocompleteIndex + 1, items.length - 1);
    updateAutocompleteSelection(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedAutocompleteIndex = Math.max(selectedAutocompleteIndex - 1, -1);
    updateAutocompleteSelection(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    hideAutocomplete();
    if (selectedAutocompleteIndex >= 0 && selectedAutocompleteIndex < items.length) {
      items[selectedAutocompleteIndex].click();
    } else {
      performSearch();
    }
  } else if (e.key === 'Escape') {
    hideAutocomplete();
  }
});

// Close autocomplete when clicking outside
document.addEventListener('click', (e) => {
  if (!searchInput?.contains(e.target) && !autocompleteDropdown?.contains(e.target)) {
    hideAutocomplete();
  }
});

async function fetchAutocomplete(query) {
  try {
    const response = await fetch(`/api/autocomplete?q=${encodeURIComponent(query)}`);
    const groupedSuggestions = await response.json();

    if (groupedSuggestions.length > 0) {
      showAutocomplete(groupedSuggestions);
    } else {
      hideAutocomplete();
    }
  } catch (error) {
    console.error('Error fetching autocomplete:', error);
    hideAutocomplete();
  }
}

function showAutocomplete(groupedSuggestions) {
  if (!autocompleteDropdown) return;

  autocompleteDropdown.innerHTML = '';
  selectedAutocompleteIndex = -1;

  groupedSuggestions.forEach((group) => {
    // Create group container
    const groupDiv = document.createElement('div');
    groupDiv.className = 'autocomplete-group';

    // Create group label
    const label = document.createElement('div');
    label.className = 'autocomplete-group-label';
    label.textContent = group.label;
    groupDiv.appendChild(label);

    // Add suggestions for this group
    group.suggestions.forEach((suggestion) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.textContent = suggestion;
      item.dataset.type = group.type;
      item.addEventListener('click', () => {
        searchInput.value = suggestion;
        hideAutocomplete();
        performSearch();
      });
      groupDiv.appendChild(item);
    });

    autocompleteDropdown.appendChild(groupDiv);
  });

  autocompleteDropdown.classList.add('show');
}

function hideAutocomplete() {
  if (!autocompleteDropdown) return;
  autocompleteDropdown.classList.remove('show');
  autocompleteDropdown.innerHTML = '';
  selectedAutocompleteIndex = -1;
}

function updateAutocompleteSelection(items) {
  items.forEach((item, index) => {
    if (index === selectedAutocompleteIndex) {
      item.classList.add('selected');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('selected');
    }
  });
}

async function performSearch() {
  const query = document.getElementById('searchInput').value.trim();

  if (!query) {
    document.getElementById('searchResults').innerHTML = '<p class="loading">Enter a search query</p>';
    return;
  }

  // Update URL with search query
  switchToTab('search', { q: query });

  try {
    document.getElementById('searchResults').innerHTML = '<p class="loading">Searching...</p>';

    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const results = await response.json();
    
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';
    
    if (results.length === 0) {
      searchResults.innerHTML = `<p class="loading">No results found for "${escapeHtml(query)}"</p>`;
      return;
    }
    
    results.forEach(result => {
      const item = createSearchResultElement(result);
      searchResults.appendChild(item);
    });
  } catch (error) {
    console.error('Error searching:', error);
    document.getElementById('searchResults').innerHTML = '<p class="error">Search error occurred</p>';
  }
}

// Create search result DOM element
function createSearchResultElement(result) {
  const div = document.createElement('div');
  div.className = 'search-result-item';
   let html = `
    <h3>
      ${escapeHtml(result.track)}
      <a href="https://open.spotify.com/search/${encodeURIComponent(result.track + ' ' + result.artist)}"
         target="_blank"
         class="spotify-link"
         title="Play on Spotify">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
      </a>
    </h3>
    <div class="playlist-meta">
      <span><strong>Artist:</strong> <a href="#" class="artist-link" data-artist="${escapeHtml(result.artist)}">${escapeHtml(result.artist)}</a></span>
      <span><strong>Album:</strong> <a href="#" class="album-link" data-album="${escapeHtml(result.album)}">${escapeHtml(result.album)}</a></span>
      <span><strong>Playlist:</strong> <a href="#" class="playlist-link" data-year="${result.year}" data-author="${escapeHtml(result.author)}">${escapeHtml(result.playlist)}</a></span>
      <span><strong>Author:</strong> <a href="#" class="author-link" data-author="${escapeHtml(result.author)}">${escapeHtml(result.author)}</a></span>
      <span><strong>Year:</strong> ${result.year}</span>
    </div>
    <p><small>Genre: ${result.genre || 'N/A'} | Duration: ${result.time || 'N/A'} | Track #${result.trackNumber || 'N/A'}</small></p>
  `;

  div.innerHTML = html;

  // Add click event listener to artist link
  const artistLink = div.querySelector('.artist-link');
  if (artistLink) {
    artistLink.addEventListener('click', (e) => {
      e.preventDefault();
      const artistName = e.target.dataset.artist;
      searchInput.value = artistName;
      hideAutocomplete();
      performSearch();
    });
  }

  // Add click event listener to album link
  const albumLink = div.querySelector('.album-link');
  if (albumLink) {
    albumLink.addEventListener('click', (e) => {
      e.preventDefault();
      const albumName = e.target.dataset.album;
      searchInput.value = albumName;
      hideAutocomplete();
      performSearch();
    });
  }

  // Add click event listener to author link
  const authorLink = div.querySelector('.author-link');
  if (authorLink) {
    authorLink.addEventListener('click', (e) => {
      e.preventDefault();
      const authorName = e.target.dataset.author;
      loadPlaylistsByAuthor(authorName);
    });
  }

  // Add click event listener to playlist link
  const playlistLink = div.querySelector('.playlist-link');
  if (playlistLink) {
    playlistLink.addEventListener('click', (e) => {
      e.preventDefault();
      const year = e.target.dataset.year;
      const author = e.target.dataset.author;
      loadPlaylists({ year, author });
    });
  }

  return div;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  if (typeof(text) == "string" && text !=  null) {
    return text.replace(/[&<>"']/g, m => map[m]);
  }
  return "";
}

// MongoDB Charts Embedding SDK
const chartsBaseUrl = 'https://charts.mongodb.com/charts-monkey101-whtyj';

// Chart IDs
const chartIds = [
  'b68df329-df86-4368-a429-82f8f1416329',     // Chart 1 - Filterable
  '845392e2-e5cd-4ba3-bc37-7ba9ea7fb72d',     // Chart 2 - Filterable
  '620d86cb-6ea8-45cd-81e1-cad1b7f09b30',     // Chart 3 - Filterable (moved from position 4)
  '620d86cb-6ea8-4baf-8b41-cad1b7f09b2f',     // Chart 4 - Not filterable
  '620d86cb-6ea8-4ffc-8250-cad1b7f09b2b',     // Chart 5 - Not filterable
  '40590a31-8673-4825-ad0e-c9653b6da9b0'      // Chart 6 - Not filterable
];

// Global storage for chart instances
window.chartInstances = [];

// Render charts when Charts tab is activated
async function renderCharts() {
  if (window.chartsRendered) {
    return Promise.resolve(); // Charts already rendered
  }

  const sdk = new ChartsEmbedSDK({
    baseUrl: chartsBaseUrl
  });

  const renderPromises = chartIds.map((chartId, index) => {
    const chart = sdk.createChart({
      chartId: chartId,
      height: '480px',
      width: '640px',
      theme: 'light',
      autoRefresh: true,
      maxDataAge: 14400
    });

    // Store chart instance
    window.chartInstances[index] = chart;

    return chart.render(document.getElementById(`chart-${index + 1}`))
      .then(() => {
        console.log(`Chart ${index + 1} rendered successfully`);
      })
      .catch(err => {
        console.error(`Error rendering chart ${index + 1}:`, err);
      });
  });

  // Wait for all charts to render
  await Promise.all(renderPromises);

  window.chartsRendered = true;

  // Populate dropdowns after charts render
  // Use setTimeout to ensure data has been loaded
  await new Promise(resolve => {
    setTimeout(async () => {
      await populateChartYearDropdown();
      await populateChartAuthorDropdown();
      resolve();
    }, 500);
  });
}

// Populate the chart year filter dropdown
async function populateChartYearDropdown() {
  const chartYearSelect = document.getElementById('chartYearSelect');

  if (!chartYearSelect) {
    console.warn('Chart year select element not found');
    return;
  }

  try {
    // Fetch years from the API
    const response = await fetch('/api/years');
    const years = await response.json();

    // Add year options
    years.forEach(year => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      chartYearSelect.appendChild(option);
    });

    console.log(`Populated chart year dropdown with ${years.length} years`);
  } catch (error) {
    console.error('Error populating chart year dropdown:', error);
  }
}

// Populate the chart author filter dropdown
async function populateChartAuthorDropdown() {
  const chartAuthorSelect = document.getElementById('chartAuthorSelect');

  if (!chartAuthorSelect) {
    console.warn('Chart author select element not found');
    return;
  }

  try {
    // Fetch authors from the API
    const response = await fetch('/api/authors');
    const authors = await response.json();

    // Add author options
    authors.forEach(author => {
      const option = document.createElement('option');
      option.value = author;
      option.textContent = author;
      chartAuthorSelect.appendChild(option);
    });

    console.log(`Populated chart author dropdown with ${authors.length} authors`);
  } catch (error) {
    console.error('Error populating chart author dropdown:', error);
  }
}

// Apply filters to charts 1-3
function applyChartFilters() {
  const year = document.getElementById('chartYearSelect')?.value;
  const author = document.getElementById('chartAuthorSelect')?.value;

  // Build filter object
  const filter = {};
  if (year && year !== '') {
    filter.year = year;
  }
  if (author && author !== '') {
    filter.author = author;
  }

  try {
    // Apply filter to charts 1-3 (indices 0, 1, 2)
    for (let i = 0; i < 3; i++) {
      const chart = window.chartInstances[i];

      if (!chart) {
        console.warn(`Chart ${i + 1} not found. Charts may not be rendered yet.`);
        continue;
      }

      chart.setFilter(filter)
        .then(() => {
          console.log(`Chart ${i + 1} filter applied:`, filter);
        })
        .catch(err => {
          console.error(`Error applying filter to chart ${i + 1}:`, err);
        });
    }

    updateFilterBadge(year, author);
  } catch (error) {
    console.error('Exception setting chart filters:', error);
  }
}

// Update the filter badge display
function updateFilterBadge(year, author) {
  const badge = document.getElementById('chartFilterBadge');

  if (!badge) return;

  const filters = [];
  if (year && year !== '') {
    filters.push(`Year: <strong>${year}</strong>`);
  }
  if (author && author !== '') {
    filters.push(`Author: <strong>${author}</strong>`);
  }

  if (filters.length > 0) {
    badge.innerHTML = `Filtering by ${filters.join(', ')}`;
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }
}

// Add event listener for Charts tab to render charts when first opened
const chartsTab = document.querySelector('[data-tab="charts"]');
if (chartsTab) {
  chartsTab.addEventListener('click', () => {
    // Delay rendering slightly to ensure tab is visible
    setTimeout(() => renderCharts(), 100);
  });
}

// Event listener for chart year filter dropdown
document.getElementById('chartYearSelect')?.addEventListener('change', (e) => {
  applyChartFilters();

  // Update URL parameter
  const url = new URL(window.location);
  const selectedYear = e.target.value;
  const selectedAuthor = document.getElementById('chartAuthorSelect')?.value;

  if (selectedYear) {
    url.searchParams.set('chartYear', selectedYear);
  } else {
    url.searchParams.delete('chartYear');
  }

  if (selectedAuthor) {
    url.searchParams.set('chartAuthor', selectedAuthor);
  } else {
    url.searchParams.delete('chartAuthor');
  }

  window.history.pushState({}, '', url);
});

// Event listener for chart author filter dropdown
document.getElementById('chartAuthorSelect')?.addEventListener('change', (e) => {
  applyChartFilters();

  // Update URL parameter
  const url = new URL(window.location);
  const selectedYear = document.getElementById('chartYearSelect')?.value;
  const selectedAuthor = e.target.value;

  if (selectedYear) {
    url.searchParams.set('chartYear', selectedYear);
  } else {
    url.searchParams.delete('chartYear');
  }

  if (selectedAuthor) {
    url.searchParams.set('chartAuthor', selectedAuthor);
  } else {
    url.searchParams.delete('chartAuthor');
  }

  window.history.pushState({}, '', url);
});
