import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  MessageSquare,
  User,
  Shield,
  LogOut,
  Menu,
  X,
  Bell,
  GraduationCap,
  AlertTriangle,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/data/mockData';
import AIChatBot from '@/components/ai/AIChatBot';

const NAV_ITEMS = [
  { path: '/feed', label: 'Feed', icon: Home },
  { path: '/discussions', label: 'Discussions', icon: MessageSquare },
  { path: '/profile', label: 'Profile', icon: User },
];

const ADMIN_NAV = { path: '/admin', label: 'Admin Panel', icon: Shield };

export default function AppLayout() {
  const { currentUser, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const allNavItems = isAdmin ? [...NAV_ITEMS, ADMIN_NAV] : NAV_ITEMS;

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Suspended overlay */}
      <AnimatePresence>
        {currentUser?.isSuspended && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center gradient-primary"
          >
            <div className="flex flex-col items-center gap-4 p-8 text-center">
              <AlertTriangle className="h-16 w-16 text-accent" />
              <h1 className="text-3xl font-bold font-display text-primary-foreground">
                Account Suspended
              </h1>
              <p className="max-w-md text-primary-foreground/80">
                Your account has been suspended by an administrator. 
                Please contact support for more information.
              </p>
              <Button
                variant="outline"
                className="mt-4 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                onClick={logout}
              >
                Sign Out
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col bg-sidebar border-r border-sidebar-border">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold font-display text-sidebar-primary-foreground">
              UniConnect
            </h1>
            <p className="text-[10px] text-sidebar-foreground/60">Hub</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {allNavItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
                {item.path === '/admin' && (
                  <span className="ml-auto flex h-5 items-center rounded-full bg-accent/20 px-2 text-[10px] font-semibold text-accent">
                    ADMIN
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <Avatar className="h-8 w-8 border border-sidebar-border">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs font-semibold">
                {currentUser ? getInitials(currentUser.name) : '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {currentUser?.name}
              </p>
              <p className="text-[11px] text-sidebar-foreground/50 truncate">
                @{currentUser?.username}
              </p>
            </div>
            <button
              onClick={logout}
              className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-foreground/70"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h2 className="text-sm font-semibold font-display text-foreground">
              {allNavItems.find(i => i.path === location.pathname)?.label || 'UniConnect Hub'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4.5 w-4.5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent animate-pulse-dot" />
            </Button>
            <Avatar className="h-8 w-8 md:hidden">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {currentUser ? getInitials(currentUser.name) : '?'}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-card border-b border-border overflow-hidden"
            >
              <nav className="p-3 space-y-1">
                {allNavItems.map(item => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* AI Chatbot */}
      <AIChatBot />
    </div>
  );
}