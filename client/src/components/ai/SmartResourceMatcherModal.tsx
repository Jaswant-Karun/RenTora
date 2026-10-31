import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Cpu,
  Info,
  X,
  SlidersHorizontal,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-6 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Smart Resource Matcher</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/30">
                  AI-Assisted
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Match equipment to your project requirements, eligibility, specifications & schedule.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Natural Language Prompt Input */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-brand-400" /> Describe Your Project or Experimental Need
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
                placeholder="E.g., I need a high-power field emission microscope for imaging nanostructured semiconductor thin-films at high vacuum..."
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none"
              />
              <button
                onClick={() => handleSearch()}
                disabled={loading || (!requirements.trim() && selectedCategory === 'All')}
                className="absolute right-3 bottom-3 px-4 py-1.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-600/30 transition-all disabled:opacity-50 flex items-center gap-1.5"
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
              <span className="text-[11px] text-slate-500 font-medium">Quick Prompts:</span>
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setRequirements(prompt);
                    handleSearch(prompt);
                  }}
                  className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white rounded-lg border border-slate-700/60 transition-colors"
                >
                  {prompt.slice(0, 42)}...
                </button>
              ))}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">Category Filter</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
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
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">Campus Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span>Recommended Resources</span>
                {results.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-medium">
                    {results.length} Matches Found
                  </span>
                )}
              </h3>
              {activeProvider && (
                <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Engine: {activeProvider}
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400">
                  Synthesizing requirements, validating eligibility credentials & scanning facility schedules...
                </p>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-4">
                {results.map((item) => (
                  <div
                    key={item.resource._id}
                    className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90 hover:border-brand-500/40 transition-all space-y-4 shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={item.resource.images?.[0] || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300'}
                          alt={item.resource.name}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white hover:text-brand-300 transition-colors">
                              {item.resource.name}
                            </h4>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/60">
                              {item.resource.category}
                            </span>
                            {item.eligibilityStatus.isRestricted && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                Restricted Asset
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {item.resource.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Layers className="w-3 h-3 text-slate-500" />
                              {item.resource.ownerDepartment}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Score Badge & Action */}
                      <div className="flex items-center gap-3 sm:self-center shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right">
                          <div
                            className={`px-3 py-1 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-md ${
                              item.matchScore >= 80
                                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-gradient-to-r from-brand-500/20 to-indigo-500/20 text-brand-300 border border-brand-500/40'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            {item.matchScore}% Match
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {item.eligibilityStatus.eligible ? 'Fully Eligible' : 'Induction Required'}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            onSelectResourceForBooking(item.resource);
                            onClose();
                          }}
                          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-brand-600/30 transition-all flex items-center gap-1.5"
                        >
                          Reserve
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Why Recommended Reasons */}
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                      <div className="text-[11px] font-bold text-brand-300 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-brand-400" />
                        Why RENTORA AI Recommended This Equipment:
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {item.whyRecommended.map((reason, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Eligibility & Specs Footer */}
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <ShieldCheck
                            className={`w-3.5 h-3.5 ${
                              item.eligibilityStatus.eligible ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          />
                          {item.eligibilityStatus.eligible
                            ? 'All prerequisite training verified'
                            : `Prerequisite: ${item.resource.requiredQualification || 'Induction Required'}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {item.availabilityStatus.reason}
                        </span>
                      </div>
                      {item.specificationsMatched.length > 0 && (
                        <div className="flex items-center gap-1 text-slate-300">
                          <Cpu className="w-3.5 h-3.5 text-brand-400" />
                          {item.specificationsMatched.join(' • ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : hasSearched ? (
              <div className="py-12 text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-sm font-semibold text-white">No Equipment Matches Found</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Try broadening your keyword scope or selecting 'All Categories' to discover alternative institutional assets.
                </p>
              </div>
            ) : (
              <div className="py-10 text-center space-y-2">
                <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">Enter Your Needs Above</p>
                <p className="text-xs text-slate-500">
                  RENTORA will analyze equipment specifications, training requirements, and availability schedules.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer with AI Disclosure */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-mono text-[11px] text-slate-400">
              {disclosure ||
                'Active Engine: RENTORA Embedded Intelligence Engine (Rule-based & Heuristic Neural Fallback — 100% Offline & Private).'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Advisory Only • Human Custodian Approval Required
          </div>
        </div>
      </motion.div>
    </div>
  );
};
