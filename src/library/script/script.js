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
// Year data: each sphere photo + the write-up
// shown in the detail panel. Thumbnails cycle
// through one black-and-white photo per year
// (the sphere greyscales them anyway).
// ---------------------------------------------
const years = [
  { label: "1960", href: "../history/1960/index.html", caption: "1960년, 승리의 연회를 여는 시민들", photo: "../../asset/history/newspaper/419.png" },
  { label: "1979", href: "../history/1979/index.html", caption: "1979년, 부마민주항쟁의 시민들", photo: "../../asset/history/newspaper/buma.png" },
  { label: "1980", href: "../history/1980/index.html", caption: "1980년, 5·18 광주의 시민들", photo: "../../asset/history/newspaper/518.png" },
  { label: "1987", href: "../history/1987/index.html", caption: "1987년, 6월 항쟁의 시민들", photo: "../../asset/history/newspaper/6.png" },
  { label: "2016", href: "../history/2016/index.html", caption: "2016년, 촛불을 든 시민들", photo: "../../asset/history/newspaper/park.png" },
  { label: "2024-2025", href: "../history/2024/index.html", caption: "2024-2025년, 응원봉을 든 시민들", photo: "../../asset/history/newspaper/yoon.png" },
];

const ITEM_COUNT = 100;

// ---------------------------------------------
// Minimal 3x3 matrix / vector helpers (row-major).
// The sphere's look — item basis, idle spin, drag —
// is just composition of these.
// ---------------------------------------------
function vecCross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function vecLength(a) {
  return Math.hypot(a[0], a[1], a[2]);
}
function vecNormalize(a) {
  const length = vecLength(a) || 1;
  return [a[0] / length, a[1] / length, a[2] / length];
}

function mat3Mul(a, b) {
  const r = new Array(9);
  for (let i = 0; i < 3; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
    }
  }
  return r;
}

function mat3RotateY(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c, 0, s, 0, 1, 0, -s, 0, c];
}

function mat3RotateX(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [1, 0, 0, 0, c, -s, 0, s, c];
}

// Columns of a rotation matrix are where it sends the standard basis
// vectors; that's exactly what CSS matrix3d wants, so a plain
// row-major 3x3 plus a translation is all a sphere item transform is.
function mat3ToMatrix3d(m, translation) {
  const [tx, ty, tz] = translation;
  return (
    `matrix3d(${m[0]}, ${m[3]}, ${m[6]}, 0, ` +
    `${m[1]}, ${m[4]}, ${m[7]}, 0, ` +
    `${m[2]}, ${m[5]}, ${m[8]}, 0, ` +
    `${tx}, ${ty}, ${tz}, 1)`
  );
}

// The rotation matrix whose columns are (right, up, normal) tilts the
// standard X/Y/Z axes to match that basis — i.e. it's exactly the
// transform that turns a flat image (facing local +Z) so it faces
// outward along `normal`, positioned at `position` on the sphere.
function buildItemBasis(normal) {
  let referenceUp = [0, -1, 0];
  if (Math.abs(normal[1]) > 0.98) referenceUp = [1, 0, 0];
  const right = vecNormalize(vecCross(referenceUp, normal));
  const up = vecCross(normal, right);
  return [right[0], up[0], normal[0], right[1], up[1], normal[1], right[2], up[2], normal[2]];
}

// Even distribution of N points over a *unit* sphere; scaled to the
// gallery's own oval radii afterwards.
function fibonacciUnitSpherePoints(count) {
  const points = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i += 1) {
    const y = (i / (count - 1)) * 2 - 1;
    const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    points.push([Math.cos(theta) * ringRadius, y, Math.sin(theta) * ringRadius]);
  }
  return points;
}

// ---------------------------------------------
// Build the sphere: flattened into an oval that's
// roughly half the gallery's own width across.
// ---------------------------------------------
const gallery = document.querySelector("#gallery");
const viewport = document.querySelector("#sphereViewport");
const scene = document.querySelector("#sphereScene");
const library = document.querySelector(".library");

const detail = document.querySelector("#detail");
const detailPhoto = document.querySelector("#detailPhoto");
const detailCaption = document.querySelector("#detailCaption");
const detailLink = document.querySelector("#detailLink");
const detailClose = document.querySelector("#detailClose");
const detailPrev = document.querySelector("#detailPrev");
const detailNext = document.querySelector("#detailNext");
const detailBackdrop = document.querySelector(".detail-backdrop");

const galleryRect = gallery.getBoundingClientRect();
const OVAL_FLATTEN = 0.5;
// Capped by height as well as width — sizing purely off width let the
// oval's height spill past a short/wide gallery box and get clipped.
const radiusFromWidth = galleryRect.width * 0.4;
const radiusFromHeight = (galleryRect.height * 0.85) / (OVAL_FLATTEN * 2);
const RADIUS_X = Math.max(140, Math.min(radiusFromWidth, radiusFromHeight));
const RADIUS_Y = RADIUS_X * OVAL_FLATTEN;

// A rotating rigid shape only looks perfectly still at its own fixed
// center if perspective distortion is kept mild relative to its size
// — too much perspective for the radius makes whichever side is
// currently nearest the camera balloon outward, which reads as the
// whole sphere "drifting" even though it's only spinning in place.
viewport.style.perspective = `${RADIUS_X * 7}px`;

const unitPoints = fibonacciUnitSpherePoints(ITEM_COUNT);

const items = unitPoints.map((unit, index) => {
  const year = years[index % years.length];
  const position = [unit[0] * RADIUS_X, unit[1] * RADIUS_Y, unit[2] * RADIUS_X];
  // Outward normal of an ellipsoid (semi-axes RADIUS_X, RADIUS_Y, RADIUS_X)
  // at this surface point — not just the plain unit-sphere direction —
  // so each photo still sits flush against the flattened surface.
  const normal = vecNormalize([unit[0] / RADIUS_X, unit[1] / RADIUS_Y, unit[2] / RADIUS_X]);
  const basis = buildItemBasis(normal);

  const el = document.createElement("div");
  el.className = "sphere-item";
  el.style.transform = mat3ToMatrix3d(basis, position);
  el.innerHTML = `<img src="${year.photo}" alt="${year.caption}" />`;
  scene.appendChild(el);

  return { el, year };
});

items.forEach((item, index) => {
  item.el.addEventListener("click", (event) => {
    event.stopPropagation();
    if (dragMoved) return;
    focusItem(index);
  });
});

// ---------------------------------------------
// Idle spin: a slow constant yaw plus whatever the
// pointer has dragged in, expressed as the same
// row-major 3x3 the items themselves use. Rotation
// always happens about the scene's own fixed
// center, so the sphere never drifts — only the
// photos orbiting within it move.
// ---------------------------------------------
// Identity — the oval sits perfectly upright (its axis vertical); the
// idle spin and drag only ever add yaw about that vertical axis, so the
// silhouette stays a straight, level ellipse.
let sceneRotation = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const autoRotateSpeed = 0.0018;
let isDragging = false;
let dragMoved = false;
let lastPointerX = 0;
let lastPointerY = 0;
let focusedIndex = -1;
// The clicked thumbnail's on-screen rect at focus time — the sphere is
// frozen while focused, so this is still where it sits (at scale 1)
// when the panel closes, even though the sphere is scaled up by then.
let focusStartRect = null;
let focusStartIndex = -1;

function applySceneTransform() {
  scene.style.transform = mat3ToMatrix3d(sceneRotation, [0, 0, 0]);
}

function tick() {
  requestAnimationFrame(tick);
  if (isDragging || focusedIndex !== -1) return;
  sceneRotation = mat3Mul(mat3RotateY(autoRotateSpeed), sceneRotation);
  applySceneTransform();
}
applySceneTransform();
tick();

// ---------------------------------------------
// Drag to rotate (mouse + touch via Pointer Events).
// A click is just a drag that didn't go anywhere.
// ---------------------------------------------
viewport.addEventListener("pointerdown", (event) => {
  if (focusedIndex !== -1) return;
  isDragging = true;
  dragMoved = false;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  viewport.classList.add("is-dragging");
});

window.addEventListener("pointermove", (event) => {
  if (!isDragging) return;
  const deltaX = event.clientX - lastPointerX;
  const deltaY = event.clientY - lastPointerY;
  if (Math.abs(deltaX) + Math.abs(deltaY) > 3) dragMoved = true;

  // Yaw only — dragging spins the sphere left/right, never up/down.
  sceneRotation = mat3Mul(mat3RotateY(deltaX * 0.006), sceneRotation);
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  applySceneTransform();
});

window.addEventListener("pointerup", () => {
  isDragging = false;
  viewport.classList.remove("is-dragging");
});

// ---------------------------------------------
// Click-to-zoom: the sphere freezes, then the
// whole thumbnail field zooms straight into the
// clicked photo's centre and fades — the
// background looks pulled into the image as it
// opens — while that one photo FLIP-grows from
// its exact on-screen spot to its full, natural-
// ratio size.
// ---------------------------------------------
const ZOOM_DURATION = 620;
const ZOOM_SCALE = 4.5;

function setBlurred(exceptIndex) {
  items.forEach((item, index) => {
    item.el.classList.toggle("is-blurred", index !== exceptIndex);
    item.el.classList.toggle("is-focused-item", index === exceptIndex);
  });
}

function showDetailContent(index) {
  const { year } = items[index];
  detailPhoto.src = year.photo;
  detailPhoto.alt = year.caption;
  detailCaption.textContent = year.caption;
  detailLink.href = year.href;
}

// Size the detail photo to the source image's own aspect ratio, fitted
// within the viewport. Read the natural size off the already-loaded
// sphere thumbnail so the resting box is known before any measuring.
function sizeDetailPhoto(index) {
  const img = items[index].el.querySelector("img");
  const naturalW = img.naturalWidth || 3;
  const naturalH = img.naturalHeight || 2;
  const maxW = Math.min(window.innerWidth * 0.88, 880);
  const maxH = window.innerHeight * 0.72;
  let width = maxW;
  let height = (naturalH / naturalW) * width;
  if (height > maxH) {
    height = maxH;
    width = (naturalW / naturalH) * height;
  }
  detailPhoto.style.width = `${Math.round(width)}px`;
  detailPhoto.style.height = `${Math.round(height)}px`;
}

function focusItem(index) {
  focusedIndex = index;
  const startRect = items[index].el.getBoundingClientRect();
  const viewportRect = viewport.getBoundingClientRect();
  focusStartRect = startRect;
  focusStartIndex = index;

  setBlurred(index);
  gallery.classList.add("is-focused");
  library.classList.add("is-focus-open");

  showDetailContent(index);
  sizeDetailPhoto(index);
  detail.hidden = false;

  // Snap the photo to the clicked circle's exact position/size before
  // painting, then transition it to its resting (full-size) layout on
  // the next frame so it visibly grows out from that spot.
  const endRect = detailPhoto.getBoundingClientRect();
  const scaleX = startRect.width / endRect.width;
  const scaleY = startRect.height / endRect.height;
  const translateX = startRect.left + startRect.width / 2 - (endRect.left + endRect.width / 2);
  const translateY = startRect.top + startRect.height / 2 - (endRect.top + endRect.height / 2);

  detailPhoto.style.transition = "none";
  detailPhoto.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;

  // The whole sphere scales up out of frame from the clicked photo's
  // centre — the "sucked in" background.
  const originX = startRect.left + startRect.width / 2 - viewportRect.left;
  const originY = startRect.top + startRect.height / 2 - viewportRect.top;
  viewport.style.transition = "none";
  viewport.style.transformOrigin = `${originX}px ${originY}px`;
  viewport.style.transform = "scale(1)";
  viewport.style.opacity = "1";

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      detail.classList.add("is-visible");

      detailPhoto.style.transition = `transform ${ZOOM_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      detailPhoto.style.transform = "translate(0, 0) scale(1, 1)";

      viewport.style.transition =
        `transform ${ZOOM_DURATION}ms cubic-bezier(0.5, 0, 0.5, 1), opacity ${ZOOM_DURATION}ms ease`;
      viewport.style.transform = `scale(${ZOOM_SCALE})`;
      viewport.style.opacity = "0";
    });
  });
}

// Prev/Next while already focused just swap the photo/caption/link in
// place — the sphere stays frozen behind the panel, no rotation.
function switchDetail(index) {
  focusedIndex = index;
  setBlurred(index);
  detailPhoto.style.transition = "opacity 0.2s ease";
  detailPhoto.style.opacity = "0";
  setTimeout(() => {
    showDetailContent(index);
    sizeDetailPhoto(index);
    detailPhoto.style.opacity = "1";
  }, 200);
}

function unfocus() {
  if (focusedIndex === -1) return;
  const closingIndex = focusedIndex;
  focusedIndex = -1;

  detail.classList.remove("is-visible");
  items.forEach((item) => item.el.classList.remove("is-blurred", "is-focused-item"));
  gallery.classList.remove("is-focused");
  library.classList.remove("is-focus-open");

  // FLIP the photo back down onto the thumbnail it opened from (its
  // frozen scale-1 position, captured at focus time) while the sphere
  // zooms back out to fill the frame again. If prev/next moved us to a
  // different photo we no longer know that spot — just collapse to the
  // centre.
  const photoRect = detailPhoto.getBoundingClientRect();
  detailPhoto.style.transition = `transform ${ZOOM_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`;
  if (focusStartRect && closingIndex === focusStartIndex) {
    const target = focusStartRect;
    const scaleX = target.width / photoRect.width || 0.01;
    const scaleY = target.height / photoRect.height || 0.01;
    const translateX = target.left + target.width / 2 - (photoRect.left + photoRect.width / 2);
    const translateY = target.top + target.height / 2 - (photoRect.top + photoRect.height / 2);
    detailPhoto.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
  } else {
    detailPhoto.style.transform = "scale(0.01)";
  }

  viewport.style.transition =
    `transform ${ZOOM_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${ZOOM_DURATION}ms ease`;
  viewport.style.transform = "scale(1)";
  viewport.style.opacity = "1";

  setTimeout(() => {
    detail.hidden = true;
    detailPhoto.style.transition = "";
    detailPhoto.style.transform = "";
    detailPhoto.style.opacity = "";
    detailPhoto.style.width = "";
    detailPhoto.style.height = "";
    viewport.style.transition = "";
    viewport.style.transform = "";
    viewport.style.opacity = "";
    viewport.style.transformOrigin = "";
  }, ZOOM_DURATION);
}

detailPrev.addEventListener("click", (event) => {
  event.stopPropagation();
  if (focusedIndex === -1) return;
  switchDetail((focusedIndex - 1 + items.length) % items.length);
});

detailNext.addEventListener("click", (event) => {
  event.stopPropagation();
  if (focusedIndex === -1) return;
  switchDetail((focusedIndex + 1) % items.length);
});

detailClose.addEventListener("click", (event) => {
  event.stopPropagation();
  unfocus();
});

detailBackdrop.addEventListener("click", () => unfocus());

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && focusedIndex !== -1) unfocus();
});
