import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  createSession,
  joinSession,
  leaveSession,
  updateLocation,
  findMemberBySocketId,
  getMemberSession,
} from './sessionManager';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.get('/', (_req, res) => {
  res.send('Clubbing Compass server running');
});

io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);
  let memberId: string | null = null;

  socket.on('create-session', (data: { name: string; color: string }, callback) => {
    try {
      const result = createSession(socket.id, data.name, data.color);
      memberId = result.memberId;
      socket.join(result.code);
      callback(result);
      console.log(`[create] session=${result.code} member=${memberId}`);
    } catch (err: any) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('join-session', (data: { code: string; name: string; color: string }, callback) => {
    try {
      const result = joinSession(data.code, socket.id, data.name, data.color);
      memberId = result.memberId;
      socket.join(data.code);

      // Notify others in the session
      socket.to(data.code).emit('member-joined', {
        id: memberId,
        name: data.name,
        color: data.color,
      });

      callback(result);
      console.log(`[join] session=${data.code} member=${memberId}`);
    } catch (err: any) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('update-location', (data: { lat: number; lng: number }) => {
    if (!memberId) return;
    const result = updateLocation(memberId, data.lat, data.lng);
    if (result) {
      socket.to(result.code).emit('location-update', {
        id: memberId,
        lat: data.lat,
        lng: data.lng,
      });
    }
  });

  socket.on('send-signal', (data: { type: 'where' | 'coming' }) => {
    if (!memberId) return;
    const member = findMemberBySocketId(socket.id);
    if (!member) return;
    const session = getMemberSession(memberId);
    if (!session) return;

    socket.to(session).emit('signal-received', {
      id: memberId,
      name: member.name,
      color: member.color,
      type: data.type,
    });
    console.log(`[signal] ${data.type} from ${member.name}`);
  });

  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);
    if (!memberId) return;
    const result = leaveSession(memberId);
    if (result && !result.isEmpty) {
      socket.to(result.code).emit('member-left', { id: memberId });
    }
    memberId = null;
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
