import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Globe, Skull, User, HeartPulse, Home, Menu, X } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/world', label: 'World Map', icon: Globe },
  { path: '/underworld', label: 'Underworld', icon: Skull },
  { path: '/character', label: 'Character', icon: User },
  { path: '/clinic', label: 'Clinic', icon: HeartPulse },
]

export default function Navigation() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top Border Glow */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-cyber-glow to-transparent" />
      
      <nav className="cyber-panel border-t-0 rounded-t-none px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-glow to-cyber-blue flex items-center justify-center cyber-glow">
                <span className="font-cyber font-bold text-lg text-cyber-darker">XR</span>
              </div>
              <div className="absolute -inset-1 rounded-lg bg-cyber-glow/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-cyber text-lg font-bold tracking-wider text-cyber-text group-hover:text-cyber-glow transition-colors">
                XRPL
              </h1>
              <p className="text-xs text-cyber-muted -mt-1 tracking-widest">CONTROL ROOM</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative px-4 py-2 group"
                >
                  <div className={`flex items-center gap-2 transition-all duration-300 ${
                    isActive ? 'text-cyber-glow' : 'text-cyber-muted hover:text-cyber-text'
                  }`}>
                    <Icon size={18} className={isActive ? 'drop-shadow-[0_0_8px_var(--color-cyber-glow)]' : ''} />
                    <span className="font-cyber text-sm tracking-wider uppercase">{item.label}</span>
                  </div>
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-cyber-glow via-cyber-cyan to-cyber-glow"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  
                  {/* Hover Glow */}
                  <div className="absolute inset-0 rounded-lg bg-cyber-glow/0 group-hover:bg-cyber-glow/5 transition-colors" />
                </Link>
              )
            })}
          </div>

          {/* Status Indicators */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 cyber-panel border-cyber-green/30">
              <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
              <span className="text-xs font-cyber text-cyber-green">LIVE</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-cyber-muted">LEDGER</p>
              <p className="font-cyber text-sm text-cyber-glow">#85,234,521</p>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-cyber-text hover:text-cyber-glow transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-cyber-border"
          >
            <div className="py-4 space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-cyber-glow/10 text-cyber-glow border border-cyber-glow/30' 
                        : 'text-cyber-muted hover:text-cyber-text hover:bg-cyber-border/20'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-cyber tracking-wider uppercase">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </nav>
      
      {/* Corner Decorations */}
      <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-cyber-glow/50" />
      <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-cyber-glow/50" />
    </header>
  )
}
