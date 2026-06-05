import { center, bounds, markers } from "./constants/data.js";

const header = document.getElementById("site-header");
const tourBadge = document.getElementById("tour-badge");
const panel = document.getElementById("station-panel");
const panelClose = document.getElementById("panel-close");
const panelImg = document.getElementById("panel-img");
const panelTitle = document.getElementById("panel-title");

const audio = document.getElementById("hidden-audio");
const playBtn = document.getElementById("audio-play-btn");
const iconPlay = playBtn.querySelector(".icon-play");
const iconPause = playBtn.querySelector(".icon-pause");
const progressBar = document.querySelector(".audio-progress-bar");
const fillEl = document.getElementById("audio-fill");
const thumbEl = document.getElementById("audio-thumb");
const timeCurrentEl = document.getElementById("audio-current");
const timeDurationEl = document.getElementById("audio-duration");


const mercatiIcon = L.icon({
  iconUrl: "./media/logos/Marker_mappa_2.png",
  iconSize: [70, 70],
  iconAnchor: [35, 70],
  popupAnchor: [0, -72],
});

const map = L.map("map", {
  center,
  zoom: 14,
  minZoom: 12,
  maxZoom: 25,
  maxBounds: bounds,
  maxBoundsViscosity: 0.5,
  zoomControl: false,
  attributionControl: false,
});

L.tileLayer("https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png", {
  maxZoom: 20,
}).addTo(map);


markers.forEach((p) => {
  const marker = L.marker([p.lat, p.lng], {
    icon: mercatiIcon,
    riseOnHover: true,
    riseOffset: 400,
  }).addTo(map);

  marker.on("click", () => {
    const panelIsOpen = !panel.hasAttribute("hidden");

    if (panelIsOpen) {
      silentClose();
      map.once("moveend", () => openPanel(p));
    } else {
      map.once("moveend", () => openPanel(p));
    }

    header.classList.add("hidden");

    map.flyTo(marker.getLatLng(), 16, {
      animate: true,
      duration: 1.2,
      easeLinearity: 0.4,
    });
  });
});


const waypoints = markers
  .filter((p) => !p.excludeFromRouting)
  .map((p) => L.latLng(p.lat, p.lng));

L.Routing.control({
  waypoints,
  routeWhileDragging: false,
  addWaypoints: false,
  draggableWaypoints: false,
  createMarker: () => null,
  fitSelectedRoutes: false,
  lineOptions: {
    styles: [
      { color: "#0d0d0d", opacity: 1, weight: 5 },
      { color: "#60257b", opacity: 0.85, weight: 2 },
    ],
  },
}).addTo(map);


function openPanel(p) {
  if (p.image) {
    panelImg.src = p.image;
    panelImg.alt = p.name;
    panelImg.parentElement.style.display = "block";
  } else {
    panelImg.parentElement.style.display = "none";
  }

  panelTitle.textContent = p.name;

  audio.pause();
  audio.src = p.audio;
  audio.load();

  setPlayState(false);
  fillEl.style.width = "0%";
  thumbEl.style.left = "0%";
  timeCurrentEl.textContent = "0:00";
  timeDurationEl.textContent = "0:00";

  panel.hidden = false;
  requestAnimationFrame(() => panel.removeAttribute("hidden"));
}

function closePanel() {
  panel.setAttribute("hidden", "");
  audio.pause();
  setPlayState(false);
  header.classList.remove("hidden");
  tourBadge.classList.remove("hidden");
  map.setZoom(14, { animate: true, duration: 1 });
}

function silentClose() {
  panel.setAttribute("hidden", "");
  audio.pause();
  setPlayState(false);
}

panelClose.addEventListener("click", closePanel);

map.on("click", () => {
  if (!panel.hasAttribute("hidden")) closePanel();
});


function setPlayState(playing) {
  iconPlay.style.display = playing ? "none" : "block";
  iconPause.style.display = playing ? "block" : "none";
}

function formatTime(s) {
  if (!isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function updateProgress() {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  fillEl.style.width = `${pct}%`;
  thumbEl.style.left = `${pct}%`;
  timeCurrentEl.textContent = formatTime(audio.currentTime);
}

playBtn.addEventListener("click", () => audio.paused ? audio.play() : audio.pause());

audio.addEventListener("play", () => setPlayState(true));
audio.addEventListener("pause", () => setPlayState(false));
audio.addEventListener("ended", () => setPlayState(false));
audio.addEventListener("timeupdate", updateProgress);
audio.addEventListener("loadedmetadata", () => {
  timeDurationEl.textContent = formatTime(audio.duration);
});

progressBar.addEventListener("click", (e) => {
  const rect = progressBar.getBoundingClientRect();
  audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
});