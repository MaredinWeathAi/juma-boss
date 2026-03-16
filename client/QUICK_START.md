# Juma Boss Frontend - Quick Start Guide

## Installation & Setup

### 1. Install Dependencies
```bash
cd /sessions/affectionate-peaceful-mendel/juma-boss/client
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
- Opens at `http://localhost:5173`
- API requests to `/api/*` are proxied to `http://localhost:3001`
- Hot reload enabled for instant feedback

### 3. Build for Production
```bash
npm run build
```
- Creates optimized build in `dist/` folder
- Runs TypeScript type checking first

### 4. Preview Production Build
```bash
npm run preview
```
- Test production build locally before deployment

## Project Layout

```
src/
├── App.tsx              # Main router with protected/public routes
├── main.tsx             # Entry point with Sonner toast provider
├── index.css            # Tailwind imports + CSS variables
├── components/
│   ├── layout/          # AppLayout (sidebar) + Header
│   └── shared/          # Reusable components (8 total)
├── pages/               # 17 full-page components
├── lib/
│   ├── api.ts           # API wrapper with JWT auth
│   └── utils.ts         # Utilities: cn(), formatCurrency(), etc
├── stores/
│   └── authStore.ts     # Zustand auth store
└── types/
    └── index.ts         # All TypeScript interfaces
```

## Key Files to Know

### Core App Files
- **src/App.tsx** - All routes defined here, ProtectedRoute wrapper
- **src/main.tsx** - Entry point, Sonner toast setup
- **src/lib/api.ts** - All API calls go through here
- **src/stores/authStore.ts** - Auth state management

### Important Routes
- Public: `/login`, `/register`, `/store/:slug`
- Dashboard: `/` (main app)
- Orders: `/orders`, `/orders/new`, `/orders/:id`
- Products: `/products`, `/products/new`, `/products/:id`
- All other pages under `/[feature]`

## API Configuration

### Backend Connection
- Dev server proxies `/api/*` → `http://localhost:3001`
- Change in `vite.config.ts` if needed
- JWT token auto-injected from localStorage

### Making API Calls
```typescript
import { api, handleApiError } from '@/lib/api'

// GET
const data = await api.get('/orders')

// POST
const result = await api.post('/orders', { customerId, items, ... })

// Error handling
try {
  await api.get('/orders')
} catch (error) {
  handleApiError(error) // Shows toast & redirects on 401
}
```

## Component Structure

### Shared Components
Located in `src/components/shared/`:

1. **DataTable** - Sortable, searchable table
2. **Modal** - Dialog component with actions
3. **LoadingSpinner** - Loading animation
4. **EmptyState** - When no data exists
5. **StatusBadge** - Color-coded status labels
6. **StatCard** - Dashboard stat cards
7. **SearchInput** - Search with clear button
8. **ConfirmDialog** - Confirm action dialog

### Layout Components
1. **AppLayout** - Main layout with sidebar (protected routes)
2. **Header** - Page title + action buttons

## Styling Guide

### Tailwind Classes
- Use Tailwind utility classes exclusively
- Dark mode is default (no `dark:` prefix needed)
- Custom colors use CSS variables from `index.css`

### Color Variables
```css
--background: primary background
--foreground: text color
--card: card background
--primary: orange (#F97316)
--accent: amber (#F59E0B)
--success: green (#10B981)
--danger: red for destructive actions
--muted: gray for secondary text
```

### Button Classes
```html
<!-- Primary action -->
<button class="btn-primary">Save</button>

<!-- Secondary action -->
<button class="btn-secondary">Cancel</button>

<!-- Ghost (no background) -->
<button class="btn-ghost">Link-like button</button>

<!-- Small size -->
<button class="btn-small">Small button</button>
```

### Common Patterns
```html
<!-- Card -->
<div class="card p-6">Content</div>

<!-- Input -->
<input type="text" class="input" placeholder="..." />

<!-- Label -->
<label class="label">Label Text</label>

<!-- Badge -->
<span class="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs">Badge</span>
```

## Common Tasks

### Add a New Page
1. Create file in `src/pages/NewPage.tsx`
2. Add route in `src/App.tsx`
3. Import in App.tsx
4. Use `Header` component for title
5. Wrap in `ProtectedRoute` if auth required

### Add a New API Endpoint
```typescript
// In your component
const response = await api.get('/new-endpoint')

// API utility handles:
// - JWT token injection
// - Error handling
// - 401 redirect to login
```

### Create a Form
```typescript
const [formData, setFormData] = useState({ name: '', email: '' })

const handleChange = (e) => {
  setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
}

const handleSubmit = async (e) => {
  e.preventDefault()
  try {
    await api.post('/endpoint', formData)
    toast.success('Success!')
  } catch (error) {
    handleApiError(error)
  }
}
```

### Show Toast Notifications
```typescript
import { toast } from 'sonner'

toast.success('Operation successful')
toast.error('Something went wrong')
toast.loading('Loading...')
```

### Make Data Table Sortable
```typescript
const columns: Column<Order>[] = [
  { key: 'orderNumber', label: 'Order #', sortable: true },
  { key: 'total', label: 'Total', sortable: true },
  // ...
]

<DataTable columns={columns} data={orders} keyField="id" />
```

## Debugging

### Check Console
```bash
# Dev tools in browser (F12)
# Check Network tab for API calls
# Console for any JS errors
```

### Common Issues

**"Cannot GET /api/..."**
- Ensure backend is running on port 3001
- Check vite.config.ts proxy setting

**"401 Unauthorized"**
- Token expired, user logged out
- Redirects to /login automatically
- Check localStorage for token

**Dark mode not working**
- Tailwind dark mode is always on
- Check that index.css CSS variables are loaded
- Check browser console for CSS errors

**Charts not showing**
- Ensure ResponsiveContainer has parent with height
- Check data format matches Recharts expectations

## Performance Tips

1. Use React.memo for expensive components
2. Lazy load pages with React.lazy (future improvement)
3. Virtualize long lists if needed
4. Debounce search inputs
5. Cache API responses with Zustand if needed

## Deployment

### Build
```bash
npm run build
```

### Deploy to Static Host
- Copy `dist/` folder contents
- Configure API base URL if backend is on different domain
- Update vite.config.ts proxy if needed

### Environment Variables
- Create `.env` file if needed
- Prefix with `VITE_` to expose to frontend
- Update API base URL in lib/api.ts

## Testing Locally

### Test Login
1. Start dev server: `npm run dev`
2. Go to `http://localhost:3001` (backend)
3. Create test user via API
4. Use credentials in login page

### Test API
1. Use browser DevTools Network tab
2. Or use curl/Postman
3. Check backend response format matches types

## Need Help?

### File Organization
- Pages = `src/pages/`
- Shared UI = `src/components/shared/`
- Layouts = `src/components/layout/`
- Business logic = `src/lib/` or `src/stores/`

### Common Paths
- Main app = `src/App.tsx`
- Types = `src/types/index.ts`
- Utilities = `src/lib/utils.ts`
- API = `src/lib/api.ts`
- Auth store = `src/stores/authStore.ts`

### Next Steps
1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Open `http://localhost:5173`
4. Navigate to `/login` or `/register`
5. Start building with the backend!

Happy coding! 🎂
