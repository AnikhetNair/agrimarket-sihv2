import React, { useState, useEffect, useMemo } from 'react';
import {
  Building,
  Layers,
  Boxes,
  Users,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Loader2,
  ArrowRight,
  Check,
  X,
} from 'lucide-react';
import { User, ProduceLot, AggregatedPool } from '../types/domain';
import { dataStore } from '../services/dataStore';
import { SEED_FPO_PROFILES } from '../data/seedUsers';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface FPOAggregationViewProps {
  activeUser: User;
  onLotCreated?: (lot: ProduceLot) => void;
}

export const FPOAggregationView: React.FC<FPOAggregationViewProps> = ({
  activeUser,
  onLotCreated,
}) => {
  const fpoProfile = SEED_FPO_PROFILES[0];
  const organizations = dataStore.getOrganizations();
  const fpoOrg = organizations.find((o) => o.id === fpoProfile.organization_id) || organizations[0];
  const users = dataStore.getUsers();

  // State initialized from dataStore shared memory store
  const [loading, setLoading] = useState(true);
  const [farmerLots, setFarmerLots] = useState<ProduceLot[]>([]);
  const [selectedLots, setSelectedLots] = useState<ProduceLot[]>([]);
  const [aggregatedLotIds, setAggregatedLotIds] = useState<string[]>(() =>
    dataStore.getDemoAggregatedLotIds()
  );
  const [activePools, setActivePools] = useState<AggregatedPool[]>(() =>
    dataStore.getDemoAggregatedPools()
  );
  const [isCreatingPool, setIsCreatingPool] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

  // Subscribe to pool updates across FPO components
  useEffect(() => {
    const unsubscribe = dataStore.subscribeToPools(() => {
      setActivePools(dataStore.getDemoAggregatedPools());
      setAggregatedLotIds(dataStore.getDemoAggregatedLotIds());
    });
    return unsubscribe;
  }, []);

  // Helper to get farmer name
  const getFarmerName = (sellerUserId: string) => {
    const matchedUser = users.find((u) => u.id === sellerUserId);
    return matchedUser?.name || 'Local Farmer';
  };

  // Fetch available farmer lots from Supabase (or fallback to dataStore)
  useEffect(() => {
    let isMounted = true;

    const fetchFarmerLots = async () => {
      setLoading(true);
      try {
        if (supabase && isSupabaseConfigured) {
          const { data, error } = await supabase
            .from('lots')
            .select('*')
            .eq('seller_type', 'FARMER')
            .or('status.eq.LISTED,status.eq.AVAILABLE,status.eq.OPEN');

          if (!error && data && data.length > 0) {
            if (isMounted) {
              setFarmerLots(data as ProduceLot[]);
              setLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to dataStore:', err);
      }

      // Fallback to dataStore lots
      const available = dataStore
        .getLots()
        .filter(
          (l) =>
            l.seller_type === 'FARMER' &&
            !l.is_pooled &&
            (l.status === 'LISTED' ||
              (l.status as string) === 'AVAILABLE' ||
              (l.status as string) === 'OPEN')
        );

      if (isMounted) {
        setFarmerLots(available);
        setLoading(false);
      }
    };

    fetchFarmerLots();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter out consumed lots during current session
  const visibleLots = useMemo(() => {
    return farmerLots.filter((lot) => !aggregatedLotIds.includes(lot.id));
  }, [farmerLots, aggregatedLotIds]);

  // Commodity restriction: only one commodity per pool
  const selectedCommodity = selectedLots.length > 0 ? selectedLots[0].commodity : null;

  // Totals for selection
  const totalQuantity = useMemo(() => {
    return selectedLots.reduce((sum, l) => sum + l.quantity, 0);
  }, [selectedLots]);

  const avgPrice = useMemo(() => {
    if (selectedLots.length === 0) return 0;
    return Math.round(selectedLots.reduce((sum, l) => sum + l.asking_price, 0) / selectedLots.length);
  }, [selectedLots]);

  // Handle lot selection / toggling
  const handleToggleLot = (lot: ProduceLot) => {
    const isSelected = selectedLots.some((l) => l.id === lot.id);
    if (isSelected) {
      setSelectedLots((prev) => prev.filter((l) => l.id !== lot.id));
    } else {
      // Check commodity constraint
      if (selectedCommodity && selectedCommodity.toLowerCase() !== lot.commodity.toLowerCase()) {
        return;
      }
      setSelectedLots((prev) => [...prev, lot]);
    }
  };

  // Create aggregated pool — UI ONLY (no Supabase write)
  const handleCreateAggregatedPool = () => {
    if (selectedLots.length === 0 || isCreatingPool) return;

    setIsCreatingPool(true);

    // Lightweight UI-only creation
    setTimeout(() => {
      const poolCommodity = selectedCommodity || selectedLots[0].commodity;
      const count = selectedLots.length;
      const qty = totalQuantity;
      const poolDisplayId = `POOL #SF-${poolCommodity.slice(0, 3).toUpperCase()}-${String(qty).padStart(4, '0')}`;
      const poolGrade = selectedLots[0]?.grade ? `Grade ${selectedLots[0].grade}` : 'Grade A';

      const newPool: AggregatedPool = {
        id: poolDisplayId,
        commodity: poolCommodity,
        grade: poolGrade,
        totalQuantity: qty,
        lotCount: count,
        status: 'AVAILABLE FOR INSTITUTIONAL BUYERS',
        farmers: Array.from(new Set(selectedLots.map((l) => getFarmerName(l.seller_user_id)))),
        avgAskingPrice: avgPrice,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Save to shared in-memory dataStore
      dataStore.addDemoAggregatedPool(newPool);
      dataStore.addDemoAggregatedLotIds(selectedLots.map((l) => l.id));

      // Clear selection
      setSelectedLots([]);

      // Toast notification
      setToast({
        title: 'Pool Created',
        message: `${count} farmer lots aggregated into ${poolDisplayId} (${qty} Quintals).`,
      });

      setIsCreatingPool(false);

      if (onLotCreated) {
        onLotCreated({
          id: poolDisplayId.toLowerCase(),
          lot_number: poolDisplayId,
          commodity: poolCommodity,
          variety: 'Aggregated FPO Batch',
          quantity: qty,
          unit: 'Quintal',
          seller_user_id: activeUser.id,
          seller_type: 'FPO',
          asking_price: avgPrice,
          minimum_acceptable_price: avgPrice,
          grade: 'A',
          status: 'LISTED',
          is_pooled: true,
          pickup_location: fpoOrg.location || 'FPO Central Aggregation Hub',
          origin: fpoOrg.location || 'Nashik',
          district: 'Nashik',
          state: 'Maharashtra',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
          harvest_date: new Date().toISOString().split('T')[0],
          available_from: new Date().toISOString().split('T')[0],
          packaging: 'Standard Crates',
          storage_requirement: 'DRY_VENTILATED',
          delivery_mode: 'EX_FARM_GATE',
          transport_paid_by: 'BUYER',
          quality_attributes: {},
        });
      }
    }, 300);
  };

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className="bg-brand-lavender min-h-screen space-y-6 max-w-7xl mx-auto pb-12 font-sans text-brand-black">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-[#6A994E]/40 shadow-xl rounded-xl p-4 flex items-start space-x-3 max-w-md animate-in fade-in slide-in-from-bottom-3">
          <div className="w-7 h-7 rounded-full bg-[#6A994E]/15 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4 text-[#386641]" />
          </div>
          <div className="flex-1">
            <h5 className="text-xs font-bold text-brand-black">{toast.title}</h5>
            <p className="text-xs text-brand-charcoal mt-0.5">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-brand-charcoal hover:text-brand-black p-1 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top FPO Organization Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-brand-black flex items-center space-x-2">
              <Building className="w-5 h-5 text-[#386641]" />
              <span>{fpoOrg.name}</span>
            </h3>
            <span className="text-xs bg-[#6A994E]/15 text-[#386641] px-2 py-0.5 rounded font-mono border border-[#6A994E]/30 font-semibold">
              Registration: {fpoProfile.registration_reference_demo}
            </span>
          </div>
          <p className="text-xs text-brand-charcoal mt-1">
            {fpoProfile.member_count.toLocaleString()} member farmers across Nashik district clusters
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="bg-brand-lavender px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="text-brand-charcoal block text-[10px]">Cold Storage Reserve</span>
            <span className="text-brand-black font-bold">8,000 Q</span>
          </div>
          <div className="bg-brand-lavender px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="text-brand-charcoal block text-[10px]">Annual Turnover</span>
            <span className="text-[#386641] font-bold">₹4.8 Cr</span>
          </div>
        </div>
      </div>

      {/* ACTIVE AGGREGATED POOLS SECTION (Appears immediately after creation) */}
      {activePools.length > 0 && (
        <div className="bg-white border border-[#6A994E]/30 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Boxes className="w-5 h-5 text-[#386641]" />
              <h3 className="text-sm font-bold text-brand-black">Active Aggregated Pools</h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#6A994E]/15 text-[#386641] border border-[#6A994E]/30">
                {activePools.length} {activePools.length === 1 ? 'Pool' : 'Pools'} Active
              </span>
            </div>
            <span className="text-[11px] text-[#386641] font-semibold flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-[#386641]" />
              <span>Direct Institutional Matching Ready</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePools.map((pool) => (
              <div
                key={pool.id}
                className="bg-brand-lavender border border-[#6A994E]/25 rounded-xl p-4 space-y-3 hover:border-[#6A994E]/50 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-brand-black tracking-wider bg-white px-2 py-0.5 rounded border border-slate-200">
                    {pool.id}
                  </span>
                  <span className="text-[10px] font-mono text-brand-charcoal">
                    Created {pool.createdAt}
                  </span>
                </div>

                <div>
                  <div className="text-base font-bold text-brand-black">{pool.commodity}</div>
                  <div className="text-sm font-extrabold text-[#386641]">
                    {pool.totalQuantity} Quintals
                  </div>
                  <div className="text-xs text-brand-charcoal font-medium mt-0.5">
                    {pool.lotCount} Farmer Lots Aggregated
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-brand-charcoal">Avg Asking Rate</span>
                  <span className="font-mono font-bold text-brand-black">₹{pool.avgAskingPrice}/Q</span>
                </div>

                <div className="pt-2 border-t border-slate-200/80">
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#6A994E]/15 text-[#386641] border border-[#6A994E]/30">
                    <CheckCircle2 className="w-3 h-3 text-[#386641]" />
                    <span>{pool.status}</span>
                  </span>
                </div>

                {pool.farmers.length > 0 && (
                  <div className="text-[10px] text-brand-charcoal truncate pt-1">
                    Farmers: {pool.farmers.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAIN WORKSPACE: Available Farmer Lots & Aggregation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Available Farmer Lots */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-base font-bold text-brand-black flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#386641]" />
                <span>Available Farmer Lots</span>
              </h2>
              <p className="text-xs text-brand-charcoal mt-0.5">
                Select eligible individual member lots to bundle into a unified institutional batch
              </p>
            </div>

            {selectedCommodity && (
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900">
                <span>Restricted to:</span>
                <span className="font-bold text-[#386641] bg-white px-1.5 py-0.5 rounded border border-amber-300 font-mono">
                  {selectedCommodity}
                </span>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-brand-charcoal">
              <Loader2 className="w-6 h-6 animate-spin text-[#386641]" />
              <p className="text-xs font-medium">Fetching available farmer lots from registry...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && visibleLots.length === 0 && (
            <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
              <AlertCircle className="w-8 h-8 text-brand-charcoal mx-auto opacity-50" />
              <h4 className="text-sm font-bold text-brand-black">No Eligible Farmer Lots Available</h4>
              <p className="text-xs text-brand-charcoal max-w-md mx-auto">
                All listed farmer lots have either been aggregated into active bulk pools or assigned to active buyer procurement milestones.
              </p>
            </div>
          )}

          {/* Farmer Lots List */}
          {!loading && visibleLots.length > 0 && (
            <div className="space-y-2.5">
              {visibleLots.map((lot) => {
                const isSelected = selectedLots.some((l) => l.id === lot.id);
                const isMismatch = Boolean(
                  selectedCommodity && selectedCommodity.toLowerCase() !== lot.commodity.toLowerCase()
                );
                const farmerName = getFarmerName(lot.seller_user_id);
                const locationDisplay = lot.origin || lot.pickup_location || `${lot.district}, ${lot.state}`;

                return (
                  <div
                    key={lot.id}
                    onClick={() => !isMismatch && handleToggleLot(lot)}
                    className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#6A994E]/10 border-[#6A994E] shadow-2xs'
                        : isMismatch
                        ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                        : 'bg-brand-lavender border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Checkbox and Lot Info */}
                    <div className="flex items-start space-x-3">
                      <div className="pt-0.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isMismatch}
                          onChange={() => handleToggleLot(lot)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-[#386641] rounded border-slate-300 focus:ring-[#386641] cursor-pointer disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs text-brand-black">{farmerName}</span>
                          <span className="text-[10px] font-mono text-brand-charcoal bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {lot.lot_number}
                          </span>
                          <span className="text-[10px] font-semibold bg-[#6A994E]/15 text-[#386641] px-1.5 py-0.5 rounded border border-[#6A994E]/30 font-mono">
                            Grade {lot.grade}
                          </span>
                          {isMismatch && (
                            <span className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded font-medium">
                              Different Commodity
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-charcoal">
                          <span className="font-semibold text-brand-black">
                            {lot.commodity} {lot.variety ? `(${lot.variety})` : ''}
                          </span>
                          <span>•</span>
                          <span>{locationDisplay}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Asking Price */}
                    <div className="flex items-center justify-between sm:justify-end space-x-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 font-mono text-xs">
                      <div className="text-left sm:text-right">
                        <div className="text-sm font-extrabold text-[#386641]">{lot.quantity} Q</div>
                        <div className="text-[10px] text-brand-charcoal">Quantity</div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-brand-black">
                          ₹{lot.asking_price.toLocaleString('en-IN')}/Q
                        </div>
                        <div className="text-[10px] text-brand-charcoal">Asking Rate</div>
                      </div>

                      <button
                        type="button"
                        disabled={isMismatch}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLot(lot);
                        }}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#386641] text-white'
                            : isMismatch
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-white text-brand-charcoal hover:bg-slate-100 border border-slate-300'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Pooling Summary & Creation Action */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5 sticky top-20">
          <div>
            <h3 className="text-sm font-bold text-brand-black flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#386641]" />
              <span>Pool Configuration</span>
            </h3>
            <p className="text-xs text-brand-charcoal mt-0.5">
              Review aggregate metrics before generating corporate offering
            </p>
          </div>

          <div className="bg-brand-lavender p-4 rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-brand-charcoal">Commodity:</span>
              <span className="font-bold text-brand-black">
                {selectedCommodity || 'None Selected'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-brand-charcoal">Lots Selected:</span>
              <span className="font-bold text-brand-black">
                {selectedLots.length} {selectedLots.length === 1 ? 'lot' : 'lots'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-brand-charcoal">Total Volume:</span>
              <span className="font-bold text-base text-[#386641]">
                {totalQuantity} Quintals
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-brand-charcoal">Avg Asking Price:</span>
              <span className="font-bold text-brand-black">
                {avgPrice > 0 ? `₹${avgPrice}/Q` : '—'}
              </span>
            </div>
          </div>

          {selectedLots.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-brand-charcoal uppercase">
                Selected Farmer Contributors ({selectedLots.length})
              </div>
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 bg-brand-lavender rounded-lg border border-slate-200 p-2 text-xs">
                {selectedLots.map((l) => (
                  <div key={l.id} className="py-1.5 flex justify-between items-center">
                    <span className="text-brand-black font-medium truncate max-w-[140px]">
                      {getFarmerName(l.seller_user_id)}
                    </span>
                    <span className="text-[#386641] font-mono font-bold">{l.quantity} Q</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Creation Action Button */}
          <button
            type="button"
            onClick={handleCreateAggregatedPool}
            disabled={selectedLots.length === 0 || isCreatingPool}
            className="w-full py-3 px-4 bg-brand-green text-brand-black font-bold text-xs rounded-xl shadow-xs transition hover:brightness-110 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
          >
            {isCreatingPool ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-brand-black" />
                <span>Creating Pool...</span>
              </>
            ) : (
              <>
                <span>Create Aggregated Pool</span>
                <ArrowRight className="w-4 h-4 text-brand-black" />
              </>
            )}
          </button>

          {selectedLots.length === 0 && (
            <p className="text-[11px] text-brand-charcoal text-center">
              Select at least 1 farmer lot from the list above to activate pool creation.
            </p>
          )}

          <div className="p-3 bg-[#6A994E]/10 border border-[#6A994E]/30 rounded-lg text-xs text-brand-black">
            <div className="font-semibold text-[#386641] mb-1">Demo Prototype Note</div>
            <p className="text-[11px] text-brand-charcoal leading-relaxed">
              Aggregation occurs entirely in-session for demonstration. No records are written to or modified in the database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
