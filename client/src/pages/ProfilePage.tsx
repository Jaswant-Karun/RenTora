import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { Building, Mail, Phone, ShieldCheck, User } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
        <h1 className="text-xl font-bold text-[#172033] tracking-tight">Institutional Profile</h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          Your verified credentials across the RENTORA federated university network.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#EFF6FF] text-[#1769D2] border border-blue-200 flex items-center justify-center font-bold text-xl">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              user.name.charAt(0)
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#172033]">{user.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge role={user.role} size="sm" />
              <span className="text-xs text-[#16834A] font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Academic Member
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#E2E8F0] text-xs">
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] uppercase font-semibold text-[#64748B] flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Institutional Email
            </span>
            <p className="font-medium text-[#172033]">{user.email}</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] uppercase font-semibold text-[#64748B] flex items-center gap-1">
              <Building className="w-3.5 h-3.5" /> University / Institution
            </span>
            <p className="font-medium text-[#172033]">{user.institution}</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] uppercase font-semibold text-[#64748B] flex items-center gap-1">
              <Building className="w-3.5 h-3.5" /> Department / Laboratory
            </span>
            <p className="font-medium text-[#172033]">{user.department || 'General Faculty'}</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] uppercase font-semibold text-[#64748B] flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Contact Number
            </span>
            <p className="font-medium text-[#172033]">{user.phone || '+91 98765 43210'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
