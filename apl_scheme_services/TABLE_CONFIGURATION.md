# Table Configuration Refactoring

## Overview
This document describes the refactoring completed to remove hardcoded table names and schema names from service files, making them configurable via environment variables.

## Changes Made

### 1. Configuration Files

#### `.env` and `.env.example`
Added new environment variables for database schema and table names:

```env
# Database Schema and Table Configuration
DB_SCHEMA=public
TABLE_DFSO=m_dfso
TABLE_AFSO=m_afso
TABLE_FPS=m_fps
TABLE_APL_DATA=t_apl_data
TABLE_APL_WIP=t_apl_wip_data
```

#### `src/config/tables.js` (NEW)
Created a centralized configuration file that:
- Reads table names from environment variables
- Provides default values if env variables are not set
- Exports a `tables` object for easy access
- Includes helper functions for generating fully qualified table names

```javascript
const { tables } = require('../config/tables');
// Usage: tables.DFSO, tables.AFSO, tables.FPS, etc.
```

### 2. Refactored Service Files

All service files have been updated to use the configuration instead of hardcoded table names:

#### Updated Services:
1. **dfso.service.js** - Uses `tables.DFSO`, `tables.AFSO`, `tables.FPS`
2. **afso.service.js** - Uses `tables.AFSO`, `tables.DFSO`, `tables.FPS`
3. **fps.service.js** - Uses `tables.FPS`, `tables.AFSO`, `tables.DFSO`
4. **aplData.service.js** - Uses `tables.APL_DATA`
5. **aplWip.service.js** - Uses `tables.APL_WIP`

### 3. Benefits

#### Flexibility
- Table names can be changed without modifying code
- Easy to switch between different environments (dev, QA, prod)
- Support for different schema names

#### Maintainability
- Centralized configuration
- Easier to update table names across the entire application
- Reduced code duplication

#### Deployment
- Different environments can use different table naming conventions
- No code changes required for environment-specific configurations

## Usage

### Updating Table Names
To change a table name, simply update the corresponding environment variable in `.env`:

```env
TABLE_DFSO=custom_dfso_table
```

### Adding New Tables
1. Add the environment variable to `.env` and `.env.example`:
   ```env
   TABLE_NEW_TABLE=t_new_table
   ```

2. Update `src/config/tables.js`:
   ```javascript
   tables: {
     DFSO: process.env.TABLE_DFSO || 'm_dfso',
     AFSO: process.env.TABLE_AFSO || 'm_afso',
     FPS: process.env.TABLE_FPS || 'm_fps',
     APL_DATA: process.env.TABLE_APL_DATA || 't_apl_data',
     APL_WIP: process.env.TABLE_APL_WIP || 't_apl_wip_data',
     NEW_TABLE: process.env.TABLE_NEW_TABLE || 't_new_table'
   }
   ```

3. Use in service files:
   ```javascript
   const { tables } = require('../config/tables');
   const query = `SELECT * FROM ${tables.NEW_TABLE}`;
   ```

## Migration Notes

### Before
```javascript
const query = `SELECT * FROM m_dfso WHERE id = $1`;
```

### After
```javascript
const { tables } = require('../config/tables');
const query = `SELECT * FROM ${tables.DFSO} WHERE id = $1`;
```

## Testing

After applying these changes:
1. Verify all services connect properly
2. Test CRUD operations for each entity
3. Ensure queries return expected results
4. Check that schema name is correctly applied if different from 'public'

## Environment-Specific Configuration

### Development
```env
DB_SCHEMA=public
TABLE_DFSO=m_dfso
```

### QA/Testing
```env
DB_SCHEMA=qa_schema
TABLE_DFSO=qa_m_dfso
```

### Production
```env
DB_SCHEMA=prod_schema
TABLE_DFSO=m_dfso
```

## Backward Compatibility

All default values match the original hardcoded table names, ensuring backward compatibility if environment variables are not set.

## Future Enhancements

Potential improvements:
1. Add schema prefix support: `schema.table`
2. Support for view names
3. Dynamic table name resolution for multi-tenant applications
4. Validation of table name configuration on application startup

---

**Last Updated:** April 18, 2026  
**Author:** System Refactoring  
**Status:** Complete
