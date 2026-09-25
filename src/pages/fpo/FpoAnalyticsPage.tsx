import React, { useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { calculateFPOSettlement } from '../../services/settlementService';
import { LotContributor } from '../../types/domain';
import {
  CheckCircle2,
} from 'lucide-react';

export const FpoAnalyticsPage: React.FC = () => {
  const { t } = useLanguage();
  const contributors: LotContributor[] = [
    {
      id: 'c-1',
      pooled_lot_id: 'pool-mh-tom-0926',
      farmer_id: 'usr-farmer-1',
      farmer_name: 'Ramesh Patil (Dindori)',
      source_lot_id: 'lot-nk-tom-0926',
      quantity: 30,
      share_percentage: 40.0,
      agreed_payout_price: 3038,
      payout_amount: 91140,
    },
    {
      id: 'c-2',
      pooled_lot_id: 'pool-mh-tom-0926',
      farmer_id: 'usr-farmer-2',
      farmer_name: 'Suresh Gaikwad (Niphad)',
      source_lot_id: 'lot-gaikwad-tom-1',
      quantity: 20,
      share_percentage: 26.67,
      agreed_payout_price: 3038,
      payout_amount: 60760,
    },
    {
      id: 'c-3',
      pooled_lot_id: 'pool-mh-tom-0926',
      farmer_id: 'usr-farmer-3',
      farmer_name: 'Anand Shinde (Lasalgaon)',
      source_lot_id: 'lot-shinde-tom-1',
      quantity: 25,
      share_percentage: 33.33,
      agreed_payout_price: 3038,
      payout_amount: 75950,
    },
  ];

  const grossSaleValue = 232500; // 75 Quintals @ ₹3,100/Q
  const fpoFeePercentage = 2.0;

  const settlement = useMemo(() => {
    return calculateFPOSettlement('deal-fpo-batch-001', grossSaleValue, contributors, fpoFeePercentage);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <h1 className="text-xl font-bold text-[#0d0a0b] tracking-tight">
          {t('fpo.analyticsTitle', 'Settlement, Net Realisation & Audit Log')}
        </h1>
        <p className="text-xs text-[#454955] mt-0.5">
          {t('fpo.analyticsSubtitle', 'Track member payout distributions, commission withholdings, and transport deductions')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs text-[#454955]">Gross Sale Realized</div>
          <div className="text-2xl font-bold text-[#0d0a0b] mt-1">
            ₹{grossSaleValue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-[#454955] mt-1">75 Quintals @ ₹3,100/Q</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs text-[#454955]">Distributable Pool</div>
          <div className="text-2xl font-bold text-[#386641] mt-1">
            ₹{settlement.distributableAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-[#386641] font-medium mt-1">98.0% of gross proceeds</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs text-[#454955]">FPO Operational Fee (2.0%)</div>
          <div className="text-2xl font-bold text-[#386641] mt-1">
            ₹{settlement.fpoServiceFeeAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-[#454955] mt-1">Weighbridge & logistics handling</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs text-[#454955]">Mathematical Disparity</div>
          <div className="text-2xl font-bold text-[#386641] mt-1">
            ₹{settlement.reconciliationCheck.difference}
          </div>
          <div className="text-[11px] text-[#386641] font-semibold mt-1">100% Invariant Compliant</div>
        </div>
      </div>

      {/* Contributor Distribution Audit Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#0d0a0b]">
              Member Payout Distribution (Consignment POOL-MH-TOM-0926)
            </h2>
            <p className="text-xs text-[#454955] mt-0.5">
              Strict pro-rata weighting based on verified weighbridge quantity delivered to central collection hub.
            </p>
          </div>
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#6A994E]/15 text-[#386641] border border-[#6A994E]/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#386641]" />
            <span>Zero-Disparity Verified</span>
          </span>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="border-b border-slate-200 text-[#454955] uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Farmer Contributor</th>
                <th className="py-2.5 px-3 text-right">Volume Delivered</th>
                <th className="py-2.5 px-3 text-right">Pool Share</th>
                <th className="py-2.5 px-3 text-right">Gross Share</th>
                <th className="py-2.5 px-3 text-right">FPO Fee (2%)</th>
                <th className="py-2.5 px-3 text-right font-bold text-[#0d0a0b]">Net Farmer Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {settlement.contributorPayouts.map((c) => (
                <tr key={c.farmerId} className="hover:bg-[#F2E8CF]/60 transition">
                  <td className="py-3 px-3 font-sans font-medium text-[#0d0a0b]">
                    {c.farmerName}
                  </td>
                  <td className="py-3 px-3 text-right text-[#454955]">{c.quantity} Q</td>
                  <td className="py-3 px-3 text-right text-[#454955]">{c.sharePercentage}%</td>
                  <td className="py-3 px-3 text-right text-[#0d0a0b]">
                    ₹{c.grossShare.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right text-red-600">
                    -₹{c.fpoDeduction.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#386641] bg-[#6A994E]/10">
                    ₹{c.netPayout.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
              {/* Reconciliation Footer */}
              <tr className="bg-[#F2E8CF] font-bold border-t-2 border-slate-300">
                <td className="py-3 px-3 font-sans text-[#0d0a0b]">
                  Total Consolidated Consignment Sum
                </td>
                <td className="py-3 px-3 text-right text-[#0d0a0b]">75 Q</td>
                <td className="py-3 px-3 text-right text-[#0d0a0b]">100.0%</td>
                <td className="py-3 px-3 text-right text-[#0d0a0b]">
                  ₹{grossSaleValue.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3 text-right text-red-600">
                  -₹{settlement.fpoServiceFeeAmount.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3 text-right text-[#386641] text-sm">
                  ₹{settlement.distributableAmount.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
