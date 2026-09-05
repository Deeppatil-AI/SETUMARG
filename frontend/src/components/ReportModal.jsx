import React, { useState } from 'react';
import { Radio, X, MapPin, Send, CheckCircle2, Camera, Image, Upload } from 'lucide-react';

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
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  React.useEffect(() => {
    if (pinnedLocation) {
      setLat(pinnedLocation.lat);
      setLng(pinnedLocation.lng);
    }
  }, [pinnedLocation]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

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
        reported_by: reporterName,
        photo_url: photoUrl.trim() || undefined
      });
      setSuccessMessage('Ground hazard incident logged and map alert elevated immediately.');
      setTimeout(() => {
        setSuccessMessage(null);
        setPhotoUrl('');
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
              Report a Blocked Road or Landslide
            </h3>
            <p className="text-[#3E5C63] text-[11px]">
              Helps drivers, ambulances, and village teams know immediately
            </p>
          </div>
        </div>

        {successMessage ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-[#5C7A4E] mx-auto" />
            <h4 className="font-heading font-bold text-sm text-[#1C2B22]">{successMessage}</h4>
            <p className="text-[#3E5C63] text-[11px]">Warning flags added to this highway section immediately.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Coordinates Selector */}
            <div className="bg-[#E5DEC9] p-3 rounded border border-[#3E5C63]/25">
              <div className="flex items-center justify-between mb-2">
                <span className="font-heading font-bold text-[#1C2B22] text-xs">
                  Road Location Coordinates
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartPinDrop();
                  }}
                  className="text-[11px] font-sans text-[#3B6EA5] hover:underline font-semibold"
                >
                  Click on Map to Pick Location
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
                <label className="text-[#1C2B22] font-semibold text-xs block mb-1">What is blocking the road?</label>
                <select
                  value={hazardType}
                  onChange={(e) => setHazardType(e.target.value)}
                  className="w-full bg-[#E5DEC9] border border-[#3E5C63]/30 rounded p-2 text-[#1C2B22] text-xs outline-none font-sans"
                >
                  <option value="Mudslide / Landslide">Mudslide / Landslide</option>
                  <option value="Falling Rocks / Boulders">Falling Rocks / Boulders</option>
                  <option value="Flooding / Road Submerged">Flooding / Water Over Road</option>
                  <option value="Road Cracked / Sinking">Road Cracked / Sinking</option>
                  <option value="Broken Bridge / Approach Washout">Broken Bridge / Approach Washout</option>
                </select>
              </div>
              <div>
                <label className="text-[#1C2B22] font-semibold text-xs block mb-1">Can vehicles pass through?</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-[#E5DEC9] border border-[#3E5C63]/30 rounded p-2 text-[#1C2B22] text-xs outline-none font-sans font-semibold text-[#A63A32]"
                >
                  <option value="Impassable">Completely Blocked (No Vehicles)</option>
                  <option value="Critical">Heavy Blockage (Severe Danger)</option>
                  <option value="Moderate">One Lane Only (Slow Passing)</option>
                  <option value="Minor">Small Stones / Drive Carefully</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[#1C2B22] font-semibold text-xs block mb-1">Describe What Happened</label>
              <textarea
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Sonapur tunnel entrance blocked by mud and rocks after morning rain. Vehicles cannot pass."
                className="w-full bg-[#E5DEC9] border border-[#3E5C63]/30 rounded p-2 text-[#1C2B22] text-xs outline-none"
                required
              ></textarea>
            </div>

            {/* Reporter Name */}
            <div>
              <label className="text-[#1C2B22] font-semibold text-xs block mb-1">Your Name / Role (Optional)</label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="e.g. Local Driver / Village Resident / BRO Officer"
                className="w-full bg-[#E5DEC9] border border-[#3E5C63]/30 rounded p-2 text-[#1C2B22] text-xs outline-none font-sans"
              />
            </div>

            {/* Geo-tagged Photo Field */}
            <div className="bg-[#E5DEC9] p-2.5 rounded border border-[#3E5C63]/25 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[#1C2B22] font-semibold text-xs flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#3E5C63]" />
                  Attach Incident Photo (Geo-tagged Field Evidence)
                </label>
                <span className="text-[10px] text-[#3E5C63] font-mono">Optional</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer flex items-center gap-1.5 bg-[#F1EDE2] hover:bg-white text-[#1C2B22] px-3 py-1.5 rounded border border-[#3E5C63]/30 text-xs font-medium transition shadow-xs shrink-0">
                  <Upload className="w-3 h-3 text-[#3E5C63]" />
                  Choose File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-[10px] text-[#3E5C63] font-mono shrink-0">or URL:</span>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://... or choose photo above"
                  className="flex-1 min-w-0 bg-[#F1EDE2] border border-[#3E5C63]/30 rounded px-2.5 py-1.5 text-[#1C2B22] text-xs outline-none"
                />
              </div>

              {photoUrl && (
                <div className="flex items-center gap-2 pt-1.5 border-t border-[#3E5C63]/15">
                  <img
                    src={photoUrl}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded border border-[#3E5C63]/40 shadow-xs shrink-0"
                  />
                  <div className="flex-1 text-[10px] text-[#3E5C63] truncate">
                    Photo attached &bull; Ready to submit with report
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="text-[#A63A32] hover:underline text-[10px] font-bold shrink-0"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#A63A32] hover:bg-[#8F2F28] text-[#F1EDE2] font-heading font-bold py-2.5 rounded transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Submitting Report...' : 'Submit Road Block Report Now'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
