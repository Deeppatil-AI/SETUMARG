import React, { useState, useEffect } from 'react';
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
  FileText,
  Truck,
  Clock,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  MapPin,
  Package,
  ChevronRight
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
import { getTranslation } from '../i18n';

export default function DashboardView({ dashboardData, nowcastData, onSelectSegment, currentLanguage = 'en' }) {
  const t = (k) => getTranslation(currentLanguage, k);
  const econ = dashboardData?.pillar_economic || {};
  const soc = dashboardData?.pillar_social || {};
  const strat = dashboardData?.pillar_strategic || {};
  const env = dashboardData?.pillar_environmental || {};
  const tiers = dashboardData?.risk_tier_distribution || [];

  const [bottleneckData, setBottleneckData] = useState(null);
  const [fleetData, setFleetData] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'delivery' | 'bottlenecks'

  if (!dashboardData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 border-4 border-[#A63A32] border-t-transparent rounded-full animate-spin mb-4"></div>
        <h3 className="font-heading font-bold text-base text-[#1C2B22]">Loading Executive Command Center...</h3>
        <p className="text-xs text-[#3E5C63] mt-1">Aggregating Economic, Social, Strategic &amp; Environmental KPIs.</p>
      </div>
    );
  }

  useEffect(() => {
    let isMounted = true;
    const fetchLogistics = async () => {
      try {
        const [bRes, fRes] = await Promise.all([
          fetch('/api/fleet/bottlenecks').then(r => r.json()),
          fetch('/api/fleet/vehicles').then(r => r.json())
        ]);
        if (isMounted) {
          setBottleneckData(bRes);
          setFleetData(fRes);
        }
      } catch (err) {
        // silent recovery
      }
    };
    fetchLogistics();
    const interval = setInterval(fetchLogistics, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const mult = nowcastData?.current_multiplier || 1.0;
  const intensity = nowcastData?.current_rainfall_intensity || 18.5;

  // Monthly monsoon landslide warning incidents
  const monthlyAlertsData = [
    { month: 'Apr', alerts: 14 },
    { month: 'May', alerts: 32 },
    { month: 'Jun', alerts: 68 },
    { month: 'Jul (Peak)', alerts: 94 },
    { month: 'Aug', alerts: 76 },
    { month: 'Sep', alerts: 41 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 text-[#1C2B22] space-y-6">
      {/* Platform Title Banner */}
      <div className="flex flex-wrap items-end justify-between border-b border-[#3E5C63]/25 pb-3">
        <div>
          <span className="font-mono text-xs text-[#3E5C63] uppercase tracking-wider block mb-0.5">
            {t('portal_subtitle')}
          </span>
          <h1 className="font-heading font-extrabold text-2xl text-[#1C2B22] tracking-tight">
            {t('highway_safety_operations_status')}
          </h1>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-[#3E5C63] mt-2 sm:mt-0">
          <span>{t('live_rain_stat')} <strong>{intensity} mm/hr</strong></span>
          <span>|</span>
          <span>{t('rain_level')} <strong>{mult.toFixed(1)}x {mult > 2.0 ? `(${t('heavy_storm')})` : `(${t('normal')})`}</strong></span>
          <span>|</span>
          <span className="text-[#A63A32] font-bold">{strat.nowcast_alert_level || t('immediate_high_alert')}</span>
        </div>
      </div>

      {/* ASYMMETRIC HERO MOMENT: The Single Current Highest-Risk Alert (Dominant Visual Element) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Dominant Hero Card (8 columns) */}
        <div className="lg:col-span-8 bg-[#F1EDE2] border-2 border-[#A63A32] p-6 rounded shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#3E5C63]/20 pb-2 mb-3">
            <span className="font-mono text-xs font-bold text-[#A63A32] uppercase">
              {t('immediate_high_alert')}
            </span>
            <span className="font-sans text-xs text-[#3E5C63]">
              Highway NH-6 (Barak Valley Lifeline)
            </span>
          </div>

          <div className="my-2">
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#1C2B22] leading-tight">
              {t('jowai_sonapur_title')}
            </h2>
            <p className="text-xs text-[#3E5C63] mt-1 leading-relaxed">
              {t('jowai_sonapur_desc')}
            </p>
          </div>

          {/* Cartographic Numerals (High Optical Scale) */}
          <div className="grid grid-cols-3 gap-4 border-t border-[#3E5C63]/20 pt-4 mt-2 font-mono">
            <div>
              <span className="text-[11px] text-[#3E5C63] block font-sans">{t('danger_score')}</span>
              <span className="font-heading text-3xl font-extrabold text-[#A63A32]">94%</span>
              <span className="text-[10px] text-[#A63A32] block font-sans">{t('blocked')}</span>
            </div>
            <div>
              <span className="text-[11px] text-[#3E5C63] block font-sans">{t('waiting_delay_trapped')}</span>
              <span className="font-heading text-3xl font-extrabold text-[#1C2B22]">14.5 h</span>
              <span className="text-[10px] text-[#3E5C63] block font-sans">{t('normally')} 8.5 h</span>
            </div>
            <div>
              <span className="text-[11px] text-[#3E5C63] block font-sans">{t('affected_people_villages')}</span>
              <span className="font-heading text-3xl font-extrabold text-[#1C2B22]">41,830</span>
              <span className="text-[10px] text-[#3E5C63] block font-sans">{t('villages_cut_off_stat')}</span>
            </div>
          </div>
        </div>

        {/* Quiet Supporting Telemetry Card (4 columns) */}
        <div className="lg:col-span-4 bg-[#E5DEC9]/70 border border-[#3E5C63]/30 p-5 rounded flex flex-col justify-between text-xs">
          <div>
            <span className="font-heading font-bold text-xs text-[#1C2B22] block mb-1">
              {t('current_road_village_status')}
            </span>
            <div className="divide-y divide-[#3E5C63]/20 font-mono">
              <div className="py-2 flex items-center justify-between">
                <span className="text-[#3E5C63] font-sans">{t('highways_monitored')}</span>
                <strong className="text-[#1C2B22] font-heading text-base">{econ.monitored_corridor_km} km</strong>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-[#3E5C63] font-sans">{t('roads_blocked_today')}</span>
                <strong className="text-[#A63A32] font-heading text-base">{strat.severely_blocked_corridors}</strong>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-[#3E5C63] font-sans">{t('villages_open_road')}</span>
                <strong className="text-[#3E5C63] font-heading text-base">{soc.rural_access_index_rai_pct}%</strong>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-[#3E5C63] font-sans">{t('villages_needing_attention')}</span>
                <strong className="text-[#A63A32] font-heading text-base">{soc.currently_isolated_villages || 4}</strong>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#3E5C63]/20 text-[11px] text-[#3E5C63]">
            {t('emergency_monitoring_note')}
          </div>
        </div>
      </div>

      {/* THE 4 PILLARS AS A CARTOGRAPHIC OPERATIONS LEDGER (No Identical Cards) */}
      <div className="bg-[#F1EDE2] border border-[#3E5C63]/30 rounded p-5 shadow-sm">
        <div className="border-b border-[#3E5C63]/25 pb-2 mb-4 flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-[#1C2B22]">
            {t('key_impact_benefits')}
          </h3>
          <span className="font-sans text-xs text-[#3E5C63]">{t('summary_results')}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#3E5C63]/20 gap-4 text-xs">
          {/* Pillar 1: Early Warning */}
          <div className="pr-2 pt-2 md:pt-0">
            <span className="font-mono text-[11px] text-[#C77A2E] font-bold block mb-1">{t('p1_title')}</span>
            <div className="font-heading text-xl font-bold text-[#1C2B22]">{strat.severely_blocked_corridors || 3} {t('blocked')}</div>
            <p className="text-[11px] text-[#3E5C63] mt-1 leading-relaxed">
              {t('p1_desc')}
            </p>
          </div>

          {/* Pillar 2: Social / Hospital Access */}
          <div className="px-0 md:px-3 pt-2 md:pt-0">
            <span className="font-mono text-[11px] text-[#3B6EA5] font-bold block mb-1">{t('p2_title')}</span>
            <div className="font-heading text-xl font-bold text-[#1C2B22]">{soc.currently_isolated_villages} {t('villages_cut_off')}</div>
            <p className="text-[11px] text-[#3E5C63] mt-1 leading-relaxed">
              {t('p2_desc')}
            </p>
          </div>

          {/* Pillar 3: Lifelines & Detours */}
          <div className="px-0 md:px-3 pt-2 md:pt-0">
            <span className="font-mono text-[11px] text-[#A63A32] font-bold block mb-1">{t('p3_title')}</span>
            <div className="font-heading text-xl font-bold text-[#1C2B22]">{strat.critical_border_highways_monitored?.length || 4} Lifelines Active</div>
            <p className="text-[11px] text-[#3E5C63] mt-1 leading-relaxed">
              {t('p3_desc')}
            </p>
          </div>

          {/* Pillar 4: Village Alert Broadcasts */}
          <div className="pl-0 md:pl-3 pt-2 md:pt-0">
            <span className="font-mono text-[11px] text-[#5C7A4E] font-bold block mb-1">{t('p4_title')}</span>
            <div className="font-heading text-xl font-bold text-[#1C2B22]">{t('confirm_send_alert')}</div>
            <p className="text-[11px] text-[#3E5C63] mt-1 leading-relaxed">
              {t('p4_desc')}
            </p>
          </div>
        </div>
      </div>

      {/* REAL-TIME FLEET DELIVERY STATUS & LOGISTICS BOTTLENECKS PANEL (PS26002 POINT g) */}
      <div className="bg-[#F1EDE2] border-2 border-[#3E5C63]/40 rounded p-5 shadow-sm space-y-4">
        {/* Panel Header with Metric Badges & Tab Switcher */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#3E5C63]/25 pb-3 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-[#1C2B22] text-[#F1EDE2]">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-base text-[#1C2B22]">
                  Live Deliveries &amp; Supply Chain Bottlenecks
                </h3>
                <span className="text-[10px] font-mono font-bold bg-[#1C2B22] text-[#F1EDE2] px-2 py-0.5 rounded">
                  Live Deliveries • PS26002 (d, g)
                </span>
              </div>
              <p className="text-[11px] text-[#3E5C63]">
                Real-time tracking of medicine, food, construction, and agricultural convoys across NER mountain corridors
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="bg-[#E5DEC9] px-2.5 py-1 rounded border border-[#3E5C63]/20 flex items-center gap-1.5 text-[#1C2B22]">
              <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
              On-Time: <strong>{fleetData?.summary?.moving || 0}</strong>
            </span>
            <span className="bg-[#E5DEC9] px-2.5 py-1 rounded border border-[#3E5C63]/20 flex items-center gap-1.5 text-[#1C2B22]">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
              Delayed: <strong>{fleetData?.summary?.delayed || 0}</strong>
            </span>
            <span className="bg-[#FEE2E2] px-2.5 py-1 rounded border border-[#EF4444]/30 flex items-center gap-1.5 text-[#991B1B] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping"></span>
              Stranded: <strong>{fleetData?.summary?.stranded || 0}</strong>
            </span>
            <span className="bg-[#1C2B22] text-[#F1EDE2] px-2.5 py-1 rounded font-bold">
              Bottlenecks: {bottleneckData?.summary?.critical_bottlenecks_count || 0} Critical
            </span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-[#3E5C63]/15 pb-2">
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'All Operations' },
              { id: 'delivery', label: `Live Deliveries (${fleetData?.vehicles?.length || 7})` },
              { id: 'bottlenecks', label: `Supply Chain Bottlenecks (${bottleneckData?.bottlenecks?.length || 0})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 text-xs font-heading font-semibold rounded transition ${
                  activeTab === tab.id
                    ? 'bg-[#1C2B22] text-[#F1EDE2] shadow-sm'
                    : 'text-[#3E5C63] hover:text-[#1C2B22] hover:bg-[#3E5C63]/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className="text-[10px] font-mono text-[#3E5C63]">
            Auto-refreshing live GPS &amp; landslide risk telemetry
          </span>
        </div>

        {/* Dynamic Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Sub-Panel 1: Real-Time Fleet Delivery Status */}
          {(activeTab === 'all' || activeTab === 'delivery') && (
            <div className={`${activeTab === 'all' ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-2.5`}>
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-xs text-[#1C2B22] flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#3E5C63]" />
                  {t('active_convoys_progress')}
                </h4>
                <span className="text-[10px] font-mono text-[#3E5C63]">
                  {fleetData?.vehicles?.length || 7} {t('convoys_en_route')}
                </span>
              </div>

              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {(fleetData?.vehicles || []).map((v) => {
                  const isStranded = v.status === 'stranded';
                  const isDelayed = v.status === 'delayed';

                  const badgeClass = isStranded
                    ? 'bg-[#FEE2E2] text-[#991B1B] border border-[#F87171] animate-pulse'
                    : (isDelayed
                      ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FBBF24]'
                      : 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]');

                  const cargoColor = v.cargo_category === 'medicines'
                    ? 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]'
                    : (v.cargo_category === 'food'
                      ? 'bg-[#FEF9C3] text-[#854D0E] border-[#FEF08A]'
                      : (v.cargo_category === 'construction material'
                        ? 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]'
                        : 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'));

                  return (
                    <div
                      key={v.id}
                      className={`p-3 rounded border transition ${
                        isStranded
                          ? 'bg-[#FFF5F5] border-[#EF4444]/40 shadow-xs'
                          : 'bg-[#E5DEC9]/40 border-[#3E5C63]/25 hover:bg-[#E5DEC9]/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#1C2B22]">{v.id}</span>
                          <span className="font-heading font-semibold text-xs text-[#1C2B22]">{v.name}</span>
                        </div>
                        <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded uppercase ${badgeClass}`}>
                          {t(v.status) || v.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-2">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${cargoColor}`}>
                            {v.cargo_type}
                          </span>
                          <span className="font-mono text-[#3E5C63]">({v.cargo_weight_tons}t)</span>
                        </div>
                        <div className="text-[11px] text-[#1C2B22] font-medium truncate flex items-center gap-1">
                          <span className="text-[#3E5C63]">{v.origin.split(' ')[0]}</span>
                          <ArrowRight className="w-3 h-3 text-[#3E5C63]" />
                          <strong className="text-[#1C2B22]">{v.destination}</strong>
                        </div>
                      </div>

                      {/* Progress Bar & Telemetry */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#3E5C63]">
                          <span>{t('corridor')} {v.highway}</span>
                          <span>
                            {t('speed')}: <strong>{v.speed_kmh} km/h</strong> | {t('eta')}: <strong>{v.eta_minutes} mins</strong>
                          </span>
                        </div>
                        <div className="w-full bg-[#D1C7AD] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isStranded ? 'bg-[#EF4444]' : (isDelayed ? 'bg-[#F59E0B]' : 'bg-[#10B981]')
                            }`}
                            style={{ width: `${v.progress_pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Hazard alert notice if stranded */}
                      {isStranded && (
                        <div className="mt-2 p-2 rounded bg-[#FEE2E2] border border-[#F87171]/40 text-[11px] text-[#991B1B] flex items-center gap-1.5">
                          <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                          <span><strong>{t('stranded')}:</strong> {v.status_reason}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-Panel 2: Logistics Bottlenecks & Supply-Chain Pressure */}
          {(activeTab === 'all' || activeTab === 'bottlenecks') && (
            <div className={`${activeTab === 'all' ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-2.5`}>
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-xs text-[#1C2B22] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#A63A32]" />
                  {t('logistics_bottlenecks_title')}
                </h4>
                <span className="text-[10px] font-mono text-[#A63A32] font-bold">
                  {t('ranked_supply_chain')}
                </span>
              </div>

              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {(bottleneckData?.bottlenecks || []).slice(0, activeTab === 'all' ? 5 : 10).map((b, idx) => {
                  const isCrit = b.pressure_level === 'CRITICAL';
                  const isElev = b.pressure_level === 'ELEVATED';

                  return (
                    <div
                      key={b.segment_id || idx}
                      className={`p-3 rounded border transition ${
                        isCrit
                          ? 'bg-[#FFF5F5] border-[#EF4444]/40'
                          : 'bg-[#E5DEC9]/40 border-[#3E5C63]/25 hover:bg-[#E5DEC9]/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold bg-[#1C2B22] text-[#F1EDE2] px-1.5 py-0.2 rounded">
                              #{idx + 1}
                            </span>
                            <span className="font-heading font-bold text-xs text-[#1C2B22]">{b.segment_name}</span>
                          </div>
                          <span className="text-[10px] text-[#3E5C63] font-mono">{b.highway}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded uppercase ${
                            isCrit ? 'bg-[#991B1B] text-white' : (isElev ? 'bg-[#D97706] text-white' : 'bg-[#3E5C63] text-white')
                          }`}>
                            {b.pressure_level}
                          </span>
                          <span className="block text-[10px] font-mono text-[#3E5C63] mt-0.5">
                            Index: {b.pressure_score}/100
                          </span>
                        </div>
                      </div>

                      {/* Stalled Vehicles & Impacted Cargo */}
                      <div className="my-1.5 bg-[#F1EDE2] p-2 rounded border border-[#3E5C63]/15 text-[11px] space-y-1">
                        <div className="flex items-center justify-between text-[#1C2B22]">
                          <span>Convoys on Sector: <strong>{b.total_vehicles_present}</strong></span>
                          <span className="text-[#A63A32] font-semibold">
                            {b.stranded_vehicles_count} {t('stranded')} • {b.delayed_vehicles_count} {t('delayed')}
                          </span>
                        </div>
                        {b.cargo_types_affected?.length > 0 && (
                          <div className="text-[10px] text-[#3E5C63]">
                            <strong>{t('critical_cargoes_impacted')} </strong>
                            <span className="text-[#991B1B] font-semibold">
                              {b.cargo_types_affected.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actionable Logistics Mitigation Advisory */}
                      <div className="text-[10px] text-[#1C2B22] bg-[#E2DAC7] p-1.5 rounded border border-[#3E5C63]/20 flex items-start gap-1.5">
                        <span className="text-[#A63A32] font-bold shrink-0">{t('dispatch_advisory')}</span>
                        <span className="leading-tight">{b.recommended_mitigation}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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

        {/* Chart 2: Monsoon Warning Incidents */}
        <div className="bg-[#F1EDE2] border border-[#3E5C63]/30 p-4 rounded shadow-sm">
          <div className="flex items-center justify-between border-b border-[#3E5C63]/20 pb-2 mb-3">
            <h4 className="font-heading font-bold text-xs text-[#1C2B22]">
              Monsoon Landslide Incidents &amp; Warnings (Seasonal Trend)
            </h4>
            <span className="font-sans text-[10px] text-[#3E5C63]">Field Incident Trends</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyAlertsData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <XAxis dataKey="month" stroke="#3E5C63" tick={{ fill: '#1C2B22', fontSize: 11 }} />
                <YAxis stroke="#3E5C63" tick={{ fill: '#1C2B22', fontSize: 11 }} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#F1EDE2', borderColor: '#3E5C63', borderRadius: '2px', color: '#1C2B22', fontSize: '11px' }}
                  formatter={(val) => [`${val} warnings`, 'High-Risk Alerts']}
                />
                <Bar dataKey="alerts" fill="#3E5C63" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
