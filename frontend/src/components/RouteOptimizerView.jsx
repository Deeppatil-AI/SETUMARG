import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Truck, 
  Car, 
  Bike, 
  AlertTriangle, 
  ShieldAlert,
  Navigation
} from 'lucide-react';
import { getTranslation } from '../i18n';

function MapBoundsHandler({ naiveCoords, safeCoords }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const allCoords = [...(naiveCoords || []), ...(safeCoords || [])];
    if (allCoords.length > 0) {
      try {
        const bounds = L.latLngBounds(allCoords);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [35, 35], maxZoom: 10 });
        }
      } catch (e) {
        console.error('Error fitting bounds:', e);
      }
    }
  }, [map, naiveCoords, safeCoords]);
  return null;
}

const startIcon = L.divIcon({
  html: `<div class="w-6 h-6 rounded-full bg-[#1C2B22] border-2 border-[#F1EDE2] flex items-center justify-center text-xs font-mono font-bold text-[#F1EDE2] shadow-md">A</div>`,
  className: 'route-marker-start',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const endIcon = L.divIcon({
  html: `<div class="w-6 h-6 rounded-full bg-[#5C7A4E] border-2 border-[#F1EDE2] flex items-center justify-center text-xs font-mono font-bold text-[#F1EDE2] shadow-md">B</div>`,
  className: 'route-marker-end',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const QUICK_CORRIDORS = [
  { origin: 'Guwahati', destination: 'Silchar', label: 'Guwahati ➔ Silchar', highway: 'NH-6', badge: 'Sonapur Canyon' },
  { origin: 'Siliguri', destination: 'Gangtok', label: 'Siliguri ➔ Gangtok', highway: 'NH-10', badge: 'Teesta Canyon' },
  { origin: 'Guwahati', destination: 'Kohima', label: 'Guwahati ➔ Kohima', highway: 'NH-29', badge: 'Dimapur Ghats' },
  { origin: 'Dimapur', destination: 'Imphal', label: 'Dimapur ➔ Imphal', highway: 'NH-2', badge: 'Phesama Slide' },
  { origin: 'Imphal', destination: 'Moreh', label: 'Imphal ➔ Moreh', highway: 'NH-102', badge: 'Tengnoupal Crest' }
];

export default function RouteOptimizerView({ onOptimizeRoute, currentLanguage = 'en', nowcastData }) {
  const t = (k) => getTranslation(currentLanguage, k);
  const [origin, setOrigin] = useState('Guwahati');
  const [destination, setDestination] = useState('Silchar');
  const [vehicleType, setVehicleType] = useState('heavy_truck');
  const [routeResult, setRouteResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRerouteNotification, setAutoRerouteNotification] = useState(null);
  const [mapBaseLayer, setMapBaseLayer] = useState('satellite'); // 'satellite' | 'topo'

  const fetchRoute = async () => {
    setIsLoading(true);
    try {
      const data = await onOptimizeRoute(origin, destination, vehicleType);
      setRouteResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoute();
  }, [origin, destination, vehicleType]);

  // SECTION 2: Automatic rerouting when a landslide or severe hazard occurs mid-route
  const lastCheckedKeyRef = useRef(null);
  useEffect(() => {
    if (!nowcastData || !routeResult) return;
    const currentKey = `${nowcastData.current_scenario}_${nowcastData.current_multiplier}_${nowcastData.last_recompute_time}_${nowcastData.blocked_segments_count}`;
    if (lastCheckedKeyRef.current === currentKey) return;
    lastCheckedKeyRef.current = currentKey;

    const segments = nowcastData.segments || [];
    const naiveSegmentIds = routeResult.naive_route?.via_segments || [];

    // Find any segment along the open corridor that has escalated to High, Very High, Severe or Blocked
    const compromised = segments.filter(s => 
      naiveSegmentIds.includes(s.id) && 
      (s.is_blocked || ['High', 'Very High', 'Severe'].includes(s.dynamic_alert_tier))
    );

    if (compromised.length > 0) {
      const worst = compromised.find(s => s.is_blocked || s.dynamic_alert_tier === 'Severe') || compromised[0];
      setAutoRerouteNotification({
        segmentName: worst.name,
        tier: worst.is_blocked ? 'Blocked' : worst.dynamic_alert_tier,
        time: new Date().toLocaleTimeString()
      });
      // Automatically re-optimize route in the background
      fetchRoute();
    }
  }, [nowcastData, routeResult]);

  const naive = routeResult?.naive_route;
  const safe = routeResult?.safe_route;
  const comparison = routeResult?.summary_comparison;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 text-[#1C2B22] space-y-6">
      {/* Auto-Reroute Escalation Alert Banner */}
      {autoRerouteNotification && (
        <div className="bg-[#FEF2F2] border-2 border-[#DC2626] p-4 rounded shadow-md flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded bg-[#DC2626] text-white shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-heading font-bold text-sm text-[#991B1B]">
                  {t('auto_reroute_banner_title')}
                </span>
                <span className="bg-[#DC2626] text-white px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase">
                  {autoRerouteNotification.tier} RISK DETECTED
                </span>
                <span className="text-[10px] font-mono text-[#991B1B]">
                  {autoRerouteNotification.time}
                </span>
              </div>
              <p className="text-[#7F1D1D] font-medium leading-relaxed">
                {t('auto_reroute_banner_desc')}
              </p>
              <p className="text-[#991B1B] font-mono text-[11px] pt-0.5">
                <strong>Escalated Segment:</strong> {autoRerouteNotification.segmentName} &bull; <strong>Status:</strong> Route automatically refreshed to avoid stranding.
              </p>
            </div>
          </div>
          <button
            onClick={() => setAutoRerouteNotification(null)}
            className="text-[#991B1B] hover:text-[#7F1D1D] p-1 font-bold text-sm font-mono shrink-0"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
      {/* Top Banner */}
      <div className="bg-[#F1EDE2] p-5 rounded border border-[#3E5C63]/30 shadow-sm flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="font-mono text-xs text-[#3E5C63] uppercase tracking-wider block mb-1">
            {t('safe_mountain_route_finder')}
          </span>
          <h2 className="font-heading font-bold text-xl text-[#1C2B22]">
            {t('find_safe_mountain_routes')}
          </h2>
          <p className="text-xs text-[#3E5C63] max-w-3xl mt-1 leading-relaxed">
            {t('route_optimizer_intro')}
          </p>
        </div>

        {/* Vehicle Selector */}
        <div className="flex items-center gap-1.5 bg-[#E5DEC9] p-1 rounded border border-[#3E5C63]/20">
          {[
            { id: 'heavy_truck', label: t('truck_bus'), icon: Truck },
            { id: 'light_vehicle', label: t('car_ambulance'), icon: Car },
            { id: 'two_wheeler', label: t('bike_scooter'), icon: Bike }
          ].map((v) => {
            const Icon = v.icon;
            const isSelected = vehicleType === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setVehicleType(v.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition ${
                  isSelected 
                    ? 'bg-[#1C2B22] text-[#F1EDE2] font-semibold shadow-sm' 
                    : 'text-[#1C2B22] hover:bg-[#3E5C63]/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Corridors Selection Bar */}
      <div className="bg-[#E5DEC9] px-4 py-2.5 rounded border border-[#3E5C63]/30 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-[#1C2B22]" />
          <span className="text-[11px] font-mono font-bold text-[#1C2B22] uppercase tracking-wider">{t('quick_corridors')}:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {QUICK_CORRIDORS.map((c) => {
            const isCurrent = origin === c.origin && destination === c.destination;
            return (
              <button
                key={`${c.origin}-${c.destination}`}
                onClick={() => {
                  setOrigin(c.origin);
                  setDestination(c.destination);
                }}
                className={`px-2.5 py-1 rounded text-xs font-sans transition flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-[#1C2B22] text-[#F1EDE2] font-bold shadow-xs'
                    : 'bg-[#F1EDE2] text-[#1C2B22] hover:bg-[#3E5C63]/15 border border-[#3E5C63]/20'
                }`}
              >
                <span>{c.label}</span>
                <span className={`text-[9px] px-1 rounded font-mono ${isCurrent ? 'bg-[#5C7A4E] text-white' : 'bg-[#3E5C63]/15 text-[#3E5C63]'}`}>
                  {c.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Origin/Destination Selector */}
      <div className="bg-[#F1EDE2] p-4 rounded border border-[#3E5C63]/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <label className="text-[10px] text-[#3E5C63] font-sans font-semibold block mb-1">{t('starting_city')}</label>
            <select
              value={origin}
              onChange={(e) => {
                const nextOrigin = e.target.value;
                setOrigin(nextOrigin);
                if (nextOrigin === 'Siliguri') setDestination('Gangtok');
                else if (nextOrigin === 'Dimapur') setDestination('Imphal');
                else if (nextOrigin === 'Imphal') setDestination('Moreh');
                else setDestination('Silchar');
              }}
              className="bg-[#E5DEC9] border border-[#3E5C63]/30 rounded px-3 py-1.5 text-xs font-heading font-bold text-[#1C2B22] outline-none"
            >
              <option value="Guwahati">Guwahati (Gateway City)</option>
              <option value="Siliguri">Siliguri (North Bengal Gateway)</option>
              <option value="Dimapur">Dimapur (Nagaland Gateway)</option>
              <option value="Imphal">Imphal (Manipur Valley)</option>
            </select>
          </div>

          <span className="text-[#3E5C63] pt-4 font-mono font-bold">to</span>

          <div>
            <label className="text-[10px] text-[#3E5C63] font-sans font-semibold block mb-1">{t('destination_city')}</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="bg-[#E5DEC9] border border-[#3E5C63]/30 rounded px-3 py-1.5 text-xs font-heading font-bold text-[#1C2B22] outline-none"
            >
              {origin === 'Guwahati' && (
                <>
                  <option value="Silchar">Silchar (Barak Valley / NH-6)</option>
                  <option value="Kohima">Kohima (Nagaland / NH-29)</option>
                </>
              )}
              {origin === 'Siliguri' && <option value="Gangtok">Gangtok (Sikkim / NH-10)</option>}
              {origin === 'Dimapur' && <option value="Imphal">Imphal (Manipur / NH-2)</option>}
              {origin === 'Imphal' && <option value="Moreh">Moreh (Border Trade / NH-102)</option>}
            </select>
          </div>
        </div>

        {/* Live Weather Telemetry along Corridor */}
        {routeResult?.corridor_weather && (
          <div className="flex items-center gap-2 bg-[#E5DEC9] px-3 py-2 rounded border border-[#3E5C63]/25 text-[11px] font-sans">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#3E5C63] font-semibold">{t('corridor_weather_origin')}:</span>
              <span className="font-bold text-[#1C2B22]">{routeResult.corridor_weather.origin.city}</span>
              <span className="bg-[#1C2B22] text-[#F1EDE2] px-1.5 py-0.5 rounded text-[10px] font-mono">
                🌧️ {routeResult.corridor_weather.origin.current_rain_mm} mm/h
              </span>
            </div>
            <span className="text-[#3E5C63] font-mono">➔</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#3E5C63] font-semibold">{t('corridor_weather_destination')}:</span>
              <span className="font-bold text-[#1C2B22]">{routeResult.corridor_weather.destination.city}</span>
              <span className="bg-[#1C2B22] text-[#F1EDE2] px-1.5 py-0.5 rounded text-[10px] font-mono">
                🌧️ {routeResult.corridor_weather.destination.current_rain_mm} mm/h
              </span>
            </div>
          </div>
        )}

        {/* AI Advisory Callout */}
        <div className="bg-[#E5DEC9] p-2.5 rounded border border-[#3E5C63]/25 max-w-xl text-xs">
          <div className="flex items-center justify-between mb-1">
            <strong className="font-heading font-bold text-[#1C2B22]">{t('safety_advice')}</strong>
            {routeResult?.is_live_weather_mode && (
              <span className="text-[10px] font-mono text-[#6EE7B7] bg-[#142319] px-2 py-0.5 rounded flex items-center gap-1 font-semibold border border-[#34D399]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse"></span>
                {t('live_open_meteo_fused')}
              </span>
            )}
          </div>
          <span className="text-[#3E5C63] leading-relaxed">
            {routeResult?.avoidance_rationale || 'Finding the safest travel route...'}
          </span>
        </div>
      </div>

      {/* Loading Spinner & Empty State */}
      {isLoading && !routeResult && (
        <div className="bg-[#F1EDE2] border border-[#3E5C63]/30 rounded p-12 text-center flex flex-col items-center justify-center">
          <div className="w-9 h-9 border-3 border-[#5C7A4E] border-t-transparent rounded-full animate-spin mb-3"></div>
          <h3 className="font-heading font-bold text-sm text-[#1C2B22]">Computing Safe Mountain Route...</h3>
          <p className="text-xs text-[#3E5C63] mt-1">Analyzing Himalayan terrain, live weather warnings, and safe detours.</p>
        </div>
      )}
      {!isLoading && !routeResult && (
        <div className="bg-[#F1EDE2] border border-[#3E5C63]/30 rounded p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-[#D97706] mx-auto mb-2" />
          <h3 className="font-heading font-bold text-sm text-[#1C2B22]">No Route Available</h3>
          <p className="text-xs text-[#3E5C63] mt-1">Unable to calculate routes for this origin and destination.</p>
          <button onClick={fetchRoute} className="mt-3 bg-[#1C2B22] text-[#F1EDE2] px-4 py-1.5 rounded font-bold text-xs">Retry Calculation</button>
        </div>
      )}

      {/* Side-by-Side Comparison Cards */}
      {routeResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Naive Shortest Route */}
          <div className="bg-[#F1EDE2] border-2 border-[#A63A32] rounded p-5 shadow-sm relative">
            <div className="flex items-center justify-between border-b border-[#3E5C63]/20 pb-2 mb-3">
              <span className="font-mono text-xs font-bold text-[#A63A32] uppercase">
                {t('shortest_route_danger')}
              </span>
              <span className="font-sans text-xs text-[#3E5C63]">{t('standard_gps')}</span>
            </div>

            <h3 className="font-heading font-bold text-base text-[#1C2B22] mb-1">
              {naive?.name}
            </h3>
            <p className="text-[11px] text-[#3E5C63] mb-4">
              {t('shortest_route_desc')}
            </p>

            <div className="grid grid-cols-3 gap-3 font-mono border-t border-[#3E5C63]/20 pt-3">
              <div>
                <span className="text-[10px] text-[#3E5C63] block font-sans">{t('distance')}</span>
                <strong className="font-heading text-xl font-bold text-[#1C2B22]">{naive?.distance_km} km</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#3E5C63] block font-sans">{t('travel_time')}</span>
                <strong className="font-heading text-xl font-bold text-[#A63A32]">{naive?.duration_hrs} h</strong>
                {naive?.delay_penalty_hrs > 0 && (
                  <span className="text-[10px] text-[#A63A32] block">
                    +{naive.delay_penalty_hrs}h total delay
                  </span>
                )}
              </div>
              <div>
                <span className="text-[10px] text-[#3E5C63] block font-sans">{t('danger_level')}</span>
                <strong className="font-heading text-xl font-bold text-[#A63A32]">{comparison?.naive_risk_index}%</strong>
              </div>
            </div>

            {/* Labeled Disruption Factor Breakdown (PS26002 point b) */}
            {naive?.delay_breakdown && (
              <div className="mt-3 p-2.5 bg-[#E5DEC9]/60 border border-[#3E5C63]/25 rounded text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#3E5C63]">{t('disruption_breakdown')}</span>
                  <span className="font-bold text-[#A63A32] uppercase">
                    {t('primary_cause')}: {naive.delay_breakdown.primary_cause?.replace('_', ' ')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1 border-t border-[#3E5C63]/15">
                  <div className="bg-[#F1EDE2] p-1.5 rounded">
                    <span className="text-[#3E5C63] block">⛰️ {t('landslide_hazard')}</span>
                    <strong className="text-[#A63A32] text-xs">+{naive.delay_breakdown.hazard_delay_hrs}h</strong>
                  </div>
                  <div className="bg-[#F1EDE2] p-1.5 rounded">
                    <span className="text-[#3E5C63] block">🚦 {t('traffic_congestion')}</span>
                    <strong className="text-[#D97706] text-xs">+{naive.delay_breakdown.congestion_delay_hrs}h</strong>
                  </div>
                </div>
              </div>
            )}

            {naive?.disruption_likelihood_pct !== undefined && (
              <div className="mt-3 p-2 bg-[#A63A32]/10 border border-[#A63A32]/30 rounded text-xs flex items-center justify-between">
                <span className="text-[#A63A32] font-semibold">⚡ {t('impending_disruption_risk')}</span>
                <strong className="text-[#A63A32] font-mono text-xs">{naive.disruption_likelihood_pct}%</strong>
              </div>
            )}

            {naive?.has_active_blockage && (
              <div className="mt-4 p-2.5 bg-[#A63A32]/10 border border-[#A63A32]/30 rounded text-xs text-[#A63A32]">
                <strong className="block font-heading">{t('road_blocks_on_route')}</strong>
                <ul className="list-disc list-inside font-mono text-[11px] mt-0.5">
                  {naive.compromised_segments.map((seg, idx) => (
                    <li key={idx}>{seg}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Setumarg AI Safe Route */}
          <div className="bg-[#F1EDE2] border-2 border-[#5C7A4E] rounded p-5 shadow-sm relative">
            <div className="flex items-center justify-between border-b border-[#3E5C63]/20 pb-2 mb-3">
              <span className="font-mono text-xs font-bold text-[#5C7A4E] uppercase">
                {t('setumarg_safe_detour')}
              </span>
              <span className="font-sans text-xs text-[#5C7A4E] font-bold">{t('recommended')}</span>
            </div>

            <h3 className="font-heading font-bold text-base text-[#1C2B22] mb-1">
              {safe?.name}
            </h3>
            <p className="text-[11px] text-[#3E5C63] mb-4">
              {t('safe_detour_desc')}
            </p>

            <div className="grid grid-cols-3 gap-3 font-mono border-t border-[#3E5C63]/20 pt-3">
              <div>
                <span className="text-[10px] text-[#3E5C63] block font-sans">{t('distance')}</span>
                <strong className="font-heading text-xl font-bold text-[#1C2B22]">{safe?.distance_km} km</strong>
                <span className="text-[10px] text-[#C77A2E] block font-sans">+{comparison?.extra_distance_km} km {t('extra_detour')}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#3E5C63] block font-sans">{t('travel_time')}</span>
                <strong className="font-heading text-xl font-bold text-[#5C7A4E]">{safe?.duration_hrs} h</strong>
                <span className="text-[10px] text-[#5C7A4E] block font-sans">{t('saves_waiting')}{comparison?.hours_saved_against_stranding}{t('hours_waiting')}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#3E5C63] block font-sans">{t('danger_level')}</span>
                <strong className="font-heading text-xl font-bold text-[#5C7A4E]">+{comparison?.safety_gain_percent}% {t('safer')}</strong>
              </div>
            </div>

            {safe?.disruption_likelihood_pct !== undefined && (
              <div className="mt-3 p-2 bg-[#5C7A4E]/10 border border-[#5C7A4E]/30 rounded text-xs flex items-center justify-between">
                <span className="text-[#5C7A4E] font-semibold">✓ {t('impending_disruption_risk')}</span>
                <strong className="text-[#5C7A4E] font-mono text-xs">{safe.disruption_likelihood_pct}% ({t('safe')})</strong>
              </div>
            )}

            <div className="mt-4 p-2.5 bg-[#5C7A4E]/10 border border-[#5C7A4E]/30 rounded text-xs text-[#5C7A4E]">
              <strong className="block font-heading">{t('why_route_safer')}</strong>
              <span className="text-[#1C2B22] text-[11px]">
                {t('why_route_safer_desc')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Dual-Route Map View (High-Res Satellite / Topo) */}
      {routeResult && (
        <div className="h-[380px] rounded border border-[#3E5C63]/30 overflow-hidden relative shadow-sm">
          {/* Map Base Layer Switcher in Route Optimizer */}
          <div className="absolute top-3 right-3 z-[400] bg-[#F1EDE2]/95 backdrop-blur-xs p-1 rounded shadow-md border border-[#3E5C63]/30 flex items-center gap-1">
            <button
              onClick={() => setMapBaseLayer('satellite')}
              className={`px-2 py-1 text-[11px] font-sans font-semibold rounded flex items-center gap-1 transition ${
                mapBaseLayer === 'satellite'
                  ? 'bg-[#1C2B22] text-[#F1EDE2] shadow-xs'
                  : 'text-[#1C2B22] hover:bg-[#3E5C63]/10'
              }`}
            >
              <span>🛰️</span>
              <span>{t('satellite_view')}</span>
            </button>
            <button
              onClick={() => setMapBaseLayer('topo')}
              className={`px-2 py-1 text-[11px] font-sans font-semibold rounded flex items-center gap-1 transition ${
                mapBaseLayer === 'topo'
                  ? 'bg-[#1C2B22] text-[#F1EDE2] shadow-xs'
                  : 'text-[#1C2B22] hover:bg-[#3E5C63]/10'
              }`}
            >
              <span>🗺️</span>
              <span>{t('topo_view')}</span>
            </button>
          </div>

          <MapContainer 
            center={naive?.coordinates?.[Math.floor((naive?.coordinates?.length || 1) / 2)] || [25.8, 92.2]} 
            zoom={8} 
            scrollWheelZoom={false}
            className="w-full h-full"
          >
            {mapBaseLayer === 'satellite' ? (
              <TileLayer
                key="route-esri-satellite"
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={18}
              />
            ) : (
              <TileLayer
                key="route-esri-topo"
                attribution='Tiles &copy; Esri &mdash; Topographic Relief'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
                maxZoom={18}
              />
            )}

            {/* Auto-Fit Viewport to Both Routes */}
            <MapBoundsHandler naiveCoords={naive?.coordinates} safeCoords={safe?.coordinates} />

            {/* Start Marker */}
            {naive?.coordinates?.[0] && (
              <Marker 
                key={`start-node-${origin}-${destination}`} 
                position={naive.coordinates[0]} 
                icon={startIcon}
              >
                <Popup>Start: {origin}</Popup>
              </Marker>
            )}

            {/* End Marker */}
            {naive?.coordinates?.[naive.coordinates.length - 1] && (
              <Marker 
                key={`end-node-${origin}-${destination}`} 
                position={naive.coordinates[naive.coordinates.length - 1]} 
                icon={endIcon}
              >
                <Popup>Destination: {destination}</Popup>
              </Marker>
            )}

            {/* Naive Path (Red Dashed) */}
            {naive?.coordinates && naive.coordinates.length > 0 && (
              <Polyline
                key={`naive-route-${origin}-${destination}-${vehicleType}`}
                positions={naive.coordinates}
                pathOptions={{
                  color: '#A63A32',
                  weight: 5,
                  opacity: 0.9,
                  dashArray: '8, 8'
                }}
              >
                <Tooltip sticky>
                  <div className="font-sans text-xs">
                    <strong className="text-[#A63A32]">Shortest Route (High Danger)</strong>
                    <div>Distance: {naive.distance_km} km</div>
                  </div>
                </Tooltip>
              </Polyline>
            )}

            {/* Setumarg Safe Path (Emerald Solid) */}
            {safe?.coordinates && safe.coordinates.length > 0 && (
              <Polyline
                key={`safe-route-${origin}-${destination}-${vehicleType}`}
                positions={safe.coordinates}
                pathOptions={{
                  color: '#2D7A4D',
                  weight: 6,
                  opacity: 0.95
                }}
              >
                <Tooltip sticky>
                  <div className="font-sans text-xs">
                    <strong className="text-[#2D7A4D]">Setumarg Safe Detour</strong>
                    <div>Distance: {safe.distance_km} km</div>
                  </div>
                </Tooltip>
              </Polyline>
            )}
          </MapContainer>

          {/* Map Legend */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-[#F1EDE2]/92 backdrop-blur-sm p-2 rounded border border-[#3E5C63]/30 text-xs font-sans text-[#1C2B22] space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-4 h-1 bg-[#A63A32] border border-dashed border-[#A63A32]"></span>
              <span>Shortest Route (High Danger of Landslides)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-1.5 bg-[#5C7A4E] rounded-sm"></span>
              <span>Setumarg Recommended Safe Detour</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
