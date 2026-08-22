const filter_btn = document.querySelectorAll("#filter-btn");
const filter_container = document.getElementById("filter-container");
const overlay = document.getElementById("overlay");
const top_search = document.getElementById("top-search");

function toggleFilter() {
    filter_container.classList.toggle("enabled");
    overlay.classList.toggle("enabled");
    top_search.classList.toggle("scrolldisable");
}

filter_btn.forEach(btn => {
    btn.addEventListener("click", toggleFilter);
});

overlay.addEventListener("click", toggleFilter);

// Filter collapse toggle

document.querySelectorAll('.filter-button').forEach(button => {
    const headerTable = button.querySelector('table:first-child');
    headerTable.addEventListener('click', () => {
        button.classList.toggle('active');
    });
});

// Stepper +/-

document.querySelectorAll('.stepper').forEach(stepper => {
    const valueEl = stepper.querySelector('.stepper-value');
    const minus = stepper.querySelector('.minus');
    const plus = stepper.querySelector('.plus');
    let count = parseInt(valueEl.textContent, 10);

    minus.addEventListener('click', (e) => {
        e.stopPropagation();
        if (count > 1) count--;
        valueEl.textContent = count;
    });

    plus.addEventListener('click', (e) => {
        e.stopPropagation();
        if (count < 10) count++;
        valueEl.textContent = count;
    });
});

// getFilterData

function getFilterData() {
    const filterButtons = document.querySelectorAll('.filter-button');
    const result = {};

    filterButtons.forEach(button => {
        const labelText = button.querySelector('table:first-child td:nth-child(2)')
            .childNodes[0].textContent.trim();

        const content = button.querySelector('.filter-content');
        if (!content) return;

        const textInput = content.querySelector('.text-input');
        if (textInput) {
            result[labelText] = textInput.value;
            return;
        }

        const stepperValue = content.querySelector('.stepper-value');
        if (stepperValue) {
            result[labelText] = parseInt(stepperValue.textContent, 10);
            return;
        }

        const priceInputs = content.querySelectorAll('.price-input');
        if (priceInputs.length === 2) {
            result[labelText] = {
                min: parseInt(priceInputs[0].value, 10),
                max: parseInt(priceInputs[1].value, 10)
            };
            return;
        }

        const radioChecked = content.querySelector('input[type="radio"]:checked');
        if (radioChecked) {
            result[labelText] = radioChecked.parentElement.textContent.trim();
            return;
        }
    });

    return result;
}

// Live update .data span dalam setiap filter-button

document.querySelectorAll('.filter-button').forEach(button => {
    const content = button.querySelector('.filter-content');
    if (!content) return;

    // LOKASI
    const textInput = content.querySelector('.text-input');
    if (textInput) {
        const dataSpan = button.querySelector('.data');
        dataSpan.textContent = textInput.value;
        textInput.addEventListener('input', () => {
            dataSpan.textContent = textInput.value;
        });
    }

    // BILIK AIR / BILIK TIDUR
    const stepper = content.querySelector('.stepper');
    if (stepper) {
        const dataSpan = button.querySelector('.data');
        const valueEl = stepper.querySelector('.stepper-value');
        dataSpan.textContent = valueEl.textContent;

        stepper.querySelectorAll('.stepper-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                dataSpan.textContent = valueEl.textContent;
            });
        });
    }

    // JULAT HARGA
    const priceInputs = content.querySelectorAll('.price-input');
    if (priceInputs.length === 2) {
        const dataMin = button.querySelector('.data-min');
        const dataMax = button.querySelector('.data-max');

        const updatePrice = () => {
            dataMin.textContent = Number(priceInputs[0].value).toLocaleString();
            dataMax.textContent = Number(priceInputs[1].value).toLocaleString();
        };
        updatePrice();

        priceInputs[0].addEventListener('input', updatePrice);
        priceInputs[1].addEventListener('input', updatePrice);
    }

    // JANTINA
    const radios = content.querySelectorAll('input[type="radio"]');
    if (radios.length) {
        const dataSpan = button.querySelector('.data');

        const updateGender = () => {
            const checked = content.querySelector('input[type="radio"]:checked');
            if (checked) {
                dataSpan.textContent = checked.parentElement.textContent.trim();
            }
        };
        updateGender();

        radios.forEach(radio => {
            radio.addEventListener('change', updateGender);
        });
    }
});