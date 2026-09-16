import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Preset coordinates for fast centering in Tarija and surroundings
const QUICK_LOCATIONS = [
  { name: 'Tarija Centro', lat: -21.5332, lng: -64.7339 },
  { name: 'Bermejo', lat: -22.7303, lng: -64.3372 },
  { name: 'Yacuiba', lat: -21.9964, lng: -63.6778 },
  { name: 'Villamontes', lat: -21.2604, lng: -63.4735 }
];

export default function AgencyLocationPickerMap({
  lat = -21.5332,
  lng = -64.7339,
  onChange,
  agencyName = '',
  city = ''
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [currentCoords, setCurrentCoords] = useState({ lat, lng });
  const [isLocating, setIsLocating] = useState(false);

  // Sync internal state when external props change
  useEffect(() => {
    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);
    if (!isNaN(numLat) && !isNaN(numLng)) {
      setCurrentCoords({ lat: numLat, lng: numLng });
      if (markerRef.current) {
        const cur = markerRef.current.getLatLng();
        if (Math.abs(cur.lat - numLat) > 0.00001 || Math.abs(cur.lng - numLng) > 0.00001) {
          markerRef.current.setLatLng([numLat, numLng]);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.panTo([numLat, numLng], { animate: true });
          }
        }
      }
    }
  }, [lat, lng]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = !isNaN(parseFloat(lat)) ? parseFloat(lat) : -21.5332;
    const initialLng = !isNaN(parseFloat(lng)) ? parseFloat(lng) : -64.7339;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    // Clean OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Reposition zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Custom Draggable Pin Icon
    const pinHtml = `
      <div class="relative flex flex-col items-center cursor-grab active:cursor-grabbing select-none group">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 shadow-xl flex items-center justify-center text-white border-2 border-white ring-4 ring-primary/20 transform transition-transform group-hover:scale-110">
          <span class="material-symbols-outlined text-[24px]">location_on</span>
        </div>
        <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-primary"></div>
        <div class="w-4 h-1.5 bg-black/30 rounded-full blur-[1px] mt-0.5 animate-pulse"></div>
        <div class="mt-1 px-2 py-0.5 bg-slate-900/90 backdrop-blur-md text-white rounded-md text-[10px] font-black uppercase tracking-wider shadow whitespace-nowrap border border-white/20">
          Arrastra para mover
        </div>
      </div>
    `;

    const customPinIcon = L.divIcon({
      html: pinHtml,
      className: 'custom-draggable-pin',
      iconSize: [40, 68],
      iconAnchor: [20, 52]
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: customPinIcon,
      draggable: true,
      autoPan: true
    }).addTo(map);

    // Handle marker dragging
    marker.on('drag', (e) => {
      const pos = e.target.getLatLng();
      setCurrentCoords({
        lat: parseFloat(pos.lat.toFixed(6)),
        lng: parseFloat(pos.lng.toFixed(6))
      });
    });

    marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      const newLat = parseFloat(pos.lat.toFixed(6));
      const newLng = parseFloat(pos.lng.toFixed(6));
      setCurrentCoords({ lat: newLat, lng: newLng });
      if (onChange) onChange(newLat, newLng);
    });

    // Handle clicking anywhere on map to move marker
    map.on('click', (e) => {
      const newLat = parseFloat(e.latlng.lat.toFixed(6));
      const newLng = parseFloat(e.latlng.lng.toFixed(6));
      marker.setLatLng([newLat, newLng]);
      setCurrentCoords({ lat: newLat, lng: newLng });
      map.panTo([newLat, newLng], { animate: true });
      if (onChange) onChange(newLat, newLng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Fix map sizing inside animated modals
    const timer1 = setTimeout(() => map.invalidateSize(), 150);
    const timer2 = setTimeout(() => map.invalidateSize(), 400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Quick jump function
  const handleQuickJump = (targetLat, targetLng) => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    mapInstanceRef.current.setView([targetLat, targetLng], 14, { animate: true });
    markerRef.current.setLatLng([targetLat, targetLng]);
    setCurrentCoords({ lat: targetLat, lng: targetLng });
    if (onChange) onChange(targetLat, targetLng);
  };

  // Browser Geolocation (Ubicar mi posición actual)
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización GPS.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const userLat = parseFloat(pos.coords.latitude.toFixed(6));
        const userLng = parseFloat(pos.coords.longitude.toFixed(6));
        handleQuickJump(userLat, userLng);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        alert('No se pudo obtener la ubicación GPS. Verifica los permisos de tu navegador.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-primary">pin_drop</span>
          <span>Ubicación en Mapa (Haz clic o arrastra el marcador) *</span>
        </label>

        {/* Quick GPS Geolocation Button */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="text-[11px] font-bold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
          title="Centrar en mi ubicación GPS actual"
        >
          <span className={`material-symbols-outlined text-[14px] ${isLocating ? 'animate-spin' : ''}`}>
            {isLocating ? 'progress_activity' : 'my_location'}
          </span>
          <span>{isLocating ? 'Obteniendo GPS...' : 'Mi Ubicación Actual'}</span>
        </button>
      </div>

      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-outline-variant/30 shadow-inner bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-56 z-0" />

        {/* Floating Instruction Banner */}
        <div className="absolute top-2 left-2 z-10 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-[11px] font-semibold flex items-center gap-2 shadow-lg border border-white/10 pointer-events-none">
          <span className="material-symbols-outlined text-[16px] text-amber-400 animate-bounce">touch_app</span>
          <span>Toca o arrastra el pin a la calle o lugar exacto</span>
        </div>

        {/* Floating Current Coords Badge */}
        <div className="absolute bottom-2 left-2 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-slate-800 text-[11px] font-mono font-bold flex items-center gap-2 shadow border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Lat: {currentCoords.lat.toFixed(4)}, Lng: {currentCoords.lng.toFixed(4)}</span>
        </div>
      </div>

      {/* Quick City Centering Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Centrar en:</span>
        {QUICK_LOCATIONS.map(loc => (
          <button
            key={loc.name}
            type="button"
            onClick={() => handleQuickJump(loc.lat, loc.lng)}
            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-container hover:bg-surface-container-high text-slate-600 transition-colors cursor-pointer border border-outline-variant/20 whitespace-nowrap"
          >
            {loc.name}
          </button>
        ))}
      </div>
    </div>
  );
}
