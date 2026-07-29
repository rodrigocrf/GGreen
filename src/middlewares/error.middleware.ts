import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

// Interface customizada de erro com status code opcional
export interface AppError extends Error {
  statusCode?: number;
}

export function errorMiddleware(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Se os headers já foram enviados, delega para o tratamento padrão do Express
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';

  // Log detalhado no console do servidor (seguro)
  console.error(`[Erro GGreen] - [${req.method}] ${req.url} - Status ${statusCode}:`, {
    message: err.message,
    stack: err.stack,
  });

  // Resposta segura ao cliente
  if (env.NODE_ENV === 'production') {
    res.status(statusCode).json({
      success: false,
      message: statusCode === 500 ? 'Erro interno no servidor de dados.' : message,
    });
  } else {
    // Ambiente de desenvolvimento: expõe detalhes úteis
    res.status(statusCode).json({
      success: false,
      message,
      stack: err.stack,
    });
  }
}
