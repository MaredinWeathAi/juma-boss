# Juma Boss Server API Documentation

## Setup & Installation

```bash
cd server
npm install
npm run dev      # Development with auto-reload
npm run build    # Build for production
npm start        # Run production build
```

## Demo Credentials

- **Email**: `demo@jumaboss.com`
- **Password**: `demo123`

## Database

- **Type**: SQLite with WAL mode
- **File**: `juma-boss.db`
- **Location**: Server root directory
- **Seeding**: Automatic on first startup if database is empty

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are obtained via login and expire after 30 days.

---

## API Endpoints

### Auth Routes (`/api/auth`)

#### `POST /register`
Create a new bakery account.

**Request:**
```json
{
  "email": "sarah@example.com",
  "password": "secure_password",
  "name": "Sarah Johnson",
  "bakeryName": "Sarah's Sweet Creations"
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "sarah@example.com",
  "name": "Sarah Johnson",
  "bakeryName": "Sarah's Sweet Creations",
  "bakerySlug": "sarahs-sweet-creations",
  "tier": "hobby",
  "token": "jwt_token"
}
```

#### `POST /login`
Authenticate and get access token.

**Request:**
```json
{
  "email": "demo@jumaboss.com",
  "password": "demo123"
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "demo@jumaboss.com",
  "name": "Sarah Johnson",
  "bakeryName": "Sarah's Sweet Creations",
  "bakerySlug": "sarahs-sweet-creations",
  "phone": "+1 (555) 123-4567",
  "bio": "Premium artisanal bakery...",
  "tier": "pro",
  "token": "jwt_token"
}
```

#### `GET /me`
Get current user profile. Requires auth.

---

### Products Routes (`/api/products`)

#### `GET /`
List all products for authenticated user.

**Query Parameters:**
- None

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Vanilla Cupcakes (Box of 12)",
    "description": "Delicious vanilla-flavored cupcakes with buttercream frosting",
    "category": "Cupcakes",
    "basePrice": 28.00,
    "costPrice": 8.50,
    "margin": "69.6",
    "prepTimeMinutes": 45,
    "imageUrl": null,
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
]
```

#### `GET /:id`
Get single product with recipe details.

**Response:**
```json
{
  "id": "uuid",
  "name": "Vanilla Cupcakes (Box of 12)",
  "description": "...",
  "category": "Cupcakes",
  "basePrice": 28.00,
  "costPrice": 8.50,
  "prepTimeMinutes": 45,
  "recipeId": "uuid",
  "ingredients": [
    {
      "id": "uuid",
      "name": "All-Purpose Flour",
      "quantity": 2.5,
      "unit": "kg",
      "costPerUnit": 2.50,
      "totalCost": 6.25
    }
  ]
}
```

#### `POST /`
Create new product.

**Request:**
```json
{
  "name": "Chocolate Brownies",
  "description": "Rich, fudgy brownies",
  "category": "Desserts",
  "basePrice": 35.00,
  "costPrice": 10.00,
  "prepTimeMinutes": 60
}
```

#### `PUT /:id`
Update product.

#### `DELETE /:id`
Delete product.

#### `POST /:id/recipe-ingredients`
Add ingredient to product recipe.

**Request:**
```json
{
  "ingredientId": "uuid",
  "quantity": 2.5,
  "unit": "kg"
}
```

#### `DELETE /:id/recipe-ingredients/:ingredientId`
Remove ingredient from recipe.

---

### Customers Routes (`/api/customers`)

#### `GET /`
List all customers.

#### `GET /:id`
Get customer with order history.

#### `POST /`
Create new customer.

**Request:**
```json
{
  "name": "Emma Wilson",
  "email": "emma@example.com",
  "phone": "+1 (555) 234-5678",
  "address": "123 Main St",
  "isCorporate": false
}
```

#### `PUT /:id`
Update customer details.

#### `DELETE /:id`
Delete customer.

---

### Orders Routes (`/api/orders`)

#### `GET /`
List all orders.

**Query Parameters:**
- `status` - Filter by status (pending, confirmed, in_production, ready, delivered, cancelled)

#### `GET /:id`
Get order with items.

#### `POST /`
Create new order.

**Request:**
```json
{
  "customerId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "unitPrice": 28.00
    }
  ],
  "deliveryDate": "2024-03-20",
  "deliveryTime": "14:00",
  "deliveryType": "delivery",
  "paymentStatus": "unpaid"
}
```

#### `PUT /:id`
Update order status and details.

**Request:**
```json
{
  "status": "confirmed",
  "paymentStatus": "paid"
}
```

#### `DELETE /:id`
Delete order.

#### `POST /:id/items`
Add item to order.

#### `DELETE /:id/items/:itemId`
Remove item from order.

---

### Inventory Routes (`/api/inventory`)

#### `GET /`
List all ingredients with stock levels.

#### `GET /alerts/low-stock`
Get low stock alerts.

#### `GET /:id`
Get ingredient details with usage.

#### `POST /`
Create new ingredient.

**Request:**
```json
{
  "name": "All-Purpose Flour",
  "unit": "kg",
  "costPerUnit": 2.50,
  "currentStock": 25,
  "minStockLevel": 5,
  "category": "Dry Goods"
}
```

#### `PUT /:id`
Update ingredient details.

#### `PUT /:id/stock`
Update ingredient stock quantity.

**Request:**
```json
{
  "quantity": 5,
  "operation": "add"  // add, subtract, or set
}
```

#### `DELETE /:id`
Delete ingredient (if not used in recipes).

#### `GET /analysis/totals`
Get inventory cost analysis and breakdown by category.

---

### Dashboard Routes (`/api/dashboard`)

#### `GET /stats`
Get key performance metrics.

**Response:**
```json
{
  "totalRevenue": 5250.00,
  "revenueTodayAmount": 180.00,
  "ordersToday": 3,
  "pendingOrders": 5,
  "totalCustomers": 15,
  "monthlyRevenue": 4920.00
}
```

#### `GET /recent-orders`
Get last 10 orders.

#### `GET /revenue-chart`
Get daily revenue for last 30 days.

**Response:**
```json
[
  {
    "date": "2024-02-16",
    "revenue": 280.00
  }
]
```

#### `GET /top-products`
Get top 10 products by revenue.

#### `GET /orders-by-status`
Get order count and revenue by status.

#### `GET /customer-insights`
Get customer statistics.

---

### Production Routes (`/api/production`)

#### `GET /schedule/:date`
Get production tasks for specific date (YYYY-MM-DD format).

#### `GET /`
List all production tasks.

**Query Parameters:**
- `status` - Filter by status (pending, in_progress, completed)

#### `GET /:id`
Get production task details.

#### `POST /`
Create production task.

**Request:**
```json
{
  "productId": "uuid",
  "orderId": "uuid",
  "scheduledDate": "2024-03-20",
  "assignedTo": "Alice Johnson",
  "notes": "Custom colors requested"
}
```

#### `PUT /:id`
Update production task.

#### `DELETE /:id`
Delete production task.

#### `POST /auto-generate/:orderId`
Auto-generate production tasks from order items.

---

### Pricing Routes (`/api/pricing`)

#### `POST /calculate`
Calculate suggested price based on ingredients, labor, and margin.

**Request:**
```json
{
  "ingredients": [
    {
      "ingredientId": "uuid",
      "quantity": 2.5
    }
  ],
  "laborHours": 2,
  "laborCostPerHour": 20,
  "packagingCost": 1.50,
  "desiredMarginPercent": 40
}
```

**Response:**
```json
{
  "ingredientsCost": 15.50,
  "laborCost": 40.00,
  "packagingCost": 1.50,
  "totalCost": 57.00,
  "suggestedPrice": 95.00,
  "profitMargin": 40.00,
  "breakdown": {
    "ingredientPercentage": 27.19,
    "laborPercentage": 70.18,
    "packagingPercentage": 2.63
  }
}
```

#### `GET /product/:productId`
Get pricing analysis for specific product.

#### `GET /analysis/profitability`
Get profitability metrics for all products.

#### `GET /recommendations`
Get pricing recommendations based on margin analysis.

---

### Employees Routes (`/api/employees`)

#### `GET /`
List all employees.

#### `GET /:id`
Get employee with recent shifts.

#### `POST /`
Create new employee.

**Request:**
```json
{
  "name": "Alice Johnson",
  "email": "alice@bakery.com",
  "phone": "+1 (555) 111-1111",
  "role": "Head Baker",
  "hourlyRate": 22.00
}
```

#### `PUT /:id`
Update employee details.

#### `DELETE /:id`
Delete employee.

#### `GET /:id/shifts`
Get employee shifts.

**Query Parameters:**
- `from` - Start date (YYYY-MM-DD)
- `to` - End date (YYYY-MM-DD)

#### `POST /:id/shifts`
Create shift for employee.

**Request:**
```json
{
  "date": "2024-03-20",
  "startTime": "06:00",
  "endTime": "14:00",
  "notes": "Morning shift"
}
```

#### `DELETE /:id/shifts/:shiftId`
Delete shift.

#### `GET /payroll/summary`
Get payroll summary for period.

**Query Parameters:**
- `from` - Start date
- `to` - End date

---

### Wholesale Routes (`/api/wholesale`)

#### `GET /accounts`
List all wholesale accounts.

#### `GET /accounts/:id`
Get wholesale account with orders.

#### `POST /accounts`
Create wholesale account.

**Request:**
```json
{
  "companyName": "Downtown Coffee Roasters",
  "contactName": "John Smith",
  "email": "john@dtcoffee.com",
  "phone": "+1 (555) 600-1111",
  "discountPercent": 15,
  "paymentTerms": "Net 30"
}
```

#### `PUT /accounts/:id`
Update wholesale account.

#### `DELETE /accounts/:id`
Delete wholesale account.

#### `GET /orders`
List wholesale orders.

**Query Parameters:**
- `status` - Filter by status

#### `GET /orders/:id`
Get wholesale order details.

#### `POST /orders`
Create wholesale order.

#### `PUT /orders/:id`
Update wholesale order.

#### `DELETE /orders/:id`
Delete wholesale order.

#### `GET /stats/summary`
Get wholesale statistics.

---

### Marketplace Routes (`/api/marketplace`)

#### `GET /search` (PUBLIC)
Search marketplace listings.

**Query Parameters:**
- `query` - Search term
- `category` - Filter by category
- `area` - Filter by delivery area
- `minRating` - Minimum rating filter
- `limit` - Results limit (default 20)

**Response:**
```json
[
  {
    "id": "uuid",
    "productName": "Vanilla Cupcakes",
    "category": "Cupcakes",
    "price": 28.00,
    "bakeryName": "Sarah's Sweet Creations",
    "bakerySlug": "sarahs-sweet-creations",
    "rating": 4.8,
    "reviewCount": 25
  }
]
```

#### `GET /`
Get user's marketplace listings.

#### `POST /`
Create marketplace listing.

#### `PUT /:id`
Update marketplace listing.

#### `DELETE /:id`
Delete marketplace listing.

---

### Storefront Routes (`/api/storefront`)

#### `GET /:slug` (PUBLIC)
Get bakery storefront by slug.

**Response:**
```json
{
  "bakery": {
    "id": "uuid",
    "name": "Sarah Johnson",
    "bakeryName": "Sarah's Sweet Creations",
    "bakerySlug": "sarahs-sweet-creations",
    "phone": "+1 (555) 123-4567",
    "bio": "Premium artisanal bakery...",
    "tier": "pro"
  },
  "stats": {
    "totalProducts": 10,
    "totalReviews": 45,
    "averageRating": 4.8,
    "totalCustomers": 120
  },
  "products": [
    {
      "id": "uuid",
      "name": "Vanilla Cupcakes",
      "price": 28.00,
      "category": "Cupcakes",
      "onMarketplace": true,
      "rating": 4.8,
      "reviewCount": 25
    }
  ],
  "productsByCategory": {
    "Cupcakes": [...],
    "Cakes": [...]
  }
}
```

#### `GET /:slug/products/:productId` (PUBLIC)
Get product from storefront.

---

### Financial Routes (`/api/financial`)

#### `GET /summary`
Get financial summary.

**Query Parameters:**
- `period` - all, month, quarter, year (default: all)

**Response:**
```json
{
  "period": "month",
  "revenue": 4920.00,
  "cogs": 1470.00,
  "grossProfit": 3450.00,
  "grossMargin": 70.12,
  "payroll": 2200.00,
  "netProfit": 1250.00,
  "netMargin": 25.40,
  "orderCount": 45,
  "paidCount": 42,
  "outstandingAmount": 150.00,
  "averageOrderValue": 109.33
}
```

#### `GET /product-profitability`
Get profitability breakdown by product.

#### `GET /cash-flow`
Get daily cash flow for last 30 days.

#### `GET /payment-breakdown`
Get orders by payment status.

#### `GET /category-analysis`
Get profitability analysis by product category.

---

## Database Schema

### Users
- `id` (TEXT PRIMARY KEY)
- `email` (TEXT UNIQUE)
- `password` (TEXT)
- `name` (TEXT)
- `bakery_name` (TEXT)
- `bakery_slug` (TEXT UNIQUE)
- `phone` (TEXT)
- `bio` (TEXT)
- `profile_image` (TEXT)
- `tier` (TEXT: hobby/growing/pro/enterprise)
- `created_at` (TEXT)

### Products
- `id` (TEXT PRIMARY KEY)
- `user_id` (TEXT FOREIGN KEY)
- `name` (TEXT)
- `description` (TEXT)
- `category` (TEXT)
- `base_price` (REAL)
- `cost_price` (REAL)
- `image_url` (TEXT)
- `is_active` (INTEGER)
- `prep_time_minutes` (INTEGER)
- `created_at` (TEXT)

### Orders
- `id` (TEXT PRIMARY KEY)
- `user_id` (TEXT FOREIGN KEY)
- `customer_id` (TEXT FOREIGN KEY)
- `status` (TEXT: pending/confirmed/in_production/ready/delivered/cancelled)
- `total_amount` (REAL)
- `notes` (TEXT)
- `delivery_date` (TEXT)
- `delivery_time` (TEXT)
- `delivery_type` (TEXT: pickup/delivery)
- `payment_status` (TEXT: unpaid/paid/refunded)
- `created_at` (TEXT)

### And 15+ more tables...

See `src/db/schema.ts` for complete schema definition.

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (invalid token)
- `404` - Not found
- `500` - Server error

---

## Environment Variables

```
PORT=3001                    # Server port (default 3001)
JWT_SECRET=your-secret-key   # JWT signing secret
NODE_ENV=development         # development or production
```

---

## Database File Location

The SQLite database file `juma-boss.db` is created in the server root directory. It includes:
- WAL mode enabled for better concurrency
- Foreign key constraints enabled
- Indexes on all foreign keys and frequently queried columns
- Automatic seeding with demo data on first run
