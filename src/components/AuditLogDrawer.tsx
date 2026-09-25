import React from 'react';
import { X, Terminal } from 'lucide-react';
import { dataStore } from '../services/dataStore';

interface AuditLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  const logs = dataStore.getAuditLogs();

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white border-l border-slate-200 shadow-2xl flex flex-col text-[#0d0a0b] font-sans">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-[#F2E8CF]">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-[#386641]" />
          <h3 className="font-bold text-[#0d0a0b] text-sm font-mono">Platform Audit & State Machine Logs</h3>
        </div>
        <button
          onClick={onClose}
          className="text-[#454955] hover:text-[#0d0a0b] p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-3 text-xs text-[#454955] bg-[#F2E8CF]/50 border-b border-slate-200 font-mono">
        Append-only stream of critical operations, state transitions, and idempotency checks.
      </div>

      {/* Log items stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-[#454955] text-center py-8">No audit events logged yet.</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="p-3 rounded-lg bg-[#F2E8CF] border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#386641] text-[11px]">{log.operation}</span>
                <span className="text-[10px] text-[#454955]">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-[#0d0a0b] text-[11px]">
                Entity: <span className="font-semibold">{log.entityId}</span> • Actor: {log.actor}
              </div>
              {log.previousState && log.newState && (
                <div className="text-[10px] text-amber-700 font-semibold">
                  Transition: {log.previousState} → {log.newState}
                </div>
              )}
              {log.details && (
                <div className="text-[10px] text-[#454955] truncate mt-1 bg-white p-1.5 rounded border border-slate-200">
                  {JSON.stringify(log.details)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
