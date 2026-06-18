import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet,
  Plus,
  Target,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { budgetService } from '../../services/budgetService'
import { categoryService } from '../../services/categoryService'
import { formatCurrency } from '../../utils/formatters'

/* ───────── Glass card wrapper ───────── */
function GlassCard({ className = '', children, ...props }) {
  return (
    <div
      className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl ${className}`}
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
    transition: { staggerChildren: 0.08 },
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

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  exit: { opacity: 0, scale: 0.95, y: 30, transition: { duration: 0.15 } },
}

/* ───────── Progress bar colour helpers ───────── */
function progressColor(pct) {
  if (pct > 100) return 'bg-red-500'
  if (pct >= 85) return 'bg-orange-500'
  if (pct >= 60) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function progressTextColor(pct) {
  if (pct > 100) return 'text-red-400'
  if (pct >= 85) return 'text-orange-400'
  if (pct >= 60) return 'text-amber-400'
  return 'text-emerald-400'
}

function progressBgColor(pct) {
  if (pct > 100) return 'bg-red-500/10'
  if (pct >= 85) return 'bg-orange-500/10'
  if (pct >= 60) return 'bg-amber-500/10'
  return 'bg-emerald-500/10'
}

/* ───────── Category helpers ───────── */
function getCategoryMeta(categories, name) {
  return categories.find(
    (c) => c.name.toLowerCase() === (name || '').toLowerCase(),
  )
}

/* ────────── Loading skeleton ────────── */
function SkeletonRow() {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/4 bg-white/5 rounded animate-pulse" />
          <div className="h-3 w-1/3 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="h-8 w-24 bg-white/5 rounded-full animate-pulse" />
      </div>
      <div className="mt-4 h-2 bg-white/5 rounded-full animate-pulse" />
      <div className="mt-3 flex justify-between">
        <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
        <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
      </div>
    </GlassCard>
  )
}

/* ─── Budget Modal (create / edit) ──── */
function BudgetModal({ open, onClose, onSubmit, editingBudget, categories }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { category: '', monthly_limit: '' },
  })

  useEffect(() => {
    if (open) {
      if (editingBudget) {
        reset({
          category: editingBudget.category || '',
          monthly_limit: editingBudget.monthly_limit ?? '',
        })
      } else {
        reset({ category: '', monthly_limit: '' })
      }
    }
  }, [open, editingBudget, reset])

  const expenseCategories = categories.filter(
    (c) => c.type === 'expense' || !c.type,
  )

  const onFormSubmit = useCallback(
    async (data) => {
      await onSubmit({
        category: data.category,
        monthly_limit: Number(data.monthly_limit),
      })
    },
    [onSubmit],
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            className="relative w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-white font-heading">
                  {editingBudget ? 'Edit Budget' : 'Create Budget'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">
                  Category
                </label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none"
                >
                  <option value="" className="bg-zinc-900">
                    Select a category
                  </option>
                  {expenseCategories.map((cat) => (
                    <option
                      key={cat.id}
                      value={cat.name}
                      className="bg-zinc-900"
                    >
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.category.message}
                  </p>
                )}
              </div>

              {/* Monthly Limit */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">
                  Monthly Limit
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register('monthly_limit', {
                      required: 'Monthly limit is required',
                      min: { value: 1, message: 'Must be greater than 0' },
                      valueAsNumber: true,
                    })}
                    className="w-full pl-8 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>
                {errors.monthly_limit && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.monthly_limit.message}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {editingBudget ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── Delete confirmation ── */
function DeleteConfirm({ budget, onClose, onConfirm, loading }) {
  return (
    <AnimatePresence>
      {budget && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            variants={modalVariants}
            className="relative w-full max-w-sm backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2 font-heading">
              Delete Budget
            </h2>
            <p className="text-sm text-white/60 mb-6">
              Are you sure you want to delete the budget for{' '}
              <span className="text-white font-medium">{budget.category}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ──────────── Main Page ──────────── */
export default function BudgetsPage() {
  /* ---- state ---- */
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [deletingBudget, setDeletingBudget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  /* ---- fetch ---- */
  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setLoading(true)
        const [progressRes, catRes] = await Promise.all([
          budgetService.getProgress(),
          categoryService.getAll(),
        ])
        if (cancelled) return
        setBudgets(progressRes.data.data ?? progressRes.data)
        setCategories(catRes.data.data ?? catRes.data)
      } catch (err) {
        if (cancelled) return
        const msg =
          err?.response?.data?.message || 'Failed to load budgets'
        toast.error(msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [])

  /* ---- derived summary ---- */
  const summary = budgets.reduce(
    (acc, b) => ({
      budgeted: acc.budgeted + Number(b.monthly_limit || 0),
      spent: acc.spent + Number(b.spent || 0),
      remaining: acc.remaining + Number(b.remaining || 0),
    }),
    { budgeted: 0, spent: 0, remaining: 0 },
  )

  /* ---- create / update ---- */
  const handleSubmitBudget = useCallback(
    async (data) => {
      try {
        setSubmitLoading(true)
        if (editingBudget) {
          await budgetService.update(editingBudget.id, data)
          toast.success('Budget updated successfully')
        } else {
          await budgetService.create(data)
          toast.success('Budget created successfully')
        }
        setShowModal(false)
        setEditingBudget(null)

        // Refresh
        const progressRes = await budgetService.getProgress()
        setBudgets(progressRes.data.data ?? progressRes.data)
      } catch (err) {
        const msg =
          err?.response?.data?.message || 'Something went wrong'
        toast.error(msg)
      } finally {
        setSubmitLoading(false)
      }
    },
    [editingBudget],
  )

  /* ---- delete ---- */
  const handleDelete = useCallback(async () => {
    if (!deletingBudget) return
    try {
      setDeleteLoading(true)
      await budgetService.delete(deletingBudget.id)
      toast.success('Budget deleted successfully')
      setDeletingBudget(null)

      const progressRes = await budgetService.getProgress()
        setBudgets(progressRes.data.data ?? progressRes.data)
      } catch (err) {
        const msg =
          err?.response?.data?.message || 'Failed to delete budget'
        toast.error(msg)
      } finally {
        setDeleteLoading(false)
    }
  }, [deletingBudget])

  /* ---- modal openers ---- */
  const openCreate = useCallback(() => {
    setEditingBudget(null)
    setShowModal(true)
  }, [])

  const openEdit = useCallback((budget) => {
    setEditingBudget(budget)
    setShowModal(true)
  }, [])

  /* ──────────── Render ──────────── */
  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <motion.div
        className="flex items-center justify-between flex-wrap gap-3"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-heading">Budgets</h1>
            <p className="text-sm text-white/50">
              Track and manage your spending limits
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openCreate}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          Create Budget
        </motion.button>
      </motion.div>

      {/* ── Summary Cards ── */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Total Budgeted */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white/50">Total Budgeted</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-400">
            {formatCurrency(summary.budgeted)}
          </p>
        </GlassCard>

        {/* Total Spent */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white/50">Total Spent</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-400">
            {formatCurrency(summary.spent)}
          </p>
        </GlassCard>

        {/* Total Remaining */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white/50">Total Remaining</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {formatCurrency(summary.remaining)}
          </p>
        </GlassCard>
      </motion.div>

      {/* ── Budget List ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {/* Loading */}
        {loading && (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}

        {/* Empty */}
        {!loading && budgets.length === 0 && (
          <motion.div variants={itemVariants}>
            <GlassCard className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white/30" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 font-heading">
                No budgets yet
              </h3>
              <p className="text-sm text-white/50 max-w-sm mx-auto mb-6">
                Create your first budget to start tracking your spending
                and stay on top of your finances.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openCreate}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium inline-flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                Create Your First Budget
              </motion.button>
            </GlassCard>
          </motion.div>
        )}

        {/* Budget Items */}
        {!loading &&
          budgets.map((budget) => {
            const pct = Number(budget.percentageUsed || 0)
            const catMeta = getCategoryMeta(categories, budget.category)
            const barColor = progressColor(pct)
            const txtColor = progressTextColor(pct)
            const bgColor = progressBgColor(pct)
            const overBudget = pct > 100

            return (
              <motion.div key={budget.id} variants={itemVariants}>
                <GlassCard className="p-5 group">
                  <div className="flex items-start justify-between">
                    {/* Left: category info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: catMeta?.color
                            ? `${catMeta.color}20`
                            : 'rgba(255,255,255,0.05)',
                        }}
                      >
                        <Target
                          className="w-5 h-5"
                          style={{
                            color: catMeta?.color || 'rgba(255,255,255,0.4)',
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-white truncate font-heading">
                          {budget.category}
                        </h3>
                        <p className="text-xs text-white/50">
                          Limit:{' '}
                          <span className="text-white/70 font-medium">
                            {formatCurrency(budget.monthly_limit)}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Right: actions + percentage */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Percentage badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${txtColor} ${bgColor}`}
                      >
                        {pct > 100 ? '+' : ''}
                        {pct.toFixed(1)}%
                      </span>

                      {/* Actions */}
                      <button
                        onClick={() => openEdit(budget)}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-white/50 hover:text-white" />
                      </button>
                      <button
                        onClick={() => setDeletingBudget(budget)}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-white/50 hover:text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${barColor}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(pct, 100)}%` }}
                        transition={{
                          duration: 1,
                          ease: 'easeOut',
                          delay: 0.2,
                        }}
                      />
                    </div>
                  </div>

                  {/* Spent / Remaining row */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-white/50">
                      Spent{' '}
                      <span className="text-white/80 font-medium">
                        {formatCurrency(budget.spent)}
                      </span>{' '}
                      of{' '}
                      <span className="text-white/80 font-medium">
                        {formatCurrency(budget.monthly_limit)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      {overBudget && (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <span
                        className={
                          overBudget
                            ? 'text-red-400 font-medium'
                            : 'text-emerald-400 font-medium'
                        }
                      >
                        {budget.remaining >= 0
                          ? `${formatCurrency(budget.remaining)} left`
                          : `${formatCurrency(Math.abs(budget.remaining))} over`}
                      </span>
                    </span>
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
      </motion.div>

      {/* ── Create / Edit Modal ── */}
      <BudgetModal
        open={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingBudget(null)
        }}
        onSubmit={handleSubmitBudget}
        editingBudget={editingBudget}
        categories={categories}
      />

      {/* ── Delete Confirmation ── */}
      <DeleteConfirm
        budget={deletingBudget}
        onClose={() => setDeletingBudget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  )
}
