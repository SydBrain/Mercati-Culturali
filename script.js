import { center, bounds, markers } from "./constants/data.js";

const header = document.querySelector("header");

const mercatiIcon = L.icon({
  iconUrl: "./media/logos/Marker_mappa_2.png",
  iconSize: [70, 70],
});

const map = L.map("map", {
  center: center,
  zoom: 14,
  minZoom: 12,
  maxZoom: 25,
  maxBounds: bounds,
  maxBoundsViscosity: 0.5,
  zoomControl: false,        
  attributionControl: false,
});

L.tileLayer(
  "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
  { maxZoom: 19 }
).addTo(map);

// Marker rendering e flyTo on click 
markers.forEach((p) => {
  const imageHtml = p.image ? `<img src="${p.image}" class="popup-image" alt="${p.name}" />` : '';
  
  const popupContent = `
    <div class="popup-custom">
      ${imageHtml}
      <div class="popup-title">${p.name}</div>
      <audio controls class="popup-audio">
        <source src="${p.audio}" type="audio/mpeg">
        Il tuo browser non supporta l'audio.
      </audio>
    </div>
  `;

  const marker = L.marker([p.lat, p.lng], {
    icon: mercatiIcon,
    riseOnHover: true,
    riseOffset: 400,
  })
    .addTo(map)
    .bindPopup(popupContent, {
      offset: L.point(0, -20),
    });

  marker.on("click", () => {
    map.once("moveend", () => {
      marker.openPopup();
    });

    map.flyTo(marker.getLatLng(), 16, {
      animate: true,
      duration: 1.3,
      easeLinearity: 0.5,
    });
  });
});

// 
const waypoints = markers
  .filter(p => !p.excludeFromRouting)
  .map(p => L.latLng(p.lat, p.lng));

L.Routing.control({
  waypoints: waypoints,
  routeWhileDragging: false,
  addWaypoints: false,
  draggableWaypoints: false,
  createMarker: () => null,
  lineOptions: {
    styles: [
      { color: "#60257b", opacity: 0.8, weight: 2},
    ],
  },
}).addTo(map);

// Effetti apertura popup 
map.on("popupopen", (e) => {
  const popupEl = e.popup.getElement();
  if (popupEl) popupEl.classList.add("popup-fadein");
  header.classList.add("hidden");
});

// Zoom out alla chiusura
map.on("popupclose", () => {
  header.classList.remove("hidden");
  map.setZoom(14, {
    animate: true,
    duration: 1,
  });
});