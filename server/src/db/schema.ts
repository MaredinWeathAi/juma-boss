import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import type BetterSqlite3 from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../juma-boss.db');

export const db: BetterSqlite3.Database = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

export function initializeSchema() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      bakery_name TEXT NOT NULL,
      bakery_slug TEXT UNIQUE NOT NULL,
      phone TEXT,
      bio TEXT,
      profile_image TEXT,
      tier TEXT DEFAULT 'hobby' CHECK(tier IN ('hobby', 'growing', 'pro', 'enterprise')),
      created_at TEXT NOT NULL
    )
  `);

  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      base_price REAL NOT NULL,
      cost_price REAL NOT NULL,
      image_url TEXT,
      is_active INTEGER DEFAULT 1,
      prep_time_minutes INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Ingredients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      unit TEXT NOT NULL,
      cost_per_unit REAL NOT NULL,
      current_stock REAL NOT NULL,
      min_stock_level REAL,
      category TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Recipes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Recipe ingredients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL,
      ingredient_id TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
    )
  `);

  // Customers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      birthday TEXT,
      notes TEXT,
      is_corporate INTEGER DEFAULT 0,
      company_name TEXT,
      total_orders INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'in_production', 'ready', 'delivered', 'cancelled')),
      total_amount REAL NOT NULL,
      notes TEXT,
      delivery_date TEXT,
      delivery_time TEXT,
      delivery_type TEXT DEFAULT 'pickup' CHECK(delivery_type IN ('pickup', 'delivery')),
      payment_status TEXT DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid', 'paid', 'refunded')),
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )
  `);

  // Order items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      notes TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // Employees table
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      role TEXT NOT NULL,
      hourly_rate REAL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Shifts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS shifts (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Production tasks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS production_tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      order_id TEXT,
      product_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
      scheduled_date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      assigned_to TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // Wholesale accounts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS wholesale_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      company_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      discount_percent REAL DEFAULT 0,
      payment_terms TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Wholesale orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS wholesale_orders (
      id TEXT PRIMARY KEY,
      wholesale_account_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      total_amount REAL NOT NULL,
      delivery_date TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (wholesale_account_id) REFERENCES wholesale_accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Marketplace listings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS marketplace_listings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      is_featured INTEGER DEFAULT 0,
      area TEXT,
      delivery_available INTEGER DEFAULT 1,
      min_order INTEGER DEFAULT 1,
      rating REAL DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for common queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
    CREATE INDEX IF NOT EXISTS idx_ingredients_user_id ON ingredients(user_id);
    CREATE INDEX IF NOT EXISTS idx_recipes_product_id ON recipes(product_id);
    CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
    CREATE INDEX IF NOT EXISTS idx_shifts_employee_id ON shifts(employee_id);
    CREATE INDEX IF NOT EXISTS idx_production_tasks_user_id ON production_tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_production_tasks_scheduled_date ON production_tasks(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_wholesale_accounts_user_id ON wholesale_accounts(user_id);
    CREATE INDEX IF NOT EXISTS idx_marketplace_listings_user_id ON marketplace_listings(user_id);
  `);
}

export default db;
