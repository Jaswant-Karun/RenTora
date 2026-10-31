"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resource = void 0;
const mongoose_1 = require("mongoose");
const resourceSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Resource name is required'],
        trim: true,
        index: true,
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: [
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
        ],
        index: true,
    },
    resourceType: {
        type: String,
        required: true,
        default: 'Equipment',
        index: true,
    },
    institution: {
        type: String,
        required: [true, 'Institution is required'],
        trim: true,
        index: true,
    },
    location: {
        type: String,
        required: [true, 'Campus location is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Detailed description is required'],
    },
    images: {
        type: [String],
        required: true,
        default: [],
    },
    ownerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    ownerName: {
        type: String,
        required: true,
        default: 'Lab Custodian',
    },
    ownerEmail: {
        type: String,
        required: true,
        default: 'lab@rentora.edu',
    },
    ownerDepartment: {
        type: String,
        required: true,
        default: 'General Faculty',
    },
    ownerAvatar: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['available', 'reserved', 'maintenance', 'in_use'],
        default: 'available',
        index: true,
    },
    availabilityText: {
        type: String,
        default: 'Available Today',
    },
    availableDates: {
        type: [String],
        default: [],
    },
    eligibility: {
        type: String,
        default: 'All Enrolled Students & Faculty',
        index: true,
    },
    isRestricted: {
        type: Boolean,
        default: false,
        index: true,
    },
    requiredQualification: {
        type: String,
        default: 'None',
    },
    requiredCertifications: {
        type: [String],
        default: [],
    },
    conditionPhotosConfigured: {
        type: Boolean,
        default: true,
    },
    approvalRequired: {
        type: Boolean,
        default: true,
    },
    approvalStatus: {
        type: String,
        enum: ['approved', 'pending_manager', 'rejected'],
        default: 'approved',
        index: true,
    },
    availabilitySchedule: {
        type: String,
        default: 'Monday - Friday (09:00 - 18:00)',
    },
    minBookingDuration: {
        type: String,
        default: '1 hour',
    },
    maxBookingDuration: {
        type: String,
        default: '4 hours',
    },
    supervisionRequirement: {
        type: String,
        default: 'Self-Operated after training clearance',
    },
    depositConditions: {
        type: String,
        default: 'None',
    },
    specifications: {
        type: Map,
        of: String,
        default: {},
    },
    usageInstructions: {
        type: [String],
        default: [],
    },
    trainingRequired: {
        type: String,
        default: 'Basic Lab Safety Induction',
    },
    safetyInstructions: {
        type: [String],
        default: [],
    },
    bookingConditions: {
        type: [String],
        default: [],
    },
    tags: {
        type: [String],
        default: [],
    },
    featured: {
        type: Boolean,
        default: false,
        index: true,
    },
    rating: {
        type: Number,
        default: 4.8,
    },
    totalBookings: {
        type: Number,
        default: 0,
    },
    hourlyValueEstimated: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});
// Full text search index
resourceSchema.index({
    name: 'text',
    description: 'text',
    category: 'text',
    institution: 'text',
    tags: 'text',
});
// High-speed compound filtering indexes
resourceSchema.index({ category: 1, status: 1, institution: 1 });
resourceSchema.index({ ownerId: 1, status: 1 });
resourceSchema.index({ featured: 1, status: 1 });
exports.Resource = (0, mongoose_1.model)('Resource', resourceSchema);
