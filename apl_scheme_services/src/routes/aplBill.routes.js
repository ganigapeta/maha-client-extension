const aplBillService = require('../services/aplBill.service');
const { successResponse, notFoundResponse, databaseErrorResponse, validationErrorResponse } = require('../utils/response');

async function aplBillRoutes(fastify, options) {
  // Get all BILL records
  fastify.get('/', {
    schema: {
      description: 'Get all BILL records with pagination, search, and filters',
      tags: ['APL Bill'],
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
      const result = await aplBillService.getAll(request.query);
      return reply.send(successResponse(result.data, 'BILL records retrieved successfully', result.pagination));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Get BILL by ID
  fastify.get('/:id', {
    schema: {
      description: 'Get BILL record by ID',
      tags: ['APL Bill'],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } }
      }
    }
  }, async (request, reply) => {
    try {
      const BILL = await aplBillService.getById(request.params.id);
      if (!wip) return reply.status(404).send(notFoundResponse('BILL record'));
      return reply.send(successResponse(wip, 'BILL record retrieved successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Bulk insert BILL records
  fastify.post('/bulk', {
    schema: {
      description: 'Bulk insert BILL records',
      tags: ['APL Bill'],
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
      const result = await aplBillService.bulkInsert(request.body, userId);
      
      return reply.status(201).send(successResponse(
        result.data, 
        `Successfully inserted ${result.count} BILL records`, 
        { count: result.count }
      ));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Create Allotment record with flexible column support
  fastify.post('/allotment', {
    schema: {
      description: 'Create new allotment record - supports flexible column insertion',
      tags: ['APL Bill'],
      body: {
        type: 'object',
        properties: {
          scrutiny_id: { type: 'integer' },
          application_no: { type: 'string' },
          allotment_id: { type: 'string' },
          rc_no: { type: 'integer' },
          member_id: { type: 'integer' },
          fy: { type: 'string' },
          mm: { type: 'integer' },
          member_count: { type: 'integer' },
          hof_name: { type: 'string' },
          amount: { type: 'number' },
          rft_no: { type: 'string' },
          rft_date: { type: 'string', format: 'date' },
          rft_status: { type: 'string' },
          rft_generated_by: { type: 'integer' },
          bill_no: { type: 'string' },
          bill_date: { type: 'string', format: 'date' },
          bill_generated_by: { type: 'integer' },
          pfms_batch_no: { type: 'string' },
          pfms_batch_date: { type: 'string', format: 'date' },
          batch_generated_by: { type: 'integer' },
          is_payment_processed: { type: 'boolean' },
          is_active: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = request.headers['x-user-id'] || 1;
      const allotment = await aplBillService.createAllotment(request.body, userId);
      return reply.status(201).send(successResponse(allotment, 'Allotment record created successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Bulk create Allotment records
  fastify.post('/allotment/bulk', {
    schema: {
      description: 'Bulk create allotment records - supports flexible column insertion',
      tags: ['APL Bill'],
      body: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            scrutiny_id: { type: 'integer' },
            application_no: { type: 'string' },
            allotment_id: { type: 'string' },
            rc_no: { type: 'integer' },
            member_id: { type: 'integer' },
            fy: { type: 'string' },
            mm: { type: 'integer' },
            member_count: { type: 'integer' },
            hof_name: { type: 'string' },
            amount: { type: 'number' },
            rft_no: { type: 'string' },
            rft_date: { type: 'string', format: 'date' },
            rft_status: { type: 'string' },
            rft_generated_by: { type: 'integer' },
            bill_no: { type: 'string' },
            bill_date: { type: 'string', format: 'date' },
            bill_generated_by: { type: 'integer' },
            pfms_batch_no: { type: 'string' },
            pfms_batch_date: { type: 'string', format: 'date' },
            batch_generated_by: { type: 'integer' },
            is_payment_processed: { type: 'boolean' },
            is_active: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      if (!Array.isArray(request.body) || request.body.length === 0) {
        return reply.status(400).send(validationErrorResponse('Request body must be a non-empty array'));
      }

      const userId = request.headers['x-user-id'] || 1;
      const result = await aplBillService.bulkCreateAllotment(request.body, userId);
      
      return reply.status(201).send(successResponse(
        result.data,
        `Successfully created ${result.count} allotment record(s)`,
        { count: result.count }
      ));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Update BILL record
  fastify.put('/:id', {
    schema: {
      description: 'Update BILL record',
      tags: ['APL Bill'],
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
      const BILL = await aplBillService.update(request.params.id, request.body, userId);
      if (!BILL) return reply.status(404).send(notFoundResponse('BILL record'));
      return reply.send(successResponse(BILL, 'BILL record updated successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Approve BILL record
  fastify.patch('/:id/approve', {
    schema: {
      description: 'Approve BILL record',
      tags: ['APL Bill'],
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
      const BILL = await aplBillService.approve(request.params.id, userId, request.body.remarks);
      if (!BILL) return reply.status(404).send(notFoundResponse('BILL record'));
      return reply.send(successResponse(BILL, 'BILL record approved successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Reject BILL record
  fastify.patch('/:id/reject', {
    schema: {
      description: 'Reject BILL record',
      tags: ['APL Bill'],
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
      const BILL = await aplBillService.reject(request.params.id, userId, request.body.remarks);
      if (!BILL) return reply.status(404).send(notFoundResponse('BILL record'));
      return reply.send(successResponse(BILL, 'BILL record rejected successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });

  // Delete BILL record
  fastify.delete('/:id', {
    schema: {
      description: 'Delete BILL record',
      tags: ['APL Bill'],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } }
      }
    }
  }, async (request, reply) => {
    try {
      const BILL = await aplBillService.delete(request.params.id);
      if (!BILL) return reply.status(404).send(notFoundResponse('BILL record'));
      return reply.send(successResponse(BILL, 'BILL record deleted successfully'));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });


  // Bulk update BILL status (for DFSO approve/reject)
  fastify.post('/allotment/bulk-update-status', {
    schema: {
      description: 'Bulk update BILL record status (APPROVE or REJECT)',
      tags: ['APL Bill'],
      body: {
        type: 'object',
        required: ['allotment_id', 'status'],
        properties: {
          allotment_id: { 
            type: 'array', 
            items: { type: 'integer' },
            description: 'Array of RC numbers to update'
          },
          status: { 
            type: 'string', 
            enum: ['APPROVED', 'REJECTED', 'BILL_GENERATED', 'DISBURSED'],
            description: 'New status for the records'
          },
          remarks: { 
            type: 'string',
            description: 'Optional remarks (required for REJECTED status)'
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { rc_numbers, status, remarks } = request.body;
      
      // Validate remarks for REJECTED status
      if (status === 'REJECTED' && !remarks) {
        return reply.status(400).send(validationErrorResponse('Remarks are required when rejecting records'));
      }
      
      const userId = request.headers['x-user-id'] || 1;
      const result = await aplBillService.bulkUpdateStatus(rc_numbers, status, remarks, userId);
      
      return reply.send(successResponse(
        result.data,
        `Successfully updated ${result.count} record(s) to ${status}`,
        { count: result.count }
      ));
    } catch (error) {
      return reply.status(500).send(databaseErrorResponse(error));
    }
  });
}

module.exports = aplBillRoutes;
