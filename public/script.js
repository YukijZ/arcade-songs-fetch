/* eslint-disable operator-linebreak */
/* eslint-disable object-shorthand */
/* eslint-disable no-return-await */
/* eslint-disable consistent-return */
/* eslint-disable function-paren-newline */
/* eslint-disable comma-dangle */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable arrow-parens */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable no-undef */
/* eslint-disable no-multiple-empty-lines */
/* eslint-disable no-trailing-spaces */
/* eslint-disable no-use-before-define */
/* eslint-disable indent */
// Global variables
let currentSongs = [];

// DOM elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const randomBtn = document.getElementById('randomBtn');
const randomSongsContainer = document.getElementById('randomSongs');
const songsList = document.getElementById('songsList');
const resultsTitle = document.getElementById('resultsTitle');
const resultsCount = document.getElementById('resultsCount');
const loading = document.getElementById('loading');
const songModal = document.getElementById('songModal');
const modalContent = document.getElementById('modalContent');
let currentPage = 1;
let totalPages = 1;
// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
  showLoading();
  await fetchSongs(1);
  hideLoading();
  setupEventListeners();
});

// Event listeners
function setupEventListeners() {
  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  });

  randomBtn.addEventListener('click', handleRandomSongs);

  window.addEventListener('click', (event) => {
    if (event.target === songModal) {
      songModal.classList.add('hidden');
    }
  });

  window.addEventListener('click', (e) => {
    if (e.target === songModal) {
      songModal.classList.add('hidden');
    }
  });
  document.getElementById('prevBtn').addEventListener('click', async () => {
    if (currentPage > 1) {
      await fetchSongs(currentPage - 1);
    }
  });

  document.getElementById('nextBtn').addEventListener('click', async () => {
    if (currentPage < totalPages) {
      await fetchSongs(currentPage + 1);
    }
  });
}

// API functions
function updatePaginationControls() {
  document.getElementById(
    'pageInfo'
  ).textContent = `Page ${currentPage} of ${totalPages}`;

  document.getElementById('prevBtn').disabled = currentPage === 1;
  document.getElementById('nextBtn').disabled = currentPage === totalPages;
}

async function fetchSongs(page = 1) {
  try {
    const response = await fetch(`/api/songs?page=${page}`);
    if (!response.ok) throw new Error('Failed to fetch songs');
    const data = await response.json();
    currentSongs = data.songs;
    totalPages = data.totalPages;
    currentPage = data.page;
    displaySongs(currentSongs);
    updatePaginationControls();
    updateResultsInfo(`Page ${currentPage} of ${totalPages}`, data.total);
    console.log('Songs API data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching songs:', error);
    showError('Failed to load songs. Please try again.');
    return null;
  }
}

async function fetchRandomSongs(count = 4) {
  try {
    const response = await fetch(`/api/random-songs?count=${count}`);
    if (!response.ok) throw new Error('Failed to fetch random songs');
    return await response.json();
  } catch (error) {
    console.error('Error fetching random songs:', error);
    showError('Failed to load random songs. Please try again.');
    return [];
  }
}
async function searchSongs(query) {
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search songs');
    const songs = await response.json();
    return { songs: songs, total: songs.length };
  } catch (error) {
    console.error('Error searching songs:', error);
    return { songs: [], total: 0 };
  }
}
async function handleSearch() {
  const query = searchInput.value.trim();

  if (!query) {
    currentSongs = [];
    displaySongs(currentSongs);
    updateResultsInfo('Random Songs', 0);
    return;
  }

  showLoading();
  const searchResults = await searchSongs(query);
  hideLoading();

  // If backend returns same format: { songs, total }
  currentSongs = searchResults.songs || [];
  displaySongs(currentSongs);
  updateResultsInfo(
    `Search Results for "${query}"`,
    searchResults.total ?? currentSongs.length
  );
}
// Handle random songs
async function handleRandomSongs() {
  showLoading();
  const randomSongs = await fetchRandomSongs(4);
  hideLoading();

  displayRandomSongs(randomSongs);
}

// Display functions
function displaySongs(songs) {
  songsList.innerHTML = '';

  if (songs.length === 0) {
    songsList.innerHTML = '<p class="no-results">No songs found.</p>';
    return;
  }

  songs.forEach((song) => {
    const songCard = createSongCard(song);
    songsList.appendChild(songCard);
  });
}

function displayRandomSongs(songs) {
  randomSongsContainer.innerHTML = '';

  songs.forEach((song) => {
    const randomCard = createRandomSongCard(song);
    randomSongsContainer.appendChild(randomCard);
  });
}

function createSongCard(song) {
  const card = document.createElement('div');
  card.className = 'song-card';
  card.onclick = () => showSongDetail(song);

  const charts = song.charts || [];
  const chartBadges = charts
    .map(
      (chart) =>
        `<span class="chart-badge ${chart.difficulty?.toUpperCase()}">${chart.difficulty?.toUpperCase()} ${
          chart.level
        }</span>`
    )
    .join('');

  card.innerHTML = `
        ${
          song.imageUrl
            ? `<div class="song-image"><img src="${
                song.imageUrl
              }" alt="${escapeHtml(
                song.title
              )}" onerror="this.style.display='none'"></div>`
            : ''
        }
        <div class="song-title">${escapeHtml(song.title)}</div>
        <div class="song-artist">${escapeHtml(song.artist)}</div>
        <div class="song-category">${escapeHtml(song.category)}</div>
        <div class="song-charts">${chartBadges}</div>
    `;

  return card;
}

function createRandomSongCard(song) {
  const card = document.createElement('div');
  card.className = 'random-song-card';
  card.onclick = () => showSongDetail(song);

  const charts = song.charts || [];
  const chartBadges = charts
    .map(
      (chart) =>
        `<span class="chart-badge ${chart.difficulty?.toLowerCase()}">${chart.difficulty?.toUpperCase()} ${
          chart.level
        }</span>`
    )
    .join('');

  card.innerHTML = `
        ${
          song.imageUrl
            ? `<div class="random-song-image"><img src="${
                song.imageUrl
              }" alt="${escapeHtml(
                song.title
              )}" onerror="this.style.display='none'"></div>`
            : ''
        }
        <div class="random-song-title">${escapeHtml(song.title)}</div>
        <div class="random-song-artist">${escapeHtml(song.artist)}</div>
        <div class="random-song-category">${escapeHtml(song.category)}</div>
        <div class="song-charts" style="margin-top: 10px;">${chartBadges}</div>
    `;

  return card;
}
function getChartTypeImage(type) {
  if (!type) return '/image/std.png';
  const typeUpper = type.toUpperCase();
  return typeUpper === 'DX' ? '/image/dx.png' : '/image/std.png';
}

function showSongDetail(song) {
  const charts = song.charts || [];

  const difficultyOrder = [
    'BASIC',
    'ADVANCED',
    'EXPERT',
    'MASTER',
    'RE:MASTER',
    'REMASTER',
  ];
  const sortedCharts = [...charts].sort((a, b) => {
    const diffCompare =
      difficultyOrder.indexOf(a.difficulty?.toUpperCase()) -
      difficultyOrder.indexOf(b.difficulty?.toUpperCase());
    if (diffCompare !== 0) return diffCompare;
    // If same difficulty, sort STD before DX
    return (a.type === 'DX' ? 1 : 0) - (b.type === 'DX' ? 1 : 0);
  });

  // Group by difficulty
  const chartsByDifficulty = sortedCharts.reduce((acc, chart) => {
    const diff = chart.difficulty?.toUpperCase() || 'UNKNOWN';
    if (!acc[diff]) {
      acc[diff] = [];
    }
    acc[diff].push(chart);
    return acc;
  }, {});

  const chartsHtml = difficultyOrder
    .filter((diff) => chartsByDifficulty[diff])
    .map((difficulty) => {
      const charts = chartsByDifficulty[difficulty];
      const chartsList = charts
        .map(
          (chart) => `
                <div class="chart-detail">
                    <img src="${getChartTypeImage(chart.type)}" alt="${
            chart.type || 'Standard'
          }" class="chart-type-img" onerror="this.style.display='none'">
                    <span class="chart-difficulty">${difficulty} ${
            chart.level || 'N/A'
          }</span>
                </div>
            `
        )
        .join('');

      return `
                <div class="difficulty-group">
                    <h4 class="difficulty-title ${difficulty.toLowerCase()}">${difficulty}</h4>
                    ${chartsList}
                </div>
            `;
    })
    .join('');

  modalContent.innerHTML = `
        <div class="song-detail">
            <div class="modal-header">
                <h2 class="modal-title">${escapeHtml(song.title)}</h2>
                <div class="modal-artist">${escapeHtml(song.artist)}</div>
                ${
                  song.imageUrl
                    ? `<div class="modal-image"><img src="${
                        song.imageUrl
                      }" alt="${escapeHtml(
                        song.title
                      )}" onerror="this.style.display='none'"></div>`
                    : ''
                }
            </div>
            <div class="modal-info">
                <div class="modal-category">${escapeHtml(song.category)}</div>
                ${
                  song.releaseDate
                    ? `<div class="modal-release">Released: ${new Date(
                        song.releaseDate
                      ).toLocaleDateString()}</div>`
                    : ''
                }
                ${
                  song.version
                    ? `<div class="modal-version">Version: ${escapeHtml(
                        song.version
                      )}</div>`
                    : ''
                }
            </div>
            
            <div class="charts-section">
                <h3>Charts</h3>
                ${chartsHtml || '<p>No charts available</p>'}
            </div>
        </div>
    `;

  songModal.classList.remove('hidden');
}

// Utility functions
function updateResultsInfo(title, count) {
  resultsTitle.textContent = title;
  resultsCount.textContent = count;
}

function showLoading() {
  loading.classList.remove('hidden');
}

function hideLoading() {
  loading.classList.add('hidden');
}

function showError(message) {
  alert(message);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Example usage:
const chart = { type: 'DX' };
const imgSrc = getChartTypeImage(chart.type);
document.getElementById('chartTypeImg').src = imgSrc;

const additionalStyles = `
    .song-detail {
        color: #2d3748;
    }
    
    .modal-title {
        font-size: 1.8rem;
        font-weight: 700;
        margin-bottom: 10px;
        color: #2d3748;
    }
    
    .modal-artist {
        font-size: 1.2rem;
        color: #718096;
        margin-bottom: 15px;
    }
    
    .modal-category {
        display: inline-block;
        background: #667eea;
        color: white;
        padding: 6px 16px;

        font-size: 0.9rem;
        font-weight: 500;
        margin-bottom: 15px;
    }
    
    .modal-release, .modal-version {
        color: #718096;
        font-size: 0.9rem;
        margin-bottom: 8px;
    }
    
    .charts-section {
        margin-top: 25px;
    }
    
    .charts-section h3 {
        font-size: 1.3rem;
        font-weight: 600;
        margin-bottom: 15px;
        color: #4a5568;
    }
    
    .difficulty-group {
        margin-bottom: 20px;
    }
    
    .difficulty-title {
        font-size: 1.3rem;
        font-weight: 600;
        margin-bottom: 10px;

    }
    
    .difficulty-title.basic { color: #1c6040ff; }
    .difficulty-title.advanced { color: #d5ac27ff; }
    .difficulty-title.expert { color: #b30b0bff; }
    .difficulty-title.master { color: #6d1370ff; }
    .difficulty-title.remaster { color: #db21b0ff; }
    
    .chart-detail {
        background: #f7fafc;
        padding: 10px 15px;
        margin: 5px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .chart-type {
        font-weight: 600;
        color: #2d3748;
    }
    
    .chart-difficulty {
        color: #718096;
        font-size: 0.9rem;
    }
    
    .song-image img, .random-song-image img {
        width: 120px;
        height: 120px;
        object-fit: cover;
        margin-bottom: 15px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .random-song-image img {
        width: 140px;
        height: 140px;
    }
    
    
    .no-results {
        text-align: center;
        color: #718096;
        font-size: 1.1rem;
        padding: 40px;
    }
        .chart-badge.BASIC{ background-color: #1c6040ff;color :white; }
        .chart-badge.ADVANCED{ background-color: #d5ac27ff;color :white; }
        .chart-badge.EXPERT{ background-color: #b30b0bff;color :white; }
        .chart-badge.MASTER{ background-color: #6d1370ff;color :white; }
        .chart-badge.REMASTER{ background-color: #db21b0ff;color :white;
        }
        .modal-content {
  border-radius: 0;
}
.modal-category{
  border-radius: 10px;}
.chart-badge {
  border-radius: 0; 
}
  .hidden {
  display: none !important;  /* removes it from the page completely */
}
`;
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
