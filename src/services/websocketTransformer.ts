
/**
 * WebSocket átalakító Next.js API routes-ból különböző keretrendszerekhez
 */

export interface WebSocketConfig {
  path: string;
  framework: 'express' | 'fastify' | 'nestjs' | 'koa' | 'standalone';
  useTypescript: boolean;
}

export interface WebSocketResult {
  setupCode: string;
  clientCode: string;
  serverCode: string;
  imports: string[];
  warnings: string[];
}

/**
 * Express WebSocket szerver kód generálása
 */
function generateExpressWebSocketServer(config: WebSocketConfig): WebSocketResult {
  const result: WebSocketResult = {
    setupCode: '',
    clientCode: '',
    serverCode: '',
    imports: [
      "import express from 'express';",
      "import { createServer } from 'http';",
      "import { Server } from 'socket.io';"
    ],
    warnings: []
  };
  
  const typescriptDefs = config.useTypescript 
    ? `interface ClientToServerEvents {
  message: (data: any) => void;
  join: (room: string) => void;
}

interface ServerToClientEvents {
  response: (data: any) => void;
  notification: (message: string) => void;
}

interface InterServerEvents {
  ping: () => void;
}` 
    : '';
  
  result.serverCode = `${typescriptDefs ? typescriptDefs + '\n\n' : ''}/**
 * WebSocket szerver konfiguráció Socket.IO használatával (Express)
 */
export function setupWebSocketServer() {
  const app = express();
  const server = createServer(app);
  const io = new Server${config.useTypescript ? '<ServerToClientEvents, ClientToServerEvents, InterServerEvents>' : ''}(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
  // API routes
  app.get('${config.path}/health', (req, res) => {
    res.json({ status: 'OK', connections: io.engine.clientsCount });
  });
  
  // WebSocket kapcsolatok kezelése
  io.on('connection', (socket) => {
    console.log('Kliens csatlakozott:', socket.id);
    
    // Szoba csatlakozás
    socket.on('join', (room) => {
      socket.join(room);
      console.log(\`Kliens csatlakozott a szobához: \${room}\`);
    });
    
    // Üzenetek fogadása
    socket.on('message', (data) => {
      console.log('Üzenet érkezett:', data);
      
      // Üzenet visszaküldése (echo)
      socket.emit('response', { 
        received: data,
        timestamp: new Date().toISOString()
      });
    });
    
    // Kapcsolat bontása
    socket.on('disconnect', () => {
      console.log('Kliens lecsatlakozott:', socket.id);
    });
  });
  
  // Szerver indítása
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(\`WebSocket szerver fut a következő porton: \${PORT}\`);
  });
  
  return { app, server, io };
}`;
  
  result.clientCode = `/**
 * WebSocket kliens Socket.IO használatával
 */
import { io${config.useTypescript ? ', Socket' : ''} } from "socket.io-client";

${config.useTypescript ? `// Típusok definiálása a Socket.IO klienshez
interface ServerToClientEvents {
  response: (data: any) => void;
  notification: (message: string) => void;
}

interface ClientToServerEvents {
  message: (data: any) => void;
  join: (room: string) => void;
}

` : ''}export function createWebSocketClient() {
  const socket${config.useTypescript ? ': Socket<ServerToClientEvents, ClientToServerEvents>' : ''} = io("${config.path}", {
    reconnectionDelayMax: 10000,
    reconnection: true,
    transports: ['websocket', 'polling']
  });
  
  // Kapcsolódás esemény
  socket.on('connect', () => {
    console.log('Csatlakozva a szerverhez!');
  });
  
  // Válasz esemény
  socket.on('response', (data) => {
    console.log('Válasz érkezett:', data);
  });
  
  // Értesítés esemény
  socket.on('notification', (message) => {
    console.log('Értesítés:', message);
  });
  
  // Újracsatlakozás esemény
  socket.io.on("reconnect", (attempt) => {
    console.log(\`Újracsatlakozva \${attempt} próbálkozás után\`);
  });
  
  // Hiba esemény
  socket.on('connect_error', (error) => {
    console.error('Csatlakozási hiba:', error);
  });
  
  return {
    socket,
    
    // Üzenet küldése
    sendMessage: (data: any) => {
      socket.emit('message', data);
    },
    
    // Csatlakozás szobához
    joinRoom: (room: string) => {
      socket.emit('join', room);
    },
    
    // Kapcsolat bontása
    disconnect: () => {
      socket.disconnect();
    }
  };
}`;

  result.setupCode = `// Szerver oldal
import { setupWebSocketServer } from './websocket-server';
const { app, server, io } = setupWebSocketServer();

// Kliens oldal
import { createWebSocketClient } from './websocket-client';
const wsClient = createWebSocketClient();

// Üzenet küldése
wsClient.sendMessage({ text: 'Hello WebSocket!' });

// Szobához csatlakozás
wsClient.joinRoom('room1');`;

  return result;
}

/**
 * Fastify WebSocket szerver kód generálása
 */
function generateFastifyWebSocketServer(config: WebSocketConfig): WebSocketResult {
  const result: WebSocketResult = {
    setupCode: '',
    clientCode: '',
    serverCode: '',
    imports: [
      "import Fastify from 'fastify';",
      "import fastifyWebsocket from '@fastify/websocket';"
    ],
    warnings: []
  };
  
  result.serverCode = `/**
 * WebSocket szerver konfiguráció Fastify használatával
 */
export async function setupWebSocketServer() {
  const fastify = Fastify();
  
  // WebSocket plugin regisztrálása
  await fastify.register(fastifyWebsocket);
  
  // API route a szerver állapotáról
  fastify.get('${config.path}/health', async () => {
    return { status: 'OK' };
  });
  
  // WebSocket útvonal regisztrálása
  fastify.register(async function(fastify) {
    fastify.get('${config.path}', { websocket: true }, (connection, req) => {
      console.log('Kliens csatlakozott');
      
      // Üzenetek fogadása
      connection.socket.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('Üzenet érkezett:', data);
          
          // Üzenet visszaküldése (echo)
          connection.socket.send(JSON.stringify({
            received: data,
            timestamp: new Date().toISOString()
          }));
        } catch (error) {
          console.error('Hiba az üzenet feldolgozása közben:', error);
          connection.socket.send(JSON.stringify({ error: 'Érvénytelen üzenet formátum' }));
        }
      });
      
      // Kapcsolat bontása
      connection.socket.on('close', () => {
        console.log('Kliens lecsatlakozott');
      });
    });
  });
  
  // Szerver indítása
  const PORT = process.env.PORT || 3000;
  await fastify.listen({ port: PORT as number });
  console.log(\`WebSocket szerver fut a következő porton: \${PORT}\`);
  
  return { fastify };
}`;
  
  result.clientCode = `/**
 * WebSocket kliens standard WebSocket API használatával
 */
export function createWebSocketClient() {
  const ws = new WebSocket(\`ws://\${window.location.host}${config.path}\`);
  
  // Kapcsolódás esemény
  ws.onopen = () => {
    console.log('Csatlakozva a szerverhez!');
  };
  
  // Válasz esemény
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('Válasz érkezett:', data);
    } catch (error) {
      console.error('Hiba az üzenet feldolgozása közben:', error);
    }
  };
  
  // Hiba esemény
  ws.onerror = (error) => {
    console.error('WebSocket hiba:', error);
  };
  
  // Kapcsolat bontása esemény
  ws.onclose = (event) => {
    console.log(\`Kapcsolat bontva, kód: \${event.code}, ok: \${event.reason}\`);
  };
  
  return {
    ws,
    
    // Üzenet küldése
    sendMessage: (data: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      } else {
        console.error('A WebSocket nincs nyitva');
      }
    },
    
    // Kapcsolat bontása
    disconnect: () => {
      ws.close();
    }
  };
}`;

  result.setupCode = `// Szerver oldal
import { setupWebSocketServer } from './fastify-websocket-server';
setupWebSocketServer();

// Kliens oldal
import { createWebSocketClient } from './fastify-websocket-client';
const wsClient = createWebSocketClient();

// Üzenet küldése
wsClient.sendMessage({ text: 'Hello Fastify WebSocket!' });`;

  return result;
}

/**
 * NestJS WebSocket szerver kód generálása
 */
function generateNestJSWebSocketServer(config: WebSocketConfig): WebSocketResult {
  const result: WebSocketResult = {
    setupCode: '',
    clientCode: '',
    serverCode: '',
    imports: [
      "import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer } from '@nestjs/websockets';",
      "import { Injectable, Module } from '@nestjs/common';",
      "import { Server, Socket } from 'socket.io';"
    ],
    warnings: []
  };
  
  result.serverCode = `/**
 * WebSocket Gateway NestJS használatával
 */
@WebSocketGateway({
  namespace: '${config.path.replace(/^\//, '')}',
  cors: {
    origin: '*',
  },
})
export class WebSocketGateway {
  @WebSocketServer()
  server: Server;

  // Kapcsolódás esemény
  handleConnection(client: Socket) {
    console.log('Kliens csatlakozott:', client.id);
  }

  // Kapcsolat bontása esemény
  handleDisconnect(client: Socket) {
    console.log('Kliens lecsatlakozott:', client.id);
  }

  // Üzenet fogadása
  @SubscribeMessage('message')
  handleMessage(client: Socket, @MessageBody() data: any): void {
    console.log('Üzenet érkezett:', data);
    
    // Üzenet visszaküldése (echo)
    client.emit('response', {
      received: data,
      timestamp: new Date().toISOString()
    });
  }
  
  // Szobához csatlakozás
  @SubscribeMessage('join')
  handleJoinRoom(client: Socket, @MessageBody() room: string): void {
    client.join(room);
    console.log(\`Kliens csatlakozott a szobához: \${room}\`);
    client.emit('notification', \`Csatlakozva a szobához: \${room}\`);
  }
}

/**
 * WebSocket Service
 */
@Injectable()
export class WebSocketService {
  constructor() {}
  
  // Metódus üzenet küldésére egy szobának
  sendToRoom(server: Server, room: string, event: string, data: any) {
    server.to(room).emit(event, data);
  }
  
  // Metódus üzenet küldésére mindenkinek
  broadcast(server: Server, event: string, data: any) {
    server.emit(event, data);
  }
}

/**
 * WebSocket Module
 */
@Module({
  providers: [WebSocketGateway, WebSocketService],
  exports: [WebSocketService],
})
export class WebSocketModule {}`;
  
  result.clientCode = `/**
 * WebSocket kliens Socket.IO használatával (NestJS)
 */
import { io${config.useTypescript ? ', Socket' : ''} } from "socket.io-client";

${config.useTypescript ? `// Típusok definiálása a Socket.IO klienshez
interface ServerToClientEvents {
  response: (data: any) => void;
  notification: (message: string) => void;
}

interface ClientToServerEvents {
  message: (data: any) => void;
  join: (room: string) => void;
}

` : ''}export function createWebSocketClient() {
  const socket${config.useTypescript ? ': Socket<ServerToClientEvents, ClientToServerEvents>' : ''} = io("/${config.path.replace(/^\//, '')}", {
    reconnectionDelayMax: 10000,
    reconnection: true,
    transports: ['websocket', 'polling']
  });
  
  // Kapcsolódás esemény
  socket.on('connect', () => {
    console.log('Csatlakozva a szerverhez!');
  });
  
  // Válasz esemény
  socket.on('response', (data) => {
    console.log('Válasz érkezett:', data);
  });
  
  // Értesítés esemény
  socket.on('notification', (message) => {
    console.log('Értesítés:', message);
  });
  
  return {
    socket,
    
    // Üzenet küldése
    sendMessage: (data: any) => {
      socket.emit('message', data);
    },
    
    // Csatlakozás szobához
    joinRoom: (room: string) => {
      socket.emit('join', room);
    },
    
    // Kapcsolat bontása
    disconnect: () => {
      socket.disconnect();
    }
  };
}`;

  result.setupCode = `// Szerver oldal (main.ts)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();

// WebSocket modul importálása a fő modulban
import { WebSocketModule } from './websocket.module';

@Module({
  imports: [WebSocketModule],
  // ... többi modul importálása
})
export class AppModule {}

// Kliens oldal
import { createWebSocketClient } from './nestjs-websocket-client';
const wsClient = createWebSocketClient();

// Üzenet küldése
wsClient.sendMessage({ text: 'Hello NestJS WebSocket!' });

// Szobához csatlakozás
wsClient.joinRoom('room1');`;

  return result;
}

/**
 * Factory function a WebSocket kód generálásához
 */
export function generateWebSocketCode(config: WebSocketConfig): WebSocketResult {
  switch (config.framework) {
    case 'express':
      return generateExpressWebSocketServer(config);
    case 'fastify':
      return generateFastifyWebSocketServer(config);
    case 'nestjs':
      return generateNestJSWebSocketServer(config);
    default:
      return {
        setupCode: '',
        clientCode: '',
        serverCode: '',
        imports: [],
        warnings: [`A ${config.framework} keretrendszer WebSocket támogatása nem implementált.`]
      };
  }
}

/**
 * WebSocket kapcsolat átalakító a Next.js API route kódból
 * Ez a funkció a WebSocket protokollhoz kapcsolódó kódrészleteket keresi és átalakítja
 */
export function extractWebSocketHandling(code: string): {
  hasWebSocketCode: boolean;
  extractedCode: string;
  remainingCode: string;
} {
  const result = {
    hasWebSocketCode: false,
    extractedCode: '',
    remainingCode: code
  };
  
  // WebSocket használatának ellenőrzése
  const wsPatterns = [
    /new\s+WebSocket/g,
    /socket\.on/g,
    /socket\.send/g,
    /socket\.emit/g,
    /req\.socket\.upgrade/g,
    /websocket/gi,
    /\bws:/g,
    /\bwss:/g
  ];
  
  result.hasWebSocketCode = wsPatterns.some(pattern => pattern.test(code));
  
  // Ha találtunk WebSocket kódot, próbáljuk meg kiemelni
  if (result.hasWebSocketCode) {
    // WebSocket kezelő kód részletek megtalálása
    const wsHandlerMatch = code.match(/\/\/ WebSocket handling.*?(\n|$)([\s\S]*?)(\n\s*\/\/|$)/);
    if (wsHandlerMatch) {
      result.extractedCode = wsHandlerMatch[2];
      result.remainingCode = code.replace(wsHandlerMatch[0], '');
    }
    
    // Upgrade kezelés keresése
    const upgradeMatch = code.match(/if\s*\(\s*req\.headers\['upgrade'\].*?{([\s\S]*?)}/);
    if (upgradeMatch) {
      result.extractedCode += '\n' + upgradeMatch[0];
      result.remainingCode = code.replace(upgradeMatch[0], '');
    }
  }
  
  return result;
}
