import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { 
  Truck, 
  Car, 
  Bike, 
  AlertTriangle, 
  ShieldAlert,
  Navigation
} from 'lucide-react';

const startIcon = L.divIcon({
  html: `<div class="w-5 h-5 rounded-sm bg-[#1C2B22] border border-[#F1EDE2] flex items-center justify-center text-[10px] font-mono font-bold text-[#F1EDE2] shadow-sm">A</div>`,
  className: 'route-marker-start',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const endIcon = L.divIcon({
  html: `<div class="w-5 h-5 rounded-sm bg-[#5C7A4E] border border-[#F1EDE2] flex items-center justify-center text-[10px] font-mono font-bold text-[#F1EDE2] shadow-sm">B</div>`,
  className: 'route-marker-end',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

export default function RouteOptimizerView({ onOptimizeRoute }) {
  const [origin, setOrigin] = useState('Guwahati');
  const [destination, setDestination] = useState('Silchar');
  const [vehicleType, setVehicleType] = useState('heavy_truck');
  const [routeResult, setRouteResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const naive = routeResult?.naive_route;
  const safe = routeResult?.safe_route;
  const comparison = routeResult?.summary_comparison;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 text-[#1C2B22] space-y-6">
      {/* Top Banner */}
      <div className="bg-[#F1EDE2] p-5 rounded border border-[#3E5C63]/30 shadow-sm flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="font-mono text-xs text-[#3E5C63] uppercase tracking-wider block mb-1">
            Safe Mountain Route Finder
          </span>
          <h2 className="font-heading font-bold text-xl text-[#1C2B22]">
            Find Safe Mountain Routes: Avoid Landslides &amp; Trapped Roads
          </h2>
          <p className="text-xs text-[#3E5C63] max-w-3xl mt-1 leading-relaxed">
            In mountain areas, the shortest road is often blocked by mudslides during heavy rain. Setumarg checks live rainfall and steep hillside warnings to steer you onto safer detour roads, so you don't get trapped for hours.
          </p>
        </div>

        {/* Vehicle Selector */}
        <div className="flex items-center gap-1.5 bg-[#E5DEC9] p-1 rounded border border-[#3E5C63]/20">
          {[
            { id: 'heavy_truck', label: 'Truck / Bus', icon: Truck },
            { id: 'light_vehicle', label: 'Car / Ambulance', icon: Car },
            { id: 'two_wheeler', label: 'Bike / Scooter', icon: Bike }
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

      {/* Origin/Destination Selector */}
      <div className="bg-[#F1EDE2] p-4 rounded border border-[#3E5C63]/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <label className="text-[10px] text-[#3E5C63] font-sans font-semibold block mb-1">Starting City / Town</label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="bg-[#E5DEC9] border border-[#3E5C63]/30 rounded px-3 py-1.5 text-xs font-heading font-bold text-[#1C2B22] outline-none"
            >
              <option value="Guwahati">Guwahati (Gateway City)</option>
              <option value="Siliguri">Siliguri (North Bengal Gateway)</option>
            </select>
          </div>

          <span className="text-[#3E5C63] pt-4 font-mono font-bold">to</span>

          <div>
            <label className="text-[10px] text-[#3E5C63] font-sans font-semibold block mb-1">Destination City / Town</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="bg-[#E5DEC9] border border-[#3E5C63]/30 rounded px-3 py-1.5 text-xs font-heading font-bold text-[#1C2B22] outline-none"
            >
              {origin === 'Guwahati' ? (
                <>
                  <option value="Silchar">Silchar (Barak Valley / NH-6)</option>
                  <option value="Kohima">Kohima (Nagaland / NH-29)</option>
                </>
              ) : (
                <option value="Gangtok">Gangtok (Sikkim / NH-10)</option>
              )}
            </select>
          </div>
        </div>

        {/* AI Advisory Callout */}
        <div className="bg-[#E5DEC9] p-2.5 rounded border border-[#3E5C63]/25 max-w-xl text-xs">
          <strong className="font-heading font-bold text-[#1C2B22] block mb-0.5">Safety Advice:</strong>
          <span className="text-[#3E5C63] leading-relaxed">
            {routeResult?.avoidance_rationale || 'Finding the safest travel route...'}
          </span>
        </div>
      </div>

      {/* Side-by-Side Comparison Cards */}
      {routeResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Naive Shortest Route */}
          <div className="bg-[#F1EDE2] border-2 border-[#A63A32] rounded p-5 shadow-sm relative">
            <div className="flex items-center justify-between border-b border-[#3E5C63]/20 pb-2 mb-3">
              <span className="font-mono text-xs font-bold text-[#A63A32] uppercase">
                Shortest Route (High Landslide Danger)
              </span>
              <span className="font-sans text-xs text-[#3E5C63]">Standard GPS</span>
            </div>

            <h3 className="font-heading font-bold text-base text-[#1C2B22] mb-1">
              {naive?.name}
            </h3>
            <p className="text-[11px] text-[#3E5C63] mb-4">
              The usual shortest road. Does not check if heavy rainfall or mudslides have blocked mountain passes.
            </p>

            <div className="grid grid-cols-3 gap-3 font-mono border-t border-[#3E5C63]/20 pt-3">
              <div>
                <span className="text-[10px] text-[#3E5C63] block font-sans">Distance</span>
                <strong className="font-heading text-xl font-bold text-[#1C2B22]">{naive?.distance_km} km</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#3E5C63] block font-sans">Travel Time</span>
                <strong className="font-heading text-xl font-bold text-[#A63A32]">{naive?.duration_hrs} h</strong>
                {naive?.delay_penalty_hrs > 0 && (
                  <span className="text-[10px] text-[#A63A32] block">+{naive.delay_penalty_hrs}h stuck in mud/traffic</span>
                )}
              </div>
              <div>
                <span className="text-[10px] text-[#3E5C63] block font-sans">Danger Level</span>
                <strong className="font-heading text-xl font-bold text-[#A63A32]">{comparison?.naive_risk_index}%</strong>
              </div>
            </div>

            {naive?.has_active_blockage && (
              <div className="mt-4 p-2.5 bg-[#A63A32]/10 border border-[#A63A32]/30 rounded text-xs text-[#A63A32]">
                <strong className="block font-heading">Road Blocks &amp; Mudslides on this Route:</strong>
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
                Setumarg Recommended Safe Detour
              </span>
              <span className="font-sans text-xs text-[#5C7A4E] font-bold">Recommended</span>
            </div>

            <h3 className="font-heading font-bold text-base text-[#1C2B22] mb-1">
              {safe?.name}
            </h3>
            <p className="text-[11px] text-[#3E5C63] mb-4">
              Takes you safely around blocked roads by using stable valley roads where hills are less steep.
            </p>

            <div className="grid grid-cols-3 gap-3 font-mono border-t border-[#3E5C63]/20 pt-3">
              <div>
                <span className="text-[10px] text-[#3E5C63] block font-sans">Distance</span>
                <strong className="font-heading text-xl font-bold text-[#1C2B22]">{safe?.distance_km} km</strong>
                <span className="text-[10px] text-[#C77A2E] block font-sans">+{comparison?.extra_distance_km} km longer detour</span>
              </div>
              <div>
                <span className="text-[10px] text-[#3E5C63] block font-sans">Travel Time (No Stuck)</span>
                <strong className="font-heading text-xl font-bold text-[#5C7A4E]">{safe?.duration_hrs} h</strong>
                <span className="text-[10px] text-[#5C7A4E] block font-sans">Saves ~{comparison?.hours_saved_against_stranding}h waiting</span>
              </div>
              <div>
                <span className="text-[10px] text-[#3E5C63] block font-sans">Safety Gain</span>
                <strong className="font-heading text-xl font-bold text-[#5C7A4E]">+{comparison?.safety_gain_percent}% safer</strong>
              </div>
            </div>

            <div className="mt-4 p-2.5 bg-[#5C7A4E]/10 border border-[#5C7A4E]/30 rounded text-xs text-[#5C7A4E]">
              <strong className="block font-heading">Why This Route is Safer:</strong>
              <span className="text-[#1C2B22] text-[11px]">
                Routes through lower valley roads where hillsides are firm and less prone to collapsing during rainfall.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Topographic Dual-Route Map View */}
      {routeResult && (
        <div className="h-[380px] rounded border border-[#3E5C63]/30 overflow-hidden relative shadow-sm">
          <MapContainer 
            center={naive?.coordinates[Math.floor(naive.coordinates.length / 2)] || [25.8, 92.2]} 
            zoom={8} 
            scrollWheelZoom={false}
            className="w-full h-full"
          >
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Topographic Relief'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
            />

            {/* Start Marker */}
            {naive?.coordinates[0] && (
              <Marker position={naive.coordinates[0]} icon={startIcon}>
                <Popup>Start: {origin}</Popup>
              </Marker>
            )}

            {/* End Marker */}
            {naive?.coordinates[naive.coordinates.length - 1] && (
              <Marker position={naive.coordinates[naive.coordinates.length - 1]} icon={endIcon}>
                <Popup>Destination: {destination}</Popup>
              </Marker>
            )}

            {/* Naive Path (Red Dashed) */}
            <Polyline
              positions={naive.coordinates}
              pathOptions={{
                color: '#A63A32',
                weight: 5,
                opacity: 0.85,
                dashArray: '6, 6'
              }}
            >
              <Tooltip sticky>
                <div className="font-sans text-xs">
                  <strong className="text-[#A63A32]">Shortest Route (High Danger)</strong>
                  <div>Distance: {naive.distance_km} km</div>
                </div>
              </Tooltip>
            </Polyline>

            {/* Setumarg Safe Path (Olive Solid) */}
            <Polyline
              positions={safe.coordinates}
              pathOptions={{
                color: '#5C7A4E',
                weight: 6,
                opacity: 1.0
              }}
            >
              <Tooltip sticky>
                <div className="font-sans text-xs">
                  <strong className="text-[#5C7A4E]">Setumarg Safe Detour</strong>
                  <div>Distance: {safe.distance_km} km</div>
                </div>
              </Tooltip>
            </Polyline>
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
