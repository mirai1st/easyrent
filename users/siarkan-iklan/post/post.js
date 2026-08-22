document.addEventListener('DOMContentLoaded', function () {
    // Elements
    const imageInput = document.getElementById('images');
    const imageGrid = document.getElementById('imageGrid');
    const postForm = document.querySelector('.post-form');

    const MAX_IMAGES = 5;
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    let selectedFiles = [];

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
            formData.append('totalOf_bedroom', bedroom.value);
            formData.append('totalOf_shower', shower.value);
            formData.append('post', description.value.trim());
            formData.append('location', document.getElementById('location').value.trim());

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