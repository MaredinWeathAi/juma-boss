import { useEffect, useState } from 'react'
import { api, handleApiError } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { Clock, ZapOff } from 'lucide-react'
import type { ProductionTask, Employee } from '@/types'

export default function Production() {
  const [tasks, setTasks] = useState<ProductionTask[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, employeesRes] = await Promise.all([
          api.get(`/production?date=${selectedDate}`),
          api.get('/employees'),
        ])
        setTasks(tasksRes.data || [])
        setEmployees(employeesRes.data || [])
      } catch (error) {
        handleApiError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [selectedDate])

  const handleStatusUpdate = async (taskId: string, newStatus: ProductionTask['status']) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      const response = await api.put(`/production/${taskId}`, {
        ...task,
        status: newStatus,
      })

      setTasks(tasks.map(t => t.id === taskId ? response.data : t))
      toast.success('Task status updated')
    } catch (error) {
      handleApiError(error)
    }
  }

  const handleAssignEmployee = async (taskId: string, employeeId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      const response = await api.put(`/production/${taskId}`, {
        ...task,
        assignedEmployeeId: employeeId,
      })

      setTasks(tasks.map(t => t.id === taskId ? response.data : t))
      toast.success('Employee assigned')
    } catch (error) {
      handleApiError(error)
    }
  }

  const handleGenerateFromOrders = async () => {
    try {
      const response = await api.post('/production/generate', { date: selectedDate })
      setTasks(response.data || [])
      toast.success('Production tasks generated from orders')
    } catch (error) {
      handleApiError(error)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  const groupedByOrder = tasks.reduce((acc, task) => {
    if (!acc[task.orderId]) {
      acc[task.orderId] = []
    }
    acc[task.orderId].push(task)
    return acc
  }, {} as Record<string, ProductionTask[]>)

  const statusOrder = { pending: 0, in_progress: 1, completed: 2 }
  const sortedOrders = Object.entries(groupedByOrder).sort(
    (a, b) => statusOrder[a[1][0]?.status as keyof typeof statusOrder] -
      statusOrder[b[1][0]?.status as keyof typeof statusOrder]
  )

  return (
    <div>
      <Header
        title="Production Schedule"
        subtitle={`${tasks.length} task${tasks.length !== 1 ? 's' : ''} for ${formatDate(selectedDate)}`}
        actions={
          <button
            onClick={handleGenerateFromOrders}
            className="btn-primary flex items-center gap-2"
          >
            <ZapOff size={18} />
            Generate from Orders
          </button>
        }
      />

      {/* Date Selector */}
      <div className="card p-6 mb-6">
        <label className="label">Production Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input max-w-xs"
        />
      </div>

      {/* Production Tasks */}
      {sortedOrders.length > 0 ? (
        <div className="space-y-6">
          {sortedOrders.map(([orderId, orderTasks]) => (
            <div key={orderId} className="card p-6">
              <div className="mb-6 pb-4 border-b border-border">
                <h3 className="text-lg font-semibold">Order {orderId.slice(0, 8)}</h3>
                <p className="text-sm text-muted-foreground">
                  {orderTasks.length} item{orderTasks.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="space-y-4">
                {orderTasks.map(task => {
                  const assignedEmployee = employees.find(e => e.id === task.assignedEmployeeId)

                  return (
                    <div key={task.id} className="p-4 bg-card-hover rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Product */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Product</p>
                          <p className="font-medium">Product {task.productId.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">Qty: {task.quantity}</p>
                        </div>

                        {/* Status */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Status</p>
                          <div className="flex gap-2">
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusUpdate(task.id, e.target.value as ProductionTask['status'])}
                              className="input text-sm"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                        </div>

                        {/* Employee */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Assign To</p>
                          <select
                            value={task.assignedEmployeeId || ''}
                            onChange={(e) => handleAssignEmployee(task.id, e.target.value)}
                            className="input text-sm"
                          >
                            <option value="">Unassigned</option>
                            {employees.map(emp => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Time */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Time</p>
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {task.startTime ? task.startTime.substring(0, 5) : '-'}
                              {task.endTime && ` - ${task.endTime.substring(0, 5)}`}
                            </span>
                          </div>
                        </div>

                        {/* Due Date */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                          <p className="font-medium text-sm">{formatDate(task.dueDate)}</p>
                        </div>
                      </div>

                      {task.notes && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm">{task.notes}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Clock size={48} className="mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-lg font-semibold mb-2">No tasks scheduled</p>
          <p className="text-muted-foreground mb-6">Generate tasks from orders to get started.</p>
          <button
            onClick={handleGenerateFromOrders}
            className="btn-primary"
          >
            Generate Tasks
          </button>
        </div>
      )}
    </div>
  )
}
