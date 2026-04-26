// ======================
// KONFIGURASI
// ======================
const ANILIST_API = 'https://graphql.anilist.co';

// Proxy untuk bypass blokiran ISP (gratis)
const PROXY = 'https://api.allorigins.win/raw?url=';

// Multi-source embed player
const EMBED_SOURCES = {
  // 2Embed (paling ringan)
  twoEmbed: (malId, epNum) => `https://www.2embed.cc/embed/${malId}/${epNum}`,
  
  // MultiEmbed (support banyak server)
  multiEmbed: (malId, epNum) => `https://multiembed.mov/directstream/${malId}/${epNum}`,
  
  // EMBED.SU
  embedSu: (malId, epNum) => `https://embed.su/embed/anime/${malId}/${epNum}`,
  
  // VidLink
  vidLink: (malId, epNum) => `https://vidlink.pro/anime/${malId}/${epNum}`,
  
  // SmashyStream
  smashy: (malId, epNum) => `https://player.smashy.stream/anime/${malId}/${epNum}`,
};

// ======================
// STATE
// ======================
let currentPage = 1;
let hasNextPage = false;
let currentView = 'trending';
let currentSearch = '';
let currentAnime = null;
let episodeCount = 0;
let currentEpNum = 1;
let currentSourceIndex = 0;
const totalSources = 5;

// ======================
// DOM
// ======================
const animeGrid = document.getElementById('animeGrid');
const listTitle = document.getElementById('listTitle');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageInfo = document.getElementById('pageInfo');
const loadingOverlay = document.getElementById('loadingOverlay');
const animeSection = document.getElementById('animeSection');
const detailSection = document.getElementById('detailSection');
const watchSection = document.getElementById('watchSection');
const animeDetail = document.getElementById('animeDetail');
const watchContainer = document.getElementById('watchContainer');

// ======================
// LOADING
// ======================
function showLoading() { loadingOverlay.style.display = 'flex'; }
function hideLoading() { loadingOverlay.style.display = 'none'; }

// ======================
// ANILIST GRAPHQL QUERY
// ======================
async function fetchAniList(query, variables) {
  const res = await fetch(ANILIST_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  return res.json();
}

// ======================
// FETCH LIST ANIME
// ======================
async function fetchTrending(page = 1) {
  showLoading();
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { hasNextPage }
        media(sort: TRENDING_DESC, type: ANIME) {
          id
          idMal
          title { romaji english }
          coverImage { large }
          format
          episodes
          averageScore
        }
      }
    }
  `;
  
  try {
    const data = await fetchAniList(query, { page, perPage: 20 });
    const pageData = data.data.Page;
    hasNextPage = pageData.pageInfo.hasNextPage;
    renderAnimeGrid(pageData.media);
    currentPage = page;
    updatePagination();
  } catch (e) {
    animeGrid.innerHTML = '<p style="color:red; text-align:center; padding:2rem;">❌ Gagal memuat data. Coba refresh.</p>';
  }
  hideLoading();
}

async function fetchPopular(page = 1) {
  showLoading();
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { hasNextPage }
        media(sort: POPULARITY_DESC, type: ANIME) {
          id
          idMal
          title { romaji english }
          coverImage { large }
          format
          episodes
          averageScore
        }
      }
    }
  `;
  
  try {
    const data = await fetchAniList(query, { page, perPage: 20 });
    const pageData = data.data.Page;
    hasNextPage = pageData.pageInfo.hasNextPage;
    renderAnimeGrid(pageData.media);
    currentPage = page;
    updatePagination();
  } catch (e) {
    animeGrid.innerHTML = '<p style="color:red; text-align:center; padding:2rem;">❌ Gagal memuat data. Coba refresh.</p>';
  }
  hideLoading();
}

async function searchAniList(search, page = 1) {
  showLoading();
  const query = `
    query ($page: Int, $perPage: Int, $search: String) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { hasNextPage }
        media(search: $search, type: ANIME) {
          id
          idMal
          title { romaji english }
          coverImage { large }
          format
          episodes
          averageScore
        }
      }
    }
  `;
  
  try {
    const data = await fetchAniList(query, { page, perPage: 20, search });
    const pageData = data.data.Page;
    hasNextPage = pageData.pageInfo.hasNextPage;
    renderAnimeGrid(pageData.media);
    currentPage = page;
    updatePagination();
  } catch (e) {
    animeGrid.innerHTML = '<p style="color:red; text-align:center; padding:2rem;">❌ Anime tidak ditemukan.</p>';
  }
  hideLoading();
}

// ======================
// RENDER GRID
// ======================
function renderAnimeGrid(mediaList) {
  animeGrid.innerHTML = '';
  
  if (!mediaList || mediaList.length === 0) {
    animeGrid.innerHTML = '<p style="text-align:center; padding:2rem;">Tidak ada anime ditemukan.</p>';
    return;
  }

  mediaList.forEach(anime => {
    const title = anime.title.english || anime.title.romaji || 'Unknown';
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => showDetail(anime);

    card.innerHTML = `
      <img src="${anime.coverImage.large}" alt="${title}" loading="lazy" onerror="this.src='https://placehold.co/300x400/1a1a1a/ff4757?text=No+Image'">
      <div class="info">
        <div class="title">${title}</div>
        <div class="meta">
          <span>${anime.format || 'N/A'}</span>
          <span>⭐ ${anime.averageScore ? (anime.averageScore/10).toFixed(1) : '?'}</span>
        </div>
      </div>
    `;

    animeGrid.appendChild(card);
  });
}

function updatePagination() {
  prevPageBtn.style.display = currentPage > 1 ? 'inline-block' : 'none';
  nextPageBtn.style.display = hasNextPage ? 'inline-block' : 'none';
  pageInfo.textContent = `Hal ${currentPage}`;
  pageInfo.style.display = 'inline';
}

// ======================
// DETAIL ANIME
// ======================
async function showDetail(anime) {
  showLoading();
  
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        idMal
        title { romaji english }
        coverImage { large extraLarge }
        bannerImage
        description(asHtml: false)
        format
        status
        episodes
        duration
        season
        seasonYear
        averageScore
        genres
        studios { nodes { name } }
      }
    }
  `;
  
  try {
    const data = await fetchAniList(query, { id: anime.id });
    const detail = data.data.Media;
    currentAnime = detail;
    episodeCount = detail.episodes || 12;
    
    const title = detail.title.english || detail.title.romaji || 'Unknown';
    
    animeSection.style.display = 'none';
    detailSection.style.display = 'block';
    watchSection.style.display = 'none';
    
    const genreTags = (detail.genres || []).map(g => `<span>${g}</span>`).join('');
    const studios = (detail.studios?.nodes || []).map(s => s.name).join(', ');
    
    animeDetail.innerHTML = `
      <div class="detail-container">
        <img src="${detail.coverImage.extraLarge || detail.coverImage.large}" alt="${title}" onerror="this.src='https://placehold.co/300x400?text=No+Image'">
        <div class="detail-info">
          <h2>${title}</h2>
          <div class="meta-tags">
            <span>📺 ${detail.format || 'N/A'}</span>
            <span>📊 ${detail.status || 'N/A'}</span>
            <span>🎬 ${detail.episodes || '?'} Eps</span>
            <span>⭐ ${detail.averageScore ? (detail.averageScore/10).toFixed(1) : '?'}/10</span>
            <span>📅 ${detail.seasonYear || 'N/A'}</span>
            ${studios ? `<span>🎥 ${studios}</span>` : ''}
          </div>
          <div class="meta-tags">${genreTags}</div>
          
          <h3>📝 Sinopsis</h3>
          <div class="synopsis">${detail.description || 'Tidak ada sinopsis.'}</div>
          
          <h3>🎬 Daftar Episode</h3>
          <div class="episodes-grid" id="episodesGrid">
            ${generateEpisodeButtons(episodeCount, detail.idMal || detail.id)}
          </div>
        </div>
      </div>
    `;
    
    window.scrollTo(0, 0);
  } catch (e) {
    animeDetail.innerHTML = '<p style="color:red; text-align:center; padding:2rem;">❌ Gagal memuat detail. Coba lagi.</p>';
  }
  
  hideLoading();
}

function generateEpisodeButtons(count, malId) {
  let buttons = '';
  const maxShow = Math.min(count, 100);
  for (let i = 1; i <= maxShow; i++) {
    buttons += `<button class="ep-btn" onclick="watchAnime(${malId}, ${i})">${i}</button>`;
  }
  return buttons || '<p style="color:#888;">Jumlah episode tidak diketahui.</p>';
}

// ======================
// WATCH ANIME (IFRAME VERSION)
// ======================
function watchAnime(malId, epNum) {
  showLoading();
  currentEpNum = epNum;
  currentSourceIndex = 0;
  
  animeSection.style.display = 'none';
  detailSection.style.display = 'none';
  watchSection.style.display = 'block';
  
  // Primary source: 2Embed via proxy
  const primaryUrl = EMBED_SOURCES.twoEmbed(malId, epNum);
  
  watchContainer.innerHTML = `
    <div class="video-wrapper">
      <iframe 
        id="videoFrame" 
        src="${primaryUrl}"
        allowfullscreen="true"
        allow="autoplay; encrypted-media; picture-in-picture"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
        style="width:100%; height:500px; border:none;"
      ></iframe>
    </div>
    
    <div class="episode-nav">
      <button onclick="changeEp(-1)" ${epNum <= 1 ? 'disabled' : ''}>⬅ Ep Sebelumnya</button>
      
      <select id="epSelect" onchange="jumpToEp()" style="padding:0.5rem; background:#1a1a1a; color:white; border:1px solid #333; border-radius:5px;">
        ${Array.from({length: Math.min(episodeCount, 200)}, (_, i) => i + 1).map(n => 
          `<option value="${n}" ${n === epNum ? 'selected' : ''}>Episode ${n}</option>`
        ).join('')}
      </select>
      
      <button onclick="changeEp(1)" ${epNum >= episodeCount ? 'disabled' : ''}>Ep Selanjutnya ➡</button>
    </div>
    
    <div style="text-align:center; margin-top:1rem;">
      <p style="font-size:0.85rem; margin-bottom:0.5rem;">
        📺 Source: <strong id="sourceLabel">2Embed</strong>
      </p>
      <div style="display:flex; gap:0.5rem; justify-content:center; flex-wrap:wrap;">
        <button onclick="trySource(0, ${malId}, ${epNum})" style="padding:0.5rem 1rem; background:#ff4757; color:white; border:none; border-radius:5px; cursor:pointer;">2Embed</button>
        <button onclick="trySource(1, ${malId}, ${epNum})" style="padding:0.5rem 1rem; background:#333; color:white; border:1px solid #555; border-radius:5px; cursor:pointer;">MultiEmbed</button>
        <button onclick="trySource(2, ${malId}, ${epNum})" style="padding:0.5rem 1rem; background:#333; color:white; border:1px solid #555; border-radius:5px; cursor:pointer;">EMBED.SU</button>
        <button onclick="trySource(3, ${malId}, ${epNum})" style="padding:0.5rem 1rem; background:#333; color:white; border:1px solid #555; border-radius:5px; cursor:pointer;">VidLink</button>
        <button onclick="trySource(4, ${malId}, ${epNum})" style="padding:0.5rem 1rem; background:#333; color:white; border:1px solid #555; border-radius:5px; cursor:pointer;">Smashy</button>
      </div>
    </div>
  `;
  
  window.scrollTo(0, 0);
  hideLoading();
}

// ======================
// SWITCH SOURCE (BUTTON LANGSUNG)
// ======================
function trySource(index, malId, epNum) {
  const allSources = [
    EMBED_SOURCES.twoEmbed(malId, epNum),
    EMBED_SOURCES.multiEmbed(malId, epNum),
    EMBED_SOURCES.embedSu(malId, epNum),
    EMBED_SOURCES.vidLink(malId, epNum),
    EMBED_SOURCES.smashy(malId, epNum),
  ];
  
  const sourceNames = ['2Embed', 'MultiEmbed', 'EMBED.SU', 'VidLink', 'SmashyStream'];
  
  const frame = document.getElementById('videoFrame');
  const label = document.getElementById('sourceLabel');
  
  if (frame) {
    frame.src = allSources[index];
  }
  
  if (label) {
    label.textContent = sourceNames[index];
  }
  
  // Update current source index
  currentSourceIndex = index;
}

// ======================
// EPISODE NAVIGATION
// ======================
function changeEp(delta) {
  const newEp = currentEpNum + delta;
  if (newEp >= 1 && newEp <= episodeCount) {
    const malId = currentAnime?.idMal || currentAnime?.id;
    watchAnime(malId, newEp);
  }
}

function jumpToEp() {
  const select = document.getElementById('epSelect');
  if (!select) return;
  const newEp = parseInt(select.value);
  const malId = currentAnime?.idMal || currentAnime?.id;
  watchAnime(malId, newEp);
}

// ======================
// EVENT LISTENERS
// ======================

searchBtn.addEventListener('click', () => {
  const q = searchInput.value.trim();
  if (q) {
    currentSearch = q;
    currentView = 'search';
    listTitle.textContent = `🔍 Hasil Pencarian: "${q}"`;
    searchAniList(q, 1);
  }
});

searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchBtn.click();
});

document.getElementById('homeLink').addEventListener('click', (e) => {
  e.preventDefault();
  resetToHome();
  fetchTrending(1);
});

document.getElementById('trendingLink').addEventListener('click', (e) => {
  e.preventDefault();
  currentView = 'trending';
  searchInput.value = '';
  listTitle.textContent = '🔥 Trending Anime';
  showListView();
  fetchTrending(1);
});

document.getElementById('popularLink').addEventListener('click', (e) => {
  e.preventDefault();
  currentView = 'popular';
  searchInput.value = '';
  listTitle.textContent = '⭐ Anime Terpopuler';
  showListView();
  fetchPopular(1);
});

prevPageBtn.addEventListener('click', () => {
  const page = currentPage - 1;
  if (page >= 1) {
    if (currentView === 'trending') fetchTrending(page);
    else if (currentView === 'popular') fetchPopular(page);
    else if (currentView === 'search') searchAniList(currentSearch, page);
  }
});

nextPageBtn.addEventListener('click', () => {
  const page = currentPage + 1;
  if (currentView === 'trending') fetchTrending(page);
  else if (currentView === 'popular') fetchPopular(page);
  else if (currentView === 'search') searchAniList(currentSearch, page);
});

document.addEventListener('click', (e) => {
  if (e.target.id === 'backBtn') {
    showListView();
  }
  if (e.target.id === 'backFromWatchBtn') {
    detailSection.style.display = 'block';
    watchSection.style.display = 'none';
    animeSection.style.display = 'none';
  }
});

function resetToHome() {
  currentView = 'trending';
  currentSearch = '';
  currentPage = 1;
  searchInput.value = '';
  listTitle.textContent = '🔥 Trending Anime';
  showListView();
}

function showListView() {
  animeSection.style.display = 'block';
  detailSection.style.display = 'none';
  watchSection.style.display = 'none';
}

// ======================
// INIT
// ======================
fetchTrending(1);
