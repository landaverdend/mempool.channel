import { MempoolBandServer } from './server.js';

const PORT = 8080;

const server = new MempoolBandServer({ port: PORT });

// Handle server shutdown
process.on('SIGINT', async () => {
  await server.close();
  process.exit(0);
});
