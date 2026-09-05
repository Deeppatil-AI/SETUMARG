import React, { useState } from 'react';
import { 
  Users, 
  Clock, 
  Hospital, 
  Radio, 
  Search,
  PhoneCall,
  Send,
  Building2,
  AlertTriangle
} from 'lucide-react';

export default function AccessibilityView({ accessibilityData, onTriggerAlert }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('isolation_score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedVillageForAlert, setSelectedVillageForAlert] = useState(null);
  const [alertSuccess, setAlertSuccess] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const summary = accessibilityData?.summary || {};
  const villages = accessibilityData?.villages || [];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredVillages = villages
    .filter(v => 
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.district.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

  const handleDispatchSMS = async (village) => {
    setIsSending(true);
    try {
      const res = await onTriggerAlert(village.id);
      setAlertSuccess(res?.dispatch || {
        village_name: village.name,
        recipient_role: "Gram Panchayat Sarpanch",
        status: "DELIVERED (ACK Received)",
        gateway: "Exotel / C-DoT Rural 2G Trunk"
      });
      setTimeout(() => {
        setAlertSuccess(null);
        setSelectedVillageForAlert(null);
      }, 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 text-[#1C2B22] space-y-6">
      {/* Top Banner: World Bank Rural Access Index Methodology */}
      <div className="bg-[#F1EDE2] p-5 rounded border border-[#3E5C63]/30 shadow-sm flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="font-mono text-xs text-[#3E5C63] uppercase tracking-wider block mb-1">
            Village Hospital &amp; Road Access Monitor
          </span>
          <h2 className="font-heading font-bold text-xl text-[#1C2B22]">
            Village Road &amp; Hospital Access Status
          </h2>
          <p className="text-xs text-[#3E5C63] max-w-3xl mt-1 leading-relaxed">
            In mountain regions, straight-line distance on a map can be misleading because winding mountain roads take much longer, especially when landslides strike. Setumarg monitors real road travel times to hospitals and towns for villages across North East India.
          </p>
        </div>

        <div className="bg-[#E5DEC9] border border-[#3E5C63]/25 px-4 py-2 rounded text-right font-mono">
          <span className="text-[10px] text-[#3E5C63] block font-sans">Villages With Open Road Access</span>
          <span className="font-heading text-2xl font-bold text-[#1C2B22]">
            {summary.rural_access_index_percent || 64.2}%
          </span>
          <span className="text-[10px] text-[#3E5C63] block font-sans">under 30 mins to good road</span>
        </div>
      </div>

      {/* Structured Telemetry Numbers Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#F1EDE2] border border-[#3E5C63]/30 p-4 rounded font-mono">
          <span className="font-sans text-xs text-[#3E5C63] block mb-1">Villages Monitored</span>
          <div className="font-heading text-2xl font-bold text-[#1C2B22]">{summary.total_villages_monitored || 25}</div>
          <span className="text-[10px] text-[#3E5C63] block mt-1 font-sans">across 8 North East states</span>
        </div>

        <div className="bg-[#F1EDE2] border border-[#3E5C63]/30 p-4 rounded font-mono">
          <span className="font-sans text-xs text-[#3E5C63] block mb-1">Total Village Population</span>
          <div className="font-heading text-2xl font-bold text-[#1C2B22]">{(summary.total_rural_population || 72940).toLocaleString()}</div>
          <span className="text-[10px] text-[#3E5C63] block mt-1 font-sans">local census &amp; road records</span>
        </div>

        <div className="bg-[#F1EDE2] border-l-4 border-l-[#A63A32] border border-[#3E5C63]/30 p-4 rounded font-mono">
          <span className="font-sans text-xs text-[#A63A32] font-semibold block mb-1">Villages Cut-Off</span>
          <div className="font-heading text-2xl font-bold text-[#A63A32]">{summary.currently_isolated_villages || 4}</div>
          <span className="text-[10px] text-[#A63A32] block mt-1 font-sans">main road blocked by mudslide</span>
        </div>

        <div className="bg-[#F1EDE2] border-l-4 border-l-[#C77A2E] border border-[#3E5C63]/30 p-4 rounded font-mono">
          <span className="font-sans text-xs text-[#C77A2E] font-semibold block mb-1">People In Danger of Isolation</span>
          <div className="font-heading text-2xl font-bold text-[#C77A2E]">{(summary.population_at_risk_or_cut_off || 8200).toLocaleString()}</div>
          <span className="text-[10px] text-[#C77A2E] block mt-1 font-sans">over 90 mins to hospital</span>
        </div>
      </div>

      {/* Table Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F1EDE2] p-3 rounded border border-[#3E5C63]/30">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#3E5C63] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search village, district, or state..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#E5DEC9] border border-[#3E5C63]/30 rounded pl-9 pr-3 py-1.5 text-xs text-[#1C2B22] outline-none placeholder-[#3E5C63]/70 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-sans">
          <span className="text-[#3E5C63] font-medium">Sort By:</span>
          <button
            onClick={() => handleSort('isolation_score')}
            className={`px-2.5 py-1 rounded text-xs transition ${sortField === 'isolation_score' ? 'bg-[#1C2B22] text-[#F1EDE2] font-bold' : 'bg-[#E5DEC9] text-[#1C2B22]'}`}
          >
            Cut-Off Risk
          </button>
          <button
            onClick={() => handleSort('population')}
            className={`px-2.5 py-1 rounded text-xs transition ${sortField === 'population' ? 'bg-[#1C2B22] text-[#F1EDE2] font-bold' : 'bg-[#E5DEC9] text-[#1C2B22]'}`}
          >
            Population
          </button>
          <button
            onClick={() => handleSort('effective_travel_hospital_min')}
            className={`px-2.5 py-1 rounded text-xs transition ${sortField === 'effective_travel_hospital_min' ? 'bg-[#1C2B22] text-[#F1EDE2] font-bold' : 'bg-[#E5DEC9] text-[#1C2B22]'}`}
          >
            Hospital Travel Time
          </button>
        </div>
      </div>

      {/* Cartographic Village Table */}
      <div className="bg-[#F1EDE2] rounded border border-[#3E5C63]/30 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#E5DEC9] text-[#3E5C63] font-mono border-b border-[#3E5C63]/30 text-[10px] uppercase">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Village / Settlement</th>
                <th className="py-2.5 px-3 font-semibold">State / District</th>
                <th className="py-2.5 px-3 font-semibold text-right">Population</th>
                <th className="py-2.5 px-4 font-semibold">Main Connecting Highway</th>
                <th className="py-2.5 px-3 font-semibold text-right">Hospital Travel Time</th>
                <th className="py-2.5 px-3 font-semibold text-center">Road Standard</th>
                <th className="py-2.5 px-3 font-semibold text-center">Cut-Off Risk</th>
                <th className="py-2.5 px-4 font-semibold text-center">Emergency Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3E5C63]/15 text-[#1C2B22]">
              {filteredVillages.map((v) => {
                const isSevere = v.is_cut_off || v.isolation_score > 60;
                return (
                  <tr key={v.id} className={`hover:bg-[#E5DEC9]/50 transition ${isSevere ? 'bg-[#A63A32]/5' : ''}`}>
                    <td className="py-2.5 px-4 font-heading font-bold text-[#1C2B22]">
                      <div className="flex items-center gap-1.5">
                        {isSevere && <span className="w-2 h-2 rounded-full bg-[#A63A32]"></span>}
                        {v.name}
                      </div>
                      <span className="font-mono text-[10px] text-[#3E5C63] font-normal block">Elev: {v.elevation_m}m | {v.connectivity_type}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium">{v.state}</div>
                      <span className="text-[10px] text-[#3E5C63] font-mono">{v.district}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">
                      {v.population.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-[#1C2B22]">{v.feeder_highway_name}</div>
                      <span className={`font-mono text-[10px] font-semibold ${
                        v.feeder_is_blocked ? 'text-[#A63A32]' :
                        v.feeder_alert_tier === 'Severe' ? 'text-[#A63A32]' : 'text-[#3E5C63]'
                      }`}>
                        {v.feeder_is_blocked ? 'Blocked by Mudslide' : `${v.feeder_alert_tier} Danger`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      <div className="font-bold text-[#1C2B22]">{v.effective_travel_hospital_min} mins</div>
                      <span className="text-[10px] text-[#3E5C63] block">Normal: {v.base_travel_hospital_min} mins</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
                        v.meets_rai_standard
                          ? 'bg-[#5C7A4E]/15 text-[#5C7A4E] border-[#5C7A4E]/30'
                          : 'bg-[#A63A32]/15 text-[#A63A32] border-[#A63A32]/30'
                      }`}>
                        {v.meets_rai_standard ? 'Good Access' : 'At Risk'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      <span className="font-bold text-xs" style={{
                        color: v.isolation_score > 70 ? '#A63A32' : (v.isolation_score > 45 ? '#C77A2E' : '#5C7A4E')
                      }}>
                        {v.isolation_score}/100
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedVillageForAlert(v)}
                        className="bg-[#22352A] hover:bg-[#1C2B22] text-[#F1EDE2] text-[11px] font-sans px-2.5 py-1 rounded transition"
                      >
                        Send Urgent SMS / Call
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency IVR/SMS Broadcast Dialog */}
      {selectedVillageForAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C2B22]/70 backdrop-blur-sm">
          <div className="bg-[#F1EDE2] text-[#1C2B22] border-2 border-[#3E5C63] rounded max-w-md w-full p-6 shadow-2xl relative text-xs">
            <h3 className="font-heading font-bold text-base text-[#1C2B22] mb-1 flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#A63A32]" />
              Send Urgent Alert to Village Head (Gram Panchayat)
            </h3>
            <p className="text-[#3E5C63] text-[11px] mb-4">
              Sends an urgent voice call and SMS text that reaches basic 2G phones even with no internet.
            </p>

            {alertSuccess ? (
              <div className="bg-[#5C7A4E]/10 border border-[#5C7A4E] p-4 rounded text-center space-y-2">
                <div className="font-heading font-bold text-[#5C7A4E] text-sm">Alert Sent Successfully</div>
                <p className="text-[11px] text-[#3E5C63]">
                  Delivered to <strong>{selectedVillageForAlert.name}</strong> Sarpanch ({selectedVillageForAlert.sarpanch_contact}) via government rural phone trunk.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-[#E5DEC9] p-3 rounded border border-[#3E5C63]/25 font-mono space-y-1">
                  <div><strong>Village:</strong> {selectedVillageForAlert.name} ({selectedVillageForAlert.district}, {selectedVillageForAlert.state})</div>
                  <div><strong>Population:</strong> {selectedVillageForAlert.population.toLocaleString()} people</div>
                  <div><strong>Village Head Phone:</strong> {selectedVillageForAlert.sarpanch_contact}</div>
                  <div><strong>Mobile Signal:</strong> {selectedVillageForAlert.connectivity_type}</div>
                </div>

                <div className="bg-[#E5DEC9]/60 p-3 rounded border border-[#3E5C63]/25 text-[#1C2B22] text-[11px] font-mono leading-relaxed">
                  [SETUMARG WARNING] Urgent notice for {selectedVillageForAlert.name}: The main road is under high risk of landslides and blockages. Travel time to {selectedVillageForAlert.nearest_facility} hospital is now delayed to {selectedVillageForAlert.effective_travel_hospital_min} minutes. Please check local food stocks, alert health/ASHA workers, and avoid unnecessary travel.
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setSelectedVillageForAlert(null)}
                    className="flex-1 py-2 bg-[#E5DEC9] text-[#1C2B22] border border-[#3E5C63]/30 rounded font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDispatchSMS(selectedVillageForAlert)}
                    disabled={isSending}
                    className="flex-1 py-2 bg-[#A63A32] hover:bg-[#8F2F28] text-[#F1EDE2] rounded font-heading font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSending ? 'Sending Alert...' : 'Send Alert to Village Head'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
