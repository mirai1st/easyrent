function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function summoncard(rentid, title, img, price, totalShower, totalRoom, gender, location, originalposter) {
    const images = (Array.isArray(img) ? img : [img]).filter(Boolean);
    const cardImages = images.length
        ? images
        : ['https://via.placeholder.com/400x250?text=No+Image'];

    const imagesHTML = cardImages.map((image, index) =>
        `<img src="${escapeHtml(image)}" class="carousel-img${index === 0 ? ' active' : ''}" alt="${escapeHtml(title)}">`
    ).join('');

    const dotsHTML = cardImages.map((_, index) =>
        `<span class="dot${index === 0 ? ' active' : ''}"></span>`
    ).join('');

    return `
        <div class="card">
            <div class="image-carousel">
                <div class="carousel-track">
                    ${imagesHTML}
                </div>
                <button class="carousel-btn prev" type="button" onclick="moveCarousel(this, -1)" aria-label="Previous image">&#10094;</button>
                <button class="carousel-btn next" type="button" onclick="moveCarousel(this, 1)" aria-label="Next image">&#10095;</button>
                <div class="carousel-dots">
                    ${dotsHTML}
                </div>
            </div>
            <div class="card-info">
                <p class="title">RM ${escapeHtml(price.toLocaleString())} <span>/bulan</span></p>
                <p class="subtitle"><i class="fa-solid fa-bed"></i>&nbsp; ${escapeHtml(totalRoom)} &nbsp; <i class="fa-solid fa-shower"></i>&nbsp; ${escapeHtml(totalShower)} &nbsp;<span class="divider">|</span> ${escapeHtml(gender)}</p>
                <p class="text-header">${escapeHtml(title)}</p>
                <p>${escapeHtml(location)}</p>
                <p class="text-header">Posted by</p>
                <p>@${escapeHtml(originalposter)}</p>
            </div>
            <div class="card-footer">
                <a href="/house/?id=${escapeHtml(rentid)}"><i class="fa-solid fa-circle-info"></i>&nbsp; More Info</a>
                <a onclick="contact('${escapeHtml(originalposter)}')"><i class="fa-regular fa-message"></i>&nbsp; Contact</a>
            </div>
        </div>
    `;
}

// Fungsi untuk mengekalkan nilai filter dari URL Parameter ke dalam Input HTML
function populateFilterFields(query) {
    const searchQuery = query.get('search');
    const lokasi = query.get('lokasi');
    const bilikAir = query.get('bilikAir');
    const bilikTidur = query.get('bilikTidur');
    const hargaMin = query.get('hargaMin');
    const hargaMax = query.get('hargaMax');
    const jantina = query.get('jantina');

    // 1. Isikan Kata Kunci Carian (Search Input & Hidden Search Input)
    if (searchQuery !== null) {
        document.querySelectorAll('.search-container input[name=search]').forEach(input => {
            input.value = searchQuery;
        });
        document.querySelectorAll('.hidden-search-input').forEach(hiddenInput => {
            hiddenInput.value = searchQuery;
        });
    }

    // 2. Isikan Institusi / Lokasi
    if (lokasi !== null) {
        const lokasiInput = document.getElementById('desktop-lokasi');
        if (lokasiInput) lokasiInput.value = lokasi;
    }

    // 3. Isikan Bilik Air Minimum
    if (bilikAir !== null) {
        const bilikAirInput = document.getElementById('desktop-bilik-air');
        if (bilikAirInput) bilikAirInput.value = bilikAir;
    }

    // 4. Isikan Bilik Tidur Minimum
    if (bilikTidur !== null) {
        const bilikTidurInput = document.getElementById('desktop-bilik-tidur');
        if (bilikTidurInput) bilikTidurInput.value = bilikTidur;
    }

    // 5. Isikan Harga Min & Max
    if (hargaMin !== null) {
        const hargaMinInput = document.getElementById('desktop-harga-min');
        if (hargaMinInput) hargaMinInput.value = hargaMin;
    }
    if (hargaMax !== null) {
        const hargaMaxInput = document.getElementById('desktop-harga-max');
        if (hargaMaxInput) hargaMaxInput.value = hargaMax;
    }

    // 6. Pilih Radio Button Jantina
    if (jantina !== null) {
        const jantinaRadio = document.querySelector(`form.desktop-filter-form input[name="jantina"][value="${jantina}"]`);
        if (jantinaRadio) {
            jantinaRadio.checked = true;
        }
    }
}

async function fetchHouseData() {
    const cardContainers = document.querySelectorAll('.card-container');
    const resultCount = document.getElementById('result-count');

    if (!cardContainers.length) {
        return;
    }

    const query = new URLSearchParams(window.location.search);

    // Isikan semua input form berdasarkan URL Parameter terkini
    populateFilterFields(query);

    const endpoint = `/api/house/fetch?${query.toString()}`;

    cardContainers.forEach((container) => {
        container.innerHTML = '<p class="search-status">Memuatkan rumah...</p>';
    });

    try {
        const response = await fetch(endpoint);
        const houses = await response.json();

        if (!response.ok) {
            throw new Error(houses.message || 'Gagal mendapatkan senarai rumah.');
        }

        if (!houses.length) {
            resultCount.textContent = '0';
            cardContainers.forEach((container) => {
                container.innerHTML = '<p class="search-status">Tiada rumah yang sepadan dengan carian.</p>';
            });
            return;
        }

        resultCount.textContent = houses.length;

        const cardsHTML = houses.map((house) => summoncard(
            house.house_id,
            house.title,
            house.images,
            house.price,
            house.totalShower,
            house.totalRoom,
            house.gender,
            house.location,
            house.originalposter
        )).join('');

        cardContainers.forEach((container) => {
            container.innerHTML = cardsHTML;
        });
    } catch (error) {
        console.error('House search error:', error);
        cardContainers.forEach((container) => {
            container.innerHTML = '<p class="search-status">Carian rumah gagal. Sila cuba lagi.</p>';
        });
    }
}

async function contact(posterUsername) {
    if (!posterUsername) return;

    if (typeof loadUser !== "function") {
        console.error("loadUser() is not defined.");
        return;
    }

    const { user, error } = await loadUser();
    
    if (error || !user) {
        if (typeof checkLoginModal === "function") checkLoginModal();
        return;
    }

    if (user.username === posterUsername) {
        if (typeof showNotification === "function") {
            showNotification("Anda tidak boleh mesej diri sendiri!", "error", 3000);
        } else {
            alert("Anda tidak boleh mesej diri sendiri!");
        }
        return;
    }

    if (typeof startChat === "function") {
        startChat(posterUsername);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchHouseData();

    // Penyelarasan real-time jika pengguna menaip di search bar utama
    const mainSearchInputs = document.querySelectorAll('.search-container input[name=search]');
    const hiddenInputs = document.querySelectorAll('.hidden-search-input');

    mainSearchInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            hiddenInputs.forEach(hiddenInput => {
                hiddenInput.value = e.target.value;
            });
        });
    });
});