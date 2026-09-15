const container = document.querySelector('.recommendations-cards');
const containerDesktop = document.querySelector('.recommendations-cards-desktop'); // TUKAR ikut selector desktop sebenar
const loadingDiv = document.querySelector(".center-body");

function initHeroBackgroundCarousel() {
    const hero = document.querySelector('#top');
    if (!hero) return;

    const images = [
        'https://hips.hearstapps.com/hmg-prod/images/edc100123egan-002-6500742f5feb7.jpg',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=85',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=85',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1800&q=85'
    ];

    const background = document.createElement('div');
    background.className = 'hero-background-carousel';

    const layers = images.slice(0, 2).map((image, index) => {
        const layer = document.createElement('div');
        layer.className = `hero-background-layer${index === 0 ? ' active' : ''}`;
        layer.style.backgroundImage = `url("${image}")`;
        background.appendChild(layer);
        return layer;
    });

    hero.prepend(background);

    // Preload semua gambar awal-awal supaya swap tak kena decode on-the-spot
    images.forEach(src => { new Image().src = src; });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let currentIndex = 0;
    let nextLayerIndex = 1;

    window.setInterval(() => {
        currentIndex = (currentIndex + 1) % images.length;
        const nextSrc = images[currentIndex];
        const preloadedImg = new Image();

        preloadedImg.onload = () => {
            layers[nextLayerIndex].style.backgroundImage = `url("${nextSrc}")`;
            layers[nextLayerIndex].classList.add('active');
            layers[1 - nextLayerIndex].classList.remove('active');
            nextLayerIndex = 1 - nextLayerIndex;
        };

        preloadedImg.src = nextSrc;
    }, 9000);
}

initHeroBackgroundCarousel();

/**
 * Fetches recommendations from backend
 */
async function requestData() {
    const response = await fetch("/api/recommendations", {
        method: "GET"
    });

    if (!response.ok) {
        console.error("Failed to fetch recommendations:", response.statusText);
        return [];
    }

    return await response.json(); // array of up to 3 listings
}

/**
 * Generates and renders recommendation cards for both mobile and desktop views
 */
async function renderCards() {
    const listings = await requestData();
    const html = listings.map(createCard).join('');
    disableLoading();
    container.innerHTML += html;
    if (containerDesktop) containerDesktop.innerHTML += html;
    initCarousels(); // pasang nav button + dot logic lepas card masuk DOM
}

/**
 * Loading state
 */
function showLoading() {
    loadingDiv.style.display = "flex";
}

function disableLoading() {
    loadingDiv.style.display = "none";
}

// Trigger
showLoading();
renderCards();

// Recommendations Page

/**
 * Creates HTML markup for a single rental property card, with image carousel
 */
function createCard(data) {
    const imagesHTML = data.images.map((img, i) =>
        `<img src="${img}" class="carousel-img ${i === 0 ? 'active' : ''}" alt="">`
    ).join('');

    const dotsHTML = data.images.map((_, i) =>
        `<span class="dot ${i === 0 ? 'active' : ''}"></span>`
    ).join('');

    return `
        <div class="card" data-aos="fade-up" data-aos-duration="1000">
            <div class="card-header">
                <div class="carousel" data-index="0">
                    <div class="carousel-track">
                        ${imagesHTML}
                    </div>
                    <button class="carousel-btn prev" type="button">&#10094;</button>
                    <button class="carousel-btn next" type="button">&#10095;</button>
                    <div class="carousel-dots">${dotsHTML}</div>
                </div>
            </div>

            <div class="card-body">
                <h2>RM ${data.price.toLocaleString()}<span class="unit"> /bln</span></h2>
                <h3>${data.title}</h3>
                <p class="subtitle">
                    <i class="fa-solid fa-bed"></i>&nbsp ${data.beds} &nbsp
                    <i class="fa-solid fa-shower"></i>&nbsp ${data.baths}
                    <br>
                    <p class="location-text"><i class="fa-solid fa-location-dot"></i>&nbsp ${data.location}</p>
                </p>
            </div>

            <div class="card-footer">
                <a href="/house?id=${data.house_id}" class="card-button">Lihat Butiran 
                    <i class="fa-solid fa-arrow-right"></i>
                </a>
            </div>

            <a class="button-fav"><i class="fa-regular fa-heart"></i></a>
        </div>
    `;
}

/**
 * Wires up prev/next buttons and dots for every .carousel on the page
 * Call this AFTER cards are injected into the DOM
 */
function initCarousels() {
    document.querySelectorAll('.carousel').forEach(carousel => {
        // elak double-bind kalau initCarousels() dipanggil > 1 kali
        if (carousel.dataset.bound === "true") return;
        carousel.dataset.bound = "true";

        const imgs = carousel.querySelectorAll('.carousel-img');
        const dots = carousel.querySelectorAll('.dot');
        let index = 0;

        function update() {
            imgs.forEach((img, i) => img.classList.toggle('active', i === index));
            dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
        }

        carousel.querySelector('.prev').addEventListener('click', (e) => {
            e.preventDefault();
            index = (index - 1 + imgs.length) % imgs.length;
            update();
        });

        carousel.querySelector('.next').addEventListener('click', (e) => {
            e.preventDefault();
            index = (index + 1) % imgs.length;
            update();
        });

        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                index = i;
                update();
            });
        });
    });
}

/**
 * Checks login state via /api/me and updates nav button
 */