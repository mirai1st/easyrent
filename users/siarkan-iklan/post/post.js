document.addEventListener('DOMContentLoaded', function () {
    // Elements
    const imageInput = document.getElementById('images');
    const imageGrid = document.getElementById('imageGrid');
    const postForm = document.querySelector('.post-form');
    const locationInput = document.getElementById('location');
    const latitudeInput = document.getElementById('latitud');
    const longitudeInput = document.getElementById('longitud');
    const locationMapElement = document.getElementById('post-location-map');
    const locationStatus = document.getElementById('location-status');
    const addressSuggestions = document.getElementById('address-suggestions');

    const MAX_IMAGES = 5;
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    let selectedFiles = [];
    let locationMap;
    let locationMarker;
    let geocodeTimer;
    let suggestionTimer;
    let latestSuggestionRequest = 0;

    function loadLeaflet() {
        return new Promise((resolve, reject) => {
            if (window.L) {
                resolve();
                return;
            }

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
        latitudeInput.value = Number(latitude).toFixed(7);
        longitudeInput.value = Number(longitude).toFixed(7);
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
                locationStatus.textContent = 'Lokasi ditanda secara manual';
            });
        } else {
            locationMarker.setLatLng(point);
        }

        if (shouldPan) locationMap.setView(point, Math.max(locationMap.getZoom(), 15));
    }

    function initialiseLocationMap() {
        loadLeaflet().then(() => {
            locationMap = L.map(locationMapElement, { scrollWheelZoom: false });
            locationMap.fitBounds([
                [0.8, 99.5],
                [7.5, 119.5]
            ], { padding: [12, 12] });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(locationMap);

            locationMap.on('click', (event) => {
                updateMarker(event.latlng.lat, event.latlng.lng);
                locationStatus.textContent = 'Lokasi ditanda secara manual';
            });

            if (latitudeInput.value && longitudeInput.value) {
                updateMarker(latitudeInput.value, longitudeInput.value, false);
                locationMap.setView([latitudeInput.value, longitudeInput.value], 15);
            }
        }).catch(() => {
            locationStatus.textContent = 'Peta tidak dapat dimuatkan';
        });
    }

    async function geocodeLocation() {
        const address = locationInput.value.trim();
        if (address.length < 4) return;

        locationStatus.textContent = 'Mencari alamat...';
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=my&q=${encodeURIComponent(address)}`, {
                headers: { Accept: 'application/json' }
            });
            if (!response.ok) throw new Error('Geocoding failed');
            const results = await response.json();
            if (!results.length) {
                locationStatus.textContent = 'Alamat tidak dijumpai, pilih lokasi pada peta';
                return;
            }

            updateMarker(results[0].lat, results[0].lon);
            locationStatus.textContent = 'Lokasi dijumpai secara automatik';
        } catch (error) {
            console.warn('Location geocoding error:', error);
            locationStatus.textContent = 'Carian gagal, pilih lokasi pada peta';
        }
    }

    function hideAddressSuggestions() {
        addressSuggestions.innerHTML = '';
        addressSuggestions.classList.remove('is-visible');
    }

    function selectAddress(result) {
        locationInput.value = result.display_name.slice(0, 255);
        updateMarker(result.lat, result.lon);
        locationStatus.textContent = 'Lokasi dijumpai secara automatik';
        hideAddressSuggestions();
    }

    async function fetchAddressSuggestions() {
        const address = locationInput.value.trim();
        if (address.length < 3) {
            hideAddressSuggestions();
            return;
        }

        const requestId = ++latestSuggestionRequest;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=my&q=${encodeURIComponent(address)}`, {
                headers: { Accept: 'application/json' }
            });
            if (!response.ok || requestId !== latestSuggestionRequest) return;
            const results = await response.json();
            addressSuggestions.innerHTML = '';

            results.forEach((result) => {
                const option = document.createElement('button');
                option.type = 'button';
                option.className = 'address-suggestion';
                option.setAttribute('role', 'option');
                option.innerHTML = '<i class="fa-solid fa-location-dot"></i>';
                const label = document.createElement('span');
                label.textContent = result.display_name;
                option.appendChild(label);
                option.addEventListener('click', () => selectAddress(result));
                addressSuggestions.appendChild(option);
            });

            addressSuggestions.classList.toggle('is-visible', results.length > 0);
        } catch (error) {
            hideAddressSuggestions();
            console.warn('Address suggestion error:', error);
        }
    }

    if (locationInput && locationMapElement) {
        locationInput.addEventListener('input', () => {
            clearTimeout(geocodeTimer);
            clearTimeout(suggestionTimer);
            locationStatus.textContent = 'Taip alamat untuk mencari lokasi';
            suggestionTimer = setTimeout(fetchAddressSuggestions, 400);
            geocodeTimer = setTimeout(geocodeLocation, 900);
        });
        locationInput.addEventListener('focus', () => {
            if (locationInput.value.trim().length >= 3) fetchAddressSuggestions();
        });
        locationInput.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') hideAddressSuggestions();
        });
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.address-autocomplete')) hideAddressSuggestions();
        });
        [latitudeInput, longitudeInput].forEach((input) => input.addEventListener('change', () => {
            if (locationMap && input.value) updateMarker(latitudeInput.value, longitudeInput.value);
        }));
        initialiseLocationMap();
    }

    // Buat kotak upload (butang tambah gambar)
    function createUploadBox() {
        const uploadBox = document.createElement('div');
        uploadBox.className = 'image-upload';

        uploadBox.innerHTML = `
            <div class="upload-icon">+</div>
            <span>Tambah gambar</span>
            <small>
                PNG, JPG atau JPEG • Maksimum 5 gambar
            </small>
        `;

        // Bila diklik, buka file picker
        uploadBox.addEventListener('click', function (event) {
            event.preventDefault();
            imageInput.click();
        });

        return uploadBox;
    }

    // Validate jenis & saiz fail
    function validateFile(file) {
        const validType =
            file.type === 'image/jpeg' ||
            file.type === 'image/png';

        if (!validType) {
            alert(
                `"${file.name}" bukan fail gambar yang sah.\n\n` +
                'Hanya JPG, JPEG atau PNG dibenarkan.'
            );
            return false;
        }

        if (file.size > MAX_FILE_SIZE) {
            alert(`"${file.name}" melebihi saiz maksimum 5MB.`);
            return false;
        }

        return true;
    }

    // Bila user pilih gambar baru
    imageInput.addEventListener('change', function () {
        const files = Array.from(this.files);

        if (files.length === 0) return;

        // Sekat jumlah gambar melebihi had
        if (selectedFiles.length + files.length > MAX_IMAGES) {
            alert(`Anda hanya boleh memilih maksimum ${MAX_IMAGES} gambar.`);
            this.value = '';
            return;
        }

        // Filter fail yang valid je
        const validFiles = [];
        files.forEach(function (file) {
            if (validateFile(file)) {
                validFiles.push(file);
            }
        });

        selectedFiles.push(...validFiles);

        updateInputFiles();
        renderImages();

        // Reset input supaya boleh pilih gambar sama lagi
        this.value = '';
    });

    // Render semua preview gambar + upload box
    function renderImages() {
        imageGrid.innerHTML = '';

        selectedFiles.forEach(function (file, index) {
            const preview = document.createElement('div');
            preview.className = 'preview-image';

            const img = document.createElement('img');
            img.alt = `Gambar ${index + 1}`;

            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'remove-image';
            removeButton.dataset.index = index;
            removeButton.setAttribute('aria-label', 'Buang gambar');
            removeButton.textContent = '×';

            // Baca fail jadi data URL untuk preview
            const reader = new FileReader();
            reader.onload = function (event) {
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);

            preview.appendChild(img);
            preview.appendChild(removeButton);
            imageGrid.appendChild(preview);
        });

        // Tunjuk upload box lagi kalau belum capai had maksimum
        if (selectedFiles.length < MAX_IMAGES) {
            imageGrid.appendChild(createUploadBox());
        }
    }

    // Buang gambar dari senarai bila klik butang "×"
    imageGrid.addEventListener('click', function (event) {
        const removeButton = event.target.closest('.remove-image');
        if (!removeButton) return;

        event.preventDefault();
        event.stopPropagation();

        const index = Number(removeButton.dataset.index);
        selectedFiles.splice(index, 1);

        updateInputFiles();
        renderImages();
    });

    // Sync semula file input dengan array selectedFiles
    function updateInputFiles() {
        const dataTransfer = new DataTransfer();

        selectedFiles.forEach(function (file) {
            dataTransfer.items.add(file);
        });

        imageInput.files = dataTransfer.files;
    }

    // Validation form sebelum submit
    if (postForm) {
        postForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const title = document.getElementById('title');
            const subtitle = document.getElementById('subtitle');
            const bedroom = document.getElementById('totalOf_bedroom');
            const shower = document.getElementById('totalOf_shower');
            const description = document.getElementById('post');

            if (title && title.value.trim() === '') {
                alert('Sila masukkan nama rumah.');
                title.focus();
                return;
            }

            if (subtitle && subtitle.value.trim() === '') {
                alert('Sila masukkan ringkasan rumah.');
                subtitle.focus();
                return;
            }

            if (bedroom && bedroom.value === '') {
                alert('Sila masukkan bilangan bilik.');
                bedroom.focus();
                return;
            }

            if (shower && shower.value === '') {
                alert('Sila masukkan bilangan bilik air.');
                shower.focus();
                return;
            }

            if (description && description.value.trim() === '') {
                alert('Sila masukkan penerangan rumah.');
                description.focus();
                return;
            }

            if (selectedFiles.length === 0) {
                alert('Sila masukkan sekurang-kurangnya satu gambar rumah.');
                return;
            }

            // Susun data untuk hantar ke backend
            const formData = new FormData();
            formData.append('title', title.value.trim());
            formData.append('price', document.getElementById('price').value.replace(/[^0-9.]/g, ''));
            formData.append('totalOf_bedroom', bedroom.value);
            formData.append('totalOf_shower', shower.value);
            formData.append('post', description.value.trim());
            formData.append('location', document.getElementById('location').value.trim());
            formData.append('target_institution', document.getElementById('target_institution').value);

            const lat = document.getElementById('latitud').value;
            const lng = document.getElementById('longitud').value;
            if (lat) formData.append('latitud', lat);
            if (lng) formData.append('longitud', lng);

            selectedFiles.forEach(function (file) {
                formData.append('images', file);
            });

            const submitButton = postForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;

            fetch('/api/rent', {
                method: 'POST',
                credentials: 'include', // supaya httpOnly cookie (JWT) ikut sekali
                body: formData
            })
                .then(async function (res) {
                    const data = await res.json();

                    if (!res.ok || !data.success) {
                        alert(data.message || 'Gagal menyiarkan rumah. Sila cuba lagi.');
                        return;
                    }

                    alert('Rumah berjaya disiarkan! Menunggu kelulusan admin.');
                    window.location.href = '/';
                })
                .catch(function (err) {
                    console.error('Submit error:', err);
                    alert('Ralat sambungan. Sila cuba lagi.');
                })
                .finally(function () {
                    submitButton.disabled = false;
                });
        });
    }

    // Render awal bila page load
    renderImages();
});