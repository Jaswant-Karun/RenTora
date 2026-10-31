"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Booking = void 0;
const mongoose_1 = require("mongoose");
const bookingSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    userName: {
        type: String,
        required: true,
    },
    userEmail: {
        type: String,
        required: true,
    },
    userDepartment: String,
    userInstitution: String,
    resourceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Resource',
        required: true,
        index: true,
    },
    resourceName: {
        type: String,
        required: true,
    },
    resourceCategory: {
        type: String,
        required: true,
    },
    resourceLocation: {
        type: String,
        required: true,
    },
    resourceImage: {
        type: String,
        default: '',
    },
    date: {
        type: String,
        required: true,
        index: true,
    },
    timeSlot: {
        type: String,
        required: true,
    },
    purpose: {
        type: String,
        required: [true, 'Purpose of reservation is required'],
    },
    supervisorName: {
        type: String,
        default: 'Faculty Advisor',
    },
    status: {
        type: String,
        enum: ['active', 'pending', 'completed', 'cancelled'],
        default: 'pending',
        index: true,
    },
    notes: String,
}, {
    timestamps: true,
});
exports.Booking = (0, mongoose_1.model)('Booking', bookingSchema);
