const app = require('./src/app');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Start server
const start = async () => {
  try {
    await app.listen({ port: PORT, host: HOST });
    
    console.log('='.repeat(60));
    console.log('🚀 APL Scheme API Server Started Successfully!');
    console.log('='.repeat(60));
    console.log(`📍 Server running at: http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/docs`);
    console.log(`💚 Health Check: http://localhost:${PORT}/health`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}${process.env.API_PREFIX || '/api/v1'}`);
    console.log('='.repeat(60));
    console.log('\nAvailable Endpoints:');
    console.log(`  • DFSO:    ${process.env.API_PREFIX || '/api/v1'}/dfso`);
    console.log(`  • AFSO:    ${process.env.API_PREFIX || '/api/v1'}/afso`);
    console.log(`  • FPS:     ${process.env.API_PREFIX || '/api/v1'}/fps`);
    console.log(`  • APL WIP: ${process.env.API_PREFIX || '/api/v1'}/apl-wip`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

start();
