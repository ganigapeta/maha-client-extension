const afsoService = require('../services/afso.service');
const { successResponse, notFoundResponse, databaseErrorResponse } = require('../utils/response');

async function afsoRoutes(fastify, options) {
  // Get all AFSO records
  fastify.get('/', {
    schema: {
      description: 'Get all AFSO records with pagination, search, and filters',
      tags: ['AFSO'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          search: { type: 'string' },
          isActive: { type: 'boolean' },
          dfsoCode: { type: 'integer' },
          sortBy: { type: 'string', default: 'afso_code' },
          sortOrder: { type: 'string', enum: ['ASC', 'DESC'], default: 'ASC' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await afsoService.getAll(request.query);
      return reply.send(successResponse(result.data, 'AFSO records retrieved successfully', result.pagination));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Get AFSO by ID
  fastify.get('/:id', {
    schema: {
      description: 'Get AFSO by ID',
      tags: ['AFSO'],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } }
      }
    }
  }, async (request, reply) => {
    try {
      const afso = await afsoService.getById(request.params.id);
      if (!afso) return reply.status(404).send(notFoundResponse('AFSO'));
      return reply.send(successResponse(afso, 'AFSO retrieved successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Get AFSO by DFSO code
  fastify.get('/dfso/:dfsoCode', {
    schema: {
      description: 'Get active AFSO records by DFSO code',
      tags: ['AFSO'],
      params: {
        type: 'object',
        properties: { dfsoCode: { type: 'integer' } }
      }
    }
  }, async (request, reply) => {
    try {
      const afsoList = await afsoService.getAllActiveByDFSO(request.params.dfsoCode);
      return reply.send(successResponse(afsoList, 'AFSO records retrieved successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Get AFSO with hierarchy
  fastify.get('/:id/hierarchy', {
    schema: {
      description: 'Get AFSO with hierarchy (FPS count)',
      tags: ['AFSO'],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } }
      }
    }
  }, async (request, reply) => {
    try {
      const afso = await afsoService.getWithHierarchy(request.params.id);
      if (!afso) return reply.status(404).send(notFoundResponse('AFSO'));
      return reply.send(successResponse(afso, 'AFSO hierarchy retrieved successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });
}

module.exports = afsoRoutes;
