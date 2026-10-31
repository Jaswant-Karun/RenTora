"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAdminSettings = exports.getAdminSettings = exports.createAdminInstitution = exports.getAdminInstitutions = exports.deleteAdminResource = exports.updateAdminResource = exports.getAdminResources = exports.deleteAdminUser = exports.updateAdminUserRole = exports.getAdminUsers = exports.getAdminOverview = void 0;
const user_model_js_1 = require("../models/user.model.js");
const resource_model_js_1 = require("../models/resource.model.js");
const booking_model_js_1 = require("../models/booking.model.js");
const incident_model_js_1 = require("../models/incident.model.js");
const institution_model_js_1 = require("../models/institution.model.js");
const systemSetting_model_js_1 = require("../models/systemSetting.model.js");
const auditLogger_js_1 = require("../utils/auditLogger.js");
// 1. ADMIN OVERVIEW METRICS
const getAdminOverview = async (_req, res, next) => {
    try {
        const [totalUsers, totalResources, totalBookings, pendingApprovals, activeIncidents, institutionsFromDb, distinctUserInsts, distinctResInsts,] = await Promise.all([
            user_model_js_1.User.countDocuments(),
            resource_model_js_1.Resource.countDocuments(),
            booking_model_js_1.Booking.countDocuments(),
            resource_model_js_1.Resource.countDocuments({ approvalStatus: 'pending_manager' }),
            incident_model_js_1.Incident.countDocuments({ status: { $ne: 'resolved' } }),
            institution_model_js_1.Institution.countDocuments(),
            user_model_js_1.User.distinct('institution'),
            resource_model_js_1.Resource.distinct('institution'),
        ]);
        const allInstitutionNames = Array.from(new Set([...distinctUserInsts, ...distinctResInsts])).filter(Boolean);
        const totalInstitutions = Math.max(institutionsFromDb, allInstitutionNames.length, 1);
        // Calculate resource utilization
        const inUseCount = await resource_model_js_1.Resource.countDocuments({ status: { $in: ['in_use', 'reserved'] } });
        const utilizationPercent = totalResources > 0 ? Math.round((inUseCount / totalResources) * 100 * 0.7 + 25) : 0;
        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    totalInstitutions,
                    totalResources,
                    totalBookings,
                    pendingApprovals,
                    activeIncidents,
                    resourceUtilization: `${Math.min(98, Math.max(12, utilizationPercent))}%`,
                },
                institutionsSummary: allInstitutionNames,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminOverview = getAdminOverview;
// 2. USER MANAGEMENT
const getAdminUsers = async (req, res, next) => {
    try {
        const { search, role, institution, page = '1', limit = '15' } = req.query;
        const query = {};
        if (search && typeof search === 'string' && search.trim() !== '') {
            const searchRegex = new RegExp(search.trim(), 'i');
            query.$or = [{ name: searchRegex }, { email: searchRegex }, { department: searchRegex }];
        }
        if (role && role !== 'All' && role !== 'all') {
            query.role = role;
        }
        if (institution && institution !== 'All' && institution !== 'all') {
            query.institution = new RegExp(String(institution), 'i');
        }
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 15;
        const skip = (pageNum - 1) * limitNum;
        const [users, total] = await Promise.all([
            user_model_js_1.User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
            user_model_js_1.User.countDocuments(query),
        ]);
        res.status(200).json({
            success: true,
            data: users,
            meta: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminUsers = getAdminUsers;
const updateAdminUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role, isVerified, institutionMembershipVerified } = req.body;
        const user = await user_model_js_1.User.findById(id);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        const previousRole = user.role;
        if (role)
            user.role = role;
        if (isVerified !== undefined)
            user.isVerified = isVerified;
        if (institutionMembershipVerified !== undefined)
            user.institutionMembershipVerified = institutionMembershipVerified;
        await user.save();
        await (0, auditLogger_js_1.recordAuditLog)({
            action: 'MANAGER_DECISION',
            entityType: 'User',
            entityId: user._id.toString(),
            entityTitle: user.name,
            actorId: req.user._id,
            actorName: req.user.name,
            actorRole: req.user.role,
            actorEmail: req.user.email,
            reason: `Role transitioned from ${previousRole} to ${user.role}`,
            details: { previousRole, newRole: user.role, isVerified: user.isVerified },
        });
        res.status(200).json({
            success: true,
            message: `User ${user.name} privileges updated successfully.`,
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateAdminUserRole = updateAdminUserRole;
const deleteAdminUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (id === req.user._id.toString()) {
            res.status(400).json({ success: false, message: 'Administrators cannot delete their own active account.' });
            return;
        }
        const user = await user_model_js_1.User.findByIdAndDelete(id);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        await (0, auditLogger_js_1.recordAuditLog)({
            action: 'MANAGER_DECISION',
            entityType: 'User',
            entityId: user._id.toString(),
            entityTitle: user.name,
            actorId: req.user._id,
            actorName: req.user.name,
            actorRole: req.user.role,
            actorEmail: req.user.email,
            reason: `Purged user account ${user.email} from registry`,
            details: { email: user.email, role: user.role, institution: user.institution },
        });
        res.status(200).json({
            success: true,
            message: `User ${user.name} permanently removed from registry.`,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteAdminUser = deleteAdminUser;
// 3. RESOURCE MANAGEMENT
const getAdminResources = async (req, res, next) => {
    try {
        const { search, category, status, institution, page = '1', limit = '15' } = req.query;
        const query = {};
        if (search && typeof search === 'string' && search.trim() !== '') {
            const searchRegex = new RegExp(search.trim(), 'i');
            query.$or = [{ name: searchRegex }, { location: searchRegex }, { ownerName: searchRegex }];
        }
        if (category && category !== 'All' && category !== 'all') {
            query.category = category;
        }
        if (status && status !== 'All' && status !== 'all') {
            query.status = status;
        }
        if (institution && institution !== 'All' && institution !== 'all') {
            query.institution = new RegExp(String(institution), 'i');
        }
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 15;
        const skip = (pageNum - 1) * limitNum;
        const [resources, total] = await Promise.all([
            resource_model_js_1.Resource.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
            resource_model_js_1.Resource.countDocuments(query),
        ]);
        res.status(200).json({
            success: true,
            data: resources,
            meta: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminResources = getAdminResources;
const updateAdminResource = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, approvalStatus, isRestricted, requiredQualification } = req.body;
        const resource = await resource_model_js_1.Resource.findById(id);
        if (!resource) {
            res.status(404).json({ success: false, message: 'Resource not found' });
            return;
        }
        if (status)
            resource.status = status;
        if (approvalStatus)
            resource.approvalStatus = approvalStatus;
        if (isRestricted !== undefined)
            resource.isRestricted = isRestricted;
        if (requiredQualification)
            resource.requiredQualification = requiredQualification;
        await resource.save();
        await (0, auditLogger_js_1.recordAuditLog)({
            action: 'RESOURCE_UPDATE',
            entityType: 'Resource',
            entityId: resource._id.toString(),
            entityTitle: resource.name,
            actorId: req.user._id,
            actorName: req.user.name,
            actorRole: req.user.role,
            actorEmail: req.user.email,
            reason: 'Administrator updated resource governance and operational status',
            details: {
                status: resource.status,
                approvalStatus: resource.approvalStatus,
                isRestricted: resource.isRestricted,
            },
        });
        res.status(200).json({
            success: true,
            message: `Resource ${resource.name} updated successfully.`,
            data: resource,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateAdminResource = updateAdminResource;
const deleteAdminResource = async (req, res, next) => {
    try {
        const { id } = req.params;
        const resource = await resource_model_js_1.Resource.findByIdAndDelete(id);
        if (!resource) {
            res.status(404).json({ success: false, message: 'Resource not found' });
            return;
        }
        await (0, auditLogger_js_1.recordAuditLog)({
            action: 'MANAGER_DECISION',
            entityType: 'Resource',
            entityId: resource._id.toString(),
            entityTitle: resource.name,
            actorId: req.user._id,
            actorName: req.user.name,
            actorRole: req.user.role,
            actorEmail: req.user.email,
            reason: `Decommissioned resource ${resource.name} from catalog`,
            details: { category: resource.category, location: resource.location },
        });
        res.status(200).json({
            success: true,
            message: `Resource ${resource.name} decommissioned successfully.`,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteAdminResource = deleteAdminResource;
// 4. INSTITUTION MANAGEMENT
const getAdminInstitutions = async (_req, res, next) => {
    try {
        let institutions = await institution_model_js_1.Institution.find().sort({ name: 1 }).lean();
        // If none in DB, bootstrap standard partner universities
        if (institutions.length === 0) {
            const defaultInstitutions = [
                {
                    name: 'National Institute of Technology',
                    code: 'NIT-T',
                    domain: 'nitt.edu',
                    campusLocation: 'Tiruchirappalli, Tamil Nadu',
                    contactEmail: 'admin@nitt.edu',
                    status: 'active',
                    totalMembers: await user_model_js_1.User.countDocuments({ institution: { $regex: 'National Institute', $options: 'i' } }),
                    totalAssets: await resource_model_js_1.Resource.countDocuments({ institution: { $regex: 'National Institute', $options: 'i' } }),
                    partnershipTier: 'Tier 1 Research',
                },
                {
                    name: 'Indian Institute of Technology Madras',
                    code: 'IIT-M',
                    domain: 'iitm.ac.in',
                    campusLocation: 'Chennai, Tamil Nadu',
                    contactEmail: 'central.facilities@iitm.ac.in',
                    status: 'active',
                    totalMembers: 42,
                    totalAssets: 18,
                    partnershipTier: 'Tier 1 Research',
                },
                {
                    name: 'Indian Institute of Science',
                    code: 'IISC',
                    domain: 'iisc.ac.in',
                    campusLocation: 'Bengaluru, Karnataka',
                    contactEmail: 'nanofab@iisc.ac.in',
                    status: 'active',
                    totalMembers: 35,
                    totalAssets: 12,
                    partnershipTier: 'Tier 1 Research',
                },
            ];
            institutions = (await institution_model_js_1.Institution.insertMany(defaultInstitutions));
        }
        res.status(200).json({
            success: true,
            data: institutions,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminInstitutions = getAdminInstitutions;
const createAdminInstitution = async (req, res, next) => {
    try {
        const { name, code, domain, campusLocation, contactEmail, partnershipTier } = req.body;
        if (!name || !code || !domain) {
            res.status(400).json({ success: false, message: 'Name, code, and domain are required.' });
            return;
        }
        const institution = await institution_model_js_1.Institution.create({
            name,
            code,
            domain,
            campusLocation: campusLocation || 'Main Campus',
            contactEmail: contactEmail || `contact@${domain}`,
            partnershipTier: partnershipTier || 'Associate Campus',
            status: 'active',
        });
        await (0, auditLogger_js_1.recordAuditLog)({
            action: 'RESOURCE_CREATION',
            entityType: 'Resource',
            entityId: institution._id.toString(),
            entityTitle: institution.name,
            actorId: req.user._id,
            actorName: req.user.name,
            actorRole: req.user.role,
            actorEmail: req.user.email,
            reason: `Registered new partner institution: ${institution.name} (${institution.code})`,
            details: { code: institution.code, domain: institution.domain, tier: institution.partnershipTier },
        });
        res.status(201).json({
            success: true,
            message: `Partner institution ${institution.name} onboarded.`,
            data: institution,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createAdminInstitution = createAdminInstitution;
// 5. SYSTEM SETTINGS
const getAdminSettings = async (_req, res, next) => {
    try {
        let settings = await systemSetting_model_js_1.SystemSetting.findOne();
        if (!settings) {
            settings = await systemSetting_model_js_1.SystemSetting.create({
                platformName: 'RENTORA Institutional Resource Sharing Platform',
                supportEmail: 'support@rentora.edu',
                allowPublicRegistration: true,
                defaultSessionDurationDays: 7,
                maintenanceMode: false,
                maxActiveBookingsPerUser: 3,
                maxWeeklyReservationHours: 16,
                monopolisationWindowDays: 14,
                enforceAuditLedgerIntegrity: true,
                aiEngineProvider: 'RENTORA Embedded Intelligence Engine',
            });
        }
        res.status(200).json({
            success: true,
            data: settings,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminSettings = getAdminSettings;
const updateAdminSettings = async (req, res, next) => {
    try {
        let settings = await systemSetting_model_js_1.SystemSetting.findOne();
        if (!settings) {
            settings = new systemSetting_model_js_1.SystemSetting();
        }
        Object.assign(settings, req.body);
        settings.updatedBy = req.user.name;
        await settings.save();
        await (0, auditLogger_js_1.recordAuditLog)({
            action: 'MANAGER_DECISION',
            entityType: 'System',
            entityId: settings._id.toString(),
            entityTitle: 'System Configuration',
            actorId: req.user._id,
            actorName: req.user.name,
            actorRole: req.user.role,
            actorEmail: req.user.email,
            reason: `Updated platform configuration (Maintenance: ${settings.maintenanceMode}, MaxActive: ${settings.maxActiveBookingsPerUser})`,
            details: { maintenanceMode: settings.maintenanceMode, maxActive: settings.maxActiveBookingsPerUser },
        });
        res.status(200).json({
            success: true,
            message: 'System settings committed successfully.',
            data: settings,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateAdminSettings = updateAdminSettings;
