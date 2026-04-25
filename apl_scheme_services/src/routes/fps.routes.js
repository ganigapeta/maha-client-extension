const fpsService = require('../services/fps.service');
const { successResponse, notFoundResponse, databaseErrorResponse } = require('../utils/response');

async function fpsRoutes(fastify, options) {
  // Get all FPS records
  fastify.get('/', {
    schema: {
      description: 'Get all FPS records with pagination, search, and filters',
      tags: ['FPS'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          search: { type: 'string' },
          isActive: { type: 'boolean' },
          afsoCode: { type: 'integer' },
          dfsoCode: { type: 'integer' },
          sortBy: { type: 'string', default: 'fps_code' },
          sortOrder: { type: 'string', enum: ['ASC', 'DESC'], default: 'ASC' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await fpsService.getAll(request.query);
      return reply.send(successResponse(result.data, 'FPS records retrieved successfully', result.pagination));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Get FPS by ID
  fastify.get('/:id', {
    schema: {
      description: 'Get FPS by ID',
      tags: ['FPS'],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } }
      }
    }
  }, async (request, reply) => {
    try {
      const fps = await fpsService.getById(request.params.id);
      if (!fps) return reply.status(404).send(notFoundResponse('FPS'));
      return reply.send(successResponse(fps, 'FPS retrieved successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Get FPS by AFSO code
  fastify.get('/afso/:afsoCode', {
    schema: {
      description: 'Get active FPS records by AFSO code',
      tags: ['FPS'],
      params: {
        type: 'object',
        properties: { afsoCode: { type: 'integer' } }
      }
    }
  }, async (request, reply) => {
    try {
      const fpsList = await fpsService.getAllActiveByAFSO(request.params.afsoCode);
      return reply.send(successResponse(fpsList, 'FPS records retrieved successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });
}

module.exports = fpsRoutes;
