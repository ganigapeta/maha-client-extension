# APL Scheme Backend API

A high-performance RESTful API built with Fastify and PostgreSQL for the APL (Antyodaya Parivar Yojana) Scheme Management System.

## 🚀 Features

- **Fast & Efficient**: Built with Fastify for high performance
- **Well-Documented**: Integrated Swagger/OpenAPI documentation
- **Modular Architecture**: Clean separation of concerns
- **Pagination**: Built-in pagination support for all list endpoints
- **Search**: Full-text search across multiple columns
- **Filtering**: Advanced filtering capabilities
- **Error Handling**: Comprehensive error handling and validation
- **CORS Enabled**: Ready for frontend integration
- **Database Connection Pooling**: Optimized PostgreSQL connections

## 📋 Prerequisites

- Node.js >= 16.0.0
- PostgreSQL 12+ (with apl_scheme database)
- npm or yarn package manager

## 🛠️ Installation

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` file with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=apl_scheme
   DB_USER=apl_user
   DB_PASSWORD=apl_password
   
   PORT=3000
   NODE_ENV=development
   API_PREFIX=/api/v1
   ```

4. **Ensure database is set up**
   ```bash
   # From project root directory
   ./setup_database.sh
   ```

## 🏃 Running the Application

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start at `http://localhost:3000`

## 📚 API Documentation

Once the server is running, access the interactive Swagger documentation at:

**http://localhost:3000/docs**

## 🔗 API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Health Check
```
GET /health
```

### DFSO (District Food & Supplies Officer)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dfso` | Get all DFSO records with pagination |
| GET | `/api/v1/dfso/:id` | Get DFSO by ID |
| GET | `/api/v1/dfso/code/:code` | Get DFSO by code |
| GET | `/api/v1/dfso/active/all` | Get all active DFSO records |
| GET | `/api/v1/dfso/:id/hierarchy` | Get DFSO with hierarchy info |

### AFSO (Assistant Food & Supplies Officer)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/afso` | Get all AFSO records with pagination |
| GET | `/api/v1/afso/:id` | Get AFSO by ID |
| GET | `/api/v1/afso/dfso/:dfsoCode` | Get AFSO by DFSO code |
| GET | `/api/v1/afso/:id/hierarchy` | Get AFSO with hierarchy info |

### FPS (Fair Price Shop)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/fps` | Get all FPS records with pagination |
| GET | `/api/v1/fps/:id` | Get FPS by ID |
| GET | `/api/v1/fps/afso/:afsoCode` | Get FPS by AFSO code |

### APL WIP (Work-In-Progress)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/apl-wip` | Get all WIP records with pagination |
| GET | `/api/v1/apl-wip/:id` | Get WIP record by ID |
| POST | `/api/v1/apl-wip` | Create new WIP record |
| PUT | `/api/v1/apl-wip/:id` | Update WIP record |
| PATCH | `/api/v1/apl-wip/:id/approve` | Approve WIP record |
| PATCH | `/api/v1/apl-wip/:id/reject` | Reject WIP record |
| DELETE | `/api/v1/apl-wip/:id` | Delete WIP record |
| GET | `/api/v1/apl-wip/stats/summary` | Get WIP statistics |

## 🔍 Query Parameters

All GET list endpoints support the following query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 10 | Items per page (max: 100) |
| search | string | - | Search term (searches across multiple columns) |
| isActive | boolean | - | Filter by active status |
| sortBy | string | varies | Column to sort by |
| sortOrder | string | ASC | Sort direction (ASC/DESC) |

### Endpoint-Specific Filters

**AFSO:**
- `dfsoCode` - Filter by DFSO code

**FPS:**
- `afsoCode` - Filter by AFSO code
- `dfsoCode` - Filter by DFSO code

**APL WIP:**
- `status` - Filter by status (PENDING, APPROVED, REJECTED, CANCELLED)
- `dfsoCode` - Filter by DFSO code
- `afsoCode` - Filter by AFSO code
- `fpsCode` - Filter by FPS code

## 📝 Example API Calls

### Get DFSO records with pagination
```bash
curl "http://localhost:3000/api/v1/dfso?page=1&limit=10"
```

### Search DFSO records
```bash
curl "http://localhost:3000/api/v1/dfso?search=district&isActive=true"
```

### Get AFSO by DFSO code
```bash
curl "http://localhost:3000/api/v1/afso/dfso/1502"
```

### Create WIP record
```bash
curl -X POST http://localhost:3000/api/v1/apl-wip \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{
    "dist_code": 501,
    "dist_name": "District Name",
    "dfso_code": 1502,
    "dfso_name": "DFSO Name",
    "afso_code": 1502308,
    "afso_name": "AFSO Name",
    "fps_code": 150230812345,
    "fps_name": "FPS Name",
    "rc_no": 123456,
    "hof_name": "Head of Family",
    "member_id": 789,
    "member_name": "Member Name",
    "total_disbursement_amount": 5000,
    "is_disbursement_account": true
  }'
```

### Approve WIP record
```bash
curl -X PATCH http://localhost:3000/api/v1/apl-wip/1/approve \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{
    "remarks": "Approved by admin"
  }'
```

### Get WIP statistics
```bash
curl "http://localhost:3000/api/v1/apl-wip/stats/summary"
```

## 📦 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Database connection configuration
│   ├── services/
│   │   ├── dfso.service.js      # DFSO business logic
│   │   ├── afso.service.js      # AFSO business logic
│   │   ├── fps.service.js       # FPS business logic
│   │   └── aplWip.service.js    # WIP business logic
│   ├── routes/
│   │   ├── dfso.routes.js       # DFSO endpoints
│   │   ├── afso.routes.js       # AFSO endpoints
│   │   ├── fps.routes.js        # FPS endpoints
│   │   └── aplWip.routes.js     # WIP endpoints
│   ├── utils/
│   │   ├── pagination.js        # Pagination utilities
│   │   └── response.js          # Response formatting
│   └── app.js                   # Fastify app configuration
├── server.js                    # Application entry point
├── package.json                 # Dependencies and scripts
├── .env                         # Environment variables
├── .env.example                 # Environment template
└── README.md                    # This file
```

## 🏗️ Architecture

### Layered Architecture

```
Routes (HTTP Layer)
    ↓
Services (Business Logic)
    ↓
Database (Data Access)
```

### Key Design Patterns

1. **Service Layer Pattern**: Business logic separated from routes
2. **Dependency Injection**: Services injected into routes
3. **Repository Pattern**: Database queries encapsulated in services
4. **Factory Pattern**: Response formatters for consistent API responses

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DB_HOST | PostgreSQL host | localhost |
| DB_PORT | PostgreSQL port | 5432 |
| DB_NAME | Database name | apl_scheme |
| DB_USER | Database user | apl_user |
| DB_PASSWORD | Database password | apl_password |
| PORT | Server port | 3000 |
| NODE_ENV | Environment | development |
| API_PREFIX | API route prefix | /api/v1 |

### Database Connection Pool

Default configuration:
- Max connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

## 🚦 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": { },
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "statusCode": 500,
  "errors": "Detailed error information"
}
```

## 🛡️ Error Handling

The API implements comprehensive error handling:

- **400 Bad Request**: Invalid input/validation errors
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server/database errors

All errors follow the standard error response format.

## 🧪 Testing

```bash
# Test database connection
curl http://localhost:3000/health

# Test API endpoint
curl http://localhost:3000/api/v1/dfso

# View Swagger documentation
open http://localhost:3000/docs
```

## 📊 Performance Considerations

- **Connection Pooling**: Reuses database connections
- **Indexing**: All

 frequently queried columns are indexed
- **Pagination**: Limits data transferred per request
- **Query Optimization**: Uses efficient SQL queries with proper joins

## 🔐 Security Best Practices

### Current Implementation
- CORS enabled (configure for production)
- Input validation via Fastify schemas
- SQL injection protection (parameterized queries)
- Error message sanitization

### Production Recommendations
1. **Authentication**: Implement JWT or session-based auth
2. **Rate Limiting**: Add request rate limiting
3. **HTTPS**: Use SSL/TLS in production
4. **Environment Variables**: Use secure secret management
5. **SQL Injection**: Already protected via parameterized queries
6. **Input Validation**: Enhance validation rules
7. **Logging**: Implement structured logging (Winston/Pino)

## 📈 Monitoring

### Health Check Endpoint
```bash
GET /health
```

Returns:
- Server status
- Database connection status
- Server uptime
- Timestamp

## 🐛 Troubleshooting

### Server won't start
- Check if port 3000 is available
- Verify database is running
- Check environment variables in `.env`
- Ensure database exists and is accessible

### Database connection errors
```bash
# Test PostgreSQL connection
psql -U apl_user -d apl_scheme -h localhost
```

### Can't access Swagger docs
- Ensure server is running
- Check `http://localhost:3000/docs`
- Clear browser cache

## 📝 Development Guidelines

### Adding New Endpoints

1. **Create Service**: Add business logic in `src/services/`
2. **Create Routes**: Define endpoints in `src/routes/`
3. **Update App**: Register routes in `src/app.js`
4. **Add Swagger Schema**: Document in route definitions

### Code Style
- Use async/await for asynchronous operations
- Follow modular structure
- Add JSDoc comments for functions
- Use meaningful variable names
- Implement error handling in try-catch blocks

## 🔄 Future Enhancements

- [ ] Authentication and Authorization (JWT)
- [ ] Role-based access control
- [ ] File upload support
- [ ] Caching layer (Redis)
- [ ] Rate limiting
- [ ] Request logging
- [ ] Unit and integration tests
- [ ] CI/CD pipeline
- [ ] WebSocket support for real-time updates
- [ ] API versioning

## 📄 License

ISC

## 👥 Support

For issues or questions:
1. Check the Swagger documentation at `/docs`
2. Review this README
3. Check database connection and configuration
4. Consult application logs

---

**Version:** 1.0.0  
**Last Updated:** 2026-04-14  
**Framework:** Fastify v5.8.4  
**Database:** PostgreSQL 12+
