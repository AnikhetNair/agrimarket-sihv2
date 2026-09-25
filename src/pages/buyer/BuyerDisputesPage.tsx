import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { dataStore } from '../../services/dataStore';
import { Dispute } from '../../types/domain';
import { DisputeCard } from '../../components/disputes/DisputeCard';
import { RaiseDisputeModal } from '../../components/disputes/RaiseDisputeModal';
import {
  AlertTriangle,
  Plus,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Scale,
} from 'lucide-react';

export const BuyerDisputesPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState<boolean>(false);
  const [disputes, setDisputes] = useState<Dispute[]>(dataStore.getDisputes());
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const activeBuyerId = user?.id || 'usr-buyer-1';

  // Real-time synchronization via dataStore subscription
  useEffect(() => {
    const unsubscribe = dataStore.subscribeToDisputes(() => {
      setDisputes([...dataStore.getDisputes()]);
    });
    return unsubscribe;
  }, []);

  // Filter disputes involving current buyer
  const myDisputes = disputes.filter(
    (d) =>
      d.raised_by === activeBuyerId ||
      d.other_party_id === activeBuyerId ||
      (user && d.raised_by_name.toLowerCase().includes(user.name.toLowerCase())) ||
      (user && d.other_party_name && d.other_party_name.toLowerCase().includes(user.name.toLowerCase()))
  );

  const displayedDisputes = myDisputes.filter((d) => {
    if (filterStatus === 'ALL') return true;
    return d.status === filterStatus;
  });

  const countTotal = myDisputes.length;
  const countOpen = myDisputes.filter((d) => d.status === 'OPEN').length;
  const countInReview = myDisputes.filter((d) => d.status === 'UNDER_REVIEW').length;
  const countResolved = myDisputes.filter((d) => d.status === 'RESOLVED').length;

  return (
    <div id="buyer-disputes-page" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-blue-500/10 text-blue-700 rounded-xl">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {t('buyer.disputesTitle', 'Buyer Dispute Management')}
                </h1>
                <p className="text-xs text-slate-500">
                  {t('buyer.disputesSubtitle', 'Lodge quality discrepancy, transit damage, or shortfall claims')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              id="btn-buyer-raise-dispute"
              type="button"
              onClick={() => setIsRaiseModalOpen(true)}
              className="px-4 py-2.5 bg-[#386641] hover:bg-[#2b5133] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t('disputes.raiseTitle', 'Raise Dispute')}</span>
            </button>
          </div>
        </div>

        {/* Quick summary chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-slate-100 border-slate-400 font-bold'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
            }`}
          >
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-semibold">
              All Disputes
            </span>
            <span className="text-lg font-bold text-slate-900">{countTotal}</span>
          </button>

          <button
            onClick={() => setFilterStatus('OPEN')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              filterStatus === 'OPEN'
                ? 'bg-sky-100/80 border-sky-400 font-bold'
                : 'bg-sky-50 border-sky-200 hover:bg-sky-100/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-sky-700 block font-semibold">
                Open Intake
              </span>
              <Clock className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <span className="text-lg font-bold text-sky-900">{countOpen}</span>
          </button>

          <button
            onClick={() => setFilterStatus('UNDER_REVIEW')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              filterStatus === 'UNDER_REVIEW'
                ? 'bg-amber-100/80 border-amber-400 font-bold'
                : 'bg-amber-50 border-amber-200 hover:bg-amber-100/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-amber-800 block font-semibold">
                In Review
              </span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <span className="text-lg font-bold text-amber-900">{countInReview}</span>
          </button>

          <button
            onClick={() => setFilterStatus('RESOLVED')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              filterStatus === 'RESOLVED'
                ? 'bg-emerald-100/80 border-emerald-400 font-bold'
                : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-emerald-800 block font-semibold">
                Settled / Resolved
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-lg font-bold text-emerald-900">{countResolved}</span>
          </button>
        </div>
      </div>

      {/* Disputes List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <span>Procurement &amp; Consignment Disputes</span>
            <span className="text-xs font-normal text-slate-400">({displayedDisputes.length})</span>
          </h2>
          {filterStatus !== 'ALL' && (
            <button
              onClick={() => setFilterStatus('ALL')}
              className="text-xs text-[#386641] hover:underline font-semibold cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>

        {displayedDisputes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No disputes yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Raise a dispute if there is an issue with a transaction.
            </p>
            <button
              id="btn-empty-buyer-raise-dispute"
              type="button"
              onClick={() => setIsRaiseModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#386641] text-white rounded-xl text-xs font-semibold hover:bg-[#2b5133] transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Raise a Dispute</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedDisputes.map((dispute) => (
              <DisputeCard
                key={dispute.id}
                dispute={dispute}
                currentUser={user || { id: 'usr-buyer-1', name: 'Arjun Mehta', role: 'BUYER', email: '' }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Raise Dispute Modal */}
      {user && (
        <RaiseDisputeModal
          isOpen={isRaiseModalOpen}
          onClose={() => setIsRaiseModalOpen(false)}
          activeUser={user}
          onSuccess={() => {
            setDisputes([...dataStore.getDisputes()]);
          }}
        />
      )}
    </div>
  );
};
