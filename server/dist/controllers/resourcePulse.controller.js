"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportResourcePulseCSV = exports.getResourcePulseMetrics = void 0;
const resourcePulse_service_js_1 = require("../services/resourcePulse.service.js");
const getResourcePulseMetrics = async (req, res, next) => {
    try {
        const { range, startDate, endDate } = req.query;
        const filter = resourcePulse_service_js_1.ResourcePulseService.resolveDateRange(range, startDate, endDate);
        const metrics = await resourcePulse_service_js_1.ResourcePulseService.calculateMetrics(filter, {
            id: req.user._id,
            role: req.user.role,
            email: req.user.email,
        });
        res.status(200).json({
            success: true,
            data: metrics,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getResourcePulseMetrics = getResourcePulseMetrics;
const exportResourcePulseCSV = async (req, res, next) => {
    try {
        const { range, startDate, endDate } = req.query;
        const filter = resourcePulse_service_js_1.ResourcePulseService.resolveDateRange(range, startDate, endDate);
        const metrics = await resourcePulse_service_js_1.ResourcePulseService.calculateMetrics(filter, {
            id: req.user._id,
            role: req.user.role,
            email: req.user.email,
        });
        const csvContent = resourcePulse_service_js_1.ResourcePulseService.generateCSVReport(metrics);
        const filename = `Rentora-ResourcePulse-${filter.label.replace(/[^a-zA-Z0-9_-]/g, '_')}-${new Date()
            .toISOString()
            .split('T')[0]}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(csvContent);
    }
    catch (error) {
        next(error);
    }
};
exports.exportResourcePulseCSV = exportResourcePulseCSV;
