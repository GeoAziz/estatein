// WebSocket messaging service for real-time chat

import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import prisma from '../config/database.js';
import * as jwt from 'jsonwebtoken';

interface SocketUser {
  id: string;
  email: string;
  name: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

class WebSocketService {
  private io: SocketServer | null = null;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> set of socket IDs
  private socketUsers: Map<string, SocketUser> = new Map(); // socketId -> user

  constructor() {}

  initialize(httpServer: HttpServer): SocketServer {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    return this.io;
  }

  private setupMiddleware(): void {
    if (!this.io) return;

    this.io.use((socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        socket.userId = decoded.id;
        socket.userEmail = decoded.email;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId;
      const userEmail = socket.userEmail;

      if (!userId) {
        socket.disconnect();
        return;
      }

      console.log(`User ${userId} connected with socket ${socket.id}`);

      // Track user socket
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      // Fetch user data and store
      this.fetchAndStoreUser(userId, socket.id);

      // Join user's personal room
      socket.join(`user:${userId}`);

      // Send presence update to contacts
      this.broadcastPresence(userId, 'online');

      // Handle incoming messages
      socket.on('message', (data) => this.handleMessage(socket, data));

      // Handle typing indicator
      socket.on('typing', (data) => this.handleTyping(socket, data));

      // Handle read receipts
      socket.on('read', (data) => this.handleRead(socket, data));

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${userId} disconnected`);
        this.handleDisconnect(userId, socket.id);
      });

      // Notify user of any pending messages
      this.sendPendingMessages(userId, socket);
    });
  }

  private async fetchAndStoreUser(userId: string, socketId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true },
      });

      if (user) {
        this.socketUsers.set(socketId, {
          id: user.id,
          email: user.email,
          name: user.name,
        });
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  }

  private async handleMessage(
    socket: AuthenticatedSocket,
    data: { recipientId: string; message: string }
  ): Promise<void> {
    const senderId = socket.userId;
    const { recipientId, message } = data;

    if (!senderId || !recipientId || !message) {
      return;
    }

    try {
      // Save message to database
      const dbMessage = await prisma.inquiryReply.create({
        data: {
          senderId,
          message,
          inquiryId: 'temp-inquiry-id', // This should be linked to actual inquiry
        },
      });

      const sender = this.socketUsers.get(socket.id);

      const chatMessage: ChatMessage = {
        id: dbMessage.id,
        senderId,
        senderName: sender?.name || 'Unknown',
        recipientId,
        message,
        timestamp: dbMessage.createdAt,
        read: false,
      };

      // Send to recipient if online
      const recipientSockets = this.userSockets.get(recipientId);
      if (recipientSockets && recipientSockets.size > 0) {
        this.io?.to(`user:${recipientId}`).emit('message', chatMessage);

        // Mark as read if recipient has socket open
        chatMessage.read = true;
      }

      // Confirm delivery to sender
      socket.emit('message:sent', { id: dbMessage.id });
    } catch (error) {
      console.error('Failed to handle message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  private handleTyping(
    socket: AuthenticatedSocket,
    data: { recipientId: string }
  ): void {
    const senderId = socket.userId;
    const { recipientId } = data;

    if (!senderId || !recipientId) {
      return;
    }

    this.io?.to(`user:${recipientId}`).emit('typing', {
      senderId,
      isTyping: true,
    });
  }

  private async handleRead(
    socket: AuthenticatedSocket,
    data: { messageId: string }
  ): Promise<void> {
    const userId = socket.userId;
    const { messageId } = data;

    if (!userId || !messageId) {
      return;
    }

    try {
      // In a real implementation, update message read status in database
      this.io?.emit('message:read', { messageId, readBy: userId });
    } catch (error) {
      console.error('Failed to handle read receipt:', error);
    }
  }

  private handleDisconnect(userId: string, socketId: string): void {
    const userSocketsSet = this.userSockets.get(userId);
    if (userSocketsSet) {
      userSocketsSet.delete(socketId);
      if (userSocketsSet.size === 0) {
        this.userSockets.delete(userId);
        // Broadcast offline status
        this.broadcastPresence(userId, 'offline');
      }
    }

    this.socketUsers.delete(socketId);
  }

  private broadcastPresence(userId: string, status: 'online' | 'offline'): void {
    this.io?.emit('presence', { userId, status });
  }

  private async sendPendingMessages(userId: string, socket: Socket): Promise<void> {
    try {
      // Fetch unread inquiries/messages for this user
      const inquiries = await prisma.inquiry.findMany({
        where: {
          sellerId: userId,
          read: false,
        },
        include: {
          replies: {
            orderBy: { createdAt: 'asc' },
            take: 50,
          },
          buyer: {
            select: { id: true, name: true, email: true },
          },
        },
        take: 10,
      });

      if (inquiries.length > 0) {
        socket.emit('pending:messages', {
          count: inquiries.length,
          inquiries: inquiries.map((inq) => ({
            id: inq.id,
            buyerId: inq.buyerId,
            buyerName: inq.buyer.name,
            lastMessage: inq.replies[inq.replies.length - 1]?.message || inq.message,
            timestamp: inq.replies[inq.replies.length - 1]?.createdAt || inq.createdAt,
          })),
        });
      }
    } catch (error) {
      console.error('Failed to send pending messages:', error);
    }
  }

  sendNotification(userId: string, title: string, message: string, data?: any): void {
    this.io?.to(`user:${userId}`).emit('notification', { title, message, data });
  }

  sendToUser(userId: string, event: string, data: any): void {
    this.io?.to(`user:${userId}`).emit(event, data);
  }

  broadcast(event: string, data: any): void {
    this.io?.emit(event, data);
  }

  getConnectedUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return sockets !== undefined && sockets.size > 0;
  }
}

export const wsService = new WebSocketService();
