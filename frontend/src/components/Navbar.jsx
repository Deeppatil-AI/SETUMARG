import React from 'react';
import Logo from './Logo';
import { 
  ShieldAlert, 
  CloudRain, 
  MapPin, 
  Route, 
  BarChart3, 
  BookOpen, 
  Radio, 
  AlertTriangle, 
  PhoneCall,
  Globe
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, getTranslation } from '../i18n';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  nowcastData, 
  onScenarioChange, 
  onSliderChange,
  openReportModal,
  openResearchModal,
  openAboutModal,
  currentLanguage = 'en',
  onLanguageChange
}) {
  const t = (key) => getTranslation(currentLanguage, key);
  const mult = nowcastData?.current_multiplier || 1.0;
  const intensity = nowcastData?.current_rainfall_intensity || 18.5;
  const activeScenario = nowcastData?.current_scenario || 'monsoon_moderate';
  const blockedCount = nowcastData?.blocked_segments_count || 0;

  // High-contrast indicator colors
  const scrubberColor = mult > 2.0 ? '#F87171' : (mult > 1.2 ? '#FBBF24' : '#4ADE80');

  return (
    <header className="bg-[#142319] text-[#F1EDE2] border-b border-[#2D4535] sticky top-0 z-50 shadow-md">
      {/* Top Official Public Service Collar Strip */}
      <div className="border-b border-[#253A2C] px-4 py-1.5 flex flex-wrap items-center justify-between text-xs font-mono bg-[#0F1B13]">
        <div className="flex items-center gap-3">
          <span className="bg-[#1E3827] text-[#6EE7B7] border border-[#34D399]/40 font-bold px-2.5 py-0.5 rounded text-[11px] tracking-wide flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse"></span>
            {t('public_safety_service')}
          </span>
          <span className="text-[#3A5644]">|</span>
          <span className="text-[#E5DEC9] font-medium text-xs hidden sm:inline">
            {t('portal_subtitle')}
          </span>
          <span className="text-[#3A5644] hidden md:inline">|</span>
          <span className="text-[#93C5FD] font-mono text-[11px] hidden md:flex items-center gap-1">
            <PhoneCall className="w-3 h-3 text-[#38BDF8]" />
            {t('helpline')}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-1 sm:mt-0">
          {nowcastData?.is_live_mode ? (
            <span className="flex items-center gap-1.5 bg-[#1E3827] border border-[#34D399]/40 text-[#6EE7B7] px-2 py-0.5 rounded text-[11px] font-mono shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse"></span>
              {t('live_synced')}
            </span>
          ) : (
            <button 
              onClick={() => onScenarioChange && onScenarioChange('live_weather')}
              className="flex items-center gap-1 bg-[#422006] border border-[#F59E0B]/50 text-[#FDE68A] px-2 py-0.5 rounded text-[10px] font-mono hover:bg-[#78350F] transition"
              title="Click to resume real live weather mode"
            >
              <span>{t('scenario_mode')}</span>
            </button>
          )}

          {blockedCount > 0 && (
            <span className="flex items-center gap-1.5 bg-[#5C1914] border border-[#EF4444]/60 text-[#FECACA] px-2.5 py-0.5 rounded text-xs font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping"></span>
              {blockedCount} {t('roads_blocked')}
            </span>
          )}
          <button 
            onClick={openAboutModal}
            className="text-[#93C5FD] hover:text-white underline decoration-[#38BDF8]/60 hover:decoration-[#38BDF8] text-xs font-sans transition flex items-center gap-1 font-semibold"
            title="Overview of Setumarg for judges and new users"
          >
            <span>About Setumarg</span>
          </button>
          <span className="text-[#3A5644]">|</span>
          <button 
            onClick={openResearchModal}
            className="text-[#E2DAC7] hover:text-white underline decoration-[#4ADE80]/50 hover:decoration-[#4ADE80] text-xs font-sans transition"
          >
            {t('safety_handbook')}
          </button>
        </div>
      </div>

      {/* Main Operations Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Designation */}
        <div className="flex items-center gap-3">
          <Logo size={42} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-xl font-bold tracking-tight text-[#FFFFFF]">
                {t('portal_title')}
              </span>
              <span className="font-mono text-[10px] tracking-wider text-[#6EE7B7] bg-[#1E3827] px-2 py-0.5 rounded border border-[#34D399]/30 font-bold">
                {t('portal_badge')}
              </span>
            </div>
            <p className="text-xs text-[#E5DEC9] font-sans mt-0.5 font-normal">
              {t('portal_tagline')}
            </p>
          </div>
        </div>

        {/* Live Monsoon Nowcast Scrubber */}
        <div className="bg-[#0F1B13] border border-[#2D4535] rounded-lg px-4 py-2 flex items-center gap-4 text-xs font-sans shadow-inner">
          <div className="flex items-center gap-2.5">
            <CloudRain className="w-4 h-4 shrink-0" style={{ color: scrubberColor }} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#E5DEC9] font-medium">{t('rainfall')}</span>
                <span className="font-mono font-bold text-white text-sm">{intensity} mm/hr</span>
              </div>
              <span className="font-mono text-[11px] text-[#A7F3D0] block">
                {t('rain_level')} <strong className="font-bold text-sm" style={{ color: scrubberColor }}>{mult.toFixed(1)}x {mult > 2.0 ? `(${t('heavy_storm')})` : mult > 1.2 ? `(${t('active_rain')})` : `(${t('normal')})`}</strong>
              </span>
            </div>
          </div>

          {/* Slider with Smooth Live Feedback */}
          <div className="w-32 sm:w-36 flex flex-col justify-center">
            <input 
              type="range" 
              min="0.2" 
              max="3.5" 
              step="0.1" 
              value={mult}
              onChange={(e) => onSliderChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#253A2C] rounded-lg appearance-none cursor-pointer accent-[#FBBF24]"
              title="Change rainfall level to test road danger"
            />
            <div className="flex justify-between text-[9px] font-mono mt-1">
              <span className="text-[#CBD5E1]">Dry</span>
              <span className="text-[#E2E8F0]">Normal</span>
              <span className="text-[#F87171] font-semibold">Heavy Storm</span>
            </div>
          </div>

          {/* Quick Scenario Buttons */}
          <div className="hidden lg:flex items-center gap-1.5 border-l border-[#2D4535] pl-3 font-mono text-[11px]">
            <button
              onClick={() => onScenarioChange('dry_clear')}
              className={`px-2.5 py-1 rounded transition border ${
                activeScenario === 'dry_clear' 
                  ? 'bg-[#374151] text-white font-bold border-white/50 shadow-sm' 
                  : 'bg-[#1F2937]/70 text-[#CBD5E1] hover:bg-[#374151] border-gray-600/40'
              }`}
            >
              {t('dry_weather')}
            </button>
            <button
              onClick={() => onScenarioChange('monsoon_moderate')}
              className={`px-2.5 py-1 rounded transition border ${
                activeScenario === 'monsoon_moderate' 
                  ? 'bg-[#2563EB] text-white font-bold border-blue-300/60 shadow-sm' 
                  : 'bg-[#1E3A5F]/70 text-[#93C5FD] hover:bg-[#2563EB]/80 border-blue-700/40'
              }`}
            >
              {t('normal_monsoon')}
            </button>
            <button
              onClick={() => onScenarioChange('cloudburst_extreme')}
              className={`px-2.5 py-1 rounded transition border ${
                activeScenario === 'cloudburst_extreme' 
                  ? 'bg-[#DC2626] text-white font-bold border-red-300/60 shadow-sm' 
                  : 'bg-[#7F1D1D]/70 text-[#FCA5A5] hover:bg-[#DC2626]/80 border-red-700/40'
              }`}
            >
              {t('heavy_cloudburst')}
            </button>
          </div>
        </div>

        {/* Language Selector & Action Button */}
        <div className="flex items-center gap-3">
          {/* Multilingual Selector (PS26002 point h) */}
          <div className="flex items-center gap-1.5 bg-[#0F1B13] border border-[#34D399]/40 rounded-md px-2.5 py-1.5 text-xs shadow-inner">
            <Globe className="w-3.5 h-3.5 text-[#34D399]" />
            <select
              value={currentLanguage}
              onChange={(e) => onLanguageChange && onLanguageChange(e.target.value)}
              className="bg-transparent text-[#F1EDE2] text-xs font-medium outline-none cursor-pointer"
              title="Select Language / ভাষা নিৰ্বাচন / भाषा चुनें"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-[#142319] text-[#F1EDE2]">
                  {l.native} ({l.label})
                </option>
              ))}
            </select>
          </div>

          {/* Action Button: Citizen/Field Incident Report */}
          <button
            onClick={openReportModal}
            className="flex items-center gap-2 bg-[#B91C1C] hover:bg-[#DC2626] border border-[#F87171]/50 text-white font-heading font-bold text-xs px-4 py-2 rounded-md shadow hover:shadow-md transition"
          >
            <Radio className="w-3.5 h-3.5 text-white" />
            {t('report_blocked_road')}
          </button>
        </div>
      </div>

      {/* Navigation Ledger Tabs (Cartographic Tabs) */}
      <div className="max-w-7xl mx-auto px-4 border-t border-[#253A2C] bg-[#101E15] flex items-center overflow-x-auto no-scrollbar gap-1.5 py-1.5 font-sans text-xs">
        {[
          { id: 'map', labelKey: 'tab_map', defaultLabel: 'Live Road & Landslide Map', icon: MapPin },
          { id: 'accessibility', labelKey: 'tab_accessibility', defaultLabel: 'Village Hospital Access', icon: ShieldAlert },
          { id: 'routing', labelKey: 'tab_routing', defaultLabel: 'Safe Route Finder', icon: Route },
          { id: 'dashboard', labelKey: 'tab_dashboard', defaultLabel: 'Emergency & Status Summary', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs whitespace-nowrap transition font-medium ${
                isActive
                  ? 'bg-[#F1EDE2] text-[#1C2B22] font-heading font-bold shadow-sm'
                  : 'text-[#E5DEC9] hover:text-white hover:bg-[#203628]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#1C2B22]' : 'text-[#6EE7B7]'}`} />
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>
    </header>
  );
}
