import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';
import { Button } from '../components/ui/button';
import { Menu, LogOut, BarChart3, Calendar, Users, FileText, Home } from 'lucide-react';
import ThemeSwitcher from '../components/ThemeSwitcher';

const MainLayout: React.FC<React.PropsWithChildren> = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const managerNavLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/assignments', label: 'Assignments', icon: FileText },
    { to: '/projects', label: 'Projects', icon: Users },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/timeline', label: 'Timeline', icon: Calendar },
  ];

  const engineerNavLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/assignments', label: 'Assignments', icon: FileText },
    { to: '/engineer-dashboard', label: 'My Analytics', icon: BarChart3 },
  ];

  const navLinks = user?.role === 'manager' ? managerNavLinks : engineerNavLinks;

  const SidebarContent = (
    <nav className="flex flex-col gap-2 mt-4 p-4">
      {user && navLinks.map(link => {
        const Icon = link.icon;
        return (
          <Link
            key={link.to}
            to={link.to}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              location.pathname.startsWith(link.to) 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-accent hover:text-accent-foreground'
            }`}
            onClick={() => setOpen(false)}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
      {user?.role === 'engineer' && (
        <Link
          to="/profile"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            location.pathname === '/profile' 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-accent hover:text-accent-foreground'
          }`}
          onClick={() => setOpen(false)}
        >
          <Users className="h-4 w-4" />
          Profile
        </Link>
      )}
      {user && (
        <Button
          variant="outline"
          className="mt-8 text-destructive hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen w-screen flex flex-col bg-background">
      {/* Top bar for mobile */}
      <div className="w-full md:hidden flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0">
            <div className="flex flex-col h-full">
              <Link to="/" className="text-2xl font-bold my-4 px-6 text-primary" onClick={() => setOpen(false)}>
                Assignly
              </Link>
              {SidebarContent}
            </div>
          </SheetContent>
        </Sheet>
        <span className="font-bold text-lg text-primary">Assignly</span>
        <ThemeSwitcher />
      </div>
      <div className="flex flex-1">
        {/* Sidebar for desktop */}
        <aside className="hidden md:flex w-60 bg-card border-r flex-col py-6 px-4">
          <div className="flex items-center justify-between mb-8 p-6">
            <Link to="/" className="text-2xl font-bold text-primary">Assignly</Link>
            <ThemeSwitcher />
          </div>
          {SidebarContent}
        </aside>
        {/* Main content */}
        <main className="w-full flex-1 p-6 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 