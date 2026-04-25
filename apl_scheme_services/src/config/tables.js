require('dotenv').config();

/**
 * Database Tables Configuration
 * All table names and schema are configured via environment variables
 * to avoid hardcoding and enable easy configuration changes
 */

const aplSchema =  process.env.DB_SCHEMA || 'public';

const config = {
  schema: process.env.DB_SCHEMA || 'public',
  tables: {
    DFSO: `${aplSchema}.${process.env.TABLE_DFSO || 'm_dfso'}`,
    AFSO: `${aplSchema}.${process.env.TABLE_AFSO || 'm_afso'}`,
    FPS: `${aplSchema}.${process.env.TABLE_FPS || 'm_fps'}`,
    APL_DATA: `${aplSchema}.${process.env.TABLE_APL_DATA || 't_apl_data'}`,
    APL_WIP: `${aplSchema}.${process.env.TABLE_APL_WIP || 't_apl_wip_data'}`,
    APL_ALLOTMENT_DETAIL: `${aplSchema}.${process.env.TABLE_APL_ALLOTMENT_DETAIL || 't_apl_allotment_detail'}`

  }
};

/**
 * Get fully qualified table name (schema.table)
 * @param {string} tableName - The table name from config.tables
 * @returns {string} - Fully qualified table name
 */
const getFullTableName = (tableName) => {
  return `${config.schema}.${tableName}`;
};

/**
 * Get table name with alias
 * @param {string} tableName - The table name from config.tables
 * @param {string} alias - The alias to use
 * @returns {string} - Table name with alias
 */
const getTableWithAlias = (tableName, alias) => {
  return `${tableName} ${alias}`;
};

module.exports = {
  schema: config.schema,
  tables: config.tables,
  getFullTableName,
  getTableWithAlias
};
