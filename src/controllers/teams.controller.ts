import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

export class TeamsController {
  public static getAll(_req: Request, res: Response): void {
    try {
      // Resolve o caminho de forma segura tanto em src/ quanto em dist/
      const filePath = path.join(__dirname, '..', '..', 'data', 'teams.json');
      
      if (!fs.existsSync(filePath)) {
        res.status(404).json({
          success: false,
          message: 'Base de dados de times não encontrada.',
        });
        return;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const teams = JSON.parse(fileContent);

      res.status(200).json({
        success: true,
        data: teams,
      });
    } catch (error) {
      console.error('Erro ao ler base de dados de times:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao processar dados das equipes.',
      });
    }
  }
}
