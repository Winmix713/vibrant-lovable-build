
import { transformCode } from './codeTransformer';

export interface ApiRouteTransformOptions {
  targetFramework: 'express' | 'fastify' | 'standalone' | 'nestjs' | 'koa';
  generateComments: boolean;
  useTypescript: boolean;
  includeWebSockets: boolean;
  generateTests: boolean;
}

export interface ApiRouteTransformResult {
  code: string;
  imports: string[];
  warnings: string[];
  handlerName: string;
  method: string | null;
  path: string;
  tests?: string;
}

export interface WebSocketHandlerResult {
  setupCode: string;
  handlerCode: string;
  imports: string[];
  warnings: string[];
}

/**
 * Extract API route path from file path
 */
function extractRoutePath(filePath: string): string {
  // Handle pages/api/[...param].ts format
  const apiPathMatch = filePath.match(/pages\/api\/(.+)\.(ts|js)$/);
  if (!apiPathMatch) return '/api/unknown';
  
  let path = apiPathMatch[1];
  
  // Handle dynamic route segments
  path = path.replace(/\[\.{3}(\w+)\]/g, '*'); // [...param] -> *
  path = path.replace(/\[(\w+)\]/g, ':$1');    // [param] -> :param
  
  // Handle index routes
  path = path.replace(/\/index$/, '/');
  
  return `/api/${path}`;
}

/**
 * Detect HTTP method from handler code
 */
function detectHttpMethod(code: string): string | null {
  if (code.includes('req.method === "GET"') || code.includes('req.method === \'GET\'')) {
    return 'GET';
  } else if (code.includes('req.method === "POST"') || code.includes('req.method === \'POST\'')) {
    return 'POST';
  } else if (code.includes('req.method === "PUT"') || code.includes('req.method === \'PUT\'')) {
    return 'PUT';
  } else if (code.includes('req.method === "DELETE"') || code.includes('req.method === \'DELETE\'')) {
    return 'DELETE';
  } else if (code.includes('req.method === "PATCH"') || code.includes('req.method === \'PATCH\'')) {
    return 'PATCH';
  } else {
    return null; // Method not detected or handler handles multiple methods
  }
}

/**
 * Detect if API route contains WebSocket handling
 */
function detectWebSocketUsage(code: string): boolean {
  return code.includes('new WebSocket') || 
         code.includes('socket.on') || 
         code.includes('socket.send') || 
         code.includes('req.socket') ||
         code.includes('websocket') || 
         code.includes('ws:') ||
         code.includes('wss:');
}

/**
 * Transform Next.js API route to Express handler
 */
export function transformToExpress(
  code: string, 
  filePath: string, 
  options: ApiRouteTransformOptions = { 
    targetFramework: 'express', 
    generateComments: true, 
    useTypescript: true,
    includeWebSockets: false,
    generateTests: false
  }
): ApiRouteTransformResult {
  const path = extractRoutePath(filePath);
  const method = detectHttpMethod(code);
  const handlerName = `handle${method || ''}${path.replace(/\//g, '_').replace(/:/g, '').replace('*', 'all')}`;
  const hasWebSockets = detectWebSocketUsage(code);
  
  // Parse the API handler function
  const handlerMatch = code.match(/export\s+default\s+(async\s+)?function\s+(\w+)?\s*\(\s*req\s*,\s*res\s*\)\s*{([\s\S]*?)}/);
  
  const result: ApiRouteTransformResult = {
    code: code,
    imports: ["import express from 'express';"],
    warnings: [],
    handlerName,
    method,
    path
  };
  
  if (options.useTypescript) {
    result.imports.push("import { Request, Response } from 'express';");
  }
  
  if (hasWebSockets && options.includeWebSockets) {
    result.imports.push("import { Server } from 'socket.io';");
    result.imports.push("import { createServer } from 'http';");
    result.warnings.push('WebSocket használat észlelve - Socket.IO szerver hozzáadva');
  }
  
  if (handlerMatch) {
    const isAsync = !!handlerMatch[1];
    const handlerBody = handlerMatch[3];
    
    // Transform to Express handler
    const expressHandler = `
/**
 * ${method || 'All methods'} handler for ${path}
 * Converted from Next.js API Route
 */
export ${isAsync ? 'async ' : ''}function ${handlerName}(req: ${options.useTypescript ? 'Request' : 'any'}, res: ${options.useTypescript ? 'Response' : 'any'}) {${handlerBody}}

// Express route registration:
${method 
  ? `
// app.${method.toLowerCase()}('${path}', ${handlerName});
`
  : `
// app.all('${path}', ${handlerName});
`}
${hasWebSockets && options.includeWebSockets 
  ? `
/**
 * WebSocket setup for the same endpoint
 */
export function setupWebSocket(server: any) {
  const io = new Server(server);
  io.of('${path}').on('connection', (socket) => {
    console.log('Client connected to ${path}');
    
    socket.on('message', (data) => {
      console.log('Received message:', data);
      // Handle messages here
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected from ${path}');
    });
  });
}

// Usage:
// const app = express();
// const server = createServer(app);
// setupWebSocket(server);
// server.listen(3000);
` 
  : ''}
`;
    
    result.code = code.replace(handlerMatch[0], expressHandler);
    
    // Add warning for Next.js-specific features
    if (handlerBody.includes('req.query')) {
      result.warnings.push('Express uses req.query but may format query parameters differently than Next.js');
    }
    
    if (handlerBody.includes('req.cookies') || handlerBody.includes('res.cookies')) {
      result.warnings.push('Express requires cookie-parser middleware for req.cookies');
      result.imports.push("import cookieParser from 'cookie-parser';");
    }
  } else {
    result.warnings.push('Could not parse API handler function properly');
  }
  
  // Generate tests if requested
  if (options.generateTests) {
    result.tests = generateExpressTests(handlerName, path, method);
  }
  
  return result;
}

/**
 * Create tests for Express route handlers
 */
function generateExpressTests(handlerName: string, path: string, method: string | null): string {
  return `import request from 'supertest';
import express from 'express';
import { ${handlerName} } from './your-handler-file';

describe('${handlerName} API Tests', () => {
  let app;
  
  beforeEach(() => {
    app = express();
    app.${method ? method.toLowerCase() : 'all'}('${path}', ${handlerName});
  });
  
  it('should return 200 OK', async () => {
    const response = await request(app).${method ? method.toLowerCase() : 'get'}('${path}');
    expect(response.status).toBe(200);
  });
  
  it('should return valid data structure', async () => {
    const response = await request(app).${method ? method.toLowerCase() : 'get'}('${path}');
    expect(response.body).toBeDefined();
  });
});
`;
}

/**
 * Transform Next.js API route to Fastify handler
 */
export function transformToFastify(
  code: string, 
  filePath: string, 
  options: ApiRouteTransformOptions = { 
    targetFramework: 'fastify', 
    generateComments: true, 
    useTypescript: true,
    includeWebSockets: false,
    generateTests: false
  }
): ApiRouteTransformResult {
  const path = extractRoutePath(filePath);
  const method = detectHttpMethod(code);
  const handlerName = `handle${method || ''}${path.replace(/\//g, '_').replace(/:/g, '').replace('*', 'all')}`;
  const hasWebSockets = detectWebSocketUsage(code);
  
  // Parse the API handler function
  const handlerMatch = code.match(/export\s+default\s+(async\s+)?function\s+(\w+)?\s*\(\s*req\s*,\s*res\s*\)\s*{([\s\S]*?)}/);
  
  const result: ApiRouteTransformResult = {
    code: code,
    imports: ["import Fastify from 'fastify';"],
    warnings: [],
    handlerName,
    method,
    path
  };
  
  if (options.useTypescript) {
    result.imports.push("import { FastifyRequest, FastifyReply } from 'fastify';");
  }
  
  if (hasWebSockets && options.includeWebSockets) {
    result.imports.push("import fastifyWebsocket from '@fastify/websocket';");
    result.warnings.push('WebSocket használat észlelve - @fastify/websocket hozzáadva');
  }
  
  if (handlerMatch) {
    const isAsync = !!handlerMatch[1];
    let handlerBody = handlerMatch[3];
    
    // Transform Next.js specific code to Fastify
    handlerBody = handlerBody.replace(/req\.query/g, 'request.query');
    handlerBody = handlerBody.replace(/req\.body/g, 'request.body');
    handlerBody = handlerBody.replace(/res\.status\(([^)]+)\)\.json\(([^)]+)\)/g, 'reply.code($1).send($2)');
    handlerBody = handlerBody.replace(/res\.status/g, 'reply.code');
    handlerBody = handlerBody.replace(/res\.json/g, 'reply.send');
    handlerBody = handlerBody.replace(/res\.end/g, 'reply.send');
    
    // Transform to Fastify handler
    const fastifyHandler = `
/**
 * ${method || 'All methods'} handler for ${path}
 * Converted from Next.js API Route
 */
export ${isAsync ? 'async ' : ''}function ${handlerName}(
  request: ${options.useTypescript ? 'FastifyRequest' : 'any'},
  reply: ${options.useTypescript ? 'FastifyReply' : 'any'}
) {
  // Converted from Next.js API Route
  // Note: 'req' and 'res' variables renamed to 'request' and 'reply'
  const req = request;
  const res = reply;
  ${handlerBody}
}

// Fastify route registration:
/*
fastify.route({
  method: ${method ? `'${method}'` : "['GET', 'POST', 'PUT', 'DELETE', 'PATCH']"},
  url: '${path}',
  handler: ${handlerName}
});
*/
${hasWebSockets && options.includeWebSockets ? `
/**
 * WebSocket setup for the same endpoint
 */
export function setupWebSocket(fastify: any) {
  // Register websocket plugin
  fastify.register(fastifyWebsocket);
  
  // Register a websocket route
  fastify.register(async function(fastify) {
    fastify.get('${path}/ws', { websocket: true }, (connection, req) => {
      console.log('Client connected to ${path}/ws');
      
      connection.socket.on('message', (message) => {
        const data = message.toString();
        console.log('Received message:', data);
        
        // Echo back the message
        connection.socket.send(JSON.stringify({ received: data }));
      });
      
      connection.socket.on('close', () => {
        console.log('Client disconnected from ${path}/ws');
      });
    });
  });
}

// Usage:
// const fastify = Fastify();
// setupWebSocket(fastify);
// fastify.listen({ port: 3000 });
` : ''}
`;
    
    result.code = code.replace(handlerMatch[0], fastifyHandler);
    
    // Add warning for Next.js-specific features
    if (code.includes('req.cookies') || code.includes('res.cookies')) {
      result.warnings.push('Fastify requires @fastify/cookie plugin for cookies support');
      result.imports.push("import fastifyCookie from '@fastify/cookie';");
    }
  } else {
    result.warnings.push('Could not parse API handler function properly');
  }
  
  // Generate tests if requested
  if (options.generateTests) {
    result.tests = generateFastifyTests(handlerName, path, method);
  }
  
  return result;
}

/**
 * Create tests for Fastify route handlers
 */
function generateFastifyTests(handlerName: string, path: string, method: string | null): string {
  return `import Fastify from 'fastify';
import { ${handlerName} } from './your-handler-file';

describe('${handlerName} API Tests', () => {
  let fastify;
  
  beforeEach(() => {
    fastify = Fastify();
    fastify.route({
      method: ${method ? `'${method}'` : "['GET', 'POST', 'PUT', 'DELETE', 'PATCH']"},
      url: '${path}',
      handler: ${handlerName}
    });
  });
  
  afterEach(() => {
    fastify.close();
  });
  
  it('should return 200 OK', async () => {
    const response = await fastify.inject({
      method: ${method ? `'${method}'` : "'GET'"},
      url: '${path}'
    });
    expect(response.statusCode).toBe(200);
  });
  
  it('should return valid data structure', async () => {
    const response = await fastify.inject({
      method: ${method ? `'${method}'` : "'GET'"},
      url: '${path}'
    });
    expect(JSON.parse(response.body)).toBeDefined();
  });
});
`;
}

/**
 * Transform Next.js API route to NestJS handler
 */
export function transformToNestJS(
  code: string, 
  filePath: string, 
  options: ApiRouteTransformOptions = { 
    targetFramework: 'nestjs',
    generateComments: true, 
    useTypescript: true,
    includeWebSockets: false,
    generateTests: false
  }
): ApiRouteTransformResult {
  const path = extractRoutePath(filePath);
  const method = detectHttpMethod(code);
  const controllerName = `${path.split('/').filter(Boolean).map(p => 
    p.charAt(0).toUpperCase() + p.slice(1).replace(/[-:]/g, '')
  ).join('')}Controller`;
  
  const serviceName = `${path.split('/').filter(Boolean).map(p => 
    p.charAt(0).toUpperCase() + p.slice(1).replace(/[-:]/g, '')
  ).join('')}Service`;
  
  const handlerName = `handle${method || 'Request'}`;
  const hasWebSockets = detectWebSocketUsage(code);
  
  // Parse the API handler function
  const handlerMatch = code.match(/export\s+default\s+(async\s+)?function\s+(\w+)?\s*\(\s*req\s*,\s*res\s*\)\s*{([\s\S]*?)}/);
  
  const result: ApiRouteTransformResult = {
    code: code,
    imports: [
      "import { Controller, Get, Post, Put, Delete, Patch, Req, Res, Body, Param, Query } from '@nestjs/common';"
    ],
    warnings: [],
    handlerName,
    method,
    path
  };
  
  if (options.useTypescript) {
    result.imports.push("import { Request, Response } from 'express';");
  }
  
  if (hasWebSockets && options.includeWebSockets) {
    result.imports.push("import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer } from '@nestjs/websockets';");
    result.imports.push("import { Server, Socket } from 'socket.io';");
  }
  
  if (handlerMatch) {
    const isAsync = !!handlerMatch[1];
    let handlerBody = handlerMatch[3];
    
    // Transform to NestJS controller and service
    const nestJsCode = `
// Controller
@Controller('${path}')
export class ${controllerName} {
  constructor(private readonly ${serviceName.charAt(0).toLowerCase() + serviceName.slice(1)}: ${serviceName}) {}

  @${method ? method.toLowerCase().charAt(0).toUpperCase() + method.toLowerCase().slice(1) : 'Get'}()
  ${isAsync ? 'async ' : ''}${handlerName}(
    @Req() req: ${options.useTypescript ? 'Request' : 'any'},
    @Res() res: ${options.useTypescript ? 'Response' : 'any'}
  ) {
    // Call service method and return response
    return this.${serviceName.charAt(0).toLowerCase() + serviceName.slice(1)}.process(req, res);
  }
}

// Service
import { Injectable } from '@nestjs/common';

@Injectable()
export class ${serviceName} {
  ${isAsync ? 'async ' : ''}process(req: ${options.useTypescript ? 'Request' : 'any'}, res: ${options.useTypescript ? 'Response' : 'any'}) {
    // Original Next.js API route logic
    ${handlerBody}
  }
}
${hasWebSockets && options.includeWebSockets ? `
// WebSocket Gateway
@WebSocketGateway({ namespace: '${path}' })
export class ${path.split('/').filter(Boolean).map(p => 
  p.charAt(0).toUpperCase() + p.slice(1).replace(/[-:]/g, '')
).join('')}Gateway {
  @WebSocketServer()
  server: Server;

  // Handle connection event
  handleConnection(client: Socket) {
    console.log('Client connected to ${path}:', client.id);
  }

  // Handle disconnection event
  handleDisconnect(client: Socket) {
    console.log('Client disconnected from ${path}:', client.id);
  }

  // Handle custom message event
  @SubscribeMessage('message')
  handleMessage(client: Socket, @MessageBody() data: any): void {
    console.log('Received message:', data);
    
    // Echo back the message
    client.emit('response', { received: data });
  }
}
` : ''}
`;
    
    result.code = nestJsCode;
    
    // Add imports for NestJS
    result.imports.push("import { Injectable } from '@nestjs/common';");
    
    // Add warnings for NestJS-specific adjustments
    result.warnings.push('NestJS requires a module to register the controller and service');
    result.warnings.push(`Create a ${path.split('/').filter(Boolean).map(p => 
      p.charAt(0).toUpperCase() + p.slice(1).replace(/[-:]/g, '')
    ).join('')}Module to register the components`);
    
  } else {
    result.warnings.push('Could not parse API handler function properly');
  }
  
  // Generate tests if requested
  if (options.generateTests) {
    result.tests = generateNestJSTests(controllerName, serviceName, path, method);
  }
  
  return result;
}

/**
 * Create tests for NestJS controllers and services
 */
function generateNestJSTests(controllerName: string, serviceName: string, path: string, method: string | null): string {
  return `import { Test, TestingModule } from '@nestjs/testing';
import { ${controllerName} } from './your-controller-file';
import { ${serviceName} } from './your-service-file';

describe('${controllerName}', () => {
  let controller: ${controllerName};
  let service: ${serviceName};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [${controllerName}],
      providers: [${serviceName}],
    }).compile();

    controller = module.get<${controllerName}>(${controllerName});
    service = module.get<${serviceName}>(${serviceName});
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should call service process method', () => {
    const mockReq = {};
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    jest.spyOn(service, 'process');
    
    controller.handle${method || 'Request'}(mockReq, mockRes);
    
    expect(service.process).toHaveBeenCalledWith(mockReq, mockRes);
  });
});
`;
}

/**
 * Transform Next.js API route to a Koa handler
 */
export function transformToKoa(
  code: string, 
  filePath: string, 
  options: ApiRouteTransformOptions = { 
    targetFramework: 'koa', 
    generateComments: true, 
    useTypescript: true,
    includeWebSockets: false,
    generateTests: false
  }
): ApiRouteTransformResult {
  const path = extractRoutePath(filePath);
  const method = detectHttpMethod(code);
  const handlerName = `handle${method || ''}${path.replace(/\//g, '_').replace(/:/g, '').replace('*', 'all')}`;
  const hasWebSockets = detectWebSocketUsage(code);
  
  // Parse the API handler function
  const handlerMatch = code.match(/export\s+default\s+(async\s+)?function\s+(\w+)?\s*\(\s*req\s*,\s*res\s*\)\s*{([\s\S]*?)}/);
  
  const result: ApiRouteTransformResult = {
    code: code,
    imports: [
      "import Koa from 'koa';", 
      "import Router from '@koa/router';"
    ],
    warnings: [],
    handlerName,
    method,
    path
  };
  
  if (options.useTypescript) {
    result.imports.push("import { Context } from 'koa';");
  }
  
  if (hasWebSockets && options.includeWebSockets) {
    result.imports.push("import websocket from 'koa-websocket';");
  }
  
  if (handlerMatch) {
    const isAsync = !!handlerMatch[1];
    let handlerBody = handlerMatch[3];
    
    // Transform Next.js specific code to Koa
    handlerBody = handlerBody.replace(/req\.query/g, 'ctx.query');
    handlerBody = handlerBody.replace(/req\.body/g, 'ctx.request.body');
    handlerBody = handlerBody.replace(/res\.status\(([^)]+)\)\.json\(([^)]+)\)/g, 
      'ctx.status = $1; ctx.body = $2');
    handlerBody = handlerBody.replace(/res\.status\(([^)]+)\)/g, 'ctx.status = $1');
    handlerBody = handlerBody.replace(/res\.json\(([^)]+)\)/g, 'ctx.body = $1');
    handlerBody = handlerBody.replace(/res\.end\(\)/g, 'ctx.body = null');
    
    // Transform to Koa handler
    const koaHandler = `
/**
 * ${method || 'All methods'} handler for ${path}
 * Converted from Next.js API Route to Koa
 */
export ${isAsync ? 'async ' : ''}function ${handlerName}(ctx: ${options.useTypescript ? 'Context' : 'any'}) {
  // Converted from Next.js API Route
  // Note: req and res are replaced with ctx
  const req = {
    query: ctx.query,
    body: ctx.request.body,
    method: ctx.method,
    headers: ctx.headers
  };
  
  const res = {
    status: (code) => {
      ctx.status = code;
      return res;
    },
    json: (data) => {
      ctx.body = data;
    },
    end: () => {
      ctx.body = null;
    }
  };
  
  ${handlerBody.replace(/return res\.(\w+)\((.*)\)/g, function(match, method, args) {
    if (method === 'json') return `ctx.body = ${args}; return;`;
    if (method === 'status') return `ctx.status = ${args}; return;`;
    return match;
  })}
}

// Koa route registration:
/*
const router = new Router();
router.${method ? method.toLowerCase() : 'all'}('${path}', ${handlerName});
app.use(router.routes());
app.use(router.allowedMethods());
*/
${hasWebSockets && options.includeWebSockets ? `
/**
 * WebSocket setup for the same endpoint
 */
export function setupWebSocket(app: any) {
  // Create websocket app
  const wsApp = websocket(app);
  
  // Register a websocket route
  wsApp.ws.use(function(ctx, next) {
    // Middleware for all websocket connections
    return next(ctx);
  });
  
  wsApp.ws.route('${path}').all(function(ctx) {
    console.log('Client connected to ${path} websocket');
    
    // Handle messages from client
    ctx.websocket.on('message', (message) => {
      const data = message.toString();
      console.log('Received message:', data);
      
      // Echo back the message
      ctx.websocket.send(JSON.stringify({ received: data }));
    });
    
    // Handle disconnect
    ctx.websocket.on('close', () => {
      console.log('Client disconnected from ${path} websocket');
    });
  });
}

// Usage:
// const app = new Koa();
// setupWebSocket(app);
// app.listen(3000);
` : ''}
`;
    
    result.code = code.replace(handlerMatch[0], koaHandler);
    
    // Add warnings for Koa-specific dependencies
    result.warnings.push('Koa requires koa-bodyparser for parsing request bodies');
    result.imports.push("import bodyParser from 'koa-bodyparser';");
    
  } else {
    result.warnings.push('Could not parse API handler function properly');
  }
  
  // Generate tests if requested
  if (options.generateTests) {
    result.tests = generateKoaTests(handlerName, path, method);
  }
  
  return result;
}

/**
 * Create tests for Koa route handlers
 */
function generateKoaTests(handlerName: string, path: string, method: string | null): string {
  return `import Koa from 'koa';
import Router from '@koa/router';
import request from 'supertest';
import { ${handlerName} } from './your-handler-file';

describe('${handlerName} API Tests', () => {
  let app;
  let server;
  
  beforeEach(() => {
    app = new Koa();
    const router = new Router();
    router.${method ? method.toLowerCase() : 'all'}('${path}', ${handlerName});
    app.use(router.routes());
    app.use(router.allowedMethods());
    
    server = app.listen();
  });
  
  afterEach(() => {
    server.close();
  });
  
  it('should return 200 OK', async () => {
    const response = await request(server).${method ? method.toLowerCase() : 'get'}('${path}');
    expect(response.status).toBe(200);
  });
  
  it('should return valid data structure', async () => {
    const response = await request(server).${method ? method.toLowerCase() : 'get'}('${path}');
    expect(response.body).toBeDefined();
  });
});
`;
}

/**
 * Transform Next.js API route to a standalone fetch API handler
 */
export function transformToStandalone(
  code: string, 
  filePath: string, 
  options: ApiRouteTransformOptions = { 
    targetFramework: 'standalone', 
    generateComments: true, 
    useTypescript: true,
    includeWebSockets: false,
    generateTests: false
  }
): ApiRouteTransformResult {
  const path = extractRoutePath(filePath);
  const method = detectHttpMethod(code);
  const handlerName = `handle${method || ''}${path.replace(/\//g, '_').replace(/:/g, '').replace('*', 'all')}`;
  const hasWebSockets = detectWebSocketUsage(code);
  
  // Parse the API handler function
  const handlerMatch = code.match(/export\s+default\s+(async\s+)?function\s+(\w+)?\s*\(\s*req\s*,\s*res\s*\)\s*{([\s\S]*?)}/);
  
  const result: ApiRouteTransformResult = {
    code: code,
    imports: [],
    warnings: [],
    handlerName,
    method,
    path
  };
  
  if (handlerMatch) {
    const isAsync = !!handlerMatch[1];
    let handlerBody = handlerMatch[3];
    
    // Transform Next.js specific code to Fetch API
    handlerBody = handlerBody.replace(/req\.query/g, 'url.searchParams');
    handlerBody = handlerBody.replace(/req\.body/g, 'await request.json()');
    handlerBody = handlerBody.replace(/res\.status\(([^)]+)\)\.json\(([^)]+)\)/g, 
      'new Response(JSON.stringify($2), { status: $1, headers: { "Content-Type": "application/json" } })');
    handlerBody = handlerBody.replace(/res\.json\(([^)]+)\)/g, 
      'new Response(JSON.stringify($1), { headers: { "Content-Type": "application/json" } })');
    handlerBody = handlerBody.replace(/res\.end\(\)/g, 'new Response(null, { status: 204 })');
    
    // Transform to standalone handler
    const standaloneHandler = `
/**
 * ${method || 'All methods'} handler for ${path}
 * Converted from Next.js API Route to Fetch API
 */
export ${isAsync ? 'async ' : ''}function ${handlerName}(request${options.useTypescript ? ': Request' : ''})${options.useTypescript ? ': Promise<Response>' : ''} {
  // Parse URL and extract query parameters
  const url = new URL(request.url);
  
  // Check if the method matches
  ${method ? 
    `if (request.method !== '${method}') {
    return new Response('Method Not Allowed', { status: 405 });
  }` : 
    '// This handler accepts any HTTP method'}
  
  // Converted from Next.js API Route
  // Original code used req and res, now we use request and directly return Response
  ${handlerBody.replace(/return res\.(.*)/g, function(match, method) {
    if (method.startsWith('status')) {
      const statusMatch = method.match(/status\((\d+)\)\.json\((.*)\)/);
      if (statusMatch) {
        return `return new Response(JSON.stringify(${statusMatch[2]}), { status: ${statusMatch[1]}, headers: { "Content-Type": "application/json" } });`;
      }
    } else if (method.startsWith('json')) {
      const jsonMatch = method.match(/json\((.*)\)/);
      if (jsonMatch) {
        return `return new Response(JSON.stringify(${jsonMatch[1]}), { headers: { "Content-Type": "application/json" } });`;
      }
    }
    return match;
  })}
}

// Example usage with a fetch event listener:
/*
addEventListener('fetch', (event) => {
  event.respondWith(${handlerName}(event.request));
});
*/
${hasWebSockets && options.includeWebSockets ? `
/**
 * WebSocket handler for the same endpoint
 */
export class ${handlerName.replace('handle', '')}WebSocketHandler {
  // Store active connections
  private connections = new Set<WebSocket>();
  
  constructor() {
    this.setupWebSocketServer();
  }
  
  setupWebSocketServer() {
    addEventListener('upgrade', (event) => {
      const request = event.request as Request;
      const url = new URL(request.url);
      
      // Only handle WebSocket connections to this endpoint
      if (url.pathname === '${path}/ws') {
        // Create a new WebSocket connection
        const { 0: client, 1: server } = Object.values(new WebSocketPair());
        
        // Accept the WebSocket connection
        server.accept();
        
        // Add to active connections
        this.connections.add(server);
        
        // Set up event handlers
        server.addEventListener('message', (event) => {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);
          
          // Echo the message back
          server.send(JSON.stringify({ received: data }));
        });
        
        server.addEventListener('close', () => {
          console.log('WebSocket connection closed');
          this.connections.delete(server);
        });
        
        // Respond with the WebSocket
        event.respondWith(new Response(null, { status: 101, webSocket: client }));
      }
    });
  }
  
  // Method to broadcast a message to all clients
  broadcast(message: any) {
    const json = JSON.stringify(message);
    this.connections.forEach((client) => {
      client.send(json);
    });
  }
}

// Usage:
/*
const wsHandler = new ${handlerName.replace('handle', '')}WebSocketHandler();
*/
` : ''}
`;
    
    result.code = code.replace(handlerMatch[0], standaloneHandler);
    
    // Add warning for complex conversions
    result.warnings.push('Complex response handling may need manual adjustment');
    
    if (code.includes('req.cookies') || code.includes('res.cookies')) {
      result.warnings.push('Cookie handling must be implemented manually with the Fetch API');
    }
    
    if (hasWebSockets && options.includeWebSockets) {
      result.warnings.push('WebSocket implementation uses the modern web standard WebSocketPair API, which may need adaptation for your deployment environment');
    }
  } else {
    result.warnings.push('Could not parse API handler function properly');
  }
  
  // Generate tests if requested
  if (options.generateTests) {
    result.tests = generateStandaloneTests(handlerName, path, method);
  }
  
  return result;
}

/**
 * Create tests for standalone route handlers
 */
function generateStandaloneTests(handlerName: string, path: string, method: string | null): string {
  return `// Using Vitest, Jest or similar test framework
import { ${handlerName} } from './your-handler-file';

describe('${handlerName} API Tests', () => {
  it('should return 200 OK', async () => {
    const request = new Request('http://localhost${path}', {
      method: ${method ? `'${method}'` : "'GET'"}
    });
    
    const response = await ${handlerName}(request);
    expect(response.status).toBe(200);
  });
  
  it('should return valid data structure', async () => {
    const request = new Request('http://localhost${path}', {
      method: ${method ? `'${method}'` : "'GET'"}
    });
    
    const response = await ${handlerName}(request);
    const data = await response.json();
    expect(data).toBeDefined();
  });
});
`;
}

/**
 * Handle WebSocket specific transformations
 */
export function transformWebSocketHandler(code: string, framework: string): WebSocketHandlerResult {
  const result: WebSocketHandlerResult = {
    setupCode: '',
    handlerCode: '',
    imports: [],
    warnings: []
  };
  
  switch (framework) {
    case 'express':
      result.imports = [
        "import { Server } from 'socket.io';",
        "import { createServer } from 'http';"
      ];
      result.setupCode = `
const app = express();
const server = createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('message', (data) => {
    console.log('Received message:', data);
    socket.emit('response', { received: data });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(3000);
`;
      break;
      
    case 'fastify':
      result.imports = [
        "import fastifyWebsocket from '@fastify/websocket';"
      ];
      result.setupCode = `
const fastify = Fastify();

// Register websocket plugin
await fastify.register(fastifyWebsocket);

// Register a websocket route
fastify.register(async function(fastify) {
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    console.log('Client connected');
    
    connection.socket.on('message', (message) => {
      const data = message.toString();
      console.log('Received message:', data);
      
      // Echo back the message
      connection.socket.send(JSON.stringify({ received: data }));
    });
    
    connection.socket.on('close', () => {
      console.log('Client disconnected');
    });
  });
});

await fastify.listen({ port: 3000 });
`;
      break;
      
    case 'koa':
      result.imports = [
        "import websocket from 'koa-websocket';"
      ];
      result.setupCode = `
const app = new Koa();
const wsApp = websocket(app);

wsApp.ws.use(function(ctx, next) {
  // Middleware for all websocket connections
  return next(ctx);
});

wsApp.ws.route('/ws').all(function(ctx) {
  console.log('Client connected');
  
  // Handle messages from client
  ctx.websocket.on('message', (message) => {
    const data = message.toString();
    console.log('Received message:', data);
    
    // Echo back the message
    ctx.websocket.send(JSON.stringify({ received: data }));
  });
  
  // Handle disconnect
  ctx.websocket.on('close', () => {
    console.log('Client disconnected');
  });
});

app.listen(3000);
`;
      break;
      
    case 'nestjs':
      result.imports = [
        "import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer } from '@nestjs/websockets';",
        "import { Server, Socket } from 'socket.io';"
      ];
      result.handlerCode = `
@WebSocketGateway()
export class MessagingGateway {
  @WebSocketServer()
  server: Server;

  // Handle connection event
  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  // Handle disconnection event
  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  // Handle custom message event
  @SubscribeMessage('message')
  handleMessage(client: Socket, @MessageBody() data: any): void {
    console.log('Received message:', data);
    
    // Echo back the message
    client.emit('response', { received: data });
  }
}
`;
      break;
      
    default:
      result.warnings.push(`WebSocket support for ${framework} framework not implemented`);
  }
  
  return result;
}

/**
 * Factory function to transform Next.js API routes to various backend targets
 */
export function transformApiRoute(
  code: string, 
  filePath: string, 
  options: ApiRouteTransformOptions
): ApiRouteTransformResult {
  switch (options.targetFramework) {
    case 'express':
      return transformToExpress(code, filePath, options);
    case 'fastify':
      return transformToFastify(code, filePath, options);
    case 'nestjs':
      return transformToNestJS(code, filePath, options);
    case 'koa':
      return transformToKoa(code, filePath, options);
    case 'standalone':
      return transformToStandalone(code, filePath, options);
    default:
      return transformToExpress(code, filePath, options);
  }
}
