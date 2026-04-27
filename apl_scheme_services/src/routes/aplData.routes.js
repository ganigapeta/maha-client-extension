const aplDataService = require('../services/aplData.service');
const { successResponse, notFoundResponse, databaseErrorResponse } = require('../utils/response');

async function aplDataRoutes(fastify, options) {
  // Get all APL Data with pagination and filters
  fastify.get('/', {
    schema: {
      description: 'Get all APL Data records with pagination, search, and filters. Supports excluding already submitted records for a specific financial year and month.',
      tags: ['APL Data'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 1000, default: 10 },
          search: { type: 'string' },
          isActive: { type: 'boolean' },
          dfsoCode: { type: 'integer' },
          afsoCode: { type: 'integer' },
          fpsCode: { type: 'integer' },
          rcNo: { type: 'integer' },
          distCode: { type: 'integer' },
          sortBy: { type: 'string', default: 'rc_no' },
          sortOrder: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' },
          fy: { type: 'string', description: 'Financial Year (e.g., 2026-27)' },
          mm: { type: 'integer', minimum: 1, maximum: 12, description: 'Month number (1-12)' },
          excludeSubmitted: { type: 'boolean', description: 'Exclude families already submitted for the selected fy and mm' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await aplDataService.getAll(request.query);
      return reply.send(successResponse(result.data, 'APL Data records retrieved successfully', result.pagination));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Get APL Data by ID
  fastify.get('/:id', {
    schema: {
      description: 'Get APL Data by ID',
      tags: ['APL Data'],
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
      const data = await aplDataService.getById(request.params.id);
      if (!data) {
        return reply.status(404).send(notFoundResponse('APL Data record'));
      }
      return reply.send(successResponse(data, 'APL Data record retrieved successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Get APL Data by Ration Card Number
  fastify.get('/ration-card/:rcNo', {
    schema: {
      description: 'Get all family members by Ration Card Number',
      tags: ['APL Data'],
      params: {
        type: 'object',
        properties: {
          rcNo: { type: 'integer' }
        },
        required: ['rcNo']
      }
    }
  }, async (request, reply) => {
    try {
      const data = await aplDataService.getByRationCard(request.params.rcNo);
      if (!data || data.length === 0) {
        return reply.status(404).send(notFoundResponse('Family with this Ration Card Number'));
      }
      return reply.send(successResponse(data, 'Family members retrieved successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Get APL Data grouped by families for FPS
  fastify.get('/fps/:fpsCode/families', {
    schema: {
      description: 'Get families grouped by FPS Code',
      tags: ['APL Data'],
      params: {
        type: 'object',
        properties: {
          fpsCode: { type: 'integer' }
        },
        required: ['fpsCode']
      },
      querystring: {
        type: 'object',
        properties: {
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const data = await aplDataService.getByFPSGrouped(request.params.fpsCode, request.query);
      return reply.send(successResponse(data, 'Families retrieved successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Get statistics by DFSO
  fastify.get('/stats/dfso/:dfsoCode', {
    schema: {
      description: 'Get APL Data statistics by DFSO Code',
      tags: ['APL Data'],
      params: {
        type: 'object',
        properties: {
          dfsoCode: { type: 'integer' }
        },
        required: ['dfsoCode']
      }
    }
  }, async (request, reply) => {
    try {
      const stats = await aplDataService.getStatsByDFSO(request.params.dfsoCode);
      return reply.send(successResponse(stats, 'DFSO statistics retrieved successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Get statistics by AFSO
  fastify.get('/stats/afso/:afsoCode', {
    schema: {
      description: 'Get APL Data statistics by AFSO Code',
      tags: ['APL Data'],
      params: {
        type: 'object',
        properties: {
          afsoCode: { type: 'integer' }
        },
        required: ['afsoCode']
      }
    }
  }, async (request, reply) => {
    try {
      const stats = await aplDataService.getStatsByAFSO(request.params.afsoCode);
      return reply.send(successResponse(stats, 'AFSO statistics retrieved successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Get statistics by FPS
  fastify.get('/stats/fps/:fpsCode', {
    schema: {
      description: 'Get APL Data statistics by FPS Code',
      tags: ['APL Data'],
      params: {
        type: 'object',
        properties: {
          fpsCode: { type: 'integer' }
        },
        required: ['fpsCode']
      }
    }
  }, async (request, reply) => {
    try {
      const stats = await aplDataService.getStatsByFPS(request.params.fpsCode);
      return reply.send(successResponse(stats, 'FPS statistics retrieved successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });
}

module.exports = aplDataRoutes;
