import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import {
  ClipboardList,
  Sparkles,
  Handshake,
  ArrowRight,
  CheckCircle2,
  MapPin,
} from 'lucide-react';

export const BuyerDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const requirements = dataStore.getRequirements();
  const activeDeals = dataStore.getDeals();

  return (
    <div className="space-y-6">
      {/* Buyer Organization Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-[#0d0a0b] tracking-tight">
              FreshKart Foods India Ltd • Procurement Desk
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#6A994E]/15 text-[#386641] border border-[#6A994E]/30">
              Corporate Buyer
            </span>
          </div>
          <p className="text-xs text-[#454955] mt-1 flex items-center space-x-2">
            <span>Procurement Head: {user?.name}</span>
            <span>•</span>
            <span>Pune Central Processing & Distribution Hub</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/buyer/procurement"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#386641] hover:bg-[#2d5535] text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <ClipboardList className="w-3.5 h-3.5 text-white" />
            <span>Manage Demands ({requirements.length})</span>
          </Link>
          <Link
            to="/buyer/matches"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-[#0d0a0b] rounded-lg text-xs font-semibold border border-slate-200 transition cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#386641]" />
            <span>Compatible Batches (94%)</span>
          </Link>
        </div>
      </div>

      {/* Level 1: Key Procurement Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs text-[#454955]">Active Demand Volume</div>
          <div className="text-2xl font-bold text-[#0d0a0b] mt-1">100 Quintals</div>
          <div className="text-[11px] text-[#454955] mt-1">Grade A Carrots for Retail</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs text-[#454955]">Matched Farm Lots</div>
          <div className="text-2xl font-bold text-[#386641] mt-1">3 Lots Found</div>
          <div className="text-[11px] text-[#386641] font-medium mt-1">Top Match: 94% Compatibility</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs text-[#454955]">Target Budget Rate</div>
          <div className="text-2xl font-bold text-[#0d0a0b] mt-1">₹3,100 / Q</div>
          <div className="text-[11px] text-[#454955] mt-1">Delivered to Pune Hub</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs text-[#454955]">Active Contracts</div>
          <div className="text-2xl font-bold text-[#386641] mt-1">{activeDeals.length}</div>
          <div className="text-[11px] text-[#454955] mt-1">Escrow payment protected</div>
        </div>
      </div>

      {/* Progressive Disclosure: Active Requirement & Matched Produce Lot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Columns: Active Procurement Demand */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-[#454955]">
              Primary Requirement
            </span>
            <span className="text-xs font-mono font-bold text-[#386641] bg-[#6A994E]/15 px-2 py-0.5 rounded border border-[#6A994E]/30">
              REQ-PUNE-TOM-01
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-baseline">
              <h3 className="text-base font-bold text-[#0d0a0b]">
                Kuroda Carrots (Grade A - Premium Table)
              </h3>
              <span className="text-sm font-bold text-[#0d0a0b]">30 Q Needed</span>
            </div>

            <div className="bg-[#F2E8CF] rounded-lg p-3 border border-slate-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#454955]">Target Purchase Price:</span>
                <span className="font-bold text-[#0d0a0b]">₹3,100 / Quintal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#454955]">Destination Warehouse:</span>
                <span className="font-semibold text-[#0d0a0b]">Pune Central Distribution Hub</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#454955]">Required Delivery Window:</span>
                <span className="font-medium text-[#0d0a0b]">Next 24–48 Hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#454955]">Packaging Specification:</span>
                <span className="font-medium text-[#0d0a0b]">Plastic Crates (25 kg standard)</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/buyer/procurement"
                className="text-xs font-semibold text-[#386641] hover:text-[#2d5535] flex items-center space-x-1"
              >
                <span>View All Requirements</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right 6 Columns: Top Matched Produce Batch */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-[#454955]">
              Top Matched Produce Batch
            </span>
            <span className="text-xs font-bold text-[#386641] bg-[#6A994E]/15 px-2 py-0.5 rounded border border-[#6A994E]/30">
              94% Compatibility Score
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-baseline">
              <div>
                <h3 className="text-base font-bold text-[#0d0a0b]">
                  LOT #NK-TOM-0926 • Ramesh Patil
                </h3>
                <div className="text-[#454955] text-[11px] flex items-center space-x-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-[#454955]" />
                  <span>Dindori, Nashik (190 km to Pune Hub)</span>
                </div>
              </div>
              <span className="font-bold text-[#0d0a0b] text-sm">30 Quintals</span>
            </div>

            <div className="bg-[#F2E8CF] rounded-lg p-3 border border-slate-200 space-y-1 text-[#454955]">
              <div className="flex items-center space-x-2 text-[#386641] font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#386641]" />
                <span>Quantity Match: Exactly 30 Quintals available</span>
              </div>
              <div className="flex items-center space-x-2 text-[#386641] font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#386641]" />
                <span>Quality Match: Verified Grade A Hybrid with cold chain handling</span>
              </div>
              <div className="flex items-center space-x-2 text-[#386641] font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#386641]" />
                <span>Price Match: Farmer asking ₹3,100 / Q aligns with procurement ceiling</span>
              </div>
            </div>

            <Link
              to="/buyer/deals"
              className="w-full flex items-center justify-center space-x-1.5 py-2.5 bg-[#386641] hover:bg-[#2d5535] text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <Handshake className="w-3.5 h-3.5 text-white" />
              <span>Initiate Direct Negotiation</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
