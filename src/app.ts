import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env';
import { errorMiddleware } from './middlewares/error.middleware';
import { HealthController } from './controllers/health.controller';

const app = express();

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// 1. Defesa base contra cabeçalhos e ataques de segurança via Helmet
app.use(helmet());

// 2. Configuração estrita de CORS para evitar origens não autorizadas
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// 3. Controle e proteção contra DoS limitando payload de JSON
app.use(express.json({ limit: '10kb' }));

// 4. Rate Limiting base para proteção contra ataques automatizados e brute-force
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Muitas requisições originadas deste IP, por favor tente novamente mais tarde.',
  },
  standardHeaders: true, // Retorna informação de limite no header RateLimit-*
  legacyHeaders: false, // Desativa os headers X-RateLimit-* antigos
});

app.use(limiter);

// 5. Definição das rotas da API
app.get('/health', HealthController.check);
app.get('/api/v1/health', HealthController.check);

// 6. Tratamento global de erros (deve ser o último a ser registrado)
app.use(errorMiddleware);

export default app;
