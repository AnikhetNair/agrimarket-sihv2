import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sprout, ShieldCheck, ArrowRight, Lock, Mail, AlertCircle, Building2, UserCheck, ShoppingBag } from 'lucide-react';
import { SEED_CREDENTIALS } from '../services/authService';

export const LoginPage: React.FC = () => {
  const { signIn, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect to proper role portal
  React.useEffect(() => {
    if (isAuthenticated && role) {
      const target = role === 'FARMER' ? '/farmer' : role === 'FPO' ? '/fpo' : '/buyer';
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please provide both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await signIn(email, password);
      const destination =
        user.role === 'FARMER' ? '/farmer' : user.role === 'FPO' ? '/fpo' : '/buyer';
      navigate(destination, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#F2E8CF] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-[#386641] selection:text-white">
      {/* Top Header / Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#386641] text-white shadow-sm mb-3">
          <Sprout className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0d0a0b]">
          Sign In to Your Workspace
        </h2>
        <p className="mt-1 text-sm text-[#454955]">
          Agricultural market intelligence & trade platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
          {errorMsg && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 flex items-start space-x-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#454955] mb-1">
                Official Email Address
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-[#454955]" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ramesh.patil@agri.demo"
                  className="block w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm text-[#0d0a0b] placeholder-slate-400 focus:border-[#386641] focus:ring-1 focus:ring-[#386641] outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#454955] mb-1">
                Secret Password
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-[#454955]" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm text-[#0d0a0b] placeholder-slate-400 focus:border-[#386641] focus:ring-1 focus:ring-[#386641] outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-sm font-semibold text-white bg-[#386641] hover:bg-[#2d5535] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#386641] transition disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <span className="flex items-center space-x-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Verifying identity & RBAC role...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1.5">
                  <span>Sign In to Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          {/* Role Showcase Credentials Helper for Evaluators */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#454955] mb-2.5 text-center">
              One-Click Demo Profiles (For Evaluators)
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  fillDemoAccount(
                    SEED_CREDENTIALS[0].email,
                    SEED_CREDENTIALS[0].password
                  )
                }
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-[#386641] hover:bg-[#6A994E]/10 transition flex items-center justify-between text-xs group cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded bg-[#6A994E]/20 text-[#386641] flex items-center justify-center font-bold">
                    <UserCheck className="w-4 h-4 text-[#386641]" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#0d0a0b] group-hover:text-[#386641]">
                      Ramesh Patil (Farmer)
                    </div>
                    <div className="text-[10px] text-[#454955]">
                      Individual Producer • 30Q Carrot Lot • Dindori
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#386641] bg-[#6A994E]/15 px-2 py-0.5 rounded border border-[#6A994E]/30 font-semibold">
                  FARMER
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  fillDemoAccount(
                    SEED_CREDENTIALS[1].email,
                    SEED_CREDENTIALS[1].password
                  )
                }
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-[#386641] hover:bg-[#6A994E]/10 transition flex items-center justify-between text-xs group cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded bg-[#386641]/15 text-[#386641] flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4 text-[#386641]" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#0d0a0b] group-hover:text-[#386641]">
                      Vikram Deshmukh (FPO Lead)
                    </div>
                    <div className="text-[10px] text-[#454955]">
                      Sahyadri FPC • Aggregation & Pooling • Nashik
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#386641] bg-[#386641]/15 px-2 py-0.5 rounded border border-[#386641]/30 font-semibold">
                  FPO
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  fillDemoAccount(
                    SEED_CREDENTIALS[2].email,
                    SEED_CREDENTIALS[2].password
                  )
                }
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-[#386641] hover:bg-[#6A994E]/10 transition flex items-center justify-between text-xs group cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded bg-slate-100 text-[#454955] flex items-center justify-center font-bold">
                    <ShoppingBag className="w-4 h-4 text-[#454955]" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#0d0a0b] group-hover:text-[#386641]">
                      Arjun Mehta (Institutional Buyer)
                    </div>
                    <div className="text-[10px] text-[#454955]">
                      FreshKart Foods India Ltd • Pune Processing Hub
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#454955] bg-slate-100 px-2 py-0.5 rounded border border-slate-300 font-semibold">
                  BUYER
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="mt-6 text-center text-xs text-[#454955] space-y-1">
          <div className="flex items-center justify-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#386641]" />
            <span>Role-Based Access Control (RBAC) & Row-Level Security Enforced</span>
          </div>
          <p className="text-[11px] text-[#454955]">
            Authenticated roles cannot access unauthorized dashboards or unpermitted records.
          </p>
        </div>
      </div>
    </div>
  );
};
