import React, { useState } from 'react';
import { dataStore } from '../../services/dataStore';
import { BuyerRequirement } from '../../types/domain';
import { MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BuyerProcurementPage: React.FC = () => {
  const [requirements] = useState<BuyerRequirement[]>(() =>
    dataStore.getRequirements()
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0d0a0b] tracking-tight">
            Active Procurement Demands
          </h1>
          <p className="text-xs text-[#454955] mt-0.5">
            Commercial volume specifications, price ceilings, and scheduled destination arrivals
          </p>
        </div>

        <Link
          to="/buyer/matches"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#386641] hover:bg-[#2d5535] text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer self-start sm:self-auto"
        >
          <span>Evaluate Matching Farm Lots</span>
          <ArrowRight className="w-3.5 h-3.5 text-white" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {requirements.map((req) => (
          <div
            key={req.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-[#386641] transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-mono text-xs font-bold text-[#386641] bg-[#6A994E]/15 px-2 py-0.5 rounded border border-[#6A994E]/30">
                  {req.id}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#6A994E]/15 text-[#386641] border border-[#6A994E]/30">
                  {req.status}
                </span>
              </div>

              <div className="mt-3">
                <h3 className="text-base font-bold text-[#0d0a0b]">
                  {req.commodity} (Min. Grade {req.grade})
                </h3>
                <div className="flex items-center space-x-1 text-xs text-[#454955] mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#454955]" />
                  <span>{req.delivery_location}</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 bg-[#F2E8CF] rounded-lg p-2.5 border border-slate-200 text-center text-xs">
                <div>
                  <div className="text-[10px] text-[#454955] font-medium">Required Volume</div>
                  <div className="font-bold text-[#0d0a0b]">{req.quantity} Quintals</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#454955] font-medium">Target Price</div>
                  <div className="font-bold text-[#386641]">₹{req.target_price} / Q</div>
                </div>
              </div>

              <div className="mt-3 space-y-1 text-xs text-[#454955]">
                <div className="flex justify-between text-[11px]">
                  <span>Required Delivery:</span>
                  <span className="font-semibold text-[#0d0a0b]">{req.required_by}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Procuring Entity:</span>
                  <span className="font-medium text-[#0d0a0b]">{req.buyer_org_name}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-[#386641] font-semibold">
                3 compatible lots identified
              </span>
              <Link
                to="/buyer/matches"
                className="inline-flex items-center space-x-1 text-xs font-semibold text-[#386641] hover:text-[#2d5535]"
              >
                <span>Review Matches</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
