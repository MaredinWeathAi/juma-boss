# Juma Boss Frontend - Project Structure

## Overview
Complete React + Vite + TypeScript SaaS frontend for Juma Boss bakery management platform. Dark mode first, warm bakery aesthetics with professional dashboard UI.

## Directory Structure

```
client/
├── public/                     # Static assets
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx   # Main app layout with sidebar
│   │   │   └── Header.tsx      # Page header component
│   │   └── shared/
│   │       ├── LoadingSpinner.tsx      # Loading animation
│   │       ├── EmptyState.tsx          # Empty state placeholder
│   │       ├── StatusBadge.tsx         # Status badge component
│   │       ├── StatCard.tsx            # Dashboard stat card
│   │       ├── Modal.tsx               # Modal dialog
│   │       ├── DataTable.tsx           # Generic sortable table
│   │       ├── SearchInput.tsx         # Search input with icon
│   │       └── ConfirmDialog.tsx       # Confirmation dialog
│   ├── pages/
│   │   ├── Login.tsx                   # Login page
│   │   ├── Register.tsx                # Registration page
│   │   ├── Dashboard.tsx               # Main dashboard
│   │   ├── Orders.tsx                  # Orders list
│   │   ├── OrderDetail.tsx             # Order detail view
│   │   ├── OrderForm.tsx               # Create/edit order
│   │   ├── Products.tsx                # Products grid
│   │   ├── ProductForm.tsx             # Create/edit product
│   │   ├── Customers.tsx               # Customers list
│   │   ├── CustomerDetail.tsx          # Customer profile
│   │   ├── Inventory.tsx               # Inventory management
│   │   ├── Production.tsx              # Production schedule
│   │   ├── Pricing.tsx                 # Pricing calculator
│   │   ├── Employees.tsx               # Employees list
│   │   ├── Wholesale.tsx               # Wholesale accounts
│   │   ├── Marketplace.tsx             # Marketplace listings
│   │   ├── Financial.tsx               # Financial dashboard
│   │   ├── Settings.tsx                # User settings
│   │   └── Storefront.tsx              # Public storefront (no auth)
│   ├── lib/
│   │   ├── api.ts                      # API utility with fetch wrapper
│   │   └── utils.ts                    # Utility functions (cn, formatCurrency, etc)
│   ├── stores/
│   │   └── authStore.ts                # Zustand auth state management
│   ├── types/
│   │   └── index.ts                    # TypeScript interfaces for all entities
│   ├── App.tsx                         # Main app with routes
│   ├── main.tsx                        # Entry point with Sonner toast
│   └── index.css                       # Tailwind imports + CSS variables
├── index.html                          # Vite HTML entry point
├── package.json                        # Dependencies
├── vite.config.ts                      # Vite configuration
├── tsconfig.json                       # TypeScript configuration
├── tailwind.config.js                  # Tailwind theme config
├── postcss.config.js                   # PostCSS configuration
├── .gitignore                          # Git ignore rules
└── PROJECT_STRUCTURE.md               # This file
```

## Key Features

### Authentication
- Login & Register pages with form validation
- Zustand-based auth store
- JWT token stored in localStorage
- Automatic redirect to login if unauthenticated
- Protected routes with AppLayout wrapper

### Dashboard
- 4 stat cards (revenue, orders today, pending, customers)
- Revenue trend chart (30 days, line chart)
- Cost breakdown pie chart
- Recent orders table
- Top selling products bar chart
- Low stock alerts panel

### Orders Management
- Order list with search & status filtering
- Create new order with customer/products/delivery info
- Order detail view with status updates
- Payment status tracking
- Item-level quantity management
- Auto-calculated totals with tax

### Products
- Grid view with product cards
- Category filtering & search
- Add/edit products with pricing & prep time
- Ingredient recipe builder
- Toggle active/inactive status
- Product deletion

### Customers
- Customer list with search
- Customer detail view with order history
- Spending trend chart
- Contact information management
- Wholesale account indicators

### Inventory
- Stock level tracking with color coding (critical/low/good)
- Ingredient cost per unit
- Minimum level alerts
- Inline stock editing
- Category filtering
- Total inventory value calculation

### Production
- Daily production schedule
- Tasks grouped by order
- Status updates (pending → in progress → completed)
- Employee assignment
- Time tracking
- Generate tasks from orders button

### Pricing Calculator
- Interactive ingredient-based costing
- Labor hours + hourly rate
- Packaging costs
- Overhead percentage
- Profit margin slider (5-80%)
- Cost breakdown pie chart
- Suggested retail price display
- Profit per unit calculation

### Financial Dashboard
- Revenue stats (this month, last month, YTD)
- Revenue vs Cost trend line chart
- Product profitability table
- Top & worst performing products
- Expense categories breakdown
- Profit margin calculation

### Employees
- Employee list with roles & hourly rates
- Status toggle (active/inactive)
- Role filtering
- Contact information

### Wholesale
- Wholesale account management
- Discount percentage tracking
- Payment terms management
- Status filtering (active/inactive)

### Marketplace
- Public baker listings
- Rating & review display
- Service area information
- Delivery availability indicator
- Category browsing

### Settings
- Profile information editing
- Bakery name & bio
- Storefront URL slug customization
- Storefront description
- Notification preferences
- Account tier display

### Public Storefront
- Beautiful public-facing bakery page
- Product grid with pricing
- Baker bio & rating
- Delivery/service area information
- No authentication required

## Design System

### Colors
- **Primary (Orange)**: `#F97316` - CTA buttons, highlights
- **Accent (Amber)**: `#F59E0B` - Secondary highlights
- **Background**: `hsl(20 14% 4%)` - Dark card backgrounds
- **Card**: `hsl(20 14% 6%)` - Slightly lighter cards
- **Success (Green)**: `#10B981` - Positive actions
- **Warning/Danger**: Red/Yellow - Status indicators
- **Muted**: Gray text for secondary content

### Typography
- System font stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', etc.
- Font smoothing enabled for clean rendering

### Components
- Rounded corners on all components (0.75rem lg, 0.5rem md, 0.375rem sm)
- Smooth transitions and animations
- Consistent spacing and padding
- Dark mode first approach

## Dependencies

### Core
- **React 18**: UI library
- **React Router DOM 7**: Client-side routing
- **TypeScript**: Type safety
- **Vite 6**: Build tool & dev server

### State Management
- **Zustand 5**: Lightweight state management for auth

### UI Components & Charts
- **Recharts 2**: Charts (line, bar, pie charts)
- **Lucide React 0.460**: Icon library (100+ icons)
- **Sonner 1.7**: Toast notifications

### Styling
- **Tailwind CSS 3.4**: Utility-first CSS
- **PostCSS**: CSS processing
- **Autoprefixer**: Browser compatibility

### Utilities
- **date-fns 4.1**: Date formatting
- **clsx & tailwind-merge**: Class name utilities

## API Integration

### Base URL
- Development: `http://localhost:3001/api` (proxied via Vite)
- Routes available at `/api/*`

### API Utilities (`src/lib/api.ts`)
- `api.get(endpoint)` - GET request
- `api.post(endpoint, data)` - POST request
- `api.put(endpoint, data)` - PUT request
- `api.patch(endpoint, data)` - PATCH request
- `api.delete(endpoint)` - DELETE request
- Automatic JWT token injection from localStorage
- Error handling with `handleApiError()` utility
- 401 redirects to /login

### Key Endpoints Used
- `/auth/login` - User login
- `/auth/register` - User registration
- `/auth/me` - Get current user
- `/orders` - List/create orders
- `/orders/{id}` - Order details/updates
- `/products` - List/create products
- `/products/{id}` - Product details/updates
- `/customers` - List customers
- `/customers/{id}` - Customer details
- `/ingredients` - Inventory management
- `/production` - Production tasks
- `/employees` - Employee management
- `/wholesale` - Wholesale accounts
- `/marketplace` - Marketplace listings
- `/financial/*` - Financial data
- `/settings` - User settings

## Running the Project

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
- Starts Vite dev server on `http://localhost:5173`
- Proxies `/api/*` to `http://localhost:3001`
- Hot module replacement enabled

### Build
```bash
npm run build
```
- Runs TypeScript type checking
- Builds optimized production bundle to `dist/`

### Preview
```bash
npm run preview
```
- Previews production build locally

## Code Quality Standards

### TypeScript
- Strict mode enabled
- Interface-based type safety for all entities
- No implicit `any` types

### Component Structure
- Functional components with hooks
- Custom hooks in `src/hooks/` (for future expansion)
- Proper prop typing with interfaces
- Clear component responsibilities

### Styling
- Tailwind CSS classes exclusively
- Custom CSS variables for theming
- Dark mode first approach
- Responsive design (mobile-first)

### State Management
- Zustand for auth store
- Local component state with useState
- No prop drilling with context/Zustand

## Browser Support
- Modern browsers (ES2020+)
- Chrome, Firefox, Safari, Edge

## Future Enhancements
- Add more analytics pages
- Implement real-time notifications with WebSocket
- Add image upload for products
- Implement email notifications
- Add invoice generation
- Multi-user team management
- Advanced reporting features
- Mobile app with React Native
