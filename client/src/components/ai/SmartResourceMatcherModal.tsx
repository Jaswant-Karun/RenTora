import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { smartMatchResourcesApi, SmartMatchItem } from '../../api/ai.api';
import { Resource } from '../../types/resource';
import { ALL_CATEGORIES } from '../../pages/ExploreResourcesPage';

interface SmartResourceMatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResourceForBooking: (resource: Resource) => void;
}

export const SmartResourceMatcherModal: React.FC<SmartResourceMatcherModalProps> = ({
  isOpen,
  onClose,
  onSelectResourceForBooking,
}) => {
  const [requirements, setRequirements] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<SmartMatchItem[]>([]);
  const [disclosure, setDisclosure] = useState<string>('');
  const [activeProvider, setActiveProvider] = useState<string>('');

  const samplePrompts = [
    'Cleanroom microfabrication photolithography aligner with 1um resolution',
    'High performance GPU workstation for deep learning PyTorch training',
    '3D printer for carbon fiber reinforced mechanical prototypes',
    'Digital SLR 4K camera with prime lens for documentation',
  ];

  const handleSearch = async (reqText = requirements) => {
    if (!reqText.trim() && selectedCategory === 'All') return;
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await smartMatchResourcesApi({
        requirements: reqText,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        location: selectedLocation !== 'All' ? selectedLocation : undefined,
      });
      if (res.success) {
        setResults(res.data.results);
        setDisclosure(res.data.disclosure);
        setActiveProvider(res.data.aiProvider);
      }
    } catch (err) {
      console.error('Smart match search error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="w-full max-w-4xl rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl flex flex-col overflow-hidden max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#172033]">Smart Resource Matcher</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20">
                  AI-Assisted
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Match equipment to project requirements, eligibility, specifications & schedule.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#172033] rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-[#FFFFFF]">
          {/* Natural Language Prompt Input */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-[#1769D2]" /> Describe Your Project or Experimental Need
            </label>
            <div className="relative">
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                rows={2}
                placeholder="E.g., I need a high-power field emission microscope for imaging semiconductor thin-films..."
                className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] placeholder-[#64748B] focus:outline-none focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2] transition-all resize-none"
              />
              <button
                onClick={() => handleSearch()}
                disabled={loading || (!requirements.trim() && selectedCategory === 'All')}
                className="absolute right-2.5 bottom-2.5 px-4 py-1.5 bg-[#1769D2] hover:bg-[#1256B0] text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading ? (
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Matching...
                  </span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Match Equipment
                  </>
                )}
              </button>
            </div>

            {/* Quick Inspiration Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-[#64748B] font-medium">Quick Prompts:</span>
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setRequirements(prompt);
                    handleSearch(prompt);
                  }}
                  className="px-2.5 py-1 bg-[#F8FAFC] hover:bg-slate-100 text-[11px] text-[#172033] rounded-lg border border-[#E2E8F0] transition-colors"
                >
                  {prompt.slice(0, 42)}...
                </button>
              ))}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div>
              <label className="text-[11px] font-semibold text-[#64748B] block mb-1.5">Category Filter</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2]"
              >
                <option value="All">All Categories</option>
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#64748B] block mb-1.5">Campus Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2]"
              >
                <option value="All">All Locations & Wings</option>
                <option value="Nano-Technology Center">Nano-Technology Center</option>
                <option value="Main Engineering Block">Main Engineering Block</option>
                <option value="Advanced Computing Lab">Advanced Computing Lab</option>
                <option value="Central Innovation Workshop">Central Innovation Workshop</option>
              </select>
            </div>
          </div>

          {/* Search Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
                <span>Recommended Resources</span>
                {results.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#EFF6FF] text-[#1769D2] font-semibold border border-[#1769D2]/20">
                    {results.length} Matches Found
                  </span>
                )}
              </h3>
              {activeProvider && (
                <span className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Engine: {activeProvider}
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-[#1769D2]/20 border-t-[#1769D2] rounded-full animate-spin mx-auto" />
                <p className="text-xs text-[#64748B]">
                  Analyzing technical specifications, equipment manuals & active availability schedules...
                </p>
              </div>
            ) : hasSearched && results.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-[#D97706] mx-auto" />
                <h4 className="text-sm font-semibold text-[#172033]">No Direct Resource Matches</h4>
                <p className="text-xs text-[#64748B] max-w-md mx-auto">
                  Try broadening your search query or selecting "All Categories" to see available substitutes.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((item, idx) => (
                  <div
                    key={item.resource._id || idx}
                    className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#1769D2]/50 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#E2E8F0] shrink-0 bg-white">
                          <img
                            src={
                              item.resource.images?.[0] ||
                              'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300'
                            }
                            alt={item.resource.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-[#172033]">{item.resource.name}</h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EFF6FF] text-[#1769D2]">
                              {item.matchScore}% Match
                            </span>
                          </div>
                          <p className="text-xs text-[#64748B]">
                            {item.resource.category} • {item.resource.location} • {item.resource.institution}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onSelectResourceForBooking(item.resource);
                          onClose();
                        }}
                        className="px-4 py-1.5 bg-[#1769D2] hover:bg-[#1256B0] text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0"
                      >
                        Reserve Asset <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-[#172033] bg-white p-2.5 rounded-lg border border-[#E2E8F0] leading-relaxed">
                      <strong className="text-[#1769D2]">Match Rationale:</strong> {item.matchRationale}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
          <span>{disclosure || 'Smart matching recommendations are advisory.'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#172033] rounded-lg text-xs font-medium transition-colors"
          >
            Close Matcher
          </button>
        </div>
      </motion.div>
    </div>
  );
};
