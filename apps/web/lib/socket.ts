import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

let socket: Socket | null = null;
let connectionRefCount = 0;

const getSessionToken = (): string | null => {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(
    /(?:^|;\s*)better-auth\.session_token=([^;]*)/
  );

  return match ? decodeURIComponent(match[1] ?? "") : null;
};

export const getSocket = (): Socket | null => socket;

export const connectSocket = (): Socket => {
  connectionRefCount++;

  if (socket?.connected) return socket;

  if (socket && !socket.connected) {
    socket.connect();
    return socket;
  }

  const token = getSessionToken();

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return socket;
};

export const disconnectSocket = (): void => {
  connectionRefCount = Math.max(0, connectionRefCount - 1);

  if (connectionRefCount === 0 && socket) {
    socket.disconnect();
    socket = null;
  }
};
