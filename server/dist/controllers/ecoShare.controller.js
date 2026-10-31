"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EcoShareController = void 0;
const ecoShare_service_js_1 = require("../services/ecoShare.service.js");
class EcoShareController {
    /**
     * Get EcoShare sustainability metrics and insights
     */
    static async getInsights(req, res) {
        try {
            const institution = req.query.institution;
            const insights = await ecoShare_service_js_1.EcoShareService.generateInsights(institution);
            res.status(200).json({
                success: true,
                data: insights,
            });
        }
        catch (error) {
            console.error('Error in EcoShareController.getInsights:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate EcoShare sustainability telemetry',
                error: error.message,
            });
        }
    }
    /**
     * Get current institutional sustainability calculation assumptions
     */
    static async getAssumptions(_req, res) {
        try {
            const config = await ecoShare_service_js_1.EcoShareService.getSustainabilityConfig();
            res.status(200).json({
                success: true,
                data: config,
            });
        }
        catch (error) {
            console.error('Error in EcoShareController.getAssumptions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve sustainability assumptions',
                error: error.message,
            });
        }
    }
    /**
     * Update sustainability assumptions (Institution Manager / Admin)
     */
    static async updateAssumptions(req, res) {
        try {
            const user = req.user;
            const userName = user?.name || user?.email || 'Authorized Manager';
            const updated = await ecoShare_service_js_1.EcoShareService.updateSustainabilityConfig(req.body, userName);
            res.status(200).json({
                success: true,
                message: 'Institutional sustainability calculation assumptions updated successfully',
                data: updated,
            });
        }
        catch (error) {
            console.error('Error in EcoShareController.updateAssumptions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update sustainability assumptions',
                error: error.message,
            });
        }
    }
    /**
     * Download EcoShare Sustainability Impact Report as CSV
     */
    static async exportReport(req, res) {
        try {
            const institution = req.query.institution;
            const csvData = await ecoShare_service_js_1.EcoShareService.generateSustainabilityCSV(institution);
            const filename = `rentora-ecoshare-sustainability-report-${new Date().toISOString().split('T')[0]}.csv`;
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.status(200).send(csvData);
        }
        catch (error) {
            console.error('Error in EcoShareController.exportReport:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to export sustainability impact report',
                error: error.message,
            });
        }
    }
}
exports.EcoShareController = EcoShareController;
