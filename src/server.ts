import app from './app';
import { env } from './config/env';

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Servidor GGreen rodando na porta ${env.PORT} em modo [${env.NODE_ENV}]`);
});

// Tratamento de promessas rejeitadas e não tratadas (unhandledRejection)
process.on('unhandledRejection', (reason: Error) => {
  console.error('❌ Rejeição de Promessa Não Tratada detectada:', reason.message || reason);
  console.error(reason.stack || 'Sem Stack Trace disponível');
  
  // Encerramento gracioso do servidor Express antes de fechar o processo
  server.close(() => {
    process.exit(1);
  });
});

// Tratamento de exceções síncronas não tratadas (uncaughtException)
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Exceção Não Tratada fatal detectada:', error.message);
  console.error(error.stack || 'Sem Stack Trace disponível');
  
  server.close(() => {
    process.exit(1);
  });
});
