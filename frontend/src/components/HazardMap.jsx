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
  Activity
} from 'lucide-react';

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
  onPinDropSelect
}) {
  const [filterTier, setFilterTier] = useState('ALL');
  const [villageFilter, setVillageFilter] = useState('ALL'); // 'ALL' | 'CUTOFF' | 'NONE'
  const [hoveredVillage, setHoveredVillage] = useState(null);

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

  return (
    <div className="relative w-full h-[calc(100vh-100px)] bg-[#1C2B22] overflow-hidden">
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
        {hoveredVillage && (
          <>
            {/* 30-min Access Isochrone Ring */}
            <Circle
              center={[hoveredVillage.lat, hoveredVillage.lng]}
              radius={14000}
              pathOptions={{
                color: TOKENS.slopeSlate,
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
                color: TOKENS.slopeSlate,
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
      </MapContainer>

      {/* Floating Header Instruction when Pin-Drop Mode is Active */}
      {isPinDropping && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-[#F1EDE2] text-[#1C2B22] border border-[#3E5C63] px-4 py-2 rounded shadow-lg flex items-center gap-3 text-xs font-heading font-bold animate-pulse">
          <span>Click anywhere on a highway to report a landslide or blocked section</span>
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
          <span className="text-[#3E5C63] font-semibold text-[11px]">Roads:</span>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'Severe', label: 'Blocked' },
            { id: 'Very High', label: 'High Danger' },
            { id: 'High', label: 'Warning' },
            { id: 'Moderate', label: 'Watch' },
            { id: 'Low', label: 'Safe' }
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
          <span className="text-[#3E5C63] font-semibold text-[11px]">Villages:</span>
          {[
            { id: 'ALL', label: 'All Villages' },
            { id: 'CUTOFF', label: 'Cut-Off Only' },
            { id: 'NONE', label: 'Hide' }
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
      </div>

      {/* Integrated Cartographic Neatline Legend (Bottom Left) */}
      <div className="absolute bottom-6 left-4 z-10 bg-[#F1EDE2]/95 backdrop-blur-md border border-[#3E5C63]/35 p-3 rounded shadow-md max-w-xs text-[#1C2B22]">
        <div className="font-heading font-bold text-xs mb-1.5 pb-1 border-b border-[#3E5C63]/25 flex items-center justify-between">
          <span>Road Safety &amp; Access Guide</span>
          <span className="text-[10px] font-mono text-[#3E5C63]">Live Status</span>
        </div>
        
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-4 h-1.5 rounded-sm bg-[#A63A32]"></span>
              <strong className="text-[#A63A32]">Blocked / Extreme Danger</strong>
            </span>
            <span className="font-mono text-[10px] text-[#3E5C63]">Do not travel</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-1 rounded-sm bg-[#C77A2E]"></span>
              <span className="text-[#C77A2E] font-medium">Warning / Caution</span>
            </span>
            <span className="font-mono text-[10px] text-[#3E5C63]">Risk of slides</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-3 h-0.5 rounded-sm bg-[#5C7A4E]"></span>
              <span className="text-[#5C7A4E] font-medium">Clear / All-Weather Open</span>
            </span>
            <span className="font-mono text-[10px] text-[#3E5C63]">Safe to drive</span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-[#3E5C63]/20 space-y-1 text-[10px] text-[#3E5C63] font-sans">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white border-2 border-[#10B981] inline-block"></span>
            <span>Connected Village (Normal)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1 rounded text-[9px] bg-[#991B1B] text-white font-bold inline-block">CUT OFF</span>
            <span>Road Blocked to Village</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[#EF4444] text-white text-[9px] flex items-center justify-center font-bold">⚠</span>
            <span>Reported Road Obstruction</span>
          </div>
        </div>
      </div>

      {/* Slide-Up Bottom Sheet: Segment Geotechnical Factor Telemetry (Mobile/Field Paradigm) */}
      {selectedSegment && (
        <div className="absolute bottom-0 left-0 right-0 z-20 max-h-[52vh] bg-[#F1EDE2] text-[#1C2B22] border-t-2 border-[#3E5C63] shadow-2xl p-5 overflow-y-auto animate-slide-up">
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
                <strong className="font-heading">Road Is Blocked: </strong>
                {selectedSegment.blockage_reason || 'Mudslide and falling rocks across both lanes.'}
              </div>
            )}

            {/* Geotechnical Narrative & 12 Factors Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
              {/* XAI Narrative */}
              <div className="bg-[#E5DEC9]/50 border border-[#3E5C63]/25 p-3 rounded">
                <h4 className="font-heading font-bold text-xs text-[#1C2B22] mb-1">
                  Why is this road at risk of landslides?
                </h4>
                <p className="text-[11px] text-[#3E5C63] leading-relaxed">
                  Calculated at <strong>{Math.round(selectedSegment.dynamic_risk_score * 100)}%</strong> overall danger today based on live rainfall and hill slope steepness (Base slope weakness: {Math.round(selectedSegment.static_risk_score * 100)}%).
                </p>
                <div className="mt-2 space-y-1">
                  <span className="font-sans text-[11px] text-[#1C2B22] font-semibold block">Main Danger Triggers:</span>
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
                  <span>Ground &amp; Hillside Conditions (Terrain Factors)</span>
                  <span className="font-sans text-[10px] text-[#3E5C63]">Live Terrain Analysis</span>
                </h4>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 text-center font-mono">
                  <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                    <span className="text-[9px] text-[#3E5C63] block font-sans">Hill Slope</span>
                    <strong className="text-xs text-[#1C2B22]">{selectedSegment.factors.slope_deg}° steep</strong>
                  </div>
                  <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                    <span className="text-[9px] text-[#3E5C63] block font-sans">Slope Facing</span>
                    <strong className="text-xs text-[#1C2B22]">{selectedSegment.factors.aspect_deg}°</strong>
                  </div>
                  <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                    <span className="text-[9px] text-[#3E5C63] block font-sans">Fault Line</span>
                    <strong className="text-xs text-[#1C2B22]">{selectedSegment.factors.dist_to_fault_m}m away</strong>
                  </div>
                  <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                    <span className="text-[9px] text-[#3E5C63] block font-sans">River / Stream</span>
                    <strong className="text-xs text-[#1C2B22]">{selectedSegment.factors.dist_to_drainage_m}m away</strong>
                  </div>
                  <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                    <span className="text-[9px] text-[#3E5C63] block font-sans">Tree Cover</span>
                    <strong className="text-xs text-[#1C2B22]">{selectedSegment.factors.ndvi > 0.6 ? 'Dense' : 'Sparse'} ({selectedSegment.factors.ndvi})</strong>
                  </div>
                  <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                    <span className="text-[9px] text-[#3E5C63] block font-sans">Recent Rain</span>
                    <strong className="text-xs text-[#1C2B22]">{selectedSegment.factors.base_rainfall_mm}mm</strong>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-[#3E5C63]/20 text-[11px] text-[#3E5C63]">
                  <strong>Road Importance: </strong>{selectedSegment.strategic_importance}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
