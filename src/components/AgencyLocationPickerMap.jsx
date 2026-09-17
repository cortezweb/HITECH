import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Preset locations for quick navigation across Bolivia
const QUICK_LOCATIONS = [
  { name: 'Tarija Centro', lat: -21.5332, lng: -64.7339 },
  { name: 'Bermejo', lat: -22.7303, lng: -64.3372 },
  { name: 'Yacuiba', lat: -21.9964, lng: -63.6778 },
  { name: 'Villamontes', lat: -21.2604, lng: -63.4735 },
  { name: 'Santa Cruz', lat: -17.7833, lng: -63.1821 },
  { name: 'La Paz', lat: -16.5000, lng: -68.1500 },
  { name: 'Cochabamba', lat: -17.3895, lng: -66.1568 }
];

export default function AgencyLocationPickerMap({
  lat = -21.5332,
  lng = -64.7339,
  onChange,
  agencyName = '',
  city = '',
  address = ''
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const tileLayerRef = useRef(null);

  const [currentCoords, setCurrentCoords] = useState({
    lat: parseFloat(lat) || -21.5332,
    lng: parseFloat(lng) || -64.7339
  });
  const [mapType, setMapType] = useState('streets'); // 'streets' | 'satellite'
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState(null);

  // Sync internal coordinates when external props change
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

  // Tile layer updater function
  const applyTileLayer = (map, type) => {
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const tileUrl = type === 'satellite'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const maxZoom = type === 'satellite' ? 18 : 19;
    const attribution = type === 'satellite'
      ? '&copy; Esri, Maxar, Earthstar Geographics'
      : '&copy; OpenStreetMap contributors';

    const newLayer = L.tileLayer(tileUrl, { maxZoom, attribution }).addTo(map);
    tileLayerRef.current = newLayer;
  };

  // Switch map type dynamically
  useEffect(() => {
    if (mapInstanceRef.current) {
      applyTileLayer(mapInstanceRef.current, mapType);
    }
  }, [mapType]);

  // Trigger Leaflet resize calculation when expanded/collapsed
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ animate: true });
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = !isNaN(parseFloat(lat)) ? parseFloat(lat) : -21.5332;
    const initialLng = !isNaN(parseFloat(lng)) ? parseFloat(lng) : -64.7339;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    applyTileLayer(map, mapType);

    // Zoom control on top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Custom Draggable Pin
    const pinHtml = `
      <div class="relative flex flex-col items-center cursor-grab active:cursor-grabbing select-none group pointer-events-auto">
        <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 shadow-2xl flex items-center justify-center text-white border-2 border-white ring-4 ring-primary/30 transform transition-transform group-hover:scale-110">
          <span class="material-symbols-outlined text-[26px]">location_on</span>
        </div>
        <div class="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[9px] border-t-primary drop-shadow"></div>
        <div class="w-5 h-2 bg-black/40 rounded-full blur-[1px] mt-0.5 animate-pulse"></div>
        <div class="mt-1 px-2.5 py-1 bg-slate-900/95 backdrop-blur-md text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-xl whitespace-nowrap border border-white/20">
          Arrastra para mover
        </div>
      </div>
    `;

    const customPinIcon = L.divIcon({
      html: pinHtml,
      className: 'custom-draggable-pin',
      iconSize: [44, 76],
      iconAnchor: [22, 58]
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: customPinIcon,
      draggable: true,
      autoPan: true
    }).addTo(map);

    // Marker Drag handlers
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

    // Click anywhere on map to reposition marker
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

    // Automatic ResizeObserver for seamless sizing inside modals
    let resizeObserver = null;
    if (window.ResizeObserver && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (resizeObserver) resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, []);

  // Quick jump function
  const handleQuickJump = (targetLat, targetLng, zoomLevel = 15) => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    mapInstanceRef.current.flyTo([targetLat, targetLng], zoomLevel, { duration: 1 });
    markerRef.current.setLatLng([targetLat, targetLng]);
    setCurrentCoords({ lat: targetLat, lng: targetLng });
    if (onChange) onChange(targetLat, targetLng);
  };

  // Browser Geolocation (GPS)
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
        handleQuickJump(userLat, userLng, 16);
        setSearchFeedback({
          type: 'success',
          text: 'Ubicación GPS actual detectada correctamente.'
        });
        setTimeout(() => setSearchFeedback(null), 4000);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        alert('No se pudo obtener la ubicación GPS. Verifica los permisos de localización de tu navegador.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Search Address / Landmark via Nominatim OpenStreetMap
  const handleSearch = async (customQuery) => {
    const query = customQuery || searchQuery;
    if (!query || query.trim().length < 3) return;

    setIsSearching(true);
    setSearchFeedback(null);

    try {
      // Append Bolivia if not explicitly provided
      const queryWithCountry = query.toLowerCase().includes('bolivia') 
        ? query 
        : `${query}, Bolivia`;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryWithCountry)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const newLat = parseFloat(parseFloat(result.lat).toFixed(6));
        const newLng = parseFloat(parseFloat(result.lon).toFixed(6));

        handleQuickJump(newLat, newLng, 16);
        setSearchFeedback({
          type: 'success',
          text: `Encontrado: ${result.display_name.slice(0, 75)}...`
        });
      } else {
        setSearchFeedback({
          type: 'warning',
          text: 'No se encontró la dirección exacta. Prueba con la plaza o avenida principal.'
        });
      }
    } catch (err) {
      console.warn('Nominatim geocode error:', err);
      setSearchFeedback({
        type: 'error',
        text: 'Error de conexión al buscar ubicación en el mapa.'
      });
    } finally {
      setIsSearching(false);
      setTimeout(() => setSearchFeedback(null), 5000);
    }
  };

  return (
    <div className="space-y-3 bg-surface-container-low p-3.5 sm:p-4 rounded-2xl border border-outline-variant/30">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-outline-variant/15">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">pin_drop</span>
          </span>
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Ubicación Geográfica de la Sucursal
            </h4>
            <p className="text-[11px] text-slate-500">
              Haz clic en el mapa o arrastra el marcador para fijar la posición exacta
            </p>
          </div>
        </div>

        {/* View Controls: Satellite / Street / Expand / Locate */}
        <div className="flex items-center flex-wrap gap-1.5 self-start sm:self-auto">
          {/* Layer switcher */}
          <div className="flex bg-white rounded-xl p-0.5 border border-outline-variant/30 shadow-xs">
            <button
              type="button"
              onClick={() => setMapType('streets')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                mapType === 'streets'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Ver mapa de calles (OpenStreetMap)"
            >
              <span className="material-symbols-outlined text-[14px]">map</span>
              <span>Calles</span>
            </button>
            <button
              type="button"
              onClick={() => setMapType('satellite')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                mapType === 'satellite'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Ver vista satelital fotográfica (Esri)"
            >
              <span className="material-symbols-outlined text-[14px]">satellite_alt</span>
              <span>Satélite</span>
            </button>
          </div>

          {/* Expand / Minimize height toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-[11px] font-bold border border-outline-variant/30 shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
            title={isExpanded ? 'Reducir tamaño del mapa' : 'Ampliar mapa a pantalla grande'}
          >
            <span className="material-symbols-outlined text-[15px]">
              {isExpanded ? 'close_fullscreen' : 'open_in_full'}
            </span>
            <span>{isExpanded ? 'Reducir' : 'Ampliar'}</span>
          </button>

          {/* GPS Geolocation Button */}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-[11px] font-bold border border-emerald-200 shadow-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Ubicar mi posición actual por GPS"
          >
            <span className={`material-symbols-outlined text-[15px] ${isLocating ? 'animate-spin' : ''}`}>
              {isLocating ? 'progress_activity' : 'my_location'}
            </span>
            <span>{isLocating ? 'GPS...' : 'Mi GPS'}</span>
          </button>
        </div>
      </div>

      {/* Address Search Bar */}
      <div className="space-y-1.5">
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="Buscar calle, barrio, plaza o punto de referencia en el mapa..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-outline-variant/30 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="button"
            onClick={() => handleSearch()}
            disabled={isSearching || !searchQuery.trim()}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <span className={`material-symbols-outlined text-[16px] ${isSearching ? 'animate-spin' : ''}`}>
              {isSearching ? 'sync' : 'travel_explore'}
            </span>
            <span>{isSearching ? 'Buscando...' : 'Buscar'}</span>
          </button>
        </div>

        {/* Quick Search for Form Address */}
        {address && address.trim().length > 3 && (
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-500 font-medium">Dirección ingresada:</span>
            <button
              type="button"
              onClick={() => {
                const combined = city ? `${address}, ${city}` : address;
                setSearchQuery(combined);
                handleSearch(combined);
              }}
              className="font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer bg-primary/5 px-2 py-0.5 rounded-md border border-primary/20"
              title="Buscar en el mapa la dirección escrita en el formulario"
            >
              <span className="material-symbols-outlined text-[13px]">location_searching</span>
              <span>Buscar "{address}" en el mapa</span>
            </button>
          </div>
        )}

        {/* Search Feedback Banner */}
        {searchFeedback && (
          <div
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              searchFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : searchFeedback.type === 'warning'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {searchFeedback.type === 'success' ? 'check_circle' : 'info'}
            </span>
            <span className="truncate">{searchFeedback.text}</span>
          </div>
        )}
      </div>

      {/* Map Interactive Container */}
      <div className="relative rounded-2xl overflow-hidden border border-outline-variant/30 shadow-inner bg-slate-100 transition-all duration-300">
        <div
          ref={mapContainerRef}
          className={`w-full transition-all duration-300 ${
            isExpanded ? 'h-[460px] sm:h-[520px]' : 'h-72 sm:h-80'
          }`}
        />

        {/* Floating Instruction Banner */}
        <div className="absolute top-2 left-2 z-[400] bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-[11px] font-semibold flex items-center gap-2 shadow-lg border border-white/10 pointer-events-none">
          <span className="material-symbols-outlined text-[16px] text-amber-400 animate-bounce">touch_app</span>
          <span>Toca o arrastra el pin al lugar exacto</span>
        </div>

        {/* Floating Current Coordinates Badge */}
        <div className="absolute bottom-2 left-2 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-slate-800 text-[11px] font-mono font-bold flex items-center gap-2 shadow-md border border-slate-200">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Lat: {currentCoords.lat.toFixed(6)}, Lng: {currentCoords.lng.toFixed(6)}</span>
        </div>
      </div>

      {/* Quick City Centering Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">
          Centrar en:
        </span>
        {QUICK_LOCATIONS.map((loc) => (
          <button
            key={loc.name}
            type="button"
            onClick={() => handleQuickJump(loc.lat, loc.lng, 15)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer border border-outline-variant/20 whitespace-nowrap shadow-2xs"
          >
            {loc.name}
          </button>
        ))}
      </div>
    </div>
  );
}
