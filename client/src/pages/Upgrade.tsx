import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { api, handleApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { PricingPlan, Tier, UserUsage } from '@/types'

const TIER_COLORS: Record<string, string> = {
  hobby: '#6B7280',
  growing: '#F59E0B',
  pro: '#F97316',
  enterprise: '#DC2626',
}

const TIER_DISPLAY_NAMES: Record<string, string> = {
  hobby: 'Free',
  growing: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

const TIER_ORDER: Tier[] = ['hobby', 'growing', 'pro', 'enterprise']

export default function Upgrade() {
  const { user, setUser } = useAuthStore()
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [usage, setUsage] = useState<UserUsage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState<Tier | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansData, usageData] = await Promise.all([
          api.get('/tier/plans'),
          api.get('/usage/current'),
        ])
        setPlans(plansData)
        setUsage(usageData)
      } catch (error) {
        handleApiError(error, 'Failed to load pricing plans')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleUpgrade = async (tier: Tier) => {
    if (!user) return

    // Prevent downgrade
    const currentTierIndex = TIER_ORDER.indexOf(user.tier as Tier)
    const newTierIndex = TIER_ORDER.indexOf(tier)

    if (newTierIndex < currentTierIndex) {
      toast.error('Downgrades are not allowed')
      return
    }

    setIsUpgrading(tier)
    try {
      const response = await api.post('/tier/upgrade', { tier })

      // Update user tier
      const updatedUser = { ...user, tier }
      setUser(updatedUser)

      toast.success(`Successfully upgraded to ${TIER_DISPLAY_NAMES[tier]} plan!`)
    } catch (error) {
      handleApiError(error, 'Failed to upgrade plan')
    } finally {
      setIsUpgrading(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card p-6 lg:p-12">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12 text-center">
        <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-foreground">
          Choose Your Plan
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Scale your bakery with the right tools. Start free and upgrade anytime.
        </p>
      </div>

      {/* Usage stats for hobby tier */}
      {user?.tier === 'hobby' && usage && (
        <div className="max-w-7xl mx-auto mb-8 bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Your Current Usage</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Orders</label>
                <span className="text-xs text-muted-foreground">{usage.ordersCount}/20</span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((usage.ordersCount / 20) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Products</label>
                <span className="text-xs text-muted-foreground">{usage.productsCount}/5</span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((usage.productsCount / 5) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Customers</label>
                <span className="text-xs text-muted-foreground">{usage.customersCount}/10</span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((usage.customersCount / 10) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing cards */}
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = user?.tier === plan.tier
            const currentTierIndex = TIER_ORDER.indexOf(user?.tier as Tier)
            const planTierIndex = TIER_ORDER.indexOf(plan.tier)
            const isUpgrade = planTierIndex > currentTierIndex
            const isDowngrade = planTierIndex < currentTierIndex
            const isPopular = plan.tier === 'pro'

            return (
              <div
                key={plan.tier}
                className={`relative rounded-lg border transition-all ${
                  isCurrentPlan
                    ? 'border-primary shadow-lg'
                    : 'border-border hover:border-primary/50'
                } overflow-hidden bg-card`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute top-0 left-0 right-0 bg-primary text-background py-2 text-center text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                {/* Current badge */}
                {isCurrentPlan && (
                  <div className="absolute top-0 right-0 bg-primary text-background px-4 py-1 text-xs font-bold rounded-bl-lg">
                    Current Plan
                  </div>
                )}

                <div className={`p-6 ${isPopular ? 'pt-16' : ''}`}>
                  {/* Tier name and color indicator */}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: TIER_COLORS[plan.tier] }}
                    />
                    <h3 className="text-2xl font-bold text-foreground">
                      {TIER_DISPLAY_NAMES[plan.tier]}
                    </h3>
                  </div>

                  {/* Price */}
                  <div className="mb-2">
                    {plan.price === 0 ? (
                      <p className="text-3xl font-bold text-foreground">Free</p>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-foreground">
                          ${plan.price}
                        </span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-6 h-10">
                    {plan.description}
                  </p>

                  {/* Button */}
                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full py-2 px-4 rounded-lg font-medium mb-6 bg-primary/10 text-primary cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : isDowngrade ? (
                    <button
                      disabled
                      className="w-full py-2 px-4 rounded-lg font-medium mb-6 bg-border text-muted-foreground cursor-not-allowed opacity-50"
                    >
                      Downgrade
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.tier)}
                      disabled={isUpgrading === plan.tier}
                      className="w-full py-2 px-4 rounded-lg font-medium mb-6 bg-primary text-background hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isUpgrading === plan.tier ? 'Upgrading...' : 'Upgrade Now'}
                    </button>
                  )}

                  {/* Limits */}
                  {plan.limits && (
                    <div className="mb-6 pb-6 border-b border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Limits
                      </p>
                      <ul className="space-y-2 text-sm">
                        {plan.limits.orders !== undefined && (
                          <li className="flex items-center gap-2 text-foreground">
                            <span className="text-xs">
                              {plan.limits.orders === -1 ? '∞' : plan.limits.orders}
                            </span>
                            <span>Orders/month</span>
                          </li>
                        )}
                        {plan.limits.products !== undefined && (
                          <li className="flex items-center gap-2 text-foreground">
                            <span className="text-xs">
                              {plan.limits.products === -1 ? '∞' : plan.limits.products}
                            </span>
                            <span>Products</span>
                          </li>
                        )}
                        {plan.limits.customers !== undefined && (
                          <li className="flex items-center gap-2 text-foreground">
                            <span className="text-xs">
                              {plan.limits.customers === -1 ? '∞' : plan.limits.customers}
                            </span>
                            <span>Customers</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Features */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Features
                    </p>
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check
                            size={18}
                            className="text-primary flex-shrink-0 mt-0.5"
                          />
                          <span className="text-sm text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* FAQ or CTA section */}
      <div className="max-w-7xl mx-auto mt-12 text-center">
        <p className="text-muted-foreground">
          All plans include a 7-day free trial. No credit card required.
        </p>
      </div>
    </div>
  )
}
