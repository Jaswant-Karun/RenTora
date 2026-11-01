import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Resource } from '../../types/resource';
import { StatusBadge } from '../common/StatusBadge';
import { isFavoriteResource, toggleFavoriteResource } from '../../utils/favorites';
import { getResourceImage, handleImageFallback } from '../../utils/resourceImages';
import {
  MapPin,
  Building,
  User,
  ShieldCheck,
  Clock,
  ArrowRight,
  Heart,
} from 'lucide-react';

interface ResourceCardProps {
  resource: Resource;
  onQuickBook?: (resource: Resource) => void;
  className?: string;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onQuickBook, className = '' }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setIsFavorite(isFavoriteResource(resource._id));

    const handleFavChange = (e: any) => {
      if (e.detail?.resourceId === resource._id) {
        setIsFavorite(e.detail.isNowFavorite);
      }
    };

    window.addEventListener('rentora_favorites_changed', handleFavChange);
    return () => window.removeEventListener('rentora_favorites_changed', handleFavChange);
  }, [resource._id]);

  const handleCardClick = () => {
    try {
      const raw = localStorage.getItem('rentora_recently_viewed');
      let list: Resource[] = raw ? JSON.parse(raw) : [];
      list = [resource, ...list.filter((r) => r._id !== resource._id)].slice(0, 8);
      localStorage.setItem('rentora_recently_viewed', JSON.stringify(list));
    } catch {
      // Ignore storage errors
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nowFav = toggleFavoriteResource(resource._id);
    setIsFavorite(nowFav);
  };

  return (
    <div
      className={`group flex flex-col justify-between rounded-xl bg-white border border-[#E2E8F0] shadow-sm hover:border-[#CBD5E1] hover:shadow-md transition-all duration-200 overflow-hidden ${className}`}
    >
      <div>
        {/* High-quality consistent image header */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
          <Link to={`/dashboard/resources/${resource._id}`} onClick={handleCardClick} className="block w-full h-full">
            <img
              src={getResourceImage(resource.images, resource.category)}
              alt={resource.name}
              onError={(e) => handleImageFallback(e, resource.category)}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              loading="lazy"
            />
          </Link>

          {/* Top Badges & Favorite button */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/95 text-[#1769D2] border border-[#E2E8F0] shadow-xs pointer-events-none">
              {resource.category}
            </span>
            <div className="flex items-center gap-1.5">
              <StatusBadge status={resource.status} size="sm" className="bg-white/95 shadow-xs pointer-events-none" />
              <button
                type="button"
                onClick={handleToggleFavorite}
                className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-red-500 flex items-center justify-center shadow-xs transition-colors"
                title={isFavorite ? 'Remove from saved favorites' : 'Save to favorites'}
                aria-label={isFavorite ? 'Remove from saved favorites' : 'Save to favorites'}
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Availability schedule badge */}
          <div className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/95 text-[#16834A] border border-emerald-200 text-[10px] font-medium shadow-xs pointer-events-none">
            <Clock className="w-3 h-3" />
            <span>{resource.availabilityText || 'Available'}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-2.5">
          {/* Title & Short description */}
          <div>
            <Link
              to={`/dashboard/resources/${resource._id}`}
              onClick={handleCardClick}
              className="text-sm font-semibold text-[#172033] hover:text-[#1769D2] transition-colors line-clamp-1"
            >
              {resource.name}
            </Link>
            <p className="text-xs text-[#64748B] line-clamp-2 mt-1 leading-relaxed">
              {resource.description || 'Specialized institutional apparatus for research, testing, and computational experiments.'}
            </p>
          </div>

          {/* Institution & Campus Location */}
          <div className="space-y-1 text-xs text-[#64748B] pt-1">
            <div className="flex items-center gap-1.5 truncate">
              <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{resource.institution}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{resource.location}</span>
            </div>
          </div>

          {/* Custodian & Approval Policy */}
          <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
            <span className="truncate flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              {resource.ownerName}
            </span>
            <span className={`font-medium ${resource.approvalRequired ? 'text-[#D97706]' : 'text-[#16834A]'}`}>
              {resource.approvalRequired ? 'Approval Required' : 'Direct Booking'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 pt-0 flex items-center gap-2">
        <Link
          to={`/dashboard/resources/${resource._id}`}
          className="flex-1 py-1.5 px-3 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] text-white font-medium text-xs text-center transition-colors flex items-center justify-center gap-1"
        >
          <span>View Details</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
        {onQuickBook && (
          <button
            type="button"
            onClick={() => onQuickBook(resource)}
            className="py-1.5 px-3 rounded-lg bg-white hover:bg-slate-50 text-[#172033] font-medium text-xs border border-[#E2E8F0] shadow-xs transition-colors"
          >
            Reserve
          </button>
        )}
      </div>
    </div>
  );
};

export default ResourceCard;
