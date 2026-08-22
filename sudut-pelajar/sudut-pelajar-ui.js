const picker = document.querySelector('.section-picker');
const tabs = picker.querySelectorAll('a');

const community_post_sec = document.querySelector(".community-section");
const your_post_sec = document.querySelector(".you-section");

tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {

        tabs.forEach((t) => {
            t.classList.remove('active');
        });

        tab.classList.add('active');

        picker.classList.toggle('your-active', index === 1);

        if (index === 0) {
            community_post_sec.style.display = "block";
            your_post_sec.style.display = "none";
        } else {
            community_post_sec.style.display = "none";
            your_post_sec.style.display = "block";
        }
    });
});


tabs[0].classList.add('active');

community_post_sec.style.display = "block";
your_post_sec.style.display = "none";


function renderPost(data, index) {

    let image = '';

    if (data.image) {
        image = `<div class='card-image'><img src="${data.image_location}"></div>`;
    }

    return `
        <div class='card'>
            ${image}
            <div class='card-content'> 
                <p class='title'>${data.title}</p> 
                <p class='subtitle'>${data.subtitle}</p> 
            </div> 
            <div class='card-footer'> 
                <p class='footer-text'>Dihantar oleh @${data.author} pada ${data.post_date}</p> 
            </div> 
            <div class='like-icon-btn'> 
                <span class='comment-count'>${data.comment_count}</span>
                <i class="fa-regular fa-comment"></i><span class='divider'>|</span> 
                <span class='like-count' data-index="${index}">${data.like_count}</span>
                <i class="fa-${data.liked ? 'solid' : 'regular'} fa-heart" data-index="${index}"></i> 
            </div>
        </div>
    `;
}

const dummy_post = [

    {
        image: true,
        image_location: "/users/images/sudut-pelajar/post1dummy.jpg",
        title: "Saya perlukan orang segera",
        subtitle: "Saya perlukan orang segera untuk masuk dalam rumah ni... Nak bagi murah hehe",
        author: "azhar",
        post_date: "9/9/2026",
        comment_count: "1.5K",
        like_count: 10000,
        liked: false
    },

    {
        image: false,
        image_location: "",
        title: "Kenapa website ni macam ni?",
        subtitle: "Saja je taip ni, takde isu pun",
        author: "mirai",
        post_date: "1/8/2026",
        comment_count: "12",
        like_count: 116,
        liked: false
    },

    {
        image: false,
        image_location: "",
        title: "Weh ada rumah kosong tak?",
        subtitle: "Kut2 la ada en area sini, kalau ada komen sini boleh?",
        author: "mirai",
        post_date: "7/7/2026",
        comment_count: "4",
        like_count: 21,
        liked: false
    },

    {
        image: false,
        image_location: "",
        title: "Rumah dekat KL",
        subtitle: "Ada siapa-siapa nak cari rumah dekat KL?",
        author: "azhar",
        post_date: "10/9/2026",
        comment_count: "23",
        like_count: 213,
        liked: false
    }

];


function parseDate(date) {
    const [day, month, year] = date
        .split('/')
        .map(Number);

    return new Date(
        year,
        month - 1,
        day
    );
}

// sorting list (should add more types)

dummy_post.sort((a, b) => {
    return parseDate(b.post_date) - parseDate(a.post_date);
});


// Comment and like count (delegated — jalan walau post baru di-render lepas ni)

document.body.addEventListener("click", (e) => {
    const likeEl = e.target.closest(".like-count, .fa-heart");
    if (!likeEl) return;

    const index = likeEl.dataset.index;
    const post = dummy_post[index];

    // toggle
    post.liked = !post.liked;
    post.like_count += post.liked ? 1 : -1;

    // update semua elemen yang share index sama (community + your-post)
    document.querySelectorAll(`.like-count[data-index="${index}"]`)
        .forEach(el => el.textContent = post.like_count);

    document.querySelectorAll(`.fa-heart[data-index="${index}"]`)
        .forEach(el => {
            el.classList.toggle('fa-solid', post.liked);
            el.classList.toggle('fa-regular', !post.liked);
        });
});

// loadpost

async function loadPosts() {

    community_post_sec.innerHTML = '';
    your_post_sec.innerHTML = '';

    dummy_post.forEach((post, index) => {
        community_post_sec.innerHTML += renderPost(post, index);

        if (post.author === "mirai") {
            your_post_sec.innerHTML += renderPost(post, index);
        }
    });
}

loadPosts();