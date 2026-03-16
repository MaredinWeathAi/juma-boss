import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// PUBLIC: Search marketplace listings
router.get('/search', (req: AuthRequest, res) => {
  const db = getDatabase();
  const { query, category, area, minRating, limit = 20 } = req.query;

  try {
    let sql = `
      SELECT ml.*, p.name, p.description, p.category, p.base_price, p.image_url,
             u.bakery_name, u.bakery_slug
      FROM marketplace_listings ml
      JOIN products p ON ml.product_id = p.id
      JOIN users u ON ml.user_id = u.id
      WHERE ml.is_featured = 1 OR p.is_active = 1
    `;
    const params: any[] = [];

    if (query) {
      sql += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      params.push(`%${query}%`, `%${query}%`);
    }

    if (category) {
      sql += ` AND p.category = ?`;
      params.push(category);
    }

    if (area) {
      sql += ` AND (ml.area = ? OR ml.area = ?)`;
      params.push(area, 'All Areas');
    }

    if (minRating) {
      sql += ` AND ml.rating >= ?`;
      params.push(minRating);
    }

    sql += ` ORDER BY ml.is_featured DESC, ml.rating DESC LIMIT ?`;
    params.push(limit);

    const listings = db.prepare(sql).all(...params) as any[];

    const result = listings.map((l) => ({
      id: l.id,
      productId: l.product_id,
      productName: l.name,
      description: l.description,
      category: l.category,
      price: l.base_price,
      imageUrl: l.image_url,
      bakeryName: l.bakery_name,
      bakerySlug: l.bakery_slug,
      isFeatured: l.is_featured,
      area: l.area,
      deliveryAvailable: l.delivery_available,
      minOrder: l.min_order,
      rating: l.rating,
      reviewCount: l.review_count,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search marketplace' });
  }
});

// Get user's marketplace listings
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const listings = db
      .prepare(`
        SELECT ml.*, p.name, p.category, p.base_price
        FROM marketplace_listings ml
        JOIN products p ON ml.product_id = p.id
        WHERE ml.user_id = ?
        ORDER BY ml.is_featured DESC, ml.created_at DESC
      `)
      .all(req.userId) as any[];

    const result = listings.map((l) => ({
      id: l.id,
      productId: l.product_id,
      productName: l.name,
      category: l.category,
      price: l.base_price,
      isFeatured: l.is_featured,
      area: l.area,
      deliveryAvailable: l.delivery_available,
      minOrder: l.min_order,
      rating: l.rating,
      reviewCount: l.review_count,
      createdAt: l.created_at,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Get single marketplace listing
router.get('/:id', (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const listing = db
      .prepare(`
        SELECT ml.*, p.name, p.description, p.category, p.base_price, p.image_url,
               u.bakery_name, u.bakery_slug
        FROM marketplace_listings ml
        JOIN products p ON ml.product_id = p.id
        JOIN users u ON ml.user_id = u.id
        WHERE ml.id = ?
      `)
      .get(req.params.id) as any;

    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    res.json({
      id: listing.id,
      productId: listing.product_id,
      productName: listing.name,
      description: listing.description,
      category: listing.category,
      price: listing.base_price,
      imageUrl: listing.image_url,
      bakeryName: listing.bakery_name,
      bakerySlug: listing.bakery_slug,
      isFeatured: listing.is_featured,
      area: listing.area,
      deliveryAvailable: listing.delivery_available,
      minOrder: listing.min_order,
      rating: listing.rating,
      reviewCount: listing.review_count,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

// CREATE marketplace listing
router.post('/', authenticateToken, (req: AuthRequest, res) => {
  const { productId, isFeatured, area, deliveryAvailable, minOrder } = req.body;

  if (!productId) {
    res.status(400).json({ error: 'Product ID is required' });
    return;
  }

  const db = getDatabase();

  try {
    // Verify product exists
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND user_id = ?').get(productId, req.userId) as any;

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const listingId = uuidv4();

    db.prepare(`
      INSERT INTO marketplace_listings (id, user_id, product_id, is_featured, area, delivery_available, min_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      listingId,
      req.userId,
      productId,
      isFeatured ? 1 : 0,
      area || 'All Areas',
      deliveryAvailable !== false ? 1 : 0,
      minOrder || 1,
      new Date().toISOString()
    );

    res.status(201).json({
      id: listingId,
      productId,
      isFeatured: isFeatured || false,
      area: area || 'All Areas',
      deliveryAvailable: deliveryAvailable !== false,
      minOrder: minOrder || 1,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// UPDATE marketplace listing
router.put('/:id', authenticateToken, (req: AuthRequest, res) => {
  const { isFeatured, area, deliveryAvailable, minOrder } = req.body;
  const db = getDatabase();

  try {
    const listing = db.prepare('SELECT * FROM marketplace_listings WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    db.prepare(`
      UPDATE marketplace_listings
      SET is_featured = ?, area = ?, delivery_available = ?, min_order = ?
      WHERE id = ?
    `).run(
      isFeatured !== undefined ? (isFeatured ? 1 : 0) : listing.is_featured,
      area !== undefined ? area : listing.area,
      deliveryAvailable !== undefined ? (deliveryAvailable ? 1 : 0) : listing.delivery_available,
      minOrder !== undefined ? minOrder : listing.min_order,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM marketplace_listings WHERE id = ?').get(req.params.id) as any;

    res.json({
      id: updated.id,
      isFeatured: updated.is_featured,
      area: updated.area,
      deliveryAvailable: updated.delivery_available,
      minOrder: updated.min_order,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

// DELETE marketplace listing
router.delete('/:id', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const listing = db.prepare('SELECT * FROM marketplace_listings WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    db.prepare('DELETE FROM marketplace_listings WHERE id = ?').run(req.params.id);

    res.json({ message: 'Listing deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

export default router;
