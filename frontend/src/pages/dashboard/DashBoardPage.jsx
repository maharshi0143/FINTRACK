import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Wallet, TrendingUp, TrendingDown, DollarSign,
  Plus, Receipt,
  Sparkles, Loader2, PieChart as PieChartIcon,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { analyticsService } from '../../services/analyticsService'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import PageTransition from '../../components/common/PageTransition'

/* ── Colour palette for the category pie chart ── */
const PIE_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#f43f5e', // rose
  '#10b981', // emerald
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
]

/* ── Framer Motion shared variants ── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

/* ══════════════════════════════════════════════
   AnimatedNumber  –  smooth counting-up effect
   ══════════════════════════════════════════════ */
function AnimatedNumber({ value, isCurrency = true }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value == null) return

    let rafId
    const startTime = performance.now()
    const from = display
    const duration = 1200

    const step = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + (value - from) * eased)
      if (progress < 1) {
        rafId = requestAnimationFrame(step)
      }
    }

    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
    // We deliberately only restart when `value` changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  if (isCurrency) {
    return <>{formatCurrency(display)}</>
  }
  return <>{Math.round(display).toLocaleString('en-IN')}</>
}

/* ══════════════════════════════════════════════
   GlassTooltip  –  shared chart tooltip
   ══════════════════════════════════════════════ */
function GlassTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-sm text-white/60 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-3 text-sm">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-white/80">{entry.name}:</span>
          <span className="font-semibold text-white">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════
   SectionHeader
   ══════════════════════════════════════════════ */
function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-white/90">{title}</h3>
      {action}
    </div>
  )
}

/* ══════════════════════════════════════════════
   GlassCard wrapper
   ══════════════════════════════════════════════ */
function GlassCard({ children, className = '' }) {
  return (
    <div
      className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 
                  hover:bg-white/[0.07] transition-all duration-300 
                  hover:shadow-lg hover:shadow-white/5 ${className}`}
    >
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   1.  STAT CARDS  (Top Row)
   ═══════════════════════════════════════════════════════════════ */
function StatCard({ icon: Icon, label, value, gradient, isCurrency = true }) {
  return (
    <motion.div
      variants={itemVariants}
      className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 
                 hover:bg-white/[0.07] transition-all duration-300 
                 hover:scale-[1.02] hover:shadow-lg hover:shadow-white/5"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient}`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-sm text-white/50 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white tracking-tight">
        <AnimatedNumber value={value} isCurrency={isCurrency} />
      </p>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   2.  INCOME vs EXPENSE TREND  (BarChart)
   ═══════════════════════════════════════════════════════════════ */
function TrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white/30">
        <TrendingUp className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">No trend data yet</p>
      </div>
    )
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.35} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#e11d48" stopOpacity={0.35} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />

          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
            tickFormatter={(val) => {
              const [, m] = val.split('-')
              const months = [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
              ]
              return months[parseInt(m, 10) - 1] || val
            }}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
            tickFormatter={(val) =>
              val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`
            }
          />

          <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />

          <Bar
            dataKey="income"
            name="Income"
            fill="url(#incomeGrad)"
            radius={[6, 6, 0, 0]}
            maxBarSize={32}
            animationBegin={200}
            animationDuration={1200}
          />
          <Bar
            dataKey="expense"
            name="Expense"
            fill="url(#expenseGrad)"
            radius={[6, 6, 0, 0]}
            maxBarSize={32}
            animationBegin={400}
            animationDuration={1200}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   3.  CATEGORY BREAKDOWN  (Pie / Donut)
   ═══════════════════════════════════════════════════════════════ */
function CategoryPie({ data, totalExpenses }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white/30">
        <PieChartIcon className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">No category data</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {/* Donut chart with centre label */}
      <div className="relative h-56 w-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="total"
              nameKey="category"
              animationBegin={300}
              animationDuration={1200}
            >
              {data.map((_, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={PIE_COLORS[idx % PIE_COLORS.length]}
                  stroke="rgba(0,0,0,0.2)"
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <Tooltip content={<GlassTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-white">
            {formatCurrency(totalExpenses)}
          </span>
          <span className="text-xs text-white/40">Expenses</span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-5 w-full">
        {data.map((entry, idx) => {
          const pct = ((entry.total / (totalExpenses || 1)) * 100).toFixed(1)
          return (
            <div key={entry.category} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
              />
              <span className="text-xs text-white/60 truncate">{entry.category}</span>
              <span className="text-xs text-white/40 ml-auto">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   4.  TOP EXPENSES  (list)
   ═══════════════════════════════════════════════════════════════ */
function TopExpenses({ expenses }) {
  const navigate = useNavigate()

  if (!expenses || expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-white/30">
        <Receipt className="w-10 h-10 mb-2 opacity-40" />
        <p className="text-sm">No expenses yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {expenses.slice(0, 5).map((expense, i) => (
        <motion.div
          key={expense.id ?? i}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06, duration: 0.3 }}
          className="flex items-center justify-between py-3 px-4 rounded-xl
                     hover:bg-white/[0.04] transition-colors duration-200 group"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-white/40">{i + 1}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white/80 truncate">
                {expense.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {expense.category && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-white/40">
                    {expense.category}
                  </span>
                )}
                {expense.date && (
                  <span className="text-[11px] text-white/30">{formatDate(expense.date)}</span>
                )}
              </div>
            </div>
          </div>
          <span className="text-sm font-semibold text-rose-400 flex-shrink-0 ml-4">
            -{formatCurrency(expense.amount)}
          </span>
        </motion.div>
      ))}

      <button
        onClick={() => navigate('/transactions')}
        className="w-full mt-4 py-2.5 text-center text-sm text-white/40 hover:text-white/60
                   bg-white/[0.02] hover:bg-white/[0.04] rounded-xl transition-all duration-200"
      >
        View All Transactions →
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   5.  AI INSIGHT  (sparkle card)
   ═══════════════════════════════════════════════════════════════ */
function AIInsight({ summary, topCategory }) {
  const navigate = useNavigate()

  const hasTransactions = summary && (summary.balance > 0 || summary.income > 0 || summary.expense > 0)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20
                      flex items-center justify-center"
        >
          <Sparkles className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white/80">AI Insight</h4>
          <p className="text-xs text-white/40">Smart analysis</p>
        </div>
      </div>

      {hasTransactions ? (
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <p className="text-sm text-white/60 leading-relaxed">
              {topCategory && summary?.expense > 0 ? (
                <>
                  Your highest spend is in{' '}
                  <span className="text-white/90 font-medium">{topCategory.category}</span>,
                  accounting for{' '}
                  <span className="text-white/90 font-medium">
                    {((topCategory.total / summary.expense) * 100).toFixed(1)}%
                  </span>{' '}
                  of total expenses.
                </>
              ) : (
                <>
                  No expenses recorded yet. Add some transactions to get smart spending
                  breakdowns.
                </>
              )}
            </p>

            <div className="mt-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <p className="text-xs text-emerald-400/80">
                {summary?.expense < summary?.income
                  ? "Tip: You're spending less than you earn. Keep up the great saving habit!"
                  : 'Tip: Review your expense categories to find areas where you can save more.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/ai')}
            className="mt-4 w-full py-2.5 text-center text-sm text-white/60 hover:text-white/80
                       bg-white/[0.04] hover:bg-white/[0.08] rounded-xl transition-all duration-200
                       border border-white/5"
          >
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              Get Detailed Analysis
            </span>
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <Sparkles className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm text-center">Add transactions to unlock AI-powered insights</p>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SKELETON LOADER
   ═══════════════════════════════════════════════════════════════ */
function PageSkeleton() {
  const shimmer = 'bg-white/10 rounded-lg'
  const glass = 'backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6'

  return (
    <div className="space-y-8 animate-pulse">
      {/* title */}
      <div className={`h-8 w-48 ${shimmer}`} />
      <div className={`h-4 w-72 bg-white/5 rounded-lg`} />

      {/* stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={glass}>
            <div className={`h-4 w-20 ${shimmer} mb-4`} />
            <div className={`h-8 w-32 ${shimmer}`} />
          </div>
        ))}
      </div>

      {/* charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className={`xl:col-span-2 ${glass}`}>
          <div className={`h-5 w-40 ${shimmer} mb-6`} />
          <div className="h-64 bg-white/[0.03] rounded-xl" />
        </div>
        <div className={glass}>
          <div className={`h-5 w-48 ${shimmer} mb-6`} />
          <div className="h-56 w-56 mx-auto bg-white/[0.03] rounded-full" />
        </div>
      </div>

      {/* bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className={`xl:col-span-2 ${glass}`}>
          <div className={`h-5 w-32 ${shimmer} mb-6`} />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <div className={`h-4 w-40 ${shimmer}`} />
                <div className="h-3 w-24 bg-white/5 rounded-lg mt-1" />
              </div>
              <div className={`h-4 w-20 ${shimmer}`} />
            </div>
          ))}
        </div>
        <div className={glass}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white/10 rounded-xl" />
            <div>
              <div className={`h-4 w-24 ${shimmer}`} />
              <div className="h-3 w-16 bg-white/5 rounded-lg mt-1" />
            </div>
          </div>
          <div className={`h-4 w-full ${shimmer} mb-3`} />
          <div className="h-4 w-3/4 bg-white/5 rounded-lg mb-6" />
          <div className="h-10 w-full bg-white/10 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════════════ */
function EmptyState() {
  const navigate = useNavigate()
  return (
    <motion.div
      variants={itemVariants}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center"
    >
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
        <Wallet className="w-10 h-10 text-white/30" />
      </div>
      <h3 className="text-xl font-semibold text-white/80 mb-2">No transactions yet</h3>
      <p className="text-white/40 mb-8 max-w-md mx-auto leading-relaxed">
        Start tracking your finances by adding your first transaction.
        Your dashboard will come to life with charts, insights, and smart
        breakdowns.
      </p>
      <button
        onClick={() => navigate('/transactions')}
        className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15
                   border border-white/10 rounded-xl text-white/80 transition-all duration-200
                   hover:shadow-lg hover:shadow-white/5"
      >
        <Plus className="w-4 h-4" />
        <span>Add Transaction</span>
      </button>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ERROR STATE
   ═══════════════════════════════════════════════════════════════ */
function ErrorState({ message, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 flex items-center justify-center">
        <TrendingDown className="w-8 h-8 text-rose-400" />
      </div>
      <h3 className="text-xl font-semibold text-white/80 mb-2">Failed to load dashboard</h3>
      <p className="text-white/40 mb-8 max-w-md mx-auto">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15
                   border border-white/10 rounded-xl text-white/80 transition-all duration-200"
      >
        <Loader2 className="w-4 h-4" />
        <span>Try Again</span>
      </button>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function DashBoardPage() {
  const navigate = useNavigate()

  /* ---- local state ---- */
  const [summary, setSummary] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [category, setCategory] = useState([])
  const [topExpenses, setTopExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /* ---- data fetching ---- */
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: res } = await analyticsService.getDashboard()
      const data = res.data

      setSummary(data.summary)
      setMonthly(data.monthly)
      setCategory(data.category)
      setTopExpenses(data.topExpenses)
    } catch (err) {
      setError('Unable to load dashboard data. Please check your connection and try again.')
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /* ---- Auto-refresh via socket events ---- */
  useAutoRefresh(fetchData, [
    'transactionCreated',
    'transactionUpdated',
    'transactionDeleted',
    'budgetCreated',
    'budgetUpdated',
    'budgetDeleted',
  ])

  /* ---- derived values ---- */
  const topCategory = useMemo(() => {
    if (!category || category.length === 0) return null
    return category.reduce((max, c) => (c.total > max.total ? c : max), category[0])
  }, [category])

  const hasData = useMemo(() => {
    if (!summary) return false
    return summary.balance > 0 || summary.income > 0 || summary.expense > 0 || topExpenses.length > 0
  }, [summary, topExpenses])

  const transactionCount = useMemo(() => {
    if (summary?.transactionCount != null) return summary.transactionCount
    // fallback: treat total topExpenses as a rough indicator
    return topExpenses.length
  }, [summary, topExpenses])

  /* ================================================================
     RENDER: Loading
     ================================================================ */
  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-8">
          <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
          <PageSkeleton />
        </div>
      </PageTransition>
    )
  }

  /* ================================================================
     RENDER: Error (all endpoints failed)
     ================================================================ */
  if (error) {
    return (
      <PageTransition>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-white/40 mt-1">Your financial overview</p>
          </div>
          <ErrorState message={error} onRetry={fetchData} />
        </div>
      </PageTransition>
    )
  }

  /* ================================================================
     RENDER: Empty (no transactions exist)
     ================================================================ */
  if (!hasData) {
    return (
      <PageTransition>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <motion.div variants={itemVariants}>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-white/40 mt-1">Your financial overview</p>
          </motion.div>
          <EmptyState />
        </motion.div>
      </PageTransition>
    )
  }

  /* ================================================================
     RENDER: Full Dashboard
     ================================================================ */
  return (
    <PageTransition>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
      {/* ---- Header ---- */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-white/40 mt-1">Your financial overview</p>
      </motion.div>

      {/* ---- 1. Stats Row ---- */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6"
      >
        <StatCard
          icon={DollarSign}
          label="Total Balance"
          value={summary?.balance ?? 0}
          gradient="from-emerald-500/40 to-emerald-600/20"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Income"
          value={summary?.income ?? 0}
          gradient="from-blue-500/40 to-violet-600/20"
        />
        <StatCard
          icon={TrendingDown}
          label="Total Expenses"
          value={summary?.expense ?? 0}
          gradient="from-rose-500/40 to-pink-600/20"
        />
        <StatCard
          icon={Receipt}
          label="Transactions"
          value={transactionCount}
          isCurrency={false}
          gradient="from-violet-500/40 to-purple-600/20"
        />
      </motion.div>

      {/* ---- 2. Charts Row ---- */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6"
      >
        {/* Income vs Expense Trend */}
        <GlassCard className="xl:col-span-2">
          <SectionHeader title="Income vs Expense" />
          <TrendChart data={monthly} />
        </GlassCard>

        {/* Category Breakdown */}
        <GlassCard>
          <SectionHeader title="Expense Breakdown" />
          <CategoryPie data={category} totalExpenses={summary?.expense ?? 0} />
        </GlassCard>
      </motion.div>

      {/* ---- 3. Bottom Row ---- */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6"
      >
        {/* Top Expenses */}
        <GlassCard className="xl:col-span-2">
          <SectionHeader
            title="Top Expenses"
            action={
              <button
                onClick={() => navigate('/transactions')}
                className="text-xs text-white/40 hover:text-white/60 transition-colors 
                           px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg"
              >
                View All
              </button>
            }
          />
          <TopExpenses expenses={topExpenses} />
        </GlassCard>

        {/* AI Insight */}
        <GlassCard>
          <AIInsight summary={summary} topCategory={topCategory} />
        </GlassCard>
      </motion.div>
      </motion.div>
    </PageTransition>
  )
}

export default DashBoardPage
