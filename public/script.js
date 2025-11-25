// Tab Navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const tabName = e.target.dataset.tab;
    
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    
    // Update active tab content
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
  });
});

// Load years on page load
document.addEventListener('DOMContentLoaded', () => {
  loadYears();
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

// Load playlists for a specific year
async function loadPlaylistsByYear(year) {
  try {
    console.log(year);
    document.getElementById('yearSelect').value = year;
    
    // Switch to playlists tab
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-tab="playlists"]').classList.add('active');
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    document.getElementById('playlists').classList.add('active');
    
    const response = await fetch(`/api/playlists?year=${year}`);
    const playlists = await response.json();
    console.log(response.json.toString);
    
    const playlistsList = document.getElementById('playlistsList');
    playlistsList.innerHTML = '';
    
    if (playlists.length === 0) {
      playlistsList.innerHTML = `<p class="loading">No playlists found for ${year}</p>`;
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

// Load playlists when year is selected from dropdown
document.getElementById('yearSelect')?.addEventListener('change', (e) => {
  if (e.target.value) {
    loadPlaylistsByYear(e.target.value);
  }
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
          <p class="track-artist">${escapeHtml(track.artist)}</p>
          <p><strong>${escapeHtml(track.track)}</strong> - ${escapeHtml(track.album)}</p>
          <p><small>Genre: ${track.genre || 'N/A'} | Duration: ${track.time || 'N/A'}</small></p>
        </div>
      `;
    });
    if (playlist.tracks.length > 10) {
      html += `<p style="padding: 10px; text-align: center; color: #999;">+${playlist.tracks.length - 10} more tracks</p>`;
    }
    html += '</div>';
  }
  
  div.innerHTML = html;
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
    <h3>${escapeHtml(result.track)}</h3>
    <div class="playlist-meta">
      <span><strong>Artist:</strong> ${escapeHtml(result.artist)}</span>
      <span><strong>Album:</strong> ${escapeHtml(result.album)}</span>
      <span><strong>Playlist:</strong> ${escapeHtml(result.playlist)}</span>
      <span><strong>Author:</strong> ${escapeHtml(result.author)}</span>
      <span><strong>Year:</strong> ${result.year}</span>
    </div>
    <p><small>Genre: ${result.genre || 'N/A'} | Duration: ${result.time || 'N/A'} | Track #${result.trackNumber || 'N/A'}</small></p>
  `;
  
  div.innerHTML = html;
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
