import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Layers,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  MapPin,
  Clock,
  CornerDownLeft,
} from 'lucide-react';
import { globalSearchApi, GlobalSearchResponse, GlobalSearchResultItem } from '../../api/resource.api';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  // Debounced live query
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await globalSearchApi(query.trim());
        if (res.success && res.data) {
          setResults(res.data);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Flattened list for keyboard navigation
  const flatItems: GlobalSearchResultItem[] = results
    ? [...results.resources, ...results.bookings, ...results.incidents]
    : [];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        navigate(flatItems[selectedIndex].link);
        onClose();
      }
    }
  };

  const handleSelectItem = (item: GlobalSearchResultItem) => {
    navigate(item.link);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-20 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        className="w-full max-w-2xl bg-white border border-[#E2E8F0] shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#E2E8F0] flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-[#64748B] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search resources, bookings, safety records (e.g. DGX, Cleanroom, Arun)..."
            className="w-full text-sm text-[#172033] placeholder-[#94A3B8] focus:outline-none bg-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-[#64748B] hover:text-[#172033] rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-[#64748B] bg-slate-100 border border-[#E2E8F0]">
            ESC
          </span>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#64748B] space-y-2">
              <div className="w-6 h-6 border-2 border-[#1769D2]/20 border-t-[#1769D2] rounded-full animate-spin mx-auto" />
              <p>Scanning institutional index across faculties...</p>
            </div>
          ) : results ? (
            results.totalCount === 0 ? (
              <div className="py-12 text-center text-xs text-[#64748B] space-y-1">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-[#172033]">No records found for "{query}"</p>
                <p>Try searching by apparatus model, category, user name, or booking status.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. Resources */}
                {results.resources.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5 px-2">
                      <Layers className="w-3 h-3 text-[#1769D2]" />
                      Resources & Laboratory Apparatus ({results.resources.length})
                    </span>
                    <div className="space-y-1">
                      {results.resources.map((item) => {
                        const index = flatItems.indexOf(item);
                        const isSelected = index === selectedIndex;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectItem(item)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={`p-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                              isSelected ? 'bg-[#EFF6FF] border border-blue-200' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-slate-100 border border-[#E2E8F0] overflow-hidden shrink-0">
                                {item.image ? (
                                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                ) : (
                                  <Layers className="w-4 h-4 text-slate-400 m-auto mt-2" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-[#172033] truncate">{item.title}</p>
                                <p className="text-[11px] text-[#64748B] truncate">
                                  {item.category} • {item.location}
                                </p>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white border border-[#E2E8F0] text-[#1769D2] shrink-0">
                              {item.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Bookings */}
                {results.bookings.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5 px-2">
                      <Calendar className="w-3 h-3 text-purple-600" />
                      Reservations & Bookings ({results.bookings.length})
                    </span>
                    <div className="space-y-1">
                      {results.bookings.map((item) => {
                        const index = flatItems.indexOf(item);
                        const isSelected = index === selectedIndex;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectItem(item)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={`p-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                              isSelected ? 'bg-purple-50/60 border border-purple-200' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#172033] truncate">{item.title}</p>
                              <p className="text-[11px] text-[#64748B] truncate">
                                Researcher: {item.user} • {item.date} ({item.timeSlot})
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-[#172033] capitalize shrink-0">
                              {item.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Incidents */}
                {results.incidents.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5 px-2">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      Safety Incidents & Reports ({results.incidents.length})
                    </span>
                    <div className="space-y-1">
                      {results.incidents.map((item) => {
                        const index = flatItems.indexOf(item);
                        const isSelected = index === selectedIndex;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectItem(item)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={`p-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                              isSelected ? 'bg-amber-50/60 border border-amber-200' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#172033] truncate">{item.title}</p>
                              <p className="text-[11px] text-[#64748B] truncate">
                                Category: {item.category} • Severity: {item.severity}
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-amber-200 text-amber-800 capitalize shrink-0">
                              {item.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            /* Quick Search Suggestions */
            <div className="py-6 space-y-4">
              <span className="text-[11px] font-semibold text-[#64748B] block">Quick Campus Catalog Searches:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  'NVIDIA DGX GPU',
                  'Cleanroom Nanotech',
                  'Carbon Fiber 3D Printer',
                  'Digital Oscilloscope',
                  'Bio-imaging Microscope',
                  'Workshop CNC',
                ].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="px-3 py-1.5 rounded-lg text-xs bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-slate-100 hover:border-blue-200 text-[#172033] transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
          <div className="flex items-center gap-3">
            <span>
              Use <kbd className="font-mono bg-white px-1 rounded border border-[#E2E8F0]">↑</kbd>{' '}
              <kbd className="font-mono bg-white px-1 rounded border border-[#E2E8F0]">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="font-mono bg-white px-1 rounded border border-[#E2E8F0]">Enter</kbd> to select
            </span>
          </div>
          <span>RENTORA Global Index</span>
        </div>
      </motion.div>
    </div>
  );
};

export default GlobalSearchModal;
