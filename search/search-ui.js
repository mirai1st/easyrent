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
                <a href="#"><i class="fa-regular fa-message"></i>&nbsp; Contact</a>
            </div>
        </div>
    `;
}

async function fetchHouseData() {
    const cardContainers = document.querySelectorAll('.card-container');
    const searchContainers = document.querySelectorAll('.search-container');
    const resultCount = document.getElementById('result-count');

    if (!cardContainers.length) {
        return;
    }

    const query = new URLSearchParams(window.location.search);
    const selectedInstitution = query.get('lokasi');
    const searchQuery = query.get('search');

    if (searchQuery) {
        searchContainers.forEach(container => {
            const input = container.querySelector('input[name=search]');
            if (input) {
                input.value = searchQuery;
            }
        });
    }

    if (selectedInstitution) {
        query.set('lokasi', selectedInstitution);
    }
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

document.addEventListener('DOMContentLoaded', fetchHouseData);
