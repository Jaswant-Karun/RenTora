import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getResourceByIdApi } from '../../api/resource.api';
import { Resource } from '../../types/resource';
import { BookingModal } from '../../components/resources/BookingModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  ArrowLeft,
  Building,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  User,
  Mail,
  Award,
  BookOpen,
  FileCheck,
  Info,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const ResourceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Selected date & timeslot for availability calendar
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('2026-11-03');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:00 AM - 12:00 PM');

  useEffect(() => {
    if (!id) return;
    const fetchResource = async () => {
      setLoading(true);
      try {
        const res = await getResourceByIdApi(id);
        if (res.success && res.data) {
          setResource(res.data);
        }
      } catch (err) {
        console.error('Error fetching resource details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResource();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 flex justify-center items-center">
        <LoadingSpinner message="Retrieving resource telemetry and specifications..." size="lg" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Resource Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested equipment may have been decommissioned or moved to an offline maintenance bay.
        </p>
        <button
          onClick={() => navigate('/dashboard/explore')}
          className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  const galleryImages = resource.images?.length > 0 ? resource.images : [
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  ];

  const calendarDays = [
    { day: 'Mon', date: 'Nov 02', status: 'Available' },
    { day: 'Tue', date: 'Nov 03', status: 'Selected' },
    { day: 'Wed', date: 'Nov 04', status: 'Available' },
    { day: 'Thu', date: 'Nov 05', status: 'Available' },
    { day: 'Fri', date: 'Nov 06', status: 'Available' },
    { day: 'Sat', date: 'Nov 07', status: 'Maintenance' },
    { day: 'Sun', date: 'Nov 08', status: 'Reserved' },
  ];

  const timeSlots = [
    { time: '09:00 AM - 11:00 AM', label: 'Morning Slot 1', available: true },
    { time: '11:00 AM - 01:00 PM', label: 'Morning Slot 2', available: true },
    { time: '02:00 PM - 04:00 PM', label: 'Afternoon Slot 1', available: true },
    { time: '04:00 PM - 06:00 PM', label: 'Evening Slot 2', available: false },
    { time: '06:00 PM - 08:00 PM', label: 'Night Extended', available: true },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Back button & breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/explore')}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Explore</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Link to="/dashboard" className="hover:text-white">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <Link to="/dashboard/explore" className="hover:text-white">Resources</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-200 font-semibold truncate max-w-[200px]">{resource.name}</span>
        </div>
      </div>

      {/* Main Grid: Gallery & Primary Meta */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Hero Image */}
          <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
            <motion.img
              key={selectedImageIndex}
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              src={galleryImages[selectedImageIndex]}
              alt={resource.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-950/90 text-brand-300 border border-brand-500/30 backdrop-blur-md uppercase tracking-wider">
                {resource.category}
              </span>
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
                {resource.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Thumbnails Row */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-brand-500 ring-2 ring-brand-500/30 scale-105'
                      : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Description Section */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-400" />
              Detailed Resource Description
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {resource.description}
            </p>
          </div>

          {/* Specifications Table */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              Technical Specifications & System Attributes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {resource.specifications &&
                Object.entries(resource.specifications).map(([key, val]) => (
                  <div key={key} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{String(val)}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Usage Instructions */}
          {resource.usageInstructions && resource.usageInstructions.length > 0 && (
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                Standard Operating & Usage Instructions
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300">
                {resource.usageInstructions.map((step, idx) => (
                  <li key={idx} className="pl-1 leading-relaxed">
                    <span className="font-medium text-slate-200">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Safety Instructions */}
          {resource.safetyInstructions && resource.safetyInstructions.length > 0 && (
            <div className="p-6 rounded-3xl bg-rose-500/5 border border-rose-500/20 shadow-xl space-y-3">
              <h3 className="text-base font-extrabold text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Mandatory Safety Protocols & Hazards
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {resource.safetyInstructions.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Booking Conditions */}
          {resource.bookingConditions && resource.bookingConditions.length > 0 && (
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400" />
                Institutional Booking Conditions & Policies
              </h3>
              <ul className="space-y-2 text-xs text-slate-400">
                {resource.bookingConditions.map((cond, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 mt-0.5 shrink-0" />
                    <span>{cond}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Col: Booking Card, Calendar, Owner Info & Eligibility */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Action Reservation Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-brand-500/30 shadow-2xl space-y-5 sticky top-20">
            <div>
              <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">
                {resource.resourceType}
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                {resource.name}
              </h1>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {resource.location}
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                {resource.institution}
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Approval Model</span>
                <p className="font-bold text-slate-200 mt-0.5">
                  {resource.approvalRequired ? 'Faculty Endorsement' : 'Instant Direct Booking'}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Estimated Value</span>
                <p className="font-bold text-emerald-400 mt-0.5">
                  ₹{resource.hourlyValueEstimated || 450} / hour equivalent
                </p>
              </div>
            </div>

            {/* Interactive Availability Calendar */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-400" />
                  Availability Calendar
                </h4>
                <span className="text-[11px] text-brand-400 font-semibold">{resource.availabilityText}</span>
              </div>

              {/* Day selection */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {calendarDays.map((d, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedCalendarDate(d.date)}
                    className={`p-2 rounded-xl text-center border transition-all ${
                      selectedCalendarDate === d.date
                        ? 'bg-brand-600 text-white border-brand-500 shadow-md'
                        : d.status === 'Maintenance'
                        ? 'bg-rose-950/20 text-rose-400/60 border-rose-900/30 cursor-not-allowed'
                        : 'bg-slate-950 hover:bg-slate-850 text-slate-300 border-slate-800'
                    }`}
                  >
                    <span className="block text-[10px] uppercase font-bold text-slate-400">
                      {d.day}
                    </span>
                    <span className="block text-xs font-extrabold mt-0.5">{d.date.split(' ')[1]}</span>
                  </button>
                ))}
              </div>

              {/* Timeslot selection */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Select Preferred Timeslot:
                </span>
                <div className="space-y-1.5">
                  {timeSlots.map((ts, idx) => (
                    <button
                      key={idx}
                      disabled={!ts.available}
                      onClick={() => setSelectedTimeSlot(ts.time)}
                      className={`w-full p-2.5 rounded-xl text-left border flex items-center justify-between text-xs transition-all ${
                        selectedTimeSlot === ts.time
                          ? 'bg-brand-600/15 border-brand-500 text-white ring-1 ring-brand-500'
                          : ts.available
                          ? 'bg-slate-950 hover:bg-slate-850 text-slate-300 border-slate-800'
                          : 'bg-slate-950/50 text-slate-600 border-slate-900 cursor-not-allowed'
                      }`}
                    >
                      <span className="font-semibold">{ts.time}</span>
                      <span className={`text-[10px] font-bold ${ts.available ? 'text-emerald-400' : 'text-slate-600'}`}>
                        {ts.available ? 'Available' : 'Booked'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Request Resource Primary Button */}
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-extrabold text-sm shadow-xl shadow-brand-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Calendar className="w-4 h-4" />
              <span>Request Resource Reservation</span>
            </button>

            {/* Eligibility & Training Requirements Box */}
            <div className="space-y-2 pt-4 border-t border-slate-800 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
                  Eligibility Requirement
                </span>
                <p className="text-slate-200 font-semibold">{resource.eligibility}</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Training Prerequisite
                </span>
                <p className="text-slate-200 font-semibold">{resource.trainingRequired}</p>
              </div>
            </div>

            {/* Owner / Lab Custodian Info Card */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center font-bold text-white text-base shrink-0 shadow-md">
                  {resource.ownerAvatar ? (
                    <img src={resource.ownerAvatar} alt={resource.ownerName} className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    resource.ownerName.charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Verified Lab Custodian</span>
                  <p className="font-extrabold text-white text-sm truncate">{resource.ownerName}</p>
                  <p className="text-xs text-slate-400 truncate">{resource.ownerDepartment}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {resource.ownerEmail}
                </span>
                <span className="text-emerald-400 font-semibold text-[11px]">Active Custodian</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        resource={resource}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={() => {
          navigate('/dashboard/bookings');
        }}
      />
    </div>
  );
};

export default ResourceDetailPage;
