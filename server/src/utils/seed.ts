import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/user.model.js';
import { Resource } from '../models/resource.model.js';
import { Booking } from '../models/booking.model.js';
import { Notification } from '../models/notification.model.js';
import { ConditionReport } from '../models/conditionReport.model.js';
import { Incident } from '../models/incident.model.js';
import { Dispute } from '../models/dispute.model.js';
import { FairAllocation } from '../models/fairAllocation.model.js';

dotenv.config();

const demoUsers = [
  {
    name: 'Arun Kumar',
    email: 'student@rentora.edu',
    password: 'Password123!',
    role: 'student',
    institution: 'National Institute of Technology',
    department: 'Computer Science & Engineering',
    phone: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    isVerified: true,
  },
  {
    name: 'Dr. Meera Raman',
    email: 'owner@rentora.edu',
    password: 'Password123!',
    role: 'owner',
    institution: 'National Institute of Technology',
    department: 'Robotics & Advanced Automation Lab',
    phone: '+91 98765 43211',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
    isVerified: true,
  },
  {
    name: 'Prof. Suresh Nair',
    email: 'manager@rentora.edu',
    password: 'Password123!',
    role: 'manager',
    institution: 'National Institute of Technology',
    department: 'Dean of Academic Infrastructure',
    phone: '+91 98765 43212',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    isVerified: true,
  },
  {
    name: 'Central Platform Administrator',
    email: 'admin@rentora.edu',
    password: 'Password123!',
    role: 'admin',
    institution: 'RENTORA Central Network',
    department: 'Platform Administration & Governance',
    phone: '+91 98765 43213',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
    isVerified: true,
  },
];

const seedResources = [
  // 1. Laboratories
  {
    name: 'High-Performance Cleanroom & Thin Film Nanotech Lab',
    category: 'Laboratories',
    resourceType: 'Physical Space / Research Lab',
    institution: 'National Institute of Technology',
    location: 'Nanotechnology Complex, ISO Class 5 Bay C',
    description:
      'Class 100/ISO 5 certified semiconductor fabrication cleanroom equipped with chemical vapor deposition (CVD), e-beam lithography, and RF magnetron sputtering units for advanced materials research.',
    images: [
      'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1579165466791-788226ab6fb0?auto=format&fit=crop&w=800&q=80',
    ],
    ownerName: 'Dr. Meera Raman',
    ownerEmail: 'owner@rentora.edu',
    ownerDepartment: 'Materials & Nanotechnology Department',
    ownerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
    status: 'available',
    availabilityText: 'Available Today (Slots 10 AM - 6 PM)',
    availableDates: ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04'],
    eligibility: 'Faculty, Postdocs & Certified PG Scholars',
    approvalRequired: true,
    specifications: {
      CleanlinessStandard: 'ISO 14644-1 Class 5 (Class 100)',
      DepositionSystems: 'Kurt J. Lesker AXXIS Magnetron Sputter',
      Lithography: 'Raith e-Line Plus 30kV Electron Beam',
      GloveboxAtmosphere: 'Inert Argon (< 0.1 ppm H2O/O2)',
      Capacity: 'Up to 6 simultaneous researchers',
    },
    usageInstructions: [
      'Gown up in air shower chamber with anti-static bunny suit and booties.',
      'Log into cleanroom portal with your institutional RFID badge.',
      'Only cleanroom-certified synthetic paper and pens permitted inside.',
      'Dispose of organic solvents strictly in the marked hazardous waste fume hood.',
    ],
    trainingRequired: 'Level 2 Cleanroom Safety & Chemical Hygiene Induction',
    safetyInstructions: [
      'Full body Tyvek cleanroom coverall, nitrile gloves, and chemical splash goggles mandatory.',
      'HF (Hydrofluoric Acid) handling strictly prohibited without dedicated calcium gluconate kit on standby.',
      'Evacuate immediately if audible continuous toxic gas alarm activates.',
    ],
    bookingConditions: [
      'Bookings must be requested at least 24 hours in advance.',
      'Maximum 4 hours per slot per researcher.',
      'Cancellations less than 6 hours prior incur a warning.',
    ],
    tags: ['Nanotechnology', 'Cleanroom', 'Semiconductor', 'Lithography', 'Materials'],
    featured: true,
    rating: 4.9,
    totalBookings: 64,
    hourlyValueEstimated: 1200,
  },
  {
    name: 'Bio-Molecular Synthesis & High-Throughput DNA Sequencer Lab',
    category: 'Laboratories',
    resourceType: 'Biotechnology Lab',
    institution: 'National Institute of Technology',
    location: 'Life Sciences Building, Lab 304',
    description:
      'State-of-the-art biosafety level 2 facility containing Illumina NextSeq 2000 sequencer, automated liquid handlers, real-time qPCR thermal cyclers, and ultracentrifuges.',
    images: [
      'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
    ],
    ownerName: 'Dr. Sunita Deshmukh',
    ownerEmail: 'sunita.deshmukh@rentora.edu',
    ownerDepartment: 'Bioengineering & Genetics',
    status: 'available',
    availabilityText: 'Available Tomorrow Morning',
    availableDates: ['2026-11-02', '2026-11-03', '2026-11-05'],
    eligibility: 'All Enrolled Students & Faculty',
    approvalRequired: true,
    specifications: {
      Sequencer: 'Illumina NextSeq 2000 System',
      Output: 'Up to 360 Gb per run',
      PCRSystems: 'Bio-Rad CFX96 Real-Time PCR',
      Centrifuge: 'Beckman Coulter Optima L-90K Ultracentrifuge',
    },
    usageInstructions: [
      'Ensure sample concentration is verified via Qubit fluorometer prior to loading sequencer.',
      'Clean flow cells with ethanol wash protocol post completion.',
    ],
    trainingRequired: 'Biosafety Level 2 (BSL-2) Protocol Certification',
    safetyInstructions: [
      'Lab coat, double gloves, and safety glasses required at all times.',
      'All biological waste must be autoclaved before disposal.',
    ],
    bookingConditions: [
      'Sequencing slots must be coordinated 48 hours prior.',
      'User must bring their own certified library prep kits.',
    ],
    tags: ['Genetics', 'DNA Sequencing', 'Biotech', 'PCR', 'BSL-2'],
    featured: true,
    rating: 4.8,
    totalBookings: 42,
    hourlyValueEstimated: 1800,
  },

  // 2. Classrooms
  {
    name: 'Tiered Smart Lecture Hall - Auditorium Alpha',
    category: 'Classrooms',
    resourceType: 'Physical Space / Lecture Hall',
    institution: 'National Institute of Technology',
    location: 'Central Academic Block, Ground Floor',
    description:
      'Air-conditioned 180-seat tiered amphitheater with dual laser projectors, Shure wireless microphone matrix, document visualizer, and live-streaming lecture capture hardware.',
    images: [
      'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
    ],
    ownerName: 'Prof. Suresh Nair',
    ownerEmail: 'manager@rentora.edu',
    ownerDepartment: 'Dean of Academic Infrastructure',
    status: 'available',
    availabilityText: 'Slots Open This Week',
    availableDates: ['2026-11-01', '2026-11-03', '2026-11-04'],
    eligibility: 'Faculty, Department Heads & Recognized Clubs',
    approvalRequired: false,
    specifications: {
      SeatingCapacity: '180 tiered ergonomic seats with foldaway desks',
      AVSystem: 'Dual 4K Epson Laser Projectors + Crestron Touch Panel',
      Audio: 'Bose Panaray Line-Array + 4 Wireless Lapel Mics',
      Broadcasting: 'Pan-Tilt-Zoom (PTZ) Camera with automated presenter tracking',
    },
    usageInstructions: [
      'Switch on system via Crestron touchscreen console on podium.',
      'Connect via HDMI or wireless AirMedia / Miracast display.',
    ],
    trainingRequired: 'Basic AV Pod Operator Guidance',
    safetyInstructions: [
      'Fire exits must remain unblocked at all times.',
      'Food and open beverage cups prohibited inside auditorium.',
    ],
    bookingConditions: [
      'Direct instant booking for verified institutional faculty.',
      'Club events require student council co-endorsement.',
    ],
    tags: ['Auditorium', 'Lecture Hall', 'Smart Classroom', 'Streaming', 'AV System'],
    featured: false,
    rating: 4.7,
    totalBookings: 88,
    hourlyValueEstimated: 500,
  },

  // 3. Meeting Rooms
  {
    name: 'Executive Academic Senate & Conference Chamber',
    category: 'Meeting Rooms',
    resourceType: 'Physical Space / Boardroom',
    institution: 'National Institute of Technology',
    location: 'Administrative Tower, 4th Floor',
    description:
      '24-seat executive boardroom equipped with Cisco Webex Room Kit Pro, dual 85-inch 4K displays, boundary beamforming microphones, and soundproofing for inter-institutional syndicate meets.',
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80',
    ],
    ownerName: 'Prof. Suresh Nair',
    ownerEmail: 'manager@rentora.edu',
    ownerDepartment: 'Dean of Academic Infrastructure',
    status: 'available',
    availabilityText: 'Available Today',
    availableDates: ['2026-11-01', '2026-11-02', '2026-11-03'],
    eligibility: 'Faculty, Research Coordinators & Administrative Staff',
    approvalRequired: true,
    specifications: {
      Capacity: '24 Executive Swivel Chairs + 12 Perimeter Seats',
      VideoConferencing: 'Cisco Webex Room Kit Pro with 5K dual cameras',
      Display: 'Dual 85" Samsung 4K Commercial Interactive Panels',
      Acoustics: 'STC 55 sound transmission class acoustic wall cladding',
    },
    usageInstructions: [
      'Connect laptop via table well cable retractor or dial SIP conference URI.',
      'Turn off all video codecs upon exiting chamber.',
    ],
    trainingRequired: 'None',
    safetyInstructions: ['Keep room temperature within 21°C - 23°C to protect electronics.'],
    bookingConditions: ['Approval within 2 business hours by department registrar.'],
    tags: ['Boardroom', 'Meeting Room', 'Video Conference', 'Executive', 'Webex'],
    featured: false,
    rating: 4.9,
    totalBookings: 56,
    hourlyValueEstimated: 450,
  },

  // 4. Computers
  {
    name: 'NVIDIA DGX A100 Deep Learning High-Performance Cluster Node',
    category: 'Computers',
    resourceType: 'High Performance Computing (HPC)',
    institution: 'National Institute of Technology',
    location: 'Center for Artificial Intelligence, Server Rack R4',
    description:
      'Supercomputing node containing 8x NVIDIA A100 Tensor Core GPUs (640GB total VRAM) with NVLink, dual AMD EPYC 7742 64-core CPUs, and 2TB RAM for training foundation AI models and CFD simulations.',
    images: [
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    ],
    ownerName: 'Dr. Meera Raman',
    ownerEmail: 'owner@rentora.edu',
    ownerDepartment: 'Computer Science & AI Lab',
    status: 'available',
    availabilityText: 'Immediate Slurm Queue Access',
    availableDates: ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'],
    eligibility: 'Graduate Students, Ph.D. Fellows & AI Research Faculty',
    approvalRequired: false,
    specifications: {
      Accelerators: '8x NVIDIA A100 SXM4 80GB GPUs',
      TotalVRAM: '640 GB High Bandwidth Memory 2 (HBM2e)',
      CPU: 'Dual AMD EPYC 7742 (128 Cores / 256 Threads)',
      SystemRAM: '2,048 GB DDR4 ECC Registered',
      Networking: '8x 200 Gb/s HDR InfiniBand Adapters',
      Storage: '30 TB NVMe U.2 High-Speed Scratch Array',
    },
    usageInstructions: [
      'SSH into slurm-login.rentora.edu using institutional VPN credentials.',
      'Submit training scripts via sbatch with allocated walltime limits.',
      'Save model weights directly to mounted Ceph scratch space.',
    ],
    trainingRequired: 'Slurm HPC Cluster & CUDA Workflow Training',
    safetyInstructions: [
      'Do not run interactive jobs on master controller node.',
      'Automated watchdog will kill unthrottled memory leak processes over 95%.',
    ],
    bookingConditions: [
      'Direct reservation up to 48 GPU-hours per weekly quota.',
      'Requires institutional email login.',
    ],
    tags: ['GPU', 'AI', 'Deep Learning', 'NVIDIA A100', 'Supercomputing', 'PyTorch'],
    featured: true,
    rating: 5.0,
    totalBookings: 145,
    hourlyValueEstimated: 2500,
  },
  {
    name: 'Apple Mac Studio M2 Ultra Digital Media & CAD Workstation',
    category: 'Computers',
    resourceType: 'High-End Workstation',
    institution: 'National Institute of Technology',
    location: 'Design & Prototyping Center, Workstation Bay 6',
    description:
      'Apple Silicon workstation configured with 24-core CPU, 76-core GPU, 128GB unified memory, and 27" Apple Studio Display 5K for SolidWorks, Blender, and Unreal Engine rendering.',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
    ],
    ownerName: 'Dr. Meera Raman',
    ownerEmail: 'owner@rentora.edu',
    ownerDepartment: 'Industrial Design & Robotics',
    status: 'available',
    availabilityText: 'Available Today',
    availableDates: ['2026-11-01', '2026-11-02', '2026-11-03'],
    eligibility: 'All Enrolled Students & Faculty',
    approvalRequired: false,
    specifications: {
      Processor: 'Apple M2 Ultra (24 CPU cores / 76 GPU cores)',
      Memory: '128 GB Unified LPDDR5 Memory',
      Storage: '2 TB Ultra-fast NVMe SSD (7.4 GB/s)',
      Display: '27-inch Apple Studio Display 5K Retina',
      Software: 'AutoCAD, SolidWorks, Blender 4.2, Final Cut Pro, MATLAB',
    },
    usageInstructions: ['Log in using institutional guest profile.', 'Transfer work to external drive upon logout.'],
    trainingRequired: 'None',
    safetyInstructions: ['Keep magnetic equipment away from Studio Display.'],
    bookingConditions: ['Max 4 consecutive hours per student session.'],
    tags: ['Mac Studio', 'CAD', 'Workstation', '3D Design', 'Rendering'],
    featured: false,
    rating: 4.8,
    totalBookings: 79,
    hourlyValueEstimated: 350,
  },

  // 5. Cameras
  {
    name: 'Phantom v2640 Ultra High-Speed Ballistics & Fluid Camera',
    category: 'Cameras',
    resourceType: 'High-Speed Scientific Camera',
    institution: 'National Institute of Technology',
    location: 'Fluid Dynamics & Aerodynamics Lab, Bay 2',
    description:
      'World-class ultra-high-speed CMOS camera capable of capturing 6,600 frames per second at full 4 Megapixel (2048 x 1952) resolution and over 1,000,000 fps at reduced dimensions for impact and combustion analysis.',
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?auto=format&fit=crop&w=800&q=80',
    ],
    ownerName: 'Dr. Meera Raman',
    ownerEmail: 'owner@rentora.edu',
    ownerDepartment: 'Aerospace & Mechanical Systems',
    status: 'available',
    availabilityText: 'Available Tomorrow Afternoon',
    availableDates: ['2026-11-02', '2026-11-03', '2026-11-04'],
    eligibility: 'Research Scholars & Aerospace Faculty',
    approvalRequired: true,
    specifications: {
      MaxFrameRate: '6,600 fps at full 2048 x 1952; up to 1,000,000 fps reduced',
      SensorType: 'Custom 4Mpx CMOS Sensor with 18.5µm pixels',
      DynamicRange: '64 dB High Dynamic Range',
      InternalRAM: '288 GB Ultra-fast buffer memory',
      LensMount: 'Nikon F & Canon EF lens electronic adaptors',
    },
    usageInstructions: [
      'Mount only on heavy-duty Gitzo carbon fiber tripod provided.',
      'Connect via 10 Gigabit Ethernet to Phantom PCC acquisition software.',
      'Ensure high-intensity cold LED light source is used to prevent thermal distortion.',
    ],
    trainingRequired: 'High-Speed Optical Diagnostics Certification',
    safetyInstructions: [
      'Never touch CMOS optical low-pass filter without nitrogen blower.',
      'Wear laser safety goggles if synchronizing with Nd:YAG pulsed laser illumination.',
    ],
    bookingConditions: ['Requires lab in-charge signoff prior to checkout.'],
    tags: ['High-Speed Camera', 'Phantom', 'Fluids', 'Aerodynamics', 'Optics'],
    featured: true,
    rating: 4.9,
    totalBookings: 34,
    hourlyValueEstimated: 2200,
  },

  // 6. 3D Printers
  {
    name: 'EOS M 290 Industrial Direct Metal Laser Sintering (DMLS) 3D Printer',
    category: '3D Printers',
    resourceType: 'Additive Manufacturing System',
    institution: 'National Institute of Technology',
    location: 'Advanced Manufacturing Hub, Heavy Tech Hall 1',
    description:
      'Industrial metal 3D printing system equipped with a 400W Yb-fiber laser, argon inert gas circulation, and build volume of 250 x 250 x 325 mm for titanium (Ti64), aluminum (AlSi10Mg), and 316L stainless steel components.',
    images: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1631557559471-a47781b0a827?auto=format&fit=crop&w=800&q=80',
    ],
    ownerName: 'Dr. Meera Raman',
    ownerEmail: 'owner@rentora.edu',
    ownerDepartment: 'Mechanical & Metallurgical Engineering',
    status: 'available',
    availabilityText: 'Available This Weekend for Batch Prints',
    availableDates: ['2026-11-03', '2026-11-04', '2026-11-05'],
    eligibility: 'Faculty, Masters & Ph.D. Project Teams',
    approvalRequired: true,
    specifications: {
      LaserType: '400W Yb-fiber laser (100 µm focus diameter)',
      BuildEnvelope: '250 x 250 x 325 mm (9.85 x 9.85 x 12.8 in)',
      LayerThickness: '20 to 60 µm precision',
      MaterialsSupported: 'Titanium Ti64, Inconel 718, Stainless Steel 316L, AlSi10Mg',
      Atmosphere: 'Recirculating Argon with O2 monitoring < 100 ppm',
    },
    usageInstructions: [
      'Submit STL or STEP file for sliced orientation & support structure inspection in Materialise Magics.',
      'Sieve and load powder strictly inside glove-assisted inert depowdering station.',
    ],
    trainingRequired: 'Metal Powder Handling & Class 4 Laser Safety Clearance',
    safetyInstructions: [
      'PAPR (Powered Air-Purifying Respirator) mandatory during metal powder handling.',
      'Keep Class D dry powder fire extinguisher within 2 meters of printer bay.',
    ],
    bookingConditions: [
      'Requires CAD slicing review by lab technician prior to printing run.',
      'Raw metal powder weight consumed billed to institutional grant or lab account.',
    ],
    tags: ['3D Printing', 'Metal DMLS', 'Titanium', 'Additive Manufacturing', 'Industrial'],
    featured: true,
    rating: 4.9,
    totalBookings: 51,
    hourlyValueEstimated: 3200,
  },
  {
    name: 'Formlabs Form 3+ Stereolithography (SLA) Precision Resin 3D Printer',
    category: '3D Printers',
    resourceType: 'Rapid Prototyping System',
    institution: 'National Institute of Technology',
    location: 'Design & Prototyping Lab, Room 108',
    description:
      'High-precision SLA resin printer with 25-micron laser spot, automated resin cartridge feed, Form Wash, and Form Cure stations for high-detail biomedical models and microfluidic molds.',
    images: [
      'https://images.unsplash.com/photo-1631557559471-a47781b0a827?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    ],
    ownerName: 'Dr. Meera Raman',
    ownerEmail: 'owner@rentora.edu',
    ownerDepartment: 'Robotics & Advanced Automation Lab',
    status: 'available',
    availabilityText: 'Available Today',
    availableDates: ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04'],
    eligibility: 'All Enrolled Students & Faculty',
    approvalRequired: false,
    specifications: {
      Technology: 'Low Force Stereolithography (LFS)',
      XYResolution: '25 microns',
      BuildVolume: '145 x 145 x 185 mm',
      LaserPower: '250 mW 405nm violet laser',
    },
    usageInstructions: [
      'Prepare file in PreForm software using standard orientation supports.',
      'Wear nitrile gloves when handling build plate and wash parts in IPA tank for 15 mins.',
    ],
    trainingRequired: 'Basic SLA Resin Safety Briefing',
    safetyInstructions: ['Nitrile gloves and UV safety eyewear mandatory. Never pour resin down drain.'],
    bookingConditions: ['Instant direct booking for students and research teams.'],
    tags: ['3D Printing', 'Resin', 'SLA', 'Prototyping', 'Formlabs'],
    featured: false,
    rating: 4.8,
    totalBookings: 112,
    hourlyValueEstimated: 300,
  },

  // 7. Electronics Equipment
  {
    name: 'Rohde & Schwarz 4GHz 4-Channel Mixed-Signal Oscilloscope (R&S RTO6)',
    category: 'Electronics Equipment',
    resourceType: 'RF & Signal Measurement',
    institution: 'National Institute of Technology',
    location: 'RF Communications & VLSI Testing Bay, Room 212',
    description:
      'High-bandwidth 4 GHz oscilloscope featuring 20 GSample/s sampling rate, 16 digital logic channels, ultra-low noise front end, and hardware-accelerated FFT for high-speed digital bus and radar prototyping.',
    images: [
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    ],
    ownerName: 'Dr. Rajesh Pillai',
    ownerEmail: 'rajesh.pillai@rentora.edu',
    ownerDepartment: 'Department of Electrical & Electronics Engineering',
    status: 'available',
    availabilityText: 'Available Today (Bench 3)',
    availableDates: ['2026-11-01', '2026-11-02', '2026-11-03'],
    eligibility: 'All Enrolled Students & Faculty',
    approvalRequired: false,
    specifications: {
      Bandwidth: '4 GHz (up to 6 GHz upgradable)',
      SampleRate: '20 GSample/s per channel',
      VerticalResolution: '16-bit HD mode',
      MemoryDepth: 'Up to 1 Gpoints per channel',
      Display: '15.6" Full HD capacitive touchscreen',
    },
    usageInstructions: [
      'Calibrate active differential probes before high-frequency measurements.',
      'Store captured waveforms in CSV/MAT format via front-panel USB 3.0 port.',
    ],
    trainingRequired: 'High-Frequency Test Bench Practices',
    safetyInstructions: ['Ground ESD wrist strap to anti-static mat before touching high-speed DUT boards.'],
    bookingConditions: ['Instant direct booking with 4-hour slots.'],
    tags: ['Oscilloscope', 'Electronics', 'Signal Analysis', 'RF', 'Hardware'],
    featured: false,
    rating: 4.9,
    totalBookings: 97,
    hourlyValueEstimated: 450,
  },

  // 8. Testing Instruments
  {
    name: 'Instron 5969 Dual Column Universal Tensile & Compression Testing Machine',
    category: 'Testing Instruments',
    resourceType: 'Mechanical Test System',
    institution: 'National Institute of Technology',
    location: 'Materials Characterization Center, Hall A',
    description:
      'Precision 50 kN electro-mechanical load frame with non-contact video extensometer for ASTM/ISO standard tensile, compression, peel, flexure, and shear testing of composites, biomaterials, and alloys.',
    images: [
      'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    ],
    ownerName: 'Dr. Meera Raman',
    ownerEmail: 'owner@rentora.edu',
    ownerDepartment: 'Materials & Structural Mechanics',
    status: 'available',
    availabilityText: 'Available Tomorrow Morning',
    availableDates: ['2026-11-02', '2026-11-03', '2026-11-04'],
    eligibility: 'All Enrolled Students & Faculty',
    approvalRequired: true,
    specifications: {
      MaxCapacity: '50 kN (11,250 lbf) tension/compression',
      SpeedRange: '0.001 to 1016 mm/min',
      Extensometer: 'Instron Advanced Video Extensometer (AVE 2) 0.5 µm accuracy',
      Software: 'Bluehill Universal with ASTM/ISO test methods',
    },
    usageInstructions: [
      'Mount specimen securely in pneumatic wedge grips aligned with load axis.',
      'Zero load and strain transducers prior to starting motorized crosshead.',
    ],
    trainingRequired: 'Instron Bluehill Operator Clearance',
    safetyInstructions: ['Keep interlocked acrylic safety shield closed during test execution.'],
    bookingConditions: ['Request requires supervisor name for test log accountability.'],
    tags: ['Tensile Tester', 'Instron', 'Materials', 'Compression', 'Biomechanics'],
    featured: true,
    rating: 4.8,
    totalBookings: 68,
    hourlyValueEstimated: 600,
  },

  // 9. Workshop Tools
  {
    name: 'Haas Mini Mill 3-Axis CNC Machining Center',
    category: 'Workshop Tools',
    resourceType: 'Subtractive Fabrication Machine',
    institution: 'National Institute of Technology',
    location: 'Central Mechanical Workshop, CNC Section Bay 4',
    description:
      'Rigid 3-axis CNC vertical milling machine with 406 x 305 x 254 mm travels, 10,000 RPM spindle, 10-station automatic tool changer, and Renishaw wireless intuitive probing system for aluminum, brass, and Delrin machining.',
    images: [
      'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    ],
    ownerName: 'Prof. Suresh Nair',
    ownerEmail: 'manager@rentora.edu',
    ownerDepartment: 'Dean of Academic Infrastructure',
    status: 'available',
    availabilityText: 'Slots Open Thursday & Friday',
    availableDates: ['2026-11-05', '2026-11-06'],
    eligibility: 'Certified Student Teams & Faculty',
    approvalRequired: true,
    specifications: {
      AxisTravel: 'X: 406mm, Y: 305mm, Z: 254mm',
      SpindleSpeed: '10,000 RPM vector drive (7.5 HP)',
      ToolChanger: '10-pocket automatic carousel',
      Probing: 'Renishaw Wireless Tool and Workpiece Probe',
      Coolant: 'Flood coolant system with chip pan',
    },
    usageInstructions: [
      'Dry run G-code program in Haas simulator before turning spindle on.',
      'Check tool height offsets using Renishaw table probe.',
    ],
    trainingRequired: 'CNC Safety & G-Code Programming Certificate',
    safetyInstructions: [
      'Safety glasses with side shields, hearing protection, and steel-toed boots mandatory.',
      'Never operate with safety enclosure door interlock overridden.',
    ],
    bookingConditions: ['Requires G-code simulation preview approved by shop superintendent.'],
    tags: ['CNC', 'Milling', 'Machining', 'Haas', 'Fabrication', 'Workshop'],
    featured: false,
    rating: 4.9,
    totalBookings: 47,
    hourlyValueEstimated: 850,
  },

  // 10. Other Resources
  {
    name: 'DJI Matrice 300 RTK Industrial LiDAR Aerial Mapping Drone',
    category: 'Other Resources',
    resourceType: 'Surveying & Geospatial Apparatus',
    institution: 'National Institute of Technology',
    location: 'Civil & Environmental Engineering, Survey Lab',
    description:
      'Flagship commercial drone platform with Zenmuse L1 LiDAR module, full-frame photogrammetry, RTK centimeter-level positioning, and 55-minute flight time for topological mapping, thermal inspection, and agricultural telemetry.',
    images: [
      'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80',
    ],
    ownerName: 'Dr. Meera Raman',
    ownerEmail: 'owner@rentora.edu',
    ownerDepartment: 'Geomatics & Environmental Engineering',
    status: 'available',
    availabilityText: 'Available for Field Missions (Weather Permitting)',
    availableDates: ['2026-11-03', '2026-11-04', '2026-11-05'],
    eligibility: 'Licensed Drone Pilots & Civil Engineering Researchers',
    approvalRequired: true,
    specifications: {
      MaxFlightTime: '55 minutes',
      Sensors: 'Livox LiDAR + 1-inch 20MP RGB Camera (Zenmuse L1)',
      PositioningAccuracy: 'RTK Horizontal: 1 cm + 1 ppm; Vertical: 1.5 cm + 1 ppm',
      TransmissionRange: '15 km with OcuSync Enterprise',
      IngressProtection: 'IP45 all-weather rating',
    },
    usageInstructions: [
      'Pre-flight check of propellers, battery state of health, and D-RTK 2 base station connection.',
      'Log flight plan with campus security clearance unit.',
    ],
    trainingRequired: 'DGCA Certified Remote Pilot License + Campus Flight Clearance',
    safetyInstructions: [
      'Maintain visual line of sight (VLOS) at all times.',
      'Do not operate in sustained winds above 12 m/s or heavy downpours.',
    ],
    bookingConditions: ['Weather and flight permit verified 24h before takeoff.'],
    tags: ['Drone', 'LiDAR', 'Mapping', 'Surveying', 'Geospatial', 'DJI'],
    featured: true,
    rating: 5.0,
    totalBookings: 29,
    hourlyValueEstimated: 1500,
  },
];

export const seedDatabase = async () => {
  try {
    const isConnected = await connectDB();
    if (!isConnected) {
      console.error('[Seed Error] Could not connect to database. Aborting seed.');
      process.exit(1);
    }

    console.log('[Seed] Clearing existing collections...');
    await User.deleteMany({ email: { $in: demoUsers.map((u) => u.email) } });
    await Resource.deleteMany({});
    await Booking.deleteMany({});
    await Notification.deleteMany({});
    await ConditionReport.deleteMany({});
    await Incident.deleteMany({});
    await Dispute.deleteMany({});
    await FairAllocation.deleteMany({});

    console.log('[Seed] Creating demo role accounts...');
    const createdUsers: Record<string, any> = {};
    for (const userData of demoUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers[userData.role] = user;
      console.log(` -> Created ${userData.role.toUpperCase()} account: ${userData.email}`);
    }

    console.log('[Seed] Populating rich institutional resources across all 10 categories...');
    const createdResources = [];
    for (const resData of seedResources) {
      const resource = new Resource({
        ...resData,
        ownerId: createdUsers['owner']?._id,
      });
      await resource.save();
      createdResources.push(resource);
      console.log(` -> Added Resource [${resource.category}]: ${resource.name}`);
    }

    console.log('[Seed] Generating sample bookings...');
    const sampleBookings = [
      {
        userId: createdUsers['student']?._id,
        userName: createdUsers['student']?.name,
        userEmail: createdUsers['student']?.email,
        userDepartment: createdUsers['student']?.department,
        userInstitution: createdUsers['student']?.institution,
        resourceId: createdResources[0]._id,
        resourceName: createdResources[0].name,
        resourceCategory: createdResources[0].category,
        resourceLocation: createdResources[0].location,
        resourceImage: createdResources[0].images[0],
        date: '2026-11-02',
        timeSlot: '10:00 AM - 12:00 PM',
        purpose: 'Synthesis of GaN thin-films for semiconductor capstone project',
        supervisorName: 'Dr. Meera Raman',
        status: 'active',
        notes: 'Specimen substrate prepared in advance',
      },
      {
        userId: createdUsers['student']?._id,
        userName: createdUsers['student']?.name,
        userEmail: createdUsers['student']?.email,
        userDepartment: createdUsers['student']?.department,
        userInstitution: createdUsers['student']?.institution,
        resourceId: createdResources[4]._id, // DGX A100
        resourceName: createdResources[4].name,
        resourceCategory: createdResources[4].category,
        resourceLocation: createdResources[4].location,
        resourceImage: createdResources[4].images[0],
        date: '2026-11-04',
        timeSlot: '02:00 PM - 06:00 PM',
        purpose: 'Fine-tuning multimodal vision-language model for automated defect inspection',
        supervisorName: 'Prof. Suresh Nair',
        status: 'pending',
        notes: 'Requires 4x A100 GPU allocation',
      },
      {
        userId: createdUsers['student']?._id,
        userName: createdUsers['student']?.name,
        userEmail: createdUsers['student']?.email,
        userDepartment: createdUsers['student']?.department,
        userInstitution: createdUsers['student']?.institution,
        resourceId: createdResources[6]._id, // 3D Printer
        resourceName: createdResources[6].name,
        resourceCategory: createdResources[6].category,
        resourceLocation: createdResources[6].location,
        resourceImage: createdResources[6].images[0],
        date: '2026-10-28',
        timeSlot: '11:00 AM - 03:00 PM',
        purpose: 'Robotic end-effector gripper housing prototyping',
        supervisorName: 'Dr. Meera Raman',
        status: 'completed',
        notes: 'Print inspected and validated by lab supervisor',
      },
    ];

    const createdBookings: any[] = [];
    for (const bData of sampleBookings) {
      const b = await Booking.create({
        ...bData,
        startTime: new Date(`${bData.date}T09:00:00`),
        endTime: new Date(`${bData.date}T12:00:00`),
        durationHours: 3,
        auditTrail: [
          {
            transition: 'INITIAL_SEED',
            fromStatus: 'none',
            toStatus: bData.status,
            performedBy: 'System Seed',
            performedByRole: 'system',
            timestamp: new Date(),
            note: 'Seeded initial booking.',
          },
        ],
      });
      createdBookings.push(b);
    }
    console.log(` -> Created ${sampleBookings.length} representative user bookings`);

    console.log('[Seed] Generating system notifications...');
    const sampleNotifications = [
      {
        userId: createdUsers['student']?._id,
        title: 'Booking Confirmed: Cleanroom Bay C',
        message: 'Your slot on Monday, Nov 2 (10 AM - 12 PM) has been confirmed by Dr. Meera Raman.',
        type: 'booking',
        link: '/dashboard/bookings',
        isRead: false,
      },
      {
        userId: createdUsers['student']?._id,
        title: 'Scheduled Maintenance Advisory',
        message: 'The Haas Mini Mill CNC will undergo routine laser calibration this Wednesday 8 AM - 11 AM.',
        type: 'maintenance',
        link: '/dashboard/explore',
        isRead: false,
      },
      {
        targetRole: 'all',
        title: 'New High-Value Asset Catalogued',
        message: 'NVIDIA DGX A100 GPU cluster node is now available for institutional research bookings.',
        type: 'system',
        link: '/dashboard/explore',
        isRead: true,
      },
    ];

    for (const nData of sampleNotifications) {
      await Notification.create(nData);
    }
    console.log(` -> Created ${sampleNotifications.length} system notifications`);

    console.log('[Seed] Generating sample condition reports...');
    await ConditionReport.create([
      {
        resourceId: createdResources[0]._id,
        resourceName: createdResources[0].name,
        bookingId: createdBookings[0]?._id,
        inspectorName: 'Dr. Meera Raman',
        type: 'check_out',
        operationalStatus: 'optimal',
        cleanliness: 'passed',
        meterReading: '124 hrs',
        observations: 'Sputter chamber base pressure reached 1.2e-6 Torr. Nitrogen lines purged and secured.',
      },
      {
        resourceId: createdResources[4]._id,
        resourceName: createdResources[4].name,
        inspectorName: 'Dr. Meera Raman',
        type: 'routine',
        operationalStatus: 'optimal',
        cleanliness: 'passed',
        meterReading: '2,450 GPU-hrs',
        observations: 'All 8x A100 GPU nodes thermal telemetry normal at 42°C under Slurm idle load.',
      },
    ]);

    console.log('[Seed] Generating sample safety incidents...');
    await Incident.create([
      {
        resourceId: createdResources[8]._id, // CNC
        resourceName: createdResources[8].name,
        reportedBy: 'Arun Kumar',
        userEmail: 'student@rentora.edu',
        severity: 'medium',
        title: 'Emergency E-Stop Activated during High-Feed Aluminum Cut',
        description: 'Workpiece clamp loosened slightly causing minor tool chatter. Operator hit emergency stop immediately. No structural damage.',
        status: 'investigating',
        resolutionNotes: 'Spindle runout inspected with dial indicator. Operator cleared for re-machining with mandatory technician supervision.',
      },
    ]);

    console.log('[Seed] Generating sample dispute...');
    await Dispute.create([
      {
        resourceName: 'Haas Mini Mill 3-Axis CNC Machining Center',
        userName: 'Arun Kumar',
        userEmail: 'student@rentora.edu',
        ownerName: 'Dr. Meera Raman',
        reason: 'Timeslot delayed by 30 mins due to previous user late cleanout. Requested 30-min compensatory extension.',
        status: 'open',
        resolution: '',
      },
    ]);

    console.log('[Seed] Initializing institutional fair allocation policy...');
    await FairAllocation.create({
      institution: 'National Institute of Technology',
      maxWeeklyHoursPerStudent: 16,
      maxActiveBookingsPerStudent: 3,
      peakHourThrottling: true,
      emergencyBypassEnabled: true,
      priorityTiers: ['Research Scholar', 'Final Year Student', 'Graduate Student', 'Undergraduate'],
      advanceBookingDays: 14,
      cancellationGraceHours: 2,
    });

    console.log('\n✅ Demo users, resources, bookings, and notifications seeded successfully!');
    console.log('-----------------------------------------------------');
    demoUsers.forEach((u) => {
      console.log(`Role: ${u.role.padEnd(8)} | Email: ${u.email.padEnd(22)} | Pass: ${u.password}`);
    });
    console.log('-----------------------------------------------------');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    process.exit(1);
  }
};

// If run directly
if (process.argv[1]?.includes('seed')) {
  seedDatabase();
}
