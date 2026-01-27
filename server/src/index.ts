import { GameServer } from './GameServer';

const PORT = parseInt(process.env.PORT || '8080', 10);

const server = new GameServer(PORT);
server.start();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  server.stop();
  process.exit(0);
});
