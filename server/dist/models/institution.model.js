"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Institution = void 0;
const mongoose_1 = require("mongoose");
const institutionSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Institution name is required'],
        unique: true,
        trim: true,
        index: true,
    },
    code: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        index: true,
    },
    domain: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    campusLocation: {
        type: String,
        required: true,
    },
    contactEmail: {
        type: String,
        required: true,
        lowercase: true,
    },
    status: {
        type: String,
        enum: ['active', 'pending', 'suspended'],
        default: 'active',
        index: true,
    },
    totalMembers: {
        type: Number,
        default: 0,
    },
    totalAssets: {
        type: Number,
        default: 0,
    },
    partnershipTier: {
        type: String,
        enum: ['Tier 1 Research', 'Associate Campus', 'Consortium Partner'],
        default: 'Tier 1 Research',
    },
    joinedDate: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
exports.Institution = (0, mongoose_1.model)('Institution', institutionSchema);
