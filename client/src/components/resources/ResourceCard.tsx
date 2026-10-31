import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Resource } from '../../types/resource';
import {
  MapPin,
  Building,
  User,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Flame,
} from 'lucide-react';

interface ResourceCardProps {
  resource: Resource;
  onQuickBook?: (resource: Resource) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onQuickBook }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Available
          </span>
        );
      case 'reserved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Reserved
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            Maintenance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group flex flex-col justify-between rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/80 hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-300 overflow-hidden backdrop-blur-md"
    >
      <div>
        {/* Resource Image & Badges */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
          <img
            src={resource.images?.[0] || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'}
            alt={resource.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-950/85 text-brand-300 border border-brand-500/30 backdrop-blur-md shadow-md uppercase tracking-wider">
              {resource.category}
            </span>
            <div>{getStatusBadge(resource.status)}</div>
          </div>

          {/* Featured pill if active */}
          {resource.featured && (
            <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-semibold backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Recommended</span>
            </div>
          )}

          {/* Availability Text Pill */}
          <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/80 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium backdrop-blur-md">
            <Clock className="w-3 h-3" />
            <span>{resource.availabilityText}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3">
          {/* Title & Resource Type */}
          <div>
            <div className="text-[11px] font-semibold text-brand-400 tracking-wide uppercase">
              {resource.resourceType}
            </div>
            <Link
              to={`/dashboard/resources/${resource._id}`}
              className="text-base font-bold text-white hover:text-brand-300 transition-colors line-clamp-1 mt-0.5"
            >
              {resource.name}
            </Link>
          </div>

          {/* Institution & Location */}
          <div className="space-y-1 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 truncate">
              <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{resource.institution}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{resource.location}</span>
            </div>
          </div>

          {/* Owner Info & Approval Requirement */}
          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Owner / Custodian</span>
              <span className="text-slate-200 font-medium truncate block flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                {resource.ownerName}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Approval Policy</span>
              <span className={`font-semibold truncate block ${resource.approvalRequired ? 'text-amber-400' : 'text-emerald-400'}`}>
                {resource.approvalRequired ? 'Faculty Signoff' : 'Instant Booking'}
              </span>
            </div>
          </div>

          {/* Eligibility Requirements */}
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-1.5 text-[11px] text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
            <span className="line-clamp-1">
              <strong className="text-slate-400">Eligibility:</strong> {resource.eligibility}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 pt-0 flex items-center gap-2">
        <Link
          to={`/dashboard/resources/${resource._id}`}
          className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-white font-semibold text-xs text-center border border-slate-700/80 transition-all flex items-center justify-center gap-1.5 group/btn"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>
        {onQuickBook && (
          <button
            onClick={() => onQuickBook(resource)}
            className="py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs border border-brand-500/50 shadow-md shadow-brand-500/20 transition-all"
          >
            Request
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ResourceCard;
