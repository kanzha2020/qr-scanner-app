import { useState, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

// Pages
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RoleSelectPage from "@/pages/RoleSelectPage";
import FarmerLogin from "@/pages/farmer/FarmerLogin";
import FarmerOnboarding from "@/pages/farmer/FarmerOnboarding";
import FarmerDashboard from "@/pages/farmer/FarmerDashboard";
import FarmerProducts from "@/pages/farmer/FarmerProducts";
import FarmerOrders from "@/pages/farmer/FarmerOrders";
import AddProduct from "@/pages/farmer/AddProduct";
import ConsumerBrowse from "@/pages/consumer/ConsumerBrowse";
import ProductDetail from "@/pages/consumer/ProductDetail";
import CartPage from "@/pages/consumer/CartPage";
import CheckoutPage from "@/pages/consumer/CheckoutPage";
import OrderConfirmation from "@/pages/consumer/OrderConfirmation";
import OrderTracking from "@/pages/consumer/OrderTracking";
import CartDrawer from "@/components/CartDrawer";

// Auth Context
export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    setCart([]);
  };

  const addToCart = (product, quantity, openDrawer = false) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity }]);
    }
    // Don't force cart open - let user continue browsing
    if (openDrawer) {
      setCartOpen(true);
    }
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.product.id !== productId));
    } else {
      setCart(cart.map(item => 
        item.product.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const openCart = () => setCartOpen(true);

  return (
    <AuthContext.Provider value={{ user, login, logout, cart, addToCart, updateCartQuantity, removeFromCart, clearCart, openCart, cartOpen, setCartOpen }}>
      <div className="app-container">
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/select-role" element={<RoleSelectPage />} />
            
            {/* Farmer Routes */}
            <Route path="/farmer/login" element={<FarmerLogin />} />
            <Route path="/farmer/onboarding" element={<FarmerOnboarding />} />
            <Route path="/farmer" element={<FarmerDashboard />} />
            <Route path="/farmer/products" element={<FarmerProducts />} />
            <Route path="/farmer/products/add" element={<AddProduct />} />
            <Route path="/farmer/orders" element={<FarmerOrders />} />
            
            {/* Consumer Routes */}
            <Route path="/browse" element={<ConsumerBrowse />} />
            <Route path="/product/:productId" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
            <Route path="/orders" element={<OrderTracking />} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* Global Cart Drawer */}
          <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </div>
    </AuthContext.Provider>
  );
}

export default App;
