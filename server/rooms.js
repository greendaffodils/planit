// Very naive in-memory room tracker 🔑
const rooms = {};

export function joinRoom(roomName, socketId) {
  if (!rooms[roomName]) {
    rooms[roomName] = { members: new Set(), lastPlan: null };
  }
  rooms[roomName].members.add(socketId);
  return rooms[roomName];
}

export function leaveRoom(roomName, socketId) {
  const room = rooms[roomName];
  if (!room) return;
  room.members.delete(socketId);
  if (room.members.size === 0) delete rooms[roomName];
}

export function savePlan(roomName, plan) {
  if (rooms[roomName]) rooms[roomName].lastPlan = plan;
}

export function getPlan(roomName) {
  return rooms[roomName]?.lastPlan ?? null;
}

export default {
  joinRoom,
  leaveRoom,
  savePlan,
  getPlan
};
