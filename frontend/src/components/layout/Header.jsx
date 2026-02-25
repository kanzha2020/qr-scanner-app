import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/App';
import { Leaf, ShoppingCart, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Header = ({ variant = 'consumer' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, cart, openCart } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const farmerLinks = [
    { path: '/farmer', label: 'Dashboard' },
    { path: '/farmer/products', label: 'My Products' },
    { path: '/farmer/orders', label: 'Orders' },
  ];

  const consumerLinks = [
    { path: '/browse', label: 'Browse' },
    { path: '/orders', label: 'My Orders' },
  ];

  const links = variant === 'farmer' ? farmerLinks : consumerLinks;

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
            data-testid="header-logo"
          >
            <img 
              src="https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/lhuchfmv_0middle-logo.png" 
              alt="0middle" 
              className="h-12 w-auto"
            />
            <span className="hidden sm:inline text-lg font-semibold text-primary" style={{ fontFamily: 'Playfair Display, serif' }}>
              <span className="font-mono">0</span>middle
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.path 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid={`nav-${link.label.toLowerCase().replace(' ', '-')}`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {variant === 'consumer' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={openCart}
                className="relative"
                data-testid="cart-btn"
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </Button>
            )}

            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm text-muted-foreground">+91 {user.phone}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleLogout}
                  data-testid="logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => navigate('/login')}
                className="hidden md:flex btn-pill bg-primary text-primary-foreground"
                data-testid="login-btn"
              >
                Login
              </Button>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-2">
              {links.map((link) => (
                <button
                  key={link.path}
                  onClick={() => {
                    navigate(link.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === link.path 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {link.label}
                </button>
              ))}
              {user ? (
                <button
                  onClick={handleLogout}
                  className="text-left px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="text-left px-3 py-2 rounded-lg bg-primary text-primary-foreground"
                >
                  Login
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
