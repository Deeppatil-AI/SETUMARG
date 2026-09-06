import React from 'react';
import { BookOpen, X, Check, Shield, PhoneCall, CloudRain, MapPin, Database, Info } from 'lucide-react';

export default function ResearchModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const citations = [
    {
      title: "Himalayan Landslide Susceptibility Modeling",
      authors: "Geological Survey of India (GSI) & Published Himalayan Research",
      framework: "12-Factor Conditioning Methodology (Slope, Faults, Drainage, Lithology, Soil, NDVI)",
      auc: "Model Self-Consistency: 91.5%",
      description: "GSI and peer-reviewed Eastern Himalaya research (such as the Dibang Valley study) define the geotechnical methodology: 12 conditioning factors including slope inclination, proximity to active thrust faults (MCT/MBT/Dauki), stream drainage incision, and lithology. Note on 91.5% accuracy: This 91.5% score (0.91 AUC) is our own machine learning model's internal self-consistency result on a synthetic dataset calibrated to match those published feature-importance patterns. It is an engineering verification that our algorithm learned the factors correctly, NOT a GSI-validated field accuracy figure on real disaster records."
    },
    {
      title: "Real-Time Satellite Rain & Meteorological Early Warning",
      authors: "Open-Meteo Live API, NASA GPM IMERG & IMD",
      framework: "Live District Rainfall Ingestion fused with Slope Weakness Matrix",
      auc: "NASA LHASA Pattern + Live API",
      description: "When heavy monsoon clouds burst over mountain ranges, rain soaks into hillsides. Setumarg automatically ingests live rainfall observations and 48-hour forecasts from Open-Meteo across 33 NER district centroids every 15 minutes, multiplying base slope susceptibility by real-time precipitation to elevate highway danger tiers before mudslides strike."
    },
    {
      title: "Village Isolation & Hospital Travel Tracking",
      authors: "World Bank Rural Access Index (RAI) & Emergency Health Access",
      framework: "True Mountain Road Travel Time vs. Misleading Straight-Line Distance",
      auc: "Eliminates 19% Mountain Bias",
      description: "Straight lines on maps look deceptively close in mountain valleys. Setumarg measures actual road travel times to primary health centers and district hospitals. If a landslide strikes the only connecting road, the village is immediately flagged as cut-off."
    },
    {
      title: "Historical Hotspot Disruption Prediction",
      authors: "Empirical Disaster Records & Calibrated Logistic Failure Thresholds",
      framework: "Critical 24-48h Rainfall Triggers (Sonapur, Teesta, Phesama, Tengnoupal, Roing)",
      auc: "Empirical Hotspot Model",
      description: "For notoriously vulnerable choke points with repeated historical blockages, Setumarg benchmarks live 24-48 hour forecast rainfall accumulation against documented critical failure thresholds (42-52 mm/24h) to predict localized disruption probability."
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
                Official road safety guidance, live meteorological early warning, and Himalayan terrain models
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#3E5C63] hover:text-[#1C2B22] p-1 font-mono font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body: Citations + Data Provenance */}
        <div className="space-y-3 overflow-y-auto pr-1">
          {citations.map((c, i) => (
            <div key={i} className="bg-[#E5DEC9]/60 p-3 rounded border border-[#3E5C63]/25 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-heading font-bold text-xs text-[#1C2B22]">
                  {c.title}
                </h4>
                <span className="font-mono text-[10px] font-bold text-[#1C2B22] bg-[#F1EDE2] px-2 py-0.5 rounded border border-[#3E5C63]/30 shrink-0">
                  {c.auc}
                </span>
              </div>
              <div className="text-[11px] text-[#3E5C63]">
                <strong>Methodology: </strong>{c.authors} | <span className="font-mono text-[10px]">{c.framework}</span>
              </div>
              <p className="text-[#1C2B22] text-[11px] leading-relaxed pt-0.5">
                {c.description}
              </p>
            </div>
          ))}

          {/* Visible Data Provenance Section (from docs/data-sources.md) */}
          <div className="bg-[#E2DAC7] p-3.5 rounded border border-[#3E5C63]/30 space-y-2.5 mt-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#1C2B22]" />
              <h4 className="font-heading font-bold text-xs text-[#1C2B22]">
                Data Provenance &amp; National Production API Mapping
              </h4>
              <span className="ml-auto text-[10px] font-mono bg-[#1C2B22] text-[#F1EDE2] px-2 py-0.5 rounded font-medium">
                Live Weather + Real SRTM 30m + Seeded Infrastructure
              </span>
            </div>
            
            <p className="text-[11px] text-[#3E5C63] leading-snug">
              Per <code>docs/data-sources.md</code>, Setumarg fuses <strong>live public weather feeds</strong>, <strong>NASA satellite elevation models</strong>, and <strong>real OpenStreetMap geometries</strong> with realistic seeded infrastructure layers. In full production deployment, each layer maps directly into official national portals:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
              <div className="bg-[#F1EDE2] p-2.5 rounded border border-[#3E5C63]/20">
                <div className="flex items-center justify-between font-mono font-bold text-[#1C2B22] mb-1">
                  <span>Rainfall &amp; Live Meteorology</span>
                  <span className="text-[#15803D] bg-[#DCFCE7] px-1.5 py-0.5 rounded text-[9px]">Live Open-Meteo Ingestion</span>
                </div>
                <p className="text-[#3E5C63] leading-tight">
                  <strong className="text-[#1C2B22]">Operational:</strong> Live precipitation observations &amp; 48h forecasts across 33 NER district centroids (15-min background sync). Manual scrubber remains available for scenario testing.
                </p>
              </div>

              <div className="bg-[#F1EDE2] p-2.5 rounded border border-[#3E5C63]/20">
                <div className="flex items-center justify-between font-mono font-bold text-[#1C2B22] mb-1">
                  <span>Slope, Aspect &amp; Elevation</span>
                  <span className="text-[#15803D] bg-[#DCFCE7] px-1.5 py-0.5 rounded text-[9px]">Real NASA SRTM 30m Stencil</span>
                </div>
                <p className="text-[#3E5C63] leading-tight">
                  <strong className="text-[#1C2B22]">Derived:</strong> Computed from real 5-point elevation differences via OpenTopoData/SRTM 30m across all 415 segments (cached locally).
                </p>
              </div>

              <div className="bg-[#F1EDE2] p-2.5 rounded border border-[#3E5C63]/20">
                <div className="flex items-center justify-between font-mono font-bold text-[#1C2B22] mb-1">
                  <span>Disruption Predictions</span>
                  <span className="text-[#15803D] bg-[#DCFCE7] px-1.5 py-0.5 rounded text-[9px]">Historical Failure Model</span>
                </div>
                <p className="text-[#3E5C63] leading-tight">
                  <strong className="text-[#1C2B22]">Calibrated:</strong> Empirical failure thresholds (42-52 mm/24h) for repeat hotspots (Sonapur, Teesta, Phesama, Tengnoupal, Roing) producing 24-48h disruption likelihoods.
                </p>
              </div>

              <div className="bg-[#F1EDE2] p-2.5 rounded border border-[#3E5C63]/20">
                <div className="flex items-center justify-between font-mono font-bold text-[#1C2B22] mb-1">
                  <span>Road Segments &amp; Geometries</span>
                  <span className="text-[#15803D] bg-[#DCFCE7] px-1.5 py-0.5 rounded text-[9px]">Real OSM Highway Paths</span>
                </div>
                <p className="text-[#3E5C63] leading-tight">
                  <strong className="text-[#1C2B22]">Production Target:</strong> <strong>MoRTH GIS Portal</strong> &amp; <strong>PM GatiShakti NMP</strong> (1,600+ unified geospatial layers).
                </p>
              </div>

              <div className="bg-[#F1EDE2] p-2.5 rounded border border-[#3E5C63]/20">
                <div className="flex items-center justify-between font-mono font-bold text-[#1C2B22] mb-1">
                  <span>Faults, Drainage &amp; Soil</span>
                  <span className="text-[#854D0E] bg-[#FEF08A] px-1.5 py-0.5 rounded text-[9px]">Seeded Geotechnical</span>
                </div>
                <p className="text-[#3E5C63] leading-tight">
                  <strong className="text-[#1C2B22]">Production Target:</strong> <strong>GSI Bhukosh</strong> (NLSM 1:50k geology) &amp; GSI Seismo-Tectonic Atlas fault lineaments.
                </p>
              </div>

              <div className="bg-[#F1EDE2] p-2.5 rounded border border-[#3E5C63]/20">
                <div className="flex items-center justify-between font-mono font-bold text-[#1C2B22] mb-1">
                  <span>Villages &amp; Hospital Access</span>
                  <span className="text-[#854D0E] bg-[#FEF08A] px-1.5 py-0.5 rounded text-[9px]">25 Seeded Settlements</span>
                </div>
                <p className="text-[#3E5C63] leading-tight">
                  <strong className="text-[#1C2B22]">Production Target:</strong> <strong>PMGSY Rural Roads Geoportal</strong> &amp; <strong>Census 2011 Village Directory</strong> (World Bank RAI isochrones).
                </p>
              </div>

              <div className="bg-[#F1EDE2] p-2.5 rounded border border-[#3E5C63]/20 sm:col-span-2">
                <div className="flex items-center justify-between font-mono font-bold text-[#1C2B22] mb-1">
                  <span>Multi-Modal Freight &amp; Waterway Deflection</span>
                  <span className="text-[#854D0E] bg-[#FEF08A] px-1.5 py-0.5 rounded text-[9px]">Seeded Hubs &amp; Tariffs</span>
                </div>
                <p className="text-[#3E5C63] leading-tight">
                  <strong className="text-[#1C2B22]">Production Target:</strong> <strong>ULIP</strong> (Unified Logistics Interface Platform v2.4 contracts) &amp; <strong>IWAI</strong> National Waterway 2 Brahmaputra Terminal APIs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-3 pt-2.5 border-t border-[#3E5C63]/20 flex items-center justify-between text-[11px] text-[#3E5C63]">
          <span className="font-mono">Detailed technical documentation: /docs/data-sources.md</span>
          <button
            onClick={onClose}
            className="bg-[#1C2B22] hover:bg-[#2A3F33] text-[#F1EDE2] px-4 py-1.5 rounded font-heading font-semibold transition shadow-sm"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
