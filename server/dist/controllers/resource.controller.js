"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResource = exports.getResourceById = exports.getResources = void 0;
const resource_model_js_1 = require("../models/resource.model.js");
const getResources = async (req, res, next) => {
    try {
        const { search, category, institution, location, availability, resourceType, eligibility, date, sort, page = '1', limit = '12', } = req.query;
        const query = {};
        // Search query
        if (search && typeof search === 'string' && search.trim() !== '') {
            const searchRegex = new RegExp(search.trim(), 'i');
            query.$or = [
                { name: searchRegex },
                { description: searchRegex },
                { tags: searchRegex },
                { location: searchRegex },
                { institution: searchRegex },
                { ownerName: searchRegex },
            ];
        }
        // Category filter
        if (category && typeof category === 'string' && category !== 'All' && category !== 'all') {
            query.category = category;
        }
        // Institution filter
        if (institution && typeof institution === 'string' && institution !== 'All' && institution !== 'all') {
            query.institution = new RegExp(institution, 'i');
        }
        // Location filter
        if (location && typeof location === 'string' && location !== 'All' && location !== 'all') {
            query.location = new RegExp(location, 'i');
        }
        // Availability filter
        if (availability && typeof availability === 'string' && availability !== 'All' && availability !== 'all') {
            if (availability === 'available' || availability === 'Available Now') {
                query.status = 'available';
            }
            else if (availability === 'reserved') {
                query.status = 'reserved';
            }
            else if (availability === 'maintenance') {
                query.status = 'maintenance';
            }
        }
        // Resource Type filter
        if (resourceType && typeof resourceType === 'string' && resourceType !== 'All' && resourceType !== 'all') {
            query.resourceType = resourceType;
        }
        // Eligibility filter
        if (eligibility && typeof eligibility === 'string' && eligibility !== 'All' && eligibility !== 'all') {
            query.eligibility = new RegExp(eligibility, 'i');
        }
        // Date filter
        if (date && typeof date === 'string' && date.trim() !== '') {
            // If date specified, check if available on that date
            query.status = { $ne: 'maintenance' };
        }
        // Sorting
        let sortOptions = { createdAt: -1 };
        if (sort === 'popular') {
            sortOptions = { totalBookings: -1 };
        }
        else if (sort === 'rating') {
            sortOptions = { rating: -1 };
        }
        else if (sort === 'name') {
            sortOptions = { name: 1 };
        }
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, parseInt(limit, 10) || 12);
        const skip = (pageNum - 1) * limitNum;
        const [resources, total] = await Promise.all([
            resource_model_js_1.Resource.find(query).sort(sortOptions).skip(skip).limit(limitNum),
            resource_model_js_1.Resource.countDocuments(query),
        ]);
        // Distinct filter metadata for frontend dropdowns
        const [institutions, locations, categories] = await Promise.all([
            resource_model_js_1.Resource.distinct('institution'),
            resource_model_js_1.Resource.distinct('location'),
            resource_model_js_1.Resource.distinct('category'),
        ]);
        res.status(200).json({
            success: true,
            data: resources,
            meta: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                filterOptions: {
                    institutions,
                    locations,
                    categories,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getResources = getResources;
const getResourceById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const resource = await resource_model_js_1.Resource.findById(id);
        if (!resource) {
            res.status(404).json({
                success: false,
                message: 'Resource not found or has been decommissioned',
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: resource,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getResourceById = getResourceById;
const createResource = async (req, res, next) => {
    try {
        const payload = req.body;
        if (req.user) {
            payload.ownerId = req.user._id;
            payload.ownerName = req.user.name;
            payload.ownerEmail = req.user.email;
            payload.ownerDepartment = req.user.department || 'General';
            payload.ownerAvatar = req.user.avatar || '';
        }
        const resource = await resource_model_js_1.Resource.create(payload);
        res.status(201).json({
            success: true,
            message: 'Resource successfully catalogued into institutional pool',
            data: resource,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createResource = createResource;
