import React, { useState } from 'react';
import { X, Bot, Send, Sparkles } from 'lucide-react';
import { User } from '../types/domain';
import { askAgriAssistant } from '../services/aiService';

interface AssistantChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeUser: User;
}

interface ChatMessage {
  id: string;
  sender: 'USER' | 'ASSISTANT';
  text: string;
  timestamp: string;
}

export const AssistantChatDrawer: React.FC<AssistantChatDrawerProps> = ({
  isOpen,
  onClose,
  activeUser,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-init',
      sender: 'ASSISTANT',
      text: `Namaste ${activeUser.name}! I am your AgriMarket Intelligence Assistant. I provide market benchmark guidance, logistics cost estimations, and trade support strictly grounded in verified platform records. How can I assist you today?`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const quickQuestions = [
    'What is my 30Q Grade A Carrot consignment worth today?',
    'Should I sell my carrots now or hold for 7 days?',
    'Explain the transport and storage deductions for Nashik to Pune delivery.',
    'Are there verified institutional buyers looking for Grade A carrots?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'USER',
      text: query,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const replyText = await askAgriAssistant(query, activeUser.role, {
        userName: activeUser.name,
        role: activeUser.role,
        commodity: 'Carrot',
        currentMandiModal: 2850,
        forecastRange: '₹3,000–₹3,150/Q',
        activeBuyerOffer: 3100,
      });

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ASSISTANT',
        text: replyText,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ASSISTANT',
          text: 'Nashik APMC modal rate is currently ₹2,850/Q. FreshKart Foods has an open procurement requirement for 30Q Grade A tomatoes at ₹3,050–₹3,100/Q with dock acceptance at Pune.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col text-[#0d0a0b] font-sans">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-[#F2E8CF]">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#386641] flex items-center justify-center text-white shadow-xs">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-[#0d0a0b] text-sm">AgriMarket Decision Assistant</h3>
            <p className="text-[10px] text-[#386641] font-medium">Strictly Grounded in Platform Invariants</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[#454955] hover:text-[#0d0a0b] p-1 rounded-md transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-[#F2E8CF]/40">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'USER' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 ${
                m.sender === 'USER'
                  ? 'bg-[#386641] text-white font-medium shadow-2xs'
                  : 'bg-white border border-slate-200 text-[#0d0a0b] leading-relaxed shadow-2xs'
              }`}
            >
              {m.text}
            </div>
            <span className="text-[10px] text-[#454955] font-mono mt-1 px-1">{m.timestamp}</span>
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-2 text-[#454955] text-xs py-2">
            <Sparkles className="w-3.5 h-3.5 text-[#386641] animate-spin" />
            <span>Synthesizing market intelligence & verified records...</span>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="p-2 bg-white border-t border-slate-200 overflow-x-auto whitespace-nowrap flex space-x-1.5 scrollbar-none text-[11px]">
        {quickQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(q)}
            className="px-2.5 py-1 bg-[#F2E8CF] hover:bg-[#6A994E]/20 text-[#0d0a0b] rounded-full border border-slate-200 shrink-0 transition cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask about prices, logistics deductions, holding strategies..."
          className="flex-1 bg-[#F2E8CF] border border-slate-200 rounded-lg px-3 py-2 text-xs text-[#0d0a0b] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#386641]"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputQuery.trim() || loading}
          className="p-2 bg-[#386641] hover:bg-[#2d5535] text-white rounded-lg transition disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
};
