import dotenv from 'dotenv';
import { z } from 'zod';

// Garante o carregamento das variáveis do arquivo .env
dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.string().transform((val) => parseInt(val, 10)).default('900000'), // 15 minutos padrão
  RATE_LIMIT_MAX: z.string().transform((val) => parseInt(val, 10)).default('100'), // 100 requisições
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
});

// Realiza o parse das variáveis de ambiente
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Configuração de ambiente inválida:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
