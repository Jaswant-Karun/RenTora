import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getBookingsApi, cancelBookingApi } from '../api/booking.api';
import { Booking } from '../types/resource';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';
import { BookingTimeline } from '../components/booking/BookingTimeline';
import { UserCheckInOutModal } from '../components/booking/UserCheckInOutModal';
import { IncidentReportModal } from '../components/incident/IncidentReportModal';
import { BookingReceiptModal } from '../components/booking/BookingReceiptModal';
import { TableRowSkeleton } from '../components/common/SkeletonLoader';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useToast } from '../context/ToastContext';
import {
  CalendarCheck,
  Clock,
  Building,
  CheckCircle2,
  XCircle,
  Calendar,
  Compass,
  ArrowRight,
  Search,
  Filter,
  QrCode,
  LogOut,
  AlertTriangle,
  History,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Printer,
  Download,
  ClipboardCheck,
  ShieldCheck,
} from 'lucide-react';
import { FairShareExplanationModal } from '../components/fairshare/FairShareExplanationModal';

export const MyBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'date' | 'resourceName'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected booking for drawer / modal
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);
  const [selectedBookingForHandover, setSelectedBookingForHandover] = useState<Booking | null>(null);
  const [selectedIncidentBooking, setSelectedIncidentBooking] = useState<Booking | null>(null);
  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null);
  const [fairShareModalBooking, setFairShareModalBooking] = useState<Booking | null>(null);
  const [handoverMode, setHandoverMode] = useState<'check_in' | 'return'>('check_in');

  // Cancel Modal State
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await getBookingsApi(statusFilter !== 'all' ? statusFilter : undefined);
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleOpenCancelModal = (id: string) => {
    setCancelBookingId(id);
    setCancelReason('');
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelBookingId || !cancelReason.trim()) return;

    setCancelling(true);
    try {
      const res = await cancelBookingApi(cancelBookingId, cancelReason.trim());
      if (res.success) {
        setCancelBookingId(null);
        toast.success('Reservation cancelled successfully. Slot freed for waiting peers.');
        await fetchBookings();
      } else {
        toast.error('Unable to cancel booking: ' + (res.message || 'Server error'));
      }
    } catch (err: any) {
      console.error('Error cancelling reservation:', err);
      toast.error(err.response?.data?.message || 'Error cancelling reservation');
    } finally {
      setCancelling(false);
    }
  };

  // Filtered & Sorted bookings
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        if (!searchTerm.trim()) return true;
        const query = searchTerm.toLowerCase();
        return (
          b.resourceName.toLowerCase().includes(query) ||
          b.userName?.toLowerCase().includes(query) ||
          b.institution?.toLowerCase().includes(query) ||
          b.date.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (sortField === 'resourceName') {
          return sortOrder === 'asc'
            ? a.resourceName.localeCompare(b.resourceName)
            : b.resourceName.localeCompare(a.resourceName);
        }
        return sortOrder === 'asc'
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [bookings, searchTerm, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage) || 1;
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#172033] tracking-tight">
            Booking Management
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Track reservation approvals, perform physical check-ins, document condition reports, and log returns.
          </p>
        </div>

        <Link
          to="/dashboard/explore"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-medium shadow-xs transition-colors shrink-0"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>New Reservation</span>
        </Link>
      </div>

      {/* 2. Search, Status Tabs & Table Toolbar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden space-y-3 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Filter Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            {[
              { key: 'all', label: 'All Bookings' },
              { key: 'approved', label: 'Approved' },
              { key: 'pending', label: 'Pending' },
              { key: 'checked_in', label: 'In Use' },
              { key: 'waitlisted', label: 'Waitlisted' },
              { key: 'completed', label: 'Completed' },
              { key: 'rejected', label: 'Rejected' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === tab.key
                    ? 'bg-[#1769D2] text-white shadow-xs font-semibold'
                    : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#172033] border border-[#E2E8F0]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-64 relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search bookings..."
              className="w-full bg-[#F8FAFC] text-[#172033] placeholder-[#94A3B8] text-xs rounded-lg pl-9 pr-3 py-1.5 border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#1769D2]"
            />
          </div>
        </div>

        {/* Professional Table */}
        <div className="overflow-x-auto border border-[#E2E8F0] rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
              <tr>
                <th className="py-2.5 px-4">Resource</th>
                <th className="py-2.5 px-4">Requester</th>
                <th className="py-2.5 px-4 cursor-pointer hover:text-[#172033]" onClick={() => {
                  setSortField('date');
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}>
                  Booking Date
                </th>
                <th className="py-2.5 px-4">Time Slot</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] bg-white">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={6} />
                ))
              ) : paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#64748B]">
                    No bookings found matching current filters.
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-[#F8FAFC] transition-colors">
                    {/* Resource Column */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={b.resourceImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'}
                          alt={b.resourceName}
                          className="w-9 h-9 rounded-lg object-cover shrink-0 border border-[#E2E8F0]"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#172033] truncate max-w-[180px]">{b.resourceName}</p>
                          <p className="text-[11px] text-[#64748B] truncate max-w-[180px]">{b.institution}</p>
                        </div>
                      </div>
                    </td>

                    {/* Requester Column */}
                    <td className="py-3 px-4">
                      <span className="font-medium text-[#172033] block">{b.userName}</span>
                      <span className="text-[10px] text-[#64748B] capitalize">{b.userRole || 'Student'}</span>
                    </td>

                    {/* Booking Date */}
                    <td className="py-3 px-4 text-[#172033] font-medium whitespace-nowrap">
                      {b.date}
                    </td>

                    {/* Time Slot */}
                    <td className="py-3 px-4 text-[#64748B] whitespace-nowrap">
                      {b.timeSlot}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={b.status} size="sm" />
                      {b.isOverdue && (
                        <span className="ml-1 text-[10px] font-bold text-[#DC2626] bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                          Overdue
                        </span>
                      )}
                    </td>

                    {/* Action Column */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Details Drawer Trigger */}
                        <button
                          type="button"
                          onClick={() => setSelectedBookingDetails(b)}
                          className="p-1.5 text-[#64748B] hover:text-[#1769D2] hover:bg-[#EFF6FF] rounded-md transition-colors"
                          title="View booking details and lifecycle timeline"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Print / Download Receipt Pass */}
                        <button
                          type="button"
                          onClick={() => setReceiptBooking(b)}
                          className="p-1.5 text-[#64748B] hover:text-[#1769D2] hover:bg-[#EFF6FF] rounded-md transition-colors"
                          title="Download / Print Official Reservation Pass"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Step 9 Check-In Action (Approved) */}
                        {b.status === 'approved' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBookingForHandover(b);
                              setHandoverMode('check_in');
                            }}
                            className="px-2.5 py-1 bg-[#1769D2] hover:bg-[#1256B0] text-white text-[11px] font-medium rounded-md shadow-xs transition-colors"
                          >
                            Check-In
                          </button>
                        )}

                        {/* Step 11 Return Initiation Action (Checked In) */}
                        {b.status === 'checked_in' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBookingForHandover(b);
                              setHandoverMode('return');
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-[#172033] border border-[#E2E8F0] text-[11px] font-medium rounded-md shadow-xs transition-colors"
                          >
                            Handback
                          </button>
                        )}

                        {/* Incident Report Trigger */}
                        {(b.status === 'checked_in' || b.status === 'completed' || b.status === 'return_pending') && (
                          <button
                            type="button"
                            onClick={() => setSelectedIncidentBooking(b)}
                            className="p-1.5 text-[#64748B] hover:text-[#D97706] hover:bg-amber-50 rounded-md transition-colors"
                            title="Report safety warning or damage incident"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Cancel Button */}
                        {(b.status === 'pending' || b.status === 'under_review' || b.status === 'waitlisted') && (
                          <button
                            type="button"
                            onClick={() => handleOpenCancelModal(b._id)}
                            className="px-2 py-1 text-[#DC2626] hover:bg-red-50 text-[11px] font-medium rounded-md transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Counter Footer */}
        <div className="flex items-center justify-between pt-2 text-xs text-[#64748B]">
          <span>
            Showing <strong className="text-[#172033]">{paginatedBookings.length}</strong> of{' '}
            <strong className="text-[#172033]">{filteredBookings.length}</strong> reservations
          </span>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-[#E2E8F0] disabled:opacity-40 hover:bg-[#F8FAFC]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs font-medium text-[#172033]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-[#E2E8F0] disabled:opacity-40 hover:bg-[#F8FAFC]"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Booking Details Drawer / Modal */}
      {selectedBookingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white border border-[#E2E8F0] shadow-xl rounded-xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedBookingDetails.resourceImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'}
                  alt={selectedBookingDetails.resourceName}
                  className="w-12 h-12 rounded-lg object-cover border border-[#E2E8F0]"
                />
                <div>
                  <h3 className="text-base font-semibold text-[#172033]">{selectedBookingDetails.resourceName}</h3>
                  <p className="text-xs text-[#64748B]">{selectedBookingDetails.institution} • {selectedBookingDetails.resourceCategory}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBookingDetails(null)}
                className="p-1 text-[#64748B] hover:text-[#172033] rounded-md hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status & Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-medium">Status</span>
                <StatusBadge status={selectedBookingDetails.status} size="sm" className="mt-1" />
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-medium">Date</span>
                <span className="font-semibold text-[#172033] block mt-1">{selectedBookingDetails.date}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-medium">Time</span>
                <span className="font-semibold text-[#172033] block mt-1">{selectedBookingDetails.timeSlot}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-medium">Borrower</span>
                <span className="font-semibold text-[#172033] block mt-1">{selectedBookingDetails.userName}</span>
              </div>
            </div>

            {/* Purpose & Project info */}
            {selectedBookingDetails.purpose && (
              <div className="space-y-1 text-xs">
                <span className="font-medium text-[#172033]">Booking Purpose</span>
                <p className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B]">
                  {selectedBookingDetails.purpose}
                </p>
              </div>
            )}

            {/* Condition Reports Inspection (Initial & Return) */}
            {(selectedBookingDetails.initialCondition || selectedBookingDetails.returnCondition) && (
              <div className="space-y-2.5 pt-2 border-t border-[#E2E8F0] text-xs">
                <span className="font-semibold text-[#172033] flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4 text-[#16834A]" />
                  Condition & Equipment Inspection Reports
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedBookingDetails.initialCondition && (
                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#1769D2] uppercase tracking-wider">
                          Check-In Inspection
                        </span>
                        <span className="text-[10px] font-semibold text-[#16834A] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {selectedBookingDetails.initialCondition.operationalStatus || 'Operational'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B]">
                        {selectedBookingDetails.initialCondition.conditionNotes || 'Inspected and certified in good condition.'}
                      </p>
                      {selectedBookingDetails.initialCondition.meterReading && (
                        <p className="text-[10px] font-mono text-slate-500">
                          Reading: {selectedBookingDetails.initialCondition.meterReading}
                        </p>
                      )}
                    </div>
                  )}

                  {selectedBookingDetails.returnCondition && (
                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#16834A] uppercase tracking-wider">
                          Return Handback Report
                        </span>
                        <span className="text-[10px] font-semibold text-[#16834A] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {selectedBookingDetails.returnCondition.operationalStatus || 'Verified'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B]">
                        {selectedBookingDetails.returnCondition.conditionNotes || 'Returned in clean, operational order.'}
                      </p>
                      {selectedBookingDetails.returnCondition.meterReading && (
                        <p className="text-[10px] font-mono text-slate-500">
                          Reading: {selectedBookingDetails.returnCondition.meterReading}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 14-Step Visual Timeline */}
            <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
              <span className="text-xs font-semibold text-[#172033] block">Lifecycle Audit Timeline</span>
              <BookingTimeline booking={selectedBookingDetails} />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => {
                  setReceiptBooking(selectedBookingDetails);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EFF6FF] hover:bg-blue-100 text-[#1769D2] text-xs font-semibold border border-blue-200 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Receipt Pass</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBookingDetails(null)}
                className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#172033] hover:bg-slate-50 text-xs font-medium rounded-lg"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Handover & Check-In / Return Condition Inspection Modal */}
      {selectedBookingForHandover && (
        <UserCheckInOutModal
          booking={selectedBookingForHandover}
          mode={handoverMode}
          isOpen={Boolean(selectedBookingForHandover)}
          onClose={() => setSelectedBookingForHandover(null)}
          onSuccess={() => {
            setSelectedBookingForHandover(null);
            fetchBookings();
          }}
        />
      )}

      {/* Incident Report Modal */}
      {selectedIncidentBooking && (
        <IncidentReportModal
          booking={selectedIncidentBooking}
          isOpen={Boolean(selectedIncidentBooking)}
          onClose={() => setSelectedIncidentBooking(null)}
          onSuccess={() => {
            setSelectedIncidentBooking(null);
            fetchBookings();
          }}
        />
      )}

      {/* Cancel Modal with Stated Reason */}
      {cancelBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-[#E2E8F0] shadow-xl rounded-xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#172033]">Cancel Reservation Request</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Please provide a mandatory stated cancellation reason.</p>
              </div>
              <button
                onClick={() => setCancelBookingId(null)}
                className="p-1 text-[#64748B] hover:text-[#172033] rounded-md hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#172033] mb-1">
                  Reason for Cancellation <span className="text-[#DC2626]">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Experiment postponed due to specimen synthesis delay."
                  rows={3}
                  required
                  className="w-full bg-[#F8FAFC] text-[#172033] text-xs rounded-lg p-3 border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#1769D2]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setCancelBookingId(null)}
                >
                  Keep Reservation
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  type="submit"
                  isLoading={cancelling}
                  disabled={!cancelReason.trim()}
                >
                  Confirm Cancellation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Booking Receipt Modal */}
      {receiptBooking && (
        <BookingReceiptModal
          booking={receiptBooking}
          isOpen={Boolean(receiptBooking)}
          onClose={() => setReceiptBooking(null)}
        />
      )}
    </div>
  );
};

export default MyBookingsPage;
