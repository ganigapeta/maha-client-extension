const fastify = require('fastify');
const cors = require('@fastify/cors');
const swagger = require('@fastify/swagger');
const swaggerUi = require('@fastify/swagger-ui');
const db = require('./config/database');
// const cors = require('cors');

require('dotenv').config();


// Initialize Fastify
const app = fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    // prettyPrint: process.env.NODE_ENV !== 'production'
  }
});


// Register CORS
app.register(cors, {
  // origin: true, // Allow all origins in development (configure for production)
    origin: '*',
    credentials: true

});


// Register Swagger
app.register(swagger, {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'APL Scheme API',
      description: 'API documentation for APL (Antyodaya Parivar Yojana) Scheme Management System',
      version: '1.0.0',
      contact: {
        name: 'API Support',
        email: 'support@aplscheme.gov.in'
      }
    },
    servers: [
				{ url: `http://${process.env.INSTANCE_BASE_URL || 'localhost:3000'}` },
				{ url: `https://${process.env.INSTANCE_BASE_URL || 'localhost:3000'}` }
			],

    tags: [
      { name: 'DFSO', description: 'District Food & Supplies Officer endpoints' },
      { name: 'AFSO', description: 'Assistant Food & Supplies Officer endpoints' },
      { name: 'FPS', description: 'Fair Price Shop endpoints' },
      { name: 'APL Data', description: 'APL Beneficiary Data endpoints' },
      { name: 'APL WIP', description: 'APL Work-In-Progress endpoints' }
    ]
  }
});

// Register Swagger UI
app.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true
  },
  staticCSP: true
});

// Health check endpoint
app.get('/health', async (request, reply) => {
  try {
    // Test database connection
    await db.query('SELECT 1');
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime()
    };
  } catch (error) {
    reply.status(503);
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    };
  }
});

// Root endpoint
app.get('/', async (request, reply) => {
  return {
    message: 'APL Scheme API',
    version: '1.0.0',
    documentation: '/docs',
    health: '/health'
  };
});

// Register API routes
const apiPrefix = process.env.API_PREFIX || '/api/v1';

app.register(require('./routes/dfso.routes'), { prefix: `${apiPrefix}/dfso` });
app.register(require('./routes/afso.routes'), { prefix: `${apiPrefix}/afso` });
app.register(require('./routes/fps.routes'), { prefix: `${apiPrefix}/fps` });
app.register(require('./routes/aplData.routes'), { prefix: `${apiPrefix}/apl-data` });
app.register(require('./routes/aplWip.routes'), { prefix: `${apiPrefix}/apl-wip` });
app.register(require('./routes/aplBill.routes'), { prefix: `${apiPrefix}/apl-bill` });

// Global error handler
app.setErrorHandler((error, request, reply) => {
  app.log.error(error);
  
  const statusCode = error.statusCode || 500;
  
  reply.status(statusCode).send({
    success: false,
    message: error.message || 'Internal Server Error',
    statusCode: statusCode,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`${signal} received. Starting graceful shutdown...`);
  
  try {
    await app.close();
    await db.pool.end();
    console.log('Server closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
