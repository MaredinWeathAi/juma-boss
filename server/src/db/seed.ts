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

  // =====================
  // 1. ADMIN ACCOUNT (Marcelo Zinn - Platform Owner)
  // =====================
  const adminId = uuidv4();
  db.prepare(`
    INSERT INTO users (id, email, password, name, bakery_name, bakery_slug, phone, bio, tier, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    adminId,
    'admin@jumaboss.com',
    hashPassword('admin123'),
    'Marcelo Zinn',
    'Juma Boss HQ',
    'juma-boss-hq',
    '+1 (555) 000-0000',
    'Founder and CEO of Juma Boss, the leading bakery management platform',
    'enterprise',
    'admin',
    new Date('2022-01-01').toISOString()
  );

  // =====================
  // 2. HOBBY TIER BAKER (Maria Santos - Free Plan)
  // =====================
  const hobbyId = uuidv4();
  db.prepare(`
    INSERT INTO users (id, email, password, name, bakery_name, bakery_slug, phone, bio, tier, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    hobbyId,
    'hobby@jumaboss.com',
    hashPassword('demo123'),
    'Maria Santos',
    "Maria's Home Bakes",
    'marias-home-bakes',
    '+1 (555) 123-4567',
    'Small home-based bakery making fresh cakes and pastries for family and friends.',
    'hobby',
    'baker',
    new Date('2024-01-15').toISOString()
  );

  // =====================
  // 3. GROWING TIER BAKER (James Chen - Starter Plan $29)
  // =====================
  const growingId = uuidv4();
  db.prepare(`
    INSERT INTO users (id, email, password, name, bakery_name, bakery_slug, phone, bio, tier, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    growingId,
    'starter@jumaboss.com',
    hashPassword('demo123'),
    'James Chen',
    'Golden Crust Bakery',
    'golden-crust-bakery',
    '+1 (555) 234-5678',
    'Local bakery focused on traditional bread and pastries. Growing our wholesale business.',
    'growing',
    'baker',
    new Date('2023-06-20').toISOString()
  );

  // =====================
  // 4. PRO TIER BAKER (Sarah Johnson - Pro Plan $79) - Original demo account
  // =====================
  const proId = uuidv4();
  db.prepare(`
    INSERT INTO users (id, email, password, name, bakery_name, bakery_slug, phone, bio, tier, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    proId,
    'demo@jumaboss.com',
    hashPassword('demo123'),
    'Sarah Johnson',
    "Sarah's Sweet Creations",
    'sarahs-sweet-creations',
    '+1 (555) 345-6789',
    'Premium artisanal bakery specializing in custom cakes, cupcakes, and sourdough. Established 2018.',
    'pro',
    'baker',
    new Date('2023-01-15').toISOString()
  );

  // =====================
  // 5. ENTERPRISE TIER BAKER (Robert Williams - Enterprise Plan $199)
  // =====================
  const enterpriseId = uuidv4();
  db.prepare(`
    INSERT INTO users (id, email, password, name, bakery_name, bakery_slug, phone, bio, tier, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    enterpriseId,
    'enterprise@jumaboss.com',
    hashPassword('demo123'),
    'Robert Williams',
    'Williams Bakery Empire',
    'williams-bakery-empire',
    '+1 (555) 456-7890',
    'Largest artisanal bakery chain in the region with multiple locations and wholesale operations.',
    'enterprise',
    'baker',
    new Date('2022-03-10').toISOString()
  );

  // =====================
  // SHARED INGREDIENTS (for all bakers)
  // =====================
  const sharedIngredients = [
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

  // Function to create ingredients for a baker
  function createIngredientsForBaker(userId: string, count: number = 18) {
    return sharedIngredients.slice(0, count).map((ing) => {
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
  }

  // =====================
  // CREATE PRODUCTS AND RECIPES FOR EACH BAKER
  // =====================

  // Helper function to create products for a baker
  function createProductsForBaker(userId: string, count: number) {
    const allProducts = [
      { name: 'Vanilla Cupcakes (Box of 12)', description: 'Delicious vanilla-flavored cupcakes with buttercream frosting', category: 'Cupcakes', basePrice: 28.00, costPrice: 8.50, prepTime: 45 },
      { name: 'Chocolate Cupcakes (Box of 12)', description: 'Rich chocolate cupcakes with chocolate ganache topping', category: 'Cupcakes', basePrice: 30.00, costPrice: 9.50, prepTime: 50 },
      { name: 'Red Velvet Cake (8 inch)', description: 'Classic red velvet with cream cheese frosting', category: 'Cakes', basePrice: 45.00, costPrice: 14.00, prepTime: 120 },
      { name: 'Wedding Cake (3 tier)', description: 'Custom wedding cake with buttercream and fresh flowers', category: 'Cakes', basePrice: 150.00, costPrice: 45.00, prepTime: 240 },
      { name: 'Sourdough Loaf', description: 'Artisanal sourdough with crispy crust', category: 'Bread', basePrice: 12.00, costPrice: 3.50, prepTime: 480 },
      { name: 'Chocolate Chip Cookies (Box of 12)', description: 'Warm, freshly-baked chocolate chip cookies', category: 'Cookies', basePrice: 15.00, costPrice: 4.50, prepTime: 30 },
      { name: 'Lemon Drizzle Cake (8 inch)', description: 'Moist lemon cake with lemon glaze', category: 'Cakes', basePrice: 38.00, costPrice: 11.00, prepTime: 90 },
      { name: 'Carrot Cake (8 inch)', description: 'Spiced carrot cake with cream cheese frosting', category: 'Cakes', basePrice: 42.00, costPrice: 13.00, prepTime: 100 },
      { name: 'Macarons (Box of 12)', description: 'Delicate French almond cookies with ganache filling', category: 'Pastries', basePrice: 32.00, costPrice: 10.00, prepTime: 60 },
      { name: 'Croissants (Box of 6)', description: 'Buttery, flaky French croissants', category: 'Pastries', basePrice: 18.00, costPrice: 5.50, prepTime: 90 },
      { name: 'Blueberry Muffins (Box of 6)', description: 'Fresh blueberry muffins with streusel topping', category: 'Muffins', basePrice: 16.00, costPrice: 4.80, prepTime: 40 },
      { name: 'Cheesecake (8 inch)', description: 'Creamy New York style cheesecake', category: 'Cakes', basePrice: 55.00, costPrice: 16.00, prepTime: 180 },
      { name: 'Brownies (Box of 8)', description: 'Fudgy chocolate brownies', category: 'Brownies', basePrice: 20.00, costPrice: 5.50, prepTime: 35 },
      { name: 'Donuts (Box of 12)', description: 'Glazed and filled donut varieties', category: 'Donuts', basePrice: 24.00, costPrice: 6.50, prepTime: 50 },
      { name: 'Tiramisu (8 inch)', description: 'Italian classic with mascarpone and espresso', category: 'Cakes', basePrice: 48.00, costPrice: 14.50, prepTime: 120 },
    ];

    return allProducts.slice(0, count).map((prod) => {
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
  }

  // Helper to create recipes
  function createRecipesForProducts(userId: string, products: any[], ingredients: any[]) {
    const recipeMap = new Map<string, string>();
    products.forEach((product) => {
      const recipeId = uuidv4();
      db.prepare(`
        INSERT INTO recipes (id, product_id, user_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run(recipeId, product.id, userId, new Date().toISOString());

      recipeMap.set(product.id, recipeId);

      const ingredientCount = Math.floor(Math.random() * 4) + 3;
      const usedIngredients = new Set<number>();

      for (let i = 0; i < ingredientCount; i++) {
        let idx = Math.floor(Math.random() * ingredients.length);
        if (usedIngredients.has(idx) && usedIngredients.size < ingredients.length) {
          idx = Array.from({ length: ingredients.length })
            .map((_, j) => j)
            .find((j) => !usedIngredients.has(j)) || idx;
        }
        usedIngredients.add(idx);

        const ingredient = ingredients[idx];
        const quantity = Math.random() * 2 + 0.5;

        db.prepare(`
          INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit)
          VALUES (?, ?, ?, ?, ?)
        `).run(uuidv4(), recipeId, ingredient.id, quantity, ingredient.unit);
      }
    });
    return recipeMap;
  }

  // Helper to create customers
  function createCustomersForBaker(userId: string, count: number) {
    const allCustomerNames = [
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
      { name: 'Andrew Miller', email: 'andrew.miller@email.com', phone: '+1 (555) 666-7777', isCorporate: false },
      { name: 'Victoria Clark', email: 'v.clark@email.com', phone: '+1 (555) 777-8888', isCorporate: true, company: 'Corporate Events' },
      { name: 'Brandon Lee', email: 'brandon.lee@email.com', phone: '+1 (555) 888-9999', isCorporate: false },
      { name: 'Michelle Anderson', email: 'michelle.a@email.com', phone: '+1 (555) 999-0000', isCorporate: false },
      { name: 'Kevin Thompson', email: 'k.thompson@email.com', phone: '+1 (555) 110-1111', isCorporate: true, company: 'Wholesale Distributor' },
      { name: 'Sarah Martinez', email: 'sarah.m@email.com', phone: '+1 (555) 121-1212', isCorporate: false },
      { name: 'Jason Brown', email: 'jason.b@email.com', phone: null, isCorporate: false },
      { name: 'Rachel Green', email: 'rachel.green@email.com', phone: '+1 (555) 131-3131', isCorporate: true, company: 'Party Rentals' },
      { name: 'Timothy Garcia', email: 'timothy.g@email.com', phone: '+1 (555) 141-4141', isCorporate: false },
      { name: 'Elizabeth Davis', email: 'elizabeth.d@email.com', phone: '+1 (555) 151-5151', isCorporate: false },
      { name: 'Joshua Rodriguez', email: 'joshua.r@email.com', phone: '+1 (555) 161-6161', isCorporate: true, company: 'Catering Services' },
      { name: 'Patricia Wilson', email: 'patricia.w@email.com', phone: '+1 (555) 171-7171', isCorporate: false },
      { name: 'Ryan Jackson', email: 'ryan.jackson@email.com', phone: '+1 (555) 181-8181', isCorporate: false },
      { name: 'Linda Taylor', email: 'linda.taylor@email.com', phone: '+1 (555) 191-9191', isCorporate: false },
      { name: 'David White', email: 'david.w@email.com', phone: '+1 (555) 201-0000', isCorporate: false },
      { name: 'Barbara Martin', email: 'barbara.m@email.com', phone: '+1 (555) 211-1111', isCorporate: true, company: 'Bakery Supply Co' },
      { name: 'George King', email: 'george.king@email.com', phone: '+1 (555) 221-2222', isCorporate: false },
      { name: 'Sandra Hall', email: 'sandra.hall@email.com', phone: '+1 (555) 231-3333', isCorporate: false },
      { name: 'Mark Lewis', email: 'mark.lewis@email.com', phone: '+1 (555) 241-4444', isCorporate: false },
      { name: 'Nancy Young', email: 'nancy.young@email.com', phone: '+1 (555) 251-5555', isCorporate: true, company: 'Celebration Events' },
      { name: 'Charles Scott', email: 'charles.scott@email.com', phone: '+1 (555) 261-6666', isCorporate: false },
      { name: 'Karen Green', email: 'karen.green@email.com', phone: '+1 (555) 271-7777', isCorporate: false },
      { name: 'Thomas Adams', email: 'thomas.adams@email.com', phone: '+1 (555) 281-8888', isCorporate: true, company: 'Restaurant Group' },
      { name: 'Donna Nelson', email: 'donna.nelson@email.com', phone: '+1 (555) 291-9999', isCorporate: false },
      { name: 'Paul Carter', email: 'paul.carter@email.com', phone: '+1 (555) 301-0000', isCorporate: false },
    ];

    return allCustomerNames.slice(0, count).map((cust) => {
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
  }

  // Helper to create orders
  function createOrdersForBaker(userId: string, customerIds: string[], productIds: any[], count: number) {
    const statuses = ['pending', 'confirmed', 'in_production', 'ready', 'delivered', 'cancelled'];
    const paymentStatuses = ['unpaid', 'paid', 'refunded'];
    const deliveryTypes = ['pickup', 'delivery'];

    for (let i = 0; i < count; i++) {
      const orderId = uuidv4();
      const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
      const deliveryType = deliveryTypes[Math.floor(Math.random() * deliveryTypes.length)];

      let totalAmount = 0;
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const items: Array<{ id: string; productId: string; quantity: number; unitPrice: number }> = [];

      for (let j = 0; j < itemCount; j++) {
        const product = productIds[Math.floor(Math.random() * productIds.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const unitPrice = product.basePrice;
        totalAmount += unitPrice * quantity;
        items.push({ id: uuidv4(), productId: product.id, quantity, unitPrice });
      }

      const createdDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
      const deliveryDate = new Date(createdDate.getTime() + (3 + Math.random() * 7) * 24 * 60 * 60 * 1000);

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

      for (const item of items) {
        db.prepare(`
          INSERT INTO order_items (id, order_id, product_id, quantity, unit_price)
          VALUES (?, ?, ?, ?, ?)
        `).run(item.id, orderId, item.productId, item.quantity, item.unitPrice);
      }

      if (status === 'in_production' || status === 'ready' || status === 'delivered') {
        items.forEach((item) => {
          db.prepare(`
            INSERT INTO production_tasks (id, user_id, order_id, product_id, status, scheduled_date, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            uuidv4(),
            userId,
            orderId,
            item.productId,
            status === 'ready' || status === 'delivered' ? 'completed' : 'in_progress',
            deliveryDate.toISOString().split('T')[0],
            createdDate.toISOString()
          );
        });
      }
    }
  }

  // =====================
  // SETUP HOBBY TIER (Maria - 3 products, 5 customers, 8 orders)
  // =====================
  const hobbyIngredients = createIngredientsForBaker(hobbyId, 10);
  const hobbyProducts = createProductsForBaker(hobbyId, 3);
  createRecipesForProducts(hobbyId, hobbyProducts, hobbyIngredients);
  const hobbyCustomers = createCustomersForBaker(hobbyId, 5);
  createOrdersForBaker(hobbyId, hobbyCustomers, hobbyProducts, 8);

  // =====================
  // SETUP GROWING TIER (James - 8 products, 20 customers, 40 orders)
  // =====================
  const growingIngredients = createIngredientsForBaker(growingId, 15);
  const growingProducts = createProductsForBaker(growingId, 8);
  createRecipesForProducts(growingId, growingProducts, growingIngredients);
  const growingCustomers = createCustomersForBaker(growingId, 20);
  createOrdersForBaker(growingId, growingCustomers, growingProducts, 40);

  // =====================
  // SETUP PRO TIER (Sarah - 10 products, 15 customers, 25 orders, 5 employees, wholesale)
  // =====================
  const proIngredients = createIngredientsForBaker(proId, 18);
  const proProducts = createProductsForBaker(proId, 10);
  createRecipesForProducts(proId, proProducts, proIngredients);
  const proCustomers = createCustomersForBaker(proId, 15);
  createOrdersForBaker(proId, proCustomers, proProducts, 25);

  // Create employees for Sarah
  const proEmployees = [
    { name: 'Alice Johnson', email: 'alice@sarahscreations.com', phone: '+1 (555) 111-1111', role: 'Head Baker', hourlyRate: 22.00 },
    { name: 'Tom Wilson', email: 'tom@sarahscreations.com', phone: '+1 (555) 222-2222', role: 'Baker', hourlyRate: 18.00 },
    { name: 'Emily Davis', email: 'emily@sarahscreations.com', phone: '+1 (555) 333-3333', role: 'Decorator', hourlyRate: 17.00 },
    { name: 'Marcus Brown', email: 'marcus@sarahscreations.com', phone: null, role: 'Delivery Driver', hourlyRate: 16.00 },
    { name: 'Sophia Martinez', email: null, phone: '+1 (555) 555-5555', role: 'Assistant Baker', hourlyRate: 14.00 },
  ];

  const proEmployeeIds = proEmployees.map((emp) => {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO employees (id, user_id, name, email, phone, role, hourly_rate, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      proId,
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

  // Create shifts for Sarah's employees
  const today = new Date();
  for (let dayOffset = -30; dayOffset <= 30; dayOffset++) {
    const shiftDate = new Date(today.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const dateStr = shiftDate.toISOString().split('T')[0];

    proEmployeeIds.forEach((empId) => {
      if (Math.random() < 0.7) {
        const startHour = 6 + Math.floor(Math.random() * 3);
        const endHour = startHour + 8;

        db.prepare(`
          INSERT INTO shifts (id, employee_id, user_id, date, start_time, end_time)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(),
          empId,
          proId,
          dateStr,
          `${String(startHour).padStart(2, '0')}:00`,
          `${String(endHour).padStart(2, '0')}:00`
        );
      }
    });
  }

  // Create wholesale accounts for Sarah
  const proWholesaleAccounts = [
    { company: 'Downtown Coffee Roasters', contact: 'John Smith', email: 'john@dtcoffee.com', phone: '+1 (555) 600-1111', discount: 15 },
    { company: 'Upscale Hotel & Resort', contact: 'Patricia Anderson', email: 'pantry@upscalehotel.com', phone: '+1 (555) 600-2222', discount: 20 },
    { company: 'Office Supplies Direct', contact: 'Brian Lee', email: 'supplies@osd.com', phone: '+1 (555) 600-3333', discount: 10 },
    { company: 'Wedding Planners Collective', contact: 'Rachel Green', email: 'rachel@wpc.com', phone: '+1 (555) 600-4444', discount: 25 },
  ];

  const proWholesaleAccountIds = proWholesaleAccounts.map((acc) => {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO wholesale_accounts (id, user_id, company_name, contact_name, email, phone, discount_percent, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      proId,
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

  // Create wholesale orders for Sarah
  proWholesaleAccountIds.forEach((accountId) => {
    for (let i = 0; i < 3; i++) {
      const orderId = uuidv4();
      const itemCount = Math.floor(Math.random() * 3) + 2;
      let totalAmount = 0;

      for (let j = 0; j < itemCount; j++) {
        const product = proProducts[Math.floor(Math.random() * proProducts.length)];
        const quantity = Math.floor(Math.random() * 20) + 5;
        totalAmount += product.basePrice * quantity * 0.85;
      }

      const deliveryDate = new Date(Date.now() + (Math.random() * 30 + 3) * 24 * 60 * 60 * 1000);

      db.prepare(`
        INSERT INTO wholesale_orders (id, wholesale_account_id, user_id, status, total_amount, delivery_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderId,
        accountId,
        proId,
        Math.random() > 0.5 ? 'pending' : 'confirmed',
        totalAmount,
        deliveryDate.toISOString().split('T')[0],
        new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
      );
    }
  });

  // Create marketplace listings for Sarah
  proProducts.forEach((product) => {
    const id = uuidv4();
    const isFeatured = Math.random() > 0.6 ? 1 : 0;
    const areas = ['City Center', 'Suburbs', 'Downtown', 'Waterfront', 'All Areas'];
    const area = areas[Math.floor(Math.random() * areas.length)];

    db.prepare(`
      INSERT INTO marketplace_listings (id, user_id, product_id, is_featured, area, delivery_available, min_order, rating, review_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      proId,
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

  // =====================
  // SETUP ENTERPRISE TIER (Robert - 15 products, 40 customers, 80 orders, 10 employees, wholesale, marketplace)
  // =====================
  const enterpriseIngredients = createIngredientsForBaker(enterpriseId, 18);
  const enterpriseProducts = createProductsForBaker(enterpriseId, 15);
  createRecipesForProducts(enterpriseId, enterpriseProducts, enterpriseIngredients);
  const enterpriseCustomers = createCustomersForBaker(enterpriseId, 40);
  createOrdersForBaker(enterpriseId, enterpriseCustomers, enterpriseProducts, 80);

  // Create employees for Robert
  const enterpriseEmployees = [
    { name: 'Robert Williams Jr.', email: 'robert.jr@williamsbakery.com', phone: '+1 (555) 501-1111', role: 'General Manager', hourlyRate: 28.00 },
    { name: 'Catherine Lee', email: 'catherine@williamsbakery.com', phone: '+1 (555) 501-2222', role: 'Head Baker', hourlyRate: 25.00 },
    { name: 'Michael Johnson', email: 'michael@williamsbakery.com', phone: '+1 (555) 501-3333', role: 'Baker', hourlyRate: 20.00 },
    { name: 'Angela Martinez', email: 'angela@williamsbakery.com', phone: '+1 (555) 501-4444', role: 'Baker', hourlyRate: 20.00 },
    { name: 'David Chen', email: 'david@williamsbakery.com', phone: '+1 (555) 501-5555', role: 'Pastry Chef', hourlyRate: 24.00 },
    { name: 'Sarah Thompson', email: 'sarah.t@williamsbakery.com', phone: '+1 (555) 501-6666', role: 'Decorator', hourlyRate: 19.00 },
    { name: 'James Wilson', email: 'james@williamsbakery.com', phone: '+1 (555) 501-7777', role: 'Decorator', hourlyRate: 19.00 },
    { name: 'Jessica Harris', email: 'jessica@williamsbakery.com', phone: '+1 (555) 501-8888', role: 'Delivery Driver', hourlyRate: 17.00 },
    { name: 'Marcus Brown', email: 'marcus@williamsbakery.com', phone: '+1 (555) 501-9999', role: 'Delivery Driver', hourlyRate: 17.00 },
    { name: 'Emily Davis', email: 'emily@williamsbakery.com', phone: '+1 (555) 501-0000', role: 'Assistant Baker', hourlyRate: 15.00 },
  ];

  const enterpriseEmployeeIds = enterpriseEmployees.map((emp) => {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO employees (id, user_id, name, email, phone, role, hourly_rate, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      enterpriseId,
      emp.name,
      emp.email || null,
      emp.phone || null,
      emp.role,
      emp.hourlyRate,
      1,
      new Date('2022-06-01').toISOString()
    );
    return id;
  });

  // Create shifts for Robert's employees
  for (let dayOffset = -30; dayOffset <= 30; dayOffset++) {
    const shiftDate = new Date(today.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const dateStr = shiftDate.toISOString().split('T')[0];

    enterpriseEmployeeIds.forEach((empId) => {
      if (Math.random() < 0.8) {
        const startHour = 5 + Math.floor(Math.random() * 4);
        const endHour = startHour + 8 + Math.floor(Math.random() * 2);

        db.prepare(`
          INSERT INTO shifts (id, employee_id, user_id, date, start_time, end_time)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(),
          empId,
          enterpriseId,
          dateStr,
          `${String(startHour).padStart(2, '0')}:00`,
          `${String(endHour).padStart(2, '0')}:00`
        );
      }
    });
  }

  // Create wholesale accounts for Robert
  const enterpriseWholesaleAccounts = [
    { company: 'Premium Hotel Chain', contact: 'Victoria Anderson', email: 'victoria@premiumhotels.com', phone: '+1 (555) 700-1111', discount: 20 },
    { company: 'Corporate Catering', contact: 'James Rodriguez', email: 'james@corpcatering.com', phone: '+1 (555) 700-2222', discount: 18 },
    { company: 'Wedding & Events', contact: 'Alexandra Klein', email: 'alexandra@weddingevents.com', phone: '+1 (555) 700-3333', discount: 25 },
    { company: 'Restaurant Group', contact: 'Thomas Harper', email: 'thomas@restaurantgroup.com', phone: '+1 (555) 700-4444', discount: 22 },
    { company: 'Grocery Chain', contact: 'Lisa Montgomery', email: 'lisa@grocerychain.com', phone: '+1 (555) 700-5555', discount: 15 },
  ];

  const enterpriseWholesaleAccountIds = enterpriseWholesaleAccounts.map((acc) => {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO wholesale_accounts (id, user_id, company_name, contact_name, email, phone, discount_percent, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      enterpriseId,
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

  // Create wholesale orders for Robert
  enterpriseWholesaleAccountIds.forEach((accountId) => {
    for (let i = 0; i < 5; i++) {
      const orderId = uuidv4();
      const itemCount = Math.floor(Math.random() * 4) + 3;
      let totalAmount = 0;

      for (let j = 0; j < itemCount; j++) {
        const product = enterpriseProducts[Math.floor(Math.random() * enterpriseProducts.length)];
        const quantity = Math.floor(Math.random() * 30) + 10;
        totalAmount += product.basePrice * quantity * 0.85;
      }

      const deliveryDate = new Date(Date.now() + (Math.random() * 30 + 3) * 24 * 60 * 60 * 1000);

      db.prepare(`
        INSERT INTO wholesale_orders (id, wholesale_account_id, user_id, status, total_amount, delivery_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderId,
        accountId,
        enterpriseId,
        Math.random() > 0.3 ? 'confirmed' : 'pending',
        totalAmount,
        deliveryDate.toISOString().split('T')[0],
        new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
      );
    }
  });

  // Create marketplace listings for Robert
  enterpriseProducts.forEach((product) => {
    const id = uuidv4();
    const isFeatured = Math.random() > 0.4 ? 1 : 0;
    const areas = ['City Center', 'Suburbs', 'Downtown', 'Waterfront', 'All Areas'];
    const area = areas[Math.floor(Math.random() * areas.length)];

    db.prepare(`
      INSERT INTO marketplace_listings (id, user_id, product_id, is_featured, area, delivery_available, min_order, rating, review_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      enterpriseId,
      product.id,
      isFeatured,
      area,
      1,
      Math.floor(Math.random() * 3) + 1,
      Math.random() * 1.5 + 4.0,
      Math.floor(Math.random() * 100) + 20,
      new Date().toISOString()
    );
  });

  console.log('Database seeded successfully!');
  console.log('\nDemo accounts:');
  console.log('Admin: admin@jumaboss.com / admin123');
  console.log('Hobby: hobby@jumaboss.com / demo123');
  console.log('Growing: starter@jumaboss.com / demo123');
  console.log('Pro: demo@jumaboss.com / demo123');
  console.log('Enterprise: enterprise@jumaboss.com / demo123');
}

seed();
