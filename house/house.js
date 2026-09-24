const detailRoot = document.querySelector('#house-detail');
const loadingState = document.querySelector('#house-loading');
const errorState = document.querySelector('#house-error');
const houseId = new URLSearchParams(window.location.search).get('id');
const institutionCoordinates = {
	'Politeknik Balik Pulau, Pulau Pinang': [5.343527746588661, 100.21439029056981]
};

const escapeHtml = (value = '') => String(value)
	.replaceAll('&', '&amp;')
	.replaceAll('<', '&lt;')
	.replaceAll('>', '&gt;')
	.replaceAll('"', '&quot;')
	.replaceAll("'", '&#039;');

function formatPrice(value) {
	return Number(value || 0).toLocaleString('ms-MY');
}

function formatDate(value) {
	if (!value) return 'Baru sahaja disiarkan';
	return new Date(value).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });
}

function createStreetViewMarkup(house) {
	const latitude = Number(house.latitud);
	const longitude = Number(house.longitud);

	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
		return '<div class="street-view-unavailable"><i class="fa-solid fa-street-view"></i><span>Street View tidak tersedia kerana koordinat rumah belum ditetapkan.</span></div>';
	}

	const streetViewUrl = `https://www.google.com/maps?q=&layer=c&cbll=${latitude},${longitude}&cbp=11,0,0,0,0&output=svembed`;
	const mapsUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`;

	return `
		<div class="street-view-frame">
			<iframe
				src="${streetViewUrl}"
				title="Street View lokasi rumah"
				loading="lazy"
				referrerpolicy="no-referrer-when-downgrade"
				allowfullscreen></iframe>
		</div>
		<a class="street-view-link" href="${mapsUrl}" target="_blank" rel="noopener noreferrer">
			<i class="fa-solid fa-arrow-up-right-from-square"></i> Buka Street View dalam Google Maps
		</a>
	`;
}

function calculateDistance(firstPoint, secondPoint) {
	const earthRadius = 6371;
	const latitudeDifference = (secondPoint[0] - firstPoint[0]) * Math.PI / 180;
	const longitudeDifference = (secondPoint[1] - firstPoint[1]) * Math.PI / 180;
	const latitudeOne = firstPoint[0] * Math.PI / 180;
	const latitudeTwo = secondPoint[0] * Math.PI / 180;
	const haversine = Math.sin(latitudeDifference / 2) ** 2
		+ Math.sin(longitudeDifference / 2) ** 2 * Math.cos(latitudeOne) * Math.cos(latitudeTwo);

	return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

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

function renderLocationMap(house) {
	const mapContainer = document.querySelector('#house-map');
	const housePoint = [Number(house.latitud), Number(house.longitud)];
	const institutionPoint = institutionCoordinates[house.targetInstitution];

	if (!Number.isFinite(housePoint[0]) || !Number.isFinite(housePoint[1]) || !institutionPoint) {
		mapContainer.innerHTML = '<i class="fa-solid fa-map-location-dot"></i><span>Koordinat rumah atau institusi belum tersedia untuk mengira jarak.</span>';
		return;
	}

	const directDistance = calculateDistance(housePoint, institutionPoint);
	mapContainer.classList.add('has-map');
	mapContainer.innerHTML = `
		<div id="location-map" aria-label="Peta jarak rumah ke institusi"></div>
		<div class="map-distance"><i class="fa-solid fa-route"></i><strong>${directDistance.toFixed(1)} km</strong><span>sedang mengira jarak jalan...</span></div>
	`;

	const drawMap = async () => {
		const map = L.map('location-map', { scrollWheelZoom: false, zoomControl: true });
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '&copy; OpenStreetMap contributors'
		}).addTo(map);

		L.marker(housePoint).addTo(map).bindPopup('<strong>Rumah</strong>').openPopup();
		L.marker(institutionPoint).addTo(map).bindPopup(`<strong>${escapeHtml(house.targetInstitution)}</strong>`);
		let routeCoordinates = [housePoint, institutionPoint];
		let routeDistance = directDistance;

		try {
			const routeResponse = await fetch(
				`https://router.project-osrm.org/route/v1/driving/${housePoint[1]},${housePoint[0]};${institutionPoint[1]},${institutionPoint[0]}?overview=full&geometries=geojson`
			);
			if (!routeResponse.ok) throw new Error('Route unavailable');
			const routeData = await routeResponse.json();
			const route = routeData.routes?.[0];
			if (!route) throw new Error('No route found');
			routeCoordinates = route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]);
			routeDistance = route.distance / 1000;
		} catch (error) {
			console.warn('Road route unavailable, using direct line:', error);
		}

		const routeLine = L.polyline(routeCoordinates, { color: '#c8664f', weight: 4, dashArray: '8 8' }).addTo(map);
		const distanceLabel = mapContainer.querySelector('.map-distance');
		distanceLabel.querySelector('strong').textContent = `${routeDistance.toFixed(1)} km`;
		distanceLabel.querySelector('span').textContent = routeCoordinates.length > 2 ? 'jarak melalui jalan raya' : 'jarak terus ke institusi';
		map.fitBounds(routeLine.getBounds(), { padding: [35, 35] });
	};

	const startMap = () => loadLeaflet().then(drawMap).catch(() => {
		mapContainer.classList.add('map-unavailable');
		mapContainer.querySelector('#location-map').innerHTML = '<span>Peta tidak dapat dimuatkan, tetapi jarak terus ialah seperti dipaparkan.</span>';
	});

	if ('requestIdleCallback' in window) {
		requestIdleCallback(startMap, { timeout: 1200 });
	} else {
		setTimeout(startMap, 250);
	}
}

function showError() {
	loadingState.classList.add('is-hidden');
	errorState.classList.remove('is-hidden');
}

// Butang hati: simpan rumah ke kegemaran / buang semula.
// Guna loadUser, loadFavouriteIds dan toggleFavourite dari js/checkLogin.js
async function setupSaveButton(house) {
	const button = detailRoot.querySelector('.save-house');
	if (!button) return;

	function setSaved(saved) {
		button.classList.toggle('is-saved', saved);
		button.setAttribute('aria-pressed', String(saved));
		button.setAttribute('aria-label', saved ? 'Buang dari kegemaran' : 'Simpan rumah ini');
		button.innerHTML = `<i class="fa-${saved ? 'solid' : 'regular'} fa-heart"></i>`;
	}

	function showError(message) {
		if (typeof showNotification === 'function') showNotification(message, 'error');
	}

	button.addEventListener('click', async () => {
		// Belum log masuk: buka modal log masuk (sama macam butang "Hubungi tuan rumah")
		const { user } = await loadUser();
		if (!user) {
			document.querySelector('#register-modal').style.display = 'none';
			document.querySelector('#login-modal').style.display = 'block';
			showNotification("Anda perlu mengelog masuk untuk menyimpan rumah.", "error", 3000);
			return;
		}

		const wasSaved = button.classList.contains('is-saved');
		setSaved(!wasSaved); // tukar ikon terus supaya rasa laju
		button.disabled = true; // elak klik dua kali masa tunggu server

		if (!wasSaved) {
			showNotification("Siaran ini telah berjaya disimpan di kegemaran anda", "success", 3000);
		}

		const data = await toggleFavourite('house', house.house_id);
		button.disabled = false;

		if (data && data.success) {
			setSaved(data.favourited); // ikut jawapan server
		} else {
			setSaved(wasSaved); // gagal: kembalikan ikon asal
			showNotification("Gagal mengemas kini kegemaran. Cuba lagi.", "error", 3000);
		}
	});

	// Keadaan awal: kalau dah log masuk dan rumah ni dah disimpan, hati terus penuh
	const { user } = await loadUser();
	if (!user) return;

	const favourites = await loadFavouriteIds();
	if (favourites && favourites.success && favourites.house.includes(Number(house.house_id))) {
		setSaved(true);
	}
}

function renderHouse(house) {
	const images = house.images?.length ? house.images : ['https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85'];
	const gallery = images.map((image, index) => `
		<div class="gallery-slide ${index === 0 ? 'is-active' : ''}" aria-hidden="${index === 0 ? 'false' : 'true'}">
			<img src="${escapeHtml(image)}" alt="${escapeHtml(house.title)} - gambar ${index + 1}" loading="${index ? 'lazy' : 'eager'}">
		</div>
	`).join('');
	const galleryDots = images.map((_, index) => `
		<button class="gallery-dot ${index === 0 ? 'is-active' : ''}" type="button" aria-label="Lihat gambar ${index + 1}" aria-current="${index === 0 ? 'true' : 'false'}"></button>
	`).join('');

	let gender = "Semua Jantina";

	if (house.gender && house.gender !== "Semua") {
		gender = `${house.gender} Sahaja`;
	}

	detailRoot.innerHTML = `
		<div class="detail-gallery" aria-label="Galeri gambar rumah">
			<div class="gallery-viewport">${gallery}</div>
			<button class="gallery-control gallery-prev" type="button" aria-label="Gambar sebelumnya"><i class="fa-solid fa-chevron-left"></i></button>
			<button class="gallery-control gallery-next" type="button" aria-label="Gambar seterusnya"><i class="fa-solid fa-chevron-right"></i></button>
			<div class="gallery-dots">${galleryDots}</div>
			<span class="gallery-count">1 / ${images.length}</span>
		</div>
		<div class="detail-heading">
			<div>
				<p class="detail-eyebrow"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(house.location || 'Lokasi tidak dinyatakan')}</p>
				<h1>${escapeHtml(house.title)}</h1>
				<p class="detail-meta">Disiarkan oleh <strong><a href="/users/user/?username=${encodeURIComponent(house.originalposter || 'Tuan rumah')}" class="poster-link">@${escapeHtml(house.originalposter || 'Tuan rumah')}</a></strong> · ${formatDate(house.dateCreated)}</p>
			</div>
			<button class="save-house" type="button" aria-label="Simpan rumah ini" aria-pressed="false"><i class="fa-regular fa-heart"></i></button>
		</div>
		<div class="detail-layout">
			<div class="detail-main">
				<section class="detail-section facts-section">
					<div class="fact"><i class="fa-solid fa-bed"></i><span><strong>${house.totalRoom || 0}</strong> bilik tidur</span></div>
					<div class="fact"><i class="fa-solid fa-shower"></i><span><strong>${house.totalShower || 0}</strong> bilik air</span></div>
					<div class="fact"><i class="fa-solid fa-graduation-cap"></i><span><strong>${escapeHtml(house.targetInstitution || 'Pelajar')}</strong> Institusi Sasaran</span></div>
					<div class="fact"><i class="fa-solid fa-users"></i><span><strong>${gender}</strong></span></div>
				</section>
				<section class="detail-section">
					<h2>Perihal rumah</h2>
					<p class="description">${escapeHtml(house.description || 'Tuan rumah belum menambah penerangan untuk iklan ini.')}</p>
				</section>
				<section class="detail-section location-section">
					<h2>Lokasi</h2>
					<p><i class="fa-solid fa-location-dot"></i> ${escapeHtml(house.location || 'Lokasi tidak dinyatakan')}</p>
					<br>
					<h4>Berikut adalah peta jarak dari rumah ke ${escapeHtml(house.targetInstitution || 'Pelajar')}</h4>
					<div id="house-map" class="map-placeholder"><i class="fa-solid fa-map-location-dot"></i><span>Memuatkan peta jarak...</span></div>

					<div class="street-view-section">
						<div class="street-view-heading">
							<h3><i class="fa-solid fa-street-view"></i> Street View</h3>
							<span>Lihat kawasan sekitar rumah</span>
						</div>
						${createStreetViewMarkup(house)}
					</div>

					<br>
                    <p>Maklumat peta ini adalah berdasarkan API leaflet (OpenStreetMap), Google Street View berdasarkan API Google Maps</p>
                </section>
			</div>
			<aside class="contact-card">
				<div class="price-label">Sewa bulanan</div>
				<div class="price">RM ${formatPrice(house.price)} <small>/bulan</small></div>
				<div class="contact-divider"></div>
				<p>Minat dengan rumah ini? Hubungi tuan rumah untuk semak ketersediaan dan buat lawatan.</p>
				<button class="contact-button" type="button"><i class="fa-regular fa-message"></i> Hubungi tuan rumah</button>
				<p class="contact-note"><i class="fa-solid fa-shield-heart"></i> Jangan buat bayaran sebelum melihat rumah.</p>
			</aside>
		</div>
        
	`;

	const galleryRoot = detailRoot.querySelector('.detail-gallery');
	const slides = [...galleryRoot.querySelectorAll('.gallery-slide')];
	const dots = [...galleryRoot.querySelectorAll('.gallery-dot')];
	const counter = galleryRoot.querySelector('.gallery-count');
	let activeSlide = 0;
	let touchStartX = 0;

	function showSlide(nextSlide) {
		activeSlide = (nextSlide + slides.length) % slides.length;
		slides.forEach((slide, index) => {
			slide.classList.toggle('is-active', index === activeSlide);
			slide.setAttribute('aria-hidden', index === activeSlide ? 'false' : 'true');
		});
		dots.forEach((dot, index) => {
			dot.classList.toggle('is-active', index === activeSlide);
			dot.setAttribute('aria-current', index === activeSlide ? 'true' : 'false');
		});
		counter.textContent = `${activeSlide + 1} / ${slides.length}`;
	}

	galleryRoot.querySelector('.gallery-prev').addEventListener('click', () => showSlide(activeSlide - 1));
	galleryRoot.querySelector('.gallery-next').addEventListener('click', () => showSlide(activeSlide + 1));
	dots.forEach((dot, index) => dot.addEventListener('click', () => showSlide(index)));
	galleryRoot.addEventListener('touchstart', (event) => {
		touchStartX = event.changedTouches[0].screenX;
	}, { passive: true });
	galleryRoot.addEventListener('touchend', (event) => {
		const distance = event.changedTouches[0].screenX - touchStartX;
		if (Math.abs(distance) > 45) showSlide(activeSlide + (distance < 0 ? 1 : -1));
	}, { passive: true });
	setupSaveButton(house);
	detailRoot.querySelector('.contact-button').addEventListener('click', () => {
		console.log(house.originalposter);
		contact(house.originalposter);
	});
	renderLocationMap(house);

	loadingState.classList.add('is-hidden');
	detailRoot.classList.remove('is-hidden');
}

async function contact(posterUsername) {
    const { user, error } = await loadUser();
	
    if (error) {
        checkLoginModal();
        return;
    }

	if (user.username == posterUsername) {
		showNotification("You cannot chat with yourself!", "error", 3000);
		return;
	}

    startChat(posterUsername);
}

async function loadHouse() {
	if (!houseId) return showError();
	try {
		const response = await fetch(`/api/house/detail?id=${encodeURIComponent(houseId)}`);
		if (!response.ok) throw new Error('House not found');
		renderHouse(await response.json());
	} catch (error) {
		console.error('House detail error:', error);
		showError();
	}
}

loadHouse();