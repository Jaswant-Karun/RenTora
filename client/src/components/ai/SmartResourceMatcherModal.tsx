import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Repeat,
  Info,
  X,
  RefreshCw,
  Cpu,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  smartMatchResourcesApi,
  SmartMatchItem,
  ParsedSearchIntent,
} from '../../api/ai.api';
import { Resource } from '../../types/resource';
import { ALL_CATEGORIES } from '../../pages/ExploreResourcesPage';

interface SmartResourceMatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResourceForBooking?: (resource: Resource, initialDate?: string, initialSlot?: string) => void;
  onSelectResource?: (resource: any) => void;
  initialQuery?: string;
}

export const SmartResourceMatcherModal: React.FC<SmartResourceMatcherModalProps> = ({
  isOpen,
  onClose,
  onSelectResourceForBooking,
  onSelectResource,
  initialQuery = '',
}) => {
  const [requirements, setRequirements] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [results, setResults] = useState<SmartMatchItem[]>([]);
  const [parsedIntent, setParsedIntent] = useState<ParsedSearchIntent | undefined>(undefined);
  const [disclosure, setDisclosure] = useState<string>('');
  const [activeProvider, setActiveProvider] = useState<string>('');

  const samplePrompts = [
    'I need a computer lab with GPU access tomorrow afternoon.',
    'Cleanroom microfabrication photolithography aligner with sub-micron resolution',
    '3D printer for carbon fiber reinforced mechanical prototypes this Friday',
    'High-resolution digital microscope for biological cell imaging tomorrow morning',
  ];

  const handleSearch = async (reqText = requirements) => {
    if (!reqText.trim() && selectedCategory === 'All') return;
    setLoading(true);
    setHasSearched(true);
    setErrorMessage(null);
    try {
      const res = await smartMatchResourcesApi({
        requirements: reqText,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        location: selectedLocation !== 'All' ? selectedLocation : undefined,
      });

      if (res.success && res.data) {
        setResults(res.data.results);
        setParsedIntent(res.data.parsedIntent);
        setDisclosure(res.data.disclosure);
        setActiveProvider(res.data.aiProvider);
      } else {
        setErrorMessage('Failed to aggregate matching resources.');
      }
    } catch (err: any) {
      console.error('Smart match search error:', err);
      setErrorMessage(
        err.response?.data?.message ||
          'SmartMatch engine encountered an error. Falling back to heuristic campus catalog matching.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlotAndBook = (
    resource: Resource,
    slot?: string,
    date?: string
  ) => {
    if (onSelectResourceForBooking) {
      onSelectResourceForBooking(resource, date, slot);
    } else if (onSelectResource) {
      onSelectResource(resource);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="w-full max-w-4xl rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl flex flex-col overflow-hidden max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20 flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#172033]">
                  SmartMatch – AI-Assisted Resource Discovery
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20">
                  REAL-TIME ADVISORY
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Natural-language discovery matching user institution, categories, availability, eligibility & specifications.
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
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-[#FFFFFF]">
          {/* Natural Language Prompt Search Box */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-[#172033] flex items-center justify-between">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Search className="w-3.5 h-3.5 text-[#1769D2]" /> Natural Language Intent & Equipment Query
              </span>
              <span className="text-[11px] text-[#64748B] font-normal">
                Type your research requirements in plain language
              </span>
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
                placeholder="E.g., I need a computer lab with GPU access tomorrow afternoon."
                className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#1769D2] focus:ring-2 focus:ring-[#1769D2]/20 transition-all resize-none shadow-sm"
              />
              <button
                onClick={() => handleSearch()}
                disabled={loading || (!requirements.trim() && selectedCategory === 'All')}
                className="absolute right-2.5 bottom-2.5 px-4 py-2 bg-[#1769D2] hover:bg-[#1256B0] text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Matching...
                  </span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Discover Resources
                  </>
                )}
              </button>
            </div>

            {/* Quick Inspiration Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-[#64748B] font-medium">Try Sample:</span>
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setRequirements(prompt);
                    handleSearch(prompt);
                  }}
                  className="px-2.5 py-1 bg-[#F8FAFC] hover:bg-slate-100 hover:border-blue-200 text-[11px] text-[#172033] rounded-lg border border-[#E2E8F0] transition-colors text-left truncate max-w-xs"
                  title={prompt}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Parsed Search Intent Breakdown Banner */}
          {parsedIntent && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 border border-blue-100 text-xs text-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#1769D2] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Understood Search Intent
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-blue-200 text-[#1769D2]">
                  {parsedIntent.confidence}% Intent Confidence
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                {parsedIntent.detectedCategory && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-[#E2E8F0] font-medium text-[#172033]">
                    <Layers className="w-3 h-3 text-[#1769D2]" />
                    Category: <strong>{parsedIntent.detectedCategory}</strong>
                  </span>
                )}
                {parsedIntent.detectedDate && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-[#E2E8F0] font-medium text-[#172033]">
                    <Calendar className="w-3 h-3 text-purple-600" />
                    Target Date: <strong>{parsedIntent.detectedDate}</strong>
                  </span>
                )}
                {parsedIntent.detectedTimeSlot && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-[#E2E8F0] font-medium text-[#172033]">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    Slot: <strong>{parsedIntent.detectedTimeSlot}</strong>
                  </span>
                )}
                {parsedIntent.detectedSpecs.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-[#E2E8F0] font-medium text-[#172033]">
                    <Cpu className="w-3 h-3 text-amber-600" />
                    Specs: <strong>{parsedIntent.detectedSpecs.join(', ')}</strong>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Optional Refinement Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div>
              <label className="text-[11px] font-semibold text-[#64748B] block mb-1">
                Override Category Filter
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-[#1769D2]"
              >
                <option value="All">All Categories (Auto-Detect)</option>
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#64748B] block mb-1">
                Campus Location / Wing
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-[#1769D2]"
              >
                <option value="All">All Locations & Wings</option>
                <option value="Nano-Technology Center">Nano-Technology Center</option>
                <option value="Main Engineering Block">Main Engineering Block</option>
                <option value="Advanced Computing Lab">Advanced Computing Lab</option>
                <option value="Central Innovation Workshop">Central Innovation Workshop</option>
              </select>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => handleSearch()}
                className="text-xs font-semibold text-red-900 underline ml-2"
              >
                Retry
              </button>
            </div>
          )}

          {/* Results Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
                <span>Ranked Recommendations</span>
                {results.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#EFF6FF] text-[#1769D2] font-semibold border border-[#1769D2]/20">
                    {results.length} Matches Found
                  </span>
                )}
              </h3>
              {activeProvider && (
                <span className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Engine: <strong className="text-[#172033]">{activeProvider}</strong>
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-14 text-center space-y-3">
                <div className="w-9 h-9 border-2 border-[#1769D2]/20 border-t-[#1769D2] rounded-full animate-spin mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#172033]">
                    Analyzing Hardware Specs & Real-Time Booking Calendars...
                  </p>
                  <p className="text-[11px] text-[#64748B]">
                    Evaluating prerequisite certifications, campus proximity, and conflict-free intervals
                  </p>
                </div>
              </div>
            ) : hasSearched && results.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <h4 className="text-sm font-bold text-[#172033]">No Direct Resource Matches</h4>
                <p className="text-xs text-[#64748B] max-w-md mx-auto">
                  Try broadening your query or selecting "All Categories" to see available substitutes across partner faculties.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((item, idx) => {
                  const res = item.resource;
                  const isEligible = item.eligibilityStatus.eligible;
                  const missingCerts = item.eligibilityStatus.missingCertifications || [];
                  const timeSlots = item.availabilityStatus.recommendedTimeSlots || [];
                  const targetDate = parsedIntent?.detectedDate || 'Target Date';

                  return (
                    <div
                      key={res._id || idx}
                      className="p-4 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#1769D2]/40 hover:shadow-md transition-all space-y-3.5"
                    >
                      {/* Top Bar: Image, Name, Score, Action */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 rounded-lg overflow-hidden border border-[#E2E8F0] shrink-0 bg-slate-100">
                            <img
                              src={
                                res.images?.[0] ||
                                'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300'
                              }
                              alt={res.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center flex-wrap gap-2">
                              <h4 className="text-sm font-bold text-[#172033]">{res.name}</h4>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.matchScore >= 80
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-blue-50 text-[#1769D2] border border-blue-200'
                                }`}
                              >
                                {item.matchScore}% Match
                              </span>
                              {res.status === 'available' ? (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-50 text-emerald-600">
                                  Available Now
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-50 text-amber-700">
                                  {res.status}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#64748B] flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium text-[#172033]">{res.category}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-[#64748B]" />
                                {res.location}
                              </span>
                              <span>•</span>
                              <span>{res.institution}</span>
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            handleSelectSlotAndBook(
                              res,
                              parsedIntent?.detectedTimeSlot,
                              parsedIntent?.detectedDate
                            )
                          }
                          className="px-4 py-2 bg-[#1769D2] hover:bg-[#1256B0] text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-auto"
                        >
                          <span>Reserve Asset</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Why Recommended Breakdown */}
                      <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 text-xs text-[#172033]">
                        <span className="font-semibold text-[#1769D2] block text-[11px] uppercase tracking-wide">
                          Why This Resource Was Recommended:
                        </span>
                        <ul className="space-y-1">
                          {item.whyRecommended.map((reason, rIdx) => (
                            <li key={rIdx} className="flex items-start gap-1.5 text-xs text-slate-700 leading-snug">
                              <span className="text-[#1769D2] font-bold mt-0.5">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Conflict-Free Recommended Time Slots on Target Date */}
                      {timeSlots.length > 0 && (
                        <div className="space-y-1.5 text-xs">
                          <span className="text-[11px] font-semibold text-[#64748B] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#1769D2]" />
                            Recommended Conflict-Free Slots on {targetDate}:
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {timeSlots.map((slot, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                disabled={!slot.isAvailable}
                                onClick={() => handleSelectSlotAndBook(res, slot.timeSlot, parsedIntent?.detectedDate)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
                                  slot.isAvailable
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed line-through'
                                }`}
                                title={slot.conflictReason || 'Click to prefill booking'}
                              >
                                {slot.isAvailable && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                                <span>{slot.timeSlot}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Eligibility & Missing Requirements Alert */}
                      <div className="pt-2 border-t border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          {isEligible ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Eligibility Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                              Prerequisite Clearance Needed
                            </span>
                          )}

                          {item.eligibilityStatus.actionRequired && (
                            <span className="text-[11px] text-amber-700 font-medium">
                              {item.eligibilityStatus.actionRequired}
                            </span>
                          )}
                        </div>

                        {res.hourlyValueEstimated && res.hourlyValueEstimated > 0 ? (
                          <span className="text-[11px] text-[#64748B]">
                            Institutional Grant Value: ~₹{res.hourlyValueEstimated}/hr
                          </span>
                        ) : null}
                      </div>

                      {/* Unavailable Alternatives Sub-Panel */}
                      {item.alternatives && item.alternatives.length > 0 && (
                        <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/70 text-xs space-y-2">
                          <span className="font-semibold text-amber-900 flex items-center gap-1 text-[11px] uppercase tracking-wide">
                            <Repeat className="w-3 h-3 text-amber-700" />
                            Suggested Nearby & Institution-Approved Alternatives:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {item.alternatives.map((alt, aIdx) => (
                              <div
                                key={aIdx}
                                className="p-2.5 rounded-lg bg-white border border-amber-200 flex items-center justify-between gap-2"
                              >
                                <div className="space-y-0.5">
                                  <p className="font-bold text-slate-800 text-xs">{alt.name}</p>
                                  <p className="text-[11px] text-slate-500">
                                    {alt.location} • {alt.institution}
                                  </p>
                                  <p className="text-[10px] text-amber-800">{alt.reason}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleSearch(alt.name)}
                                  className="px-2 py-1 text-[11px] font-semibold text-[#1769D2] hover:bg-blue-50 rounded border border-blue-200 shrink-0"
                                >
                                  View
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer with AI Safety & Business Rules Notice */}
        <div className="p-4 bg-slate-50 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-[#64748B]">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>
              <strong>AI Safety Guarantee:</strong> Recommendations are advisory. Actual reservation locks and eligibility rules are enforced by backend business logic.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-100 text-[#172033] rounded-lg text-xs font-medium transition-colors self-end sm:self-auto shadow-sm"
          >
            Close SmartMatch
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SmartResourceMatcherModal;
