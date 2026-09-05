import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HazardMap from './components/HazardMap';
import AccessibilityView from './components/AccessibilityView';
import RouteOptimizerView from './components/RouteOptimizerView';
import DashboardView from './components/DashboardView';
import ReportModal from './components/ReportModal';
import ResearchModal from './components/ResearchModal';

const API_BASE = window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000' : 'http://localhost:8000';

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
        fetch(`${API_BASE}/api/risk/segments`).then(r => r.json()),
        fetch(`${API_BASE}/api/accessibility/villages`).then(r => r.json()),
        fetch(`${API_BASE}/api/dashboard/stats`).then(r => r.json()),
        fetch(`${API_BASE}/api/reports`).then(r => r.json())
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
  }, []);

  // Handler for Rainfall Scenarios (Dry, Monsoon, Cloudburst)
  const handleScenarioChange = async (scenarioKey) => {
    try {
      const res = await fetch(`${API_BASE}/api/risk/nowcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_key: scenarioKey })
      });
      const updatedSegments = await res.json();
      setNowcastData(updatedSegments);

      // Refresh dashboard & accessibility
      const [accRes, dashRes] = await Promise.all([
        fetch(`${API_BASE}/api/accessibility/villages`).then(r => r.json()),
        fetch(`${API_BASE}/api/dashboard/stats`).then(r => r.json())
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
      const res = await fetch(`${API_BASE}/api/risk/nowcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_multiplier: multiplier })
      });
      const updatedSegments = await res.json();
      setNowcastData(updatedSegments);

      // Keep dashboard in sync
      const [accRes, dashRes] = await Promise.all([
        fetch(`${API_BASE}/api/accessibility/villages`).then(r => r.json()),
        fetch(`${API_BASE}/api/dashboard/stats`).then(r => r.json())
      ]);
      setAccessibilityData(accRes);
      setDashboardData(dashRes);
    } catch (err) {
      console.error('Error adjusting rainfall slider:', err);
    }
  };

  // Handler for Submitting Crowdsourced Hazard Report
  const handleSubmitReport = async (payload) => {
    const res = await fetch(`${API_BASE}/api/reports`, {
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
    const res = await fetch(`${API_BASE}/api/accessibility/trigger-sms-ivr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ village_id: villageId })
    });
    return await res.json();
  };

  // Handler for Route Optimizer
  const handleOptimizeRoute = async (origin, destination, vehicleType) => {
    const res = await fetch(`${API_BASE}/api/routing/optimize`, {
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
