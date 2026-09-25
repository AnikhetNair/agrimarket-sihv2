import React, { useState, useMemo } from 'react';
import {
  Plus,
  Package,
  Layers,
  Sparkles,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  MapPin,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { ProduceLot, User } from '../types/domain';
import { dataStore } from '../services/dataStore';
import { SmartLotWizardModal } from './SmartLotWizardModal';
import { GOLDEN_LOT_NUMBER } from '../data/seedLotsAndRequirements';

interface LotManagerProps {
  activeUser: User;
  onSelectLotForMatching: (lot: ProduceLot) => void;
  onSelectLotForDeal: (lot: ProduceLot) => void;
}

export const LotManager: React.FC<LotManagerProps> = ({
  activeUser,
  onSelectLotForMatching,
  onSelectLotForDeal,
}) => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [commodityFilter, setCommodityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyMyLots, setOnlyMyLots] = useState<boolean>(false);

  // Trigger state refresh on update
  const [refreshKey, setRefreshKey] = useState(0);
  const lots = useMemo(() => {
    let list = dataStore.getLots();
    if (onlyMyLots) {
      list = list.filter((l) => l.seller_user_id === activeUser.id);
    }
    if (statusFilter !== 'ALL') {
      list = list.filter((l) => l.status === statusFilter);
    }
    if (commodityFilter !== 'ALL') {
      list = list.filter((l) => l.commodity.toLowerCase() === commodityFilter.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (l) =>
          l.lot_number.toLowerCase().includes(q) ||
          l.commodity.toLowerCase().includes(q) ||
          l.origin.toLowerCase().includes(q)
      );
    }
    return list;
  }, [onlyMyLots, activeUser.id, statusFilter, commodityFilter, searchQuery, refreshKey]);

  const handleLotCreated = (newLotData: any) => {
    dataStore.createLot(newLotData);
    setRefreshKey((k) => k + 1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'LISTED':
        return 'bg-blue-950 text-blue-300 border border-blue-700/60';
      case 'MATCHED':
        return 'bg-purple-950 text-purple-300 border border-purple-700/60';
      case 'OFFER_RECEIVED':
      case 'NEGOTIATING':
        return 'bg-amber-950 text-amber-300 border border-amber-700/60';
      case 'ACCEPTED':
      case 'PAID':
      case 'COMPLETED':
        return 'bg-emerald-950 text-emerald-300 border border-emerald-700/60';
      default:
        return 'bg-slate-800 text-slate-400';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Action Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Package className="w-5 h-5 text-emerald-400" />
              <span>Produce Lot Inventory</span>
            </h3>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
              {lots.length} active lots registered
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Registered farmer consignments and FPO aggregated pools ready for deterministic buyer matching
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsWizardOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>List Produce Lot</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search lot #, commodity, origin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-52 sm:w-64"
            />
          </div>

          {/* Commodity filter */}
          <select
            value={commodityFilter}
            onChange={(e) => setCommodityFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5"
          >
            <option value="ALL">All Commodities</option>
            <option value="Carrot">Carrot</option>
            <option value="Mango">Mango</option>
            <option value="Potato">Potato</option>
            <option value="Banana">Banana</option>
            <option value="Apple">Apple</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5"
          >
            <option value="ALL">All Statuses</option>
            <option value="LISTED">Listed</option>
            <option value="MATCHED">Matched</option>
            <option value="OFFER_RECEIVED">Offer Received</option>
            <option value="NEGOTIATING">Negotiating</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Only My Lots Toggle */}
          <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyMyLots}
              onChange={(e) => setOnlyMyLots(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
            <span>Show My Lots Only</span>
          </label>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          Displaying {lots.length} consignments
        </div>
      </div>

      {/* Produce Lots Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase bg-slate-950/60">
                <th className="py-3 px-4">Lot ID & Commodity</th>
                <th className="py-3 px-4">Volume</th>
                <th className="py-3 px-4">Grade & Quality</th>
                <th className="py-3 px-4">Location & Delivery</th>
                <th className="py-3 px-4 text-right">Asking Price</th>
                <th className="py-3 px-4 text-right">Floor Price</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {lots.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No produce lots found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                lots.map((lot) => {
                  const isGoldenLot = lot.lot_number === GOLDEN_LOT_NUMBER;
                  return (
                    <tr
                      key={lot.id}
                      className={`hover:bg-slate-800/40 transition ${
                        isGoldenLot ? 'bg-emerald-950/20 border-l-2 border-emerald-500' : ''
                      }`}
                    >
                      {/* Lot ID & Commodity */}
                      <td className="py-3 px-4">
                        <div className="font-sans font-bold text-white flex items-center space-x-1.5">
                          <span>{lot.lot_number}</span>
                          {lot.is_pooled && (
                            <span className="text-[10px] bg-purple-950 text-purple-300 px-1.5 py-0.2 rounded border border-purple-800">
                              POOLED
                            </span>
                          )}
                          {isGoldenLot && (
                            <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-700">
                              GOLDEN DEMO
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                          {lot.commodity} ({lot.variety}) • Harvest: {lot.harvest_date}
                        </div>
                      </td>

                      {/* Volume */}
                      <td className="py-3 px-4 font-semibold text-slate-100">
                        {lot.quantity} {lot.unit}s
                      </td>

                      {/* Grade */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                            lot.grade === 'A'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                              : lot.grade === 'B'
                              ? 'bg-blue-950 text-blue-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          Grade {lot.grade}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-sans">
                          {lot.packaging}
                        </div>
                      </td>

                      {/* Location & Delivery */}
                      <td className="py-3 px-4 font-sans text-slate-300">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{lot.origin}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {lot.delivery_mode === 'DELIVERED_TO_BUYER_WAREHOUSE'
                            ? 'Delivered (Seller Truck)'
                            : 'Farm Gate Pickup'}
                        </div>
                      </td>

                      {/* Asking Price */}
                      <td className="py-3 px-4 text-right font-bold text-white">
                        ₹{lot.asking_price.toLocaleString('en-IN')}/Q
                      </td>

                      {/* Floor Price */}
                      <td className="py-3 px-4 text-right text-slate-400">
                        ₹{lot.minimum_acceptable_price.toLocaleString('en-IN')}/Q
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getStatusBadge(lot.status)}`}>
                          {lot.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onSelectLotForMatching(lot)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-xs font-semibold transition border border-emerald-500/30 flex items-center space-x-1"
                            title="Run 2-Stage Matching against Buyer Requirements"
                          >
                            <span>Match</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Smart Wizard Modal */}
      <SmartLotWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        activeUser={activeUser}
        onLotCreated={handleLotCreated}
      />
    </div>
  );
};
