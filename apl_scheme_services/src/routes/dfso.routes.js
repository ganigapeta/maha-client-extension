const dfsoService = require('../services/dfso.service');
const { successResponse, errorResponse, notFoundResponse, databaseErrorResponse } = require('../utils/response');

async function dfsoRoutes(fastify, options) {
  // Get all DFSO records with pagination and filters
  fastify.get('/', {
    schema: {
      description: 'Get all DFSO records with pagination, search, and filters',
      tags: ['DFSO'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          search: { type: 'string' },
          isActive: { type: 'boolean' },
          sortBy: { type: 'string', default: 'dfso_code' },
          sortOrder: { type: 'string', enum: ['ASC', 'DESC'], default: 'ASC' }
        }
      },
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'array' },
            pagination: { type: 'object' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await dfsoService.getAll(request.query);
      return reply.send(successResponse(result.data, 'DFSO records retrieved successfully', result.pagination));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Get DFSO by ID
  fastify.get('/:id', {
    schema: {
      description: 'Get DFSO by ID',
      tags: ['DFSO'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const dfso = await dfsoService.getById(request.params.id);
      if (!dfso) {
        return reply.status(404).send(notFoundResponse('DFSO'));
      }
      return reply.send(successResponse(dfso, 'DFSO retrieved successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Get DFSO by code
  fastify.get('/code/:code', {
    schema: {
      description: 'Get DFSO by code',
      tags: ['DFSO'],
      params: {
        type: 'object',
        properties: {
          code: { type: 'integer' }
        },
        required: ['code']
      }
    }
  }, async (request, reply) => {
    try {
      const dfso = await dfsoService.getByCode(request.params.code);
      if (!dfso) {
        return reply.status(404).send(notFoundResponse('DFSO'));
      }
      return reply.send(successResponse(dfso, 'DFSO retrieved successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Get all active DFSO records
  fastify.get('/active/all', {
    schema: {
      description: 'Get all active DFSO records',
      tags: ['DFSO']
    }
  }, async (request, reply) => {
    try {
      const dfsoList = await dfsoService.getAllActive();
      return reply.send(successResponse(dfsoList, 'Active DFSO records retrieved successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Get DFSO with hierarchy
  fastify.get('/:id/hierarchy', {
    schema: {
      description: 'Get DFSO with hierarchy (AFSO and FPS counts)',
      tags: ['DFSO'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const dfso = await dfsoService.getWithHierarchy(request.params.id);
      if (!dfso) {
        return reply.status(404).send(notFoundResponse('DFSO'));
      }
      return reply.send(successResponse(dfso, 'DFSO hierarchy retrieved successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });
}

module.exports = dfsoRoutes;
