// Konfigurasi
const API_BASE = 'https://api.jikan.moe/v4';
let currentPage = 1;
let currentQuery = '';
let isLoading = false;

// Ambil elemen HTML
const animeGrid = document.getElementById('animeGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const listTitle = document.getElementById('listTitle');
const homeLink = document.getElementById('homeLink');

// Modal
const modal = document.getElementById('animeModal');
const modalDetails = document.getElementById('modalDetails');
const closeModal = document.querySelector('.close');

// ======================
// FUNGSI FETCH DATA
// ======================
async function fetchAnime(query = '', page = 1) {
  if (isLoading) return;
  isLoading = true;
  showLoading();

  try {
    let url;
    if (query) {
      // Cari anime berdasarkan keyword
      url = `${API_BASE}/anime?q=${encodeURIComponent(query)}&page=${page}&limit=12`;
    } else {
      // Ambil anime terpopuler
      url = `${API_BASE}/top/anime?page=${page}&limit=12`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Gagal fetch');
    
    const data = await response.json();
    renderAnime(data.data, page === 1); // Jika halaman 1, hapus grid dulu
    loadMoreBtn.style.display = data.pagination.has_next_page ? 'inline-block' : 'none';
  } catch (error) {
    console.error('Error:', error);
    animeGrid.innerHTML = '<p style="color:red;">Gagal memuat data. Coba lagi nanti.</p>';
  } finally {
    isLoading = false;
    hideLoading();
  }
}

// ======================
// FUNGSI RENDER KARTU
// ======================
function renderAnime(animeList, clearGrid = false) {
  if (clearGrid) animeGrid.innerHTML = '';

  if (!animeList || animeList.length === 0) {
    animeGrid.innerHTML += '<p>Tidak ada anime ditemukan.</p>';
    return;
  }

  animeList.forEach(anime => {
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => showAnimeDetail(anime.mal_id);

    card.innerHTML = `
      <img src="${anime.images.jpg.large_image_url}" alt="${anime.title}" loading="lazy">
      <div class="info">
        <div class="title">${anime.title}</div>
        <div class="meta">
          <span>${anime.type || 'N/A'}</span>
          <span class="score">⭐ ${anime.score ?? '?'}</span>
        </div>
      </div>
    `;

    animeGrid.appendChild(card);
  });
}

// ======================
// FUNGSI MODAL DETAIL
// ======================
async function showAnimeDetail(id) {
  try {
    const response = await fetch(`${API_BASE}/anime/${id}/full`);
    const data = await response.json();
    const anime = data.data;

    modalDetails.innerHTML = `
      <h2>${anime.title}</h2>
      <img src="${anime.images.jpg.large_image_url}" alt="${anime.title}">
      <div class="info-row">
        <span>📺 ${anime.type}</span>
        <span>📊 ${anime.status}</span>
        <span>⭐ ${anime.score ?? 'N/A'}</span>
        <span>🎬 ${anime.episodes ?? '?'} eps</span>
        <span>📅 ${anime.year ?? 'N/A'}</span>
      </div>
      <h3>Sinopsis</h3>
      <p class="synopsis">${anime.synopsis || 'Tidak ada sinopsis.'}</p>
    `;

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  } catch (error) {
    console.error('Gagal ambil detail:', error);
  }
}

// ======================
// LOADING
// ======================
function showLoading() {
  const loader = document.createElement('div');
  loader.className = 'loading';
  loader.id = 'loader';
  loader.textContent = 'Memuat...';
  animeGrid.appendChild(loader);
}

function hideLoading() {
  const loader = document.getElementById('loader');
  if (loader) loader.remove();
}

// ======================
// EVENT LISTENERS
// ======================

// Cari anime
searchBtn.addEventListener('click', () => {
  currentQuery = searchInput.value.trim();
  currentPage = 1;
  listTitle.textContent = currentQuery ? `Hasil Pencarian: "${currentQuery}"` : 'Anime Terpopuler';
  fetchAnime(currentQuery, currentPage);
});

// Tekan Enter di kolom search
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchBtn.click();
  }
});

// Tombol "Muat Lebih Banyak"
loadMoreBtn.addEventListener('click', () => {
  currentPage++;
  fetchAnime(currentQuery, currentPage);
});

// Klik "Home" untuk reset
homeLink.addEventListener('click', (e) => {
  e.preventDefault();
  currentQuery = '';
  currentPage = 1;
  searchInput.value = '';
  listTitle.textContent = 'Anime Terpopuler';
  fetchAnime('', 1);
});

// Tutup modal
closeModal.onclick = () => {
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
};

window.onclick = (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
};

// ======================
// LOAD PERTAMA KALI
// ======================
fetchAnime('', 1);
