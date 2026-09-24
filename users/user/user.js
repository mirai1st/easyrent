document.addEventListener('DOMContentLoaded', async () => {
    const showUserNotFound = (message = 'User tidak dijumpai.') => {
        const profileCard = document.querySelector('.profile-card');
        const topSection = document.querySelector('#top');

        if (profileCard) {
            profileCard.style.display = 'none';
        }

        if (!topSection) return;

        const existingState = topSection.querySelector('.user-not-found');
        if (existingState) {
            existingState.remove();
        }

        topSection.insertAdjacentHTML('beforeend', `
            <div class="user-not-found" role="alert" aria-live="polite">
                <div class="not-found-icon">
                    <i class="fa-solid fa-user-slash"></i>
                </div>
                <h2>User Tidak Dijumpai</h2>
                <p>${message}</p>
                <a href="/" class="btn-back-home">Kembali ke utama</a>
            </div>
        `);
    };

    // 1. Ambil username dari URL browser (contoh: http://localhost:3000/users/profile/?username=faizal)
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');

    if (!username || !username.trim()) {
        console.warn("Tiada username dalam URL.");
        showUserNotFound('Tiada parameter username dalam URL.');
        return;
    }

    try {
        // 2. Fetch ke endpoint public profile yang betul
        const response = await fetch(`/api/users/user?username=${encodeURIComponent(username)}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Server Error (${response.status}):`, errorText);
            showUserNotFound('Profil yang anda cari tidak dijumpai.');
            return;
        }

        const data = await response.json();

        if (!data.success || !data.user) {
            showUserNotFound(data.message || 'User tidak dijumpai.');
            return;
        }

        const { user, listings } = data;

        // 3. Kemaskini Profil UI
        const userNameEl = document.querySelector('.user-name');
        if (userNameEl) {
            const badgeHTML = userNameEl.querySelector('.verified-badge') ? userNameEl.querySelector('.verified-badge').outerHTML : '';
            userNameEl.innerHTML = `${user.full_name || user.username} ${badgeHTML}`;
        }

        const userBadgeEl = document.querySelector('.user-badge');
        if (userBadgeEl) {
            userBadgeEl.textContent = user.role === 'host' ? 'Tuan Rumah' : 'Pengguna';
        }

        const userEmailEl = document.querySelector('.user-email');
        if (userEmailEl) {
            userEmailEl.innerHTML = `<i class="fa-regular fa-envelope"></i> ${user.email}`;
        }

        const userJoinedEl = document.querySelector('.user-joined');
        if (userJoinedEl && user.dateCreated) {
            const joinedDate = new Date(user.dateCreated).toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' });
            userJoinedEl.innerHTML = `<i class="fa-regular fa-calendar"></i> Ahli sejak ${joinedDate}`;
        }

        const phoneBox = document.querySelector('.detail-box[data-field="phone"] p');
        if (phoneBox) {
            phoneBox.textContent = user.phoneNo || 'Tidak dinyatakan';
        }

        const addressBox = document.querySelector('.detail-box[data-field="address"] p');
        if (addressBox) {
            addressBox.textContent = user.address || 'Belum dikemaskini';
        }

        const descriptionBox = document.querySelector('.detail-box[data-field="description"] p');
        if (descriptionBox) {
            descriptionBox.textContent = user.description || 'Belum ada biografi.';
        }

        const avatarEl = document.getElementById('user-avatar');
        if (avatarEl) {
            avatarEl.src = user.profileImg_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.username)}&background=52341D&color=fff`;
        }

        const statValues = document.querySelectorAll('.stat-value');
        if (statValues.length > 0) {
            statValues[0].textContent = listings ? listings.length : 0;
        }

        // 4. Render Senarai Rumah
        const listingsHeader = document.querySelector('.listings-header h3');
        if (listingsHeader) {
            listingsHeader.innerHTML = `<i class="fa-solid fa-house-user"></i> Senarai Rumah Disewakan (${listings ? listings.length : 0})`;
        }

        const listingsGrid = document.querySelector('.listings-grid');
        if (listingsGrid) {
            listingsGrid.innerHTML = '';

            if (!listings || listings.length === 0) {
                listingsGrid.innerHTML = '<p style="grid-column: span 3; text-align: center; color: #888; padding: 20px;">Tiada iklan rumah disiarkan lagi.</p>';
                return;
            }

            listings.forEach(house => {
                const coverImg = (house.images && house.images.length > 0) ? house.images[0] : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=500&q=80';

                const cardHTML = `
                    <div class="listing-card">
                        <div class="listing-img">
                            <img src="${coverImg}" alt="${house.title}">
                            <span class="status-badge active">Aktif</span>
                        </div>
                        <div class="listing-content">
                            <span class="listing-price">RM ${house.price} <span>/ bulan</span></span>
                            <h4 class="listing-title">${house.title}</h4>
                            <p class="listing-location"><i class="fa-solid fa-location-dot"></i> ${house.location || 'Tidak Nyata'}</p>
                            <div class="listing-meta">
                                <span><i class="fa-solid fa-bed"></i> ${house.totalOf_bedroom} Bilik</span>
                                <span><i class="fa-solid fa-bath"></i> ${house.totalOf_shower} Bilik Air</span>
                            </div>
                            <div class="listing-actions">
                                <a href="/house-detail.html?id=${house.house_id}" class="btn-view">Lihat</a>
                            </div>
                        </div>
                    </div>
                `;
                listingsGrid.insertAdjacentHTML('beforeend', cardHTML);
            });
        }

    } catch (err) {
        console.error("Ralat memuatkan profil pengguna:", err);
        showUserNotFound('Profil pengguna tidak dapat dimuatkan pada masa ini.');
    }
});