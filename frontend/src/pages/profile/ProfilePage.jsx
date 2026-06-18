import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon,
  Settings,
  LogOut,
  Shield,
  Clock,
  Mail,
  Save,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { profileService } from '../../services/profileService';
import { formatDate } from '../../utils/formatters';

// ── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: 'INR', label: '₹ INR — Indian Rupee' },
  { code: 'USD', label: '$ USD — US Dollar' },
  { code: 'EUR', label: '€ EUR — Euro' },
  { code: 'GBP', label: '£ GBP — British Pound' },
  { code: 'JPY', label: '¥ JPY — Japanese Yen' },
  { code: 'CAD', label: 'CA$ CAD — Canadian Dollar' },
  { code: 'AUD', label: 'A$ AUD — Australian Dollar' },
  { code: 'SGD', label: 'S$ SGD — Singapore Dollar' },
];

const TIMEZONES = [
  'UTC',
  'Asia/Kolkata',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
  'Africa/Cairo',
  'Africa/Lagos',
  'America/Sao_Paulo',
  'America/Mexico_City',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ── Animations ───────────────────────────────────────────────────────────────

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
};

// ── Main Component ──────────────────────────────────────────────────────────

function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  // ── Profile state ───────────────────────────────────────────────────────
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Password state ─────────────────────────────────────────────────────
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Password form (plain state to avoid hook form complexity) ───────────
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // ── Delete state ───────────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // ── Logout state ───────────────────────────────────────────────────────
  const [loggingOut, setLoggingOut] = useState(false);

  // ── React Hook Form ────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm({
    defaultValues: { name: '', currency: 'INR', timezone: 'UTC' },
  });

  // ── Fetch profile ──────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(false);
    try {
      const { data } = await profileService.get();
      const p = data.data ?? data;
      setProfile(p);
      reset({
        name: p.name ?? user?.name ?? '',
        currency: p.currency ?? 'INR',
        timezone: p.timezone ?? 'UTC',
      });
    } catch {
      setProfileError(true);
      toast.error('Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  }, [reset, user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ── Save profile ───────────────────────────────────────────────────────
  const onSaveProfile = useCallback(
    async (formData) => {
      if (saving) return;
      setSaving(true);
      try {
        const { data } = await profileService.update(formData);
        const updated = data.data ?? data;
        setProfile(updated);
        updateUser(updated);
        toast.success('Profile updated successfully');
      } catch {
        toast.error('Failed to update profile');
      } finally {
        setSaving(false);
      }
    },
    [saving, updateUser],
  );

  // ── Change password ────────────────────────────────────────────────────
  const onChangePassword = useCallback(async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setPasswordSaving(true);
    try {
      await profileService.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast.error('Failed to change password. Check your current password.');
    } finally {
      setPasswordSaving(false);
    }
  }, [passwordForm]);

  // ── Delete account ─────────────────────────────────────────────────────
  const onDeleteAccount = useCallback(async () => {
    if (deleteConfirmText !== 'DELETE' || deleting) return;

    setDeleting(true);
    try {
      await profileService.deleteAccount();
      toast.success('Account deleted permanently');
      await logout();
      navigate('/');
    } catch {
      toast.error('Failed to delete account');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeleteConfirmText('');
    }
  }, [deleteConfirmText, deleting, logout, navigate]);

  // ── Logout ─────────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } catch {
      toast.error('Failed to log out');
      setLoggingOut(false);
    }
  }, [logout, navigate]);

  // ── Loading state ──────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-white/10" />
          <div className="space-y-2">
            <div className="h-6 bg-white/10 rounded w-40" />
            <div className="h-4 bg-white/10 rounded w-56" />
          </div>
        </div>
        {/* Section skeletons */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="h-5 bg-white/10 rounded w-1/4" />
            <div className="h-10 bg-white/10 rounded w-full" />
            <div className="h-10 bg-white/10 rounded w-full" />
            <div className="h-10 bg-white/10 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (profileError) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center"
      >
        <AlertCircle size={48} className="text-slate-500 mx-auto mb-3" />
        <p className="text-slate-300 text-sm mb-4">Failed to load profile</p>
        <button
          onClick={fetchProfile}
          className="px-5 py-2 text-sm rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all"
        >
          Try Again
        </button>
      </motion.div>
    );
  }

  const displayName = profile?.name ?? user?.name ?? 'User';
  const displayEmail = profile?.email ?? user?.email ?? '';
  const memberSince = profile?.created_at ?? user?.created_at;
  const accountType = user?.account_type ?? profile?.account_type ?? 'Email';
  const hasPassword = user?.has_password === true;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ── Profile Header ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-5"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <span className="text-2xl font-bold text-white">{getInitials(displayName)}</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{displayName}</h1>
          <p className="text-sm text-slate-400">{displayEmail}</p>
          {memberSince && (
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Clock size={12} />
              Member since {formatDate(memberSince)}
            </p>
          )}
        </div>
      </motion.div>

      {/* ── Profile Edit Form ───────────────────────────────────────────── */}
      <motion.div
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
        variants={sectionVariants}
        custom={0}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center gap-2 mb-5">
          <Settings size={16} className="text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Edit Profile</h2>
        </div>

        <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
            <input
              {...register('name', { required: 'Name is required' })}
              className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/40 focus:bg-white/[0.07] transition-all"
              placeholder="Your name"
            />
            {errors.name && (
              <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Currency</label>
            <select
              {...register('currency')}
              className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/40 focus:bg-white/[0.07] transition-all appearance-none cursor-pointer"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Timezone</label>
            <select
              {...register('timezone')}
              className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/40 focus:bg-white/[0.07] transition-all appearance-none cursor-pointer"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz} className="bg-slate-900 text-white">
                  {tz}
                </option>
              ))}
            </select>
          </div>

          {/* Save */}
          <div className="flex justify-end pt-1">
            <motion.button
              type="submit"
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-500 hover:to-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* ── Change Password ─────────────────────────────────────────────── */}
      {hasPassword && (
        <motion.div
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
          variants={sectionVariants}
          custom={1}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center gap-2 mb-5">
            <Shield size={16} className="text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Change Password</h2>
          </div>

          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))
                  }
                  className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/40 focus:bg-white/[0.07] transition-all"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                  }
                  className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/40 focus:bg-white/[0.07] transition-all"
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                  }
                  className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/40 focus:bg-white/[0.07] transition-all"
                  placeholder="Re-enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordForm.confirmPassword &&
                passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-1">
              <motion.button
                type="button"
                onClick={onChangePassword}
                disabled={
                  passwordSaving ||
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword ||
                  !passwordForm.confirmPassword
                }
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Shield size={16} />
                )}
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Account Info ────────────────────────────────────────────────── */}
      <motion.div
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
        variants={sectionVariants}
        custom={hasPassword ? 2 : 1}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center gap-2 mb-5">
          <Mail size={16} className="text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Account Info</h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-sm text-slate-400">Email</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white">{displayEmail}</span>
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Verified
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-sm text-slate-400">Account Type</span>
            <span className="text-sm text-white flex items-center gap-1.5">
              <Shield size={14} className="text-blue-400" />
              {accountType === 'google' ? 'Google' : 'Email'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-400">Member Since</span>
            <span className="text-sm text-white flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400" />
              {memberSince ? formatDate(memberSince) : '—'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Danger Zone ─────────────────────────────────────────────────── */}
      <motion.div
        className="backdrop-blur-xl bg-red-500/[0.03] border border-red-500/20 rounded-2xl p-6"
        variants={sectionVariants}
        custom={hasPassword ? 3 : 2}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle size={16} className="text-red-400" />
          <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Once you delete your account, there is no going back. All your data, transactions,
          budgets, and analytics will be permanently removed.
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
        >
          <AlertCircle size={16} />
          Delete Account
        </motion.button>
      </motion.div>

      {/* ── Logout ──────────────────────────────────────────────────────── */}
      <motion.div
        className="text-center pt-2"
        variants={sectionVariants}
        custom={hasPassword ? 4 : 3}
        initial="hidden"
        animate="visible"
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loggingOut ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <LogOut size={16} />
          )}
          {loggingOut ? 'Logging out...' : 'Log out'}
        </motion.button>
      </motion.div>

      {/* ── Delete Confirmation Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="backdrop-blur-xl bg-slate-900/95 border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <AlertCircle size={20} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Account</h3>
                  <p className="text-xs text-slate-400">This action is permanent</p>
                </div>
              </div>

              <p className="text-sm text-slate-300 mb-4">
                All your data will be permanently deleted. This cannot be undone.
                <br />
                Type <span className="font-bold text-red-400">DELETE</span> to confirm.
              </p>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder='Type "DELETE" to confirm'
                className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-red-500/40 focus:bg-white/[0.07] transition-all mb-4"
              />

              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                  disabled={deleting}
                  className="px-4 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || deleting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                  {deleting ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProfilePage;
