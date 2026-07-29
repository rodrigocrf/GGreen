import { Request, Response } from 'express';

export class HealthController {
  public static check(req: Request, res: Response): void {
    const ip = req.ip;
    res.status(200).json({
      success: true,
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'GGreen API Core',
      clientIp: ip,
    });
  }
}
