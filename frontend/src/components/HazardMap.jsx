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

// Custom Ground Incident Marker (Field Pin)
const groundReportIcon = L.divIcon({
  html: `<div class="relative flex items-center justify-center">
          <div class="w-3.5 h-3.5 rounded-sm bg-[#A63A32] border border-[#F1EDE2] shadow-md flex items-center justify-center">
            <span class="w-1.5 h-1.5 bg-[#F1EDE2] rounded-full"></span>
          </div>
        </div>`,
  className: 'field-hazard-marker',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// Custom Cartographic Village Marker
function createVillageIcon(v) {
  const isCutOff = v.is_cut_off;
  const color = isCutOff ? TOKENS.riskRed : (v.meets_rai_standard ? TOKENS.riskSafe : TOKENS.riskAmber);
  const size = Math.max(16, Math.min(26, Math.round(Math.sqrt(v.population) * 0.32)));
  
  return L.divIcon({
    html: `<div class="relative group cursor-pointer flex items-center justify-center" style="width:${size}px; height:${size}px;">
            <div class="rounded-full border border-[#F1EDE2] flex items-center justify-center shadow-sm font-mono text-[9px] font-bold text-[#F1EDE2]" style="width:${size}px; height:${size}px; background-color:${color};">
            </div>
          </div>`,
    className: 'carto-village-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
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
  const [hoveredVillage, setHoveredVillage] = useState(null);

  const segments = segmentsData?.segments || [];
  const villages = accessibilityData?.villages || [];
  const reports = hazardReports || [];

  const filteredSegments = filterTier === 'ALL' 
    ? segments 
    : segments.filter(s => s.dynamic_alert_tier === filterTier);

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
                    Alert Level: <strong style={{ color: strokeColor }}>{seg.dynamic_alert_tier}</strong> (Risk Index: {seg.dynamic_risk_score})
                  </div>
                  {seg.is_blocked && (
                    <div className="text-[#A63A32] font-semibold text-[11px] mt-0.5">Confirmed Road Cut / Impassable</div>
                  )}
                  <div className="text-[10px] text-[#3E5C63] opacity-80 mt-1">Click to open geotechnical telemetry sheet</div>
                </div>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* Villages as Cartographic Population Nodes */}
        {villages.map((vil) => (
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
                <div className="text-[11px] text-[#3E5C63]">Population: {vil.population.toLocaleString()}</div>
                <div className="text-[11px] font-mono">
                  Hospital Travel: <strong>{vil.effective_travel_hospital_min}m</strong> (Base: {vil.base_travel_hospital_min}m)
                </div>
                <div className="text-[10px] text-[#3E5C63] mt-0.5 font-mono">
                  Isochrone status: {vil.cutoff_severity}
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
          <span>Click anywhere along a highway to place an on-ground hazard report</span>
          <button 
            onClick={() => setIsPinDropping(false)}
            className="text-[#3E5C63] hover:text-[#1C2B22] p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Map Filter Neatline Panel (Top Left) */}
      <div className="absolute top-4 left-4 z-10 bg-[#F1EDE2]/92 backdrop-blur-md border border-[#3E5C63]/30 px-3 py-2 rounded shadow-sm text-xs flex items-center gap-2">
        <span className="text-[#3E5C63] font-medium text-[11px]">Filter Risk Tier:</span>
        {['ALL', 'Severe', 'Very High', 'High', 'Moderate', 'Low'].map((tier) => (
          <button
            key={tier}
            onClick={() => setFilterTier(tier)}
            className={`px-2 py-0.5 text-[11px] font-mono rounded transition ${
              filterTier === tier
                ? 'bg-[#1C2B22] text-[#F1EDE2] font-semibold'
                : 'text-[#1C2B22] hover:bg-[#3E5C63]/10'
            }`}
          >
            {tier}
          </button>
        ))}
      </div>

      {/* Integrated Cartographic Neatline Legend (Bottom Left) */}
      <div className="absolute bottom-6 left-4 z-10 bg-[#F1EDE2]/94 backdrop-blur-md border border-[#3E5C63]/35 p-3 rounded shadow-md max-w-xs text-[#1C2B22]">
        <div className="font-heading font-bold text-xs mb-1.5 pb-1 border-b border-[#3E5C63]/25 flex items-center justify-between">
          <span>Topographic Risk & Isochrone Key</span>
          <span className="text-[10px] font-mono text-[#3E5C63]">LHASA Matrix</span>
        </div>
        
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-4 h-1.5 rounded-sm bg-[#A63A32]"></span>
              <strong className="text-[#A63A32]">Severe / Blocked</strong>
            </span>
            <span className="font-mono text-[10px] text-[#3E5C63]">0.82 – 1.00</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-1 rounded-sm bg-[#C77A2E]"></span>
              <span className="text-[#C77A2E] font-medium">Moderate to High</span>
            </span>
            <span className="font-mono text-[10px] text-[#3E5C63]">0.28 – 0.82</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-3 h-0.5 rounded-sm bg-[#5C7A4E]"></span>
              <span className="text-[#5C7A4E] font-medium">Stable All-Weather</span>
            </span>
            <span className="font-mono text-[10px] text-[#3E5C63]">0.00 – 0.28</span>
          </div>
        </div>

        <div className="mt-2 pt-1.5 border-t border-[#3E5C63]/20 flex items-center justify-between text-[10px] text-[#3E5C63] font-mono">
          <span>O Village nodes: Population sized</span>
          <span>Isochrones: 30m / 60m</span>
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
                    {selectedSegment.dynamic_alert_tier} ALERT
                  </span>
                  <span className="font-mono text-xs text-[#3E5C63]">{selectedSegment.segment_id}</span>
                  <span className="text-xs text-[#3E5C63] font-medium">{selectedSegment.highway} • {selectedSegment.state} • {selectedSegment.length_km} km</span>
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
                <strong className="font-heading">Active Highway Obstruction: </strong>
                {selectedSegment.blockage_reason || 'Debris flow across carriageway.'}
              </div>
            )}

            {/* Geotechnical Narrative & 12 Factors Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
              {/* XAI Narrative */}
              <div className="bg-[#E5DEC9]/50 border border-[#3E5C63]/25 p-3 rounded">
                <h4 className="font-heading font-bold text-xs text-[#1C2B22] mb-1">
                  Explainable AI Susceptibility Diagnostic
                </h4>
                <p className="text-[11px] text-[#3E5C63] leading-relaxed">
                  Scored at <strong>{selectedSegment.dynamic_risk_score}</strong> dynamic hazard level (Static RF Susceptibility: {selectedSegment.static_risk_score}).
                </p>
                <div className="mt-2 space-y-1">
                  <span className="font-mono text-[10px] text-[#1C2B22] font-semibold block uppercase">Dominant Contributing Factors:</span>
                  {selectedSegment.top_drivers?.map((driver, i) => (
                    <div key={i} className="text-[11px] text-[#A63A32] font-medium">
                      — {driver}
                    </div>
                  ))}
                </div>
              </div>

              {/* 12 Factors Telemetry */}
              <div className="lg:col-span-2 bg-[#E5DEC9]/50 border border-[#3E5C63]/25 p-3 rounded">
                <h4 className="font-heading font-bold text-xs text-[#1C2B22] mb-2 flex items-center justify-between">
                  <span>Himalayan Geotechnical Matrix (12 Conditioning Factors)</span>
                  <span className="font-mono text-[10px] text-[#3E5C63]">Dibang Valley Study Replica</span>
                </h4>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 text-center font-mono">
                  <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                    <span className="text-[9px] text-[#3E5C63] block">Slope</span>
                    <strong className="text-xs text-[#1C2B22]">{selectedSegment.factors.slope_deg}°</strong>
                  </div>
                  <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                    <span className="text-[9px] text-[#3E5C63] block">Aspect</span>
                    <strong className="text-xs text-[#1C2B22]">{selectedSegment.factors.aspect_deg}°</strong>
                  </div>
                  <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                    <span className="text-[9px] text-[#3E5C63] block">Fault Dist</span>
                    <strong className="text-xs text-[#1C2B22]">{selectedSegment.factors.dist_to_fault_m}m</strong>
                  </div>
                  <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                    <span className="text-[9px] text-[#3E5C63] block">Drainage</span>
                    <strong className="text-xs text-[#1C2B22]">{selectedSegment.factors.dist_to_drainage_m}m</strong>
                  </div>
                  <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                    <span className="text-[9px] text-[#3E5C63] block">NDVI Veg</span>
                    <strong className="text-xs text-[#1C2B22]">{selectedSegment.factors.ndvi}</strong>
                  </div>
                  <div className="bg-[#F1EDE2] p-1.5 rounded border border-[#3E5C63]/20">
                    <span className="text-[9px] text-[#3E5C63] block">Rain Base</span>
                    <strong className="text-xs text-[#1C2B22]">{selectedSegment.factors.base_rainfall_mm}mm</strong>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-[#3E5C63]/20 text-[11px] text-[#3E5C63]">
                  <strong>Strategic Role: </strong>{selectedSegment.strategic_importance}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
