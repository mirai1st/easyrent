document.addEventListener('DOMContentLoaded', () => {
    const houseGrid = document.getElementById('house-grid');
    const countElement = document.querySelector('.house-count strong');

    if (!houseGrid) return;

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

    const buildCard = (house) => {
        const title = house.title || 'Rumah';
        const location = house.location || 'Lokasi tidak dinyatakan';
        const bedrooms = house.totalRoom ?? 0;
        const bathrooms = house.totalShower ?? 0;
        const price = formatPrice(house.price);
        const badgeText = (house.gender || 'Rumah').toString().trim() || 'Rumah';
        const imageUrl = getFirstImage(house.images);

        return `
            <article class="house-card">
                <div class="house-card-image">
                    <img src="${imageUrl}" alt="${title}" />
                    <span class="house-badge">${badgeText}</span>
                </div>

                <div class="house-card-body">
                    <div class="house-card-head">
                        <div>
                            <p class="house-card-label">Rumah Sewa</p>
                            <h3>${title}</h3>
                        </div>
                        <button class="house-fav" type="button" aria-label="Simpan rumah">
                            <i class="fa-regular fa-heart"></i>
                        </button>
                    </div>

                    <p class="house-location">
                        <i class="fa-solid fa-location-dot"></i>
                        ${location}
                    </p>

                    <div class="house-meta">
                        <span><i class="fa-solid fa-bed"></i> ${bedrooms} bilik</span>
                        <span><i class="fa-solid fa-bath"></i> ${bathrooms} bilik air</span>
                    </div>

                    <div class="house-card-footer">
                        <div class="house-price">
                            <strong>${price}</strong>
                            <span>/bulan</span>
                        </div>
                        <div class="house-card-actions">
                            <button type="button" class="house-link-btn">Lihat Detail</button>
                            <button type="button" class="house-edit-btn"><i class="fa-solid fa-pen"></i> Edit Info</button>
                        </div>
                    </div>
                </div>
            </article>
        `;
    };

    async function loadHouseListings() {
        houseGrid.innerHTML = '<div class="house-empty"><div class="house-empty-icon"><i class="fa-solid fa-house"></i></div><h3>Memuat senarai rumah...</h3></div>';

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
            if (countElement) {
                countElement.textContent = houses.length;
            }

            if (!houses.length) {
                houseGrid.innerHTML = `
                    <div class="house-empty">
                        <div class="house-empty-icon"><i class="fa-solid fa-house"></i></div>
                        <h3>Tiada rumah lagi</h3>
                        <p>Anda belum mengiklankan rumah. Sila tambah rumah baharu untuk mula menampilkan listing.</p>
                    </div>
                `;
                return;
            }

            houseGrid.innerHTML = houses.map(buildCard).join('');
        } catch (error) {
            if (countElement) {
                countElement.textContent = '0';
            }

            houseGrid.innerHTML = `
                <div class="house-empty">
                    <div class="house-empty-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
                    <h3>Gagal memuat data</h3>
                    <p>${error.message || 'Sila cuba sebentar lagi.'}</p>
                </div>
            `;
        }
    }

    loadHouseListings();
});