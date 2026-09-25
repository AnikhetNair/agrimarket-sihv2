import React, { useState, useEffect } from 'react';
import {
  Scale,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Boxes,
  IndianRupee,
  User,
  Building2,
  FileText,
  Truck,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  Send,
  Eye,
  Lock,
} from 'lucide-react';
import { Dispute, DisputeStatus, FpoResolutionDecision, Deal } from '../../types/domain';
import { dataStore } from '../../services/dataStore';

interface FpoDisputeWorkspaceProps {
  currentUser: { id: string; name: string; role: string };
}

export const FpoDisputeWorkspace: React.FC<FpoDisputeWorkspaceProps> = ({ currentUser }) => {
  const [disputes, setDisputes] = useState<Dispute[]>(dataStore.getDisputes());
  const [selectedDisputeId, setSelectedDisputeId] = useState<string>(
    disputes.length > 0 ? disputes[0].id : ''
  );
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Resolution Form State
  const [decision, setDecision] = useState<FpoResolutionDecision>('FARMER_FAVOR');
  const [resolutionNote, setResolutionNote] = useState<string>('');
  const [resolvedQuantity, setResolvedQuantity] = useState<string>('');
  const [resolvedAmount, setResolvedAmount] = useState<string>('');
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Subscribe to dataStore changes for real-time synchronization
  useEffect(() => {
    const unsubscribe = dataStore.subscribeToDisputes(() => {
      const updated = [...dataStore.getDisputes()];
      setDisputes(updated);
    });
    return unsubscribe;
  }, []);

  // Filtered disputes
  const filteredDisputes = disputes.filter((d) => {
    if (filterStatus !== 'ALL' && d.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.id.toLowerCase().includes(q) ||
        d.deal_number.toLowerCase().includes(q) ||
        d.raised_by_name.toLowerCase().includes(q) ||
        (d.other_party_name && d.other_party_name.toLowerCase().includes(q)) ||
        d.category.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedDispute =
    disputes.find((d) => d.id === selectedDisputeId) || filteredDisputes[0] || disputes[0];

  // Associated deal from dataStore
  const associatedDeal: Deal | undefined = selectedDispute
    ? dataStore.getDeals().find(
        (d) =>
          d.id === selectedDispute.deal_id ||
          d.id === selectedDispute.transaction_id ||
          d.deal_number === selectedDispute.deal_number
      )
    : undefined;

  // Associated payment
  const associatedPayment = associatedDeal
    ? dataStore.getPaymentForDeal(associatedDeal.id)
    : undefined;

  // Counts
  const countTotal = disputes.length;
  const countOpen = disputes.filter((d) => d.status === 'OPEN').length;
  const countUnderReview = disputes.filter((d) => d.status === 'UNDER_REVIEW').length;
  const countResolved = disputes.filter((d) => d.status === 'RESOLVED').length;

  const handleStartReview = () => {
    if (!selectedDispute) return;
    dataStore.startDisputeReview(selectedDispute.id, {
      id: currentUser.id,
      name: currentUser.name,
      role: 'FPO',
    });
    setActionSuccess('Dispute placed under formal review by Sahyadri FPO arbitration.');
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleResolveDispute = (e: React.FormEvent) => {
    e.preventDefault();
    setResolutionError(null);

    if (!selectedDispute) return;

    if (!resolutionNote.trim() || resolutionNote.trim().length < 15) {
      setResolutionError('Please provide a comprehensive resolution note (at least 15 characters) detailing the arbitration decision.');
      return;
    }

    const qtyNum = resolvedQuantity.trim() ? parseFloat(resolvedQuantity) : undefined;
    const amtNum = resolvedAmount.trim() ? parseFloat(resolvedAmount) : undefined;

    if (decision === 'PARTIAL_RESOLUTION') {
      if (amtNum !== undefined && (isNaN(amtNum) || amtNum < 0)) {
        setResolutionError('Resolved settlement amount must be a valid non-negative number.');
        return;
      }
    }

    dataStore.resolveDispute(selectedDispute.id, {
      decision,
      resolutionNote: resolutionNote.trim(),
      resolvedQuantity: qtyNum,
      resolvedAmount: amtNum,
      resolvedBy: currentUser.id,
      resolvedByName: `${currentUser.name} (Sahyadri FPO)`,
    });

    setActionSuccess('Dispute resolved successfully. Resolution broadcast to both Farmer and Buyer.');
    setResolutionNote('');
    setResolvedQuantity('');
    setResolvedAmount('');
    setTimeout(() => setActionSuccess(null), 5000);
  };

  return (
    <div id="fpo-dispute-workspace" className="space-y-6">
      {/* Top Banner & Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-[#386641]/10 rounded-xl text-[#386641]">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">FPO Dispute &amp; Arbitration Desk</h1>
                <p className="text-xs text-slate-500">
                  Sahyadri Farmers Producer Company · Independent Escrow Settlement &amp; Consignment Arbitration
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-semibold block">TOTAL</span>
              <span className="text-sm font-bold text-slate-800">{countTotal}</span>
            </div>
            <div className="px-3 py-1.5 bg-sky-50 rounded-xl border border-sky-200 text-center">
              <span className="text-[10px] text-sky-700 font-semibold block">OPEN</span>
              <span className="text-sm font-bold text-sky-800">{countOpen}</span>
            </div>
            <div className="px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-200 text-center">
              <span className="text-[10px] text-amber-700 font-semibold block">IN REVIEW</span>
              <span className="text-sm font-bold text-amber-800">{countUnderReview}</span>
            </div>
            <div className="px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
              <span className="text-[10px] text-emerald-700 font-semibold block">RESOLVED</span>
              <span className="text-sm font-bold text-emerald-800">{countResolved}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionSuccess && (
        <div
          id="fpo-dispute-success-alert"
          className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center justify-between shadow-xs animate-in fade-in"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Empty State when zero disputes exist */}
      {disputes.length === 0 ? (
        <div id="fpo-no-disputes-empty-state" className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No disputes to review</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            New disputes raised by farmers or buyers will appear here.
          </p>
        </div>
      ) : (
        /* Main 2-Column Split View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List & Filter (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            {/* Search & Status Filter Tabs */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                id="input-fpo-search-disputes"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dispute ID, deal, party, or keyword..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#386641]/30 focus:border-[#386641] transition placeholder:text-slate-400"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              {[
                { key: 'ALL', label: 'All' },
                { key: 'OPEN', label: `Open (${countOpen})` },
                { key: 'UNDER_REVIEW', label: `In Review (${countUnderReview})` },
                { key: 'RESOLVED', label: `Resolved (${countResolved})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  id={`tab-filter-${tab.key.toLowerCase()}`}
                  onClick={() => setFilterStatus(tab.key)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center transition cursor-pointer ${
                    filterStatus === tab.key
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* List of Dispute Cards */}
          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredDisputes.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                No disputes found matching the current filter.
              </div>
            ) : (
              filteredDisputes.map((d) => {
                const isSelected = selectedDispute && selectedDispute.id === d.id;
                return (
                  <div
                    key={d.id}
                    id={`fpo-dispute-item-${d.id}`}
                    onClick={() => setSelectedDisputeId(d.id)}
                    className={`p-4 rounded-xl border transition cursor-pointer text-xs space-y-2 ${
                      isSelected
                        ? 'bg-[#386641]/5 border-[#386641] shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-900">{d.id}</span>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono text-slate-600 font-semibold">{d.deal_number}</span>
                      </div>

                      {/* Status pill */}
                      {d.status === 'OPEN' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          OPEN
                        </span>
                      )}
                      {d.status === 'UNDER_REVIEW' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                          UNDER REVIEW
                        </span>
                      )}
                      {d.status === 'RESOLVED' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          RESOLVED
                        </span>
                      )}
                    </div>

                    {/* Opposing Parties & Category */}
                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span>
                          From: <strong className="text-slate-800">{d.raised_by_name}</strong> ({d.raised_by_role || 'Party'})
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span>
                          Vs: <span className="text-slate-700 font-medium">{d.other_party_name || 'Counterparty'}</span>
                        </span>
                        <span className="font-semibold text-slate-800">{d.category}</span>
                      </div>
                    </div>

                    {/* Scale and date */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>
                        {d.affected_amount ? `₹${d.affected_amount.toLocaleString('en-IN')}` : ''}
                        {d.affected_quantity ? ` (${d.affected_quantity} Q)` : ''}
                        {!d.affected_amount && !d.affected_quantity && 'Standard inquiry'}
                      </span>
                      <span>
                        {new Date(d.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Dispute Detail, Deal Context & Arbitration Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {selectedDispute ? (
            <>
              {/* Dispute Summary Card */}
              <div
                id={`dispute-detail-panel-${selectedDispute.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-base font-bold text-slate-900">
                        {selectedDispute.id}
                      </span>
                      <span className="text-slate-300">/</span>
                      <span className="font-mono text-sm font-semibold text-[#386641]">
                        {selectedDispute.deal_number}
                      </span>
                      {selectedDispute.lot_id && (
                        <>
                          <span className="text-slate-300">/</span>
                          <span className="text-xs text-slate-500 font-mono">
                            Lot: {selectedDispute.lot_id}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Submitted on{' '}
                      {new Date(selectedDispute.created_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Status badge */}
                  <div>
                    {selectedDispute.status === 'OPEN' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>OPEN FOR REVIEW</span>
                      </span>
                    )}
                    {selectedDispute.status === 'UNDER_REVIEW' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>UNDER ACTIVE REVIEW</span>
                      </span>
                    )}
                    {selectedDispute.status === 'RESOLVED' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>ARBITRATION RESOLVED</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Parties Involved */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Complainant (Raised By)
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                        {selectedDispute.raised_by_name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{selectedDispute.raised_by_name}</span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Role: <strong className="text-slate-700">{selectedDispute.raised_by_role || 'Complainant'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Respondent (Opposing Party)
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                        {(selectedDispute.other_party_name || 'C').charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">
                          {selectedDispute.other_party_name || 'Consignment Counterparty'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Role: <strong className="text-slate-700">{selectedDispute.other_party_role || 'Counterparty'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category & Claim Dimensions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">Category</span>
                    <span className="font-bold text-slate-800 text-xs">{selectedDispute.category}</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">Affected Quantity</span>
                    <span className="font-bold text-slate-800 text-xs">
                      {selectedDispute.affected_quantity ? `${selectedDispute.affected_quantity} Quintals` : 'Unspecified'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">Affected Amount</span>
                    <span className="font-bold text-slate-900 text-xs">
                      {selectedDispute.affected_amount
                        ? `₹${selectedDispute.affected_amount.toLocaleString('en-IN')}`
                        : 'Unspecified'}
                    </span>
                  </div>
                </div>

                {/* Description Statement */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700">Complainant Statement:</span>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed">
                    {selectedDispute.description}
                  </div>
                </div>

                {/* Evidence / Slip details */}
                {selectedDispute.evidence && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>Submitted Evidence / QC Slip:</span>
                    </span>
                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
                      {selectedDispute.evidence}
                    </div>
                  </div>
                )}
              </div>

              {/* Transaction Context Card (Grounding in Deals & Payments) */}
              <div
                id="dispute-transaction-context"
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3"
              >
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                  <Building2 className="w-4 h-4 text-[#386641]" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Consignment &amp; Transaction Context
                  </h3>
                </div>

                {associatedDeal ? (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-semibold">Commodity</span>
                        <span className="font-bold text-slate-800">{associatedDeal.commodity}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-semibold">Agreed Price</span>
                        <span className="font-bold text-slate-800">₹{associatedDeal.accepted_price}/Q</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-semibold">Contract Quantity</span>
                        <span className="font-bold text-slate-800">{associatedDeal.quantity} Quintals</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-semibold">Gross Value</span>
                        <span className="font-bold text-slate-900">₹{associatedDeal.gross_value.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-[11px] text-slate-600">
                      <div className="flex justify-between">
                        <span>Delivery Mode: <strong className="text-slate-800">{associatedDeal.delivery_mode.replace(/_/g, ' ')}</strong></span>
                        <span>Deal Status: <strong className="text-emerald-700">{associatedDeal.status}</strong></span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pickup: <strong className="text-slate-800">{associatedDeal.pickup_location}</strong></span>
                        <span>Delivery: <strong className="text-slate-800">{associatedDeal.delivery_location}</strong></span>
                      </div>
                      {associatedPayment && (
                        <div className="pt-1.5 border-t border-slate-200 flex justify-between text-slate-700">
                          <span>Escrow Payment Status: <strong className="text-emerald-700">{associatedPayment.status}</strong></span>
                          <span>Ref: <strong className="font-mono text-[10px] text-slate-600">{associatedPayment.reference}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Historical deal record #{selectedDispute.deal_number} loaded from archive.
                  </p>
                )}
              </div>

              {/* FPO Actions / Resolution Desk */}
              <div
                id="fpo-dispute-action-panel"
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
              >
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <Scale className="w-5 h-5 text-[#386641]" />
                  <h3 className="text-sm font-bold text-slate-900">FPO Arbitration &amp; Settlement Actions</h3>
                </div>

                {/* State 1: OPEN -> UNDER_REVIEW */}
                {selectedDispute.status === 'OPEN' && (
                  <div className="space-y-4 bg-sky-50/60 border border-sky-200 p-4 rounded-xl text-xs">
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-sky-900 text-sm">Dispute Awaiting Formal Intake</h4>
                        <p className="text-sky-800 mt-1">
                          This dispute has been submitted and is currently in the open intake queue. Initiate formal review to examine inspection slips, weighbridge certificates, and contact both parties.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        id="btn-fpo-start-review"
                        type="button"
                        onClick={handleStartReview}
                        className="px-5 py-2.5 bg-[#386641] hover:bg-[#2b5133] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center space-x-2"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-300" />
                        <span>Start Formal Review</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* State 2: UNDER_REVIEW -> RESOLVED (Resolution Desk) */}
                {selectedDispute.status === 'UNDER_REVIEW' && (
                  <form onSubmit={handleResolveDispute} className="space-y-4">
                    <p className="text-xs text-slate-600">
                      Dispute is under active investigation. Formulate the official binding decision, attach the resolution note, and credit adjustments.
                    </p>

                    {resolutionError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                        <span>{resolutionError}</span>
                      </div>
                    )}

                    {/* Decision Choice Radio Cards */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-2">
                        Arbitration Decision <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          id="btn-decision-farmer-favor"
                          onClick={() => setDecision('FARMER_FAVOR')}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                            decision === 'FARMER_FAVOR'
                              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="font-bold text-xs text-slate-900 block">
                            Farmer's Favor
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Buyer claim dismissed; farmer entitled to full realization.
                          </span>
                        </button>

                        <button
                          type="button"
                          id="btn-decision-buyer-favor"
                          onClick={() => setDecision('BUYER_FAVOR')}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                            decision === 'BUYER_FAVOR'
                              ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="font-bold text-xs text-slate-900 block">
                            Buyer's Favor
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Buyer claim sustained; full debit note / refund issued.
                          </span>
                        </button>

                        <button
                          type="button"
                          id="btn-decision-partial"
                          onClick={() => setDecision('PARTIAL_RESOLUTION')}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                            decision === 'PARTIAL_RESOLUTION'
                              ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/20'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="font-bold text-xs text-slate-900 block">
                            Partial Settlement
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Mutual compromise with adjusted weight / credit terms.
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Resolution Note */}
                    <div>
                      <label
                        htmlFor="input-resolution-note"
                        className="block text-xs font-bold text-slate-800 mb-1"
                      >
                        Arbitration Findings &amp; Resolution Note <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        id="input-resolution-note"
                        rows={3}
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        placeholder="Detail the audit findings, sample testing results, and specific adjustment terms..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#386641]/30 focus:border-[#386641] transition placeholder:text-slate-400"
                      />
                    </div>

                    {/* Partial Settlement Amount & Qty (conditional or available for partial settlement) */}
                    {decision === 'PARTIAL_RESOLUTION' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-purple-50/50 border border-purple-200 rounded-xl">
                        <div>
                          <label
                            htmlFor="input-resolved-quantity"
                            className="block text-[11px] font-semibold text-purple-900 mb-1"
                          >
                            Adjusted Quantity (Quintals)
                          </label>
                          <input
                            id="input-resolved-quantity"
                            type="number"
                            step="0.1"
                            value={resolvedQuantity}
                            onChange={(e) => setResolvedQuantity(e.target.value)}
                            placeholder="e.g. 2.5"
                            className="w-full bg-white border border-purple-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="input-resolved-amount"
                            className="block text-[11px] font-semibold text-purple-900 mb-1"
                          >
                            Final Reconciled Amount (₹)
                          </label>
                          <input
                            id="input-resolved-amount"
                            type="number"
                            step="100"
                            value={resolvedAmount}
                            onChange={(e) => setResolvedAmount(e.target.value)}
                            placeholder="e.g. 7750"
                            className="w-full bg-white border border-purple-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        id="btn-submit-resolution"
                        type="submit"
                        className="w-full sm:w-auto px-6 py-2.5 bg-[#386641] hover:bg-[#2b5133] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center space-x-2"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-300" />
                        <span>Submit Final Binding Resolution</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* State 3: RESOLVED -> Read-only display */}
                {selectedDispute.status === 'RESOLVED' && (
                  <div
                    id="fpo-resolved-record"
                    className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-3 text-xs text-emerald-950"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="font-bold text-emerald-900">Binding Arbitration Finalized</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {selectedDispute.fpo_resolution
                          ? selectedDispute.fpo_resolution.replace(/_/g, ' ')
                          : 'RESOLVED'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                        Resolution Note &amp; Findings
                      </span>
                      <p className="font-medium leading-relaxed bg-white/70 p-3 rounded-lg border border-emerald-200">
                        {selectedDispute.resolution_note || selectedDispute.resolution}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-200/70 text-[11px]">
                      <div>
                        <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Arbitrated By</span>
                        <span className="font-semibold">{selectedDispute.resolved_by_name || 'Sahyadri FPO'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Settlement Amount</span>
                        <span className="font-bold">
                          {selectedDispute.resolved_amount
                            ? `₹${selectedDispute.resolved_amount.toLocaleString('en-IN')}`
                            : 'Full Escrow Cleared'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Resolved On</span>
                        <span className="font-semibold">
                          {selectedDispute.resolved_at
                            ? new Date(selectedDispute.resolved_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Recent'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 text-[10px] text-emerald-700/80 italic pt-1">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      <span>This record has been published to both parties and is permanently archived.</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              Select a dispute from the list to view detailed transaction facts and perform arbitration.
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
