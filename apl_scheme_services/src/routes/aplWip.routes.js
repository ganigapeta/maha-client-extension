const aplWipService = require('../services/aplWip.service');
const { successResponse, notFoundResponse, databaseErrorResponse, validationErrorResponse } = require('../utils/response');

async function aplWipRoutes(fastify, options) {
  // Get all WIP records
  fastify.get('/', {
    schema: {
      description: 'Get all WIP records with pagination, search, and filters',
      tags: ['APL WIP'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          search: { type: 'string' },
          isActive: { type: 'boolean' },
          status: { type: 'string', enum: ['SCRUTINY_PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] },
          dfsoCode: { type: 'integer' },
          afsoCode: { type: 'integer' },
          fpsCode: { type: 'integer' },
          fy: { type: 'string', description: 'Financial Year (e.g., 2023-2024)' },
          mm: { type: 'integer', minimum: 1, maximum: 12, description: 'Month number (1-12)' },
          sortBy: { type: 'string', default: 'created_at' },
          sortOrder: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await aplWipService.getAll(request.query);
      return reply.send(successResponse(result.data, 'WIP records retrieved successfully', result.pagination));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Get WIP by ID
  fastify.get('/:id', {
    schema: {
      description: 'Get WIP record by ID',
      tags: ['APL WIP'],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } }
      }
    }
  }, async (request, reply) => {
    try {
      const wip = await aplWipService.getById(request.params.id);
      if (!wip) return reply.status(404).send(notFoundResponse('WIP record'));
      return reply.send(successResponse(wip, 'WIP record retrieved successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Bulk insert WIP records
  fastify.post('/bulk', {
    schema: {
      description: 'Bulk insert WIP records',
      tags: ['APL WIP'],
      body: {
        type: 'array',
        items: {
          type: 'object',
          required: ['dist_code','dfso_code', 'afso_code', 
                     'fps_code', 'fps_name', 'rc_no', 'hof_name', 'member_id'],
          properties: {
          dist_code: { type: 'integer' },
          dfso_code: { type: 'integer' },
          afso_code: { type: 'integer' },
          fps_code: { type: 'integer' },
          fps_name: { type: 'string' },
          rc_no: { type: 'integer' },
          hof_name: { type: 'string' },
          member_id: { type: 'integer' },
          total_benefit_amount: { type: 'number' },
          is_disbursement_account: { type: 'boolean' },
          status: { type: 'string', enum: ['SCRUTINY_PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] }
         }
        }
      }
    }
  }, async (request, reply) => {
    try {
      if (!Array.isArray(request.body) || request.body.length === 0) {
        return reply.status(400).send(validationErrorResponse('Request body must be a non-empty array'));
      }

      const userId = request.headers['x-user-id'] || 1; // In production, get from auth token
      const result = await aplWipService.bulkInsert(request.body, userId);
      
      return reply.status(201).send(successResponse(
        result.data, 
        `Successfully inserted ${result.count} WIP records`, 
        { count: result.count }
      ));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Create WIP record
  fastify.post('/', {
    schema: {
      description: 'Create new WIP record',
      tags: ['APL WIP'],
      body: {
        type: 'object',
        required: ['dist_code', 'dist_name', 'dfso_code', 'dfso_name', 'afso_code', 'afso_name', 
                   'fps_code', 'fps_name', 'rc_no', 'hof_name', 'member_id', 'member_name'],
        properties: {
          dist_code: { type: 'integer' },
          dfso_code: { type: 'integer' },
          afso_code: { type: 'integer' },
          fps_code: { type: 'integer' },
          fps_name: { type: 'string' },
          rc_no: { type: 'integer' },
          hof_name: { type: 'string' },
          member_id: { type: 'integer' },
          total_benefit_amount: { type: 'number' },
          is_disbursement_account: { type: 'boolean' },
          status: { type: 'string', enum: ['SCRUTINY_PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = request.headers['x-user-id'] || 1; // In production, get from auth token
      const wip = await aplWipService.create(request.body, userId);
      return reply.status(201).send(successResponse(wip, 'WIP record created successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Update WIP record
  fastify.put('/:id', {
    schema: {
      description: 'Update WIP record',
      tags: ['APL WIP'],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } }
      },
      body: {
        type: 'object',
        required: ['dist_code', 'dist_name', 'dfso_code', 'dfso_name', 'afso_code', 'afso_name', 
                   'fps_code', 'fps_name', 'rc_no', 'hof_name', 'member_id', 'member_name']
      }
    }
  }, async (request, reply) => {
    try {
      const userId = request.headers['x-user-id'] || 1;
      const wip = await aplWipService.update(request.params.id, request.body, userId);
      if (!wip) return reply.status(404).send(notFoundResponse('WIP record'));
      return reply.send(successResponse(wip, 'WIP record updated successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Approve WIP record
  fastify.patch('/:id/approve', {
    schema: {
      description: 'Approve WIP record',
      tags: ['APL WIP'],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } }
      },
      body: {
        type: 'object',
        properties: {
          remarks: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = request.headers['x-user-id'] || 1;
      const wip = await aplWipService.approve(request.params.id, userId, request.body.remarks);
      if (!wip) return reply.status(404).send(notFoundResponse('WIP record'));
      return reply.send(successResponse(wip, 'WIP record approved successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Reject WIP record
  fastify.patch('/:id/reject', {
    schema: {
      description: 'Reject WIP record',
      tags: ['APL WIP'],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } }
      },
      body: {
        type: 'object',
        properties: {
          remarks: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = request.headers['x-user-id'] || 1;
      const wip = await aplWipService.reject(request.params.id, userId, request.body.remarks);
      if (!wip) return reply.status(404).send(notFoundResponse('WIP record'));
      return reply.send(successResponse(wip, 'WIP record rejected successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Delete WIP record
  fastify.delete('/:id', {
    schema: {
      description: 'Delete WIP record',
      tags: ['APL WIP'],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } }
      }
    }
  }, async (request, reply) => {
    try {
      const wip = await aplWipService.delete(request.params.id);
      if (!wip) return reply.status(404).send(notFoundResponse('WIP record'));
      return reply.send(successResponse(wip, 'WIP record deleted successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Get WIP statistics
  fastify.get('/stats/summary', {
    schema: {
      description: 'Get WIP statistics summary',
      tags: ['APL WIP']
    }
  }, async (request, reply) => {
    try {
      const stats = await aplWipService.getStatistics();
      return reply.send(successResponse(stats, 'WIP statistics retrieved successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Get Old Scrutiny Records - Latest APPROVED records matching with t_apl_data
  fastify.get('/old-scrutiny', {
    schema: {
      description: 'Get latest distinct APPROVED records where all family members have been approved (based on last approved FY/MM for the FPS)',
      tags: ['APL WIP'],
      querystring: {
        type: 'object',
        required: ['fpsCode'],
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 1000, default: 10 },
          fpsCode: { type: 'integer', description: 'FPS Code (required)' },
          afsoCode: { type: 'integer' },
          dfsoCode: { type: 'integer' },
          distCode: { type: 'integer' },
          sortBy: { type: 'string', default: 'rc_no' },
          sortOrder: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await aplWipService.getOldScrutinyRecords(request.query);
      return reply.send(successResponse(result.data, 'Old scrutiny records retrieved successfully', result.pagination));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });


  // Get Old Scrutiny Records - Latest APPROVED records matching with t_apl_data
  fastify.get('/old-scrutiny/v2', {
    schema: {
      description: 'Get latest distinct APPROVED records where all family records match with t_apl_data (irrespective of month and year filters)',
      tags: ['APL WIP'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 1000, default: 10 },
          fpsCode: { type: 'integer' },
          afsoCode: { type: 'integer' },
          dfsoCode: { type: 'integer' },
          fy: { type: 'string', description: 'Financial Year (e.g., 2023-2024) - informational only' },
          mm: { type: 'integer', minimum: 1, maximum: 12, description: 'Month number (1-12) - informational only' },
          status: { type: 'string', enum: ['APPROVED'], default: 'APPROVED', description: 'Fixed to APPROVED for old scrutiny' },
          latestOnly: { type: 'boolean', default: true, description: 'Get latest distinct records only' },
          sortBy: { type: 'string', default: 'rc_no' },
          sortOrder: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await aplWipService.getOldScrutinyRecordsV2(request.query);
      return reply.send(successResponse(result.data, 'Old scrutiny records retrieved successfully', result.pagination));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Bulk update WIP status (for DFSO approve/reject)
  fastify.post('/bulk-update-status', {
    schema: {
      description: 'Bulk update WIP record status (APPROVE or REJECT)',
      tags: ['APL WIP'],
      body: {
        type: 'object',
        required: ['rc_numbers', 'status'],
        properties: {
          rc_numbers: { 
            type: 'array', 
            items: { type: 'integer' },
            description: 'Array of RC numbers to update'
          },
          status: { 
            type: 'string', 
            enum: ['APPROVED', 'REJECTED', 'ALLOTED', 'BILL_GENERATED', 'DISBURSED'],
            description: 'New status for the records'
          },
          fy: { type: 'string', description: 'Financial Year (e.g., 2023-2024) - informational only' },
          mm: { type: 'integer', minimum: 1, maximum: 12, description: 'Month number (1-12) - informational only' },
          remarks: { 
            type: 'string',
            description: 'Optional remarks (required for REJECTED status)'
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { rc_numbers, status, remarks, fy, mm } = request.body;
      
      // Validate remarks for REJECTED status
      if (status === 'REJECTED' && !remarks) {
        return reply.status(400).send(validationErrorResponse('Remarks are required when rejecting records'));
      }
      
      const userId = request.headers['x-user-id'] || 1;
      const result = await aplWipService.bulkUpdateStatus(rc_numbers, status, remarks, userId, fy, mm, request.body);
      
      return reply.send(successResponse(
        result.data,
        `Successfully updated ${result.count} record(s) to ${status}`,
        { count: result.count }
      ));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });


  // Bulk update WIP status (for DFSO approve/reject)
  fastify.post('/rft-update', {
    schema: {
      description: 'Bulk update WIP record status (APPROVE or REJECT)',
      tags: ['APL WIP'],
      body: {
        type: 'object',
        required: ['rc_numbers', 'status'],
        properties: {
          rc_numbers: { 
            type: 'array', 
            items: { type: 'integer' },
            description: 'Array of RC numbers to update'
          },
          bill_no: { 
            type: 'string', 
            items: { type: 'string' },
            description: 'Bill Number'
          },
          status: { 
            type: 'string', 
            enum: ['APPROVED', 'REJECTED', 'ALLOTED', 'BILL_GENERATED', 'DISBURSED', 'RFT_GENERATED'],
            description: 'New status for the records'
          },
          fy: { type: 'string', description: 'Financial Year (e.g., 2023-2024) - informational only' },
          mm: { type: 'integer', minimum: 1, maximum: 12, description: 'Month number (1-12) - informational only' },
          remarks: { 
            type: 'string',
            description: 'Optional remarks (required for REJECTED status)'
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { rc_numbers, status, remarks, fy, mm } = request.body;
      
      // Validate remarks for REJECTED status
      if (status === 'REJECTED' && !remarks) {
        return reply.status(400).send(validationErrorResponse('Remarks are required when rejecting records'));
      }
      
      const userId = request.headers['x-user-id'] || request?.body?.userId || 1;
      const result = await aplWipService.updateRftStatus(rc_numbers, status, remarks, userId, fy, mm, request.body);
      
      if(result.success){
        return reply.send(successResponse(
          result.data,
          `Successfully updated ${result.count} record(s) to ${status}`,
          { count: result.count }
        ));
      } else {
        return reply.status(400).send(validationErrorResponse(result.message));
      }
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Bulk update WIP status (for DFSO approve/reject)
  fastify.post('/bill-update', {
    schema: {
      description: 'Bulk update WIP record status (APPROVE or REJECT)',
      tags: ['APL WIP'],
      body: {
        type: 'object',
        required: ['bill_no', 'status'],
        properties: {
          bill_no: { 
            type: 'string', 
            items: { type: 'string' },
            description: 'Bill Number'
          },
          status: { 
            type: 'string', 
            enum: ['APPROVED', 'REJECTED', 'ALLOTED', 'BILL_GENERATED', 'DISBURSED', 'RFT_GENERATED',"SIGNED_BY_DDO", "XML_GENERATED"],
            description: 'New status for the records'
          },
          fy: { type: 'string', description: 'Financial Year (e.g., 2023-2024) - informational only' },
          mm: { type: 'integer', minimum: 1, maximum: 12, description: 'Month number (1-12) - informational only' },
          
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { bill_no, status, remarks, fy, mm } = request.body;

      
      const userId = request.headers['x-user-id'] || request?.body?.userId || 1;
      const result = await aplWipService.updateBillStatus(bill_no, status, remarks, userId, fy, mm, request.body);
      
      if(result.success){
        return reply.send(successResponse(
          result.data,
          `Successfully updated ${result.count} record(s) to ${status}`,
          { count: result.count }
        ));
      } else {
        return reply.status(400).send(validationErrorResponse(result.message));
      }
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });


  fastify.get('/fetch/beneficiaries', {
    schema: {
      description: 'Get all WIP records with pagination, search, and filters',
      tags: ['APL WIP'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          search: { type: 'string' },
          isActive: { type: 'boolean' },
          status: { type: 'string', enum: ['SCRUTINY_PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] },
          dfsoCode: { type: 'integer' },
          afsoCode: { type: 'integer' },
          fpsCode: { type: 'integer' },
          fy: { type: 'string', description: 'Financial Year (e.g., 2023-2024)' },
          mm: { type: 'integer', minimum: 1, maximum: 12, description: 'Month number (1-12)' },
          sortBy: { type: 'string', default: 'created_at' },
          sortOrder: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await aplWipService.getAllBeneficiaries(request.query);
      return reply.send(successResponse(result.data, 'WIP records retrieved successfully', result.pagination));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });
}

module.exports = aplWipRoutes;
