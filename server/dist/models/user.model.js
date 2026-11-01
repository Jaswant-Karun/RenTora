"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        minlength: 2,
        maxlength: 60,
    },
    email: {
        type: String,
        required: [true, 'Email address is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false, // Never return password by default
    },
    role: {
        type: String,
        enum: ['student', 'owner', 'manager', 'admin'],
        default: 'student',
        required: true,
    },
    institution: {
        type: String,
        required: [true, 'Institution/College name is required'],
        trim: true,
    },
    department: {
        type: String,
        trim: true,
        default: 'General',
    },
    phone: {
        type: String,
        trim: true,
    },
    avatar: {
        type: String,
        default: '',
    },
    isVerified: {
        type: Boolean,
        default: true,
    },
    institutionMembershipVerified: {
        type: Boolean,
        default: true,
    },
    academicQualification: {
        type: String,
        default: 'Undergraduate',
        enum: ['Undergraduate', 'Graduate Student', 'Final Year Student', 'PhD Scholar', 'Faculty', 'Postdoctoral Researcher'],
    },
    trainingCertifications: {
        type: [
            {
                name: { type: String, required: true },
                certifiedDate: { type: Date, default: Date.now },
                expiresAt: { type: Date },
                credentialId: { type: String, required: true },
            },
        ],
        default: [
            {
                name: 'Basic Lab Safety Induction',
                certifiedDate: new Date('2025-01-15'),
                credentialId: 'CERT-SAF-001',
            },
            {
                name: 'Equipment Handling Clearance',
                certifiedDate: new Date('2025-02-01'),
                credentialId: 'CERT-EHC-042',
            },
        ],
    },
    historicalUsage: {
        weeklyHoursUsed: { type: Number, default: 0 },
        totalHoursLogged: { type: Number, default: 0 },
        totalCompletedBookings: { type: Number, default: 0 },
        penaltyPoints: { type: Number, default: 0 },
        monopolisationCooldownUntil: { type: Date },
    },
    bio: {
        type: String,
        trim: true,
        maxlength: 300,
        default: '',
    },
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            delete ret.password;
            delete ret.__v;
            return ret;
        },
    },
    toObject: {
        transform(_doc, ret) {
            delete ret.password;
            delete ret.__v;
            return ret;
        },
    },
});
userSchema.index({ role: 1, institution: 1 });
// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    try {
        const salt = await bcryptjs_1.default.genSalt(10);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (err) {
        next(err);
    }
});
// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
exports.User = (0, mongoose_1.model)('User', userSchema);
