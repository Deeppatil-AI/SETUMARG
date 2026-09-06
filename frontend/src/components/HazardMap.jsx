import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  AlertCircle, 
  Layers, 
  Compass, 
  Mountain, 
  Droplets, 
  X, 
  Radio, 
  ChevronDown,
  Navigation,
  Activity,
  Truck,
  CloudRain,
  Landmark
} from 'lucide-react';
import { getTranslation } from '../i18n';

// Design Token Colors
const TOKENS = {
  ink: '#1C2B22',
  paper: '#F1EDE2',
  paperCard: 'rgba(241, 237, 226, 0.95)',
  slate: '#3E5C63',
  slateBorder: 'rgba(62, 92, 99, 0.28)',
  monsoon: '#3B6EA5',
  riskSafe: '#5C7A4E',
  riskAmber: '#C77A2E',
  riskRed: '#A63A32',
};

// Map Alert Tier to Token Color
function getTierColor(tier, isBlocked) {
  if (isBlocked || tier === 'Severe' || tier === 'Very High') return TOKENS.riskRed;
  if (tier === 'High' || tier === 'Moderate') return TOKENS.riskAmber;
  return TOKENS.riskSafe;
}

// Map Alert Tier to Vector Line Width
function getTierLineWidth(tier, isBlocked, isSelected) {
  if (isSelected) return 9;
  if (isBlocked || tier === 'Severe') return 7;
  if (tier === 'Very High') return 6;
  if (tier === 'High') return 5;
  if (tier === 'Moderate') return 4;
  return 3;
}

// Custom Ground Incident Marker (Field Hazard Warning Pin)
const groundReportIcon = L.divIcon({
  html: `<div class="relative flex items-center justify-center cursor-pointer group">
          <div class="w-6 h-6 rounded-full bg-[#EF4444] border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs transform group-hover:scale-110 transition-transform">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <span class="absolute -bottom-1 w-2 h-1 bg-black/40 rounded-full blur-[1px]"></span>
        </div>`,
  className: 'field-hazard-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Refined Modern Cartographic Village Marker
function createVillageIcon(v) {
  const isCutOff = v.is_cut_off;
  
  if (isCutOff) {
    // Prominent emergency beacon pin for isolated/cut-off settlements
    return L.divIcon({
      html: `<div class="relative flex items-center justify-center cursor-pointer group">
              <span class="absolute w-7 h-7 rounded-full bg-[#EF4444]/40 animate-ping"></span>
              <div class="relative z-10 flex items-center gap-1 bg-[#991B1B] text-white border-2 border-[#FECACA] px-2 py-0.5 rounded-full shadow-lg text-[10px] font-bold tracking-tight whitespace-nowrap">
                <span class="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse"></span>
                <span>${v.name}</span>
                <span class="bg-[#EF4444] text-[9px] px-1 rounded text-white font-extrabold ml-0.5">CUT OFF</span>
              </div>
            </div>`,
      className: 'village-cutoff-marker',
      iconSize: [120, 26],
      iconAnchor: [60, 13]
    });
  }

  // Crisp, elegant node for open / monitored villages that integrates cleanly with terrain
  const color = v.meets_rai_standard ? '#10B981' : '#F59E0B';
  return L.divIcon({
    html: `<div class="relative flex items-center justify-center cursor-pointer group">
            <div class="w-3.5 h-3.5 rounded-full bg-white border-2 shadow-md flex items-center justify-center transition-transform group-hover:scale-125" style="border-color: ${color}">
              <div class="w-1.5 h-1.5 rounded-full" style="background-color: ${color}"></div>
            </div>
            <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-5 left-1/2 -translate-x-1/2 bg-[#1C2B22] text-[#F1EDE2] text-[10px] font-medium px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-30 border border-[#3E5C63]">
              ${v.name}
            </div>
          </div>`,
    className: 'village-clean-marker',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
}

// GPS Fleet Vehicle Marker (Moving, Delayed, or Stranded)
function createVehicleIcon(v) {
  const status = v?.status || 'moving';
  const isStranded = status === 'stranded';
  const isDelayed = status === 'delayed';
  const bgColor = isStranded ? '#DC2626' : (isDelayed ? '#D97706' : '#059669');
  const borderColor = isStranded ? '#FEF2F2' : (isDelayed ? '#FFFBEB' : '#ECFDF5');
  const ping = isStranded ? '<span class="absolute w-8 h-8 rounded-full bg-[#EF4444]/50 animate-ping pointer-events-none"></span>' : '';
  
  return L.divIcon({
    html: `<div class="relative flex items-center justify-center cursor-pointer group">
      ${ping}
      <div class="relative z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 transition-transform group-hover:scale-125" style="background-color: ${bgColor}; border-color: ${borderColor}; color: white;">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
      </div>
      <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#1C2B22] text-[#F1EDE2] text-[10px] font-bold px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-30 border border-[#3E5C63]">
        ${v?.id || 'VEH'} (${v?.cargo_type || 'Cargo'}) - ${status.toUpperCase()}
      </div>
    </div>`,
    className: 'fleet-vehicle-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

// Spatial Rain Status Badge Marker (Open-Meteo live mm/hr telemetry per district centroid)
function createRainStatusIcon(d) {
  const rain = Number(d?.current_rain_mm || 0);
  const isExtreme = rain >= 10.0;
  const isHeavy = rain >= 5.0;
  const isLight = rain > 0.0;

  let bg = '#334155'; // slate for no rain
  let border = '#64748B';
  let emoji = '🌤️';
  let textColor = '#F8FAFC';

  if (isExtreme) {
    bg = '#7F1D1D'; // deep dark red / cloudburst
    border = '#F87171';
    emoji = '⛈️';
    textColor = '#FEE2E2';
  } else if (isHeavy) {
    bg = '#B45309'; // amber
    border = '#FBBF24';
    emoji = '🌧️';
    textColor = '#FEF3C7';
  } else if (isLight) {
    bg = '#0369A1'; // sky blue
    border = '#38BDF8';
    emoji = '🌦️';
    textColor = '#E0F2FE';
  }

  const pingEffect = isExtreme 
    ? `<span class="absolute -inset-1 rounded-full bg-[#EF4444]/60 animate-ping pointer-events-none"></span>` 
    : '';

  return L.divIcon({
    html: `<div class="relative flex items-center justify-center cursor-pointer group">
      ${pingEffect}
      <div class="relative z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-full shadow-md border text-[10px] font-mono font-bold whitespace-nowrap transition-transform group-hover:scale-110" style="background-color: ${bg}; border-color: ${border}; color: ${textColor};">
        <span class="text-[10px] leading-none">${emoji}</span>
        <span>${rain.toFixed(1)} <span class="text-[8px] font-sans opacity-80">mm/h</span></span>
      </div>
      <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1C2B22] text-[#F1EDE2] text-[10px] font-medium px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-30 border border-[#3E5C63]">
        <div class="font-bold text-xs">${d.district || 'District'}</div>
        <div class="text-[9px] text-[#A7F3D0]">${rain.toFixed(1)} mm/hr live • 24h Fc: ${d.forecast_next_24h_mm || 0}mm</div>
      </div>
    </div>`,
    className: 'rain-status-marker',
    iconSize: [70, 22],
    iconAnchor: [35, 11]
  });
}

// GSI Bhukosh Historical Landslide Inventory Marker (1998-2024 verified field incidents)
function createGsiLandslideIcon(g) {
  const closureDays = Number(g?.road_closure_days || 0);
  const isHighImpact = closureDays >= 4.0;
  const bg = isHighImpact ? '#881337' : '#9A3412'; // rose-900 or amber-800
  const border = '#FDE047'; // golden ring

  return L.divIcon({
    html: `<div class="relative flex items-center justify-center cursor-pointer group">
      <div class="relative z-10 w-5 h-5 flex items-center justify-center shadow-lg border-2 transform rotate-45 transition-transform group-hover:scale-125" style="background-color: ${bg}; border-color: ${border};">
        <span class="transform -rotate-45 text-[9px] font-black text-amber-200">▲</span>
      </div>
      <span class="absolute -bottom-1 w-2.5 h-1 bg-black/40 rounded-full blur-[1px]"></span>
      <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-7 left-1/2 -translate-x-1/2 bg-[#1C2B22] text-[#F1EDE2] text-[10px] font-sans px-2 py-1 rounded shadow-xl pointer-events-none whitespace-nowrap z-30 border border-[#FDE047]/40">
        <div class="font-bold text-[#FDE047] text-[10px]">GSI Bhukosh: ${g.name} (${g.year})</div>
        <div class="text-[9px] text-gray-300 font-mono">${g.highway} • ${g.slide_type} (${closureDays}d closure)</div>
      </div>
    </div>`,
    className: 'gsi-landslide-marker',
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
}

function MapClickHandler({ isPinDropping, onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (isPinDropping && onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

function MapInstanceExposer() {
  const map = useMap();
  useEffect(() => {
    window.setumargMap = map;
  }, [map]);
  return null;
}

export default function HazardMap({ 
  segmentsData, 
  accessibilityData,
  hazardReports, 
  selectedSegment, 
  setSelectedSegment,
  isPinDropping,
  setIsPinDropping,
  onPinDropSelect,
  currentLanguage = 'en'
}) {
  const t = (k) => getTranslation(currentLanguage, k);
  const [filterTier, setFilterTier] = useState('ALL');
  const [villageFilter, setVillageFilter] = useState('ALL'); // 'ALL' | 'CUTOFF' | 'NONE'
  const [fleetFilter, setFleetFilter] = useState('ALL'); // 'ALL' | 'STRANDED' | 'NONE'
  const [fleetVehicles, setFleetVehicles] = useState([]);
  const [showLiveDeliveriesTray, setShowLiveDeliveriesTray] = useState(false);
  const [hoveredVillage, setHoveredVillage] = useState(null);

  // Live District Weather (Spatial Rain Overlay) & GSI Historical Landslides Layer
  const [districtWeather, setDistrictWeather] = useState([]);
  const [showRainOverlay, setShowRainOverlay] = useState(true);
  const [historicalLandslides, setHistoricalLandslides] = useState([]);
  const [showGsiHistory, setShowGsiHistory] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchFleet = async () => {
      try {
        const res = await fetch('/api/fleet/vehicles');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setFleetVehicles(data.vehicles || []);
          }
        }
      } catch (e) {
        // silent recovery
      }
    };

    const fetchWeather = async () => {
      try {
        const res = await fetch('/api/risk/weather/districts');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.districts) {
            setDistrictWeather(data.districts || []);
          }
        }
      } catch (e) {
        // silent recovery
      }
    };

    const fetchGsiLandslides = async () => {
      try {
        const res = await fetch('/api/risk/historical-landslides');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.incidents) {
            setHistoricalLandslides(data.incidents || []);
          }
        }
      } catch (e) {
        // silent recovery
      }
    };

    fetchFleet();
    fetchWeather();
    fetchGsiLandslides();

    const fleetInterval = setInterval(fetchFleet, 12000);
    const weatherInterval = setInterval(fetchWeather, 30000);

    return () => {
      isMounted = false;
      clearInterval(fleetInterval);
      clearInterval(weatherInterval);
    };
  }, []);

  const segments = segmentsData?.segments || [];
  const villages = accessibilityData?.villages || [];
  const reports = hazardReports || [];

  const filteredSegments = filterTier === 'ALL' 
    ? segments 
    : segments.filter(s => s.dynamic_alert_tier === filterTier);

  const displayedVillages = villages.filter(v => {
    if (villageFilter === 'NONE') return false;
    if (villageFilter === 'CUTOFF') return v.is_cut_off;
    return true;
  });

  const displayedVehicles = (fleetVehicles || []).filter(v => {
    if (!v) return false;
    const lat = v.lat ?? v.current_lat;
    const lng = v.lng ?? v.current_lng;
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return false;
    if (fleetFilter === 'NONE') return false;
    if (fleetFilter === 'STRANDED') return v.status === 'stranded';
    return true;
  });

  return (
    <div className="relative w-full h-[calc(100vh-100px)] bg-[#1C2B22] overflow-hidden">
      {/* Loading Overlay if Segments Still Initializing */}
      {(!segmentsData || segments.length === 0) && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#1C2B22]/90 backdrop-blur-sm text-[#F1EDE2]">
          <div className="w-10 h-10 border-4 border-[#5C7A4E] border-t-transparent rounded-full animate-spin mb-3"></div>
          <div className="font-heading font-bold text-sm text-[#F1EDE2]">Loading Monitored Mountain Highways...</div>
          <div className="text-xs text-[#6EE7B7] font-mono mt-1">Ingesting 415 segments, live Open-Meteo rain &amp; SRTM terrain</div>
        </div>
      )}

      {/* Full-Bleed Map Canvas with Topographic Hillshade Relief */}
      <MapContainer 
        center={[26.40, 92.80]} 
        zoom={7} 
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        {/* Topographic Hillshade & Contour Base Layer */}
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; National Geographic, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
          maxZoom={18}
        />

        <MapClickHandler 
          isPinDropping={isPinDropping} 
          onLocationSelect={(lat, lng) => {
            onPinDropSelect(lat, lng);
            setIsPinDropping(false);
          }} 
        />
        <MapInstanceExposer />

        {/* Hovered Village Isochrone Topographic Contour Halo Rings */}
        {hoveredVillage && hoveredVillage.lat && hoveredVillage.lng && (
          <>
            {/* 30-min Access Isochrone Ring */}
            <Circle
              center={[hoveredVillage.lat, hoveredVillage.lng]}
              radius={14000}
              pathOptions={{
                color: TOKENS.slate,
                fillColor: TOKENS.monsoon,
                fillOpacity: 0.12,
                weight: 1.5,
                dashArray: '3, 4'
              }}
            />
            {/* 60-min Emergency Isochrone Ring */}
            <Circle
              center={[hoveredVillage.lat, hoveredVillage.lng]}
              radius={28000}
              pathOptions={{
                color: TOKENS.slate,
                fillColor: 'transparent',
                weight: 1.0,
                dashArray: '4, 6'
              }}
            />
          </>
        )}

        {/* Monitored Road Corridors with Variable-Width Glowing Gradient Lines */}
        {filteredSegments.map((seg) => {
          const isSelected = selectedSegment?.segment_id === seg.segment_id;
          const isSevere = seg.dynamic_alert_tier === 'Severe' || seg.is_blocked;
          const strokeColor = getTierColor(seg.dynamic_alert_tier, seg.is_blocked);
          const strokeWidth = getTierLineWidth(seg.dynamic_alert_tier, seg.is_blocked, isSelected);

          return (
            <Polyline
              key={seg.segment_id}
              positions={seg.coordinates}
              pathOptions={{
                color: strokeColor,
                weight: strokeWidth,
                opacity: isSelected ? 1.0 : 0.90,
                dashArray: seg.is_blocked ? '8, 6' : undefined,
                className: isSevere ? 'severe-hazard-line' : undefined
              }}
              eventHandlers={{
                click: () => setSelectedSegment(seg)
              }}
            >
              <Tooltip sticky>
                <div className="font-sans text-xs p-1 text-[#1C2B22]">
                  <div className="font-heading font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: strokeColor }}></span>
                    {seg.highway} — {seg.name}
                  </div>
                  <div className="text-[11px] text-[#3E5C63] mt-0.5">
                    Danger Level: <strong style={{ color: strokeColor }}>{seg.dynamic_alert_tier}</strong> (Danger Score: {Math.round(seg.dynamic_risk_score * 100)}%)
                  </div>
                  {seg.disruption_likelihood_pct !== undefined && (
                    <div className="text-[10px] font-semibold text-[#A63A32] mt-1 bg-[#A63A32]/10 px-1.5 py-0.5 rounded border border-[#A63A32]/20 flex items-center gap-1">
                      <span>⚠</span>
                      <span>Next 24-48h Disruption Risk: <strong>{seg.disruption_likelihood_pct}%</strong></span>
                    </div>
                  )}
                  {seg.is_blocked && (
                    <div className="text-[#A63A32] font-semibold text-[11px] mt-0.5">Road Completely Blocked by Mudslide / Debris</div>
                  )}
                  <div className="text-[10px] text-[#3E5C63] opacity-80 mt-1">Click road for full safety details &amp; ground conditions</div>
                </div>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* Villages as Cartographic Population Nodes */}
        {displayedVillages.map((vil) => (
          <Marker
            key={vil.id}
            position={[vil.lat, vil.lng]}
            icon={createVillageIcon(vil)}
            eventHandlers={{
              mouseover: () => setHoveredVillage(vil),
              mouseout: () => setHoveredVillage(null)
            }}
          >
            <Tooltip>
              <div className="text-xs p-1 text-[#1C2B22]">
                <div className="font-heading font-bold">{vil.name}</div>
                <div className="text-[11px] text-[#3E5C63]">Population: {vil.population.toLocaleString()} people</div>
                <div className="text-[11px] font-mono">
                  Travel Time to Hospital: <strong>{vil.effective_travel_hospital_min} mins</strong> (Normally: {vil.base_travel_hospital_min} mins)
                </div>
                <div className="text-[10px] text-[#3E5C63] mt-0.5 font-sans">
                  Status: <strong>{vil.is_cut_off ? 'Cut-off from main highway' : (vil.effective_travel_hospital_min > 90 ? 'Delayed hospital access' : 'Open road')}</strong>
                </div>
              </div>
            </Tooltip>
          </Marker>
        ))}

        {/* Crowdsourced Ground Incidents (Field Pin Drops) */}
        {reports.map((rep) => (
          <Marker 
            key={rep.id} 
            position={[rep.lat, rep.lng]}
            icon={groundReportIcon}
          >
            <Popup>
              <div className="text-xs p-1 max-w-xs text-[#1C2B22]">
                <div className="flex items-center justify-between border-b border-[#3E5C63]/20 pb-1 mb-1">
                  <span className="font-heading font-bold text-[#A63A32]">
                    {rep.hazard_type}
                  </span>
                  <span className="text-[10px] font-mono text-[#3E5C63]">
                    {rep.severity}
                  </span>
                </div>
                <p className="text-[11px] text-[#1C2B22] mb-1 font-medium">{rep.description}</p>
                {rep.photo_url && (
                  <img 
                    src={rep.photo_url} 
                    alt="Hazard ground evidence" 
                    className="w-full h-28 object-cover rounded my-1.5 border border-[#3E5C63]/30 shadow-xs" 
                  />
                )}
                <div className="text-[10px] text-[#3E5C63] font-mono space-y-0.5">
                  <div>Corridor: {rep.highway}</div>
                  <div>Reported: {rep.reported_by}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Real-Time GPS Fleet Vehicle Markers */}
        {displayedVehicles.map((v) => {
          const lat = v.lat ?? v.current_lat;
          const lng = v.lng ?? v.current_lng;
          if (!lat || !lng) return null;

          return (
            <Marker
              key={v.id || `${lat}-${lng}`}
              position={[lat, lng]}
              icon={createVehicleIcon(v)}
            >
              <Popup>
                <div className="text-xs p-1 max-w-xs text-[#1C2B22]">
                  <div className="flex items-center justify-between border-b border-[#3E5C63]/25 pb-1 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#1C2B22]" />
                      <span className="font-heading font-bold text-xs">{v.name || v.id}</span>
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                      v.status === 'stranded' ? 'bg-[#FEE2E2] text-[#991B1B] border border-[#F87171]' :
                      v.status === 'delayed' ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FBBF24]' :
                      'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]'
                    }`}>
                      {v.status || 'moving'}
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="bg-[#E5DEC9]/60 p-1.5 rounded border border-[#3E5C63]/20">
                      <div className="text-[10px] text-[#3E5C63] font-semibold">CARGO MANIFEST:</div>
                      <div className="font-bold text-[#1C2B22]">{v.cargo_type || 'Cargo'} ({v.cargo_weight_tons || 5} tons)</div>
                    </div>
                    <div>
                      <span className="text-[#3E5C63]">Route: </span>
                      <strong className="text-[#1C2B22]">{v.origin || 'Origin'} &rarr; {v.destination || 'Destination'}</strong>
                    </div>
                    <div>
                      <span className="text-[#3E5C63]">Corridor: </span>
                      <span className="font-mono text-[10px] text-[#1C2B22]">{v.highway || v.assigned_route || 'Corridor'}</span>
                    </div>
                    <div className="flex items-center justify-between font-mono text-[10px] pt-0.5">
                      <span>Speed: <strong>{v.speed_kmh || 0} km/h</strong></span>
                      <span>ETA: <strong>{v.eta_minutes ?? v.eta ?? '--'} mins</strong></span>
                    </div>
                    {v.status === 'stranded' && (
                      <div className="mt-1 p-1 bg-[#FEE2E2] text-[#991B1B] rounded text-[10px] font-medium border border-[#FCA5A5]">
                        ⚠ {v.status_reason || 'Stranded due to road hazard'}
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Live Rain Status Indicators (Open-Meteo per monitored district centroid) */}
        {showRainOverlay && districtWeather.map((d) => {
          if (!d || typeof d.lat !== 'number' || typeof d.lng !== 'number') return null;
          return (
            <Marker
              key={`rain-${d.district || d.lat}-${d.lng}`}
              position={[d.lat, d.lng]}
              icon={createRainStatusIcon(d)}
            >
              <Popup>
                <div className="text-xs p-1 max-w-xs text-[#1C2B22]">
                  <div className="flex items-center justify-between border-b border-[#3E5C63]/20 pb-1 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <CloudRain className="w-3.5 h-3.5 text-[#0284C7]" />
                      <span className="font-heading font-bold text-xs">{d.district}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#3E5C63]">{d.state}</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="bg-[#E5DEC9]/60 p-1.5 rounded border border-[#3E5C63]/20 flex items-center justify-between">
                      <span className="text-[10px] text-[#3E5C63]">Current Live Rainfall:</span>
                      <strong className="text-xs text-[#0284C7] font-mono">{d.current_rain_mm} mm/hr</strong>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[#3E5C63]">24-Hour Forecast Rain:</span>
                      <strong className="font-mono text-[#1C2B22]">{d.forecast_next_24h_mm} mm</strong>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[#3E5C63]">Condition:</span>
                      <span className="font-medium text-[#1C2B22]">{d.condition_summary || 'Normal'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[#3E5C63]">Relative Humidity:</span>
                      <span className="font-mono text-[#1C2B22]">{d.relative_humidity_pct ?? 82}%</span>
                    </div>
                    <div className="mt-1 pt-1 border-t border-[#3E5C63]/20 text-[9px] text-[#3E5C63] font-mono">
                      Source: Open-Meteo High-Res Spatial Ingestion
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Geological Survey of India (GSI) Bhukosh Historical Landslides Layer */}
        {showGsiHistory && historicalLandslides.map((g) => {
          if (!g || typeof g.lat !== 'number' || typeof g.lng !== 'number') return null;
          return (
            <Marker
              key={g.id || g.gsi_bhukosh_id}
              position={[g.lat, g.lng]}
              icon={createGsiLandslideIcon(g)}
            >
              <Popup>
                <div className="text-xs p-1 max-w-xs text-[#1C2B22]">
                  <div className="flex items-center justify-between border-b border-[#3E5C63]/20 pb-1 mb-1.5">
                    <span className="font-heading font-bold text-xs text-[#9A3412]">
                      {g.name}
                    </span>
                    <span className="text-[9px] font-mono bg-amber-100 text-amber-900 border border-amber-300 px-1 py-0.2 rounded font-bold">
                      {g.year}
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="text-[10px] font-mono text-[#3E5C63]">
                      GSI ID: <strong>{g.gsi_bhukosh_id}</strong>
                    </div>
                    <div className="bg-[#E5DEC9]/60 p-1.5 rounded border border-[#3E5C63]/20 space-y-0.5">
                      <div className="text-[10px] text-[#3E5C63]">
                        <strong>Highway:</strong> {g.highway} ({g.district}, {g.state})
                      </div>
                      <div className="text-[10px] text-[#1C2B22]">
                        <strong>Failure Type:</strong> {g.slide_type}
                      </div>
                      <div className="text-[10px] text-[#3E5C63]">
                        <strong>Material:</strong> {g.material}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5 text-[10px] font-mono">
                      <div className="bg-white/80 p-1 rounded border border-gray-200">
                        <span className="text-[#3E5C63] block text-[9px] font-sans">Trigger Rain</span>
                        <strong>{g.trigger_rainfall_mm_24h} mm/24h</strong>
                      </div>
                      <div className="bg-white/80 p-1 rounded border border-gray-200">
                        <span className="text-[#3E5C63] block text-[9px] font-sans">Road Closure</span>
                        <strong>{g.road_closure_days} days</strong>
                      </div>
                    </div>
                    <div className="text-[9px] text-[#3E5C63] pt-1 border-t border-[#3E5C63]/15">
                      Geomorphic Domain: {g.gsi_geomorphic_domain}
                    </div>
                    <div className="text-[9px] text-[#059669] font-semibold flex items-center gap-1">
                      <span>✓</span>
                      <span>Verified GSI Bhukosh / NLSM Inventory Point</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Header Instruction when Pin-Drop Mode is Active */}
      {isPinDropping && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-[#F1EDE2] text-[#1C2B22] border border-[#3E5C63] px-4 py-2 rounded shadow-lg flex items-center gap-3 text-xs font-heading font-bold animate-pulse">
          <span>{t('click_highway_report')}</span>
          <button 
            onClick={() => setIsPinDropping(false)}
            className="text-[#3E5C63] hover:text-[#1C2B22] p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Map Filter Controls Bar (Top Left) */}
      <div className="absolute top-4 left-4 z-10 bg-[#F1EDE2]/95 backdrop-blur-md border border-[#3E5C63]/30 px-3.5 py-2 rounded shadow-md text-xs flex flex-wrap items-center gap-3.5">
        {/* Road Danger Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#3E5C63] font-semibold text-[11px]">{t('roads_filter_label')}</span>
          {[
            { id: 'ALL', label: t('all') },
            { id: 'Severe', label: t('blocked') },
            { id: 'Very High', label: t('high_danger') },
            { id: 'High', label: t('warning') },
            { id: 'Moderate', label: t('watch') },
            { id: 'Low', label: t('safe') }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterTier(item.id)}
              className={`px-2 py-0.5 text-[11px] font-sans rounded transition ${
                filterTier === item.id
                  ? 'bg-[#1C2B22] text-[#F1EDE2] font-semibold shadow-xs'
                  : 'text-[#1C2B22] hover:bg-[#3E5C63]/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-[#3E5C63]/30 hidden sm:block"></div>

        {/* Village Markers Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#3E5C63] font-semibold text-[11px]">{t('villages_filter_label')}</span>
          {[
            { id: 'ALL', label: t('all_villages') },
            { id: 'CUTOFF', label: t('cut_off_only') },
            { id: 'NONE', label: t('hide') }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setVillageFilter(item.id)}
              className={`px-2 py-0.5 text-[11px] font-sans rounded transition ${
                villageFilter === item.id
                  ? 'bg-[#1C2B22] text-[#F1EDE2] font-semibold shadow-xs'
                  : 'text-[#1C2B22] hover:bg-[#3E5C63]/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-[#3E5C63]/30 hidden sm:block"></div>

        {/* Fleet Markers Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#3E5C63] font-semibold text-[11px] flex items-center gap-1">
            <Truck className="w-3 h-3 text-[#1C2B22]" /> {t('fleet_filter_label')}
          </span>
          {[
            { id: 'ALL', label: `${t('all')} (${fleetVehicles.length})` },
            { id: 'STRANDED', label: `${t('stranded')} (${fleetVehicles.filter(v => v.status === 'stranded').length})` },
            { id: 'NONE', label: t('hide') }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFleetFilter(item.id)}
              className={`px-2 py-0.5 text-[11px] font-sans rounded transition ${
                fleetFilter === item.id
                  ? 'bg-[#1C2B22] text-[#F1EDE2] font-semibold shadow-xs'
                  : 'text-[#1C2B22] hover:bg-[#3E5C63]/10'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => setShowLiveDeliveriesTray(!showLiveDeliveriesTray)}
            className={`ml-1.5 px-2 py-0.5 text-[11px] font-sans font-semibold rounded transition flex items-center gap-1 ${
              showLiveDeliveriesTray
                ? 'bg-[#A63A32] text-[#F1EDE2] shadow-xs'
                : 'bg-[#3E5C63]/15 text-[#1C2B22] hover:bg-[#3E5C63]/25'
            }`}
            title="Toggle Live Deliveries Overview Panel"
          >
            <Truck className="w-3 h-3" />
            <span>{t('deliveries')} ({fleetVehicles.length})</span>
          </button>
        </div>

        <div className="h-4 w-px bg-[#3E5C63]/30 hidden sm:block"></div>

        {/* Live Rain Status Overlay Toggle */}
        <button
          onClick={() => setShowRainOverlay(!showRainOverlay)}
          className={`px-2 py-0.5 text-[11px] font-sans font-semibold rounded transition flex items-center gap-1.5 ${
            showRainOverlay
              ? 'bg-[#0284C7] text-white shadow-xs'
              : 'text-[#1C2B22] hover:bg-[#3E5C63]/10 opacity-70'
          }`}
          title="Toggle live precipitation telemetry per district centroid"
        >
          <CloudRain className="w-3.5 h-3.5" />
          <span>{t('live_rain')} ({districtWeather.length})</span>
        </button>

        {/* GSI Bhukosh Historical Inventory Toggle */}
        <button
          onClick={() => setShowGsiHistory(!showGsiHistory)}
          className={`px-2 py-0.5 text-[11px] font-sans font-semibold rounded transition flex items-center gap-1.5 ${
            showGsiHistory
              ? 'bg-[#9A3412] text-white shadow-xs'
              : 'text-[#1C2B22] hover:bg-[#3E5C63]/10 opacity-70'
          }`}
          title="Toggle Geological Survey of India Bhukosh historical landslide inventory records"
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>{t('gsi_history')} ({historicalLandslides.length})</span>
        </button>
      </div>

      {/* Floating Live Deliveries Panel */}
      {showLiveDeliveriesTray && (
        <div className="absolute top-16 right-4 z-20 w-80 sm:w-96 bg-[#F1EDE2]/95 backdrop-blur-md border border-[#3E5C63]/40 rounded-lg shadow-2xl flex flex-col max-h-[75vh] animate-slide-up">
          <div className="p-3 border-b border-[#3E5C63]/25 flex items-center justify-between bg-[#E5DEC9]/70">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-[#1C2B22] text-[#F1EDE2]">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-xs text-[#1C2B22]">Live Deliveries Tracking</h3>
                <p className="text-[10px] text-[#3E5C63]">Real-time GPS telemetry &amp; hazard status</p>
              </div>
            </div>
            <button 
              onClick={() => setShowLiveDeliveriesTray(false)}
              className="text-[#3E5C63] hover:text-[#1C2B22] p-1 rounded hover:bg-[#3E5C63]/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="px-3 py-1.5 bg-[#1C2B22]/5 border-b border-[#3E5C63]/15 grid grid-cols-3 text-center text-[10px] font-mono">
            <div>
              <span className="text-[#3E5C63] block text-[9px] font-sans">Moving</span>
              <strong className="text-[#059669] text-xs">
                {fleetVehicles.filter(v => v.status === 'moving').length}
              </strong>
            </div>
            <div>
              <span className="text-[#3E5C63] block text-[9px] font-sans">Delayed</span>
              <strong className="text-[#D97706] text-xs">
                {fleetVehicles.filter(v => v.status === 'delayed').length}
              </strong>
            </div>
            <div>
              <span className="text-[#3E5C63] block text-[9px] font-sans">Stranded</span>
              <strong className="text-[#DC2626] text-xs">
                {fleetVehicles.filter(v => v.status === 'stranded').length}
              </strong>
            </div>
          </div>

          {/* Vehicle List */}
          <div className="p-2 space-y-2 overflow-y-auto flex-1 text-xs">
            {fleetVehicles.map(v => {
              const statusColor = v.status === 'stranded' 
                ? 'bg-[#DC2626] text-white' 
                : v.status === 'delayed'
                ? 'bg-[#D97706] text-white'
                : 'bg-[#059669] text-white';

              return (
                <div 
                  key={v.id}
                  onClick={() => {
                    const lat = v.lat ?? v.current_lat;
                    const lng = v.lng ?? v.current_lng;
                    if (window.setumargMap && lat && lng) {
                      window.setumargMap.setView([lat, lng], 11, { animate: true });
                    }
                  }}
                  className="bg-white/90 border border-[#3E5C63]/20 rounded p-2.5 hover:border-[#1C2B22] cursor-pointer transition shadow-xs hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-[#1C2B22] text-[11px]">{v.id}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${statusColor}`}>
                      {v.status}
                    </span>
                  </div>

                  <div className="text-[11px] font-medium text-[#1C2B22] truncate">
                    {v.cargo_type} <span className="text-[#3E5C63] text-[10px]">({v.cargo_weight_tons || 5}T)</span>
                  </div>

                  <div className="text-[10px] text-[#3E5C63] mt-1 truncate">
                    📍 {v.origin} → {v.destination}
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-[#3E5C63]/15 flex items-center justify-between text-[10px] font-mono text-[#3E5C63]">
                    <span>Speed: <strong className="text-[#1C2B22]">{v.speed_kmh || 0} km/h</strong></span>
                    <span>ETA: <strong className="text-[#1C2B22]">{v.eta_minutes ?? v.eta ?? '--'} mins</strong></span>
                  </div>

                  {v.status === 'stranded' && v.status_reason && (
                    <div className="mt-1.5 text-[9px] text-[#DC2626] bg-[#DC2626]/10 p-1 rounded font-sans leading-tight">
                      ⚠️ {v.status_reason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Integrated Cartographic Neatline Legend (Bottom Left) */}
      <div className="absolute bottom-6 left-4 z-10 bg-[#F1EDE2]/95 backdrop-blur-md border border-[#3E5C63]/35 p-3 rounded shadow-md max-w-xs text-[#1C2B22]">
        <div className="font-heading font-bold text-xs mb-1.5 pb-1 border-b border-[#3E5C63]/25 flex items-center justify-between">
          <span>{t('road_safety_guide')}</span>
          <span className="text-[10px] font-mono text-[#3E5C63]">{t('live_status')}</span>
        </div>
        
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-4 h-1.5 rounded-sm bg-[#A63A32]"></span>
              <strong className="text-[#A63A32]">{t('blocked_extreme_danger')}</strong>
            </span>
            <span className="font-mono text-[10px] text-[#3E5C63]">{t('do_not_travel')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-1 rounded-sm bg-[#C77A2E]"></span>
              <span className="text-[#C77A2E] font-medium">{t('warning_caution')}</span>
            </span>
            <span className="font-mono text-[10px] text-[#3E5C63]">{t('risk_of_slides')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-3 h-0.5 rounded-sm bg-[#5C7A4E]"></span>
              <span className="text-[#5C7A4E] font-medium">{t('clear_open')}</span>
            </span>
            <span className="font-mono text-[10px] text-[#3E5C63]">{t('safe_to_drive')}</span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-[#3E5C63]/20 space-y-1 text-[10px] text-[#3E5C63] font-sans">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white border-2 border-[#10B981] inline-block"></span>
            <span>{t('connected_village')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1 rounded text-[9px] bg-[#991B1B] text-white font-bold inline-block">CUT OFF</span>
            <span>{t('road_blocked_village')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[#EF4444] text-white text-[9px] flex items-center justify-center font-bold">⚠</span>
            <span>{t('reported_road_obstruction')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[#059669] border border-white text-white text-[8px] flex items-center justify-center font-bold">🚛</span>
            <span>{t('active_fleet_vehicle')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[#DC2626] border border-white text-white text-[8px] flex items-center justify-center font-bold">🛑</span>
            <span>{t('stranded_vehicle_alert')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1 py-0.2 rounded-full bg-[#0284C7] text-white text-[8px] font-mono font-bold inline-block">🌧️ 1.2</span>
            <span>{t('live_rain_rate')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#9A3412] border border-[#FDE047] transform rotate-45 inline-block ml-0.5 mr-0.5"></span>
            <span>{t('gsi_historical_slide')}</span>
          </div>
        </div>
      </div>

      {/* Slide-Up Bottom Sheet: Segment Geotechnical Factor Telemetry (Mobile/Field Paradigm) */}
      {selectedSegment && (
        <div className="absolute bottom-0 left-0 right-0 z-20 max-h-[80vh] bg-[#F1EDE2] text-[#1C2B22] border-t-2 border-[#3E5C63] shadow-2xl p-5 overflow-y-auto animate-slide-up">
          <div className="max-w-7xl mx-auto">
            {/* Sheet Handle & Close */}
            <div className="flex items-start justify-between border-b border-[#3E5C63]/25 pb-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span 
                    className="font-mono text-[10px] font-bold px-2 py-0.5 rounded text-white" 
                    style={{ backgroundColor: getTierColor(selectedSegment.dynamic_alert_tier, selectedSegment.is_blocked) }}
                  >
                    {selectedSegment.dynamic_alert_tier.toUpperCase()} DANGER
                  </span>
                  <span className="font-mono text-xs text-[#3E5C63]">{selectedSegment.segment_id}</span>
                  <span className="text-xs text-[#3E5C63] font-medium">{selectedSegment.highway} • {selectedSegment.state} • {selectedSegment.length_km} km section</span>
                </div>
                <h3 className="font-heading font-bold text-base text-[#1C2B22] mt-0.5">
                  {selectedSegment.name}
                </h3>
              </div>

              <button 
                onClick={() => setSelectedSegment(null)}
                className="p-1 rounded text-[#3E5C63] hover:text-[#1C2B22] hover:bg-[#3E5C63]/10 transition"
                title="Close sheet"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Impassable Warning if flagged */}
            {selectedSegment.is_blocked && (
              <div className="bg-[#A63A32]/10 border-l-4 border-[#A63A32] p-2.5 mb-3 text-xs text-[#A63A32]">
                <strong className="font-heading">{t('road_is_blocked')} </strong>
                {selectedSegment.blockage_reason || t('mudslide_both_lanes')}
              </div>
            )}

            {/* Historical Incident Pattern & 24-48h Disruption Forecast Banner */}
            {selectedSegment.disruption_prediction_text && (
              <div className="bg-[#E5DEC9]/70 border border-[#3E5C63]/30 rounded p-3 mb-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#A63A32] animate-pulse"></span>
                    <h4 className="font-heading font-bold text-xs text-[#1C2B22]">
                      {t('historical_pattern_outlook')}
                    </h4>
                  </div>
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded text-white ${
                    selectedSegment.disruption_likelihood_pct >= 75 
                      ? 'bg-[#991B1B]' 
                      : selectedSegment.disruption_likelihood_pct >= 50 
                        ? 'bg-[#C77A2E]' 
                        : 'bg-[#5C7A4E]'
                  }`}>
                    {selectedSegment.disruption_likelihood_pct}% {t('disruption_likelihood')}
                  </span>
                </div>
                <p className="text-xs text-[#1C2B22] font-medium leading-relaxed mb-2">
                  {selectedSegment.disruption_prediction_text}
                </p>
                {selectedSegment.historical_incident_profile && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] font-mono">
                    <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                      <span className="text-[#3E5C63] block font-sans text-[9px]">{t('critical_failure_trigger')}</span>
                      <strong className="text-xs text-[#1C2B22]">{selectedSegment.historical_incident_profile.historical_threshold_mm_24h} mm / 24h</strong>
                    </div>
                    <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                      <span className="text-[#3E5C63] block font-sans text-[9px]">{t('past_recorded_blockages')}</span>
                      <strong className="text-xs text-[#1C2B22]">{selectedSegment.historical_incident_profile.recorded_past_blockages_count} events</strong>
                    </div>
                    <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                      <span className="text-[#3E5C63] block font-sans text-[9px]">{t('typical_clearance_time')}</span>
                      <strong className="text-xs text-[#1C2B22]">{selectedSegment.historical_incident_profile.typical_clearance_hours} hours</strong>
                    </div>
                    <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                      <span className="text-[#3E5C63] block font-sans text-[9px]">{t('threshold_saturation')}</span>
                      <strong className="text-xs text-[#A63A32]">{selectedSegment.historical_incident_profile.threshold_saturation_pct}%</strong>
                    </div>
                  </div>
                )}
                {selectedSegment.historical_incident_profile?.gsi_incidents?.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-[#3E5C63]/20">
                    <div className="text-[10px] font-sans font-bold text-[#9A3412] flex items-center gap-1 mb-1">
                      <Landmark className="w-3 h-3" />
                      <span>{t('verified_gsi_incidents')}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[10px]">
                      {selectedSegment.historical_incident_profile.gsi_incidents.map((inc, i) => (
                        <div key={i} className="bg-[#F1EDE2] p-1.5 rounded border border-[#9A3412]/30 flex flex-col justify-between">
                          <div className="font-bold text-[#1C2B22] truncate">{inc.name}</div>
                          <div className="text-[9px] text-[#3E5C63] font-mono">{inc.gsi_bhukosh_id} ({inc.year})</div>
                          <div className="text-[9px] text-[#9A3412] font-semibold">{inc.slide_type} • {inc.dist_km} km away</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Geotechnical Narrative & 12 Factors Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
              {/* XAI Narrative */}
              <div className="bg-[#E5DEC9]/50 border border-[#3E5C63]/25 p-3 rounded">
                <h4 className="font-heading font-bold text-xs text-[#1C2B22] mb-1">
                  {t('why_road_at_risk')}
                </h4>
                <p className="text-[11px] text-[#3E5C63] leading-relaxed">
                  Calculated at <strong>{Math.round(selectedSegment.dynamic_risk_score * 100)}%</strong> overall danger today based on live rainfall and hill slope steepness (Base slope weakness: {Math.round(selectedSegment.static_risk_score * 100)}%).
                </p>
                <div className="mt-2 space-y-1">
                  <span className="font-sans text-[11px] text-[#1C2B22] font-semibold block">{t('main_danger_triggers')}</span>
                  {selectedSegment.top_drivers?.map((driver, i) => (
                    <div key={i} className="text-[11px] text-[#A63A32] font-medium">
                      • {driver}
                    </div>
                  ))}
                </div>
              </div>

              {/* 12 Factors Telemetry */}
              <div className="lg:col-span-2 bg-[#E5DEC9]/50 border border-[#3E5C63]/25 p-3 rounded">
                <h4 className="font-heading font-bold text-xs text-[#1C2B22] mb-2 flex items-center justify-between">
                  <span>{t('ground_hillside_conditions')}</span>
                  <span className="font-sans text-[10px] text-[#3E5C63]">{t('live_terrain_analysis')}</span>
                </h4>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 text-center font-mono">
                  <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                    <span className="text-[9px] text-[#3E5C63] block font-sans">{t('hill_slope')}</span>
                    <strong className="text-xs text-[#1C2B22]">{selectedSegment.factors.slope_deg}° {t('steep')}</strong>
                  </div>
                  <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                    <span className="text-[9px] text-[#3E5C63] block font-sans">{t('slope_facing')}</span>
                    <strong className="text-xs text-[#1C2B22]">{selectedSegment.factors.aspect_deg}°</strong>
                  </div>
                  <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                    <span className="text-[9px] text-[#3E5C63] block font-sans">{t('fault_line')}</span>
                    <strong className="text-xs text-[#1C2B22]">{selectedSegment.factors.dist_to_fault_m}m away</strong>
                  </div>
                  <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                    <span className="text-[9px] text-[#3E5C63] block font-sans">{t('river_stream')}</span>
                    <strong className="text-xs text-[#1C2B22]">{selectedSegment.factors.dist_to_drainage_m}m away</strong>
                  </div>
                  <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                    <span className="text-[9px] text-[#3E5C63] block font-sans">{t('tree_cover')}</span>
                    <strong className="text-xs text-[#1C2B22]">{selectedSegment.factors.ndvi > 0.6 ? t('dense') : t('sparse')} ({selectedSegment.factors.ndvi})</strong>
                  </div>
                  <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                    <span className="text-[9px] text-[#3E5C63] block font-sans">{t('recent_rain')}</span>
                    <strong className="text-xs text-[#1C2B22]">{selectedSegment.factors.base_rainfall_mm}mm</strong>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-[#3E5C63]/20 text-[11px] text-[#3E5C63]">
                  <strong>{t('road_importance')} </strong>{selectedSegment.strategic_importance}
                </div>
              </div>
            </div>

            {/* Pedological Soil Matrix & Geotechnical Parameters (ISRIC SoilGrids & ICAR-NBSS&LUP) */}
            {(selectedSegment.soil_profile || selectedSegment.factors?.soil_profile) && (() => {
              const sp = selectedSegment.soil_profile || selectedSegment.factors?.soil_profile;
              return (
                <div className="mt-3 bg-[#E5DEC9]/50 border border-[#3E5C63]/25 p-3 rounded">
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                    <div className="text-xs font-heading font-bold text-[#1C2B22] flex items-center gap-1.5">
                      <Mountain className="w-3.5 h-3.5 text-[#3E5C63]" />
                      <span>{t('pedological_soil_matrix')}</span>
                    </div>
                    <span className="text-[9px] font-mono text-[#059669] bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#86EFAC] font-semibold">
                      ISRIC SoilGrids 250m &amp; ICAR-NBSS&amp;LUP Geodatabase
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center font-mono text-[10px]">
                    <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                      <span className="text-[9px] text-[#3E5C63] block font-sans">{t('texture_class')}</span>
                      <strong className="text-xs text-[#1C2B22] truncate block" title={sp.texture_name}>{sp.texture_name}</strong>
                      <span className="text-[8px] text-[#3E5C63]">USDA: {sp.usda_class}</span>
                    </div>
                    <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                      <span className="text-[9px] text-[#3E5C63] block font-sans">{t('clay_sand')}</span>
                      <strong className="text-xs text-[#1C2B22]">{sp.clay_pct}% / {sp.sand_pct}%</strong>
                      <span className="text-[8px] text-[#3E5C63]">{sp.silt_pct}% Silt</span>
                    </div>
                    <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                      <span className="text-[9px] text-[#3E5C63] block font-sans">{t('regolith_depth')}</span>
                      <strong className="text-xs text-[#1C2B22]">{sp.soil_depth_cm} cm</strong>
                      <span className="text-[8px] text-[#3E5C63]">Weathered layer</span>
                    </div>
                    <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                      <span className="text-[9px] text-[#3E5C63] block font-sans">{t('bulk_density')}</span>
                      <strong className="text-xs text-[#1C2B22]">{sp.bulk_density_g_cm3} g/cm³</strong>
                      <span className="text-[8px] text-[#3E5C63]">In-situ matrix</span>
                    </div>
                    <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                      <span className="text-[9px] text-[#3E5C63] block font-sans">{t('soil_cohesion')}</span>
                      <strong className="text-xs text-[#1C2B22]">{sp.cohesion_kpa} kPa</strong>
                      <span className="text-[8px] text-[#3E5C63]">Shear resistance</span>
                    </div>
                    <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                      <span className="text-[9px] text-[#3E5C63] block font-sans">{t('friction_angle')}</span>
                      <strong className="text-xs text-[#1C2B22]">{sp.internal_friction_angle_deg}°</strong>
                      <span className="text-[8px] text-[#3E5C63]">Critical state</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
