import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Search,
  Compass,
  CalendarCheck,
  ShieldCheck,
  QrCode,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  BookOpen,
  Sparkles,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  Clock,
  Layers,
  Scale,
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  category: 'discovery' | 'booking' | 'eligibility' | 'checkin' | 'incidents';
  icon: any;
  summary: string;
  steps: { title: string; desc: string }[];
  faqs: { q: string; a: string }[];
  actionLink?: { label: string; to: string };
}

export const HelpSupportPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedSection, setExpandedSection] = useState<string | null>('discovery');

  const guides: GuideSection[] = [
    {
      id: 'discovery',
      title: '1. Discovering Resources & Apparatus',
      category: 'discovery',
      icon: Compass,
      summary: 'Explore equipment across university faculties, filter by institution or specs, or use SmartMatch AI natural language query.',
      steps: [
        {
          title: 'Browse Campus Catalog',
          desc: 'Visit the Explore Marketplace to search across 10+ faculties including Cleanroom Nanofab, High-Voltage Rigs, 3D Printers, and Supercomputing clusters.',
        },
        {
          title: 'Apply Multi-Dimensional Filters',
          desc: 'Filter by Location, Availability status, Training prerequisites, Institution, or target reservation date.',
        },
        {
          title: 'Use SmartMatch AI Natural Search',
          desc: 'Click "AI Smart Matcher" to type queries like "I need a high-end GPU cluster for deep learning model training tomorrow afternoon" for real-time recommendations with conflict detection.',
        },
        {
          title: 'Save Favorites',
          desc: 'Click the heart icon on any resource card to save frequently needed apparatus for one-click access.',
        },
      ],
      faqs: [
        {
          q: 'Can I book equipment at another university in the consortium?',
          a: 'Yes! RENTORA is a federated network. If the apparatus has public or inter-institutional sharing enabled, verified academic researchers may reserve it.',
        },
        {
          q: 'What if a resource is currently reserved or in use?',
          a: 'You can join the FairShare automated waiting list. The engine monitors slot releases and will alert you if an earlier slot frees up.',
        },
      ],
      actionLink: { label: 'Explore Campus Resources', to: '/dashboard/explore' },
    },
    {
      id: 'booking',
      title: '2. Requesting a Booking & Duration Rules',
      category: 'booking',
      icon: CalendarCheck,
      summary: 'Submit reservations with custom operating duration, research purpose, and slot selection while respecting fairness limits.',
      steps: [
        {
          title: 'Select Apparatus & Click Book Now',
          desc: 'From the resource details or marketplace card, click "Book Now" to open the interactive reservation wizard.',
        },
        {
          title: 'Choose Date & Time Slot',
          desc: 'Select your target date and operating slot (e.g. 09:00 - 13:00, 14:00 - 18:00, or full day) according to custodian hours.',
        },
        {
          title: 'Provide Research Justification',
          desc: 'State your project title, department supervisor, and intended workflow to assist the equipment custodian with review.',
        },
        {
          title: 'Automated FairShare Evaluation',
          desc: 'Our Transparent Allocation Engine immediately checks for double bookings, active quota limits (max 3 concurrent active bookings), and priority ranking.',
        },
      ],
      faqs: [
        {
          q: 'How long does custodian approval take?',
          a: 'Standard review takes 1–4 business hours. Automated approvals apply if you have pre-cleared certified status on specific general apparatus.',
        },
        {
          q: 'Can I cancel or reschedule a pending request?',
          a: 'Yes, navigate to "My Bookings" and click "Cancel". This immediately frees the slot for researchers on the waiting list.',
        },
      ],
      actionLink: { label: 'View My Bookings', to: '/dashboard/bookings' },
    },
    {
      id: 'eligibility',
      title: '3. Understanding Eligibility & Safety Rules',
      category: 'eligibility',
      icon: ShieldCheck,
      summary: 'High-grade laboratory assets require prerequisite training levels, OSHA standards, or supervisor approvals.',
      steps: [
        {
          title: 'Check Resource Prerequisites',
          desc: 'Each resource page displays required eligibility criteria, such as "Cleanroom ISO-5 Certified" or "Laser Safety Officer Level 2".',
        },
        {
          title: 'Profile Credential Synchronization',
          desc: 'Your institutional certifications are automatically verified against campus records and reflected on your profile.',
        },
        {
          title: 'Manager Policy Overrides',
          desc: 'If you require an exception for thesis research, institutional managers have governed override authority with a mandatory audit reason.',
        },
      ],
      faqs: [
        {
          q: 'How do I add a new certification to my account?',
          a: 'Certifications are synced through your university department registrar. You can inspect your active badges on the Profile page.',
        },
        {
          q: 'What is the FairShare anti-monopolization rule?',
          a: 'FairShare ensures no single laboratory or researcher can monopolize shared equipment by limiting active concurrent peak-time slots.',
        },
      ],
      actionLink: { label: 'Inspect My Credentials', to: '/dashboard/profile' },
    },
    {
      id: 'checkin',
      title: '4. Physical Handover: TrustPass Check-In & Check-Out',
      category: 'checkin',
      icon: QrCode,
      summary: 'Verify equipment handovers securely with unique QR tokens, before-use condition logs, and return sign-offs.',
      steps: [
        {
          title: 'Obtain TrustPass QR Code',
          desc: 'Once your reservation is approved, click "Check-In Pass" on your booking in My Bookings to display your encrypted verification token.',
        },
        {
          title: 'Handover & Inspection with Custodian',
          desc: 'Present the QR code to the laboratory custodian at the physical equipment desk. Inspect initial condition, power-on tests, and record any pre-existing scratches.',
        },
        {
          title: 'Active In-Use State',
          desc: 'Once verified, the booking status transitions to "In Use" and the resource is protected from conflicting bookings.',
        },
        {
          title: 'Check-Out & Return Log',
          desc: 'Upon completing your work, return the apparatus to the custodian and click "Handback" to record return condition, timestamps, and return sign-off.',
        },
      ],
      faqs: [
        {
          q: 'What happens if I return equipment late?',
          a: 'Overdue returns trigger a reminder and may lower FairShare priority ranking for future reservations to protect peer access.',
        },
        {
          q: 'Do I need internet access to show my check-in token?',
          a: 'You can download an electronic receipt or snapshot your TrustPass alphanumeric token beforehand.',
        },
      ],
      actionLink: { label: 'Check Scheduled Handover', to: '/dashboard/bookings' },
    },
    {
      id: 'incidents',
      title: '5. Reporting Incidents & Safety Damage',
      category: 'incidents',
      icon: AlertTriangle,
      summary: 'ConditionGuard provides a transparent, no-fault investigation protocol for damage, missing components, or safety hazards.',
      steps: [
        {
          title: 'Trigger Incident Report',
          desc: 'Click the warning icon on any active or completed booking, or access the Safety Incidents panel in your navigation.',
        },
        {
          title: 'Select Severity & Incident Category',
          desc: 'Categorize as Equipment Malfunction, Pre-existing Damage, Missing Accessories, Physical Wear, or Safety Concern.',
        },
        {
          title: 'Upload Evidence & Notes',
          desc: 'Attach photos and a clear description of the defect or malfunction to expedite custodian review.',
        },
        {
          title: 'Track Resolution Workflow',
          desc: 'Custodians and campus safety arbiters review the incident reference, record maintenance actions, and update the status transparently.',
        },
      ],
      faqs: [
        {
          q: 'Will reporting a malfunction penalize me?',
          a: 'No! Prompt reporting is strictly encouraged to maintain safety and protect subsequent student researchers.',
        },
        {
          q: 'How do I check the status of my reported report?',
          a: 'Search the Incident Number (e.g. INC-2026-...) via Global Search (Ctrl+K) or visit the Activity & Safety page.',
        },
      ],
      actionLink: { label: 'View Incident Ledger', to: '/dashboard/activity' },
    },
  ];

  const filteredGuides = guides.filter((g) => {
    if (selectedCategory !== 'all' && g.category !== selectedCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.title.toLowerCase().includes(q) ||
      g.summary.toLowerCase().includes(q) ||
      g.steps.some((s) => s.title.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)) ||
      g.faqs.some((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 1. Header Hero */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
        <div className="max-w-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#EFF6FF] text-[#1769D2] border border-blue-200">
              <HelpCircle className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-[#172033] tracking-tight">Help Center & User Guide</h1>
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Welcome to the RENTORA Institutional Resource Platform. Find comprehensive documentation on discovering scientific equipment, making requests, physical check-ins, safety, and incident reporting.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mt-5 max-w-xl">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides, check-in instructions, FairShare rules, or incident policies..."
            className="w-full bg-[#F8FAFC] text-[#172033] placeholder-[#94A3B8] text-xs rounded-xl pl-9 pr-4 py-2.5 border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2]"
          />
        </div>
      </div>

      {/* 2. Category Selector */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'all', label: 'All Guides (5)' },
          { key: 'discovery', label: '1. Discovery & Search' },
          { key: 'booking', label: '2. Requesting a Booking' },
          { key: 'eligibility', label: '3. Eligibility & FairShare' },
          { key: 'checkin', label: '4. Check-in & TrustPass' },
          { key: 'incidents', label: '5. Reporting Incidents' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSelectedCategory(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === tab.key
                ? 'bg-[#1769D2] text-white shadow-xs font-semibold'
                : 'bg-white text-[#64748B] hover:text-[#172033] border border-[#E2E8F0]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Interactive Guide Accordions */}
      <div className="space-y-4">
        {filteredGuides.map((guide) => {
          const Icon = guide.icon;
          const isExpanded = expandedSection === guide.id;

          return (
            <div
              key={guide.id}
              className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs transition-all"
            >
              {/* Accordion Header */}
              <div
                onClick={() => setExpandedSection(isExpanded ? null : guide.id)}
                className="p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1769D2] border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#172033]">{guide.title}</h2>
                    <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{guide.summary}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="p-1 text-[#64748B] hover:text-[#172033] shrink-0"
                  aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="px-5 pb-6 pt-1 border-t border-[#E2E8F0] space-y-6 bg-white">
                  {/* Step-by-Step Procedure */}
                  <div className="space-y-3 pt-3">
                    <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                      Step-by-Step Operating Workflow:
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {guide.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-1 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#1769D2] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                              {idx + 1}
                            </span>
                            <h4 className="font-semibold text-[#172033]">{step.title}</h4>
                          </div>
                          <p className="text-[#64748B] text-[11px] leading-relaxed pl-7">{step.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Frequently Asked Questions */}
                  <div className="space-y-2.5 pt-2">
                    <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                      Frequently Asked Questions:
                    </h3>
                    <div className="space-y-2">
                      {guide.faqs.map((faq, idx) => (
                        <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white text-xs space-y-1">
                          <p className="font-semibold text-[#172033] flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-[#1769D2]" />
                            {faq.q}
                          </p>
                          <p className="text-[#64748B] text-[11px] leading-relaxed pl-5">{faq.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Link Button */}
                  {guide.actionLink && (
                    <div className="pt-2 flex justify-end">
                      <Link
                        to={guide.actionLink.to}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-medium rounded-lg shadow-xs transition-colors"
                      >
                        <span>{guide.actionLink.label}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Support Contacts & Consortium Support */}
      <div className="bg-[#EFF6FF] border border-blue-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <h4 className="font-bold text-[#172033] flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-[#1769D2]" />
            Need Additional Campus Assistance?
          </h4>
          <p className="text-[#64748B]">
            Team Storm Breakerz Support Desk (Team Leader: Jaswant Karun S A) is active during operating lab hours.
          </p>
        </div>
        <Link
          to="/dashboard/activity"
          className="px-4 py-2 bg-white border border-blue-200 hover:bg-blue-50 text-[#1769D2] font-semibold rounded-lg shadow-xs shrink-0 transition-colors inline-flex items-center gap-1.5"
        >
          <span>Safety & Governance Ledger</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default HelpSupportPage;
