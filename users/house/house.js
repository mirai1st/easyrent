document.addEventListener('DOMContentLoaded', () => {
    const houseGridDesktop = document.getElementById('house-grid');
    const houseGridMobile = document.getElementById('house-grid-mobile');
    const countElements = document.querySelectorAll('.house-count strong');

    if (!houseGridDesktop && !houseGridMobile) return;

    const formatPrice = (price) => {
        const parsed = Number(price);
        if (!Number.isFinite(parsed)) return 'RM 0';
        return `RM ${parsed.toLocaleString('en-MY')}`;
    };

    const getFirstImage = (images) => {
        if (!Array.isArray(images) || images.length === 0) {
            return 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80';
        }
        return images[0];
    };

    // FUNKSI DENGAN REKA BENTUK KAD BAHARU
    const buildCard = (house) => {
        const title = house.title || 'Rumah';
        const location = house.location || 'Lokasi tidak dinyatakan';
        const bedrooms = house.totalRoom ?? 0;
        const bathrooms = house.totalShower ?? 0;
        const price = formatPrice(house.price);
        const genderText = (house.gender || 'Semua').toString().trim();
        const imageUrl = getFirstImage(house.images);
        const houseId = house.house_id || '#';
        const isBooked = house.isBooked === true || house.isBooked === 'true';
        const isActive = house.isActive === true || house.isActive === 'true';

        const statusText = isBooked ? 'Telah Disewakan' : 'Belum Disewakan';
        const statusIcon = isBooked ? 'fa-circle-check' : 'fa-circle-xmark';
        const statusActive = isActive ? 'Aktif' : 'Tidak Aktif';
        const statusActivIcon = isActive ? 'fa-circle-check' : 'fa-circle-xmark';

        return `
        <article class="house-card">
            <div class="house-card-image">
                <img src="${imageUrl}" alt="${title}" />
            </div>

            <div class="house-card-body">
                <div class="house-price">
                    ${price} <span>/bln</span>
                </div>

                <h3 class="house-title">${title}</h3>

                <div class="house-meta">
                    <span><i class="fa-solid fa-bed"></i> ${bedrooms}</span>
                    <span><i class="fa-solid fa-bath"></i> ${bathrooms}</span>
                    <span>•&nbsp; ${genderText}</span>
                    <span>•&nbsp; ${statusActive}</span>
                </div>

                <p class="house-location">
                    <i class="fa-solid fa-location-dot"></i>
                    <span>${location}</span>
                </p>

                <div class="house-card-actions">
                    <a href="/house/?id=${houseId}" class="btn-lihat-butiran">
                        Lihat Butiran <i class="fa-solid fa-arrow-right"></i>
                    </a>
                    <a href="/users/house/edit/?id=${houseId}" class="btn-edit" title="Edit Info">
                        <i class="fa-solid fa-pen"></i> Edit
                    </a>
                </div>

                <p class="status-sewa">
                    <i class="fa-solid ${statusIcon}"></i>
                    &nbsp<span>${statusText}</span>
                </p>
            </div>
        </article>
    `;
    };

    async function loadHouseListings() {
        const loadingHTML = '<div class="house-empty"><div class="house-empty-icon"><i class="fa-solid fa-house"></i></div><h3>Memuat senarai rumah...</h3></div>';

        if (houseGridDesktop) houseGridDesktop.innerHTML = loadingHTML;
        if (houseGridMobile) houseGridMobile.innerHTML = loadingHTML;

        try {
            const response = await fetch('/api/house/my-listings', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Gagal memuat senarai rumah.');
            }

            const houses = Array.isArray(data.houses) ? data.houses : [];

            countElements.forEach(el => {
                el.textContent = houses.length;
            });

            if (!houses.length) {
                const emptyHTML = `
                    <div class="house-empty">
                        <div class="house-empty-icon"><i class="fa-solid fa-house"></i></div>
                        <h3>Tiada rumah lagi</h3>
                        <p>Anda belum mengiklankan rumah. Sila tambah rumah baharu untuk mula menampilkan listing.</p>
                    </div>
                `;
                if (houseGridDesktop) houseGridDesktop.innerHTML = emptyHTML;
                if (houseGridMobile) houseGridMobile.innerHTML = emptyHTML;
                return;
            }

            const cardsHTML = houses.map(buildCard).join('');
            if (houseGridDesktop) houseGridDesktop.innerHTML = cardsHTML;
            if (houseGridMobile) houseGridMobile.innerHTML = cardsHTML;

        } catch (error) {
            countElements.forEach(el => { el.textContent = '0'; });

            const errorHTML = `
                <div class="house-empty">
                    <div class="house-empty-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
                    <h3>Gagal memuat data</h3>
                    <p>${error.message || 'Sila cuba sebentar lagi.'}</p>
                </div>
            `;
            if (houseGridDesktop) houseGridDesktop.innerHTML = errorHTML;
            if (houseGridMobile) houseGridMobile.innerHTML = errorHTML;
        }
    }

    loadHouseListings();
    if (typeof setupLogoutButtons === 'function') {
        setupLogoutButtons();
    }
});