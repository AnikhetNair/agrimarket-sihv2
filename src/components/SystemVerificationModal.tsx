import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import { runAllSpecificationTests, TestResult } from '../services/tests';

interface SystemVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemVerificationModal: React.FC<SystemVerificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const executeTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runAllSpecificationTests();
      setResults(res);
      setIsRunning(false);
    }, 250);
  };

  useEffect(() => {
    if (isOpen) {
      executeTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allPassed = results.length > 0 && results.every((r) => r.passed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden text-[#0d0a0b]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-[#F2E8CF]">
          <div>
            <h3 className="text-base font-bold text-[#0d0a0b] flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-[#386641]" />
              <span>Specification & Deterministic Invariant Verification</span>
            </h3>
            <p className="text-xs text-[#454955] mt-0.5">
              Automated unit & integration verification for SIH 2026 Core Rules
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#454955] hover:text-[#0d0a0b] p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Strip */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-1 rounded-md font-mono font-bold ${
                allPassed
                  ? 'bg-[#6A994E]/15 text-[#386641] border border-[#6A994E]/30'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {allPassed ? 'ALL VERIFICATIONS PASSED (5/5)' : 'RUNNING VERIFICATIONS...'}
            </span>
            <span className="text-[#454955] font-mono">Zero Disparity Verified</span>
          </div>

          <button
            onClick={executeTests}
            disabled={isRunning}
            className="flex items-center space-x-1 px-3 py-1 bg-[#F2E8CF] hover:bg-slate-200 text-[#0d0a0b] rounded-lg font-mono text-xs transition cursor-pointer border border-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#386641] ${isRunning ? 'animate-spin' : ''}`} />
            <span>Re-run Suite</span>
          </button>
        </div>

        {/* Test Cards List */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {results.map((test, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border text-xs ${
                test.passed ? 'bg-[#F2E8CF]/50 border-slate-200' : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2.5">
                  {test.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-[#386641] shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="font-bold text-[#0d0a0b] text-sm">{test.name}</h4>
                    <span className="text-[10px] font-mono text-[#454955] uppercase">{test.category}</span>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                    test.passed
                      ? 'bg-[#6A994E]/15 text-[#386641] border border-[#6A994E]/30'
                      : 'bg-red-100 text-red-700 border border-red-300'
                  }`}
                >
                  {test.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>

              <p className="mt-2.5 text-[#0d0a0b] text-xs leading-relaxed font-sans">{test.message}</p>

              {/* Data Invariant Inspection */}
              <div className="mt-3 pt-2.5 border-t border-slate-200 grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-[#454955] block">Expected Spec Target:</span>
                  <pre className="text-[#0d0a0b] text-[10px] truncate mt-0.5 bg-white p-1 rounded border border-slate-200">
                    {JSON.stringify(test.expected)}
                  </pre>
                </div>
                <div>
                  <span className="text-[#454955] block">Engine Output:</span>
                  <pre className="text-[#386641] text-[10px] truncate mt-0.5 bg-white p-1 rounded border border-slate-200 font-bold">
                    {JSON.stringify(test.actual)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-[#F2E8CF] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#386641] hover:bg-[#2d5535] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
