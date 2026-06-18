import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  Bot,
  User,
  MessageSquare,
  Lightbulb,
  TrendingUp,
  DollarSign,
  Loader2,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { aiService } from '../../services/aiService';
import { formatCurrency } from '../../utils/formatters';

// ── Helpers ────────────────────────────────────────────────────────────────

const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const formatMessageTime = (date) =>
  date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const QUICK_ACTIONS = [
  { label: 'How am I doing?', icon: Lightbulb },
  { label: 'Suggest savings', icon: TrendingUp },
  { label: 'Forecast expenses', icon: DollarSign },
  { label: 'Detect anomalies', icon: AlertCircle },
  { label: 'Monthly report', icon: MessageSquare },
];

// ── Skeleton ────────────────────────────────────────────────────────────────

function InsightSkeleton() {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 animate-pulse">
      <div className="h-4 bg-white/10 rounded w-1/2" />
      <div className="space-y-2">
        <div className="h-7 bg-white/10 rounded w-3/4" />
        <div className="h-7 bg-white/10 rounded w-1/2" />
      </div>
      <div className="h-3 bg-white/10 rounded w-1/3" />
    </div>
  );
}

// ── Typing Indicator ────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-3 px-1"
    >
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/30 to-blue-500/30 border border-white/10 flex items-center justify-center flex-shrink-0">
        <Bot size={16} className="text-blue-400" />
      </div>
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl px-4 py-3 min-w-[60px]">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-blue-400 block"
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Animations ───────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const messageVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
};

// ── Main Component ──────────────────────────────────────────────────────────

function AIAssistantPage() {
  // ── Insights state ─────────────────────────────────────────────────────
  const [insights, setInsights] = useState({
    monthlySummary: null,
    savingsSuggestion: null,
    forecast: null,
  });
  const [insightsLoading, setInsightsLoading] = useState({
    monthlySummary: true,
    savingsSuggestion: true,
    forecast: true,
  });
  const [insightsError, setInsightsError] = useState({
    monthlySummary: false,
    savingsSuggestion: false,
    forecast: false,
  });

  // ── Chat state ─────────────────────────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // ── Expense parser state ───────────────────────────────────────────────
  const [parseText, setParseText] = useState('');
  const [parseLoading, setParseLoading] = useState(false);
  const [showParser, setShowParser] = useState(false);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // ── Auto-scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Fetch insights ─────────────────────────────────────────────────────
  const fetchMonthlySummary = useCallback(async () => {
    setInsightsLoading((p) => ({ ...p, monthlySummary: true }));
    setInsightsError((p) => ({ ...p, monthlySummary: false }));
    try {
      const { data } = await aiService.getMonthlySummary();
      const payload = data.data ?? data;
      setInsights((p) => ({ ...p, monthlySummary: payload }));
    } catch {
      setInsightsError((p) => ({ ...p, monthlySummary: true }));
    } finally {
      setInsightsLoading((p) => ({ ...p, monthlySummary: false }));
    }
  }, []);

  const fetchSavingsSuggestion = useCallback(async () => {
    setInsightsLoading((p) => ({ ...p, savingsSuggestion: true }));
    setInsightsError((p) => ({ ...p, savingsSuggestion: false }));
    try {
      const { data } = await aiService.getSavingsSuggestions();
      const payload = data.data ?? data;
      setInsights((p) => ({ ...p, savingsSuggestion: payload }));
    } catch {
      setInsightsError((p) => ({ ...p, savingsSuggestion: true }));
    } finally {
      setInsightsLoading((p) => ({ ...p, savingsSuggestion: false }));
    }
  }, []);

  const fetchForecast = useCallback(async () => {
    setInsightsLoading((p) => ({ ...p, forecast: true }));
    setInsightsError((p) => ({ ...p, forecast: false }));
    try {
      const { data } = await aiService.getForecast();
      const payload = data.data ?? data;
      setInsights((p) => ({ ...p, forecast: payload }));
    } catch {
      setInsightsError((p) => ({ ...p, forecast: true }));
    } finally {
      setInsightsLoading((p) => ({ ...p, forecast: false }));
    }
  }, []);

  useEffect(() => {
    fetchMonthlySummary();
    fetchSavingsSuggestion();
    fetchForecast();
  }, [fetchMonthlySummary, fetchSavingsSuggestion, fetchForecast]);

  // ── Send message ───────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const userMsg = { id: generateId(), role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const { data } = await aiService.chat(text);
      const payload = data.data ?? data;
      const aiMsg = {
        id: generateId(),
        role: 'assistant',
        content: payload.answer ?? payload.response ?? payload.message ?? JSON.stringify(payload),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      toast.error('Failed to get AI response. Please try again.');
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'assistant',
          content: 'Sorry, I ran into an error. Please try again.',
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }, [input, isSending]);

  // ── Quick action ───────────────────────────────────────────────────────
  const handleQuickAction = useCallback(
    async (question) => {
      if (isSending) return;

      const userMsg = { id: generateId(), role: 'user', content: question, timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);
      setIsSending(true);

      try {
        const { data } = await aiService.chat(question);
        const payload = data.data ?? data;
        const aiMsg = {
          id: generateId(),
          role: 'assistant',
          content: payload.answer ?? payload.response ?? payload.message ?? JSON.stringify(payload),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        toast.error('Failed to get AI response.');
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: 'assistant',
            content: 'Sorry, I ran into an error. Please try again.',
            timestamp: new Date(),
            isError: true,
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [isSending],
  );

  // ── Parse expense ──────────────────────────────────────────────────────
  const handleParseExpense = useCallback(async () => {
    const text = parseText.trim();
    if (!text || parseLoading) return;

    setParseLoading(true);
    try {
      const { data } = await aiService.parseExpense(text);
      const payload = data.data ?? data;
      const txn = payload.transaction ?? payload;
      toast.success(
        `Parsed: ${txn.description || txn.category || 'Transaction'} — ${formatCurrency(txn.amount)}`,
      );
      setParseText('');
      setShowParser(false);
    } catch {
      toast.error('Could not parse expense. Try a different format.');
    } finally {
      setParseLoading(false);
    }
  }, [parseText, parseLoading]);

  // ── Handle Enter key ───────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage],
  );

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/30 flex items-center justify-center">
            <Sparkles size={20} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent font-heading">
              AI Assistant
            </h1>
            <p className="text-sm text-slate-400">Your personal finance advisor</p>
          </div>
        </div>
      </motion.div>

      {/* ── Insights Dashboard ─────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Monthly Summary */}
        <motion.div
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 relative group"
          variants={cardVariants}
          custom={0}
        >
          {insightsLoading.monthlySummary ? (
            <InsightSkeleton />
          ) : insightsError.monthlySummary ? (
            <div className="text-center py-4">
              <AlertCircle size={28} className="text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Failed to load</p>
              <button
                onClick={fetchMonthlySummary}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <TrendingUp size={16} className="text-blue-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white font-heading">Monthly Summary</h3>
                </div>
                <button
                  onClick={fetchMonthlySummary}
                  className="text-slate-500 hover:text-blue-400 transition-colors p-1 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100"
                  aria-label="Refresh monthly summary"
                >
                  <Loader2 size={14} />
                </button>
              </div>

              {insights.monthlySummary?.insight && (
                <p className="text-xs text-slate-400 mb-3 italic">
                  &ldquo;{insights.monthlySummary.insight}&rdquo;
                </p>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Income</span>
                  <span className="text-sm font-semibold text-emerald-400">
                    {formatCurrency(insights.monthlySummary?.income ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Expenses</span>
                  <span className="text-sm font-semibold text-red-400">
                    {formatCurrency(insights.monthlySummary?.expense ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-white/5">
                  <span className="text-xs text-slate-400">Savings</span>
                  <span className="text-sm font-semibold text-blue-400">
                    {formatCurrency(insights.monthlySummary?.savings ?? 0)}
                  </span>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Savings Suggestions */}
        <motion.div
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 relative group"
          variants={cardVariants}
          custom={1}
        >
          {insightsLoading.savingsSuggestion ? (
            <InsightSkeleton />
          ) : insightsError.savingsSuggestion ? (
            <div className="text-center py-4">
              <AlertCircle size={28} className="text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Failed to load</p>
              <button
                onClick={fetchSavingsSuggestion}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <Lightbulb size={16} className="text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white font-heading">Savings Tip</h3>
                </div>
                <button
                  onClick={fetchSavingsSuggestion}
                  className="text-slate-500 hover:text-emerald-400 transition-colors p-1 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100"
                  aria-label="Refresh savings tip"
                >
                  <Loader2 size={14} />
                </button>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {insights.savingsSuggestion?.suggestion ??
                  insights.savingsSuggestion?.tip ??
                  'No suggestion available.'}
              </p>
            </>
          )}
        </motion.div>

        {/* Forecast */}
        <motion.div
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 relative group"
          variants={cardVariants}
          custom={2}
        >
          {insightsLoading.forecast ? (
            <InsightSkeleton />
          ) : insightsError.forecast ? (
            <div className="text-center py-4">
              <AlertCircle size={28} className="text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Failed to load</p>
              <button
                onClick={fetchForecast}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                    <DollarSign size={16} className="text-violet-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white font-heading">Expense Forecast</h3>
                </div>
                <button
                  onClick={fetchForecast}
                  className="text-slate-500 hover:text-violet-400 transition-colors p-1 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100"
                  aria-label="Refresh expense forecast"
                >
                  <Loader2 size={14} />
                </button>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {insights.forecast?.prediction ??
                  insights.forecast?.forecast ??
                  'No forecast available.'}
              </p>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* ── Chat Section ────────────────────────────────────────────────── */}
      <motion.div
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        {/* Messages Container */}
        <div className="flex-1 max-h-[420px] overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {messages.length === 0 ? (
            /* ── Empty / Welcome State ────────────────────────────────── */
            <motion.div
              className="flex flex-col items-center justify-center py-12 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/30 flex items-center justify-center mb-4">
                <Bot size={32} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1 font-heading">Hello! I&apos;m your AI assistant</h3>
              <p className="text-sm text-slate-400 max-w-md">
                Ask me anything about your finances — track spending, find savings, forecast
                expenses, or get a monthly report.
              </p>
              <div className="flex flex-wrap gap-2 mt-5 justify-center">
                {QUICK_ACTIONS.slice(0, 3).map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action.label)}
                    className="px-3 py-1.5 text-xs rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-blue-500/30 transition-all"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            /* ── Messages List ─────────────────────────────────────────── */
            <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    layout
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-blue-500/30 to-violet-500/30 border-blue-500/30'
                          : 'bg-gradient-to-br from-violet-500/30 to-blue-500/30 border-white/10'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <User size={16} className="text-blue-400" />
                      ) : (
                        <Bot size={16} className="text-violet-400" />
                      )}
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[75%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-blue-600/80 to-violet-600/80 text-white rounded-tr-md'
                            : msg.isError
                              ? 'backdrop-blur-xl bg-red-500/10 border border-red-500/20 text-red-300 rounded-tl-md'
                              : 'backdrop-blur-xl bg-white/5 border border-white/10 text-slate-200 rounded-tl-md'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {formatMessageTime(msg.timestamp)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Typing Indicator */}
          <AnimatePresence>{isSending && <TypingIndicator />}</AnimatePresence>

          <div ref={chatEndRef} />
        </div>

        {/* ── Quick Action Buttons ──────────────────────────────────────── */}
        <div className="px-5 pb-2 flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleQuickAction(action.label)}
                disabled={isSending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-blue-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Icon size={12} />
                {action.label}
              </motion.button>
            );
          })}
        </div>

        {/* ── Expense Parser ────────────────────────────────────────────── */}
        <div className="px-5 pb-3">
          <AnimatePresence>
            {showParser ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={parseText}
                    onChange={(e) => setParseText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleParseExpense();
                      }
                    }}
                    placeholder='e.g. "Spent 450 on pizza yesterday"'
                    className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                    disabled={parseLoading}
                  />
                  <button
                    onClick={handleParseExpense}
                    disabled={!parseText.trim() || parseLoading}
                    className="px-3 py-1 text-xs rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 text-white font-medium hover:from-blue-500 hover:to-violet-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {parseLoading ? <Loader2 size={12} className="animate-spin" /> : <ChevronRight size={12} />}
                    Parse
                  </button>
                  <button
                    onClick={() => { setShowParser(false); setParseText(''); }}
                    className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                    aria-label="Close expense parser"
                  >
                    <ChevronRight size={14} className="rotate-180" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <button
                onClick={() => setShowParser(true)}
                className="text-xs text-slate-500 hover:text-blue-400 transition-colors flex items-center gap-1"
              >
                <MessageSquare size={12} />
                Quick-add expense via text
              </button>
            )}
          </AnimatePresence>
        </div>

        {/* ── Input Bar ──────────────────────────────────────────────────── */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your finances..."
                className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/40 focus:bg-white/[0.07] transition-all"
                disabled={isSending}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={sendMessage}
              disabled={!input.trim() || isSending}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 flex items-center justify-center text-white hover:from-blue-500 hover:to-violet-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              {isSending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default AIAssistantPage;
