// User location
const container = document.querySelector('.recommendations-cards');
const containerDesktop = document.querySelector('.recommendations-cards-desktop'); // TUKAR ikut selector desktop sebenar
const output = document.getElementById("output-message");
const loadingDiv = document.querySelector(".center-body");

/**
 * Generates and renders 3 recommendation cards for both mobile and desktop views
 */
function renderCards() {
    const html = Array.from({ length: 3 }, () => createCard(dummyData)).join('');
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

/**
 * Geolocation success handler
 */
function showPosition(position) {
    const { latitude, longitude } = position.coords;
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&email=mirai1st04@gmail.com`;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            const address = data.address || {};
            const city = address.city || address.town || address.village || "Unknown City";
            const country = address.country || "Unknown Country";
            output.innerHTML = `<strong>Lokasi:</strong> ${city}, ${country}`;
        })
        .catch(error => {
            console.error('Ralat semasa mendapatkan lokasi:', error);
            output.innerHTML = `<strong>Lokasi:</strong> Ralat semasa mendapatkan butiran`;
        })
        .finally(() => {
            container.innerHTML = '';
            renderCards();
        });
}

/**
 * Geolocation error/denied handler
 */
function showError(error) {
    console.error('Ralat geolokasi:', error);
    output.innerHTML = `<strong>Lokasi:</strong> Tidak dapat kesan lokasi! Kesemua cadangan akan dimuatkan berdasarkan lokasi lalai: Politeknik Balik Pulau, Pulau Pinang`;
    container.innerHTML = '';
    renderCards();
}

// Trigger
showLoading();

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition, showError);
} else {
    output.innerHTML = `<strong>Lokasi:</strong> Geolocation tidak disokong browser ini`;
    container.innerHTML = '';
    renderCards();
}

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
        <div class="card">
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
                <h3>RM ${Number(data.price).toLocaleString()} <span>/${data.unit}</h3>
                <p class="subtitle">
                    <i class="fa-solid fa-bed"></i>&nbsp ${data.beds} &nbsp
                    <i class="fa-solid fa-shower"></i>&nbsp ${data.baths} &nbsp
                    <span class="divider">|</span> ${data.type}
                    <br><br><p><b>Alamat</b><br>${data.address}</p>        
                </p>
            </div>

            <div class="card-footer">
                <a href="/house/house?id=${data.house_id}" class="card-button">Lihat Butiran</a>
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

// frontend must request data like this, and backend must give data back like this
const dummyData = {
    house_id: 1,
    title: "Rumah Sewa",
    price: 1800,
    beds: 3,
    baths: 2,
    type: "Lelaki Sahaja",
    unit: "bulan",
    address: "No. 12, Lorong Sungai Nipah, Taman Desa Mutiara, Barat Daya, Pulau Pinang, 11020",
    images: [
        "https://placehold.co/400x300",
        "https://placehold.co/400x300/52341D/fff",
        "https://placehold.co/400x300/6F4A2D/fff"
    ]
};

/**
 * Checks login state via /api/me and updates nav button
 */
