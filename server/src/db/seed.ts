import { db, initializeSchema } from './schema.js';
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const hashPassword = (password: string) => bcryptjs.hashSync(password, 10);

function seed() {
  // Initialize schema
  initializeSchema();

  // Clear existing data
  db.exec(`
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM customers;
    DELETE FROM shifts;
    DELETE FROM employees;
    DELETE FROM production_tasks;
    DELETE FROM recipe_ingredients;
    DELETE FROM recipes;
    DELETE FROM products;
    DELETE FROM ingredients;
    DELETE FROM wholesale_orders;
    DELETE FROM wholesale_accounts;
    DELETE FROM marketplace_listings;
    DELETE FROM users;
  `);

  // Create demo user (Sarah's Sweet Creations)
  const userId = uuidv4();
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password, name, bakery_name, bakery_slug, phone, bio, tier, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    userId,
    'demo@jumaboss.com',
    hashPassword('demo123'),
    'Sarah Johnson',
    "Sarah's Sweet Creations",
    'sarahs-sweet-creations',
    '+1 (555) 123-4567',
    'Premium artisanal bakery specializing in custom cakes, cupcakes, and sourdough. Established 2018.',
    'pro',
    new Date('2023-01-15').toISOString()
  );

  // Create ingredients
  const ingredients = [
    { name: 'All-Purpose Flour', unit: 'kg', costPerUnit: 2.50, category: 'Dry Goods' },
    { name: 'Sugar', unit: 'kg', costPerUnit: 1.80, category: 'Dry Goods' },
    { name: 'Butter', unit: 'kg', costPerUnit: 8.50, category: 'Dairy' },
    { name: 'Eggs', unit: 'dozen', costPerUnit: 4.20, category: 'Dairy' },
    { name: 'Vanilla Extract', unit: 'ml', costPerUnit: 0.08, category: 'Flavorings' },
    { name: 'Cocoa Powder', unit: 'kg', costPerUnit: 12.00, category: 'Dry Goods' },
    { name: 'Baking Powder', unit: 'kg', costPerUnit: 5.50, category: 'Dry Goods' },
    { name: 'Baking Soda', unit: 'kg', costPerUnit: 2.80, category: 'Dry Goods' },
    { name: 'Salt', unit: 'kg', costPerUnit: 1.20, category: 'Dry Goods' },
    { name: 'Honey', unit: 'kg', costPerUnit: 9.00, category: 'Sweeteners' },
    { name: 'Cream Cheese', unit: 'kg', costPerUnit: 7.50, category: 'Dairy' },
    { name: 'Heavy Cream', unit: 'liter', costPerUnit: 3.80, category: 'Dairy' },
    { name: 'Strawberries (Fresh)', unit: 'kg', costPerUnit: 5.00, category: 'Produce' },
    { name: 'Blueberries (Fresh)', unit: 'kg', costPerUnit: 8.00, category: 'Produce' },
    { name: 'Almonds (Ground)', unit: 'kg', costPerUnit: 15.00, category: 'Nuts' },
    { name: 'Walnuts (Ground)', unit: 'kg', costPerUnit: 12.50, category: 'Nuts' },
    { name: 'Yeast', unit: 'g', costPerUnit: 0.30, category: 'Leavening' },
    { name: 'Olive Oil', unit: 'liter', costPerUnit: 8.00, category: 'Oils' },
  ];

  const ingredientIds = ingredients.map((ing) => {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO ingredients (id, user_id, name, unit, cost_per_unit, current_stock, min_stock_level, category, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      ing.name,
      ing.unit,
      ing.costPerUnit,
      Math.random() * 50 + 10,
      5,
      ing.category,
      new Date().toISOString()
    );
    return { id, ...ing };
  });

  // Create products
  const products = [
    {
      name: 'Vanilla Cupcakes (Box of 12)',
      description: 'Delicious vanilla-flavored cupcakes with buttercream frosting',
      category: 'Cupcakes',
      basePrice: 28.00,
      costPrice: 8.50,
      prepTime: 45,
    },
    {
      name: 'Chocolate Cupcakes (Box of 12)',
      description: 'Rich chocolate cupcakes with chocolate ganache topping',
      category: 'Cupcakes',
      basePrice: 30.00,
      costPrice: 9.50,
      prepTime: 50,
    },
    {
      name: 'Red Velvet Cake (8 inch)',
      description: 'Classic red velvet with cream cheese frosting',
      category: 'Cakes',
      basePrice: 45.00,
      costPrice: 14.00,
      prepTime: 120,
    },
    {
      name: 'Wedding Cake (3 tier)',
      description: 'Custom wedding cake with buttercream and fresh flowers',
      category: 'Cakes',
      basePrice: 150.00,
      costPrice: 45.00,
      prepTime: 240,
    },
    {
      name: 'Sourdough Loaf',
      description: 'Artisanal sourdough with crispy crust',
      category: 'Bread',
      basePrice: 12.00,
      costPrice: 3.50,
      prepTime: 480,
    },
    {
      name: 'Chocolate Chip Cookies (Box of 12)',
      description: 'Warm, freshly-baked chocolate chip cookies',
      category: 'Cookies',
      basePrice: 15.00,
      costPrice: 4.50,
      prepTime: 30,
    },
    {
      name: 'Lemon Drizzle Cake (8 inch)',
      description: 'Moist lemon cake with lemon glaze',
      category: 'Cakes',
      basePrice: 38.00,
      costPrice: 11.00,
      prepTime: 90,
    },
    {
      name: 'Carrot Cake (8 inch)',
      description: 'Spiced carrot cake with cream cheese frosting',
      category: 'Cakes',
      basePrice: 42.00,
      costPrice: 13.00,
      prepTime: 100,
    },
    {
      name: 'Macarons (Box of 12)',
      description: 'Delicate French almond cookies with ganache filling',
      category: 'Pastries',
      basePrice: 32.00,
      costPrice: 10.00,
      prepTime: 60,
    },
    {
      name: 'Croissants (Box of 6)',
      description: 'Buttery, flaky French croissants',
      category: 'Pastries',
      basePrice: 18.00,
      costPrice: 5.50,
      prepTime: 90,
    },
  ];

  const productIds = products.map((prod) => {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO products (id, user_id, name, description, category, base_price, cost_price, is_active, prep_time_minutes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      prod.name,
      prod.description,
      prod.category,
      prod.basePrice,
      prod.costPrice,
      1,
      prod.prepTime,
      new Date().toISOString()
    );
    return { id, ...prod };
  });

  // Create recipes for each product
  const recipeMap = new Map<string, string>();
  productIds.forEach((product) => {
    const recipeId = uuidv4();
    db.prepare(`
      INSERT INTO recipes (id, product_id, user_id, created_at)
      VALUES (?, ?, ?, ?)
    `).run(recipeId, product.id, userId, new Date().toISOString());

    recipeMap.set(product.id, recipeId);

    // Add random ingredients to each recipe
    const ingredientCount = Math.floor(Math.random() * 4) + 3;
    const usedIngredients = new Set<number>();

    for (let i = 0; i < ingredientCount; i++) {
      let idx = Math.floor(Math.random() * ingredientIds.length);
      if (usedIngredients.has(idx) && usedIngredients.size < ingredientIds.length) {
        idx = Array.from({ length: ingredientIds.length })
          .map((_, j) => j)
          .find((j) => !usedIngredients.has(j)) || idx;
      }
      usedIngredients.add(idx);

      const ingredient = ingredientIds[idx];
      const quantity = Math.random() * 2 + 0.5;

      db.prepare(`
        INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), recipeId, ingredient.id, quantity, ingredient.unit);
    }
  });

  // Create customers
  const customerNames = [
    { name: 'Emma Wilson', email: 'emma.wilson@email.com', phone: '+1 (555) 234-5678', isCorporate: false },
    { name: 'Michael Chen', email: 'michael.chen@email.com', phone: '+1 (555) 345-6789', isCorporate: false },
    { name: 'Jessica Martinez', email: 'jessica.m@email.com', phone: '+1 (555) 456-7890', isCorporate: true, company: 'Tech Corp' },
    { name: 'David Thompson', email: null, phone: '+1 (555) 567-8901', isCorporate: false },
    { name: 'Laura Anderson', email: 'laura.anderson@email.com', phone: '+1 (555) 678-9012', isCorporate: true, company: 'Marketing Plus' },
    { name: 'James Brown', email: 'james.brown@email.com', phone: '+1 (555) 789-0123', isCorporate: false },
    { name: 'Maria Garcia', email: 'maria.garcia@email.com', phone: null, isCorporate: false },
    { name: 'Robert Taylor', email: 'r.taylor@email.com', phone: '+1 (555) 890-1234', isCorporate: true, company: 'Event Planners Inc' },
    { name: 'Sophie Lee', email: 'sophie.lee@email.com', phone: '+1 (555) 901-2345', isCorporate: false },
    { name: 'Daniel White', email: 'daniel.white@email.com', phone: '+1 (555) 012-3456', isCorporate: false },
    { name: 'Jennifer Lopez', email: 'jlopez@email.com', phone: '+1 (555) 111-2222', isCorporate: true, company: 'Wedding Events LLC' },
    { name: 'Christopher Davis', email: 'c.davis@email.com', phone: '+1 (555) 222-3333', isCorporate: false },
    { name: 'Amanda Jones', email: 'amanda.jones@email.com', phone: '+1 (555) 333-4444', isCorporate: false },
    { name: 'Matthew Smith', email: 'msmith@email.com', phone: '+1 (555) 444-5555', isCorporate: true, company: 'Office Supplies Co' },
    { name: 'Nicole Harris', email: 'n.harris@email.com', phone: '+1 (555) 555-6666', isCorporate: false },
  ];

  const customerIds = customerNames.map((cust) => {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO customers (id, user_id, name, email, phone, is_corporate, company_name, total_orders, total_spent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      cust.name,
      cust.email || null,
      cust.phone || null,
      cust.isCorporate ? 1 : 0,
      cust.company || null,
      0,
      0,
      new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString()
    );
    return id;
  });

  // Create orders with various statuses
  const statuses = ['pending', 'confirmed', 'in_production', 'ready', 'delivered', 'cancelled'];
  const paymentStatuses = ['unpaid', 'paid', 'refunded'];
  const deliveryTypes = ['pickup', 'delivery'];

  for (let i = 0; i < 25; i++) {
    const orderId = uuidv4();
    const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
    const deliveryType = deliveryTypes[Math.floor(Math.random() * deliveryTypes.length)];

    let totalAmount = 0;
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const orderItemIds: string[] = [];

    // Pre-calculate items and total
    const items: Array<{id: string, productId: string, quantity: number, unitPrice: number}> = [];
    for (let j = 0; j < itemCount; j++) {
      const product = productIds[Math.floor(Math.random() * productIds.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const unitPrice = product.basePrice;
      totalAmount += unitPrice * quantity;
      items.push({ id: uuidv4(), productId: product.id, quantity, unitPrice });
    }

    const createdDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
    const deliveryDate = new Date(createdDate.getTime() + (3 + Math.random() * 7) * 24 * 60 * 60 * 1000);

    // Insert order FIRST (before order_items, due to foreign key)
    db.prepare(`
      INSERT INTO orders (id, user_id, customer_id, status, total_amount, delivery_date, delivery_type, payment_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId,
      userId,
      customerId,
      status,
      totalAmount,
      deliveryDate.toISOString().split('T')[0],
      deliveryType,
      paymentStatus,
      createdDate.toISOString()
    );

    // Then insert order items
    for (const item of items) {
      db.prepare(`
        INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(item.id, orderId, item.productId, item.quantity, item.unitPrice, null);
      orderItemIds.push(item.id);
    }

    // Create production tasks for orders in production
    if (status === 'in_production' || status === 'ready' || status === 'delivered') {
      orderItemIds.forEach((itemId) => {
        const orderItem = db.prepare('SELECT product_id FROM order_items WHERE id = ?').get(itemId) as any;
        if (orderItem) {
          db.prepare(`
            INSERT INTO production_tasks (id, user_id, order_id, product_id, status, scheduled_date, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            uuidv4(),
            userId,
            orderId,
            orderItem.product_id,
            status === 'ready' || status === 'delivered' ? 'completed' : 'in_progress',
            deliveryDate.toISOString().split('T')[0],
            createdDate.toISOString()
          );
        }
      });
    }
  }

  // Create employees
  const employees = [
    { name: 'Alice Johnson', email: 'alice@sarahscreations.com', phone: '+1 (555) 111-1111', role: 'Head Baker', hourlyRate: 22.00 },
    { name: 'Tom Wilson', email: 'tom@sarahscreations.com', phone: '+1 (555) 222-2222', role: 'Baker', hourlyRate: 18.00 },
    { name: 'Emily Davis', email: 'emily@sarahscreations.com', phone: '+1 (555) 333-3333', role: 'Decorator', hourlyRate: 17.00 },
    { name: 'Marcus Brown', email: 'marcus@sarahscreations.com', phone: null, role: 'Delivery Driver', hourlyRate: 16.00 },
    { name: 'Sophia Martinez', email: null, phone: '+1 (555) 555-5555', role: 'Assistant Baker', hourlyRate: 14.00 },
  ];

  const employeeIds = employees.map((emp) => {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO employees (id, user_id, name, email, phone, role, hourly_rate, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      emp.name,
      emp.email || null,
      emp.phone || null,
      emp.role,
      emp.hourlyRate,
      1,
      new Date('2023-06-01').toISOString()
    );
    return id;
  });

  // Create shifts
  const today = new Date();
  for (let dayOffset = -30; dayOffset <= 30; dayOffset++) {
    const shiftDate = new Date(today.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const dateStr = shiftDate.toISOString().split('T')[0];

    employeeIds.forEach((empId) => {
      // Random shift assignment (70% chance of having a shift)
      if (Math.random() < 0.7) {
        const startHour = 6 + Math.floor(Math.random() * 3);
        const endHour = startHour + 8;

        db.prepare(`
          INSERT INTO shifts (id, employee_id, user_id, date, start_time, end_time)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(),
          empId,
          userId,
          dateStr,
          `${String(startHour).padStart(2, '0')}:00`,
          `${String(endHour).padStart(2, '0')}:00`
        );
      }
    });
  }

  // Create wholesale accounts
  const wholesaleAccounts = [
    { company: 'Downtown Coffee Roasters', contact: 'John Smith', email: 'john@dtcoffee.com', phone: '+1 (555) 600-1111', discount: 15 },
    { company: 'Upscale Hotel & Resort', contact: 'Patricia Anderson', email: 'pantry@upscalehotel.com', phone: '+1 (555) 600-2222', discount: 20 },
    { company: 'Office Supplies Direct', contact: 'Brian Lee', email: 'supplies@osd.com', phone: '+1 (555) 600-3333', discount: 10 },
    { company: 'Wedding Planners Collective', contact: 'Rachel Green', email: 'rachel@wpc.com', phone: '+1 (555) 600-4444', discount: 25 },
  ];

  const wholesaleAccountIds = wholesaleAccounts.map((acc) => {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO wholesale_accounts (id, user_id, company_name, contact_name, email, phone, discount_percent, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      acc.company,
      acc.contact,
      acc.email,
      acc.phone,
      acc.discount,
      1,
      new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString()
    );
    return id;
  });

  // Create wholesale orders
  wholesaleAccountIds.forEach((accountId) => {
    for (let i = 0; i < 3; i++) {
      const orderId = uuidv4();
      const itemCount = Math.floor(Math.random() * 3) + 2;
      let totalAmount = 0;

      for (let j = 0; j < itemCount; j++) {
        const product = productIds[Math.floor(Math.random() * productIds.length)];
        const quantity = Math.floor(Math.random() * 20) + 5;
        totalAmount += product.basePrice * quantity * 0.85; // 15% wholesale discount
      }

      const deliveryDate = new Date(Date.now() + (Math.random() * 30 + 3) * 24 * 60 * 60 * 1000);

      db.prepare(`
        INSERT INTO wholesale_orders (id, wholesale_account_id, user_id, status, total_amount, delivery_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderId,
        accountId,
        userId,
        Math.random() > 0.5 ? 'pending' : 'confirmed',
        totalAmount,
        deliveryDate.toISOString().split('T')[0],
        new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
      );
    }
  });

  // Create marketplace listings
  productIds.forEach((product) => {
    const id = uuidv4();
    const isFeatured = Math.random() > 0.6 ? 1 : 0;
    const areas = ['City Center', 'Suburbs', 'Downtown', 'Waterfront', 'All Areas'];
    const area = areas[Math.floor(Math.random() * areas.length)];

    db.prepare(`
      INSERT INTO marketplace_listings (id, user_id, product_id, is_featured, area, delivery_available, min_order, rating, review_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      product.id,
      isFeatured,
      area,
      1,
      1,
      Math.random() * 2 + 3.5,
      Math.floor(Math.random() * 50),
      new Date().toISOString()
    );
  });

  console.log('Database seeded successfully!');
  console.log('Demo user: demo@jumaboss.com / demo123');
}

seed();
