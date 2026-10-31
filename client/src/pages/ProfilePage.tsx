import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { User, Building, Mail, Phone, Calendar, ShieldCheck } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
        <h1 className="text-2xl font-extrabold text-white">Institutional Profile</h1>
        <p className="text-xs text-slate-400">
          Your verified credentials across the RENTORA federated university network.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center font-bold text-white text-2xl shadow-lg">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-2xl object-cover" />
            ) : (
              user.name.charAt(0)
            )}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">{user.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge role={user.role} />
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Institutional Member
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Email
            </span>
            <p className="font-semibold text-slate-200">{user.email}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
              <Building className="w-3.5 h-3.5" /> Institution
            </span>
            <p className="font-semibold text-slate-200">{user.institution}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
              <Building className="w-3.5 h-3.5" /> Department
            </span>
            <p className="font-semibold text-slate-200">{user.department || 'General Faculty'}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Contact
            </span>
            <p className="font-semibold text-slate-200">{user.phone || '+91 98765 43210'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
