import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Header } from '@/components/layout/Header'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PricingIngredient {
  id: string
  name: string
  quantity: string
  unit: string
  costPerUnit: string
}

export default function Pricing() {
  const [ingredients, setIngredients] = useState<PricingIngredient[]>([])
  const [laborHours, setLaborHours] = useState('')
  const [laborHourlyRate, setLaborHourlyRate] = useState('25')
  const [packagingCost, setPackagingCost] = useState('')
  const [overheadPercentage, setOverheadPercentage] = useState('15')
  const [profitMarginSlider, setProfitMarginSlider] = useState(40)
  const [quantity, setQuantity] = useState('1')
  const [productName, setProductName] = useState('')

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        id: Math.random().toString(),
        name: '',
        quantity: '',
        unit: '',
        costPerUnit: '',
      },
    ])
  }

  const handleUpdateIngredient = (
    id: string,
    field: keyof PricingIngredient,
    value: string
  ) => {
    setIngredients(
      ingredients.map(ing =>
        ing.id === id ? { ...ing, [field]: value } : ing
      )
    )
  }

  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id))
  }

  // Calculations
  const ingredientsCost = ingredients.reduce((sum, ing) => {
    const cost = (parseFloat(ing.quantity) || 0) * (parseFloat(ing.costPerUnit) || 0)
    return sum + cost
  }, 0)

  const laborCost = (parseFloat(laborHours) || 0) * (parseFloat(laborHourlyRate) || 0)
  const packagingCostValue = parseFloat(packagingCost) || 0

  const subtotal = ingredientsCost + laborCost + packagingCostValue
  const overheadCost = (subtotal * parseFloat(overheadPercentage)) / 100
  const totalCost = subtotal + overheadCost

  const costPerUnit = totalCost / (parseFloat(quantity) || 1)
  const suggestedPrice = costPerUnit / (1 - profitMarginSlider / 100)
  const profitPerUnit = suggestedPrice - costPerUnit
  const actualMargin = (profitPerUnit / suggestedPrice) * 100

  const costBreakdown = [
    { name: 'Ingredients', value: ingredientsCost },
    { name: 'Labor', value: laborCost },
    { name: 'Packaging', value: packagingCostValue },
    { name: 'Overhead', value: overheadCost },
  ].filter(item => item.value > 0)

  const COLORS = ['#F97316', '#F59E0B', '#8B5CF6', '#EC4899']

  const handleSaveProduct = () => {
    if (!productName) {
      toast.error('Please enter a product name')
      return
    }
    toast.success(`Product "${productName}" pricing saved`)
    // In real app, would save to backend
  }

  return (
    <div>
      <Header
        title="Pricing Calculator"
        subtitle="Calculate optimal pricing for your products"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Name */}
          <div className="card p-6">
            <label className="label">Product Name</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., Chocolate Cake"
              className="input"
            />
          </div>

          {/* Ingredients */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Ingredients</h3>
              <button
                onClick={handleAddIngredient}
                className="btn-secondary btn-small flex items-center gap-2"
              >
                <Plus size={16} />
                Add Ingredient
              </button>
            </div>

            {ingredients.length > 0 ? (
              <div className="space-y-3">
                {ingredients.map(ing => (
                  <div key={ing.id} className="p-4 bg-card-hover rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Ingredient name"
                        value={ing.name}
                        onChange={(e) => handleUpdateIngredient(ing.id, 'name', e.target.value)}
                        className="input text-sm"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Qty"
                          value={ing.quantity}
                          onChange={(e) => handleUpdateIngredient(ing.id, 'quantity', e.target.value)}
                          className="input text-sm w-20"
                        />
                        <input
                          type="text"
                          placeholder="Unit"
                          value={ing.unit}
                          onChange={(e) => handleUpdateIngredient(ing.id, 'unit', e.target.value)}
                          className="input text-sm w-16"
                        />
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Cost/unit"
                        value={ing.costPerUnit}
                        onChange={(e) => handleUpdateIngredient(ing.id, 'costPerUnit', e.target.value)}
                        className="input text-sm"
                      />
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          {formatCurrency((parseFloat(ing.quantity) || 0) * (parseFloat(ing.costPerUnit) || 0))}
                        </span>
                        <button
                          onClick={() => handleRemoveIngredient(ing.id)}
                          className="btn-ghost btn-small text-danger"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">No ingredients added</p>
            )}
          </div>

          {/* Labor & Costs */}
          <div className="card p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Labor Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={laborHours}
                  onChange={(e) => setLaborHours(e.target.value)}
                  placeholder="1.5"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Hourly Rate ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={laborHourlyRate}
                  onChange={(e) => setLaborHourlyRate(e.target.value)}
                  placeholder="25"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Packaging Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(e.target.value)}
                  placeholder="2.00"
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Overhead (%)</label>
                <input
                  type="number"
                  step="1"
                  value={overheadPercentage}
                  onChange={(e) => setOverheadPercentage(e.target.value)}
                  placeholder="15"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Quantity (units)</label>
                <input
                  type="number"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="1"
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Profit Margin Slider */}
          <div className="card p-6">
            <div className="mb-4">
              <label className="label">
                Desired Profit Margin: <span className="text-primary font-bold">{profitMarginSlider}%</span>
              </label>
              <input
                type="range"
                min="5"
                max="80"
                value={profitMarginSlider}
                onChange={(e) => setProfitMarginSlider(parseInt(e.target.value))}
                className="w-full h-2 bg-card-hover rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>5%</span>
                <span>40%</span>
                <span>80%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Sidebar */}
        <div className="space-y-6">
          {/* Cost Breakdown */}
          {costBreakdown.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-6">Cost Breakdown</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2 text-sm">
                {costBreakdown.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Summary */}
          <div className="card p-6 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30">
            <h3 className="text-lg font-semibold mb-6">Suggested Price</h3>

            <div className="space-y-4">
              <div className="p-4 bg-background/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Suggested Retail Price</p>
                <p className="text-4xl font-bold text-primary">
                  {formatCurrency(suggestedPrice)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">per unit</p>
              </div>

              <div className="border-t border-primary/30 pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cost per Unit</span>
                  <span className="font-semibold">{formatCurrency(costPerUnit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Profit per Unit</span>
                  <span className="font-semibold text-success">{formatCurrency(profitPerUnit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Actual Margin</span>
                  <span className="font-semibold text-accent">{actualMargin.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveProduct}
              className="w-full btn-primary mt-6"
            >
              Save Product
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
