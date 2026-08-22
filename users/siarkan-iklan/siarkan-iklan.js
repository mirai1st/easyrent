const forms = [
    document.querySelector('.form-1'),
    document.querySelector('.form-2'),
    document.querySelector('.form-3')
];

let currentStep = 0;

function goToStep(index) {
    const currentForm = forms[currentStep];
    const nextForm = forms[index];
    const goingBack = index < currentStep;

    const outAnim = goingBack ? 'slideOutReverse' : 'slideOut';
    const inAnim = goingBack ? 'slideInReverse' : 'slideIn';

    // animate current form keluar (ikut arah)
    currentForm.style.animation = `${outAnim} 0.3s ease forwards`;

    setTimeout(() => {
        currentForm.style.display = 'none';
        currentForm.style.animation = ''; // reset supaya next time balik ke default

        // tunjuk next form & mainkan animation masuk (ikut arah)
        nextForm.style.display = 'block';
        nextForm.style.animation = 'none';
        void nextForm.offsetWidth; // force reflow
        nextForm.style.animation = `${inAnim} 0.3s ease forwards`;

        currentStep = index;
    }, 300);
}

document.querySelectorAll('.next-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        const currentForm = forms[currentStep];
        const formEl = currentForm.querySelector('form');

        // validate dulu sebelum proceed
        if (formEl && !formEl.checkValidity()) {
            formEl.reportValidity(); // browser akan tunjuk mesej error kat field yang kosong
            return; // stop, jangan proceed
        }

        if (currentStep < forms.length - 1) {
            goToStep(currentStep + 1);
        } else {
            console.log('Submit form');
        }
    });
});

document.querySelectorAll('.back-button').forEach((btn) => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentStep > 0) {
            goToStep(currentStep - 1);
        } else {
            // close modal/redirect
        }
    });
});

document.getElementById('add-listing-btn')?.addEventListener('click', () => {
    window.location.href = '/tambah-hartanah';
});

document.getElementById('later-btn')?.addEventListener('click', () => {
    window.location.href = '/';
});