import React, { useState, useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import ReportModal from './components/ReportModal';
import ResearchModal from './components/ResearchModal';

const HazardMap = lazy(() => import('./components/HazardMap'));
const AccessibilityView = lazy(() => import('./components/AccessibilityView'));
const RouteOptimizerView = lazy(() => import('./components/RouteOptimizerView'));
const DashboardView = lazy(() => import('./components/DashboardView'));

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [nowcastData, setNowcastData] = useState(null);
  const [accessibilityData, setAccessibilityData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [hazardReports, setHazardReports] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState(null);

  // Pin drop & modals
  const [isPinDropping, setIsPinDropping] = useState(false);
  const [pinnedLocation, setPinnedLocation] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);

  // Initial Data Load
  const fetchAllData = async () => {
    try {
      const [segRes, accRes, dashRes, repRes] = await Promise.all([
        fetch('/api/risk/segments').then(r => r.json()),
        fetch('/api/accessibility/villages').then(r => r.json()),
        fetch('/api/dashboard/stats').then(r => r.json()),
        fetch('/api/reports').then(r => r.json())
      ]);

      setNowcastData(segRes);
      setAccessibilityData(accRes);
      setDashboardData(dashRes);
      setHazardReports(repRes.reports || []);

      if (segRes.segments && segRes.segments.length > 0 && !selectedSegment) {
        setSelectedSegment(segRes.segments[1]); // Default to Sonapur Tunnel segment
      }
    } catch (err) {
      console.error('Error fetching Setumarg data:', err);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Auto-polling interval: check live status every 30 seconds
    // Automatically propagates background recomputes to the UI without requiring page reload
    const pollInterval = setInterval(async () => {
      try {
        const statusRes = await fetch('/api/risk/live-status').then(r => r.json());
        if (statusRes.is_live_mode) {
          const [segRes, accRes, dashRes] = await Promise.all([
            fetch('/api/risk/segments').then(r => r.json()),
            fetch('/api/accessibility/villages').then(r => r.json()),
            fetch('/api/dashboard/stats').then(r => r.json())
          ]);
          setNowcastData(segRes);
          setAccessibilityData(accRes);
          setDashboardData(dashRes);
        }
      } catch (e) {
        // Silent recovery on temporary network glitch
      }
    }, 30000);

    return () => clearInterval(pollInterval);
  }, []);

  // Handler for Rainfall Scenarios (Dry, Monsoon, Cloudburst)
  const handleScenarioChange = async (scenarioKey) => {
    try {
      const res = await fetch('/api/risk/nowcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_key: scenarioKey })
      });
      const updatedSegments = await res.json();
      setNowcastData(updatedSegments);

      // Refresh dashboard & accessibility
      const [accRes, dashRes] = await Promise.all([
        fetch('/api/accessibility/villages').then(r => r.json()),
        fetch('/api/dashboard/stats').then(r => r.json())
      ]);
      setAccessibilityData(accRes);
      setDashboardData(dashRes);
    } catch (err) {
      console.error('Error updating nowcast scenario:', err);
    }
  };

  // Handler for Live Rainfall Scrubber Slider
  const handleSliderChange = async (multiplier) => {
    try {
      const res = await fetch('/api/risk/nowcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_multiplier: multiplier })
      });
      const updatedSegments = await res.json();
      setNowcastData(updatedSegments);

      // Keep dashboard in sync
      const [accRes, dashRes] = await Promise.all([
        fetch('/api/accessibility/villages').then(r => r.json()),
        fetch('/api/dashboard/stats').then(r => r.json())
      ]);
      setAccessibilityData(accRes);
      setDashboardData(dashRes);
    } catch (err) {
      console.error('Error adjusting rainfall slider:', err);
    }
  };

  // Handler for Submitting Crowdsourced Hazard Report
  const handleSubmitReport = async (payload) => {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    // Re-fetch all data to refresh map risk polylines immediately
    await fetchAllData();
    return data;
  };

  // Handler for Triggering Emergency SMS/IVR
  const handleTriggerAlert = async (villageId) => {
    const res = await fetch('/api/accessibility/trigger-sms-ivr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ village_id: villageId })
    });
    return await res.json();
  };

  // Handler for Route Optimizer
  const handleOptimizeRoute = async (origin, destination, vehicleType) => {
    const res = await fetch('/api/routing/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, vehicle_type: vehicleType })
    });
    return await res.json();
  };

  return (
    <div className="min-h-screen bg-[#1C2B22] text-[#F1EDE2] flex flex-col">
      {/* Global Navigation & Monsoon Scrubber Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        nowcastData={nowcastData}
        onScenarioChange={handleScenarioChange}
        onSliderChange={handleSliderChange}
        openReportModal={() => setIsReportModalOpen(true)}
        openResearchModal={() => setIsResearchModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        <Suspense fallback={
          <div className="p-12 text-center text-[#E5DEC9] font-mono text-xs flex flex-col items-center justify-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#6EE7B7] animate-ping"></span>
            <span>Loading Setumarg view module...</span>
          </div>
        }>
          {activeTab === 'map' && (
            <HazardMap
              segmentsData={nowcastData}
              accessibilityData={accessibilityData}
              hazardReports={hazardReports}
              selectedSegment={selectedSegment}
              setSelectedSegment={setSelectedSegment}
              isPinDropping={isPinDropping}
              setIsPinDropping={setIsPinDropping}
              onPinDropSelect={(lat, lng) => {
                setPinnedLocation({ lat, lng });
                setIsReportModalOpen(true);
              }}
            />
          )}

          {activeTab === 'accessibility' && (
            <AccessibilityView
              accessibilityData={accessibilityData}
              onTriggerAlert={handleTriggerAlert}
            />
          )}

          {activeTab === 'routing' && (
            <RouteOptimizerView
              onOptimizeRoute={handleOptimizeRoute}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              dashboardData={dashboardData}
              nowcastData={nowcastData}
            />
          )}
        </Suspense>
      </main>

      {/* Modals */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        pinnedLocation={pinnedLocation}
        onStartPinDrop={() => {
          setActiveTab('map');
          setIsPinDropping(true);
        }}
        onSubmitReport={handleSubmitReport}
      />

      <ResearchModal
        isOpen={isResearchModalOpen}
        onClose={() => setIsResearchModalOpen(false)}
      />
    </div>
  );
}
