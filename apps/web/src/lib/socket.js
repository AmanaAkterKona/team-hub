import { io } from "socket.io-client";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
      withCredentials: true,
      autoConnect: false,
    });
  }
  return socket;
};

export const connectSocket = (workspaceId, userId) => {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit("join:workspace", { workspaceId, userId });
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) socket.disconnect();
};