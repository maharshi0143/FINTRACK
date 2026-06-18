import { motion } from 'framer-motion';

function GlassCard({
  children,
  className = '',
  hover = true,
  padding = true,
  as: Component = 'div',
  ...props
}) {
  return (
    <Component
      className={`
        backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl
        ${padding ? 'p-6' : ''}
        ${hover ? 'hover:bg-white/[0.07] transition-all duration-300' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </Component>
  );
}

function GlassCardAnimated({ children, className = '', ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6
        hover:bg-white/[0.07] transition-all duration-300
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export { GlassCard, GlassCardAnimated };
