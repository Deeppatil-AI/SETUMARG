import React from 'react';
import { Shield, Sparkles, Navigation, CloudRain, Hospital, Truck, X, ArrowRight, BookOpen } from 'lucide-react';
import { getTranslation } from '../i18n';

export default function AboutModal({ isOpen, onClose, onOpenResearch, currentLanguage = 'en' }) {
  if (!isOpen) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem('setumarg_about_seen', 'true');
    } catch (e) {
      // ignore
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C2B22]/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#F1EDE2] text-[#1C2B22] border-2 border-[#3E5C63] rounded-lg max-w-xl w-full p-6 shadow-2xl relative text-xs flex flex-col space-y-4">
        {/* Close Button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-[#3E5C63] hover:text-[#1C2B22] p-1 transition"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-[#A63A32] text-[#F1EDE2] font-mono font-bold text-[10px] tracking-wide uppercase">
            Smart India Hackathon 2026 &bull; PS SIH26002
          </span>
          <span className="text-[10px] font-mono text-[#3E5C63]">
            Ministry of DoNER / MoRTH
          </span>
        </div>

        {/* Title */}
        <div>
          <h2 className="font-heading font-bold text-xl text-[#1C2B22] flex items-center gap-2">
            <span>Welcome to Setumarg (सेतुमार्ग)</span>
          </h2>
          <p className="text-[#3E5C63] text-xs mt-0.5 font-medium">
            AI Smart Mountain Road Safety &amp; Emergency Travel Intelligence for North East India
          </p>
        </div>

        {/* 2-3 Plain Sentences for Judges */}
        <div className="bg-[#E5DEC9] p-4 rounded border border-[#3E5C63]/30 space-y-2 text-[#1C2B22] text-xs leading-relaxed">
          <p>
            <strong>1. Predicts Landslides Before They Strike:</strong> Setumarg monitors mountain highway conditions in real time, fusing real Himalayan terrain models (slope, soil, rock faults) with live satellite rainfall to forecast road closures.
          </p>
          <p>
            <strong>2. Prevents Drivers From Getting Trapped:</strong> When heavy rain or mudslides block a highway, it automatically reroutes supply trucks and ambulances onto safe valley bypasses mid-journey.
          </p>
          <p>
            <strong>3. Protects Cut-Off Villages:</strong> For remote hill settlements, it tracks true hospital drive times and sends automated 2G voice calls and SMS text alerts in 4 local languages—even during complete cellular internet blackouts.
          </p>
        </div>

        {/* 4 Core Pillars Grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="bg-[#F1EDE2] border border-[#3E5C63]/25 p-2.5 rounded flex items-start gap-2">
            <div className="p-1.5 rounded bg-[#0284C7] text-white shrink-0">
              <CloudRain className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="block text-[#1C2B22] text-[11px]">Live Rain &amp; Risk Map</strong>
              <span className="text-[10px] text-[#3E5C63] leading-tight block">Open-Meteo 33-district live nowcast &amp; 415 highway segments.</span>
            </div>
          </div>

          <div className="bg-[#F1EDE2] border border-[#3E5C63]/25 p-2.5 rounded flex items-start gap-2">
            <div className="p-1.5 rounded bg-[#5C7A4E] text-white shrink-0">
              <Navigation className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="block text-[#1C2B22] text-[11px]">Safe Route Finder</strong>
              <span className="text-[10px] text-[#3E5C63] leading-tight block">Auto-reroutes mid-route when landslides occur to avert stranding.</span>
            </div>
          </div>

          <div className="bg-[#F1EDE2] border border-[#3E5C63]/25 p-2.5 rounded flex items-start gap-2">
            <div className="p-1.5 rounded bg-[#A63A32] text-white shrink-0">
              <Hospital className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="block text-[#1C2B22] text-[11px]">Village Access (RAI)</strong>
              <span className="text-[10px] text-[#3E5C63] leading-tight block">Hospital isolation scores &amp; 4-language 2G SMS/IVR alerts.</span>
            </div>
          </div>

          <div className="bg-[#F1EDE2] border border-[#3E5C63]/25 p-2.5 rounded flex items-start gap-2">
            <div className="p-1.5 rounded bg-[#D97706] text-white shrink-0">
              <Truck className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="block text-[#1C2B22] text-[11px]">Fleet &amp; Bottlenecks</strong>
              <span className="text-[10px] text-[#3E5C63] leading-tight block">Tracks essential convoys (medicines/food) &amp; multimodal options.</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-[#3E5C63]/20 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              handleDismiss();
              if (onOpenResearch) onOpenResearch();
            }}
            className="flex items-center gap-1.5 text-[11px] font-sans text-[#3E5C63] hover:text-[#1C2B22] font-semibold"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Technical Guide &amp; Data Provenance</span>
          </button>

          <button
            onClick={handleDismiss}
            className="bg-[#1C2B22] hover:bg-[#2A3F33] text-[#F1EDE2] px-4 py-2 rounded font-heading font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <span>Explore Platform</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
