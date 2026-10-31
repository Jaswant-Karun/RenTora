import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ResourcePulseService } from '../services/resourcePulse.service.js';

export const getResourcePulseMetrics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { range, startDate, endDate } = req.query;

    const filter = ResourcePulseService.resolveDateRange(
      range as string,
      startDate as string,
      endDate as string
    );

    const metrics = await ResourcePulseService.calculateMetrics(filter, {
      id: req.user!._id,
      role: req.user!.role,
      email: req.user!.email,
    });

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    next(error);
  }
};

export const exportResourcePulseCSV = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { range, startDate, endDate } = req.query;

    const filter = ResourcePulseService.resolveDateRange(
      range as string,
      startDate as string,
      endDate as string
    );

    const metrics = await ResourcePulseService.calculateMetrics(filter, {
      id: req.user!._id,
      role: req.user!.role,
      email: req.user!.email,
    });

    const csvContent = ResourcePulseService.generateCSVReport(metrics);

    const filename = `Rentora-ResourcePulse-${filter.label.replace(/[^a-zA-Z0-9_-]/g, '_')}-${new Date()
      .toISOString()
      .split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error: any) {
    next(error);
  }
};
