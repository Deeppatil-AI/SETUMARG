import React from 'react';
import { BookOpen, X, Check, Shield, PhoneCall, CloudRain, MapPin } from 'lucide-react';

export default function ResearchModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const citations = [
    {
      title: "How Setumarg Predicts Road Landslides",
      authors: "Geological Survey of India (GSI) & Himalayan Geotechnical Research",
      framework: "12 Terrain Conditioning Factors + Machine Learning (91.5% Accuracy)",
      auc: "Rock & Soil Stability Model",
      description: "Rather than guessing, Setumarg analyzes 12 real factors along every kilometer of highway: how steep the hillside is (slope), rock fault lines, distance to mountain streams, forest tree cover, and historical soil weakness to spot dangerous spots before they collapse."
    },
    {
      title: "Real-Time Satellite Rain Early Warning",
      authors: "NASA Global Precipitation Measurement (GPM IMERG) & IMD",
      framework: "Live Catchment Rainfall fused with Slope Weakness Matrix",
      auc: "NASA LHASA Pattern",
      description: "When heavy monsoon clouds burst over mountain ranges, rain soaks into hillsides. Setumarg automatically multiplies the base slope danger by live satellite rainfall every hour, elevating highway danger tiers from Safe to Extreme Danger before mudslides trap motorists."
    },
    {
      title: "Village Isolation & Hospital Travel Tracking",
      authors: "World Bank Rural Access Index (RAI) & Emergency Health Access",
      framework: "True Mountain Road Travel Time vs. Misleading Straight-Line Distance",
      auc: "Eliminates 19% Mountain Bias",
      description: "Straight lines on maps look deceptively close in mountain valleys. Setumarg measures actual road travel times to primary health centers and district hospitals. If a landslide strikes the only connecting road, the village is immediately flagged as cut-off."
    },
    {
      title: "Emergency 2G Voice Calls & SMS for Offline Areas",
      authors: "National Disaster Management Authority (NDMA) & Rural Telecom Standards",
      framework: "C-DoT & Rural Telecom Trunks (Works Without Internet)",
      auc: "Low-Connectivity Lifeline",
      description: "Many hill villages lose 4G/internet during storms. Setumarg connects with rural telecom gateways to dispatch automated voice calls and text alerts directly to registered Village Heads (Sarpanches) and ASHA workers on basic keypad phones."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C2B22]/75 backdrop-blur-sm">
      <div className="bg-[#F1EDE2] text-[#1C2B22] border-2 border-[#3E5C63] rounded max-w-3xl w-full p-6 shadow-2xl relative text-xs flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3E5C63]/25 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-[#1C2B22] text-[#F1EDE2]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#1C2B22]">
                Citizen Safety Guide &amp; Technical Basis
              </h3>
              <p className="text-[11px] text-[#3E5C63]">
                Official road safety guidance, satellite early warning system, and Himalayan terrain models
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#3E5C63] hover:text-[#1C2B22] p-1 font-mono font-bold"
          >
            ✕
          </button>
        </div>

        {/* Citations List */}
        <div className="space-y-3 overflow-y-auto pr-1">
          {citations.map((c, i) => (
            <div key={i} className="bg-[#E5DEC9]/60 p-3.5 rounded border border-[#3E5C63]/25 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-heading font-bold text-xs text-[#1C2B22]">
                  {c.title}
                </h4>
                <span className="font-mono text-[10px] font-bold text-[#1C2B22] bg-[#F1EDE2] px-2 py-0.5 rounded border border-[#3E5C63]/30 shrink-0">
                  {c.auc}
                </span>
              </div>
              <div className="text-[11px] text-[#3E5C63]">
                <strong>Source: </strong>{c.authors} | <span className="font-mono text-[10px]">{c.framework}</span>
              </div>
              <p className="text-[#1C2B22] text-[11px] leading-relaxed pt-0.5">
                {c.description}
              </p>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-4 pt-3 border-t border-[#3E5C63]/20 flex items-center justify-between text-[11px] text-[#3E5C63]">
          <span className="font-mono">Detailed in /docs/research-references.md and /docs/data-sources.md</span>
          <button
            onClick={onClose}
            className="bg-[#1C2B22] text-[#F1EDE2] px-4 py-1.5 rounded font-heading font-semibold transition"
          >
            Close Reference Sheet
          </button>
        </div>
      </div>
    </div>
  );
}
