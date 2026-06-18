import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationService } from '../../services/notificationService';
import { getRelativeTime } from '../../utils/formatters';

// ── Animations ───────────────────────────────────────────────────────────────

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

// ── Skeleton ────────────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-white/10 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/10 rounded w-1/3" />
        <div className="h-3 bg-white/10 rounded w-2/3" />
      </div>
      <div className="h-3 bg-white/10 rounded w-16" />
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // ── Fetch notifications ─────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await notificationService.getAll();
      const list = data.data ?? data ?? [];
      // Sort by created_at DESC (newest first)
      const sorted = [...list].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setNotifications(sorted);
    } catch {
      setError(true);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Derived state ───────────────────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ── Mark as read ────────────────────────────────────────────────────────
  const handleMarkAsRead = useCallback(async (id) => {
    setMarkingId(id);
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch {
      toast.error('Failed to mark as read');
    } finally {
      setMarkingId(null);
    }
  }, []);

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id) => {
    setDeletingId(id);
    try {
      await notificationService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Notification deleted');
    } catch {
      toast.error('Failed to delete notification');
    } finally {
      setDeletingId(null);
    }
  }, []);

  // ── Mark All Read ───────────────────────────────────────────────────────
  const handleMarkAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.is_read);
    if (unread.length === 0) return;

    // Mark all optimistically
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    const results = await Promise.allSettled(unread.map((n) => notificationService.markAsRead(n.id)));
    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      toast.error('Some notifications could not be marked');
      fetchNotifications();
    } else {
      toast.success('All notifications marked as read');
    }
  }, [notifications, fetchNotifications]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/30 flex items-center justify-center">
            <Bell size={20} className="text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up'}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all"
          >
            <CheckCheck size={16} />
            Mark All Read
          </motion.button>
        )}
      </motion.div>

      {/* ── Loading State ───────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <NotificationSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ── Error State ─────────────────────────────────────────────────── */}
      {!loading && error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center"
        >
          <AlertCircle size={40} className="text-slate-500 mx-auto mb-3" />
          <p className="text-slate-300 text-sm mb-3">Could not load notifications</p>
          <button
            onClick={fetchNotifications}
            className="px-4 py-2 text-sm rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all"
          >
            Try Again
          </button>
        </motion.div>
      )}

      {/* ── Notification List ───────────────────────────────────────────── */}
      {!loading && !error && (
        <motion.div
          className="space-y-3"
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          {notifications.length === 0 ? (
            /* ── Empty State ─────────────────────────────────────────────── */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Bell size={32} className="text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">No notifications yet</h3>
              <p className="text-sm text-slate-400">
                We&apos;ll notify you when something important happens
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {notifications.map((notification) => {
                const isUnread = !notification.is_read;
                const isMarking = markingId === notification.id;
                const isDeleting = deletingId === notification.id;

                return (
                  <motion.div
                    key={notification.id}
                    layout
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={`backdrop-blur-xl border rounded-2xl p-4 transition-all ${
                      isUnread
                        ? 'bg-blue-500/[0.04] border-blue-500/20'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Left icon */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                          isUnread
                            ? 'bg-blue-500/20 border-blue-500/30'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <Bell
                          size={18}
                          className={isUnread ? 'text-blue-400' : 'text-slate-500'}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4
                                className={`text-sm truncate ${
                                  isUnread ? 'font-semibold text-white' : 'font-medium text-slate-300'
                                }`}
                              >
                                {notification.title}
                              </h4>
                              {isUnread && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>

                          {/* Timestamp */}
                          <span className="text-[10px] text-slate-500 whitespace-nowrap flex-shrink-0 pt-0.5">
                            {getRelativeTime(notification.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isUnread && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={isMarking || isDeleting}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all disabled:opacity-40"
                            title="Mark as read"
                          >
                            {isMarking ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <CheckCheck size={14} />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          disabled={isDeleting || isMarking}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                          title="Delete"
                        >
                          {isDeleting ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default NotificationsPage;
