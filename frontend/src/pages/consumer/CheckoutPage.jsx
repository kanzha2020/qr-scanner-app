import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Header from '@/components/layout/Header';
import { useAuth } from '@/App';
import { createOrder } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, User, Package, Truck, Check, Leaf } from 'lucide-react';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user, cart, clearCart } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState([]);
  const hasInitialized = useRef(false);
  const [form, setForm] = useState({
    name: '',
    phone: user?.phone || '',
    address: ''
  });

  // Store cart items on mount to prevent redirect issues
  useEffect(() => {
    if (!hasInitialized.current && cart.length > 0) {
      setCheckoutItems([...cart]);
      hasInitialized.current = true;
    }
  }, [cart]);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  // Calculate totals using checkoutItems (preserved from initial cart)
  const itemsToUse = checkoutItems.length > 0 ? checkoutItems : cart;
  
  const calculateItemTotal = (item) => {
    const productCost = item.quantity * item.product.price_per_kg;
    const packagingCost = item.quantity * 5;
    const shippingCost = 40 + (item.quantity * 8);
    return {
      productCost,
      packagingCost,
      shippingCost,
      total: productCost + packagingCost + shippingCost
    };
  };

  const cartTotal = itemsToUse.reduce((sum, item) => sum + calculateItemTotal(item).total, 0);
  const farmerTotal = itemsToUse.reduce((sum, item) => sum + (item.quantity * item.product.price_per_kg), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name || !form.phone || !form.address) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      // Create orders for each cart item (one per farmer/product)
      const orderPromises = itemsToUse.map(item => 
        createOrder({
          product_id: item.product.id,
          quantity_kg: item.quantity,
          consumer_phone: form.phone,
          consumer_name: form.name,
          delivery_address: form.address
        })
      );

      const results = await Promise.all(orderPromises);
      const firstOrderId = results[0].data.id;
      
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order-confirmation/${firstOrderId}`);
    } catch (err) {
      toast.error('Failed to place order');
      console.error(err);
    }
    setLoading(false);
  };

  // Redirect only if no items at all (not during checkout process)
  if (cart.length === 0 && checkoutItems.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="checkout-page">
      <Header variant="consumer" />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/cart')}
          className="mb-6 text-muted-foreground hover:text-foreground"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Cart
        </Button>

        <h1 className="heading-2 text-2xl mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Delivery Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="heading-3 text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" /> Delivery Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name *</label>
                      <Input
                        data-testid="name-input"
                        placeholder="Enter your name"
                        value={form.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number *</label>
                      <Input
                        data-testid="phone-input"
                        placeholder="10-digit number"
                        value={form.phone}
                        onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Delivery Address *</label>
                    <Textarea
                      data-testid="address-input"
                      placeholder="Enter your complete address including city and pincode"
                      rows={3}
                      value={form.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="heading-3 text-lg flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" /> Order Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {itemsToUse.map((item) => (
                    <div 
                      key={item.product.id} 
                      className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg"
                    >
                      <img 
                        src={item.product.image} 
                        alt={item.product.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity}kg × ₹{item.product.price_per_kg}/kg
                        </p>
                        <p className="text-xs text-primary flex items-center gap-1 mt-1">
                          <User className="w-3 h-3" />
                          From {item.product.farmer_name || 'Farmer'}
                        </p>
                      </div>
                      <p className="font-bold">₹{calculateItemTotal(item).total}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Platform Note */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Leaf className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-primary mb-1">Direct from Farmer</h4>
                      <p className="text-sm text-muted-foreground">
                        Your order ships directly from the farmer's location. 0middle provides packaging and logistics 
                        coordination but never owns or resells the products.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 btn-pill bg-primary text-primary-foreground text-lg"
                data-testid="place-order-btn"
              >
                {loading ? 'Placing Order...' : `Place Order • ₹${cartTotal}`}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="heading-3 text-lg">Price Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-primary" />
                      Farmers receive
                    </span>
                    <span className="font-medium">₹{farmerTotal}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Packaging
                    </span>
                    <span>₹{itemsToUse.reduce((sum, item) => sum + (item.quantity * 5), 0)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Shipping
                    </span>
                    <span>₹{itemsToUse.reduce((sum, item) => sum + 40 + (item.quantity * 8), 0)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-green-600">
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Commission
                    </span>
                    <span>₹0</span>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-xl">
                    <span>Total</span>
                    <span className="text-primary">₹{cartTotal}</span>
                  </div>
                </div>

                <p className="text-xs text-center text-muted-foreground pt-2">
                  100% of product price goes to farmers. Service fees cover packaging and delivery only.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;
