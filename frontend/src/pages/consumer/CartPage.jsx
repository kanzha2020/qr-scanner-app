import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Header from '@/components/layout/Header';
import { useAuth } from '@/App';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ArrowLeft } from 'lucide-react';

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, addToCart } = useAuth();

  const updateQuantity = (product, delta) => {
    const currentItem = cart.find(item => item.product.id === product.id);
    const newQuantity = currentItem.quantity + delta;
    
    if (newQuantity <= 0) {
      removeFromCart(product.id);
    } else {
      // Remove and re-add with new quantity
      removeFromCart(product.id);
      addToCart(product, newQuantity);
    }
  };

  // Calculate totals
  const calculateItemTotal = (item) => {
    const productCost = item.quantity * item.product.price_per_kg;
    const packagingCost = item.quantity * 5; // ₹5/kg
    const shippingCost = 40 + (item.quantity * 8); // Base + per kg
    const serviceSubtotal = packagingCost + shippingCost;
    const gst = Math.round(serviceSubtotal * 0.18); // 18% GST on services
    return {
      productCost,
      packagingCost,
      shippingCost,
      gst,
      total: productCost + packagingCost + shippingCost + gst
    };
  };

  const packagingTotal = cart.reduce((sum, item) => sum + (item.quantity * 5), 0);
  const shippingTotal = cart.reduce((sum, item) => sum + 40 + (item.quantity * 8), 0);
  const serviceTotal = packagingTotal + shippingTotal;
  const gstTotal = Math.round(serviceTotal * 0.18);
  const farmerTotal = cart.reduce((sum, item) => sum + (item.quantity * item.product.price_per_kg), 0);
  const cartTotal = farmerTotal + packagingTotal + shippingTotal + gstTotal;

  return (
    <div className="min-h-screen bg-background" data-testid="cart-page">
      <Header variant="consumer" />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/browse')}
          className="mb-6 text-muted-foreground hover:text-foreground"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Continue Shopping
        </Button>

        <h1 className="heading-2 text-2xl mb-6">Your Cart</h1>

        {cart.length === 0 ? (
          <Card className="py-16 text-center">
            <CardContent>
              <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="heading-3 text-lg mb-2">Your cart is empty</h3>
              <p className="body-text mb-6">Browse farm-fresh products and add them to your cart</p>
              <Button 
                onClick={() => navigate('/browse')}
                className="btn-pill bg-primary text-primary-foreground"
              >
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => {
                const itemTotals = calculateItemTotal(item);
                return (
                  <Card key={item.product.id} data-testid={`cart-item-${item.product.id}`}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <img 
                          src={item.product.image} 
                          alt={item.product.name}
                          className="w-24 h-24 rounded-lg object-cover shrink-0"
                        />
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{item.product.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                From {item.product.farmer_name || 'Farmer'}
                              </p>
                              <p className="text-sm text-primary font-medium mt-1">
                                ₹{item.product.price_per_kg}/kg
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-muted-foreground hover:text-destructive"
                              data-testid={`remove-${item.product.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.product, -1)}
                                data-testid={`decrease-${item.product.id}`}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-12 text-center font-medium">{item.quantity}kg</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.product, 1)}
                                data-testid={`increase-${item.product.id}`}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="font-bold text-lg">₹{itemTotals.total}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="heading-3 text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Farmers receive</span>
                      <span>₹{farmerTotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Packaging</span>
                      <span>₹{packagingTotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>₹{shippingTotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">GST @18% (on services)</span>
                      <span>₹{gstTotal}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Platform commission</span>
                      <span>₹0</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">₹{cartTotal}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate('/checkout')}
                    className="w-full btn-pill bg-primary text-primary-foreground"
                    data-testid="checkout-btn"
                  >
                    Proceed to Checkout <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Products ship directly from farmers
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CartPage;
