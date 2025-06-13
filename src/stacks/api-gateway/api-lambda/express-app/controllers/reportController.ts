import { Request, Response } from 'express';
import ReportService from '../services/reportService';

// Create a new report
export const createReport = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const username = req.requestContext.authorizer.jwt.claims.username;
    const vehicleId = 'vehicle001';
    const checklist = req.body;
    const data = await ReportService.createReport({ username, vehicleId, checklist });

    res.json({ msg: 'OK', data: data });
  } catch (error) {
    console.error('Error creating report: ', error);
    res.sendStatus(500); // Internal server error
  }
};

// Get a report by its timestamp
export const getReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = req.requestContext.authorizer.jwt.claims.username;
    const timestamp = req.params.timestamp;

    const report = await ReportService.getReport(ownerId, timestamp);

    if (report) {
      res.json(report); // Send the found report
    } else {
      res.status(404).json({ message: 'Report not found' });
    }
  } catch (error) {
    console.error('Error in getReport: ', error);
    res.sendStatus(500); // Internal server error
  }
};

// Update a report
export const updateReport = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const ownerId = req.requestContext.authorizer.jwt.claims.username;
    const timestamp = req.params.timestamp;
    const { type } = req.body;

    const updatedReport = await ReportService.updateReport(
      ownerId,
      timestamp,
      type,
    );

    if (updatedReport) {
      res.json(updatedReport); // Send the updated report
    } else {
      res.status(404).json({ message: 'Report not found' });
    }
  } catch (error) {
    console.error('Error in updateReport: ', error);
    res.sendStatus(500); // Internal server error
  }
};

// Delete a report
export const deleteReport = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const ownerId = req.requestContext.authorizer.jwt.claims.username;
    const timestamp = req.params.timestamp;

    await ReportService.deleteReport(ownerId, timestamp);

    res.json({ message: 'Report deleted successfully' }); // Send success message
  } catch (error) {
    console.error('Error in deleteReport: ', error);
    res.sendStatus(500); // Internal server error
  }
};

// Get all reports for a given ownerId with pagination
export const getAllReports = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const username = req.requestContext.authorizer.jwt.claims.username;
  const cursor = req.query.cursor as string;
  const last = req.query.last as string;
  const limit = parseInt(req.query.limit as string, 10) || 2;
  const all = parseInt(req.query.all as string, 10);

  if (!username) {
    res.status(400).json({ message: 'Missing username in request context' });
    return;
  }

  try {
    const { items, lastEvaluatedKey } =
      await ReportService.getAllReports({
        driverId: username,
        limit,
        lastEvaluatedKey: { last, cursor },
        all,
      });

    res.status(200).json({
      items,
      limit,
      lastEvaluatedKey,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
};
