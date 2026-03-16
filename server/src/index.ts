import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeSchema } from './db/schema.js';
import { getDatabase } from './db/index.js';

// Routes
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import customersRoutes from './routes/customers.js';
import ordersRoutes from './routes/orders.js';
import inventoryRoutes from './routes/inventory.js';
import dashboardRoutes from './routes/dashboard.js';
import productionRoutes from './routes/production.js';
import pricingRoutes from './routes/pricing.js';
import employeesRoutes from './routes/employees.js';
import wholesaleRoutes from './routes/wholesale.js';
import marketplaceRoutes from './routes/marketplace.js';
import storefrontRoutes from './routes/storefront.js';
import financialRoutes from './routes/financial.js';
import tierRoutes from './routes/tier.js';
import adminRoutes from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
initializeSchema();

// Check if database needs seeding (re-seed if admin account missing)
const db = getDatabase();
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
const adminExists = db.prepare("SELECT COUNT(*) as count FROM users WHERE email = 'admin@jumaboss.com'").get() as any;

if (userCount.count === 0 || adminExists.count === 0) {
  console.log('Seeding database with demo data...');
  try {
    await import('./db/seed.js').catch(() => {
      console.log('Seed file will be created on startup');
    });
  } catch (error) {
    console.log('Seed data not yet available, but schema is initialized');
  }
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/wholesale', wholesaleRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/storefront', storefrontRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/tier', tierRoutes);
app.use('/api/admin', adminRoutes);

// Serve static files in production
const clientDist = path.join(__dirname, '../../client/dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDist));

  // SPA fallback
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Juma Boss server running on http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log('\nDemo credentials:');
  console.log('Email: demo@jumaboss.com');
  console.log('Password: demo123');
});

export default app;
