import React, { useState, useEffect } from 'react';
import { 
  Ship, 
  Truck, 
  Train, 
  Layers, 
  FileCode, 
  Copy, 
  Check,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export default function FreightPlannerView({ onCalculateFreight }) {
  const [originHub, setOriginHub] = useState('HUB-SIL-01');
  const [destHub, setDestHub] = useState('HUB-DBR-01');
  const [cargoType, setCargoType] = useState('essential_foodgrains_fertilizer');
  const [cargoWeight, setCargoWeight] = useState(25.0);
  const [freightData, setFreightData] = useState(null);
  const [showUlipModal, setShowUlipModal] = useState(false);
  const [copiedUlip, setCopiedUlip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const calculate = async () => {
    setIsLoading(true);
    try {
      const data = await onCalculateFreight({
        origin_hub_id: originHub,
        destination_hub_id: destHub,
        cargo_type: cargoType,
        cargo_weight_tons: parseFloat(cargoWeight)
      });
      setFreightData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    calculate();
  }, [originHub, destHub, cargoType, cargoWeight]);

  const copyToClipboard = () => {
    if (freightData?.ulip_gatishakti_contract) {
      navigator.clipboard.writeText(JSON.stringify(freightData.ulip_gatishakti_contract, null, 2));
      setCopiedUlip(true);
      setTimeout(() => setCopiedUlip(false), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 text-[#1C2B22] space-y-6">
      {/* Top Banner: PM GatiShakti & ULIP Integration */}
      <div className="bg-[#F1EDE2] p-5 rounded border border-[#3E5C63]/30 shadow-sm flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="font-mono text-xs text-[#3E5C63] uppercase tracking-wider block mb-1">
            Smart Goods &amp; Cargo Transport Planner
          </span>
          <h2 className="font-heading font-bold text-xl text-[#1C2B22]">
            Cargo &amp; Goods Transport: Trucks, Trains &amp; River Boats
          </h2>
          <p className="text-xs text-[#3E5C63] max-w-3xl mt-1 leading-relaxed">
            During heavy rains, highway trucks through North Bengal often get trapped by landslides, causing food and fuel prices to jump. Setumarg compares Trucks, Cargo Trains, and River Boats (Brahmaputra River) to find the cheapest, fastest, and safest way to move supplies.
          </p>
        </div>

        <button
          onClick={() => setShowUlipModal(true)}
          className="flex items-center gap-1.5 bg-[#1C2B22] hover:bg-[#2A4033] text-[#F1EDE2] text-xs font-heading font-semibold px-3.5 py-2 rounded transition"
        >
          <FileCode className="w-4 h-4 text-[#3B6EA5]" />
          View Government Shipping Contract (ULIP)
        </button>
      </div>

      {/* Shipment Input Controls */}
      <div className="bg-[#F1EDE2] p-4 rounded border border-[#3E5C63]/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="text-[10px] text-[#3E5C63] font-sans font-semibold block mb-1">Shipping From (Starting Hub)</label>
          <select
            value={originHub}
            onChange={(e) => setOriginHub(e.target.value)}
            className="w-full bg-[#E5DEC9] border border-[#3E5C63]/30 text-[#1C2B22] rounded p-2 text-xs font-semibold outline-none"
          >
            <option value="HUB-SIL-01">Siliguri Goods Terminal (NJP)</option>
            <option value="HUB-GHY-01">Guwahati (Pandu River Port)</option>
            <option value="HUB-DHU-01">Dhubri River Port (Brahmaputra)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-[#3E5C63] font-sans font-semibold block mb-1">Shipping To (Destination Hub)</label>
          <select
            value={destHub}
            onChange={(e) => setDestHub(e.target.value)}
            className="w-full bg-[#E5DEC9] border border-[#3E5C63]/30 text-[#1C2B22] rounded p-2 text-xs font-semibold outline-none"
          >
            <option value="HUB-DBR-01">Dibrugarh River Port (Upper Assam)</option>
            <option value="HUB-SCL-01">Silchar Goods Depot (Barak Valley)</option>
            <option value="HUB-DMV-01">Dimapur Railway Depot (Nagaland)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-[#3E5C63] font-sans font-semibold block mb-1">Type of Cargo / Goods</label>
          <select
            value={cargoType}
            onChange={(e) => setCargoType(e.target.value)}
            className="w-full bg-[#E5DEC9] border border-[#3E5C63]/30 text-[#1C2B22] rounded p-2 text-xs font-semibold outline-none"
          >
            <option value="essential_foodgrains_fertilizer">Ration Foodgrains &amp; Fertilizer</option>
            <option value="tea_horticulture">Tea &amp; Farm Harvest</option>
            <option value="construction_steel">Building Steel &amp; Cement</option>
            <option value="fmcg_pharmaceuticals">Medicines &amp; Daily Supplies</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-[#3E5C63] font-sans font-semibold block mb-1">Weight of Goods (Tons)</label>
          <input
            type="number"
            min="1"
            max="1000"
            value={cargoWeight}
            onChange={(e) => setCargoWeight(e.target.value)}
            className="w-full bg-[#E5DEC9] border border-[#3E5C63]/30 text-[#1C2B22] rounded p-2 text-xs font-mono font-bold outline-none"
          />
        </div>
      </div>

      {/* Loading & Empty States */}
      {isLoading && !freightData && (
        <div className="bg-[#F1EDE2] border border-[#3E5C63]/30 rounded p-12 text-center flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#5C7A4E] border-t-transparent rounded-full animate-spin mb-3"></div>
          <h3 className="font-heading font-bold text-sm text-[#1C2B22]">Comparing Multi-Modal Routes...</h3>
          <p className="text-xs text-[#3E5C63] mt-1">Evaluating Road vs. NFR Rail vs. National Waterway 2 (NW-2) barge corridors.</p>
        </div>
      )}
      {!isLoading && !freightData && (
        <div className="bg-[#F1EDE2] border border-[#3E5C63]/30 rounded p-8 text-center">
          <AlertTriangle className="w-7 h-7 text-[#D97706] mx-auto mb-2" />
          <h3 className="font-heading font-bold text-sm text-[#1C2B22]">No Freight Calculations Available</h3>
          <p className="text-xs text-[#3E5C63] mt-1">Please select an origin and destination hub above to compare options.</p>
          <button onClick={calculate} className="mt-3 bg-[#1C2B22] text-[#F1EDE2] px-3.5 py-1 rounded text-xs font-bold">Calculate Now</button>
        </div>
      )}

      {/* AI Recommendation Banner */}
      {freightData && (
        <div className="bg-[#F1EDE2] border-l-4 border-l-[#5C7A4E] border border-[#3E5C63]/30 p-4 rounded flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono text-xs font-bold text-[#5C7A4E] uppercase">
                Best Recommended Option:
              </span>
              <strong className="font-heading text-base text-[#1C2B22]">{freightData.optimal_mode}</strong>
            </div>
            <p className="text-xs text-[#3E5C63] max-w-3xl">{freightData.recommendation_reason}</p>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs">
            <div className="bg-[#E5DEC9] px-3 py-1.5 rounded border border-[#3E5C63]/20 text-right">
              <span className="text-[10px] text-[#3E5C63] block font-sans">Estimated Money Saved</span>
              <strong className="font-heading text-base text-[#5C7A4E]">
                ₹{freightData.ulip_gatishakti_contract.estimated_freight_savings_inr.toLocaleString()}
              </strong>
            </div>
            <div className="bg-[#E5DEC9] px-3 py-1.5 rounded border border-[#3E5C63]/20 text-right">
              <span className="text-[10px] text-[#3E5C63] block font-sans">Pollution Reduced</span>
              <strong className="font-heading text-base text-[#3B6EA5]">
                {freightData.ulip_gatishakti_contract.co2_reduction_kg} kg CO₂
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* 3 Modes Comparative Ledger */}
      {freightData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {freightData.options.map((opt, i) => {
            const isRoad = opt.mode.includes('Road');
            const isRail = opt.mode.includes('Rail');
            const isWater = opt.mode.includes('Waterway');
            const isSevere = opt.landslide_risk_index > 60;

            const borderColor = isSevere ? 'border-[#A63A32]' : (isWater ? 'border-[#3B6EA5]' : (isRail ? 'border-[#5C7A4E]' : 'border-[#3E5C63]/30'));

            return (
              <div 
                key={i}
                className={`bg-[#F1EDE2] rounded p-5 border-2 ${borderColor} flex flex-col justify-between shadow-sm`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#3E5C63]/20 pb-2 mb-3">
                    <span className="font-mono text-xs font-bold text-[#1C2B22]">
                      {isWater ? 'River Cargo Boat (Brahmaputra NW-2)' : (isRail ? 'Cargo Train (Indian Railways NFR)' : 'Truck on Highway')}
                    </span>
                    <span className="font-mono text-[10px] text-[#3E5C63]">{opt.distance_km} km</span>
                  </div>

                  <h3 className="font-heading font-bold text-base text-[#1C2B22] mb-1">
                    {opt.mode.split('(')[0]}
                  </h3>
                  <p className="text-[11px] text-[#3E5C63] mb-3 leading-snug">
                    {opt.route_description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-4 font-mono text-xs">
                    <div className="bg-[#E5DEC9] p-2 rounded border border-[#3E5C63]/20">
                      <span className="text-[9px] text-[#3E5C63] block font-sans">Total Transport Cost</span>
                      <strong className="font-heading text-base text-[#1C2B22]">₹{opt.cost_inr.toLocaleString()}</strong>
                      <span className="text-[9px] text-[#3E5C63] block font-sans">₹{opt.cost_per_ton_inr}/ton</span>
                    </div>

                    <div className="bg-[#E5DEC9] p-2 rounded border border-[#3E5C63]/20">
                      <span className="text-[9px] text-[#3E5C63] block font-sans">Travel Time</span>
                      <strong className={`font-heading text-base ${isSevere ? 'text-[#A63A32]' : 'text-[#1C2B22]'}`}>
                        {opt.estimated_transit_hours} h
                      </strong>
                      <span className="text-[9px] text-[#3E5C63] block font-sans">
                        {isSevere ? 'Delayed by slides' : 'On time'}
                      </span>
                    </div>

                    <div className="bg-[#E5DEC9] p-2 rounded border border-[#3E5C63]/20">
                      <span className="text-[9px] text-[#3E5C63] block font-sans">Pollution (CO₂)</span>
                      <strong className="font-heading text-base text-[#1C2B22]">{opt.co2_emissions_kg} kg</strong>
                      <span className="text-[9px] text-[#5C7A4E] block font-sans">
                        {isWater ? '75% cleaner' : (isRail ? '64% cleaner' : 'Baseline')}
                      </span>
                    </div>

                    <div className="bg-[#E5DEC9] p-2 rounded border border-[#3E5C63]/20">
                      <span className="text-[9px] text-[#3E5C63] block font-sans">Landslide Danger</span>
                      <strong className={`font-heading text-base ${opt.landslide_risk_index > 50 ? 'text-[#A63A32]' : 'text-[#5C7A4E]'}`}>
                        {opt.landslide_risk_index}%
                      </strong>
                      <span className="text-[9px] text-[#3E5C63] block font-sans">
                        {opt.landslide_risk_index > 50 ? 'High Danger of Landslide' : 'Safe From Landslides'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`p-2 rounded font-mono text-[11px] font-semibold flex items-center justify-between ${
                  opt.is_recommended
                    ? 'bg-[#5C7A4E]/15 text-[#5C7A4E] border border-[#5C7A4E]/30'
                    : 'bg-[#A63A32]/15 text-[#A63A32] border border-[#A63A32]/30'
                }`}>
                  <span>{opt.safety_badge}</span>
                  <span className="text-[10px]">{opt.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Exportable ULIP Contract Modal */}
      {showUlipModal && freightData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C2B22]/70 backdrop-blur-sm">
          <div className="bg-[#F1EDE2] text-[#1C2B22] border-2 border-[#3E5C63] rounded max-w-2xl w-full p-6 shadow-2xl relative text-xs flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-[#3E5C63]/25 pb-3 mb-3">
              <div>
                <h3 className="font-heading font-bold text-base text-[#1C2B22]">
                  Government Digital Shipping Record (ULIP Contract)
                </h3>
                <p className="text-[11px] text-[#3E5C63]">
                  Conforms to Ministry of Commerce ULIP standards &amp; PM GatiShakti National Portal
                </p>
              </div>
              <button
                onClick={() => setShowUlipModal(false)}
                className="text-[#3E5C63] hover:text-[#1C2B22] p-1 font-mono font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between bg-[#E5DEC9] px-3 py-1.5 rounded mb-3 border border-[#3E5C63]/20 font-mono text-[11px]">
              <span>Consignment ID: {freightData.ulip_gatishakti_contract.consignment_id}</span>
              <button
                onClick={copyToClipboard}
                className="bg-[#1C2B22] text-[#F1EDE2] px-3 py-1 rounded font-semibold transition"
              >
                {copiedUlip ? 'Copied!' : 'Copy JSON'}
              </button>
            </div>

            <div className="bg-[#1C2B22] text-[#F1EDE2] p-3 rounded overflow-y-auto font-mono text-[11px] flex-1">
              <pre>{JSON.stringify(freightData.ulip_gatishakti_contract, null, 2)}</pre>
            </div>

            <div className="pt-2 text-[#3E5C63] text-[10px] font-mono text-right">
              Compatible with Indian Ports &amp; Ministry of Commerce Logistics Portal.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
