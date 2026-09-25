import React, { useState, useEffect } from 'react';
import { dataStore } from '../../services/dataStore';
import { AggregatedPool } from '../../types/domain';
import { Layers, Sparkles, ArrowRight, Boxes, Users, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FpoLotsPage: React.FC = () => {
  const [pools, setPools] = useState<AggregatedPool[]>(() =>
    dataStore.getDemoAggregatedPools()
  );

  useEffect(() => {
    const unsubscribe = dataStore.subscribeToPools(() => {
      setPools(dataStore.getDemoAggregatedPools());
    });
    return unsubscribe;
  }, []);

  const isStatusActive = (status: string) => {
    const s = status.toLowerCase();
    return (
      s.includes('available') ||
      s.includes('active') ||
      s.includes('listed') ||
      s.includes('open')
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-black tracking-tight">
            Active Pooled Lots
          </h1>
          <p className="text-xs text-brand-charcoal mt-0.5">
            Institutional-scale aggregated pools ready for enterprise contracts and wholesale procurement
          </p>
        </div>

        <Link
          to="/fpo/aggregation"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-green hover:brightness-110 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer self-start sm:self-auto"
        >
          <Layers className="w-4 h-4 text-white" />
          <span>Assemble New Collective Pool</span>
        </Link>
      </div>

      {/* Pools Grid or Empty State */}
      {pools.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs space-y-4 max-w-lg mx-auto mt-4">
          <div className="w-12 h-12 rounded-full bg-brand-lavender border border-slate-200 flex items-center justify-center mx-auto text-brand-charcoal">
            <Boxes className="w-6 h-6 text-brand-charcoal" />
          </div>
          <div>
            <h3 className="text-base font-bold text-brand-black">No Active Pools</h3>
            <p className="text-xs text-brand-charcoal mt-1 leading-relaxed">
              Head over to the Lot Aggregation tab to bundle available farmer orders into institutional pools.
            </p>
          </div>
          <div>
            <Link
              to="/fpo/aggregation"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-brand-green hover:brightness-110 text-white font-semibold text-xs rounded-lg shadow-xs transition cursor-pointer"
            >
              <Layers className="w-4 h-4 text-white" />
              <span>Go to Lot Aggregation</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pools.map((pool) => {
            const active = isStatusActive(pool.status);
            return (
              <div
                key={pool.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-[#6A994E]/50 transition flex flex-col justify-between"
              >
                <div>
                  {/* Pool Header: ID and Status Badge */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <span className="font-mono text-xs font-bold text-brand-black bg-brand-lavender px-2.5 py-1 rounded border border-slate-200 tracking-wide truncate">
                      {pool.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${
                        active
                          ? 'bg-brand-lime/20 text-brand-green border-[#6A994E]/30'
                          : 'bg-brand-charcoal/10 text-brand-black border-slate-300'
                      }`}
                    >
                      {pool.status}
                    </span>
                  </div>

                  {/* Commodity & Grade */}
                  <div className="mt-4">
                    <h3 className="text-base font-bold text-brand-black">
                      {pool.commodity} {pool.grade ? `· ${pool.grade}` : ''}
                    </h3>

                    {/* Total Aggregated Volume */}
                    <div className="text-2xl font-extrabold text-brand-green mt-1">
                      {pool.totalQuantity} Quintals
                    </div>

                    {/* Source Farmer Lots */}
                    <div className="flex items-center space-x-1.5 text-xs text-brand-charcoal font-medium mt-1">
                      <Users className="w-3.5 h-3.5 text-brand-charcoal" />
                      <span>
                        {pool.lotCount} Farmer {pool.lotCount === 1 ? 'Lot' : 'Lots'}
                      </span>
                    </div>
                  </div>

                  {/* Asking Rate */}
                  {pool.avgAskingPrice !== undefined && pool.avgAskingPrice > 0 && (
                    <div className="mt-4 p-2.5 bg-brand-lavender rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-brand-charcoal font-medium flex items-center space-x-1">
                        <Tag className="w-3.5 h-3.5 text-brand-charcoal" />
                        <span>Asking Rate</span>
                      </span>
                      <span className="font-mono font-bold text-brand-black text-sm">
                        ₹{Math.round(pool.avgAskingPrice).toLocaleString('en-IN')}/Q
                      </span>
                    </div>
                  )}

                  {/* Contributing Farmers */}
                  {pool.farmers && pool.farmers.length > 0 && (
                    <div className="mt-3 p-3 bg-brand-lavender/60 rounded-lg border border-slate-200 text-xs">
                      <div className="font-semibold text-brand-black mb-1">
                        {pool.farmers.length} Contributing Member Farmers:
                      </div>
                      <div className="text-[11px] text-brand-charcoal space-y-0.5">
                        {pool.farmers.map((farmer, idx) => (
                          <div key={idx} className="truncate">• {farmer}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer: Institutional readiness */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-brand-green flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-brand-green" />
                    <span>Available for Institutional Procurement</span>
                  </span>
                  <span className="text-[10px] text-brand-charcoal">
                    {pool.createdAt}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
