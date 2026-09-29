document.addEventListener('DOMContentLoaded', async function () {
    const imageInput = document.getElementById('images');
    const imageGrid = document.getElementById('imageGrid');
    const postForm = document.querySelector('.post-form');
    const locationInput = document.getElementById('location');
    const latitudeInput = document.getElementById('latitud');
    const longitudeInput = document.getElementById('longitud');
    const locationMapElement = document.getElementById('post-location-map');
    const locationStatus = document.getElementById('location-status');
    const submitBtn = postForm ? postForm.querySelector('button[type="submit"]') : null;

    // Elements for Padam & Telah Disewa
    const btnDelete = document.querySelector('.button-padam');
    const btnBooked = document.querySelector('.button-telah-disewa');

    const MAX_IMAGES = 5;
    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    let existingImages = []; // URL Gambar dari Database
    let selectedFiles = [];   // Fail Gambar Baharu
    let locationMap = null;
    let locationMarker = null;
    let isCurrentlyBooked = false; // Simpan status terkini rumah

    const urlParams = new URLSearchParams(window.location.search);
    const houseId = urlParams.get('id');
    const isEditMode = Boolean(houseId);

    // Kawal paparan butang Padam & Telah Disewa (Hanya muncul semasa Edit Mode)
    if (!isEditMode) {
        if (btnDelete) btnDelete.style.display = 'none';
        if (btnBooked) btnBooked.style.display = 'none';
    }

    // --- LEAFLET MAP FUNCTIONS ---
    function loadLeaflet() {
        return new Promise((resolve, reject) => {
            if (window.L) return resolve();
            const stylesheet = document.createElement('link');
            stylesheet.rel = 'stylesheet';
            stylesheet.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(stylesheet);

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    function updateCoordinateInputs(latitude, longitude) {
        if (latitudeInput) latitudeInput.value = Number(latitude).toFixed(7);
        if (longitudeInput) longitudeInput.value = Number(longitude).toFixed(7);
    }

    function updateMarker(latitude, longitude, shouldPan = true) {
        const point = [Number(latitude), Number(longitude)];
        if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) return;

        updateCoordinateInputs(point[0], point[1]);
        if (!locationMap) return;

        if (!locationMarker) {
            locationMarker = L.marker(point, { draggable: true }).addTo(locationMap);
            locationMarker.on('dragend', () => {
                const markerPoint = locationMarker.getLatLng();
                updateCoordinateInputs(markerPoint.lat, markerPoint.lng);
                if (locationStatus) locationStatus.textContent = 'Lokasi ditanda secara manual';
            });
        } else {
            locationMarker.setLatLng(point);
        }

        if (shouldPan) {
            locationMap.setView(point, Math.max(locationMap.getZoom(), 15));
        }
    }

    async function initialiseLocationMap() {
        if (!locationMapElement) return;

        try {
            await loadLeaflet();
            locationMap = L.map(locationMapElement, { scrollWheelZoom: false });
            
            // Set fokus awal ke Malaysia
            locationMap.fitBounds([[0.8, 99.5], [7.5, 119.5]], { padding: [12, 12] });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(locationMap);

            locationMap.on('click', (event) => {
                updateMarker(event.latlng.lat, event.latlng.lng);
                if (locationStatus) locationStatus.textContent = 'Lokasi ditanda secara manual';
            });

            // Jika input koordinat sudah ber-isi awal
            if (latitudeInput && longitudeInput && latitudeInput.value && longitudeInput.value) {
                updateMarker(latitudeInput.value, longitudeInput.value, true);
            }
        } catch (err) {
            console.error('Gagal memuatkan peta:', err);
            if (locationStatus) locationStatus.textContent = 'Peta tidak dapat dimuatkan.';
        }
    }

    // --- IMAGE RENDER & HANDLING ---
    function renderImages() {
        if (!imageGrid) return;
        imageGrid.innerHTML = '';

        // A. Render Gambar Lama dari DB
        existingImages.forEach((imgUrl, index) => {
            const preview = document.createElement('div');
            preview.className = 'preview-image';

            const img = document.createElement('img');
            img.src = imgUrl;
            img.alt = `Gambar DB ${index + 1}`;
            img.onerror = function() {
                console.error("Gagal memuatkan gambar dari URL:", imgUrl);
            };

            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'remove-image';
            removeButton.dataset.type = 'existing';
            removeButton.dataset.index = index;
            removeButton.textContent = '×';

            preview.appendChild(img);
            preview.appendChild(removeButton);
            imageGrid.appendChild(preview);
        });

        // B. Render Gambar Baru
        selectedFiles.forEach((file, index) => {
            const preview = document.createElement('div');
            preview.className = 'preview-image';

            const img = document.createElement('img');
            img.alt = `Gambar Baru ${index + 1}`;

            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'remove-image';
            removeButton.dataset.type = 'new';
            removeButton.dataset.index = index;
            removeButton.textContent = '×';

            const reader = new FileReader();
            reader.onload = (e) => { img.src = e.target.result; };
            reader.readAsDataURL(file);

            preview.appendChild(img);
            preview.appendChild(removeButton);
            imageGrid.appendChild(preview);
        });

        // C. Kotak Muat Naik
        const totalImages = existingImages.length + selectedFiles.length;
        if (totalImages < MAX_IMAGES) {
            imageGrid.appendChild(createUploadBox());
        }
    }

    function createUploadBox() {
        const uploadBox = document.createElement('div');
        uploadBox.className = 'image-upload';
        uploadBox.innerHTML = `
            <div class="upload-icon">+</div>
            <span>Tambah gambar</span>
            <small>PNG, JPG atau JPEG • Maksimum 5 gambar</small>
        `;
        uploadBox.addEventListener('click', (e) => {
            e.preventDefault();
            imageInput.click();
        });
        return uploadBox;
    }

    function updateInputFiles() {
        const dataTransfer = new DataTransfer();
        selectedFiles.forEach((file) => dataTransfer.items.add(file));
        if (imageInput) imageInput.files = dataTransfer.files;
    }

    if (imageInput) {
        imageInput.addEventListener('change', function () {
            const files = Array.from(this.files);
            if (files.length === 0) return;

            const totalImages = existingImages.length + selectedFiles.length + files.length;
            if (totalImages > MAX_IMAGES) {
                alert(`Anda hanya boleh memilih maksimum ${MAX_IMAGES} gambar.`);
                this.value = '';
                return;
            }

            selectedFiles.push(...files);
            updateInputFiles();
            renderImages();
            this.value = '';
        });
    }

    if (imageGrid) {
        imageGrid.addEventListener('click', (event) => {
            const removeButton = event.target.closest('.remove-image');
            if (!removeButton) return;
            event.preventDefault();

            const type = removeButton.dataset.type;
            const index = Number(removeButton.dataset.index);

            if (type === 'existing') {
                existingImages.splice(index, 1);
            } else if (type === 'new') {
                selectedFiles.splice(index, 1);
                updateInputFiles();
            }

            renderImages();
        });
    }

    // --- FETCH DATA UNTUK EDIT MODE ---
    async function loadHouseDataForEdit() {
        if (!isEditMode) {
            renderImages();
            return;
        }

        try {
            const res = await fetch(`/api/house/my-listings/${houseId}`, { credentials: 'include' });
            const data = await res.json();

            if (!res.ok || !data.success) {
                alert(data.message || 'Iklan rumah tidak dijumpai.');
                return;
            }

            const h = data.house;
            document.getElementById('title').value = h.title || '';
            document.getElementById('price').value = h.price || '';
            document.getElementById('totalOf_bedroom').value = h.totalRoom || 1;
            document.getElementById('totalOf_shower').value = h.totalShower || 1;
            document.getElementById('target_gender').value = h.gender || 'Semua';
            document.getElementById('post').value = h.description || '';
            document.getElementById('location').value = h.location || '';
            document.getElementById('target_institution').value = h.targetInstitution || '';

            // Semak status booking rumah & kemaskini paparan butang
            isCurrentlyBooked = Boolean(h.isBooked === true || h.isBooked === 'true');
            if (btnBooked) {
                if (isCurrentlyBooked) {
                    btnBooked.innerHTML = '<i class="fa-solid fa-xmark"></i> Batal Sewa';
                } else {
                    btnBooked.innerHTML = '<i class="fa-solid fa-check"></i> Telah Disewa';
                }
            }

            // Kemaskini koordinat & marker peta
            if (h.latitud && h.longitud) {
                if (latitudeInput) latitudeInput.value = h.latitud;
                if (longitudeInput) longitudeInput.value = h.longitud;
                updateMarker(h.latitud, h.longitud, true);
            }

            // Kemaskini gambar dari DB
            if (Array.isArray(h.images)) {
                existingImages = h.images;
            }

            const headingTitle = document.querySelector('.post-heading h1');
            if (headingTitle) headingTitle.textContent = 'Kemaskini Iklan Rumah';
            if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Simpan Perubahan';

            renderImages();

        } catch (err) {
            console.error('Ralat memuatkan data rumah:', err);
            renderImages();
        }
    }

    // --- SUBMIT FORM (CREATE / UPDATE) ---
    if (postForm) {
        postForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const title = document.getElementById('title').value.trim();
            const price = document.getElementById('price').value.replace(/[^0-9.]/g, '');
            const bedroom = document.getElementById('totalOf_bedroom').value;
            const shower = document.getElementById('totalOf_shower').value;
            const description = document.getElementById('post').value.trim();
            const location = document.getElementById('location').value.trim();
            const institution = document.getElementById('target_institution').value;

            if (!title || !description || !location || !institution) {
                alert('Sila lengkapkan semua medan wajib.');
                return;
            }

            const totalImages = existingImages.length + selectedFiles.length;
            if (totalImages === 0) {
                alert('Sila masukkan sekurang-kurangnya satu gambar rumah.');
                return;
            }

            const formData = new FormData();
            formData.append('title', title);
            formData.append('price', price);
            formData.append('totalOf_bedroom', bedroom);
            formData.append('totalOf_shower', shower);
            formData.append('post', description);
            formData.append('gender', document.getElementById('target_gender').value);
            formData.append('location', location);
            formData.append('target_institution', institution);

            const lat = latitudeInput ? latitudeInput.value : '';
            const lng = longitudeInput ? longitudeInput.value : '';
            if (lat) formData.append('latitud', lat);
            if (lng) formData.append('longitud', lng);

            formData.append('existingImages', JSON.stringify(existingImages));
            selectedFiles.forEach((file) => formData.append('images', file));

            submitBtn.disabled = true;

            const endpoint = isEditMode ? `/api/house/update/${houseId}` : '/api/rent';
            const method = isEditMode ? 'PUT' : 'POST';

            fetch(endpoint, {
                method: method,
                credentials: 'include',
                body: formData
            })
                .then(async (res) => {
                    const data = await res.json();
                    if (!res.ok || !data.success) {
                        alert(data.message || 'Gagal memproses permohonan.');
                        return;
                    }

                    alert(isEditMode ? 'Iklan berjaya dikemaskini! Menunggu Kelulusan Admin' : 'Rumah berjaya disiarkan! Menunggu Kelulusan Admin');
                    window.location.href = '/users/profile/';
                })
                .catch((err) => {
                    console.error('Submit error:', err);
                    alert('Ralat sambungan. Sila cuba lagi.');
                })
                .finally(() => {
                    submitBtn.disabled = false;
                });
        });
    }

    // --- BUTTON PADAM FUNCTION ---
    if (btnDelete) {
        btnDelete.addEventListener('click', async function (e) {
            e.preventDefault();
            if (!isEditMode || !houseId) return;

            const confirmDelete = confirm('Adakah anda pasti ingin memadam iklan rumah ini?');
            if (!confirmDelete) return;

            try {
                btnDelete.disabled = true;
                const res = await fetch(`/api/house/delete/${houseId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    alert(data.message || 'Gagal memadam iklan.');
                    return;
                }

                alert('Iklan berjaya dipadam!');
                window.location.href = '/users/house';
            } catch (err) {
                console.error('Ralat memadam rumah:', err);
                alert('Ralat sambungan. Sila cuba lagi.');
            } finally {
                btnDelete.disabled = false;
            }
        });
    }

    if (btnBooked) {
        btnBooked.addEventListener('click', async function (e) {
            e.preventDefault();
            if (!isEditMode || !houseId) return;

            const nextStatus = !isCurrentlyBooked;
            const confirmMsg = nextStatus
                ? 'Tanda rumah ini sebagai "Telah Disewa"?'
                : 'Tanda rumah ini sebagai "Belum Disewa"?';

            if (!confirm(confirmMsg)) return;

            try {
                btnBooked.disabled = true;
                const res = await fetch(`/api/house/status/${houseId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ isBooked: nextStatus })
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    alert(data.message || 'Gagal mengemaskini status rumah.');
                    return;
                }

                isCurrentlyBooked = nextStatus;   // kemaskini status dulu
                updateBookedButton();             // baru tukar teks butang

                showNotification(
                    `Status rumah berjaya dikemaskini kepada "${nextStatus ? 'Telah Disewa' : 'Belum Disewa'}"!`,
                    'success',
                    3000
                );
            } catch (err) {
                console.error('Ralat kemaskini status:', err);
                alert('Ralat sambungan. Sila cuba lagi.');
            } finally {
                btnBooked.disabled = false;
            }
        });
    }

    function updateBookedButton() {
        if (!btnBooked) return;
        btnBooked.innerHTML = isCurrentlyBooked
            ? '<i class="fa-solid fa-xmark"></i> Batal Sewa'
            : '<i class="fa-solid fa-check"></i> Telah Disewa';
    }

    await initialiseLocationMap();
    await loadHouseDataForEdit();
});