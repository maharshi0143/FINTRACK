import { useState, useEffect, useMemo, useCallback } from 'react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
  AreaChart,
  Area,
} from 'recharts'
import { analyticsService } from '../../services/analyticsService'
import { formatCurrency, formatDate, formatMonthYear } from '../../utils/formatters'

/* ───────── Glass card wrapper ───────── */
function GlassCard({ className = '', children, ...props }) {
  return (
    <div
      className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

/* ───────── Animation variants ───────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 18 },
  },
}

/* ───────── Recharts custom tooltip ───────── */
function CustomChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="backdrop-blur-xl bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-white/50 mb-1.5">
        {label || ''}
      </p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 text-sm">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-white/70">{entry.name}:</span>
          <span className="text-white font-semibold">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ───────── Pie chart colours ───────── */
const PIE_COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#14b8a6',
  '#6366f1',
]

/* ───────── Loading skeleton parts ───────── */
function SummarySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <GlassCard key={i} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
            <div className="w-9 h-9 rounded-xl bg-white/5 animate-pulse" />
          </div>
          <div className="h-8 w-28 bg-white/5 rounded animate-pulse" />
        </GlassCard>
      ))}
    </div>
  )
}

function ChartSkeleton({ className = '' }) {
  return (
    <GlassCard className={`p-5 ${className}`}>
      <div className="h-5 w-40 bg-white/5 rounded animate-pulse mb-4" />
      <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
    </GlassCard>
  )
}

function ListSkeleton() {
  return (
    <GlassCard className="p-5">
      <div className="h-5 w-32 bg-white/5 rounded animate-pulse mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-white/5 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 bg-white/5 rounded animate-pulse" />
                <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-4 w-20 bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

/* ──────────── Main Page ──────────── */
export default function AnalyticsPage() {
  /* ---- state ---- */
  const [summary, setSummary] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [topExpenses, setTopExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)

  /* ---- fetch ---- */
  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setLoading(true)
        const { data: res } = await analyticsService.getDashboard()
        if (cancelled) return
        const data = res.data
        setSummary(data.summary)
        setMonthly(data.monthly)
        setCategoryData(data.category)
        setTopExpenses(data.topExpenses)
      } catch (err) {
        if (cancelled) return
        const msg =
          err?.response?.data?.message || 'Failed to load analytics'
        toast.error(msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [])

  /* ---- derived values ---- */
  const netSavings = useMemo(() => {
    if (!summary) return 0
    return Number(summary.income || 0) - Number(summary.expense || 0)
  }, [summary])

  const isPositiveNet = netSavings >= 0

  /* ---- process monthly for chart ---- */
  const monthlyChartData = useMemo(
    () =>
      monthly.map((m) => ({
        ...m,
        // Format month label for display
        monthLabel: formatMonthLabel(m.month),
      })),
    [monthly],
  )

  /* ---- pie chart handlers ---- */
  const handlePieClick = useCallback((entry) => {
    setSelectedCategory((prev) =>
      prev?.category === entry.category ? null : entry,
    )
  }, [])

  /* ---- empty state ---- */
  const hasAnyData =
    summary ||
    monthly.length > 0 ||
    categoryData.length > 0 ||
    topExpenses.length > 0

  /* ──────────── Render ──────────── */
  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-violet-500/10 flex items-center justify-center">
            <PieChartIcon className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-sm text-white/50">
              Visual insights into your financial activity
            </p>
          </div>
        </div>

        <GlassCard className="px-4 py-2 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-white/40" />
          <span className="text-sm text-white/60">
            {new Date().getFullYear()}
          </span>
        </GlassCard>
      </motion.div>

      {/* ── Loading ── */}
      {loading && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <SummarySkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ListSkeleton />
            <ChartSkeleton />
          </div>
        </motion.div>
      )}

      {/* ── Empty ── */}
      {!loading && !hasAnyData && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="pt-12"
        >
          <GlassCard className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <PieChartIcon className="w-8 h-8 text-white/30" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No analytics data yet
            </h3>
            <p className="text-sm text-white/50 max-w-sm mx-auto mb-6">
              Start adding transactions to see your spending patterns,
              trends, and financial insights come to life.
            </p>
          </GlassCard>
        </motion.div>
      )}

      {/* ── Content ── */}
      {!loading && hasAnyData && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* ── Summary Cards ── */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {/* Income */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/50">Total Income</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-400 truncate">
                {formatCurrency(summary?.income || 0)}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-emerald-500/70">
                <ArrowUpRight className="w-3 h-3" />
                <span>Incoming funds</span>
              </div>
            </GlassCard>

            {/* Expenses */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/50">Total Expenses</span>
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-rose-400 truncate">
                {formatCurrency(summary?.expense || 0)}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-rose-500/70">
                <ArrowDownRight className="w-3 h-3" />
                <span>Money spent</span>
              </div>
            </GlassCard>

            {/* Net Savings */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/50">Net Savings</span>
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isPositiveNet
                      ? 'bg-violet-500/10'
                      : 'bg-red-500/10'
                  }`}
                >
                  <DollarSign
                    className={`w-4 h-4 ${
                      isPositiveNet ? 'text-violet-400' : 'text-red-400'
                    }`}
                  />
                </div>
              </div>
              <p
                className={`text-2xl font-bold truncate ${
                  isPositiveNet ? 'text-violet-400' : 'text-red-400'
                }`}
              >
                {isPositiveNet ? '' : '-'}
                {formatCurrency(Math.abs(netSavings))}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs">
                {isPositiveNet ? (
                  <>
                    <ArrowUpRight className="w-3 h-3 text-violet-500/70" />
                    <span className="text-violet-500/70">Positive balance</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-3 h-3 text-red-500/70" />
                    <span className="text-red-500/70">Negative balance</span>
                  </>
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* ── Charts Row 1 ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income vs Expense Bar Chart */}
            <motion.div variants={itemVariants} className="h-full">
              <GlassCard className="p-5 h-full">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <h2 className="text-base font-semibold text-white">
                    Income vs Expenses
                  </h2>
                </div>

                {monthlyChartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-sm text-white/40">
                      No monthly data available
                    </p>
                  </div>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyChartData}
                        barGap={4}
                        margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="analyticsIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.85} />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.35} />
                          </linearGradient>
                          <linearGradient id="analyticsExpenseGrad" x1="0" y1="0" x2="0" y2="1">
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
                          dataKey="monthLabel"
                          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                          axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) =>
                            v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
                          }
                        />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Bar
                          dataKey="income"
                          name="Income"
                          fill="url(#analyticsIncomeGrad)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={36}
                          animationBegin={200}
                          animationDuration={1200}
                        />
                        <Bar
                          dataKey="expense"
                          name="Expense"
                          fill="url(#analyticsExpenseGrad)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={36}
                          animationBegin={400}
                          animationDuration={1200}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </GlassCard>
            </motion.div>

            {/* Category Distribution Pie Chart */}
            <motion.div variants={itemVariants} className="h-full">
              <GlassCard className="p-5 h-full">
                <div className="flex items-center gap-2 mb-5">
                  <PieChartIcon className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-semibold text-white">
                    Spending by Category
                  </h2>
                </div>

                {categoryData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-sm text-white/40">
                      No category data available
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="relative h-56 w-56 mx-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            dataKey="total"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={3}
                            stroke="none"
                            onClick={handlePieClick}
                            cursor="pointer"
                            animationBegin={300}
                            animationDuration={1200}
                            activeIndex={
                              selectedCategory
                                ? (() => {
                                    const idx = categoryData.findIndex(
                                      (d) => d.category === selectedCategory.category,
                                    )
                                    return idx >= 0 ? idx : undefined
                                  })()
                                : undefined
                            }
                            activeShape={(props) => {
                              const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
                              return (
                                <g>
                                  <Sector
                                    cx={cx}
                                    cy={cy}
                                    innerRadius={innerRadius}
                                    outerRadius={outerRadius + 6}
                                    startAngle={startAngle}
                                    endAngle={endAngle}
                                    fill={fill}
                                    opacity={0.9}
                                  />
                                </g>
                              )
                            }}
                          >
                            {categoryData.map((entry, idx) => (
                              <Cell
                                key={entry.category}
                                fill={PIE_COLORS[idx % PIE_COLORS.length]}
                                opacity={
                                  selectedCategory &&
                                  selectedCategory.category !== entry.category
                                    ? 0.35
                                    : 0.85
                                }
                                stroke="rgba(0,0,0,0.2)"
                                strokeWidth={1}
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>

                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-white">
                          {formatCurrency(
                            categoryData.reduce(
                              (sum, c) => sum + Number(c.total || 0),
                              0,
                            ),
                          )}
                        </span>
                        <span className="text-xs text-white/40">Expenses</span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="w-full mt-5 grid grid-cols-2 gap-x-6 gap-y-2">
                      {categoryData.map((entry, idx) => {
                        const total = categoryData.reduce((s, c) => s + Number(c.total || 0), 0)
                        const pct = ((Number(entry.total) / (total || 1)) * 100).toFixed(1)
                        return (
                          <button
                            key={entry.category}
                            onClick={() => handlePieClick(entry)}
                            className={`flex items-center gap-2 text-left transition-opacity ${
                              selectedCategory &&
                              selectedCategory.category !== entry.category
                                ? 'opacity-40'
                                : 'opacity-90'
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor:
                                  PIE_COLORS[idx % PIE_COLORS.length],
                              }}
                            />
                            <span className="text-xs text-white/70 truncate">
                              {entry.category}
                            </span>
                            <span className="text-xs text-white/40 ml-auto">{pct}%</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </div>

          {/* ── Charts Row 2 ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Expenses */}
            <motion.div variants={itemVariants} className="h-full">
              <GlassCard className="p-5 h-full">
                <div className="flex items-center gap-2 mb-5">
                  <ArrowDownRight className="w-5 h-5 text-rose-400" />
                  <h2 className="text-base font-semibold text-white">
                    Top Expenses
                  </h2>
                </div>

                {topExpenses.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-sm text-white/40">
                      No expense data available
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topExpenses.slice(0, 5).map((expense, idx) => (
                      <div
                        key={`${expense.title}-${idx}`}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Rank badge */}
                          <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-xs font-semibold text-white/40 flex-shrink-0">
                            {idx + 1}
                          </span>

                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {expense.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-white/50 font-medium truncate max-w-[160px]">
                                {expense.category}
                              </span>
                              <span className="text-[11px] text-white/40 whitespace-nowrap">
                                {expense.date
                                  ? formatDate(expense.date)
                                  : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className="text-sm font-semibold text-rose-400 flex-shrink-0 ml-3">
                          {formatCurrency(expense.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>

            {/* Monthly Trend Area Chart */}
            <motion.div variants={itemVariants} className="h-full">
              <GlassCard className="p-5 h-full">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingDown className="w-5 h-5 text-rose-400" />
                  <h2 className="text-base font-semibold text-white">
                    Expense Trend
                  </h2>
                </div>

                {monthlyChartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-sm text-white/40">
                      No trend data available
                    </p>
                  </div>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={monthlyChartData}
                        margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="trendExpenseGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#f43f5e"
                              stopOpacity={0.35}
                            />
                            <stop
                              offset="100%"
                              stopColor="#f43f5e"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="monthLabel"
                          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                          axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) =>
                            v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
                          }
                        />
                        <Tooltip content={<CustomChartTooltip />} contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} />
                        <Area
                          type="monotone"
                          dataKey="expense"
                          name="Expenses"
                          stroke="#f43f5e"
                          strokeWidth={2}
                          fill="url(#trendExpenseGrad)"
                          dot={{ r: 3, fill: '#f43f5e', stroke: '#18181b', strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: '#f43f5e', stroke: '#18181b', strokeWidth: 2 }}
                          animationBegin={200}
                          animationDuration={1200}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

/* ──────────── Helper ──────────── */
/**
 * Convert "YYYY-MM" to a short readable label like "Jan", "Feb", etc.
 */
function formatMonthLabel(monthStr) {
  if (!monthStr) return ''
  const parts = monthStr.split('-')
  if (parts.length < 2) return monthStr
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, 1)
  if (Number.isNaN(date.getTime())) return monthStr
  return date.toLocaleDateString('en-GB', { month: 'short' })
}
