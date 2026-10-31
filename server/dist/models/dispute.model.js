"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dispute = void 0;
const mongoose_1 = require("mongoose");
const disputeSchema = new mongoose_1.Schema({
    bookingId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Booking',
    },
    resourceName: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
        required: true,
    },
    userEmail: {
        type: String,
        required: true,
    },
    ownerName: {
        type: String,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['open', 'under_review', 'resolved'],
        default: 'open',
        index: true,
    },
    resolution: String,
}, {
    timestamps: true,
});
exports.Dispute = (0, mongoose_1.model)('Dispute', disputeSchema);
