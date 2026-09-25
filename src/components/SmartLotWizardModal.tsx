import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  Check,
} from 'lucide-react';

import { User, ProduceLot } from '../types/domain';
import { extractLotFromNaturalLanguage } from '../services/aiService';
import { useLanguage } from '../context/LanguageContext';

interface SmartLotWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUser: User;
  onLotCreated: (lot: ProduceLot) => void;
}

export const SmartLotWizardModal: React.FC<SmartLotWizardModalProps> = ({
  isOpen,
  onClose,
  activeUser,
  onLotCreated,
}) => {
  const { t } = useLanguage();
  // Wizard Step: Step 1 (Quality Check) or Step 2 (Lot Details)
  const [step, setStep] = useState<1 | 2>(1);

  // Natural Language Input for auto-filling lot details (used in Step 2)
  const [nlInput, setNlInput] = useState(
    'I have 30 quintals of Grade A Kuroda carrots harvested yesterday in Dindori, Nashik. Seeking ₹3,100 per quintal with delivery to Pune or farm gate pickup.'
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedMessage, setExtractedMessage] = useState<string | null>(null);

  // Form fields
  const [commodity, setCommodity] = useState('Carrot');
  const [variety, setVariety] = useState('Kuroda / Hybrid');
  const [quantity, setQuantity] = useState(30);

  const [harvestDate] = useState(new Date().toISOString().split('T')[0]);
  const [origin, setOrigin] = useState('Dindori, Nashik');
  const [district] = useState('Nashik');
  const [state] = useState('Maharashtra');

  const [askingPrice, setAskingPrice] = useState(3100);
  const [minimumPrice, setMinimumPrice] = useState(2950);

  const [deliveryMode, setDeliveryMode] = useState<
    'BUYER_PICKUP_FARM_GATE' | 'DELIVERED_TO_BUYER_WAREHOUSE'
  >('DELIVERED_TO_BUYER_WAREHOUSE');

  const [transportPaidBy, setTransportPaidBy] = useState<'BUYER' | 'SELLER'>('SELLER');

  const [pickupLocation, setPickupLocation] = useState(
    'Patil Farm Gate, Dindori, Nashik'
  );

  const [packaging] = useState('Plastic Crates (25kg)');

  const [storageRequirement] = useState<
    'NONE' | 'COLD_STORAGE' | 'VENTILATED_SHED'
  >('COLD_STORAGE');

  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------
  // AI QUALITY ASSESSMENT STATE (Step 1 single source of truth)
  // ---------------------------------------------------------
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [qualityImage, setQualityImage] = useState<string | null>(null);
  const [isAssessingQuality, setIsAssessingQuality] = useState(false);

  const [qualityAssessment, setQualityAssessment] = useState<{
    predicted_class: string;
    condition: 'HEALTHY' | 'ROTTEN' | 'UNKNOWN';
    commodity: string;
    confidence: number;
    quality_score: number;
    grade: 'A' | 'B' | 'C';
    needs_manual_review: boolean;
  } | null>(null);

  // Reset to Step 1 when modal is opened fresh
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ---------------------------------------------------------
  // GEMINI NATURAL LANGUAGE EXTRACTION (For Step 2 details)
  // ---------------------------------------------------------
  const handleAiExtract = async () => {
    if (!nlInput.trim()) return;

    setIsExtracting(true);
    setExtractedMessage(null);

    try {
      const extracted = await extractLotFromNaturalLanguage(nlInput);

      if (extracted) {
        if (extracted.commodity) {
          setCommodity(extracted.commodity);
        }

        if (extracted.variety) {
          setVariety(extracted.variety);
        }

        if (extracted.quantity) {
          setQuantity(extracted.quantity);
        }

        // Quality grade is locked to the AI quality assessment; extracted grade is ignored
        if (extracted.askingPrice) {
          setAskingPrice(extracted.askingPrice);
          setMinimumPrice(Math.round(extracted.askingPrice * 0.95));
        }

        if (extracted.origin) {
          setOrigin(extracted.origin);
        }

        setExtractedMessage('Lot details populated.');
      }
    } catch {
      setExtractedMessage('Auto-extraction fallback used.');
    } finally {
      setIsExtracting(false);
    }
  };

  // ---------------------------------------------------------
  // AI QUALITY IMAGE ANALYSIS (Existing ML workflow)
  // ---------------------------------------------------------
  const handleQualityImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    setError(null);

    const reader = new FileReader();

    reader.onload = async () => {
      const base64 = reader.result as string;
      setQualityImage(base64);
      setIsAssessingQuality(true);
      setQualityAssessment(null);

      try {
        const response = await fetch('/api/ai/grade-produce', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success || !result.assessment) {
          throw new Error(
            result.error || 'Quality assessment failed. Please try again.'
          );
        }

        const assessment = result.assessment;
        setQualityAssessment(assessment);

        // If the model detected a matching commodity, auto-select it if supported
        if (assessment.commodity && assessment.commodity !== 'UNKNOWN') {
          const formattedCmd =
            assessment.commodity.charAt(0).toUpperCase() +
            assessment.commodity.slice(1).toLowerCase();
          if (['Carrot', 'Mango', 'Potato', 'Banana', 'Apple'].includes(formattedCmd)) {
            setCommodity(formattedCmd);
          }
        }
      } catch (err) {
        console.error('Quality assessment error:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to assess produce quality.'
        );
        setQualityAssessment(null);
      } finally {
        setIsAssessingQuality(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.readAsDataURL(file);
  };

  // ---------------------------------------------------------
  // STEP TRANSITIONS
  // ---------------------------------------------------------
  const handleProceedToStep2 = () => {
    if (!qualityAssessment || !qualityAssessment.grade) {
      setError('Please complete the AI quality assessment before proceeding to Lot Details.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleBackToStep1 = () => {
    // Return to Step 1 without modifying existing verified prediction
    setError(null);
    setStep(1);
  };

  // ---------------------------------------------------------
  // CREATE PRODUCE LOT (Step 2 Submission)
  // ---------------------------------------------------------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Enforce immutable AI Quality Prediction requirement
    if (!qualityAssessment || !qualityAssessment.grade) {
      setError('AI Quality Assessment is required. Please complete Step 1 first.');
      setStep(1);
      return;
    }

    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (askingPrice <= 0) {
      setError('Asking price must be greater than 0');
      return;
    }

    if (minimumPrice > askingPrice) {
      setError('Minimum acceptable price cannot exceed asking price');
      return;
    }

    const lotNumber = `LOT #NK-${commodity
      .slice(0, 3)
      .toUpperCase()}-${Date.now().toString().slice(-4)}`;

    // The lot strictly receives the model's prediction: lot.grade = qualityAssessment.grade
    const newLot: Omit<ProduceLot, 'id' | 'created_at'> = {
      lot_number: lotNumber,
      seller_user_id: activeUser.id,
      seller_organization_id: activeUser.organization_id,
      seller_type: activeUser.role === 'FPO_MEMBER' ? 'FPO' : 'FARMER',
      commodity,
      variety,
      quantity,
      unit: 'Quintal',
      harvest_date: harvestDate,
      available_from: harvestDate,
      origin,
      district,
      state,
      // Locked AI Quality Grade (immutable model prediction)
      grade: qualityAssessment.grade,
      quality_attributes: {
        blemish_percentage:
          qualityAssessment.grade === 'A'
            ? 1.0
            : qualityAssessment.grade === 'B'
            ? 4.0
            : 8.0,
        ai_quality_score: qualityAssessment.quality_score,
        ai_confidence: qualityAssessment.confidence,
        ai_predicted_class: qualityAssessment.predicted_class,
        ai_condition: qualityAssessment.condition,
      },
      packaging,
      storage_requirement: storageRequirement as any,
      asking_price: askingPrice,
      minimum_acceptable_price: minimumPrice,
      delivery_mode: deliveryMode,
      transport_paid_by: transportPaidBy,
      pickup_location: pickupLocation,
      status: 'LISTED',
      is_pooled: false,
      expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
    };

    try {
      onLotCreated(newLot as any);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to list lot');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-2xl w-full my-8 overflow-hidden text-[#0d0a0b]">
        {/* -------------------------------------------------
            HEADER & 2-STEP PROGRESS INDICATOR
        ------------------------------------------------- */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#0d0a0b]">
                {t('modals.wizardTitle', 'Create Verified Produce Lot')}
              </h3>
              <p className="text-xs text-[#454955] mt-0.5">
                {step === 1
                  ? t('modals.qualityScan', 'Step 1: AI Quality Scan')
                  : t('modals.wizardSubtitle', 'Step 2: Lot Details & Asking Rate')}
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-[#454955] hover:text-[#0d0a0b] p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 2-Step Progress Indicator */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-xs max-w-sm">
            {/* Step 1 Pill */}
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 cursor-pointer text-left focus:outline-none"
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                  step === 1
                    ? 'bg-[#386641] text-white'
                    : qualityAssessment
                    ? 'bg-[#386641] text-white'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {qualityAssessment ? (
                  <Check className="w-3 h-3 stroke-[2.5]" />
                ) : (
                  '1'
                )}
              </span>
              <span
                className={`font-semibold transition-colors ${
                  step === 1 ? 'text-[#386641]' : 'text-[#454955]'
                }`}
              >
                Quality Check
              </span>
            </button>

            {/* Connecting Track */}
            <div
              className={`flex-1 mx-3 h-0.5 rounded transition-colors ${
                qualityAssessment ? 'bg-[#386641]' : 'bg-slate-200'
              }`}
            />

            {/* Step 2 Pill */}
            <button
              type="button"
              onClick={() => {
                if (qualityAssessment) setStep(2);
              }}
              disabled={!qualityAssessment}
              className={`flex items-center gap-2 text-left focus:outline-none transition-colors ${
                qualityAssessment
                  ? 'cursor-pointer'
                  : 'cursor-not-allowed opacity-50'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                  step === 2
                    ? 'bg-[#386641] text-white'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                2
              </span>
              <span
                className={`font-semibold transition-colors ${
                  step === 2 ? 'text-[#386641]' : 'text-[#454955]'
                }`}
              >
                Lot Details
              </span>
            </button>
          </div>
        </div>

        {/* Validation Errors: Styled in Blushed Brick #bc4749 */}
        {error && (
          <div className="mx-6 mt-4 p-2.5 bg-[#bc4749]/10 border border-[#bc4749]/30 text-[#bc4749] rounded-lg text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#bc4749]" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* =========================================================
            STEP 1: QUALITY CHECK
        ========================================================= */}
        {step === 1 && (
          <div className="p-6 space-y-4">
            {/* Commodity Selection for Verification */}
            <div>
              <label className="block text-xs font-semibold text-[#454955] mb-1">
                Commodity *
              </label>
              <select
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-[#0d0a0b] focus:outline-none focus:ring-1 focus:ring-[#386641] focus:border-[#386641]"
              >
                <option value="Carrot">Carrot (Kuroda / Hybrid)</option>
                <option value="Mango">Mango (Alphonso / Kesar)</option>
                <option value="Potato">Potato (Jyoti / Kufri)</option>
                <option value="Banana">Banana (Grand Naine / Robusta)</option>
                <option value="Apple">Apple (Royal Delicious / Shimla)</option>
              </select>
            </div>

            {/* AI Quality Detection Area */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#454955]">
                Produce Image Verification *
              </label>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleQualityImage}
                className="hidden"
              />

              {/* Upload Dropzone when no image */}
              {!qualityImage ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-[#386641] bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer text-center"
                >
                  <Upload className="w-6 h-6 mx-auto text-[#386641] mb-2" />
                  <div className="text-xs font-bold text-[#0d0a0b]">
                    Upload Produce Batch Image
                  </div>
                  <div className="text-[10px] text-[#454955] mt-0.5">
                    Select JPG, PNG or WEBP
                  </div>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-3 items-center border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                    <img
                      src={qualityImage}
                      alt="Produce preview"
                      className="w-16 h-16 object-cover rounded-md border border-slate-200 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#0d0a0b]">
                        Harvest Sample
                      </div>

                      {isAssessingQuality ? (
                        <div className="flex items-center gap-1.5 text-xs text-[#386641] font-medium mt-1">
                          <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#386641]" />
                          <span>Assessing quality...</span>
                        </div>
                      ) : qualityAssessment ? (
                        <div className="text-[11px] text-[#386641] font-medium mt-0.5 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Assessment complete</span>
                        </div>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isAssessingQuality}
                        className="mt-1.5 text-[11px] text-[#386641] font-medium hover:underline disabled:opacity-50 cursor-pointer block"
                      >
                        Upload another image
                      </button>
                    </div>
                  </div>

                  {/* AI QUALITY RESULT: Verified Status Badge/Card */}
                  {qualityAssessment && (
                    <div className="bg-[#386641]/5 border border-[#6a994e]/30 rounded-lg p-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#6a994e]/15 flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 text-[#386641] stroke-[2.5]" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#386641] leading-tight">
                              Grade {qualityAssessment.grade}
                            </div>
                            <div className="text-xs text-[#454955] font-medium mt-0.5">
                              AI Verified
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-semibold text-[#0d0a0b]">
                            {qualityAssessment.condition === 'HEALTHY'
                              ? 'Healthy'
                              : qualityAssessment.condition}
                          </div>
                          <div className="text-[11px] text-[#454955] mt-0.5">
                            Score {qualityAssessment.quality_score}/100 •{' '}
                            {(qualityAssessment.confidence * 100).toFixed(0)}% confidence
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 1 Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-[#454955] hover:text-[#0d0a0b] transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleProceedToStep2}
                disabled={!qualityAssessment || isAssessingQuality}
                className="flex items-center space-x-1.5 px-5 py-2 bg-[#386641] hover:bg-[#2d5535] text-white rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Continue to Lot Details</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 2: LOT DETAILS
        ========================================================= */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Structured Lot Detail Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Commodity */}
              <div>
                <label className="block text-[#454955] mb-1 font-semibold">
                  Commodity *
                </label>
                <select
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-[#0d0a0b] focus:outline-none focus:ring-1 focus:ring-[#386641] focus:border-[#386641]"
                >
                  <option value="Carrot">Carrot (Kuroda / Hybrid)</option>
                  <option value="Mango">Mango (Alphonso / Kesar)</option>
                  <option value="Potato">Potato (Jyoti / Kufri)</option>
                  <option value="Banana">Banana (Grand Naine / Robusta)</option>
                  <option value="Apple">Apple (Royal Delicious / Shimla)</option>
                </select>
              </div>

              {/* AI Quality Result (Status card, NOT an input) */}
              <div>
                <label className="block text-[#454955] mb-1 font-semibold">
                  AI Quality
                </label>
                <div className="bg-[#386641]/5 border border-[#6a994e]/30 rounded-lg px-3 py-2 flex items-center justify-between min-h-[38px]">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#6a994e]/15 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[#386641] stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#386641]">
                        Grade {qualityAssessment?.grade}
                      </span>
                      <span className="text-[11px] text-[#454955] font-medium ml-1.5">
                        • AI Verified
                      </span>
                    </div>
                  </div>
                  {qualityAssessment && (
                    <span className="text-[10px] font-semibold text-[#386641] bg-white border border-[#6a994e]/30 px-1.5 py-0.5 rounded">
                      {qualityAssessment.quality_score}/100
                    </span>
                  )}
                </div>
              </div>

              {/* Variety */}
              <div>
                <label className="block text-[#454955] mb-1 font-semibold">
                  Variety
                </label>
                <input
                  type="text"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-[#0d0a0b] focus:outline-none focus:ring-1 focus:ring-[#386641] focus:border-[#386641]"
                  placeholder="e.g. Kuroda, Alphonso, Jyoti"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-[#454955] mb-1 font-semibold">
                  Quantity (Quintals) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-[#0d0a0b] font-mono focus:outline-none focus:ring-1 focus:ring-[#386641] focus:border-[#386641]"
                />
              </div>

              {/* Asking Price */}
              <div>
                <label className="block text-[#454955] mb-1 font-semibold">
                  Asking Price (₹ / Quintal) *
                </label>
                <input
                  type="number"
                  min="100"
                  value={askingPrice}
                  onChange={(e) => setAskingPrice(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-[#0d0a0b] font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#386641] focus:border-[#386641]"
                />
              </div>

              {/* Minimum Acceptable Price */}
              <div>
                <label className="block text-[#454955] mb-1 font-semibold">
                  Minimum Reserve Price (₹ / Q) *
                </label>
                <input
                  type="number"
                  min="100"
                  value={minimumPrice}
                  onChange={(e) => setMinimumPrice(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-[#0d0a0b] font-mono focus:outline-none focus:ring-1 focus:ring-[#386641] focus:border-[#386641]"
                />
                <span className="text-[10px] text-[#454955]">
                  Floor threshold for auto-matching
                </span>
              </div>

              {/* Delivery Mode */}
              <div>
                <label className="block text-[#454955] mb-1 font-semibold">
                  Delivery Mode *
                </label>
                <select
                  value={deliveryMode}
                  onChange={(e) =>
                    setDeliveryMode(
                      e.target.value as
                        | 'BUYER_PICKUP_FARM_GATE'
                        | 'DELIVERED_TO_BUYER_WAREHOUSE'
                    )
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-[#0d0a0b] focus:outline-none focus:ring-1 focus:ring-[#386641] focus:border-[#386641]"
                >
                  <option value="DELIVERED_TO_BUYER_WAREHOUSE">
                    Delivered to Buyer Warehouse (Seller arranges)
                  </option>
                  <option value="BUYER_PICKUP_FARM_GATE">
                    Buyer Pickup at Farm Gate
                  </option>
                </select>
              </div>

              {/* Transport Paid By */}
              <div>
                <label className="block text-[#454955] mb-1 font-semibold">
                  Transport Freight Paid By *
                </label>
                <select
                  value={transportPaidBy}
                  onChange={(e) =>
                    setTransportPaidBy(e.target.value as 'BUYER' | 'SELLER')
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-[#0d0a0b] focus:outline-none focus:ring-1 focus:ring-[#386641] focus:border-[#386641]"
                >
                  <option value="SELLER">
                    Seller (Deducted from gross at settlement)
                  </option>
                  <option value="BUYER">
                    Buyer (Borne directly by buyer)
                  </option>
                </select>
              </div>

              {/* Pickup Location */}
              <div className="sm:col-span-2">
                <label className="block text-[#454955] mb-1 font-semibold">
                  Pickup / Farm Location *
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-[#0d0a0b] focus:outline-none focus:ring-1 focus:ring-[#386641] focus:border-[#386641]"
                />
              </div>
            </div>

            {/* Optional Natural Language Auto-Fill Assistant */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs font-semibold text-[#0d0a0b] mb-1.5">
                <span className="flex items-center space-x-1 text-[#386641]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Voice or Text Input (Auto-fill Lot Details)</span>
                </span>
                <span className="text-[10px] text-[#454955]">
                  Optional
                </span>
              </div>

              <textarea
                value={nlInput}
                onChange={(e) => setNlInput(e.target.value)}
                rows={2}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-[#0d0a0b] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#386641] focus:border-[#386641]"
                placeholder="e.g. 50 quintals harvested in Niphad Nashik, expecting ₹2,400/Q..."
              />

              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleAiExtract}
                  disabled={isExtracting || !nlInput.trim()}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#386641] hover:bg-[#2d5535] text-white rounded-lg text-xs font-medium transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {isExtracting ? 'Parsing...' : 'Auto-Extract Details'}
                  </span>
                </button>

                {extractedMessage && (
                  <span className="text-[11px] text-[#386641] flex items-center space-x-1 font-medium">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{extractedMessage}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Step 2 Footer Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBackToStep1}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-semibold text-[#454955] hover:text-[#0d0a0b] hover:bg-slate-100 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Quality Check</span>
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[#454955] hover:text-[#0d0a0b] transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-5 py-2 bg-[#386641] hover:bg-[#2d5535] text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <span>Create Lot</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
