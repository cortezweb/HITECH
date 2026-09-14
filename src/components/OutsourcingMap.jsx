import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom Map Component for Outsourcing Agencies
export default function OutsourcingMap({ 
  agencies = [], 
  selectedAgencyId = null, 
  onSelectAgency,
  filterClient = 'ALL'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Centered at Tarija, Bolivia coordinates
      const map = L.map(mapContainerRef.current, {
        center: [-21.5332, -64.7339],
        zoom: 13,
        zoomControl: true,
        attributionControl: false
      });

      // Standard OSM Clean Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Attribution small at bottom right
      L.control.attribution({ position: 'bottomright', prefix: false })
        .addAttribution('SISTECH &copy; OpenStreetMap')
        .addTo(map);

      const markersGroup = L.featureGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersGroupRef.current = null;
      }
    };
  }, []);

  // Update Markers when agencies or filter changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    if (agencies.length === 0) return;

    const bounds = [];

    agencies.forEach((agency) => {
      const isSelected = selectedAgencyId === agency.id;
      const totalBackup = agency.toners?.reduce((sum, t) => sum + (t.currentStock || 0), 0) ?? 0;

      // Status calculation
      let statusColor = '#10b981'; // Green (optimo)
      let statusBgClass = 'bg-emerald-500';
      let shadowColor = 'rgba(16, 185, 129, 0.4)';
      let statusLabel = 'Óptimo';

      if (totalBackup === 0 || agency.status === 'critico') {
        statusColor = '#ef4444'; // Red (critico)
        statusBgClass = 'bg-rose-500';
        shadowColor = 'rgba(239, 68, 68, 0.5)';
        statusLabel = 'Crítico (0 Toners)';
      } else if (totalBackup <= 2 || agency.status === 'alerta') {
        statusColor = '#f59e0b'; // Amber / Yellow (alerta)
        statusBgClass = 'bg-amber-500';
        shadowColor = 'rgba(245, 158, 11, 0.4)';
        statusLabel = 'Alerta Stock Bajo';
      }

      // HTML marker for Leaflet
      const isCritical = totalBackup === 0 || agency.status === 'critico';
      const pulseHtml = isCritical 
        ? `<span class="absolute -inset-2 rounded-full bg-rose-500 opacity-60 animate-ping pointer-events-none"></span>` 
        : '';

      const markerHtml = `
        <div class="relative group cursor-pointer flex flex-col items-center">
          ${pulseHtml}
          <div class="relative flex items-center justify-center w-11 h-11 rounded-2xl shadow-xl transition-all duration-300 transform ${isSelected ? 'scale-125 ring-4 ring-white ring-offset-2 ring-offset-primary' : 'hover:scale-110'}"
               style="background-color: ${statusColor}; box-shadow: 0 10px 25px -5px ${shadowColor};">
            <span class="material-symbols-outlined text-white text-[22px]">print</span>
            <!-- Badge with number of toners in backup -->
            <span class="absolute -top-2 -right-2 flex items-center justify-center min-w-[22px] h-[22px] px-1 text-[11px] font-black text-white bg-slate-900 border-2 border-white rounded-full shadow-md">
              ${totalBackup}
            </span>
          </div>
          <!-- Pointer arrow -->
          <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px]" 
               style="border-t-color: ${statusColor};"></div>
          
          <!-- Label pill -->
          <div class="mt-1 px-2.5 py-0.5 bg-slate-900/90 backdrop-blur-md text-white rounded-full text-[10px] font-bold shadow whitespace-nowrap max-w-[150px] truncate border border-white/20">
            ${agency.agencyName}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-agency-pin',
        iconSize: [44, 60],
        iconAnchor: [22, 58],
        popupAnchor: [0, -56]
      });

      const marker = L.marker([agency.lat, agency.lng], { icon: customIcon });

      // Interactive popup
      const tonersListHtml = (agency.toners || []).slice(0, 3).map(t => `
        <div class="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
          <span class="font-medium text-slate-700 truncate max-w-[140px]">${t.model}</span>
          <span class="font-bold ${t.currentStock === 0 ? 'text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded' : 'text-slate-900'}">
            ${t.currentStock} en reserva
          </span>
        </div>
      `).join('');

      const popupContent = `
        <div class="p-3 font-sans text-slate-800 min-w-[220px]">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <span class="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${agency.clientCode === 'BUN' ? 'bg-blue-100 text-blue-800' : agency.clientCode === 'FIE' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'}">
              ${agency.clientName}
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${statusBgClass}">
              ${statusLabel}
            </span>
          </div>
          <h4 class="font-bold text-sm text-slate-900 leading-tight mb-1">${agency.agencyName}</h4>
          <p class="text-[11px] text-slate-500 mb-2 flex items-center gap-1">
            <span class="material-symbols-outlined text-[14px]">location_on</span>
            ${agency.city} - ${agency.address}
          </p>
          
          <div class="bg-slate-50 rounded-lg p-2 mb-2 border border-slate-200/60">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reserva de Tóners:</div>
            ${tonersListHtml}
          </div>

          <button id="btn-open-agency-${agency.id}" 
                  class="w-full py-1.5 bg-primary text-white rounded-lg text-xs font-bold shadow hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer">
            <span class="material-symbols-outlined text-[16px]">visibility</span>
            Ver Ficha Completa
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 280, className: 'agency-map-popup' });

      marker.on('click', () => {
        if (onSelectAgency) {
          onSelectAgency(agency);
        }
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-open-agency-${agency.id}`);
        if (btn) {
          btn.onclick = () => {
            if (onSelectAgency) onSelectAgency(agency);
          };
        }
      });

      markersGroup.addLayer(marker);
      bounds.push([agency.lat, agency.lng]);
    });

    // Auto fit bounds
    if (bounds.length > 0) {
      if (selectedAgencyId) {
        const selected = agencies.find(a => a.id === selectedAgencyId);
        if (selected) {
          map.flyTo([selected.lat, selected.lng], 15, { animate: true, duration: 1 });
          return;
        }
      }
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [agencies, selectedAgencyId, filterClient, onSelectAgency]);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden shadow-inner border border-outline-variant/30">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px] z-0" />

      {/* Floating Legend / Quick Overview */}
      <div className="absolute top-4 right-4 z-[400] bg-surface-container-lowest/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-outline-variant/20 flex flex-col gap-1.5 text-[11px] max-w-[210px]">
        <div className="font-bold text-on-surface text-xs mb-1 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[18px]">layers</span>
          Semáforo de Backup
        </div>
        <div className="flex items-center gap-2 text-on-surface">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm flex-shrink-0" />
          <span className="font-medium">Óptimo (≥ 3 en reserva)</span>
        </div>
        <div className="flex items-center gap-2 text-on-surface">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-sm flex-shrink-0" />
          <span className="font-medium">Alerta (1 - 2 en reserva)</span>
        </div>
        <div className="flex items-center gap-2 text-on-surface">
          <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-sm flex-shrink-0 animate-pulse" />
          <span className="font-medium text-rose-600 font-bold">Crítico (0 tóners)</span>
        </div>
      </div>
    </div>
  );
}
