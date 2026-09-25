import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const LanguageSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      aria-label="Language selection"
      className={`inline-flex items-center bg-[#F2E8CF]/80 p-0.5 rounded-lg border border-[#454955]/20 text-xs font-medium shadow-2xs select-none ${className}`}
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2 py-0.5 rounded-md transition cursor-pointer text-xs font-medium ${
          language === 'en'
            ? 'bg-[#386641] text-white shadow-2xs font-semibold'
            : 'text-[#454955] hover:text-[#0d0a0b]'
        }`}
        title="English"
      >
        EN
      </button>
      <span className="text-[#454955]/40 text-[10px] px-0.5" aria-hidden="true">
        |
      </span>
      <button
        type="button"
        onClick={() => setLanguage('hi')}
        className={`px-2 py-0.5 rounded-md transition cursor-pointer text-xs font-medium ${
          language === 'hi'
            ? 'bg-[#386641] text-white shadow-2xs font-semibold'
            : 'text-[#454955] hover:text-[#0d0a0b]'
        }`}
        title="हिन्दी (Hindi)"
      >
        हिन्दी
      </button>
      <span className="text-[#454955]/40 text-[10px] px-0.5" aria-hidden="true">
        |
      </span>
      <button
        type="button"
        onClick={() => setLanguage('mr')}
        className={`px-2 py-0.5 rounded-md transition cursor-pointer text-xs font-medium ${
          language === 'mr'
            ? 'bg-[#386641] text-white shadow-2xs font-semibold'
            : 'text-[#454955] hover:text-[#0d0a0b]'
        }`}
        title="मराठी (Marathi)"
      >
        मराठी
      </button>
    </div>
  );
};
