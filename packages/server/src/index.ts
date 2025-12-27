import { MempoolBandServer } from './server.js';

const PORT = parseInt(process.env.PORT || '8080', 10);
const STATIC_DIR = process.env.STATIC_DIR;

const server = new MempoolBandServer({
  port: PORT,
  staticDir: STATIC_DIR,
});

// Handle server shutdown
process.on('SIGINT', async () => {
  await server.close();
  process.exit(0);
});
