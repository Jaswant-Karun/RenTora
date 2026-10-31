import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { addOwnerResourceApi } from '../../api/owner.api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import {
  PlusCircle,
  Building,
  MapPin,
  Clock,
  Layers,
  ShieldAlert,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
  Sparkles,
  Info,
} from 'lucide-react';

const CATEGORIES = [
  'Laboratories',
  'Classrooms',
  'Meeting Rooms',
  'Computers',
  'Cameras',
  '3D Printers',
  'Electronics Equipment',
  'Testing Instruments',
  'Workshop Tools',
  'Other Resources',
];

export const AddResourcePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Laboratories');
  const [description, setDescription] = useState('');
  const [institution, setInstitution] = useState(user?.institution || 'National Institute of Technology');
  const [location, setLocation] = useState('');
  const [resourceType, setResourceType] = useState('Lab Equipment');
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  ]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Availability & Duration
  const [availabilitySchedule, setAvailabilitySchedule] = useState('Monday - Friday (09:00 - 18:00)');
  const [minBookingDuration, setMinBookingDuration] = useState('1 hour');
  const [maxBookingDuration, setMaxBookingDuration] = useState('4 hours');

  // Governance & Safety
  const [eligibility, setEligibility] = useState('All Enrolled Students & Faculty');
  const [trainingRequired, setTrainingRequired] = useState('Basic Lab Safety Induction');
  const [supervisionRequirement, setSupervisionRequirement] = useState('Self-Operated after training clearance');
  const [depositConditions, setDepositConditions] = useState('None');
  const [approvalRequired, setApprovalRequired] = useState(true);

  // Specifications key-value pairs
  const [specList, setSpecList] = useState<{ key: string; value: string }[]>([
    { key: 'ModelNumber', value: '' },
    { key: 'Manufacturer', value: '' },
  ]);

  // Safety instructions list
  const [safetyList, setSafetyList] = useState<string[]>([
    'Mandatory ANSI Z87.1 approved eye protection.',
    'Closed-toe footwear required at all times.',
  ]);
  const [newSafetyRule, setNewSafetyRule] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAddSpec = () => {
    setSpecList([...specList, { key: '', value: '' }]);
  };

  const handleRemoveSpec = (idx: number) => {
    setSpecList(specList.filter((_, i) => i !== idx));
  };

  const handleSpecChange = (idx: number, field: 'key' | 'value', val: string) => {
    const updated = [...specList];
    updated[idx][field] = val;
    setSpecList(updated);
  };

  const handleAddImage = () => {
    if (imageUrlInput.trim() && imageUrlInput.startsWith('http')) {
      setImages([...images, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const handleAddSafetyRule = () => {
    if (newSafetyRule.trim()) {
      setSafetyList([...safetyList, newSafetyRule.trim()]);
      setNewSafetyRule('');
    }
  };

  const handleRemoveSafetyRule = (idx: number) => {
    setSafetyList(safetyList.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !location.trim()) {
      setError('Please provide Resource Name, Description, and Location.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Convert spec list to record
      const specifications: Record<string, string> = {};
      specList.forEach((s) => {
        if (s.key.trim() && s.value.trim()) {
          specifications[s.key.trim()] = s.value.trim();
        }
      });

      const payload = {
        name: name.trim(),
        category,
        description: description.trim(),
        institution: institution.trim(),
        location: location.trim(),
        resourceType,
        images,
        availabilitySchedule,
        minBookingDuration,
        maxBookingDuration,
        eligibility,
        trainingRequired,
        safetyInstructions: safetyList,
        supervisionRequirement,
        depositConditions,
        approvalRequired,
        specifications,
      };

      const res = await addOwnerResourceApi(payload);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/owner/resources');
        }, 1200);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to catalogue new resource.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30 text-[10px] font-bold uppercase tracking-wider">
          <PlusCircle className="w-3.5 h-3.5" />
          Asset Induction Form
        </div>
        <h1 className="text-2xl font-extrabold text-white">Catalogue New Institutional Resource</h1>
        <p className="text-xs text-slate-400">
          List underutilized laboratory bays, high-end scientific hardware, and computing nodes to the shared campus federation.
        </p>
      </div>

      {success && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Resource published successfully! Redirecting to your resource console...</span>
        </motion.div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Identifiers */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-400" />
            Basic Identifiers & Classification
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Resource Name"
              placeholder="e.g. Field Emission Scanning Electron Microscope (FE-SEM)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 rounded-xl border border-slate-700/80 p-2.5 text-xs focus:outline-none focus:border-brand-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Institution"
              placeholder="e.g. National Institute of Technology"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              leftIcon={<Building className="w-4 h-4" />}
              required
            />

            <Input
              label="Campus Location"
              placeholder="e.g. Materials Block, Room 204"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              leftIcon={<MapPin className="w-4 h-4" />}
              required
            />

            <Input
              label="Resource Type"
              placeholder="e.g. Precision Analytical Instrument"
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Comprehensive Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Detail instrument capabilities, supported sample formats, operational parameters..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 rounded-xl border border-slate-700/80 p-3 text-xs focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>
        </Card>

        {/* Section 2: Technical Specifications Builder */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Technical Specifications (Key - Value Pairs)
            </h3>
            <button
              type="button"
              onClick={handleAddSpec}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Attribute
            </button>
          </div>

          <div className="space-y-2">
            {specList.map((spec, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Specification Name (e.g. Magnification, Laser Power)"
                  value={spec.key}
                  onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                  className="flex-1 bg-slate-950 text-slate-100 rounded-xl border border-slate-700/80 p-2 text-xs focus:outline-none focus:border-brand-500"
                />
                <input
                  type="text"
                  placeholder="Specification Value (e.g. 500,000x, 400W)"
                  value={spec.value}
                  onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                  className="flex-1 bg-slate-950 text-slate-100 rounded-xl border border-slate-700/80 p-2 text-xs focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpec(idx)}
                  className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Section 3: Image Gallery Management */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-brand-400" />
            Equipment Photographs & Gallery
          </h3>

          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="Paste direct image URL (https://...)"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              className="flex-1 bg-slate-950 text-slate-100 rounded-xl border border-slate-700/80 p-2 text-xs focus:outline-none focus:border-brand-500"
            />
            <Button type="button" size="sm" onClick={handleAddImage}>
              Add Photo
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-[16/10] rounded-xl overflow-hidden border border-slate-800 group">
                <img src={img} alt="Resource" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-md bg-slate-950/80 text-rose-400 hover:text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Section 4: Availability Schedule & Durations */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Availability Schedule & Booking Windows
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Availability Schedule"
              placeholder="e.g. Mon - Fri (09:00 - 18:00)"
              value={availabilitySchedule}
              onChange={(e) => setAvailabilitySchedule(e.target.value)}
            />

            <Input
              label="Minimum Booking Duration"
              placeholder="e.g. 1 hour, 30 mins"
              value={minBookingDuration}
              onChange={(e) => setMinBookingDuration(e.target.value)}
            />

            <Input
              label="Maximum Booking Duration"
              placeholder="e.g. 4 hours, 8 hours"
              value={maxBookingDuration}
              onChange={(e) => setMaxBookingDuration(e.target.value)}
            />
          </div>
        </Card>

        {/* Section 5: Governance, Safety, Supervision & Deposit */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Governance, Safety Instructions & Supervision
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Eligibility Requirements"
              placeholder="e.g. Certified M.Tech & Ph.D. Researchers"
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value)}
            />

            <Input
              label="Training Prerequisites"
              placeholder="e.g. Class 4 Laser Safety Induction"
              value={trainingRequired}
              onChange={(e) => setTrainingRequired(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Supervision Requirement
              </label>
              <select
                value={supervisionRequirement}
                onChange={(e) => setSupervisionRequirement(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 rounded-xl border border-slate-700/80 p-2.5 text-xs focus:outline-none focus:border-brand-500"
              >
                <option value="Self-Operated after training clearance">Self-Operated after training clearance</option>
                <option value="Mandatory Lab Assistant Present">Mandatory Lab Assistant Present</option>
                <option value="Faculty Supervision Required">Faculty Supervision Required</option>
                <option value="Operator Hands-Off (Technician runs test)">Operator Hands-Off (Technician runs test)</option>
              </select>
            </div>

            <Input
              label="Deposit or Usage Conditions"
              placeholder="e.g. None / ₹2,000 security deposit for microtools"
              value={depositConditions}
              onChange={(e) => setDepositConditions(e.target.value)}
            />
          </div>

          {/* Safety instructions builder */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Mandatory Safety Instructions
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add safety condition (e.g. Wear thermal gloves when opening chamber)..."
                value={newSafetyRule}
                onChange={(e) => setNewSafetyRule(e.target.value)}
                className="flex-1 bg-slate-950 text-slate-100 rounded-xl border border-slate-700/80 p-2 text-xs focus:outline-none focus:border-brand-500"
              />
              <Button type="button" size="sm" onClick={handleAddSafetyRule}>
                Add Rule
              </Button>
            </div>

            <ul className="space-y-1.5 pt-1">
              {safetyList.map((rule, idx) => (
                <li key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-950 text-xs text-slate-300 border border-slate-800">
                  <span>• {rule}</span>
                  <button type="button" onClick={() => handleRemoveSafetyRule(idx)} className="text-slate-500 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Approval Requirement Toggle */}
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-center space-x-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={approvalRequired}
                onChange={(e) => setApprovalRequired(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 bg-slate-950 border-slate-700"
              />
              <div>
                <span className="text-xs font-bold text-white block">Require Custodian Manual Approval</span>
                <span className="text-[11px] text-slate-400">
                  When enabled, reservations are held in pending queue until you review and approve user eligibility.
                </span>
              </div>
            </label>
          </div>
        </Card>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={() => navigate('/owner/resources')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="lg" isLoading={loading}>
            Catalogue & Publish Resource
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddResourcePage;
