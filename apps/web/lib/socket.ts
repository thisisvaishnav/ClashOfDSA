import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

let socket: Socket | null = null;

/**
 * Extract the Better Auth session token from browser cookies.
 * The backend socket middleware expects this as a Bearer token.
 */
const getSessionToken = (): string | null => {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(
    /(?:^|;\s*)better-auth\.session_token=([^;]*)/
  );

  return match ? decodeURIComponent(match[1] ?? ""  ) : null;
};

/**
 * Get the existing socket instance (may be null if not yet connected).
 */
export const getSocket = (): Socket | null => socket;

/**
 * Create & connect a Socket.IO client authenticated with the session token.
 * Returns the existing connected socket if one already exists.
 */
export const connectSocket = (): Socket => {
  if (socket?.connected) return socket;

  if (socket) {
    socket.disconnect();
  }

  const token = getSessionToken();

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
  });

  return socket;
};

/**
 * Disconnect and destroy the socket instance.
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
