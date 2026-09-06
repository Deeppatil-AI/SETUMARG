import React, { useState, useEffect } from 'react';
import { Radio, X, MapPin, Send, CheckCircle2, Camera, Image, Upload, Wifi, WifiOff, CloudOff, RefreshCw } from 'lucide-react';
import { getTranslation } from '../i18n';

export default function ReportModal({ 
  isOpen, 
  onClose, 
  pinnedLocation, 
  onStartPinDrop,
  onSubmitReport,
  currentLanguage = 'en'
}) {
  if (!isOpen) return null;

  const t = (key) => getTranslation(currentLanguage, key);

  const [hazardType, setHazardType] = useState('Debris Flow / Mudslide');
  const [severity, setSeverity] = useState('Critical');
  const [lat, setLat] = useState(pinnedLocation?.lat || 25.1098);
  const [lng, setLng] = useState(pinnedLocation?.lng || 92.3987);
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('Border Roads Organisation Patrol / Transporter');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [formError, setFormError] = useState(null);

  // Offline detection & LocalStorage Queue (PS26002 point h)
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [queuedCount, setQueuedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadQueuedCount = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('setumarg_offline_reports') || '[]');
      setQueuedCount(stored.length);
    } catch (e) {
      setQueuedCount(0);
    }
  };

  useEffect(() => {
    loadQueuedCount();

    const handleOnline = () => {
      setIsOnline(true);
      triggerAutoSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerAutoSync = async () => {
    try {
      const stored = JSON.parse(localStorage.getItem('setumarg_offline_reports') || '[]');
      if (stored.length === 0) return;
      setIsSyncing(true);

      const res = await fetch('/api/reports/sync-offline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: stored })
      });

      if (res.ok) {
        localStorage.removeItem('setumarg_offline_reports');
        setQueuedCount(0);
        if (onSubmitReport) onSubmitReport(null, true); // Trigger parent refresh
      }
    } catch (err) {
      console.error('Failed auto-syncing offline reports:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  React.useEffect(() => {
    if (pinnedLocation) {
      setLat(pinnedLocation.lat);
      setLng(pinnedLocation.lng);
      setFormError(null);
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
    setFormError(null);

    // Validation: Require valid road coordinates
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (!lat || !lng || isNaN(parsedLat) || isNaN(parsedLng)) {
      setFormError('Please specify valid latitude and longitude coordinates, or click on the map.');
      return;
    }
    if (parsedLat < 20.0 || parsedLat > 32.0 || parsedLng < 85.0 || parsedLng > 98.0) {
      setFormError('Coordinates appear outside the North Eastern Region (expected Lat: 20°–32°N, Lng: 85°–98°E).');
      return;
    }

    // Validation: Reject empty or trivial description
    if (!description || description.trim().length < 5) {
      setFormError('Please enter a description of what happened (at least 5 characters).');
      return;
    }

    setIsSubmitting(true);

    const reportPayload = {
      lat: parsedLat,
      lng: parsedLng,
      hazard_type: hazardType,
      severity: severity,
      description: description.trim(),
      reported_by: reporterName.trim() || 'Citizen Reporter',
      photo_url: photoUrl.trim() || undefined
    };

    // If offline (or simulated no network), queue to LocalStorage (PS26002 point h)
    if (!isOnline || !navigator.onLine) {
      try {
        const queued = JSON.parse(localStorage.getItem('setumarg_offline_reports') || '[]');
        queued.push({
          ...reportPayload,
          offline_id: `OFFLINE-${Date.now()}`,
          queued_at: new Date().toISOString()
        });
        localStorage.setItem('setumarg_offline_reports', JSON.stringify(queued));
        setQueuedCount(queued.length);
        setSuccessMessage('Offline: Report queued locally on device. It will automatically synchronize when connectivity resumes.');
        setTimeout(() => {
          setSuccessMessage(null);
          setPhotoUrl('');
          onClose();
        }, 2200);
      } catch (e) {
        console.error('Failed caching offline report:', e);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      await onSubmitReport(reportPayload);
      setSuccessMessage('Ground hazard incident logged and map alert elevated immediately.');
      setTimeout(() => {
        setSuccessMessage(null);
        setPhotoUrl('');
        onClose();
      }, 1800);
    } catch (err) {
      // Fallback: if network request failed, queue offline
      const queued = JSON.parse(localStorage.getItem('setumarg_offline_reports') || '[]');
      queued.push({
        ...reportPayload,
        offline_id: `OFFLINE-${Date.now()}`,
        queued_at: new Date().toISOString()
      });
      localStorage.setItem('setumarg_offline_reports', JSON.stringify(queued));
      setQueuedCount(queued.length);
      setSuccessMessage('Network Glitch: Saved report locally to queue. Will auto-sync when online.');
      setTimeout(() => {
        setSuccessMessage(null);
        setPhotoUrl('');
        onClose();
      }, 2200);
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
              {t('report_modal_title')}
            </h3>
            <div className="flex items-center gap-3">
              <p className="text-[#3E5C63] text-[11px]">
                {t('report_modal_subtitle')}
              </p>
              <button 
                type="button" 
                onClick={() => setIsOnline(!isOnline)} 
                className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#3E5C63]/30 text-[#3E5C63] hover:bg-[#E5DEC9] transition"
                title="Toggle offline/online mode to test low-connectivity field sync"
              >
                {isOnline ? t('test_offline_mode') : t('restore_online')}
              </button>
            </div>
          </div>
        </div>

        {/* Offline Connectivity Status & Sync Banner (PS26002 point h) */}
        {!isOnline ? (
          <div className="bg-[#FEF3C7] border border-[#F59E0B] p-2.5 rounded flex items-center justify-between text-[#92400E] mb-3 text-[11px]">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-[#D97706] shrink-0" />
              <span>{t('offline_mode_active')}</span>
            </div>
            {queuedCount > 0 && (
              <span className="bg-[#F59E0B] text-[#78350F] font-bold px-2 py-0.5 rounded text-[10px] shrink-0">
                {queuedCount} {t('queued')}
              </span>
            )}
          </div>
        ) : (
          queuedCount > 0 && (
            <div className="bg-[#DCFCE7] border border-[#22C55E] p-2.5 rounded flex items-center justify-between text-[#15803D] mb-3 text-[11px]">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>{t('online_restored')} ({queuedCount})</span>
              </div>
              <button
                type="button"
                onClick={triggerAutoSync}
                disabled={isSyncing}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white px-2.5 py-1 rounded font-bold text-[10px] flex items-center gap-1 transition shrink-0"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? t('syncing') : t('sync_now')}
              </button>
            </div>
          )
        )}

        {successMessage ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-[#5C7A4E] mx-auto" />
            <h4 className="font-heading font-bold text-sm text-[#1C2B22]">{successMessage}</h4>
            <p className="text-[#3E5C63] text-[11px]">Warning flags added to this highway section immediately.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Coordinates Selector */}
            <div className="bg-[#E5DEC9] p-3 rounded border border-[#3E5C63]/25">
              <div className="flex items-center justify-between mb-2">
                <span className="font-heading font-bold text-[#1C2B22] text-xs">
                  {t('location_coordinates')}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartPinDrop();
                  }}
                  className="text-[11px] font-sans text-[#3B6EA5] hover:underline font-semibold"
                >
                  {t('click_map_pick')}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <label className="text-[10px] text-[#3E5C63] block mb-0.5">{t('latitude')}</label>
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
                  <label className="text-[10px] text-[#3E5C63] block mb-0.5">{t('longitude')}</label>
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
                <label className="text-[#1C2B22] font-semibold text-xs block mb-1">{t('what_is_blocking')}</label>
                <select
                  value={hazardType}
                  onChange={(e) => setHazardType(e.target.value)}
                  className="w-full bg-[#E5DEC9] border border-[#3E5C63]/30 rounded p-2 text-[#1C2B22] text-xs outline-none font-sans"
                >
                  <option value="Mudslide / Landslide">{t('mudslide_landslide')}</option>
                  <option value="Falling Rocks / Boulders">{t('falling_rocks')}</option>
                  <option value="Flooding / Road Submerged">{t('flooding_submerged')}</option>
                  <option value="Road Cracked / Sinking">{t('road_cracked')}</option>
                  <option value="Broken Bridge / Approach Washout">{t('broken_bridge')}</option>
                </select>
              </div>
              <div>
                <label className="text-[#1C2B22] font-semibold text-xs block mb-1">{t('can_vehicles_pass')}</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-[#E5DEC9] border border-[#3E5C63]/30 rounded p-2 text-[#1C2B22] text-xs outline-none font-sans font-semibold text-[#A63A32]"
                >
                  <option value="Impassable">{t('completely_blocked')}</option>
                  <option value="Critical">{t('heavy_blockage')}</option>
                  <option value="Moderate">{t('one_lane_only')}</option>
                  <option value="Minor">{t('minor_stones')}</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[#1C2B22] font-semibold text-xs block mb-1">{t('describe_happened')}</label>
              <textarea
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('describe_placeholder')}
                className="w-full bg-[#E5DEC9] border border-[#3E5C63]/30 rounded p-2 text-[#1C2B22] text-xs outline-none"
                required
              ></textarea>
            </div>

            {/* Reporter Name */}
            <div>
              <label className="text-[#1C2B22] font-semibold text-xs block mb-1">{t('reporter_name_role')}</label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder={t('reporter_placeholder')}
                className="w-full bg-[#E5DEC9] border border-[#3E5C63]/30 rounded p-2 text-[#1C2B22] text-xs outline-none font-sans"
              />
            </div>

            {/* Geo-tagged Photo Field */}
            <div className="bg-[#E5DEC9] p-2.5 rounded border border-[#3E5C63]/25 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[#1C2B22] font-semibold text-xs flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#3E5C63]" />
                  {t('attach_photo')}
                </label>
                <span className="text-[10px] text-[#3E5C63] font-mono">{t('optional')}</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer flex items-center gap-1.5 bg-[#F1EDE2] hover:bg-white text-[#1C2B22] px-3 py-1.5 rounded border border-[#3E5C63]/30 text-xs font-medium transition shadow-xs shrink-0">
                  <Upload className="w-3 h-3 text-[#3E5C63]" />
                  {t('choose_file')}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-[10px] text-[#3E5C63] font-mono shrink-0">{t('or_url')}</span>
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
                    {t('photo_attached')}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="text-[#A63A32] hover:underline text-[10px] font-bold shrink-0"
                  >
                    {t('remove')}
                  </button>
                </div>
              )}
            </div>

            {/* Inline Form Validation Error Alert */}
            {formError && (
              <div className="p-2.5 bg-[#FEE2E2] border border-[#EF4444] rounded text-[#991B1B] text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <span className="text-base leading-none">⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isSyncing}
                className={`w-full font-heading font-bold py-2.5 rounded transition flex items-center justify-center gap-2 text-[#F1EDE2] shadow-sm ${
                  !isOnline 
                    ? 'bg-[#D97706] hover:bg-[#B45309]' 
                    : 'bg-[#A63A32] hover:bg-[#8F2F28]'
                }`}
              >
                {!isOnline ? (
                  <>
                    <CloudOff className="w-4 h-4" />
                    {isSubmitting ? t('queueing_offline') : t('queue_offline_btn')}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {isSubmitting ? t('submitting_report') : t('submit_report_now')}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
