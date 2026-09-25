// favourite.js
// Perlu load SELEPAS /js/checkLogin.js (guna loadUser, loadFavouriteList dan toggleFavourite dari situ)
//
// Tab "houses"        -> type "house"      -> data dari Rent
// Tab "student-posts" -> type "community"  -> data dari spPost (Sudut Pelajar)

(function () {
    const TABS = {
        houses: {
            type: "house",
            idKey: "house_id",
            title: "Rumah Kegemaran",
            subtitle: "Simpan rumah yang menarik supaya mudah dicari semula.",
        },
        "student-posts": {
            type: "community",
            idKey: "spId",
            title: "Post Sudut Pelajar",
            subtitle: "Post komuniti yang anda simpan untuk dirujuk semula.",
        },
    };

    const EMPTY_STATES = {
        houses: {
            icon: "fa-heart",
            title: "Belum ada rumah kegemaran",
            text: "Tekan ikon hati pada rumah yang anda suka. Semua pilihan rumah anda akan muncul di sini.",
            button: "Terokai rumah",
            link: "/#recommendations",
        },
        "student-posts": {
            icon: "fa-graduation-cap",
            title: "Belum ada post Sudut Pelajar",
            text: "Simpan post komuniti yang berguna untuk dirujuk semula bila-bila masa.",
            button: "Lihat Sudut Pelajar",
            link: "/sudut-pelajar/",
        },
    };

    // status: "loading" | "ready" | "error"
    const state = {
        activeTab: "houses",
        status: "loading",
        counts: { house: 0, community: 0 },
        items: { houses: [], "student-posts": [] },
    };

    /* =========================================================
       HELPERS
       ========================================================= */

    function escapeHtml(value = "") {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function formatPrice(value) {
        return Number(value || 0).toLocaleString("ms-MY");
    }

    function showError(message) {
        if (typeof showNotification === "function") {
            showNotification(message, "error");
        }
    }

    /* =========================================================
       KAD
       ========================================================= */

    const removeButton = `
    <button class="favourite-remove" type="button" data-remove-favourite
            aria-label="Buang dari kegemaran" title="Buang dari kegemaran">
      <i class="fa-solid fa-heart"></i>
    </button>`;

    function houseCardHtml(house) {
        const link = `/house/?id=${encodeURIComponent(house.house_id)}`;
        const image = house.images && house.images[0];

        let gender = "Semua Jantina";
        if (house.gender && house.gender !== "Semua") {
            gender = `${house.gender} Sahaja`;
        }

        return `
      <article class="favourite-card" data-favourite-id="${house.house_id}">
        <a class="favourite-card-image" href="${link}">
          ${image
                ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(house.title)}" loading="lazy">`
                : `<div class="favourite-card-noimage"><i class="fa-solid fa-house"></i></div>`}
        </a>
        ${removeButton}
        <div class="favourite-card-body">
          <h3><a href="${link}">${escapeHtml(house.title)}</a></h3>
          <p class="favourite-card-location">
            <i class="fa-solid fa-location-dot"></i> ${escapeHtml(house.location || "Lokasi tidak dinyatakan")}
          </p>
          <div class="favourite-card-meta">
            <span><i class="fa-solid fa-bed"></i> ${house.totalRoom || 0}</span>
            <span><i class="fa-solid fa-shower"></i> ${house.totalShower || 0}</span>
            <span>${escapeHtml(gender)}</span>
          </div>
          <div class="favourite-card-price">RM ${formatPrice(house.price)} <small>/bulan</small></div>
        </div>
      </article>`;
    }

    function postCardHtml(post) {
        const name = post.full_name || post.username || "Pengguna";
        const initial = escapeHtml(name.charAt(0).toUpperCase());
        const avatarImage = post.profileImg_url
            ? `<img src="/userdata/uploads/profileImg/${escapeHtml(String(post.profileImg_url).split(/[\\/]/).pop())}" alt="" loading="lazy" onerror="this.remove()">`
            : "";
        const image = post.imgFile && post.imgFile[0];

        return `
      <article class="favourite-card favourite-post" data-favourite-id="${post.spId}">
        ${removeButton}
        <div class="favourite-post-user">
          <div class="favourite-post-avatar">${initial}${avatarImage}</div>
          <div>
            <strong>${escapeHtml(name)}</strong>
            <span>@${escapeHtml(post.username)}</span>
          </div>
        </div>
        ${post.content ? `<p class="favourite-post-content">${escapeHtml(post.content)}</p>` : ""}
        ${image ? `<img class="favourite-post-image" src="${escapeHtml(image)}" alt="" loading="lazy">` : ""}
        <div class="favourite-post-footer">
          <span><i class="fa-regular fa-thumbs-up"></i> ${post.likeCount || 0}</span>
          <span><i class="fa-regular fa-comment"></i> ${post.commentCount || 0}</span>
          <a href="/sudut-pelajar/#${post.spId}">Buka <i class="fa-solid fa-arrow-right"></i></a>
        </div>
      </article>`;
    }

    /* =========================================================
       RENDER (mobile + desktop dikemas kini serentak)
       ========================================================= */

    function getList(container) {
        let list = container.querySelector(".favourite-list");

        if (!list) {
            list = document.createElement("div");
            list.className = "favourite-list";
            container.appendChild(list);
        }

        list.classList.toggle("favourite-list--stacked", state.activeTab === "student-posts");

        return list;
    }

    function renderEmptyState(emptyElement, tabKey) {
        const empty = EMPTY_STATES[tabKey];

        emptyElement.dataset.favouriteEmpty = tabKey;
        emptyElement.innerHTML = `
      <div class="favourite-empty-icon"><i class="fa-solid ${empty.icon}"></i></div>
      <h2>${empty.title}</h2>
      <p>${empty.text}</p>
      <a class="favourite-explore-btn" href="${empty.link}">
        ${empty.button} <i class="fa-solid fa-arrow-right"></i>
      </a>
    `;
    }

    function render() {
        const tab = TABS[state.activeTab];
        const items = state.items[state.activeTab];

        // Tajuk, bilangan dan tab
        document.querySelectorAll(".favourite-header h1").forEach((el) => (el.textContent = tab.title));
        document.querySelectorAll(".favourite-header p").forEach((el) => (el.textContent = tab.subtitle));
        document.querySelectorAll(".favourite-count strong").forEach((el) => (el.textContent = state.counts[tab.type]));

        document.querySelectorAll("[data-favourite-tab]").forEach((button) => {
            const key = button.dataset.favouriteTab;
            const isActive = key === state.activeTab;

            button.classList.toggle("active", isActive);
            button.setAttribute("aria-selected", String(isActive));
            button.querySelector("span").textContent = state.counts[TABS[key].type];
        });

        // Senarai kad / mesej / empty state
        document.querySelectorAll(".favourite-container").forEach((container) => {
            const list = getList(container);
            const empty = container.querySelector("[data-favourite-empty]");

            if (state.status === "loading") {
                list.innerHTML = `<div class="favourite-message">Memuatkan...</div>`;
                list.style.display = "";
                empty.style.display = "none";
                return;
            }

            if (state.status === "error") {
                list.innerHTML = `
          <div class="favourite-message">
            Gagal memuatkan kegemaran.
            <button type="button" data-favourite-retry>Cuba lagi</button>
          </div>`;
                list.style.display = "";
                empty.style.display = "none";
                return;
            }

            const cardHtml = state.activeTab === "houses" ? houseCardHtml : postCardHtml;

            list.innerHTML = items.map(cardHtml).join("");
            list.style.display = items.length ? "" : "none";

            renderEmptyState(empty, state.activeTab);
            empty.style.display = items.length ? "none" : "";
        });
    }

    /* =========================================================
       LOAD DATA
       ========================================================= */

    async function loadTab(tabKey) {
        state.activeTab = tabKey;
        state.status = "loading";
        render();

        const data = await loadFavouriteList(TABS[tabKey].type);

        // User dah tukar ke tab lain masa tunggu server
        if (state.activeTab !== tabKey) return;

        if (!data || !data.success) {
            state.status = "error";
            render();
            return;
        }

        state.items[tabKey] = data.items;
        state.counts = data.counts;
        state.status = "ready";
        render();
    }

    /* =========================================================
       BUANG DARI KEGEMARAN
       ========================================================= */

    async function removeFavourite(button) {
        const card = button.closest("[data-favourite-id]");
        const tabKey = state.activeTab;
        const tab = TABS[tabKey];
        const id = Number(card.dataset.favouriteId);

        button.disabled = true;

        let data = await toggleFavourite(tab.type, id);

        // Kalau ia dah dibuang dari tab/peranti lain, toggle akan tambah semula.
        // Toggle sekali lagi supaya hasil akhir tetap "dibuang".
        if (data && data.success && data.favourited) {
            data = await toggleFavourite(tab.type, id);
        }

        if (!data || !data.success) {
            button.disabled = false;
            showError("Gagal membuang dari kegemaran. Cuba lagi.");
            return;
        }

        state.items[tabKey] = state.items[tabKey].filter((item) => item[tab.idKey] !== id);
        state.counts[tab.type] = Math.max(0, state.counts[tab.type] - 1);
        render();
    }

    /* =========================================================
       EVENTS
       ========================================================= */

    document.addEventListener("click", (event) => {
        const tabButton = event.target.closest("[data-favourite-tab]");

        if (tabButton) {
            if (tabButton.dataset.favouriteTab !== state.activeTab) {
                loadTab(tabButton.dataset.favouriteTab);
            }
            return;
        }

        const remove = event.target.closest("[data-remove-favourite]");

        if (remove) {
            removeFavourite(remove);
            return;
        }

        if (event.target.closest("[data-favourite-retry]")) {
            loadTab(state.activeTab);
        }
    });

    async function init() {
        const { user } = await loadUser();

        if (!user) {
            window.location.href = "/";
            return;
        }

        loadTab("houses");
    }

    init();
})();