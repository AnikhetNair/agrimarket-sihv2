import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { dataStore } from '../../services/dataStore';
import { ProduceLot, User } from '../../types/domain';
import { SmartLotWizardModal } from '../../components/SmartLotWizardModal';
import {
  Boxes,
  Plus,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const FarmerLotsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [lots, setLots] = useState<ProduceLot[]>(() => {
    return dataStore
      .getLots()
      .filter((l) => l.seller_user_id === user?.id || l.seller_user_id === 'usr-farmer-1');
  });

  const handleLotCreated = (newLot: ProduceLot) => {
    dataStore.createLot(newLot);
    setLots(
      dataStore
        .getLots()
        .filter((l) => l.seller_user_id === user?.id || l.seller_user_id === 'usr-farmer-1')
    );
    setIsWizardOpen(false);
  };

  const domainUser: User = {
    id: user?.id || 'usr-farmer-1',
    name: user?.name || 'Ramesh Patil',
    role: 'FARMER',
    phone_demo: user?.phone || '+91 98220 33412',
    location: user?.location || 'Dindori, Nashik',
    district: user?.district || 'Nashik',
    state: user?.state || 'Maharashtra',
    created_at: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0d0a0b] tracking-tight">
            {t('farmer.lotsTitle', 'Farmer Produce Lots')}
          </h1>
          <p className="text-xs text-[#454955] mt-0.5">
            {t('farmer.lotsSubtitle', 'Digital quality passports, asking rates, and verified dispatch batches')}
          </p>
        </div>

        <button
          onClick={() => setIsWizardOpen(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#386641] hover:bg-[#2d5535] text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>{t('farmer.createNewLot', 'Create Produce Lot')}</span>
        </button>
      </div>

      {/* Lot List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {lots.map((lot) => (
          <div
            key={lot.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-[#386641] transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-mono text-xs font-bold text-[#386641] bg-[#6A994E]/15 px-2 py-0.5 rounded border border-[#6A994E]/30">
                  {lot.lot_number}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F2E8CF] text-[#0d0a0b] border border-slate-300">
                  {lot.status}
                </span>
              </div>

              <div className="mt-3">
                <h3 className="text-base font-bold text-[#0d0a0b]">
                  {lot.commodity} ({lot.variety || 'Standard'})
                </h3>
                <div className="flex items-center space-x-1 text-xs text-[#454955] mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#454955]" />
                  <span>{lot.origin}</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 bg-[#F2E8CF] rounded-lg p-2.5 border border-slate-200 text-center text-xs">
                <div>
                  <div className="text-[10px] text-[#454955] font-medium">Total Quantity</div>
                  <div className="font-bold text-[#0d0a0b]">{lot.quantity} Q</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#454955] font-medium">Asking Rate</div>
                  <div className="font-bold text-[#386641]">₹{lot.asking_price}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#454955] font-medium">Floor Rate</div>
                  <div className="font-bold text-[#0d0a0b]">₹{lot.minimum_acceptable_price}</div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-[#454955]">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-[#454955]" />
                  <span>Harvested: {lot.harvest_date}</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-[#6A994E]/15 text-[#386641] font-medium text-[11px] border border-[#6A994E]/30">
                  Grade {lot.grade}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-[#386641] font-semibold flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-[#386641]" />
                <span>94% Match with FreshKart Foods</span>
              </span>
              <Link
                to="/farmer/deals"
                className="inline-flex items-center space-x-1 text-xs font-semibold text-[#386641] hover:text-[#2d5535]"
              >
                <span>View Active Deals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Smart Lot Wizard Modal */}
      <SmartLotWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        activeUser={domainUser}
        onLotCreated={handleLotCreated}
      />
    </div>
  );
};
