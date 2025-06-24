// server/server.js (ES-module)
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fetch from 'node-fetch';
import { joinRoom, leaveRoom, savePlan, getPlan } from './rooms.js';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json()); // for future JSON POSTs

/* ---------- 🔍 Study Resources API (DuckDuckGo) ---------- */
app.get('/api/search', async (req, res) => {
  const q = req.query.query ?? '';
  if (!q.trim()) {
    console.log('[Search] Empty query received');
    return res.json([]);
  }

  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_redirect=1`;
    const json = await fetch(url).then((r) => r.json());

    const out = [];

    if (json.AbstractURL) {
      out.push({
        title: json.Heading,
        link: json.AbstractURL,
        type: 'Website',
      });
    }

    (json.RelatedTopics || []).slice(0, 5).forEach((t) => {
      if (t.FirstURL && t.Text) {
        out.push({ title: t.Text, link: t.FirstURL, type: 'Website' });
      }
    });

    res.json(out);
  } catch (err) {
    console.error('❌ DuckDuckGo fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

/* ---------- ⚡ Socket.IO Server ---------- */
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('⚡ User connected:', socket.id);

  socket.on('join', (room) => {
    socket.join(room);
    joinRoom(room, socket.id);
    socket.emit('plan-sync', getPlan(room));
    io.to(room).emit('chat', `👋 ${socket.id} joined ${room}`);
  });

  socket.on('leave', (room) => {
    socket.leave(room);
    leaveRoom(room, socket.id);
    io.to(room).emit('chat', `👋 ${socket.id} left ${room}`);
  });

  socket.on('chat', ({ room, message }) => {
    io.to(room).emit('chat', message);
  });

  socket.on('plan-update', ({ room, plan }) => {
    savePlan(room, plan);
    io.to(room).emit('plan-sync', plan);
  });

  socket.on('disconnect', () => {
    console.log('👋 User disconnected:', socket.id);
  });
});

/* ---------- 🚀 Start Server ---------- */
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 Server running at http://localhost:${PORT}`);
});
