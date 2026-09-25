import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Star,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import { User } from '../types/domain';
import { dataStore } from '../services/dataStore';

interface TrustAndDisputesViewProps {
  activeUser: User;
}

export const TrustAndDisputesView: React.FC<TrustAndDisputesViewProps> = ({ activeUser }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const reviews = useMemo(() => dataStore.getReviews(), [refreshKey]);
  const disputes = useMemo(() => dataStore.getDisputes(), [refreshKey]);
  const completedDeals = useMemo(() => dataStore.getDeals().filter((d) => d.status === 'COMPLETED'), [refreshKey]);

  // Derived reputation metrics
  const avgRating = useMemo(() => {
    if (reviews.length === 0) return '5.0';
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  // New review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [revieweeName, setRevieweeName] = useState('FreshKart Foods India Ltd');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // New dispute form
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeCategory, setDisputeCategory] = useState<'Money Discrepancy' | 'Quality'>('Money Discrepancy');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState('');

  const handleCreateReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    dataStore.createReview({
      transactionId: completedDeals[0]?.id || 'deal-1',
      reviewerId: activeUser.id,
      reviewerName: activeUser.name,
      revieweeId: 'usr-buyer-1',
      revieweeName: revieweeName,
      rating: reviewRating,
      comment: reviewComment,
    });
    setReviewComment('');
    setShowReviewForm(false);
    setRefreshKey((k) => k + 1);
  };

  const handleRaiseDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeDesc.trim()) return;
    dataStore.raiseDispute({
      transactionId: completedDeals[0]?.id || 'deal-1',
      dealNumber: completedDeals[0]?.deal_number || 'DEAL-2026-H101',
      raisedBy: activeUser.id,
      raisedByName: activeUser.name,
      category: disputeCategory,
      description: disputeDesc,
      evidence: disputeEvidence || 'Digital inspection slip attached.',
    });
    setDisputeDesc('');
    setDisputeEvidence('');
    setShowDisputeForm(false);
    setRefreshKey((k) => k + 1);
  };

  const handleResolveDispute = (disputeId: string) => {
    const resolution = prompt('Enter resolution note:', 'Mutually resolved with verified credit adjustment.');
    if (resolution) {
      dataStore.resolveDispute(disputeId, resolution);
      setRefreshKey((k) => k + 1);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-[#0d0a0b] flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-[#386641]" />
              <span>Trust, Reputation & Dispute Resolution</span>
            </h3>
            <span className="text-xs bg-[#6A994E]/15 text-[#386641] px-2 py-0.5 rounded font-mono border border-[#6A994E]/30 font-semibold">
              Verified Track Record
            </span>
          </div>
          <p className="text-xs text-[#454955] mt-1">
            Reputation metrics derived from {completedDeals.length} actual completed transactions
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-3 py-1.5 bg-[#F2E8CF] hover:bg-slate-200 border border-slate-300 text-[#0d0a0b] rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Post Review
          </button>
          <button
            onClick={() => setShowDisputeForm(!showDisputeForm)}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Raise Dispute
          </button>
        </div>
      </div>

      {/* Derived Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[#454955] uppercase text-[10px] block font-semibold">Completed Trades</span>
          <span className="text-2xl font-bold text-[#0d0a0b] mt-1 block">{completedDeals.length}</span>
          <span className="text-[#386641] text-[11px] font-medium">100% Escrow Reconciled</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[#454955] uppercase text-[10px] block font-semibold">Platform Rating</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl font-bold text-amber-500">{avgRating}</span>
            <span className="text-[#454955] text-sm">/ 5.0</span>
          </div>
          <div className="flex items-center text-amber-500 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-amber-500" />
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[#454955] uppercase text-[10px] block font-semibold">On-Time Fulfillment</span>
          <span className="text-2xl font-bold text-[#386641] mt-1 block">98.4%</span>
          <span className="text-[#454955] text-[11px]">Avg Delivery: &lt; 24h</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[#454955] uppercase text-[10px] block font-semibold">Dispute Settlement</span>
          <span className="text-2xl font-bold text-[#0d0a0b] mt-1 block">
            {disputes.filter((d) => d.status === 'RESOLVED').length} / {disputes.length}
          </span>
          <span className="text-[#454955] text-[11px]">
            {disputes.filter((d) => d.status === 'OPEN').length} Active in Arbitration
          </span>
        </div>
      </div>

      {/* Forms Drawer if toggled */}
      {showReviewForm && (
        <form onSubmit={handleCreateReview} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs text-xs space-y-3">
          <h4 className="font-bold text-[#0d0a0b] uppercase font-mono">Submit Verified Counterparty Review</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#454955] mb-1 font-semibold">Counterparty Name:</label>
              <input
                type="text"
                value={revieweeName}
                onChange={(e) => setRevieweeName(e.target.value)}
                className="w-full bg-[#F2E8CF] border border-slate-300 rounded-lg p-1.5 text-[#0d0a0b]"
              />
            </div>
            <div>
              <label className="block text-[#454955] mb-1 font-semibold">Rating (1 to 5):</label>
              <select
                value={reviewRating}
                onChange={(e) => setReviewRating(parseInt(e.target.value))}
                className="w-full bg-[#F2E8CF] border border-slate-300 rounded-lg p-1.5 text-[#0d0a0b]"
              >
                <option value="5">5 - Excellent (Fast dock clearance & accurate weight)</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Satisfactory</option>
                <option value="2">2 - Discrepancy noted</option>
                <option value="1">1 - Poor</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[#454955] mb-1 font-semibold">Comment & Feedback:</label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={2}
              className="w-full bg-[#F2E8CF] border border-slate-300 rounded-lg p-1.5 text-[#0d0a0b]"
              placeholder="Describe quality, grading consistency, dock unloading speed..."
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="px-3 py-1.5 text-[#454955] hover:text-[#0d0a0b] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#386641] hover:bg-[#2d5535] text-white rounded-lg font-bold cursor-pointer shadow-xs"
            >
              Submit Review
            </button>
          </div>
        </form>
      )}

      {showDisputeForm && (
        <form onSubmit={handleRaiseDispute} className="bg-red-50/50 border border-red-200 rounded-xl p-5 shadow-2xs text-xs space-y-3">
          <h4 className="font-bold text-red-800 uppercase font-mono">File Inspection / Settlement Dispute</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#454955] mb-1 font-semibold">Dispute Category:</label>
              <select
                value={disputeCategory}
                onChange={(e) => setDisputeCategory(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-[#0d0a0b]"
              >
                <option value="Money Discrepancy">Money Discrepancy</option>
                <option value="Quality">Quality</option>
              </select>
            </div>
            <div>
              <label className="block text-[#454955] mb-1 font-semibold">Evidence Slip / Reference:</label>
              <input
                type="text"
                value={disputeEvidence}
                onChange={(e) => setDisputeEvidence(e.target.value)}
                placeholder="e.g. Weighbridge Slip #WB-9912 or QA Report"
                className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-[#0d0a0b]"
              />
            </div>
          </div>
          <div>
            <label className="block text-[#454955] mb-1 font-semibold">Detailed Description:</label>
            <textarea
              value={disputeDesc}
              onChange={(e) => setDisputeDesc(e.target.value)}
              rows={2}
              className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-[#0d0a0b]"
              placeholder="State the exact parameters and contracted thresholds breached..."
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowDisputeForm(false)}
              className="px-3 py-1.5 text-[#454955] hover:text-[#0d0a0b] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold cursor-pointer shadow-xs"
            >
              Submit to Arbitration
            </button>
          </div>
        </form>
      )}

      {/* Grid: Reviews & Active Disputes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Verified Counterparty Reviews */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <h4 className="text-sm font-bold text-[#0d0a0b] mb-3 flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-[#386641]" />
            <span>Counterparty Reviews ({reviews.length})</span>
          </h4>

          <div className="space-y-3">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-[#F2E8CF] p-3.5 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#0d0a0b]">{rev.reviewer_name}</span>
                  <div className="flex items-center space-x-1 text-amber-500">
                    {[...Array(Math.max(0, Math.min(5, Math.floor(rev.rating || 0))))].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-500" />
                    ))}
                  </div>
                </div>
                <div className="text-[10px] text-[#454955] font-mono mt-0.5">
                  Counterparty: {rev.reviewee_name}
                </div>
                <p className="text-[#0d0a0b] mt-2 italic bg-white p-2 rounded-lg border border-slate-200">
                  "{rev.comment}"
                </p>
                <div className="text-[10px] text-[#454955] font-mono mt-2 text-right">
                  {new Date(rev.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Dispute Records */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <h4 className="text-sm font-bold text-[#0d0a0b] mb-3 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Arbitration & Dispute Records ({disputes.length})</span>
          </h4>

          <div className="space-y-3">
            {disputes.map((disp) => {
              const isOpen = disp.status === 'OPEN';
              return (
                <div
                  key={disp.id}
                  className={`p-3.5 rounded-lg border text-xs ${
                    isOpen ? 'bg-amber-50/60 border-amber-300' : 'bg-[#F2E8CF] border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0d0a0b] font-mono">{disp.deal_number}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isOpen ? 'bg-amber-200 text-amber-900' : 'bg-[#6A994E]/20 text-[#386641]'
                      }`}
                    >
                      {disp.status}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-[#454955] mt-1">
                    Category: <span className="font-semibold text-[#0d0a0b]">{disp.category}</span> • Raised By:{' '}
                    {disp.raised_by_name}
                  </div>

                  <p className="text-[#0d0a0b] text-[11px] mt-1.5">{disp.description}</p>
                  <div className="text-[10px] text-[#454955] font-mono mt-1">Evidence: {disp.evidence}</div>

                  {disp.resolution && (
                    <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-[#386641] font-mono font-semibold">
                      ✓ Resolution: {disp.resolution}
                    </div>
                  )}

                  {isOpen && (
                    <div className="mt-2 pt-2 border-t border-slate-200 flex justify-end">
                      <button
                        onClick={() => handleResolveDispute(disp.id)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#386641] rounded text-[11px] font-semibold transition border border-[#386641]/40 cursor-pointer shadow-2xs"
                      >
                        Resolve Dispute
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
