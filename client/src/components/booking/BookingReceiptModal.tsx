import React, { useState, useEffect } from 'react';
import { Booking } from '../../types/resource';
import { StatusBadge } from '../common/StatusBadge';
import { getTrustPassTokenApi } from '../../api/trustpass.api';
import {
  Printer,
  Download,
  X,
  Building,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  QrCode,
  FileText,
  User,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  KeyRound,
} from 'lucide-react';

interface BookingReceiptModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingReceiptModal: React.FC<BookingReceiptModalProps> = ({
  booking,
  isOpen,
  onClose,
}) => {
  const [tokenData, setTokenData] = useState<{
    token: string;
    qrPayload: string;
    expiresAt: string;
    isValid: boolean;
  } | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    if (isOpen && booking && (booking.status === 'approved' || booking.status === 'checked_in')) {
      let isMounted = true;
      setTokenLoading(true);
      getTrustPassTokenApi(booking._id)
        .then((res) => {
          if (isMounted && res.data) {
            setTokenData(res.data);
          }
        })
        .catch((err) => {
          console.warn('TrustPass token fetch notice:', err?.response?.data?.message || err.message);
        })
        .finally(() => {
          if (isMounted) setTokenLoading(false);
        });
      return () => {
        isMounted = false;
      };
    } else {
      setTokenData(null);
    }
  }, [isOpen, booking]);

  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyToken = () => {
    if (tokenData?.token) {
      navigator.clipboard.writeText(tokenData.token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const bookingCode = `REN-${booking._id.slice(-6).toUpperCase()}`;
  const qrDisplayData = tokenData?.qrPayload || tokenData?.token || `REN-PASS:${booking._id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=2&data=${encodeURIComponent(
    qrDisplayData
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-white border border-[#E2E8F0] shadow-2xl rounded-2xl overflow-hidden my-8">
        {/* Modal Toolbar (hidden during print) */}
        <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#1769D2]" />
            <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Official Reservation Receipt
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Pass Container */}
        <div className="p-6 sm:p-8 space-y-6 printable-receipt text-[#172033]">
          {/* Header Banner */}
          <div className="flex items-start justify-between pb-4 border-b-2 border-[#1769D2]">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#1769D2] text-white flex items-center justify-center font-bold text-xs">
                  R
                </div>
                <span className="font-extrabold text-lg tracking-tight text-[#172033]">
                  RENTORA
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Smart Institutional Resource Sharing & Research Consortium
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                PASS: {bookingCode}
              </span>
              <p className="text-[10px] text-[#64748B] mt-0.5">
                Issued: {new Date(booking.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Asset & Booking Summary */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#1769D2] tracking-wider">
                  {booking.resourceCategory || 'Institutional Resource'}
                </span>
                <h2 className="text-base font-bold text-[#172033] mt-0.5">
                  {booking.resourceName}
                </h2>
                <p className="text-xs text-[#64748B] flex items-center gap-1 mt-1">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {booking.institution}
                </p>
                <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {booking.resourceLocation || 'Main Campus Facility'}
                </p>
              </div>

              <div className="text-right shrink-0">
                <StatusBadge status={booking.status} size="sm" />
                <p className="text-[10px] text-[#16834A] font-semibold mt-1">
                  Verified Authorization
                </p>
              </div>
            </div>
          </div>

          {/* Schedule & Duration Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-[#E2E8F0]">
              <span className="text-[10px] uppercase font-semibold text-[#64748B] block">
                Session Date
              </span>
              <span className="font-bold text-[#172033] mt-0.5 block flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#1769D2]" />
                {booking.date}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-[#E2E8F0]">
              <span className="text-[10px] uppercase font-semibold text-[#64748B] block">
                Reserved Slot
              </span>
              <span className="font-bold text-[#172033] mt-0.5 block flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#1769D2]" />
                {booking.timeSlot}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-[#E2E8F0] col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-semibold text-[#64748B] block">
                Check-in Status
              </span>
              <span className="font-bold text-[#172033] mt-0.5 block">
                {booking.checkedIn ? (
                  <span className="text-[#16834A] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
                  </span>
                ) : (
                  <span className="text-[#D97706]">Gate Pass Ready</span>
                )}
              </span>
            </div>
          </div>

          {/* Borrower Identification */}
          <div className="p-4 rounded-xl border border-[#E2E8F0] space-y-2 text-xs">
            <h4 className="text-[11px] font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#1769D2]" />
              Authorized Borrower Credentials
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#64748B] pt-1">
              <div>
                <span className="text-[10px] block">Full Name:</span>
                <span className="font-semibold text-[#172033]">{booking.userName}</span>
              </div>
              <div>
                <span className="text-[10px] block">Institutional Email:</span>
                <span className="font-semibold text-[#172033]">{booking.userEmail}</span>
              </div>
              {booking.supervisorName && (
                <div className="sm:col-span-2">
                  <span className="text-[10px] block">Supervisor / Principal Investigator:</span>
                  <span className="font-semibold text-[#172033]">{booking.supervisorName}</span>
                </div>
              )}
              {booking.purpose && (
                <div className="sm:col-span-2 pt-1 border-t border-slate-100">
                  <span className="text-[10px] block">Research Purpose:</span>
                  <span className="text-[#172033]">{booking.purpose}</span>
                </div>
              )}
            </div>
          </div>

          {/* Verification QR / Security Seal */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] text-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-800">
                <QrCode className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#172033] block">
                  DIGITAL LAB ACCESS TOKEN
                </span>
                <span className="text-[10px] text-[#64748B] block font-mono">
                  {booking._id}
                </span>
                <span className="text-[9px] text-[#16834A] font-semibold block">
                  Valid for facility entry & custodian scan
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16834A] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                VERIFIED PASS
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (hidden during print) */}
        <div className="p-4 bg-slate-50 border-t border-[#E2E8F0] flex justify-end gap-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-100 text-[#172033] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close Receipt
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
