import { Router } from 'express';
import { getDatabase } from '../db/index.js';

const router = Router();

// PUBLIC: Get baker storefront by slug
router.get('/:slug', (req, res) => {
  const db = getDatabase();
  const { slug } = req.params;

  try {
    const user = db.prepare('SELECT * FROM users WHERE bakery_slug = ?').get(slug) as any;

    if (!user) {
      res.status(404).json({ error: 'Bakery not found' });
      return;
    }

    // Get baker info
    const bakeryInfo = {
      id: user.id,
      name: user.name,
      bakeryName: user.bakery_name,
      bakerySlug: user.bakery_slug,
      phone: user.phone,
      bio: user.bio,
      profileImage: user.profile_image,
      tier: user.tier,
    };

    // Get active products
    const products = db
      .prepare(`
        SELECT p.* FROM products p
        WHERE p.user_id = ? AND p.is_active = 1
        ORDER BY p.category, p.name
      `)
      .all(user.id) as any[];

    // Get marketplace listings
    const listings = db
      .prepare(`
        SELECT ml.* FROM marketplace_listings ml
        WHERE ml.user_id = ?
      `)
      .all(user.id) as any[];

    const listingMap = new Map<string, any>();
    listings.forEach((l) => {
      listingMap.set(l.product_id, l);
    });

    // Get total reviews
    const reviews = db
      .prepare(`
        SELECT COALESCE(SUM(review_count), 0) as total_reviews,
               COALESCE(AVG(rating), 0) as avg_rating
        FROM marketplace_listings
        WHERE user_id = ?
      `)
      .get(user.id) as any;

    // Get customer count for bakery
    const customers = db.prepare('SELECT COUNT(*) as count FROM customers WHERE user_id = ?').get(user.id) as any;

    const productsWithListings = products.map((p) => {
      const listing = listingMap.get(p.id);
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.base_price,
        imageUrl: p.image_url,
        prepTimeMinutes: p.prep_time_minutes,
        onMarketplace: !!listing,
        isFeatured: listing?.is_featured || false,
        rating: listing?.rating || 0,
        reviewCount: listing?.review_count || 0,
      };
    });

    // Group by category
    const byCategory: any = {};
    productsWithListings.forEach((p) => {
      if (!byCategory[p.category]) {
        byCategory[p.category] = [];
      }
      byCategory[p.category].push(p);
    });

    res.json({
      bakery: bakeryInfo,
      stats: {
        totalProducts: products.length,
        totalReviews: reviews.total_reviews || 0,
        averageRating: Number(reviews.avg_rating?.toFixed(2)) || 0,
        totalCustomers: customers.count,
      },
      products: productsWithListings,
      productsByCategory: byCategory,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bakery storefront' });
  }
});

// PUBLIC: Get single product from storefront
router.get('/:slug/products/:productId', (req, res) => {
  const db = getDatabase();
  const { slug, productId } = req.params;

  try {
    const user = db.prepare('SELECT * FROM users WHERE bakery_slug = ?').get(slug) as any;

    if (!user) {
      res.status(404).json({ error: 'Bakery not found' });
      return;
    }

    const product = db
      .prepare('SELECT * FROM products WHERE id = ? AND user_id = ? AND is_active = 1')
      .get(productId, user.id) as any;

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Get marketplace listing info
    const listing = db.prepare('SELECT * FROM marketplace_listings WHERE product_id = ? AND user_id = ?').get(productId, user.id) as any;

    // Get recipe ingredients
    const recipe = db.prepare('SELECT * FROM recipes WHERE product_id = ?').get(productId) as any;
    let ingredients: any[] = [];

    if (recipe) {
      ingredients = db
        .prepare(`
          SELECT ri.*, i.name, i.unit
          FROM recipe_ingredients ri
          JOIN ingredients i ON ri.ingredient_id = i.id
          WHERE ri.recipe_id = ?
        `)
        .all(recipe.id) as any[];
    }

    res.json({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.base_price,
      imageUrl: product.image_url,
      prepTimeMinutes: product.prep_time_minutes,
      bakery: {
        name: user.bakery_name,
        slug: user.bakery_slug,
      },
      marketplace: listing
        ? {
            isFeatured: listing.is_featured,
            area: listing.area,
            deliveryAvailable: listing.delivery_available,
            minOrder: listing.min_order,
            rating: listing.rating,
            reviewCount: listing.review_count,
          }
        : null,
      ingredients: ingredients.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

export default router;
