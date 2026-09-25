import React, { useState, useMemo } from 'react';
import {
  Truck,
  ShieldCheck,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { User } from '../types/domain';
import { dataStore } from '../services/dataStore';
import { calculateTransportCost } from '../services/transportCostEngine';
import { calculateFPOSettlement } from '../services/settlementService';
import { GOLDEN_DEAL_ID } from '../data/seedDealsAndHistory';

interface LogisticsAndSettlementViewProps {
  activeUser: User;
}

export const LogisticsAndSettlementView: React.FC<LogisticsAndSettlementViewProps> = ({
  activeUser: _activeUser,
}) => {
  const deals = dataStore.getDeals();
  const logisticsOptions = dataStore.getLogisticsOptions();

  const [selectedDealId, setSelectedDealId] = useState<string>(GOLDEN_DEAL_ID);
  const activeDeal = useMemo(() => {
    return deals.find((d) => d.id === selectedDealId) || deals[0];
  }, [deals, selectedDealId]);

  // Payment record
  const payment = useMemo(() => {
    if (!activeDeal) return undefined;
    return dataStore.getPaymentForDeal(activeDeal.id);
  }, [activeDeal]);

  // Interactive Logistics Calculator State
  const [selectedVehicle, setSelectedVehicle] = useState(logisticsOptions[1]?.id || 'log-2');
  const [transitDistance, setTransitDistance] = useState(200); // 200km Nashik to Pune
  const [lotWeightQuintals] = useState(30);

  const logisticsCalc = useMemo(() => {
    const opt = logisticsOptions.find((o) => o.id === selectedVehicle) || logisticsOptions[0];
    return calculateTransportCost({
      distanceKm: transitDistance,
      quantityQuintals: lotWeightQuintals,
      deliveryMode: 'DELIVERED_TO_BUYER_WAREHOUSE',
      transportPaidBy: 'SELLER',
      refrigeratedRequired: opt?.vehicle_type?.includes('Reefer'),
    });
  }, [selectedVehicle, transitDistance, lotWeightQuintals, logisticsOptions]);

  // FPO Pooling Demo Settlement Data
  const fpoSettlementExample = useMemo(() => {
    const dummyContributors = [
      {
        id: 'cnt-1',
        pooled_lot_id: 'pool-sf-1',
        farmer_id: 'usr-farmer-1',
        farmer_name: 'Ramesh Patil (Dindori)',
        source_lot_id: 'lot-1',
        quantity: 30,
        share_percentage: 40.0,
        agreed_payout_price: 3000,
        payout_amount: 0,
      },
      {
        id: 'cnt-2',
        pooled_lot_id: 'pool-sf-1',
        farmer_id: 'usr-farmer-2',
        farmer_name: 'Suresh Gaikwad (Niphad)',
        source_lot_id: 'lot-2',
        quantity: 20,
        share_percentage: 26.67,
        agreed_payout_price: 3000,
        payout_amount: 0,
      },
      {
        id: 'cnt-3',
        pooled_lot_id: 'pool-sf-1',
        farmer_id: 'usr-farmer-3',
        farmer_name: 'Anand Shinde (Lasalgaon)',
        source_lot_id: 'lot-3',
        quantity: 25,
        share_percentage: 33.33,
        agreed_payout_price: 3000,
        payout_amount: 0,
      },
    ];
    return calculateFPOSettlement('deal-fpo-sample', 232500, dummyContributors, 2.0);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-[#0d0a0b] flex items-center space-x-2">
              <Truck className="w-5 h-5 text-[#386641]" />
              <span>Logistics Routing, Storage & Simulated Settlement</span>
            </h3>
            <span className="text-xs bg-[#F2E8CF] text-[#0d0a0b] px-2 py-0.5 rounded font-mono border border-slate-200 font-semibold">
              Fulfillment Infrastructure
            </span>
          </div>
          <p className="text-xs text-[#454955] mt-1">
            Deterministic carrier cost modeling, cold storage reserves, and automated escrow remittance
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-[#454955]">Target Deal:</span>
          <select
            value={selectedDealId}
            onChange={(e) => setSelectedDealId(e.target.value)}
            className="bg-[#F2E8CF] border border-slate-300 text-[#0d0a0b] rounded-lg px-2.5 py-1.5 font-mono text-xs focus:ring-1 focus:ring-[#386641]"
          >
            {deals.slice(0, 10).map((d) => (
              <option key={d.id} value={d.id}>
                {d.deal_number} - {d.commodity} ({d.quantity}Q)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Deal Logistics & Contract Terms Banner */}
      {activeDeal && (
        <div className="bg-[#F2E8CF] border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <span className="text-[#454955] text-[10px] uppercase font-mono block">Deal Reference</span>
            <span className="font-bold text-[#0d0a0b] font-mono">{activeDeal.deal_number}</span>
            <span className="text-[10px] text-[#454955] block font-mono">
              {activeDeal.commodity} ({activeDeal.quantity}Q @ ₹{activeDeal.accepted_price}/Q)
            </span>
          </div>
          <div>
            <span className="text-[#454955] text-[10px] uppercase font-mono block">Delivery Mode</span>
            <span className="font-semibold text-[#386641] font-mono">
              {activeDeal.simple_delivery_mode === 'supplier_delivery' ? 'Supplier Delivery' : 'Buyer Pickup'}
            </span>
            <span className="text-[10px] text-[#454955] block">
              {activeDeal.simple_delivery_mode === 'supplier_delivery' ? 'Delivered to Buyer Dock' : 'Ex-Farm Gate / Hub'}
            </span>
          </div>
          <div>
            <span className="text-[#454955] text-[10px] uppercase font-mono block">Transport Cost Payer</span>
            <span className="font-semibold text-[#0d0a0b] font-mono">
              {activeDeal.transport_cost_payer === 'supplier' ? 'FPO / Supplier Paid' : 'Buyer Paid'}
            </span>
            <span className="text-[10px] text-[#454955] block">
              Freight: ₹{activeDeal.transport_cost.toLocaleString('en-IN')} (₹{activeDeal.transport_cost_per_quintal || Math.round(activeDeal.transport_cost / (activeDeal.quantity || 1))}/Q)
            </span>
          </div>
          <div>
            <span className="text-[#454955] text-[10px] uppercase font-mono block">Corridor Route</span>
            <span className="font-medium text-[#0d0a0b] truncate block">
              {activeDeal.pickup_location} → {activeDeal.delivery_location || 'Pune Hub'}
            </span>
            <span className="text-[10px] text-[#454955] block font-mono">Distance: ~195 km</span>
          </div>
          <div>
            <span className="text-[#454955] text-[10px] uppercase font-mono block">Delivery Terms Status</span>
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#6A994E]/15 text-[#386641] border border-[#6A994E]/30 mt-1">
              <CheckCircle2 className="w-3 h-3 text-[#386641]" />
              <span>{activeDeal.delivery_terms_status || 'ACCEPTED'}</span>
            </span>
          </div>
        </div>
      )}

      {/* Grid: Logistics Engine & Simulated Escrow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (6 cols): Carrier Fleet & Freight Engine */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-[#0d0a0b] flex items-center space-x-2">
                <Truck className="w-4 h-4 text-[#386641]" />
                <span>Deterministic Freight Engine</span>
              </h4>
              <p className="text-xs text-[#454955] mt-0.5">Calculates vehicle capacity and mileage rate per corridor</p>
            </div>
            <span className="text-[10px] font-mono bg-[#F2E8CF] text-[#0d0a0b] px-2 py-0.5 rounded border border-slate-200">
              Route: Nashik → Pune
            </span>
          </div>

          {/* Calculator Parameters */}
          <div className="grid grid-cols-2 gap-3 text-xs mb-4">
            <div>
              <label className="block text-[#454955] mb-1 font-semibold">Vehicle Classification:</label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full bg-[#F2E8CF] border border-slate-300 rounded-lg p-1.5 text-[#0d0a0b] font-medium"
              >
                {logisticsOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.vehicle_type} (Cap: {opt.capacity_quintals}Q)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#454955] mb-1 font-semibold">Distance (km):</label>
              <input
                type="number"
                value={transitDistance}
                onChange={(e) => setTransitDistance(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[#F2E8CF] border border-slate-300 rounded-lg p-1.5 text-[#0d0a0b] font-mono font-bold"
              />
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-[#F2E8CF] p-3.5 rounded-lg border border-slate-200 text-xs font-mono space-y-2">
            <div className="flex justify-between text-[#454955]">
              <span>Base Mobilization Fee:</span>
              <span className="text-[#0d0a0b] font-semibold">₹{logisticsCalc.baseFee}</span>
            </div>
            <div className="flex justify-between text-[#454955]">
              <span>Distance Freight ({transitDistance}km):</span>
              <span className="text-[#0d0a0b] font-semibold">₹{logisticsCalc.distanceFee}</span>
            </div>
            <div className="flex justify-between text-[#454955]">
              <span>Farm Gate Loading + Warehouse Unloading:</span>
              <span className="text-[#0d0a0b] font-semibold">
                ₹{logisticsCalc.loadingFee + logisticsCalc.unloadingFee}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm">
              <span className="text-[#0d0a0b]">Total Transport Charge:</span>
              <span className="text-[#386641]">₹{logisticsCalc.totalCost.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-[10px] text-[#454955] text-right">
              Rate per Quintal: ₹{Math.round(logisticsCalc.totalCost / (lotWeightQuintals || 1))}/Q
            </div>
          </div>

          {/* Golden Transaction Validation */}
          <div className="mt-4 p-3 bg-[#6A994E]/10 border border-[#6A994E]/30 rounded-lg text-[11px] text-[#386641] font-mono font-medium">
            Mandated Value Check: 30Q Bolero from Nashik to Pune = exact ₹2,700 freight deduction.
          </div>
        </div>

        {/* Right (6 cols): Simulated Payment Escrow Lifecycle */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-[#0d0a0b] flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#386641]" />
                  <span>Simulated Escrow Payment Lifecycle</span>
                </h4>
                <p className="text-xs text-[#454955] mt-0.5">Protects farmer capital and verifies produce receipt</p>
              </div>
              <span className="text-[10px] font-mono bg-[#6A994E]/15 text-[#386641] px-2 py-0.5 rounded border border-[#6A994E]/30 font-semibold">
                DEMO_ESCROW_RTGS
              </span>
            </div>

            {payment ? (
              <div className="space-y-3 text-xs">
                {/* Status Card */}
                <div className="bg-[#F2E8CF] p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[#454955] uppercase text-[10px] font-mono">Escrow State</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-[#6A994E]/15 text-[#386641] border border-[#6A994E]/30">
                      {payment.status}
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between font-mono">
                    <span className="text-[#454955]">Disbursed to Farmer:</span>
                    <span className="text-2xl font-bold text-[#386641]">
                      ₹{payment.net_amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="mt-2 text-[11px] text-[#454955] font-mono">
                    UTR: {payment.reference}
                  </div>
                </div>

                {/* Audit Reconciliation */}
                <div className="bg-[#F2E8CF]/70 p-3 rounded-lg border border-slate-200 text-[11px] font-mono space-y-1 text-[#454955]">
                  <div className="flex justify-between">
                    <span>Gross Invoice:</span>
                    <span className="font-semibold text-[#0d0a0b]">₹{payment.gross_amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Transport Carrier Deducted:</span>
                    <span>-₹{payment.deductions.transport}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Cold Storage / Staging:</span>
                    <span>-₹{payment.deductions.storage}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Platform Facilitation (0.5%):</span>
                    <span>-₹{payment.deductions.service_fee}</span>
                  </div>
                  <div className="pt-1 border-t border-slate-200 flex justify-between font-bold text-[#386641]">
                    <span>Net Credited (Ramesh Patil):</span>
                    <span>₹{payment.net_amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[#454955] text-xs py-8 text-center">
                No payment initiated yet for this deal. Transition deal to PAID to trigger escrow disbursement.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-[#454955] flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#386641] shrink-0" />
            <span>Simulated instant RTGS settlement eliminates traditional 14-day mandi payment credit lag.</span>
          </div>
        </div>
      </div>

      {/* Section 3: FPO Contributor Pro-Rata Distribution & Audit Invariant */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#386641]" />
              <h4 className="text-sm font-bold text-[#0d0a0b]">FPO Contributor Pro-Rata Settlement Engine</h4>
              <span className="text-[10px] bg-[#6A994E]/15 text-[#386641] px-2 py-0.5 rounded font-mono border border-[#6A994E]/30 font-semibold">
                Mathematical Invariant Test
              </span>
            </div>
            <p className="text-xs text-[#454955] mt-0.5">
              Strict reconciliation: Sum of Individual Farmer Payouts + FPO Facilitation Fee === Gross Sale Value
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-[#0d0a0b] bg-[#F2E8CF] px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="text-[#454955]">Aggregated Gross:</span>
            <span className="font-bold text-[#0d0a0b]">₹{fpoSettlementExample.grossSaleValue.toLocaleString('en-IN')}</span>
            <span className="text-[#454955]">(75 Quintals)</span>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#0d0a0b] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[#454955] font-mono text-[11px] uppercase bg-[#F2E8CF]">
                <th className="py-2.5 px-3">Farmer Member</th>
                <th className="py-2.5 px-3 text-right">Contributed Qty</th>
                <th className="py-2.5 px-3 text-right">Pool Share %</th>
                <th className="py-2.5 px-3 text-right">Gross Allocation</th>
                <th className="py-2.5 px-3 text-right">FPO Fee (2%)</th>
                <th className="py-2.5 px-3 text-right">Net Farmer Payout</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {fpoSettlementExample?.contributorPayouts?.map((c) => (
                <tr key={c.farmerId} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-sans font-medium text-[#0d0a0b]">{c.farmerName}</td>
                  <td className="py-2.5 px-3 text-right text-[#454955]">{c.quantity} Q</td>
                  <td className="py-2.5 px-3 text-right text-[#386641] font-bold">{c.sharePercentage}%</td>
                  <td className="py-2.5 px-3 text-right text-[#0d0a0b]">
                    ₹{c.grossShare.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right text-red-600 font-semibold">-₹{c.fpoDeduction.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#386641]">
                    ₹{c.netPayout.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#6A994E]/15 text-[#386641] border border-[#6A994E]/30 font-semibold">
                      DISBURSED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invariant Reconciliation Verification Card */}
        <div className="mt-4 p-3.5 bg-[#F2E8CF] rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-2 text-[#386641]">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#386641]" />
            <span className="font-bold">
              Mathematical Verification Passed: Exact zero-disparity settlement
            </span>
          </div>
          <div className="text-[#454955] text-[11px]">
            Sum of Farmer Payouts (₹
            {fpoSettlementExample.reconciliationCheck.sumOfPayouts.toLocaleString('en-IN')}) + FPO Fee (₹
            {fpoSettlementExample.reconciliationCheck.plusFPOFee.toLocaleString('en-IN')}) = ₹
            {fpoSettlementExample.grossSaleValue.toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    </div>
  );
};
