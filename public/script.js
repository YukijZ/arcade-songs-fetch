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
let allSongs = [];
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
const closeModal = document.querySelector('.close');

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
  showLoading();
  await loadRandomSongs();
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

  closeModal.addEventListener('click', () => {
    songModal.classList.add('hidden');
  });

  window.addEventListener('click', (e) => {
    if (e.target === songModal) {
      songModal.classList.add('hidden');
    }
  });
}

// API functions
async function fetchSongs() {
  try {
    const response = await fetch('/api/songs');
    if (!response.ok) throw new Error('Failed to fetch songs');
    return await response.json();
  } catch (error) {
    console.error('Error fetching songs:', error);
    showError('Failed to load songs. Please try again.');
    return [];
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
    return await response.json();
  } catch (error) {
    console.error('Error searching songs:', error);
    showError('Failed to search songs. Please try again.');
    return [];
  }
}

// Load random songs
async function loadRandomSongs() {
  allSongs = await fetchSongs();

  allSongs.sort((a, b) => {
    const dateA = new Date(a.releaseDate);
    const dateB = new Date(b.releaseDate);

    if (dateA < dateB) {
      return 1;
    }
    if (dateA > dateB) {
      return -1;
    }
    return 0;
  });

  currentSongs = allSongs;
  displaySongs(currentSongs);
  updateResultsInfo('Songs', allSongs.length);
}

// Handle search
async function handleSearch() {
  const query = searchInput.value.trim();

  if (!query) {
    // Just clear the search results, don't reload random songs
    currentSongs = [];
    displaySongs(currentSongs);
    updateResultsInfo('Random Songs', 0);
    return;
  }

  showLoading();
  const searchResults = await searchSongs(query);
  hideLoading();

  currentSongs = searchResults;
  displaySongs(currentSongs);
  updateResultsInfo(`Search Results for "${query}"`, searchResults.length);
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
  return type === 'DX' ? '/image/dx.png' : '/image/std.png';
}

function showSongDetail(song) {
  const charts = song.charts || [];

  const chartsByDifficulty = charts.reduce((acc, chart) => {
    if (!acc[chart.difficulty]) {
      acc[chart.difficulty] = [];
    }
    acc[chart.difficulty].push(chart);
    return acc;
  }, {});

  const chartsHtml = Object.entries(chartsByDifficulty)
    .map(([difficulty, charts]) => {
      const chartsList = charts
        .map(
          (chart) => `
                <div class="chart-detail">
                    <img src="${getChartTypeImage(chart.type)}" alt="${
            chart.type
          }" class="chart-type-img">
                    <span class="chart-difficulty">${chart.difficulty.toUpperCase()} ${
            chart.level
          }</span>
                </div>
            `
        )
        .join('');

      return `
                <div class="difficulty-group">
                    <h4 class="difficulty-title ${difficulty.toLowerCase()}">${difficulty.toUpperCase()}</h4>
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
`;
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
