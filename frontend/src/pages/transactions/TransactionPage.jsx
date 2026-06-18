import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Filter,
  Receipt,
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
  X,
  Calendar,
  ArrowUpDown,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { transactionService } from '../../services/transactionService'
import { categoryService } from '../../services/categoryService'
import { formatCurrency, formatDate } from '../../utils/formatters'

/* ─── Stagger variants for framer-motion lists ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
}

const modalOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const modalCardVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
  exit: { opacity: 0, scale: 0.92, y: 24, transition: { duration: 0.15 } },
}

/* ─── Glass card class used throughout ─── */
const glassCard = 'backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl'

/* ─── Skeleton component for loading rows ─── */
function SkeletonRow() {
  return (
    <div className={`${glassCard} px-4 sm:px-6 py-4 flex items-center justify-between animate-pulse`}>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="h-11 w-11 rounded-xl bg-white/10" />
        <div className="space-y-2">
          <div className="h-4 w-36 rounded bg-white/10" />
          <div className="h-3 w-20 rounded bg-white/5" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="h-5 w-20 rounded bg-white/10" />
        <div className="h-8 w-8 rounded-lg bg-white/5" />
        <div className="h-8 w-8 rounded-lg bg-white/5" />
      </div>
    </div>
  )
}

/* ─── Inline filter button for Income / Expense / All ─── */
function TypeFilter({ value, onChange }) {
  const options = [
    { label: 'All', value: '' },
    { label: 'Income', value: 'income' },
    { label: 'Expense', value: 'expense' },
  ]

  return (
    <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              active
                ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Sort dropdown ─── */
function SortSelect({ sortBy, sortOrder, onSortByChange, onToggleOrder }) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={sortBy}
        onChange={(e) => onSortByChange(e.target.value)}
        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer"
      >
        <option value="date" className="bg-slate-800 text-white">Date</option>
        <option value="amount" className="bg-slate-800 text-white">Amount</option>
        <option value="title" className="bg-slate-800 text-white">Title</option>
      </select>
      <button
        type="button"
        onClick={onToggleOrder}
        className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
        title={sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
      >
        <ArrowUpDown
          size={16}
          className={`transition-transform duration-200 ${
            sortOrder === 'asc' ? 'rotate-180' : ''
          }`}
        />
      </button>
    </div>
  )
}

/* ─── Category badge pill ─── */
function CategoryBadge({ category }) {
  if (!category) return null
  const bgColor = category.color
  const textColor = category.color || 'text-slate-300'

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: bgColor ? `${bgColor}20` : 'rgba(255,255,255,0.1)',
        color: textColor,
      }}
    >
      {category.icon && <span className="text-[11px]">{category.icon}</span>}
      {category.name}
    </span>
  )
}

/* ─── Main Page Component ─── */
function TransactionPage() {
  /* ── Data state ── */
  const [transactions, setTransactions] = useState([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  /* ── Filter / sort state ── */
  const [search, setSearch] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const debounceRef = useRef(null)

  /* ── Modal state ── */
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [modalSubmitting, setModalSubmitting] = useState(false)

  /* ── Delete state ── */
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  /* ── Limit per page ── */
  const limit = 10

  /* ── Fetch categories once ── */
  useEffect(() => {
    categoryService
      .getAll()
      .then((res) => setCategories(res.data.data || []))
      .catch(() => toast.error('Failed to load categories'))
  }, [])

  /* ── Fetch transactions (stable ref-based pattern to avoid render loops) ── */
  const fetchRef = useRef({ currentPage, search, typeFilter, categoryFilter, startDate, endDate, sortBy, sortOrder, limit })
  fetchRef.current = { currentPage, search, typeFilter, categoryFilter, startDate, endDate, sortBy, sortOrder, limit }

  const fetchTransactions = useCallback(async (page) => {
    const f = fetchRef.current
    setLoading(true)
    setFetchError(null)
    try {
      const params = {
        page: page ?? f.currentPage,
        limit: f.limit,
        search: f.search.trim() || undefined,
        type: f.typeFilter || undefined,
        category: f.categoryFilter || undefined,
        startDate: f.startDate || undefined,
        endDate: f.endDate || undefined,
        sortBy: f.sortBy,
        sortOrder: f.sortOrder,
      }
      const res = await transactionService.getAll(params)
      const { transactions: list, total: t, currentPage: cp, totalPages: tp } = res.data.data ?? res.data
      setTransactions(list)
      setTotal(t)
      setCurrentPage(cp)
      setTotalPages(tp)
    } catch {
      setFetchError('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions, search, typeFilter, categoryFilter, startDate, endDate, sortBy, sortOrder])

  /* ── Debounced search ── */
  const handleSearchChange = (value) => {
    setInputValue(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(value.trim())
      setCurrentPage(1)
    }, 350)
  }

  /* ── Filter helpers — count active filters ── */
  const activeFilterCount = [
    typeFilter,
    categoryFilter,
    startDate,
    endDate,
    search.trim(),
  ].filter(Boolean).length

  const clearFilters = () => {
    setSearch('')
    setInputValue('')
    setTypeFilter('')
    setCategoryFilter('')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  /* ── React Hook Form setup ── */
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      amount: '',
      type: 'expense',
      category: '',
      date: new Date().toISOString().slice(0, 10),
      notes: '',
    },
  })

  const watchedType = watch('type')

  /* ── Open modal for create ── */
  const openCreateModal = () => {
    setEditingTransaction(null)
    reset({
      title: '',
      amount: '',
      type: 'expense',
      category: '',
      date: new Date().toISOString().slice(0, 10),
      notes: '',
    })
    setModalOpen(true)
  }

  /* ── Open modal for edit ── */
  const openEditModal = (tx) => {
    setEditingTransaction(tx)
    reset({
      title: tx.title || '',
      amount: tx.amount != null ? String(tx.amount) : '',
      type: tx.type || 'expense',
      category: categories.find(c => c.id === tx.category || c.id === tx.categoryId)?.name || tx.category || '',
      date: tx.date ? tx.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      notes: tx.notes || '',
    })
    setModalOpen(true)
  }

  /* ── Close modal ── */
  const closeModal = () => {
    setModalOpen(false)
    setEditingTransaction(null)
  }

  /* ── Submit form (create / update) ── */
  const onSubmit = async (formData) => {
    setModalSubmitting(true)
    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        category: formData.category,
      }

      if (editingTransaction) {
        await transactionService.update(editingTransaction.id, payload)
        toast.success('Transaction updated')
      } else {
        await transactionService.create(payload)
        toast.success('Transaction created')
      }

      closeModal()
      fetchTransactions(editingTransaction ? currentPage : 1)
    } catch {
      toast.error(editingTransaction ? 'Failed to update transaction' : 'Failed to create transaction')
    } finally {
      setModalSubmitting(false)
    }
  }

  /* ── Delete ── */
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await transactionService.delete(deleteTarget.id)
      toast.success('Transaction deleted')
      setDeleteTarget(null)
      // If we deleted the last item on the current page, go back one page
      const newPage = transactions.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage
      fetchTransactions(newPage)
    } catch {
      toast.error('Failed to delete transaction')
    } finally {
      setDeleting(false)
    }
  }

  /* ── Pagination ── */
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return
    fetchTransactions(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const from = total === 0 ? 0 : (currentPage - 1) * limit + 1
  const to = Math.min(currentPage * limit, total)

  /* ── Page number range ── */
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  /* ── Keyboard: Escape closes modals ── */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (deleteTarget) setDeleteTarget(null)
        else if (modalOpen) closeModal()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [modalOpen, deleteTarget])

  /* ── Render ── */
  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/20 flex items-center justify-center">
            <Receipt className="text-blue-400" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white font-heading">Transactions</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Manage your income and expenses
            </p>
          </div>
          {!loading && total > 0 && (
            <span className="ml-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 font-medium">
              {total} total
            </span>
          )}
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={18} />
          Add Transaction
        </button>
      </div>

      {/* ═══ SEARCH & FILTER BAR ═══ */}
      <div className={`${glassCard} p-4 space-y-4`}>
        {/* Search row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search transactions..."
              value={inputValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            />
          </div>

          <TypeFilter value={typeFilter} onChange={setTypeFilter} />

          {/* Category dropdown */}
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer min-w-[140px]"
            >
              <option value="" className="bg-slate-800 text-white">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-slate-800 text-white">
                  {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Second row: date range + sort + clear */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar size={14} className="text-slate-500 flex-shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setCurrentPage(1)
              }}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 [color-scheme:dark] max-w-[140px]"
            />
            <span className="text-slate-600 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setCurrentPage(1)
              }}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 [color-scheme:dark] max-w-[140px]"
            />
          </div>

          <div className="flex-1" />

          <SortSelect
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={(v) => {
              setSortBy(v)
              setCurrentPage(1)
            }}
            onToggleOrder={() =>
              setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
            }
          />

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-red-500/30 text-sm transition-all"
            >
              <X size={14} />
              Clear
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                {activeFilterCount}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ═══ TRANSACTIONS LIST ═══ */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : fetchError ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${glassCard} flex flex-col items-center justify-center py-20 px-6`}
        >
          <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <AlertCircle className="text-red-400" size={28} />
          </div>
          <p className="text-white font-semibold text-lg font-heading">Failed to load transactions</p>
          <p className="text-slate-500 text-sm mt-1 text-center max-w-xs mb-4">{fetchError}</p>
          <button
            onClick={() => fetchTransactions()}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-sm text-white transition-all"
          >
            Try Again
          </button>
        </motion.div>
      ) : transactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${glassCard} flex flex-col items-center justify-center py-20 px-6`}
        >
          <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <Receipt className="text-slate-500" size={28} />
          </div>
          <p className="text-white font-semibold text-lg font-heading">No transactions found</p>
          <p className="text-slate-500 text-sm mt-1 text-center max-w-xs">
            {activeFilterCount > 0
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Get started by adding your first transaction.'}
          </p>
          {activeFilterCount === 0 && (
            <button
              onClick={openCreateModal}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={18} />
              Add Transaction
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {transactions.map((tx) => {
              const isIncome = tx.type === 'income'
              const category = categories.find((c) => c.id === tx.category || c.id === tx.categoryId || c.name === tx.category) || { name: tx.category || 'Uncategorized' }

              return (
                <motion.div
                  key={tx.id}
                  layout
                  variants={itemVariants}
                  exit={{ opacity: 0, scale: 0.95, y: -8, transition: { duration: 0.15 } }}
                  whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
                  className={`${glassCard} px-4 sm:px-6 py-4 flex items-center justify-between group cursor-default`}
                >
                  {/* Left: type icon */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div
                      className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-red-500/15 text-red-400'
                      }`}
                    >
                      {isIncome ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    </div>

                    {/* Middle: title + category + date */}
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">
                        {tx.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {category && <CategoryBadge category={category} />}
                        <span className="text-slate-500 text-xs whitespace-nowrap">
                          {formatDate(tx.date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: amount + actions */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-3 sm:ml-4">
                    <span
                      className={`font-bold text-sm tabular-nums ${
                        isIncome ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </span>

                    <button
                      onClick={() => openEditModal(tx)}
                      className="p-2 rounded-xl text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Edit"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(tx)}
                      className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ═══ PAGINATION ═══ */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
          <p className="text-slate-500 text-sm">
            Showing <span className="text-white font-medium">{from}</span> –{' '}
            <span className="text-white font-medium">{to}</span> of{' '}
            <span className="text-white font-medium">{total}</span>
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ChevronLeft size={16} />
            </button>

            {getPageNumbers().map((p) => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`min-w-[36px] h-9 rounded-xl text-sm font-medium transition-all ${
                  p === currentPage
                    ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ═══ ADD / EDIT MODAL ═══ */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            key="transaction-modal"
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeModal()
            }}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <motion.div
              variants={modalCardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`${glassCard} relative w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto`}
            >
              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={18} />
              </button>

              <h2 className="text-xl font-bold text-white mb-6 font-heading">
                {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Grocery shopping"
                    {...register('title', { required: 'Title is required' })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  />
                  {errors.title && (
                    <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>
                  )}
                </div>

                {/* Amount + Type row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...register('amount', {
                        required: 'Amount is required',
                        min: { value: 0.01, message: 'Must be greater than 0' },
                      })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    {errors.amount && (
                      <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Type
                    </label>
                    <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 h-[42px]">
                      {['income', 'expense'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setValue('type', t)}
                          className={`flex-1 rounded-lg text-sm font-medium transition-all capitalize ${
                            watchedType === t
                              ? t === 'income'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Category + Date row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Category
                    </label>
                    <select
                      {...register('category', { required: 'Category is required' })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-slate-800 text-white">Select category</option>
                      {categories
                        .filter((c) => !watchedType || c.type === watchedType)
                        .map((cat) => (
                          <option key={cat.id} value={cat.name} className="bg-slate-800 text-white">
                            {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                          </option>
                        ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-400 text-xs mt-1">{errors.category.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Date
                    </label>
                    <input
                      type="date"
                      {...register('date', { required: 'Date is required' })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 [color-scheme:dark]"
                    />
                    {errors.date && (
                      <p className="text-red-400 text-xs mt-1">{errors.date.message}</p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Notes <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Add any additional details..."
                    {...register('notes')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
                >
                  {modalSubmitting && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {modalSubmitting
                    ? editingTransaction
                      ? 'Updating...'
                      : 'Creating...'
                    : editingTransaction
                      ? 'Update Transaction'
                      : 'Create Transaction'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ DELETE CONFIRMATION MODAL ═══ */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            key="delete-modal"
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDeleteTarget(null)
            }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <motion.div
              variants={modalCardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`${glassCard} relative w-full max-w-sm p-6 shadow-2xl`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                  <Trash2 size={18} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-heading">Delete Transaction</h3>
                  <p className="text-slate-400 text-sm">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-slate-300 text-sm mb-6">
                Are you sure you want to delete{' '}
                <span className="text-white font-semibold">&quot;{deleteTarget.title}&quot;</span>?
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-sm font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-semibold shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
                >
                  {deleting && <Loader2 size={15} className="animate-spin" />}
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TransactionPage
