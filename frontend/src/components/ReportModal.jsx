import React, { useState } from 'react';
import { Radio, X, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function ReportModal({ 
  isOpen, 
  onClose, 
  pinnedLocation, 
  onStartPinDrop,
  onSubmitReport 
}) {
  if (!isOpen) return null;

  const [hazardType, setHazardType] = useState('Debris Flow / Mudslide');
  const [severity, setSeverity] = useState('Critical');
  const [lat, setLat] = useState(pinnedLocation?.lat || 25.1098);
  const [lng, setLng] = useState(pinnedLocation?.lng || 92.3987);
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('Border Roads Organisation Patrol / Transporter');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  React.useEffect(() => {
    if (pinnedLocation) {
      setLat(pinnedLocation.lat);
      setLng(pinnedLocation.lng);
    }
  }, [pinnedLocation]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmitReport({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        hazard_type: hazardType,
        severity: severity,
        description: description || `Observed ${hazardType} obstruction requiring emergency clearance.`,
        reported_by: reporterName
      });
      setSuccessMessage('Ground hazard incident logged and map alert elevated immediately.');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1800);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C2B22]/75 backdrop-blur-sm">
      <div className="bg-[#F1EDE2] text-[#1C2B22] border-2 border-[#3E5C63] rounded max-w-lg w-full p-6 shadow-2xl relative text-xs">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#3E5C63] hover:text-[#1C2B22] p-1 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 border-b border-[#3E5C63]/20 pb-3">
          <div className="w-8 h-8 rounded bg-[#A63A32] flex items-center justify-center text-[#F1EDE2]">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-[#1C2B22]">
              Log Road Breach or Hazard Incident
            </h3>
            <p className="text-[#3E5C63] text-[11px]">
              Field Verification for NASA LHASA Nowcasting System
            </p>
          </div>
        </div>

        {successMessage ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-[#5C7A4E] mx-auto" />
            <h4 className="font-heading font-bold text-sm text-[#1C2B22]">{successMessage}</h4>
            <p className="text-[#3E5C63] text-[11px]">Connected highway vector updated with live impassable status.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Coordinates Selector */}
            <div className="bg-[#E5DEC9] p-3 rounded border border-[#3E5C63]/25">
              <div className="flex items-center justify-between mb-2">
                <span className="font-heading font-bold text-[#1C2B22] text-xs">
                  Incident Coordinates (NER Highway)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartPinDrop();
                  }}
                  className="text-[11px] font-mono text-[#3B6EA5] hover:underline font-semibold"
                >
                  Pick on Topographic Map
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <label className="text-[10px] text-[#3E5C63] block mb-0.5">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full bg-[#F1EDE2] border border-[#3E5C63]/30 rounded px-2.5 py-1.5 text-[#1C2B22] font-mono text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#3E5C63] block mb-0.5">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full bg-[#F1EDE2] border border-[#3E5C63]/30 rounded px-2.5 py-1.5 text-[#1C2B22] font-mono text-xs outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Hazard Type & Severity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#1C2B22] font-semibold text-xs block mb-1">Hazard Nature</label>
                <select
                  value={hazardType}
                  onChange={(e) => setHazardType(e.target.value)}
                  className="w-full bg-[#E5DEC9] border border-[#3E5C63]/30 rounded p-2 text-[#1C2B22] text-xs outline-none"
                >
                  <option value="Debris Flow / Mudslide">Debris Flow / Mudslide</option>
                  <option value="Rockfall & Boulder Hazard">Rockfall & Boulder Hazard</option>
                  <option value="Flash Flood / Road Submergence">Flash Flood / Road Submergence</option>
                  <option value="Road Subsidence / Slip">Road Subsidence / Slip</option>
                  <option value="Bridge Approach Washout">Bridge Approach Washout</option>
                </select>
              </div>
              <div>
                <label className="text-[#1C2B22] font-semibold text-xs block mb-1">Severity / Clearance</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-[#E5DEC9] border border-[#3E5C63]/30 rounded p-2 text-[#1C2B22] text-xs outline-none font-semibold text-[#A63A32]"
                >
                  <option value="Impassable">Impassable (Total Traffic Halved)</option>
                  <option value="Critical">Critical (Severe Bottleneck)</option>
                  <option value="Moderate">Moderate (Single Lane Escort)</option>
                  <option value="Minor">Minor (Passable with Caution)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[#1C2B22] font-semibold text-xs block mb-1">On-Ground Situation Report</label>
              <textarea
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Sonapur tunnel portal blocked by 40m debris fan following intense morning rain. BRO bulldozers mobilizing."
                className="w-full bg-[#E5DEC9] border border-[#3E5C63]/30 rounded p-2 text-[#1C2B22] text-xs outline-none"
                required
              ></textarea>
            </div>

            {/* Reporter Name */}
            <div>
              <label className="text-[#1C2B22] font-semibold text-xs block mb-1">Reporter Affiliation</label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full bg-[#E5DEC9] border border-[#3E5C63]/30 rounded p-2 text-[#1C2B22] text-xs outline-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#A63A32] hover:bg-[#8F2F28] text-[#F1EDE2] font-heading font-bold py-2.5 rounded transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Logging Incident...' : 'Log Road Incident & Elevate Alert'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
