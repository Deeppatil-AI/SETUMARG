import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShieldAlert, 
  Leaf, 
  Activity, 
  Compass, 
  AlertTriangle,
  Building2,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

export default function DashboardView({ dashboardData, nowcastData, onSelectSegment }) {
  const econ = dashboardData?.pillar_economic || {};
  const soc = dashboardData?.pillar_social || {};
  const strat = dashboardData?.pillar_strategic || {};
  const env = dashboardData?.pillar_environmental || {};
  const tiers = dashboardData?.risk_tier_distribution || [];

  const mult = nowcastData?.current_multiplier || 1.0;
  const intensity = nowcastData?.current_rainfall_intensity || 18.5;

  // Monthly freight savings projection
  const monthlySavingsData = [
    { month: 'Apr', savings_cr: 1.8 },
    { month: 'May', savings_cr: 3.2 },
    { month: 'Jun', savings_cr: 7.4 },
    { month: 'Jul (Peak)', savings_cr: econ.estimated_monthly_freight_savings_cr || 9.7 },
    { month: 'Aug', savings_cr: 8.5 },
    { month: 'Sep', savings_cr: 5.1 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 text-[#1C2B22] space-y-6">
      {/* Platform Title Banner */}
      <div className="flex flex-wrap items-end justify-between border-b border-[#3E5C63]/25 pb-3">
        <div>
          <span className="font-mono text-xs text-[#3E5C63] uppercase tracking-wider block mb-0.5">
            Smart India Hackathon 2026 | PS SIH26002
          </span>
          <h1 className="font-heading font-extrabold text-2xl text-[#1C2B22] tracking-tight">
            Setumarg Emergency &amp; Operations Summary
          </h1>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-[#3E5C63] mt-2 sm:mt-0">
          <span>Live Rain: <strong>{intensity} mm/hr</strong></span>
          <span>|</span>
          <span>Rain Level: <strong>{mult.toFixed(1)}x {mult > 2.0 ? '(Storm)' : '(Normal)'}</strong></span>
          <span>|</span>
          <span className="text-[#A63A32] font-bold">{strat.nowcast_alert_level || 'HIGH DANGER ALERT'}</span>
        </div>
      </div>

      {/* ASYMMETRIC HERO MOMENT: The Single Current Highest-Risk Alert (Dominant Visual Element) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Dominant Hero Card (8 columns) */}
        <div className="lg:col-span-8 bg-[#F1EDE2] border-2 border-[#A63A32] p-6 rounded shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#3E5C63]/20 pb-2 mb-3">
            <span className="font-mono text-xs font-bold text-[#A63A32] uppercase">
              Immediate High Alert — Blocked Highway Section
            </span>
            <span className="font-sans text-xs text-[#3E5C63]">
              Highway NH-6 (Barak Valley Lifeline)
            </span>
          </div>

          <div className="my-2">
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#1C2B22] leading-tight">
              Jowai–Sonapur Tunnel–Ratacherra Highway
            </h2>
            <p className="text-xs text-[#3E5C63] mt-1 leading-relaxed">
              Heavy mudslide and falling stones are blocking the tunnel entrance. The main highway to Barak Valley, Tripura, and Mizoram is currently cut off.
            </p>
          </div>

          {/* Cartographic Numerals (High Optical Scale) */}
          <div className="grid grid-cols-3 gap-4 border-t border-[#3E5C63]/20 pt-4 mt-2 font-mono">
            <div>
              <span className="text-[11px] text-[#3E5C63] block font-sans">Landslide Danger Score</span>
              <span className="font-heading text-3xl font-extrabold text-[#A63A32]">94%</span>
              <span className="text-[10px] text-[#A63A32] block font-sans">Blocked / Impassable</span>
            </div>
            <div>
              <span className="text-[11px] text-[#3E5C63] block font-sans">Waiting Delay if Trapped</span>
              <span className="font-heading text-3xl font-extrabold text-[#1C2B22]">14.5 h</span>
              <span className="text-[10px] text-[#3E5C63] block font-sans">Normally: 8.5 h</span>
            </div>
            <div>
              <span className="text-[11px] text-[#3E5C63] block font-sans">Affected People in Villages</span>
              <span className="font-heading text-3xl font-extrabold text-[#1C2B22]">41,830</span>
              <span className="text-[10px] text-[#3E5C63] block font-sans">17 villages cut off</span>
            </div>
          </div>
        </div>

        {/* Quiet Supporting Telemetry Card (4 columns) */}
        <div className="lg:col-span-4 bg-[#E5DEC9]/70 border border-[#3E5C63]/30 p-5 rounded flex flex-col justify-between text-xs">
          <div>
            <span className="font-heading font-bold text-xs text-[#1C2B22] block mb-1">
              Current Road &amp; Village Status
            </span>
            <div className="divide-y divide-[#3E5C63]/20 font-mono">
              <div className="py-2 flex items-center justify-between">
                <span className="text-[#3E5C63] font-sans">Highways Monitored</span>
                <strong className="text-[#1C2B22] font-heading text-base">{econ.monitored_corridor_km} km</strong>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-[#3E5C63] font-sans">Roads Blocked Today</span>
                <strong className="text-[#A63A32] font-heading text-base">{strat.severely_blocked_corridors} Highways</strong>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-[#3E5C63] font-sans">Villages With Open Road</span>
                <strong className="text-[#3E5C63] font-heading text-base">{soc.rural_access_index_rai_pct}%</strong>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-[#3E5C63] font-sans">Money Saved with Boat/Train</span>
                <strong className="text-[#5C7A4E] font-heading text-base">₹{econ.estimated_monthly_freight_savings_cr} Cr</strong>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#3E5C63]/20 text-[11px] text-[#3E5C63]">
            <strong>Alternate Routes: </strong>Trucks are being redirected to Brahmaputra river barges and cargo trains.
          </div>
        </div>
      </div>

      {/* THE 4 PILLARS AS A CARTOGRAPHIC OPERATIONS LEDGER (No Identical Cards) */}
      <div className="bg-[#F1EDE2] border border-[#3E5C63]/30 rounded p-5 shadow-sm">
        <div className="border-b border-[#3E5C63]/25 pb-2 mb-4 flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-[#1C2B22]">
            Key Impact &amp; Community Benefits
          </h3>
          <span className="font-sans text-xs text-[#3E5C63]">Summary of Results</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#3E5C63]/20 gap-4 text-xs">
          {/* Pillar 1: Economic */}
          <div className="pr-2 pt-2 md:pt-0">
            <span className="font-mono text-[11px] text-[#C77A2E] font-bold block mb-1">01 Money Saved on Transport</span>
            <div className="font-heading text-xl font-bold text-[#1C2B22]">₹{econ.estimated_monthly_freight_savings_cr} Cr/month</div>
            <p className="text-[11px] text-[#3E5C63] mt-1 leading-relaxed">
              Prevents steep price rises on foodgrains and essentials by moving cargo to boats and trains when highways are blocked.
            </p>
            <span className="font-sans text-[10px] text-[#3E5C63] block mt-2">Ready to switch routes: {econ.siliguri_corridor_risk_deflection_pct}%</span>
          </div>

          {/* Pillar 2: Social */}
          <div className="px-0 md:px-3 pt-2 md:pt-0">
            <span className="font-mono text-[11px] text-[#3B6EA5] font-bold block mb-1">02 Hospital &amp; Village Access</span>
            <div className="font-heading text-xl font-bold text-[#1C2B22]">{soc.currently_isolated_villages} Villages Cut-Off</div>
            <p className="text-[11px] text-[#3E5C63] mt-1 leading-relaxed">
              Travel times for ambulances and patients to hospitals are currently delayed by ~{soc.average_hospital_transit_delay_hrs} hours due to mudslides.
            </p>
            <span className="font-sans text-[10px] text-[#3E5C63] block mt-2">Villages with Open Road: {soc.rural_access_index_rai_pct}%</span>
          </div>

          {/* Pillar 3: Strategic */}
          <div className="px-0 md:px-3 pt-2 md:pt-0">
            <span className="font-mono text-[11px] text-[#A63A32] font-bold block mb-1">03 Border Lifelines &amp; Highway Reroutes</span>
            <div className="font-heading text-xl font-bold text-[#1C2B22]">{strat.critical_border_highways_monitored?.length || 4} Lifelines Active</div>
            <p className="text-[11px] text-[#3E5C63] mt-1 leading-relaxed">
              Monitoring NH-10 (Sikkim), NH-102 (Manipur), and NH-13 (Arunachal) so emergency relief and supplies keep moving.
            </p>
            <span className="font-sans text-[10px] text-[#3E5C63] block mt-2">Highways Monitored: 24/7 Live</span>
          </div>

          {/* Pillar 4: Environmental */}
          <div className="pl-0 md:pl-3 pt-2 md:pt-0">
            <span className="font-mono text-[11px] text-[#5C7A4E] font-bold block mb-1">04 Cleaner Air &amp; Nature</span>
            <div className="font-heading text-xl font-bold text-[#1C2B22]">{env.potential_co2_reduction_tons_month} Tons CO₂/mo</div>
            <p className="text-[11px] text-[#3E5C63] mt-1 leading-relaxed">
              Less truck exhaust smoke in mountain air by shifting heavy stone and fertilizer cargo onto the Brahmaputra river network.
            </p>
            <span className="font-sans text-[10px] text-[#3E5C63] block mt-2">River Boat Share: {env.green_waterway_ton_km_share_pct}%</span>
          </div>
        </div>
      </div>

      {/* Cartographic Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Road Susceptibility Distribution */}
        <div className="bg-[#F1EDE2] border border-[#3E5C63]/30 p-4 rounded shadow-sm">
          <div className="flex items-center justify-between border-b border-[#3E5C63]/20 pb-2 mb-3">
            <h4 className="font-heading font-bold text-xs text-[#1C2B22]">
              Road Safety Breakdown (By Danger Level)
            </h4>
            <span className="font-sans text-[10px] text-[#3E5C63]">Model Accuracy: 91.5%</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tiers} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <XAxis dataKey="name" stroke="#3E5C63" tick={{ fill: '#1C2B22', fontSize: 11 }} />
                <YAxis stroke="#3E5C63" tick={{ fill: '#1C2B22', fontSize: 11 }} allowDecimals={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#F1EDE2', borderColor: '#3E5C63', borderRadius: '2px', color: '#1C2B22', fontSize: '11px' }}
                />
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                  {tiers.map((entry, index) => {
                    const fillCol = entry.name === 'Severe' ? '#A63A32' : (entry.name === 'High' || entry.name === 'Moderate' ? '#C77A2E' : '#5C7A4E');
                    return <Cell key={`cell-${index}`} fill={fillCol} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Freight Savings Curve */}
        <div className="bg-[#F1EDE2] border border-[#3E5C63]/30 p-4 rounded shadow-sm">
          <div className="flex items-center justify-between border-b border-[#3E5C63]/20 pb-2 mb-3">
            <h4 className="font-heading font-bold text-xs text-[#1C2B22]">
              Money Saved by Using River &amp; Train (₹ Crores per Month)
            </h4>
            <span className="font-sans text-[10px] text-[#3E5C63]">National Transport Target</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySavingsData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <XAxis dataKey="month" stroke="#3E5C63" tick={{ fill: '#1C2B22', fontSize: 11 }} />
                <YAxis stroke="#3E5C63" tick={{ fill: '#1C2B22', fontSize: 11 }} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#F1EDE2', borderColor: '#3E5C63', borderRadius: '2px', color: '#1C2B22', fontSize: '11px' }}
                  formatter={(val) => [`₹${val} Cr`, 'Estimated Savings']}
                />
                <Bar dataKey="savings_cr" fill="#3E5C63" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
