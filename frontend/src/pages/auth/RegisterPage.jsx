import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn'

function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerUser, googleLogin } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleGoogleCredential = async (credential) => {
    try {
      await googleLogin(credential)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Google sign-in failed')
    }
  }

  const { googleLoading, containerRef } = useGoogleSignIn(handleGoogleCredential)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  const watchPassword = watch('password')

  const onSubmit = async (data) => {
    try {
      await registerUser(data.name, data.email, data.password)
      toast.success('Account created successfully. Please sign in.')
      navigate('/')
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <motion.div className="absolute -top-32 -right-32 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl" animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute -bottom-32 -left-32 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" animate={{ scale: [1.15, 1, 1.15], opacity: [0.5, 0.3, 0.5] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 relative z-10 shadow-xl"
      >
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 mb-3 shadow-lg shadow-blue-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-white font-heading">Create account</h1>
          <p className="text-zinc-400 text-xs mt-0.5">Get started with FinTrack</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-zinc-300 mb-1">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                {...register('name', { required: 'Name is required' })}
                className={`w-full max-w-sm bg-white/5 border ${errors.name ? 'border-red-500/50' : 'border-white/10'} rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 outline-none transition-all duration-200 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
            {errors.name && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-zinc-300 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@gmail.com"
                {...register('email', { required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@gmail\.com$/i, message: 'Only @gmail.com emails are allowed' } })}
                className={`w-full max-w-sm bg-white/5 border ${errors.email ? 'border-red-500/50' : 'border-white/10'} rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 outline-none transition-all duration-200 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
            {errors.email && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-zinc-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Min. 6 characters"
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'At least 6 chars' } })}
                className={`w-full max-w-sm bg-white/5 border ${errors.password ? 'border-red-500/50' : 'border-white/10'} rounded-xl pl-9 pr-9 py-2 text-sm text-white placeholder-zinc-500 outline-none transition-all duration-200 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20`}
              />
              <button type="button" onClick={() => setShowPassword(p => !p)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors" tabIndex={-1}>
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-zinc-300 mb-1">Confirm password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat your password"
                {...register('confirmPassword', { required: 'Please confirm', validate: (val) => val === watchPassword || 'Passwords do not match' })}
                className={`w-full max-w-sm bg-white/5 border ${errors.confirmPassword ? 'border-red-500/50' : 'border-white/10'} rounded-xl pl-9 pr-9 py-2 text-sm text-white placeholder-zinc-500 outline-none transition-all duration-200 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20`}
              />
              <button type="button" onClick={() => setShowConfirmPassword(p => !p)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors" tabIndex={-1}>
                {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 text-white font-medium rounded-xl py-2 text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            {isSubmitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating account...</> : <>Create account <ArrowRight className="w-3.5 h-3.5" /></>}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-zinc-950 px-2 text-zinc-500">or continue with</span></div>
        </div>

        <div className="relative flex justify-center">
          {googleLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
            </div>
          )}
          <div ref={containerRef} className="w-full" />
        </div>

        <p className="text-center text-zinc-400 text-xs mt-4">
          Already have an account?{' '}
          <Link to="/" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}

export default RegisterPage
