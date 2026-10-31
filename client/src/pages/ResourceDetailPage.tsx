import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getResourceByIdApi } from '../api/resource.api';
import { Resource } from '../types/resource';
import { BookingModal } from '../components/resources/BookingModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
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
  Mail,
  Award,
  BookOpen,
  FileCheck,
  Info,
  ChevronRight,
} from 'lucide-react';

export const ResourceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Selected date & timeslot for availability calendar
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('Nov 03');
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
      <div className="p-8 text-center space-y-4 max-w-md mx-auto bg-white rounded-xl border border-[#E2E8F0] shadow-sm my-12">
        <AlertTriangle className="w-12 h-12 text-[#D97706] mx-auto" />
        <h2 className="text-xl font-bold text-[#172033]">Resource Not Found</h2>
        <p className="text-xs text-[#64748B]">
          The requested equipment may have been decommissioned or moved to an offline maintenance bay.
        </p>
        <button
          onClick={() => navigate('/dashboard/explore')}
          className="px-4 py-2 rounded-lg bg-[#1769D2] text-white text-xs font-semibold hover:bg-[#1256B0]"
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
    <div className="space-y-6">
      {/* Back button & breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/explore')}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-medium text-[#172033] hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Explore</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
          <Link to="/dashboard" className="hover:text-[#172033]">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
          <Link to="/dashboard/explore" className="hover:text-[#172033]">Resources</Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
          <span className="text-[#172033] font-medium truncate max-w-[200px]">{resource.name}</span>
        </div>
      </div>

      {/* Main Grid: Gallery & Primary Meta */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Image Gallery & Details */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Hero Image */}
          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-white border border-[#E2E8F0] shadow-sm">
            <motion.img
              key={selectedImageIndex}
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              src={galleryImages[selectedImageIndex]}
              alt={resource.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/95 text-[#1769D2] border border-[#E2E8F0] shadow-sm uppercase tracking-wider">
                {resource.category}
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-[#16834A] border border-emerald-200 shadow-sm">
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
                  className={`w-20 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-[#1769D2] ring-2 ring-[#1769D2]/20'
                      : 'border-[#E2E8F0] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Description Section */}
          <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-[#172033] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#1769D2]" />
              Detailed Resource Description
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              {resource.description}
            </p>
          </div>

          {/* Specifications Table */}
          <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[#172033] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#1769D2]" />
              Technical Specifications & System Attributes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {resource.specifications &&
                Object.entries(resource.specifications).map(([key, val]) => (
                  <div key={key} className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[10px] uppercase font-semibold text-[#64748B] block">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="font-semibold text-[#172033] mt-0.5 block">{String(val)}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Usage Instructions */}
          {resource.usageInstructions && resource.usageInstructions.length > 0 && (
            <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-[#172033] flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#16834A]" />
                Standard Operating & Usage Instructions
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-xs text-[#64748B]">
                {resource.usageInstructions.map((step, idx) => (
                  <li key={idx} className="pl-1 leading-relaxed">
                    <span className="text-[#172033] font-medium">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Safety Instructions */}
          {resource.safetyInstructions && resource.safetyInstructions.length > 0 && (
            <div className="p-6 rounded-xl bg-red-50/50 border border-red-200 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-[#DC2626] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                Mandatory Safety Protocols & Hazards
              </h3>
              <ul className="space-y-2 text-xs text-[#172033]">
                {resource.safetyInstructions.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] mt-1.5 shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Booking Conditions */}
          {resource.bookingConditions && resource.bookingConditions.length > 0 && (
            <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-[#172033] flex items-center gap-2">
                <Info className="w-4 h-4 text-[#1769D2]" />
                Institutional Booking Conditions & Policies
              </h3>
              <ul className="space-y-2 text-xs text-[#64748B]">
                {resource.bookingConditions.map((cond, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1769D2] mt-0.5 shrink-0" />
                    <span className="text-[#172033]">{cond}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Col: Booking Card, Calendar, Owner Info & Eligibility */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Action Reservation Card */}
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-5 sticky top-20">
            <div>
              <span className="text-xs font-semibold text-[#1769D2] uppercase tracking-wider">
                {resource.resourceType}
              </span>
              <h1 className="text-xl font-bold text-[#172033] mt-1">
                {resource.name}
              </h1>
              <p className="text-xs text-[#64748B] mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#64748B]" />
                {resource.location}
              </p>
              <p className="text-xs text-[#64748B] flex items-center gap-1.5 mt-0.5">
                <Building className="w-3.5 h-3.5 text-[#64748B]" />
                {resource.institution}
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
              <div>
                <span className="text-[10px] text-[#64748B] uppercase font-semibold">Approval Model</span>
                <p className="font-semibold text-[#172033] mt-0.5">
                  {resource.approvalRequired ? 'Custodian Review' : 'Instant Booking'}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] uppercase font-semibold">Estimated Value</span>
                <p className="font-semibold text-[#16834A] mt-0.5">
                  ₹{resource.hourlyValueEstimated || 450} / hour
                </p>
              </div>
            </div>

            {/* Interactive Availability Calendar */}
            <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#1769D2]" />
                  Availability Calendar
                </h4>
                <span className="text-[11px] text-[#1769D2] font-medium">{resource.availabilityText}</span>
              </div>

              {/* Day selection */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {calendarDays.map((d, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedCalendarDate(d.date)}
                    className={`p-2 rounded-lg text-center border transition-all ${
                      selectedCalendarDate === d.date
                        ? 'bg-[#1769D2] text-white border-[#1769D2] shadow-sm'
                        : d.status === 'Maintenance'
                        ? 'bg-red-50 text-red-300 border-red-100 cursor-not-allowed'
                        : 'bg-white hover:bg-slate-50 text-[#172033] border-[#E2E8F0]'
                    }`}
                  >
                    <span className="block text-[10px] uppercase font-semibold text-[#64748B]">
                      {d.day}
                    </span>
                    <span className="block text-xs font-bold mt-0.5">{d.date.split(' ')[1]}</span>
                  </button>
                ))}
              </div>

              {/* Timeslot selection */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] text-[#64748B] font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#1769D2]" /> Select Preferred Timeslot:
                </span>
                <div className="space-y-1.5">
                  {timeSlots.map((ts, idx) => (
                    <button
                      key={idx}
                      disabled={!ts.available}
                      onClick={() => setSelectedTimeSlot(ts.time)}
                      className={`w-full p-2.5 rounded-lg text-left border flex items-center justify-between text-xs transition-all ${
                        selectedTimeSlot === ts.time
                          ? 'bg-[#EFF6FF] border-[#1769D2] text-[#1769D2] font-semibold'
                          : ts.available
                          ? 'bg-white hover:bg-slate-50 text-[#172033] border-[#E2E8F0]'
                          : 'bg-slate-50 text-[#64748B] border-slate-200 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <span>{ts.time}</span>
                      <span className={`text-[10px] font-semibold ${ts.available ? 'text-[#16834A]' : 'text-[#64748B]'}`}>
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
              className="w-full py-3 px-4 rounded-xl bg-[#1769D2] hover:bg-[#1256B0] text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Request Resource Reservation</span>
            </button>

            {/* Eligibility & Training Requirements Box */}
            <div className="space-y-2 pt-4 border-t border-[#E2E8F0] text-xs">
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1769D2]" />
                  Eligibility Requirement
                </span>
                <p className="text-[#172033] font-medium">{resource.eligibility}</p>
              </div>

              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-[#D97706]" />
                  Training Prerequisite
                </span>
                <p className="text-[#172033] font-medium">{resource.trainingRequired}</p>
              </div>
            </div>

            {/* Owner / Lab Custodian Info Card */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20 flex items-center justify-center font-bold text-sm shrink-0">
                  {resource.ownerAvatar ? (
                    <img src={resource.ownerAvatar} alt={resource.ownerName} className="w-full h-full rounded-lg object-cover" />
                  ) : (
                    resource.ownerName.charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-semibold text-[#64748B] block">Verified Lab Custodian</span>
                  <p className="font-semibold text-[#172033] text-xs truncate">{resource.ownerName}</p>
                  <p className="text-[11px] text-[#64748B] truncate">{resource.ownerDepartment}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
                <span className="flex items-center gap-1 text-[11px]">
                  <Mail className="w-3.5 h-3.5 text-[#64748B]" />
                  {resource.ownerEmail}
                </span>
                <span className="text-[#16834A] font-semibold text-[11px]">Active Custodian</span>
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
