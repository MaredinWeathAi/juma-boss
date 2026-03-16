export type Tier = 'hobby' | 'growing' | 'pro' | 'enterprise'

export interface User {
  id: string;
  name: string;
  email: string;
  bakeryName: string;
  phone?: string;
  bio?: string;
  role: 'admin' | 'baker' | 'owner' | 'manager' | 'employee';
  tier: Tier;
  createdAt: string;
  updatedAt: string;
}

export interface PricingPlan {
  tier: Tier;
  name: string;
  price: number;
  description: string;
  features: string[];
  limits?: {
    orders?: number;
    products?: number;
    customers?: number;
  };
}

export interface TierLimits {
  tier: Tier;
  orders: number;
  products: number;
  customers: number;
}

export interface UserUsage {
  ordersCount: number;
  productsCount: number;
  customersCount: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  basePrice: number;
  costPrice: number;
  prepTime: number;
  isActive: boolean;
  imageUrl?: string;
  ingredients: ProductIngredient[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductIngredient {
  ingredientId: string;
  quantity: number;
  unit: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'confirmed' | 'in_production' | 'ready' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  deliveryType: 'pickup' | 'delivery';
  deliveryDate: string;
  deliveryTime?: string;
  deliveryAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  birthday?: string;
  notes?: string;
  isWholesale: boolean;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minimumLevel: number;
  unit: string;
  costPerUnit: number;
  supplier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionTask {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  status: 'pending' | 'in_progress' | 'completed';
  assignedEmployeeId?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'baker' | 'decorator' | 'manager' | 'delivery';
  hourlyRate: number;
  status: 'active' | 'inactive';
  startDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  taskId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WholesaleAccount {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  discountPercentage: number;
  paymentTerms: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface WholesaleOrder {
  id: string;
  wholesaleAccountId: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'completed';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceListing {
  id: string;
  bakerId: string;
  bakerName: string;
  bio: string;
  category: string;
  rating: number;
  deliveryAvailable: boolean;
  serviceArea?: string;
  products: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  revenueThisMonth: number;
  ordersToday: number;
  pendingOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  completionRate: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
}

export interface PricingCalculation {
  ingredients: PricingIngredient[];
  laborHours: number;
  laborHourlyRate: number;
  packagingCost: number;
  overheadPercentage: number;
  profitMarginPercentage: number;
  totalCost: number;
  suggestedRetailPrice: number;
  profitPerUnit: number;
  actualMargin: number;
}

export interface PricingIngredient {
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
}

export interface PricingResult {
  basePrice: number;
  profitPerUnit: number;
  profitMargin: number;
  costBreakdown: {
    ingredients: number;
    labor: number;
    packaging: number;
    overhead: number;
  };
}
