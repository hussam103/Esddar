import { ReactNode } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { Redirect } from 'wouter';
import { BarChart3, Database, Settings, LogOut, Layers, Bell, RefreshCw, AlertTriangle, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ModeToggle } from '@/components/layout/mode-toggle';
import { LanguageToggle } from '@/components/layout/language-toggle';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const { t, language, direction } = useLanguage();
  
  // If not logged in, redirect to login page
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  // If not admin, redirect to dashboard
  if (user.role !== 'admin') {
    return <Redirect to="/" />;
  }
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const navItems = [
    {
      label: t('Dashboard'),
      icon: <BarChart3 className="h-5 w-5" />,
      href: '/admin'
    },
    {
      label: t('Scrape Logs'),
      icon: <Terminal className="h-5 w-5" />,
      href: '/admin/scrape-logs'
    },
    {
      label: t('Data Sources'),
      icon: <Database className="h-5 w-5" />,
      href: '/admin/sources'
    },
    {
      label: t('System Logs'),
      icon: <AlertTriangle className="h-5 w-5" />,
      href: '/admin/logs'
    },
    {
      label: t('Jobs'),
      icon: <RefreshCw className="h-5 w-5" />,
      href: '/admin/jobs'
    },
    {
      label: t('Settings'),
      icon: <Settings className="h-5 w-5" />,
      href: '/admin/settings'
    }
  ];
  
  return (
    <div className="flex min-h-screen">
      {/* Admin Sidebar */}
      <div className={`w-64 min-h-screen bg-background border-${direction === 'rtl' ? 'l' : 'r'} fixed top-0 ${direction === 'rtl' ? 'right-0' : 'left-0'} z-10`}>
        <div className="p-4 h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8 pt-4">
            <Link href="/">
              <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                {language === 'ar' ? 'إدارة' : 'Admin'}
              </span>
            </Link>
          </div>
          
          {/* Nav Links */}
          <nav className={`flex-1 ${direction === 'rtl' ? 'pr-2' : 'pl-2'}`}>
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    {({ isActive }) => (
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={`w-full justify-${direction === 'rtl' ? 'end' : 'start'} gap-2 py-6`}
                      >
                        {direction === 'rtl' ? (
                          <>
                            {item.label}
                            {item.icon}
                          </>
                        ) : (
                          <>
                            {item.icon}
                            {item.label}
                          </>
                        )}
                      </Button>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* User Profile and Theme Toggle */}
          <div className="pt-4 pb-2 mt-auto border-t">
            <div className="flex items-center gap-2 mb-4">
              <Avatar>
                <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{user.username}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <ModeToggle />
              <LanguageToggle />
              <Button variant="outline" size="icon" onClick={handleLogout} className="ml-auto">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className={`flex-1 ${direction === 'rtl' ? 'pr-64' : 'pl-64'}`}>
        {/* Top navigation bar */}
        <header className="h-16 border-b flex items-center px-4 sticky top-0 bg-background z-10">
          <h1 className="text-lg font-medium">{t('Admin Control Panel')}</h1>
          
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                {t('Exit Admin')}
              </Link>
            </Button>
            
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary" />
            </Button>
          </div>
        </header>
        
        {/* Page content */}
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
}