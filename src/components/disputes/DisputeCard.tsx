import React from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Scale,
  Calendar,
  Boxes,
  IndianRupee,
  FileText,
  User as UserIcon,
  ShieldCheck,
  Building2,
  Lock,
} from 'lucide-react';
import { Dispute, User } from '../../types/domain';

interface DisputeCardProps {
  dispute: Dispute;
  currentUser: User;
}

export const DisputeCard: React.FC<DisputeCardProps> = ({ dispute, currentUser }) => {
  const isFarmer = currentUser.role === 'FARMER';
  const counterPartyLabel = isFarmer ? 'Buyer' : 'Farmer / Seller';
  const counterPartyName = isFarmer
    ? dispute.other_party_role === 'BUYER'
      ? dispute.other_party_name
      : dispute.raised_by_name
    : dispute.other_party_role === 'FARMER'
    ? dispute.other_party_name
    : dispute.raised_by_name;

  const isRaisedByMe = dispute.raised_by === currentUser.id;

  const getStatusBadge = () => {
    switch (dispute.status) {
      case 'OPEN':
        return (
          <span
            id={`badge-status-${dispute.id}`}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>OPEN</span>
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span
            id={`badge-status-${dispute.id}`}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>UNDER REVIEW</span>
          </span>
        );
      case 'RESOLVED':
        return (
          <span
            id={`badge-status-${dispute.id}`}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>RESOLVED</span>
          </span>
        );
      default:
        return (
          <span
            id={`badge-status-${dispute.id}`}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200"
          >
            <span>{dispute.status}</span>
          </span>
        );
    }
  };

  const getDecisionBadge = () => {
    if (!dispute.fpo_resolution) return null;
    switch (dispute.fpo_resolution) {
      case 'FARMER_FAVOR':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Resolved in Farmer's Favor
          </span>
        );
      case 'BUYER_FAVOR':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            Resolved in Buyer's Favor
          </span>
        );
      case 'PARTIAL_RESOLUTION':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            Partial Settlement / Mutual Compromise
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      id={`dispute-card-${dispute.id}`}
      className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition p-5 space-y-4"
    >
      {/* Top row: ID, Deal Number, Date, Status */}
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-slate-900">{dispute.id}</span>
            <span className="text-slate-300">·</span>
            <span className="font-mono text-xs font-semibold text-[#386641]">{dispute.deal_number}</span>
            {dispute.lot_id && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-[11px] text-slate-500 font-mono">Lot: {dispute.lot_id}</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Filed on{' '}
              {new Date(dispute.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600">
              {isRaisedByMe ? (
                <span className="font-medium text-slate-700">Raised by you</span>
              ) : (
                <span>
                  Raised by <strong className="text-slate-700">{dispute.raised_by_name}</strong>
                </span>
              )}
            </span>
          </div>
        </div>

        <div>{getStatusBadge()}</div>
      </div>

      {/* Main info row: Category, Opposing party, Affected qty & amount */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Dispute Category</span>
          <span className="font-bold text-slate-800">{dispute.category}</span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">{counterPartyLabel}</span>
          <div className="flex items-center space-x-1 font-medium text-slate-800">
            <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{counterPartyName || 'Consignment Counterparty'}</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Affected Scale</span>
          <div className="flex items-center space-x-2 text-slate-700 font-medium">
            {dispute.affected_quantity ? (
              <span className="flex items-center space-x-0.5">
                <Boxes className="w-3.5 h-3.5 text-slate-400" />
                <span>{dispute.affected_quantity} Q</span>
              </span>
            ) : null}
            {dispute.affected_amount ? (
              <span className="flex items-center space-x-0.5 font-bold text-slate-900">
                <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                <span>₹{dispute.affected_amount.toLocaleString('en-IN')}</span>
              </span>
            ) : null}
            {!dispute.affected_quantity && !dispute.affected_amount && (
              <span className="text-slate-400 italic">Unspecified</span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
          Description &amp; Claim
        </span>
        <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
          {dispute.description}
        </p>
      </div>

      {/* Evidence if provided */}
      {dispute.evidence && (
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center space-x-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Supporting Evidence / Slip Reference</span>
          </span>
          <div className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 font-mono text-[11px]">
            {dispute.evidence}
          </div>
        </div>
      )}

      {/* FPO Arbitration Resolution (Shown when RESOLVED) */}
      {dispute.status === 'RESOLVED' && (
        <div
          id={`fpo-resolution-box-${dispute.id}`}
          className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-4 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/80 pb-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-emerald-950">FPO Formal Arbitration Resolution</span>
            </div>
            {getDecisionBadge()}
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
              Resolution Finding &amp; Terms
            </span>
            <p className="text-xs text-emerald-900 leading-relaxed font-medium">
              {dispute.resolution_note || dispute.resolution}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-800">
            <div>
              <span className="text-[10px] text-emerald-600 uppercase font-semibold block">Arbitrated By</span>
              <span className="font-semibold flex items-center space-x-1">
                <Building2 className="w-3 h-3 text-emerald-600" />
                <span>{dispute.resolved_by_name || 'Sahyadri Farmers Producer Co. (FPO)'}</span>
              </span>
            </div>

            <div>
              <span className="text-[10px] text-emerald-600 uppercase font-semibold block">Resolved On</span>
              <span className="font-semibold">
                {dispute.resolved_at
                  ? new Date(dispute.resolved_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Recent'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-emerald-600 uppercase font-semibold block">Resolved Settlement</span>
              <span className="font-bold text-emerald-950">
                {dispute.resolved_amount
                  ? `₹${dispute.resolved_amount.toLocaleString('en-IN')}`
                  : 'Reconciled & Cleared'}
                {dispute.resolved_quantity ? ` (${dispute.resolved_quantity} Q adjusted)` : ''}
              </span>
            </div>
          </div>

          {/* Read-only notification badge */}
          <div className="flex items-center space-x-1 text-[10px] text-emerald-700/80 italic pt-1">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>This arbitration resolution is finalized and binding on all transaction parties.</span>
          </div>
        </div>
      )}
    </div>
  );
};
