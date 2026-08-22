/**
 * filter-component.js
 * -----------------------------------------------------------------
 * Reusable "Filter Tapisan" bottom-sheet component for EasyRent.
 *
 * USAGE (in any page, e.g. index.html, listing.html, etc.):
 *
 *   1. Include this script AFTER your CSS is loaded:
 *        <script src="js/filter-component.js"></script>
 *
 *   2. Anywhere in that page, add a trigger element with the class
 *      "js-open-filter" to open the filter sheet. Example:
 *        <button class="js-open-filter"><i class="fa-solid fa-filter"></i> Isih Ikut Tapisan</button>
 *
 *   That's it — no need to copy-paste the filter HTML into every page.
 *   The component builds its own markup and appends it to <body> once
 *   the DOM is ready, then wires up all interactions (open/close,
 *   accordion sections, steppers, price range, gender radio).
 *
 * NOTE: The original markup had two elements sharing id="filter-btn"
 * (invalid HTML — ids must be unique). This component avoids that by
 * using classes ("js-open-filter" to open, "js-close-filter" to close)
 * instead of duplicate ids.
 * -----------------------------------------------------------------
 */

(function () {
    'use strict';

    // ---- 1. Markup template -----------------------------------------
    const FILTER_HTML = `
    <div id="overlay" class="filter-overlay"></div>

    <div id="filter-container" class="filter-container">
        <div class="header">
            <p>Tapis berdasarkan minat anda</p>
            <a class="js-close-filter"><i class="fa-solid fa-xmark"></i></a>
        </div>
        <div class="content">
            <!-- LOKASI -->
            <div class="filter-button">
                <table>
                    <td width="25px"><i class="fa-solid fa-location-dot"></i></td>
                    <td>Lokasi <br><span class="subtitle"><span class="data" data-summary="lokasi"></span></span></td>
                    <td style="text-align: right;"><i class="fa-solid fa-chevron-down"></i></td>
                </table>
                <div class="filter-content">
                    <input type="text" class="text-input" data-filter-key="lokasi" placeholder="Cari lokasi...">
                </div>
            </div>

            <!-- BILIK AIR -->
            <div class="filter-button">
                <table>
                    <td width="25px"><i class="fa-solid fa-shower"></i></td>
                    <td>Bilik Air</td>
                    <td style="text-align: right;"><span class="data" data-summary="bilikAir"></span>&nbsp&nbsp <i class="fa-solid fa-chevron-down"></i></td>
                </table>
                <div class="filter-content">
                    <div class="stepper" data-filter-key="bilikAir">
                        <button type="button" class="stepper-btn minus">−</button>
                        <span class="stepper-value">1</span>
                        <button type="button" class="stepper-btn plus">+</button>
                    </div>
                </div>
            </div>

            <!-- BILIK TIDUR -->
            <div class="filter-button">
                <table>
                    <td width="25px"><i class="fa-solid fa-bed fa-sm"></i></td>
                    <td>Bilik Tidur</td>
                    <td style="text-align: right;"><span class="data" data-summary="bilikTidur"></span>&nbsp&nbsp <i class="fa-solid fa-chevron-down"></i></td>
                </table>
                <div class="filter-content">
                    <div class="stepper" data-filter-key="bilikTidur">
                        <button type="button" class="stepper-btn minus">−</button>
                        <span class="stepper-value">1</span>
                        <button type="button" class="stepper-btn plus">+</button>
                    </div>
                </div>
            </div>

            <!-- JULAT HARGA -->
            <div class="filter-button">
                <table>
                    <td width="25px"><i class="fa-solid fa-percent"></i></td>
                    <td>Julat Harga <br><span class="subtitle">RM <span class="data-min" data-summary="hargaMin">500</span> - RM <span class="data-max" data-summary="hargaMax">5,500</span></span></td>
                    <td style="text-align: right;"><i class="fa-solid fa-chevron-down"></i></td>
                </table>
                <div class="filter-content">
                    <div class="price-range">
                        RM <input type="number" class="price-input" data-filter-key="hargaMin" value="500" max="4999">
                        <span>-</span>
                        RM <input type="number" class="price-input" data-filter-key="hargaMax" value="5000" max="5000">
                    </div>
                </div>
            </div>

            <!-- JANTINA -->
            <div class="filter-button">
                <table>
                    <td width="25px"><i class="fa-regular fa-user"></i></td>
                    <td>Jantina <br><span class="subtitle"><span class="data" data-summary="jantina"></span></span></td>
                    <td style="text-align: right;"><i class="fa-solid fa-chevron-down"></i></td>
                </table>
                <div class="filter-content">
                    <label class="checkbox-row"><input type="radio" name="jantina" value="lelaki"> Lelaki</label>
                    <label class="checkbox-row"><input type="radio" name="jantina" value="perempuan"> Perempuan</label>
                    <label class="checkbox-row"><input type="radio" name="jantina" value="semua" checked> Semua</label>
                </div>
            </div>
        </div>
    </div>`;

    // ---- 2. Internal state --------------------------------------------
    const STORAGE_KEY = 'easyrent_filter_state';

    const defaultState = {
        lokasi: 'Politeknik Balik Pulau, Pulau Pinang',
        bilikAir: 1,
        bilikTidur: 1,
        hargaMin: 500,
        hargaMax: 5000,
        jantina: 'semua'
    };

    /**
     * Loads filter state from browser's localStorage
     * Falls back to default state if localStorage is empty or corrupted
     * Merges saved state with defaults to handle new keys added over time
     * @returns {Object} Filter state object with lokasi, bilikAir, bilikTidur, hargaMin, hargaMax, jantina
     */
    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return { ...defaultState };
            const saved = JSON.parse(raw);
            // Merge with defaults so new keys added later don't break old saves
            return { ...defaultState, ...saved };
        } catch (err) {
            console.warn('EasyRentFilter: gagal baca localStorage, guna default.', err);
            return { ...defaultState };
        }
    }

    /**
     * Saves current filter state to browser's localStorage
     * Silently handles errors if localStorage is unavailable
     */
    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (err) {
            console.warn('EasyRentFilter: gagal simpan ke localStorage.', err);
        }
    }

    /**
     * Commits current filter state: saves to localStorage and updates UI summaries
     * Only updates summaries if component has been injected into the DOM
     */
    function commit() {
        saveState();
        if (injected) updateSummaries();
    }

    const state = loadState();

    let injected = false;
    let elOverlay, elContainer;

    /**
     * Injects filter component markup into the DOM (executes only once)
     * Steps:
     * 1. Checks if already injected to prevent duplicates
     * 2. Removes any old static filter markup to avoid duplicate IDs
     * 3. Creates filter markup from FILTER_HTML template
     * 4. Appends overlay and container to document body
     * 5. Caches element references (elOverlay, elContainer)
     * 6. Binds all event listeners to inputs and controls
     * 7. Applies saved state values to input fields
     * 8. Updates summary preview text in each filter button header
     */
    function inject() {
        if (injected) return;

        // Defensive cleanup: if a page still has the old static filter
        // markup left in its HTML (id="overlay" / id="filter-container"),
        // remove it first. Duplicate ids would make getElementById() grab
        // the old, attribute-less markup instead of the one we're about
        // to generate — which silently breaks live updates.
        document.querySelectorAll('#overlay, #filter-container').forEach((el) => el.remove());

        const wrapper = document.createElement('div');
        wrapper.innerHTML = FILTER_HTML;
        // Append each top-level node (overlay + container) directly to body
        Array.from(wrapper.children).forEach((node) => document.body.appendChild(node));
        injected = true;

        elOverlay = document.getElementById('overlay');
        elContainer = document.getElementById('filter-container');

        bindEvents();
        applyStateToInputs();
        updateSummaries();
    }

    /**
     * Reflects saved filter state into the freshly-injected input elements
     * Updates the visual state of all filter controls to match stored values:
     * - Sets text input value for location (Lokasi)
     * - Updates stepper display values for bathroom and bedroom counts
     * - Sets price range input values
     * - Checks the correct radio button for gender selection
     */
    function applyStateToInputs() {
        const lokasiInput = elContainer.querySelector('[data-filter-key="lokasi"]');
        lokasiInput.value = state.lokasi;

        elContainer.querySelectorAll('.stepper').forEach((stepper) => {
            const key = stepper.dataset.filterKey;
            stepper.querySelector('.stepper-value').textContent = state[key];
        });

        elContainer.querySelectorAll('.price-input').forEach((input) => {
            input.value = state[input.dataset.filterKey];
        });

        const jantinaRadio = elContainer.querySelector(`input[name="jantina"][value="${state.jantina}"]`);
        if (jantinaRadio) jantinaRadio.checked = true;
    }

    // ---- 3c. Update the live preview text in each filter-button header --
    const JANTINA_LABEL = {
        lelaki: 'Lelaki',
        perempuan: 'Perempuan',
        semua: 'Semua'
    };

    /**
     * Updates the live preview text displayed in each filter button header
     * Shows the user what filter values are currently selected without opening the filter menu
     * Formats price values using Malaysian locale (en-MY) for thousand separators
     * Converts jantina value to display label (Lelaki → Lelaki, perempuan → Perempuan, etc.)
     */
    function updateSummaries() {
        const lokasiSpan = elContainer.querySelector('[data-summary="lokasi"]');
        lokasiSpan.textContent = state.lokasi || 'Semua lokasi';

        elContainer.querySelector('[data-summary="bilikAir"]').textContent = state.bilikAir;
        elContainer.querySelector('[data-summary="bilikTidur"]').textContent = state.bilikTidur;

        elContainer.querySelector('[data-summary="hargaMin"]').textContent = state.hargaMin.toLocaleString('en-MY');
        elContainer.querySelector('[data-summary="hargaMax"]').textContent = state.hargaMax.toLocaleString('en-MY');

        elContainer.querySelector('[data-summary="jantina"]').textContent = JANTINA_LABEL[state.jantina] || 'Semua';
    }
    /**
     * Opens the filter bottom-sheet component with smooth slide-up animation
     * Steps:
     * 1. Injects markup if this is the first open
     * 2. For first open: forces a DOM reflow before adding 'enabled' class
     *    to ensure CSS transition animation plays (prevents instant snap-open)
     * 3. For subsequent opens: directly adds 'enabled' class
     * 4. Adds 'enabled' class to both overlay and container to trigger CSS animations
     */
    function open() {
        const firstOpen = !injected;
        inject();

        if (firstOpen) {
            // The element was just added to the DOM in its closed state
            // (bottom: -100%). If we add "enabled" in the same tick, the
            // browser batches both style changes into one paint and the
            // transition never plays (it just snaps open). Forcing a
            // reflow here makes the browser commit the closed state first,
            // then rAF schedules the "enabled" class on the next paint so
            // the slide-up transition actually runs.
            void elContainer.offsetHeight;
            requestAnimationFrame(() => {
                elOverlay.classList.add('enabled');
                elContainer.classList.add('enabled');
            });
        } else {
            elOverlay.classList.add('enabled');
            elContainer.classList.add('enabled');
        }
    }

    /**
     * Closes the filter bottom-sheet component with slide-down animation
     * Removes 'enabled' class from both overlay and container to trigger CSS animations
     * Does nothing if component hasn't been injected yet
     */
    function close() {
        if (!injected) return;
        elOverlay.classList.remove('enabled');
        elContainer.classList.remove('enabled');
    }

    /**
     * Wires up all interactive event listeners for the filter component
     * Handles:
     * - Close button and overlay click events
     * - Accordion toggle for each filter section
     * - Location text input changes
     * - Stepper increment/decrement buttons for bathroom and bedroom counts
     * - Price range input validation and updates
     * - Gender radio button selection changes
     */
    function bindEvents() {
        // Close via overlay click or close button
        elOverlay.addEventListener('click', close);
        elContainer.querySelector('.js-close-filter').addEventListener('click', close);

        // Accordion: toggle each filter-button's content section independently
        elContainer.querySelectorAll('.filter-button').forEach((btn) => {
            const table = btn.querySelector('table');
            table.addEventListener('click', () => {
                btn.classList.toggle('active');
            });
        });

        // Prevent accordion toggle when interacting with inputs inside content
        elContainer.querySelectorAll('.filter-content').forEach((c) => {
            c.addEventListener('click', (e) => e.stopPropagation());
        });

        // Lokasi input
        const lokasiInput = elContainer.querySelector('[data-filter-key="lokasi"]');
        lokasiInput.addEventListener('input', (e) => {
            state.lokasi = e.target.value;
            commit();
        });

        // Steppers (Bilik Air / Bilik Tidur)
        elContainer.querySelectorAll('.stepper').forEach((stepper) => {
            const key = stepper.dataset.filterKey;
            const valueEl = stepper.querySelector('.stepper-value');
            const minus = stepper.querySelector('.minus');
            const plus = stepper.querySelector('.plus');

            minus.addEventListener('click', () => {
                state[key] = Math.max(1, state[key] - 1);
                valueEl.textContent = state[key];
                commit();
            });
            plus.addEventListener('click', () => {
                state[key] = state[key] + 1;
                if (state[key] > 5) state[key] = 5; // Example limit

                valueEl.textContent = state[key];
                commit();
            });
        });

        // Julat harga
        elContainer.querySelectorAll('.price-input').forEach((input) => {
            // if numbers below min/max, clamp to min/max
            input.addEventListener('blur', (e) => {
                const key = e.target.dataset.filterKey;
                let value = Number(e.target.value);
                if (key === 'hargaMin') {
                    if (value < 500) value = 500;
                    if (value > state.hargaMax) value = state.hargaMax;
                } else if (key === 'hargaMax') {
                    if (value > 5000) value = 5000;
                    if (value < state.hargaMin) value = state.hargaMin;
                }
                state[key] = value;
                e.target.value = value; // update input in case it was clamped
                commit();
            });

            input.addEventListener('input', (e) => {
                state[e.target.dataset.filterKey] = Number(e.target.value);
                commit();
            });
        });

        // Jantina
        elContainer.querySelectorAll('input[name="jantina"]').forEach((radio) => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    state.jantina = e.target.value;
                    commit();
                }
            });
        });
    }

    // ---- 6. Global triggers ----------------------------------------------
    // Any element with class "js-open-filter" opens the sheet, on any page.
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.js-open-filter');
        if (trigger) {
            e.preventDefault();
            open();
        }
    });

    // ---- 7. Public API -----------------------------------------------------
    // Expose a small API so other scripts (e.g. index-ui.js) can read/set
    // filter state, or open/close programmatically.
    window.EasyRentFilter = {
        open,
        close,
        getState: () => ({ ...state }),
        setState: (partial) => {
            Object.assign(state, partial);
            saveState();
            if (injected) {
                applyStateToInputs();
                updateSummaries();
            }
        },
        clearSaved: () => {
            Object.assign(state, defaultState);
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch (err) {
                console.warn('EasyRentFilter: gagal padam localStorage.', err);
            }
            if (injected) {
                applyStateToInputs();
                updateSummaries();
            }
        }
    };
})();