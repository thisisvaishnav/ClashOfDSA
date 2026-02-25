import { ServerOptions } from 'socket.io';
import { CLIENT_URL, isProduction } from './env.config';

export const socketConfig: Partial<ServerOptions> = {
  cors: {
    origin: isProduction
      ? [CLIENT_URL]
      : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  pingInterval: 25000,
  pingTimeout: 20000,
  connectTimeout: 10000,
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 1e6,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
  },
};
