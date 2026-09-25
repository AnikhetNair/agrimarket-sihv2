import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  FileText,
  Scale,
  IndianRupee,
  Boxes,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { User, Deal, DisputeCategory } from '../../types/domain';
import { dataStore } from '../../services/dataStore';

interface RaiseDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUser: User;
  onSuccess?: () => void;
}

const CATEGORY_OPTIONS: DisputeCategory[] = [
  'Money Discrepancy',
  'Quality',
];

export const RaiseDisputeModal: React.FC<RaiseDisputeModalProps> = ({
  isOpen,
  onClose,
  activeUser,
  onSuccess,
}) => {
  const allDeals = dataStore.getDeals();
  // Filter deals relevant to user, fallback to all deals if demo user has none
  const userDeals = allDeals.filter((d) =>
    activeUser.role === 'FARMER'
      ? d.seller_id === activeUser.id || d.seller_name.toLowerCase().includes(activeUser.name.toLowerCase())
      : d.buyer_id === activeUser.id || d.buyer_name.toLowerCase().includes(activeUser.name.toLowerCase())
  );
  const eligibleDeals = userDeals.length > 0 ? userDeals : allDeals;

  const [selectedDealId, setSelectedDealId] = useState<string>(
    eligibleDeals.length > 0 ? eligibleDeals[0].id : ''
  );
  const [category, setCategory] = useState<DisputeCategory>('Money Discrepancy');
  const [description, setDescription] = useState<string>('');
  const [affectedQuantity, setAffectedQuantity] = useState<string>('');
  const [affectedAmount, setAffectedAmount] = useState<string>('');
  const [evidence, setEvidence] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const selectedDeal = eligibleDeals.find((d) => d.id === selectedDealId) || eligibleDeals[0];
  const dealQuantity = selectedDeal ? selectedDeal.quantity : 0;
  const dealGrossValue = selectedDeal
    ? (selectedDeal.gross_value ?? (selectedDeal.quantity * selectedDeal.accepted_price))
    : 0;

  const handleDealChange = (newDealId: string) => {
    setSelectedDealId(newDealId);
    // Clear entered values when switching deals to prevent stale or out-of-bounds inputs
    setAffectedQuantity('');
    setAffectedAmount('');
    setErrorMessage(null);
  };

  // Derive reactive inline validation for affected quantity (0 < qty <= dealQuantity)
  const qtyTrimmed = affectedQuantity.trim();
  const qtyNum = qtyTrimmed !== '' ? parseFloat(qtyTrimmed) : null;
  let qtyInlineError: string | null = null;
  if (qtyNum !== null) {
    if (isNaN(qtyNum) || qtyNum <= 0) {
      qtyInlineError = 'Affected quantity must be greater than 0.';
    } else if (dealQuantity > 0 && qtyNum > dealQuantity) {
      qtyInlineError = `Affected quantity cannot exceed the ${dealQuantity} Q available in this deal.`;
    }
  }

  // Derive reactive inline validation for affected amount (0 < amt <= dealGrossValue)
  const amtTrimmed = affectedAmount.trim();
  const amtNum = amtTrimmed !== '' ? parseFloat(amtTrimmed) : null;
  let amtInlineError: string | null = null;
  if (amtNum !== null) {
    if (isNaN(amtNum) || amtNum <= 0) {
      amtInlineError = 'Affected amount must be greater than 0.';
    } else if (dealGrossValue > 0 && amtNum > dealGrossValue) {
      amtInlineError = `Affected amount cannot exceed the ₹${dealGrossValue.toLocaleString('en-IN')} gross value of this deal.`;
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedDeal) {
      setErrorMessage('Please select an eligible transaction to raise a dispute against.');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage('Please provide a detailed description (at least 10 characters) explaining the dispute.');
      return;
    }

    // Explicit submission validation for Quantity (prevents submission if bounds breached)
    if (qtyInlineError) {
      setErrorMessage(qtyInlineError);
      return;
    }
    if (qtyNum !== null) {
      if (isNaN(qtyNum) || qtyNum <= 0) {
        setErrorMessage('Affected quantity must be greater than 0.');
        return;
      }
      if (dealQuantity > 0 && qtyNum > dealQuantity) {
        setErrorMessage(`Affected quantity cannot exceed the ${dealQuantity} Q available in this deal.`);
        return;
      }
    }

    // Explicit submission validation for Amount (prevents submission if bounds breached)
    if (amtInlineError) {
      setErrorMessage(amtInlineError);
      return;
    }
    if (amtNum !== null) {
      if (isNaN(amtNum) || amtNum <= 0) {
        setErrorMessage('Affected amount must be greater than 0.');
        return;
      }
      if (dealGrossValue > 0 && amtNum > dealGrossValue) {
        setErrorMessage(`Affected amount cannot exceed the ₹${dealGrossValue.toLocaleString('en-IN')} gross value of this deal.`);
        return;
      }
    }

    // Determine other party
    const isFarmer = activeUser.role === 'FARMER';
    const otherPartyId = isFarmer ? selectedDeal.buyer_id : selectedDeal.seller_id;
    const otherPartyName = isFarmer ? selectedDeal.buyer_name : selectedDeal.seller_name;
    const otherPartyRole = isFarmer ? 'BUYER' : 'FARMER';

    dataStore.raiseDispute({
      transactionId: selectedDeal.id,
      dealId: selectedDeal.id,
      dealNumber: selectedDeal.deal_number,
      lotId: selectedDeal.lot_id,
      commodity: selectedDeal.commodity,
      raisedBy: activeUser.id,
      raisedByName: activeUser.name,
      raisedByRole: activeUser.role as 'FARMER' | 'BUYER',
      otherPartyId,
      otherPartyName,
      otherPartyRole,
      category,
      description: description.trim(),
      affectedQuantity: qtyNum !== null ? qtyNum : undefined,
      affectedAmount: amtNum !== null ? amtNum : undefined,
      evidence: evidence.trim(),
    });

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
      if (onSuccess) onSuccess();
    }, 1200);
  };

  return (
    <div
      id="raise-dispute-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div
        id="raise-dispute-dialog"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden transition-all my-8 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#386641] to-[#2b5133] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/15 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Raise Transaction Dispute</h2>
              <p className="text-xs text-emerald-100">
                Submit an issue for Sahyadri FPO arbitration &amp; escrow resolution
              </p>
            </div>
          </div>
          <button
            id="btn-close-dispute-modal"
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Dispute Filed Successfully</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Your dispute has been logged under status <span className="font-semibold text-sky-700">OPEN</span>. The
              FPO arbitration desk has been notified for formal review and evidence verification.
            </p>
          </div>
        ) : (
          <form id="form-raise-dispute" onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && (
              <div
                id="dispute-error-alert"
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Transaction Selection */}
            <div>
              <label
                htmlFor="dispute-select-deal"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Transaction / Contract <span className="text-rose-500">*</span>
              </label>
              <select
                id="dispute-select-deal"
                value={selectedDealId}
                onChange={(e) => handleDealChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#386641]/30 focus:border-[#386641] transition"
              >
                {eligibleDeals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.deal_number} — {d.commodity} ({d.quantity} Q @ ₹{d.accepted_price}/Q) · With{' '}
                    {activeUser.role === 'FARMER' ? d.buyer_name : d.seller_name}
                  </option>
                ))}
              </select>
              {selectedDeal && (
                <div className="mt-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex justify-between items-center">
                  <span>
                    Gross Value: <strong className="text-slate-800">₹{dealGrossValue.toLocaleString('en-IN')}</strong>
                  </span>
                  <span>
                    Status: <span className="font-semibold text-emerald-700">{selectedDeal.status}</span>
                  </span>
                  <span>
                    Lot: <span className="font-mono text-slate-700">{selectedDeal.lot_id}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="dispute-select-category"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Dispute Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="dispute-select-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as DisputeCategory)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#386641]/30 focus:border-[#386641] transition"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="dispute-input-description"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Description &amp; Facts <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="dispute-input-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the defect, shortage, delayed payment, or specification breach in detail..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#386641]/30 focus:border-[#386641] transition placeholder:text-slate-400"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Provide clear, factual specifics that the FPO arbitrator can verify with both parties.
              </p>
            </div>

            {/* Optional Affected Quantity & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="dispute-input-quantity"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  <span>Affected quantity</span>{' '}
                  {dealQuantity > 0 && (
                    <span className="text-slate-500 font-normal">
                      (max {dealQuantity} Q)
                    </span>
                  )}{' '}
                  <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Boxes className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    id="dispute-input-quantity"
                    type="number"
                    step="any"
                    min="0.01"
                    max={dealQuantity > 0 ? dealQuantity : undefined}
                    value={affectedQuantity}
                    onChange={(e) => {
                      setAffectedQuantity(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder={dealQuantity > 0 ? `e.g. ${Math.min(5, dealQuantity)}` : 'e.g. 5'}
                    className={`w-full bg-slate-50 border rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 transition placeholder:text-slate-400 ${
                      qtyInlineError
                        ? 'border-rose-400 focus:ring-rose-300 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-300 focus:ring-[#386641]/30 focus:border-[#386641]'
                    }`}
                  />
                </div>
                {qtyInlineError && (
                  <p id="error-affected-quantity" className="text-[11px] text-rose-600 font-medium mt-1 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>{qtyInlineError}</span>
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="dispute-input-amount"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  <span>Affected amount</span>{' '}
                  {dealGrossValue > 0 && (
                    <span className="text-slate-500 font-normal">
                      (max ₹{dealGrossValue.toLocaleString('en-IN')})
                    </span>
                  )}{' '}
                  <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    id="dispute-input-amount"
                    type="number"
                    step="any"
                    min="1"
                    max={dealGrossValue > 0 ? dealGrossValue : undefined}
                    value={affectedAmount}
                    onChange={(e) => {
                      setAffectedAmount(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder={dealGrossValue > 0 ? `e.g. ${Math.min(15500, dealGrossValue)}` : 'e.g. 15500'}
                    className={`w-full bg-slate-50 border rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 transition placeholder:text-slate-400 ${
                      amtInlineError
                        ? 'border-rose-400 focus:ring-rose-300 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-300 focus:ring-[#386641]/30 focus:border-[#386641]'
                    }`}
                  />
                </div>
                {amtInlineError && (
                  <p id="error-affected-amount" className="text-[11px] text-rose-600 font-medium mt-1 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>{amtInlineError}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Evidence / Additional details */}
            <div>
              <label
                htmlFor="dispute-input-evidence"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Supporting Evidence / Slip Reference <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  id="dispute-input-evidence"
                  type="text"
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder="e.g. Inward QC slip #QC-9921 or electronic weighbridge slip #WB-4412"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#386641]/30 focus:border-[#386641] transition placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Info notice */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-start space-x-2">
              <HelpCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                Dispute submission assigns a verified ID and immediately places the dispute in the FPO queue.
                Escrow funds remain protected until final resolution.
              </span>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                id="btn-cancel-raise-dispute"
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-submit-raise-dispute"
                type="submit"
                disabled={Boolean(qtyInlineError || amtInlineError)}
                className="px-5 py-2 bg-[#386641] hover:bg-[#2b5133] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center space-x-1.5"
              >
                <AlertTriangle className="w-4 h-4 text-amber-300" />
                <span>Submit Dispute</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
