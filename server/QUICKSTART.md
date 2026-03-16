# Juma Boss Server - Quick Start Guide

## Setup (2 minutes)

```bash
cd server
npm install
npm run dev
```

The server will start on `http://localhost:3001`

## First Steps

### 1. Health Check
```bash
curl http://localhost:3001/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-03-16T10:00:00.000Z"
}
```

### 2. Login with Demo Account
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@jumaboss.com",
    "password": "demo123"
  }'
```

Response includes JWT token (valid for 30 days):
```json
{
  "id": "user-id",
  "email": "demo@jumaboss.com",
  "name": "Sarah Johnson",
  "bakeryName": "Sarah's Sweet Creations",
  "bakerySlug": "sarahs-sweet-creations",
  "tier": "pro",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 3. Use Token in Requests

Save token as environment variable:
```bash
TOKEN="your-token-here"
```

Get your profile:
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Explore Data

Get all products:
```bash
curl -X GET http://localhost:3001/api/products \
  -H "Authorization: Bearer $TOKEN"
```

Get dashboard stats:
```bash
curl -X GET http://localhost:3001/api/dashboard/stats \
  -H "Authorization: Bearer $TOKEN"
```

Get orders:
```bash
curl -X GET http://localhost:3001/api/orders \
  -H "Authorization: Bearer $TOKEN"
```

## Demo Data Included

The database auto-seeds with realistic bakery data:

- **Bakery**: Sarah's Sweet Creations (Pro tier)
- **Products**: 10 items (cupcakes, cakes, bread, pastries, cookies)
- **Customers**: 15 customers (mix of individual and corporate)
- **Orders**: 25 orders across different statuses
- **Ingredients**: 18 inventory items with stock levels
- **Employees**: 5 staff members with shift schedules
- **Wholesale**: 4 wholesale accounts
- **Marketplace**: All products listed

## Common Operations

### Create a Customer
```bash
curl -X POST http://localhost:3001/api/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1 (555) 123-4567",
    "isCorporate": false
  }'
```

### Create an Order
```bash
# First, get a product ID and customer ID from GET requests above

curl -X POST http://localhost:3001/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-uuid",
    "items": [
      {
        "productId": "product-uuid",
        "quantity": 2,
        "unitPrice": 28.00
      }
    ],
    "deliveryDate": "2024-03-25",
    "deliveryType": "delivery",
    "paymentStatus": "unpaid"
  }'
```

### Update Inventory Stock
```bash
curl -X PUT http://localhost:3001/api/inventory/ingredient-uuid/stock \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 5,
    "operation": "add"
  }'
```

### Calculate Pricing
```bash
curl -X POST http://localhost:3001/api/pricing/calculate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ingredients": [
      {
        "ingredientId": "flour-uuid",
        "quantity": 2.5
      },
      {
        "ingredientId": "sugar-uuid",
        "quantity": 1.5
      }
    ],
    "laborHours": 2,
    "laborCostPerHour": 20,
    "packagingCost": 1.50,
    "desiredMarginPercent": 40
  }'
```

Response shows cost breakdown and suggested price:
```json
{
  "ingredientsCost": 12.50,
  "laborCost": 40.00,
  "packagingCost": 1.50,
  "totalCost": 54.00,
  "suggestedPrice": 90.00,
  "profitMargin": 40.00,
  "breakdown": {
    "ingredientPercentage": 23.15,
    "laborPercentage": 74.07,
    "packagingPercentage": 2.78
  }
}
```

## Key Endpoints by Use Case

### Sales & Orders
- `GET /api/orders` - View all orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order status
- `GET /api/customers` - View customers
- `POST /api/customers` - Add customer

### Analytics & Reporting
- `GET /api/dashboard/stats` - KPI summary
- `GET /api/dashboard/revenue-chart` - 30-day revenue
- `GET /api/dashboard/top-products` - Best sellers
- `GET /api/financial/summary` - Financial overview
- `GET /api/financial/product-profitability` - Per-product profit

### Operations
- `GET /api/production/schedule/:date` - Daily production
- `GET /api/inventory` - Stock levels
- `GET /api/inventory/alerts/low-stock` - Stock alerts
- `GET /api/employees` - Staff list
- `GET /api/employees/:id/shifts` - Schedule

### Product Management
- `GET /api/products` - All products
- `POST /api/products` - New product
- `POST /api/pricing/calculate` - Price calculator
- `GET /api/pricing/recommendations` - Price optimization

### Wholesale
- `GET /api/wholesale/accounts` - Accounts
- `POST /api/wholesale/accounts` - New account
- `GET /api/wholesale/orders` - Wholesale orders
- `GET /api/wholesale/stats/summary` - Wholesale metrics

## File Locations

- Database: `/server/juma-boss.db`
- Source code: `/server/src/`
- Configuration: `/server/tsconfig.json`, `/server/package.json`
- Documentation: `/server/API.md`, `/server/IMPLEMENTATION_SUMMARY.md`

## Development Commands

```bash
npm run dev       # Start dev server with auto-reload
npm run build     # Compile TypeScript to dist/
npm start         # Run compiled server
npm run seed      # Re-seed database with demo data
```

## Database

The SQLite database is automatically created and seeded on first run. To reset:

```bash
# Remove database files
rm juma-boss.db juma-boss.db-wal juma-boss.db-shm

# Restart server - will create fresh database
npm run dev
```

## Environment Variables

Create a `.env` file in the server directory:

```
PORT=3001
JWT_SECRET=your-super-secret-key-change-this
NODE_ENV=development
```

## Testing with Postman/Insomnia

1. **Import collection** - Use API.md as reference
2. **Set bearer token** - Use token from login response
3. **Example requests** provided in API.md

## Troubleshooting

### Port 3001 already in use
```bash
# Use different port
PORT=3002 npm run dev
```

### Database locked
```bash
# Remove WAL files
rm juma-boss.db-wal juma-boss.db-shm
```

### TypeScript compilation errors
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Next Steps

1. Review `API.md` for complete endpoint reference
2. Check `IMPLEMENTATION_SUMMARY.md` for architecture details
3. Modify `src/db/seed.ts` to customize demo data
4. Connect your frontend application
5. Implement additional features as needed

## Support

- All routes return consistent JSON responses
- Error messages explain what went wrong
- Timestamps are ISO 8601 format
- IDs are UUIDs (unique identifiers)
- Prices use 2 decimal places

## Architecture Highlights

- **15 database tables** with proper relationships
- **65+ REST endpoints** covering all business operations
- **Real-time analytics** with aggregated queries
- **Intelligent pricing engine** for cost-based pricing
- **Complete financial tracking** with profit calculations
- **Public marketplace** features for customer discovery
- **Production workflow** with scheduling

Happy baking! 🎂

For questions, see API.md or IMPLEMENTATION_SUMMARY.md
