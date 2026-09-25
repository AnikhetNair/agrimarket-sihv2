import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import {
  Users,
  Layers,
  Handshake,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building,
  PieChart,
} from 'lucide-react';

export const FpoDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const allLots = dataStore.getLots();
  const pooledLots = allLots.filter((l) => l.is_pooled);
  const totalPooledVolume = pooledLots.reduce((acc, l) => acc + l.quantity, 0) || 75;

  return (
    <div className="space-y-6">
      {/* FPO Organization Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-[#0d0a0b] tracking-tight">
              Sahyadri Farmers Producer Co. Ltd.
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#6A994E]/15 text-[#386641] border border-[#6A994E]/30">
              Verified FPC Producer Organization (CIN: U01111MH2024PTC123456)
            </span>
          </div>
          <p className="text-xs text-[#454955] mt-1 flex items-center space-x-2">
            <span>Managing Director / CEO: {user?.name}</span>
            <span>•</span>
            <span>Nashik & Dindori Clusters • 1,450 Registered Smallholders</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/fpo/aggregation"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#386641] hover:bg-[#2d5535] text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-white" />
            <span>Aggregate Member Produce</span>
          </Link>
          <Link
            to="/fpo/analytics"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-[#0d0a0b] rounded-lg text-xs font-semibold border border-slate-200 transition cursor-pointer shadow-2xs"
          >
            <PieChart className="w-3.5 h-3.5 text-[#386641]" />
            <span>Pro-Rata Settlement Audit</span>
          </Link>
        </div>
      </div>

      {/* 4 Key Executive Metrics (Level 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#454955]">
            <span>Member Produce Available</span>
            <Users className="w-4 h-4 text-[#386641]" />
          </div>
          <div className="text-2xl font-bold text-[#0d0a0b] mt-2">145 Q</div>
          <div className="text-[11px] text-[#454955] mt-1">Across 8 smallholders</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#454955]">
            <span>Active Pooled Volume</span>
            <Layers className="w-4 h-4 text-[#386641]" />
          </div>
          <div className="text-2xl font-bold text-[#0d0a0b] mt-2">{totalPooledVolume} Q</div>
          <div className="text-[11px] text-[#386641] font-medium mt-1">Grade A Carrot Consignment</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#454955]">
            <span>Institutional Buyer Demand</span>
            <Building className="w-4 h-4 text-[#386641]" />
          </div>
          <div className="text-2xl font-bold text-[#0d0a0b] mt-2">120 Q</div>
          <div className="text-[11px] text-[#386641] font-medium mt-1">FreshKart Foods & BigBasket</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#454955]">
            <span>FPO Platform Fee</span>
            <ShieldCheck className="w-4 h-4 text-[#386641]" />
          </div>
          <div className="text-2xl font-bold text-[#0d0a0b] mt-2">0.50%</div>
          <div className="text-[11px] text-[#454955] mt-1">₹1,162.50 per 75Q truckload</div>
        </div>
      </div>

      {/* Progressive Disclosure: Aggregation Status & Next Action */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Active Pooled Lot Ready for Institutional Buyer */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-[#454955]">
              Active Collective Consignment
            </span>
            <span className="font-mono text-xs font-bold text-[#386641] bg-[#6A994E]/15 px-2 py-0.5 rounded border border-[#6A994E]/30">
              POOL-MH-CAR-0926
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0d0a0b]">
                  Aggregated Grade A Kuroda Carrots (75 Quintals)
                </h3>
                <p className="text-xs text-[#454955] mt-0.5">
                  Pooled from 3 member farmers in Dindori, Niphad, and Lasalgaon clusters
                </p>
              </div>
              <span className="text-sm font-bold text-[#386641] bg-[#6A994E]/15 px-2.5 py-1 rounded border border-[#6A994E]/30">
                Target Rate: ₹3,150/Q
              </span>
            </div>

            {/* Member Allocation Table Preview */}
            <div className="bg-[#F2E8CF] rounded-lg p-3 border border-slate-200 text-xs">
              <div className="font-semibold text-[#0d0a0b] mb-2">Member Allotment Breakdown:</div>
              <div className="space-y-1.5 divide-y divide-slate-200/50">
                <div className="flex justify-between pt-1">
                  <span className="text-[#0d0a0b] font-medium">1. Ramesh Patil (Dindori)</span>
                  <span className="font-mono text-[#454955]">30 Q (40.0% Share)</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-[#0d0a0b] font-medium">2. Suresh Gaikwad (Niphad)</span>
                  <span className="font-mono text-[#454955]">20 Q (26.7% Share)</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-[#0d0a0b] font-medium">3. Anand Shinde (Lasalgaon)</span>
                  <span className="font-mono text-[#454955]">25 Q (33.3% Share)</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#6A994E]/10 rounded-lg border border-[#6A994E]/30 text-xs text-[#0d0a0b]">
              <div className="font-bold flex items-center space-x-1 text-[#386641]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#386641]" />
                <span>Zero-Disparity Pro-Rata Math Verified</span>
              </div>
              <p className="text-[11px] text-[#454955] mt-1">
                Gross Sale (₹2,32,500) equals Sum(Farmer Net Payouts ₹2,22,337.50) + Transport (-₹6,750) + Storage (-₹2,250) + FPO Fee (₹1,162.50).
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Link
                to="/fpo/aggregation"
                className="text-xs font-semibold text-[#386641] hover:text-[#2d5535] flex items-center space-x-1"
              >
                <span>Manage Aggregation & Split Pool</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Institutional Match & Buyer Demand */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-[#454955]">
              Institutional Counterparty
            </span>
            <span className="text-xs font-bold text-[#386641] bg-[#6A994E]/15 px-2 py-0.5 rounded border border-[#6A994E]/30">
              96% Compatibility
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <h4 className="font-bold text-[#0d0a0b] text-sm">FreshKart Foods India Ltd</h4>
              <p className="text-[#454955] text-[11px]">Central Processing Hub • Pune (190 km corridor)</p>
            </div>

            <div className="bg-[#F2E8CF] rounded-lg p-3 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#454955]">Procurement Demand:</span>
                <span className="font-bold text-[#0d0a0b]">100 Quintals</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#454955]">Target Rate:</span>
                <span className="font-bold text-[#0d0a0b]">₹3,100 / Q</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#454955]">Delivery Window:</span>
                <span className="font-medium text-[#0d0a0b]">Next 48 Hours</span>
              </div>
            </div>

            <div className="space-y-1 text-[#454955] text-[11px]">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3 h-3 text-[#386641]" />
                <span>Single 10-Tonne Eicher Pro truck can pick up from FPO Central Hub</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3 h-3 text-[#386641]" />
                <span>Saves farmers ₹1,200 each in individual transit overhead</span>
              </div>
            </div>

            <Link
              to="/fpo/deals"
              className="w-full flex items-center justify-center space-x-1.5 py-2.5 bg-[#386641] hover:bg-[#2d5535] text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <Handshake className="w-3.5 h-3.5 text-white" />
              <span>Negotiate Corporate Contract</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
