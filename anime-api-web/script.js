// ======================
// KONFIGURASI API
// ======================
const CONSUMET_API = 'https://api.consumet.org/anime/gogoanime';
const CORS_PROXY = 'https://api.allorigins.win/raw?url='; // Proxy untuk handle CORS

// ======================
// STATE MANAGEMENT
// ======================
let currentPage = 1;
let totalPages = 1;
let currentSearch = '';
let currentAnimeId = '';
let currentEpisodeId = '';
let episodesList = [];

// ======================
// DOM ELEMENTS
// ======================
const animeGrid = document.getElementById('animeGrid');
const listTitle = document.getElementById('listTitle');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageInfo = document.getElementById('pageInfo');
const loadingModal = document.getElementById('loadingModal');
const animeSection = document.getElementById('animeSection');
const detailSection = document.getElementById('detailSection');
const watchSection = document.getElementById('watchSection');
const animeDetail = document.getElementById('animeDetail');
const watchContainer = document.getElementById('watchContainer');
const homeLink = document.getElementById('homeLink');
const popularLink = document.getElementById('popularLink');

// ======================
// FUNGSI LOADING
// ======================
function showLoading() {
  loadingModal.style.display = 'flex';
}

function hideLoading() {
  loadingModal.style.display = 'none';
}

// ======================
// FUNGSI FETCH & RENDER
// ======================
async function fetchPopularAnime(page = 1) {
  showLoading();
  try {
    const url = `${CORS_PROXY}${encodeURIComponent(`${CONSUMET_API}/popular?page=${page}`)}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.results) {
      renderAnimeGrid(data.results);
      totalPages = data.totalPages || 1;
      currentPage = page;
      updatePagination();
    }
  } catch (error) {
    console.error('Error:', error);
    // Fallback: coba langsung tanpa proxy
    try {
      const res = await fetch(`${CONSUMET_API}/popular?page=${page}`);
      const data = await res.json();
      if (data.results) {
        renderAnimeGrid(data.results);
        totalPages = data.totalPages || 1;
        currentPage = page;
        updatePagination();
      }
    } catch (err) {
      animeGrid.innerHTML = '<p style="color:red;">❌ Gagal memuat. Coba refresh.</p>';
    }
  }
  hideLoading();
}

async function searchAnime(query, page = 1) {
  showLoading();
  try {
    const url = `${CORS_PROXY}${encodeURIComponent(`${CONSUMET_API}/${query}?page=${page}`)}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.results) {
      renderAnimeGrid(data.results);
      totalPages = data.totalPages || 1;
      currentPage = page;
      updatePagination();
    }
  } catch (error) {
    try {
      const res = await fetch(`${CONSUMET_API}/${query}?page=${page}`);
      const data = await res.json();
      if (data.results) {
        renderAnimeGrid(data.results);
        totalPages = data.totalPages || 1;
        currentPage = page;
        updatePagination();
      }
    } catch (err) {
      animeGrid.innerHTML = '<p style="color:red;">❌ Anime tidak ditemukan.</p>';
    }
  }
  hideLoading();
}

function renderAnimeGrid(animeList) {
  animeGrid.innerHTML = '';
  
  if (!animeList || animeList.length === 0) {
    animeGrid.innerHTML = '<p>Tidak ada anime ditemukan.</p>';
    return;
  }

  animeList.forEach(anime => {
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => showAnimeDetail(anime.id);

    card.innerHTML = `
      <img src="${anime.image}" alt="${anime.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x400?text=No+Image'">
      <div class="info">
        <div class="title">${anime.title}</div>
        <div class="meta">
          <span>${anime.type || 'N/A'}</span>
          <span class="status">${anime.status || ''}</span>
        </div>
      </div>
    `;

    animeGrid.appendChild(card);
  });
}

function updatePagination() {
  prevPageBtn.style.display = currentPage > 1 ? 'inline-block' : 'none';
  nextPageBtn.style.display = currentPage < totalPages ? 'inline-block' : 'none';
  pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
  pageInfo.style.display = totalPages > 1 ? 'inline' : 'none';
}

// ======================
// FUNGSI DETAIL ANIME
// ======================
async function showAnimeDetail(animeId) {
  showLoading();
  currentAnimeId = animeId;
  
  try {
    const url = `${CORS_PROXY}${encodeURIComponent(`${CONSUMET_API}/info/${animeId}`)}`;
    const res = await fetch(url);
    const data = await res.json();

    // Sembunyikan section lain
    animeSection.style.display = 'none';
    detailSection.style.display = 'block';
    watchSection.style.display = 'none';

    // Simpan daftar episode
    episodesList = data.episodes || [];

    // Render detail
    animeDetail.innerHTML = `
      <div class="detail-container">
        <img src="${data.image}" alt="${data.title}" onerror="this.src='https://via.placeholder.com/300x400?text=No+Image'">
        <div class="detail-info">
          <h2>${data.title}</h2>
          <div class="meta-tags">
            <span>📺 ${data.type || 'N/A'}</span>
            <span>📊 ${data.status || 'N/A'}</span>
            <span>🎬 ${data.totalEpisodes || '?'} Episode</span>
            <span>📅 ${data.releaseDate || 'N/A'}</span>
          </div>
          <h3>Sinopsis</h3>
          <p class="synopsis">${data.description || 'Tidak ada sinopsis.'}</p>
          
          <h3>🎬 Daftar Episode</h3>
          <div class="episodes-grid">
            ${episodesList.slice(0, 50).map(ep => `
              <button class="ep-btn" onclick="watchEpisode('${ep.id}', '${data.id}')">
                ${ep.number}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    window.scrollTo(0, 0);
  } catch (error) {
    try {
      const res = await fetch(`${CONSUMET_API}/info/${animeId}`);
      const data = await res.json();
      
      animeSection.style.display = 'none';
      detailSection.style.display = 'block';
      watchSection.style.display = 'none';
      
      episodesList = data.episodes || [];
      
      animeDetail.innerHTML = `
        <div class="detail-container">
          <img src="${data.image}" alt="${data.title}">
          <div class="detail-info">
            <h2>${data.title}</h2>
            <div class="meta-tags">
              <span>📺 ${data.type || 'N/A'}</span>
              <span>📊 ${data.status || 'N/A'}</span>
              <span>🎬 ${data.totalEpisodes || '?'} Episode</span>
            </div>
            <h3>Sinopsis</h3>
            <p class="synopsis">${data.description || 'Tidak ada sinopsis.'}</p>
            
            <h3>🎬 Daftar Episode</h3>
            <div class="episodes-grid">
              ${episodesList.slice(0, 50).map(ep => `
                <button class="ep-btn" onclick="watchEpisode('${ep.id}', '${data.id}')">
                  ${ep.number}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      animeDetail.innerHTML = '<p style="color:red;">❌ Gagal memuat detail.</p>';
    }
  }
  
  hideLoading();
}

// ======================
// FUNGSI NONTON EPISODE
// ======================
async function watchEpisode(episodeId, animeId) {
  showLoading();
  currentEpisodeId = episodeId;
  
  try {
    const url = `${CORS_PROXY}${encodeURIComponent(`${CONSUMET_API}/watch/${episodeId}`)}`;
    const res = await fetch(url);
    const data = await res.json();

    // Sembunyikan section lain
    animeSection.style.display = 'none';
    detailSection.style.display = 'none';
    watchSection.style.display = 'block';

    // Cari sumber video
    const videoSource = data.sources?.find(s => s.quality === 'default' || s.quality === '720p') || data.sources?.[0];
    const embedUrl = data.headers?.Referer 
      ? `${data.headers.Referer}?url=${encodeURIComponent(videoSource?.url || '')}` 
      : videoSource?.url || '';

    // Render halaman nonton
    watchContainer.innerHTML = `
      <div class="video-container">
        <iframe 
          src="${videoSource?.url || ''}" 
          allowfullscreen="true"
          frameborder="0"
          sandbox="allow-same-origin allow-scripts"
        ></iframe>
      </div>
      
      <div class="episode-selector" style="margin-top: 1.5rem; display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
        <select id="episodeSelect" style="padding: 0.6rem 1rem; background: #1e1e1e; color: white; border: 1px solid #333; border-radius: 8px;">
          ${episodesList.map((ep, idx) => `
            <option value="${ep.id}" ${ep.id === episodeId ? 'selected' : ''}>
              Episode ${ep.number}
            </option>
          `).join('')}
        </select>
        <button onclick="changeEpisode()" style="padding: 0.6rem 1.5rem; background: #ff4757; border: none; color: white; border-radius: 8px; cursor: pointer;">
          ➤ Tonton
        </button>
      </div>
    `;

    window.scrollTo(0, 0);
  } catch (error) {
    try {
      const res = await fetch(`${CONSUMET_API}/watch/${episodeId}`);
      const data = await res.json();
      
      animeSection.style.display = 'none';
      detailSection.style.display = 'none';
      watchSection.style.display = 'block';
      
      const videoSource = data.sources?.find(s => s.quality === 'default' || s.quality === '720p') || data.sources?.[0];
      
      watchContainer.innerHTML = `
        <div class="video-container">
          <iframe src="${videoSource?.url || ''}" allowfullscreen></iframe>
        </div>
        
        <div class="episode-selector" style="margin-top: 1.5rem;">
          <select id="episodeSelect" style="padding: 0.6rem 1rem;">
            ${episodesList.map(ep => `
              <option value="${ep.id}" ${ep.id === episodeId ? 'selected' : ''}>
                Episode ${ep.number}
              </option>
            `).join('')}
          </select>
          <button onclick="changeEpisode()">➤ Tonton</button>
        </div>
      `;
    } catch (err) {
      watchContainer.innerHTML = '<p style="color:red;">❌ Gagal memuat video. Episode mungkin tidak tersedia.</p>';
    }
  }
  
  hideLoading();
}

// Fungsi ganti episode
function changeEpisode() {
  const select = document.getElementById('episodeSelect');
  if (select) {
    const newEpisodeId = select.value;
    watchEpisode(newEpisodeId, currentAnimeId);
  }
}

// ======================
// EVENT LISTENERS
// ======================

// Tombol search
searchBtn.addEventListener('click', () => {
  const query = searchInput.value.trim();
  if (query) {
    currentSearch = query;
    listTitle.textContent = `🔍 Hasil Pencarian: "${query}"`;
    searchAnime(query, 1);
  }
});

// Enter di search
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchBtn.click();
});

// Pagination
prevPageBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    const newPage = currentPage - 1;
    if (currentSearch) {
      searchAnime(currentSearch, newPage);
    } else {
      fetchPopularAnime(newPage);
    }
  }
});

nextPageBtn.addEventListener('click', () => {
  if (currentPage < totalPages) {
    const newPage = currentPage + 1;
    if (currentSearch) {
      searchAnime(currentSearch, newPage);
    } else {
      fetchPopularAnime(newPage);
    }
  }
});

// Home
homeLink.addEventListener('click', (e) => {
  e.preventDefault();
  currentSearch = '';
  searchInput.value = '';
  listTitle.textContent = '🔥 Anime Terpopuler';
  animeSection.style.display = 'block';
  detailSection.style.display = 'none';
  watchSection.style.display = 'none';
  fetchPopularAnime(1);
});

// Popular
popularLink.addEventListener('click', (e) => {
  e.preventDefault();
  currentSearch = '';
  searchInput.value = '';
  listTitle.textContent = '🔥 Anime Terpopuler';
  animeSection.style.display = 'block';
  detailSection.style.display = 'none';
  watchSection.style.display = 'none';
  fetchPopularAnime(1);
});

// Tombol kembali
document.addEventListener('click', (e) => {
  if (e.target.id === 'backBtn') {
    animeSection.style.display = 'block';
    detailSection.style.display = 'none';
    watchSection.style.display = 'none';
  }
  
  if (e.target.id === 'backFromWatchBtn') {
    animeSection.style.display = 'none';
    detailSection.style.display = 'block';
    watchSection.style.display = 'none';
  }
});

// ======================
// LOAD PERTAMA
// ======================
fetchPopularAnime(1);
