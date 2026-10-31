import { Request, Response } from 'express';
import { EcoShareService } from '../services/ecoShare.service.js';

export class EcoShareController {
  /**
   * Get EcoShare sustainability metrics and insights
   */
  public static async getInsights(req: Request, res: Response): Promise<void> {
    try {
      const institution = req.query.institution as string | undefined;
      const insights = await EcoShareService.generateInsights(institution);

      res.status(200).json({
        success: true,
        data: insights,
      });
    } catch (error: any) {
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
  public static async getAssumptions(_req: Request, res: Response): Promise<void> {
    try {
      const config = await EcoShareService.getSustainabilityConfig();

      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error: any) {
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
  public static async updateAssumptions(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const userName = user?.name || user?.email || 'Authorized Manager';

      const updated = await EcoShareService.updateSustainabilityConfig(req.body, userName);

      res.status(200).json({
        success: true,
        message: 'Institutional sustainability calculation assumptions updated successfully',
        data: updated,
      });
    } catch (error: any) {
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
  public static async exportReport(req: Request, res: Response): Promise<void> {
    try {
      const institution = req.query.institution as string | undefined;
      const csvData = await EcoShareService.generateSustainabilityCSV(institution);

      const filename = `rentora-ecoshare-sustainability-report-${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvData);
    } catch (error: any) {
      console.error('Error in EcoShareController.exportReport:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export sustainability impact report',
        error: error.message,
      });
    }
  }
}
