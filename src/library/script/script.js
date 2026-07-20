const menu = document.querySelector(".topbar__menu");
const toggle = document.querySelector(".topbar__menu-toggle");

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
// Year data: each year's photo(s) + the write-up
// shown in the detail card.
// ---------------------------------------------
const years = [
  {
    label: "1960",
    href: "../history/1960/index.html",
    photo: "../../asset/history/newspaper/419.png",
    caption: "승리의 연회를 여는 시민들",
    text: "1960년 4월, 승리로 끝난 혁명의 밤. 부정선거에 맞서 거리로 나온 시민들은 이승만 대통령의 하야 소식과 함께 서울 곳곳에서 만세를 부르며 밤늦도록 광장을 떠나지 않았다.",
  },
  {
    label: "1979",
    href: "../history/1979/index.html",
    photo: "../../asset/history/newspaper/buma.png",
    caption: "승리의 연회를 여는 시민들",
    text: "1979년 10월, 부산과 마산의 시민과 학생들은 유신 체제에 맞서 거리로 나섰다. 계엄군의 진압에도 불구하고 열흘 뒤 유신 정권은 막을 내렸다.",
  },
  {
    label: "1980",
    href: "../history/1980/index.html",
    photo: "../../asset/history/newspaper/518.png",
    caption: "승리의 연회를 여는 시민들",
    text: "1980년 5월, 광주 시민들은 열흘간 스스로 도시를 지켜냈다. 시민군과 시민들이 함께한 광장에는 두려움보다 연대의 노래가 먼저 울려 퍼졌다.",
  },
  {
    label: "1987",
    href: "../history/1987/index.html",
    photo: "../../asset/history/newspaper/6.png",
    caption: "승리의 연회를 여는 시민들",
    text: "1987년 6월, 전국의 거리를 가득 메운 시민들의 함성은 결국 대통령 직선제 개헌을 이끌어냈다. 광장에 모인 이들은 서로의 어깨를 두드리며 오랜 싸움의 끝을 자축했다.",
  },
  {
    label: "2016",
    href: "../history/2016/index.html",
    photo: "../../asset/history/newspaper/park.png",
    caption: "승리의 연회를 여는 시민들",
    text: "2016년 겨울, 광화문 광장은 매주 촛불을 든 시민들로 가득 찼다. 평화로운 촛불의 물결은 이듬해 봄, 마침내 헌정사상 최초의 대통령 파면으로 이어졌다.",
  },
  {
    label: "2024-2025",
    href: "../history/2024/index.html",
    photo: "../../asset/history/newspaper/yoon.png",
    caption: "승리의 연회를 여는 시민들",
    text: "2024년 12월, 다시 광장에 모인 시민들은 촛불 대신 응원봉을 들었다. 세대를 넘어선 연대의 불빛은 2025년 봄까지 계속되었다.",
  },
];

const ITEMS_PER_YEAR = 2;

// ---------------------------------------------
// Build the grid columns
// ---------------------------------------------
const columns = document.querySelectorAll(".library__column");

columns.forEach((column, yearIndex) => {
  const list = column.querySelector(".library__items");
  const year = years[yearIndex];

  for (let photoIndex = 0; photoIndex < ITEMS_PER_YEAR; photoIndex += 1) {
    const li = document.createElement("li");
    li.className = "library__item";

    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `
      <img src="${year.photo}" alt="${year.caption}" />
      <span class="library__caption">${year.caption}</span>
    `;
    button.addEventListener("click", () => openDetail(yearIndex, photoIndex));

    li.appendChild(button);
    list.appendChild(li);
  }
});

// ---------------------------------------------
// Detail modal
// ---------------------------------------------
const library = document.querySelector(".library");
const detail = document.querySelector("#detail");
const backButton = document.querySelector(".detail__back");
const backLabel = document.querySelector(".detail__back-label");
const detailYear = document.querySelector(".detail__year");
const detailPhoto = document.querySelector(".detail__photo");
const detailIndex = document.querySelector(".detail__index");
const detailText = document.querySelector(".detail__text");
const detailPrev = document.querySelector(".detail__prev");
const detailNext = document.querySelector(".detail__next");
const detailBackdrop = document.querySelector(".detail__backdrop");
const detailScroll = document.querySelector(".detail__scroll");

let currentYearIndex = 0;
let currentPhotoIndex = 0;

function renderDetail() {
  const year = years[currentYearIndex];
  detailYear.textContent = `${year.label.replace("-2025", "")}년도`;
  detailPhoto.src = year.photo;
  detailPhoto.alt = year.caption;
  detailIndex.textContent = `#0${currentPhotoIndex + 1}`;
  detailText.textContent = year.text;
  backLabel.textContent = `${year.label.replace("-2025", "")}년도`;
  detailScroll.scrollTop = 0;
}

function openDetail(yearIndex, photoIndex) {
  currentYearIndex = yearIndex;
  currentPhotoIndex = photoIndex;
  renderDetail();
  detail.hidden = false;
  library.classList.add("is-detail-open");
}

function closeDetail() {
  detail.hidden = true;
  library.classList.remove("is-detail-open");
}

detailPrev.addEventListener("click", () => {
  currentYearIndex = (currentYearIndex - 1 + years.length) % years.length;
  currentPhotoIndex = 0;
  renderDetail();
});

detailNext.addEventListener("click", () => {
  currentYearIndex = (currentYearIndex + 1) % years.length;
  currentPhotoIndex = 0;
  renderDetail();
});

backButton.addEventListener("click", closeDetail);
detailBackdrop.addEventListener("click", closeDetail);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !detail.hidden) closeDetail();
});
