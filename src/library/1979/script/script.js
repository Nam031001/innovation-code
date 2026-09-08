// Global cursors: drop the `wait` state once the page is fully loaded.
(function () {
  var done = function () { document.documentElement.classList.add("is-loaded"); };
  if (document.readyState === "complete") done();
  else window.addEventListener("load", done);
})();

const menu = document.querySelector(".topbar-menu");
const toggle = document.querySelector(".topbar-menu-toggle");

toggle.addEventListener("click", () => {
  const isOpen = menu.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", String(isOpen));
});

document.addEventListener("click", (event) => {
  if (!menu.contains(event.target)) {
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }
});

// ---------------------------------------------
// Photo grid
// ---------------------------------------------
const PHOTO = "../../../asset/history/newspaper/buma.png";
const CAPTION = "승리의 연회를 여는 시민들";
const TEXT =
  "1979년 10월, 부산과 마산의 시민과 학생들은 유신 체제에 맞서 거리로 나섰다. 계엄군의 진압에도 불구하고 열흘 뒤 유신 정권은 막을 내렸다.";
const PHOTO_COUNT = 24;

const grid = document.querySelector(".year-grid");

grid.append(
  ...Array.from({ length: PHOTO_COUNT }, (_, photoIndex) => {
    const li = document.createElement("li");
    li.className = "year-item";
    li.innerHTML = `
      <button type="button">
        <img src="${PHOTO}" alt="${CAPTION}" />
        <span class="year-caption">${CAPTION}</span>
      </button>
    `;
    li.querySelector("button").addEventListener("click", () => openDetail(photoIndex));
    return li;
  }),
);

// ---------------------------------------------
// Detail modal
// ---------------------------------------------
const yearMain = document.querySelector(".year");
const detail = document.querySelector("#detail");
const detailClose = document.querySelector(".detail-close");
const detailBackdrop = document.querySelector(".detail-backdrop");
const detailPhoto = document.querySelector(".detail-photo");
const detailIndex = document.querySelector(".detail-index");
const detailText = document.querySelector(".detail-text");
const detailPrev = document.querySelector(".detail-prev");
const detailNext = document.querySelector(".detail-next");
const detailScroll = document.querySelector(".detail-scroll");
const detailFilmstrip = document.querySelector(".detail-filmstrip");

const FILMSTRIP_SIZE = 9;

let currentPhotoIndex = 0;

// A row of the photo repeated FILMSTRIP_SIZE times, so the strip reads
// as a photo pile peeking out on both sides.
function renderFilmstrip() {
  detailFilmstrip.replaceChildren(
    ...Array.from({ length: FILMSTRIP_SIZE }, () => {
      const figure = document.createElement("figure");
      figure.className = "detail-filmstrip-item";
      figure.innerHTML = `
        <img src="${PHOTO}" alt="${CAPTION}" />
        <figcaption>#0${currentPhotoIndex + 1}</figcaption>
      `;
      return figure;
    }),
  );
}

function renderDetail() {
  detailPhoto.src = PHOTO;
  detailPhoto.alt = CAPTION;
  detailIndex.textContent = `#0${currentPhotoIndex + 1}`;
  detailText.textContent = TEXT;
  detailScroll.scrollTop = 0;
  renderFilmstrip();
}

function openDetail(photoIndex) {
  currentPhotoIndex = photoIndex;
  renderDetail();
  detail.hidden = false;
  yearMain.classList.add("is-detail-open");
}

function closeDetail() {
  detail.hidden = true;
  yearMain.classList.remove("is-detail-open");
}

function showPrevPhoto() {
  currentPhotoIndex = (currentPhotoIndex - 1 + PHOTO_COUNT) % PHOTO_COUNT;
  renderDetail();
}

function showNextPhoto() {
  currentPhotoIndex = (currentPhotoIndex + 1) % PHOTO_COUNT;
  renderDetail();
}

detailPrev.addEventListener("click", showPrevPhoto);
detailNext.addEventListener("click", showNextPhoto);

detailClose.addEventListener("click", closeDetail);
detailBackdrop.addEventListener("click", closeDetail);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !detail.hidden) closeDetail();
});

// Scrolling the modal pages through photos one at a time instead of
// scrolling any content inside it: down goes to the next photo, up to
// the previous one. The filmstrip nudges the same direction so the row
// reads as photos sliding past behind the card.
function shiftFilmstrip(direction) {
  detailFilmstrip.classList.remove("is-shift-next", "is-shift-prev");
  void detailFilmstrip.offsetWidth; // restart the animation on repeat triggers
  detailFilmstrip.classList.add(direction === "next" ? "is-shift-next" : "is-shift-prev");
}

let wheelLocked = false;

detail.addEventListener(
  "wheel",
  (event) => {
    if (event.deltaY === 0 || wheelLocked) return;
    event.preventDefault();
    wheelLocked = true;

    if (event.deltaY > 0) {
      showNextPhoto();
      shiftFilmstrip("next");
    } else {
      showPrevPhoto();
      shiftFilmstrip("prev");
    }

    setTimeout(() => {
      wheelLocked = false;
    }, 300);
  },
  { passive: false },
);
