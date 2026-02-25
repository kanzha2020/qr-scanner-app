import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/App';
import { createOrder, sendOTP, verifyOTP, lookupPincode } from '@/lib/api';
import { toast } from 'sonner';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, User, Package, Truck, Check, Phone, CreditCard, Smartphone, TrendingDown, MapPin, Loader2, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_BACKEND_URL || '';

const CartDrawer = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateCartQuantity, clearCart } = useAuth();
  const [step, setStep] = useState('cart'); // 'cart' | 'phone' | 'otp' | 'address'
  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [form, setForm] = useState({ name: '', pincode: '', city: '', state: '', address: '' });
  const [paymentMethod, setPaymentMethod] = useState('upi');

  // PIN code lookup
  useEffect(() => {
    const lookupPin = async () => {
      if (form.pincode.length === 6) {
        setPincodeLoading(true);
        try {
          const res = await lookupPincode(form.pincode);
          if (!res.data.not_found) {
            setForm(prev => ({
              ...prev,
              city: res.data.city,
              state: res.data.state
            }));
          } else {
            setForm(prev => ({ ...prev, city: '', state: '' }));
          }
        } catch (err) {
          console.error('PIN lookup failed:', err);
        }
        setPincodeLoading(false);
      }
    };
    lookupPin();
  }, [form.pincode]);

  const updateQuantity = (product, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(product.id);
    } else {
      updateCartQuantity(product.id, newQuantity);
    }
  };

  const PLATFORM_FEE = 7;
  
  // GST rates by category
  const GST_RATES = {
    "Rice": 0,
    "Flour": 0,
    "Pulses": 0,
    "Spices": 0.05,
    "Sweeteners": 0.05,
    "Dairy": 0.05,
  };

  const getBreakdown = () => {
    const productCost = cart.reduce((sum, item) => sum + (item.quantity * item.product.price_per_kg), 0);
    const packagingCost = cart.reduce((sum, item) => sum + (item.quantity * 5), 0);
    const shippingCost = cart.reduce((sum, item) => sum + 40 + (item.quantity * 8), 0);
    const platformFee = PLATFORM_FEE;
    
    // Calculate GST based on product categories
    // If mixed categories, use highest applicable rate
    const hasSpices = cart.some(item => item.product.category === 'Spices');
    const hasSweeteners = cart.some(item => item.product.category === 'Sweeteners');
    const gstRate = (hasSpices || hasSweeteners) ? 0.05 : 0;
    
    const subtotal = productCost + packagingCost + shippingCost + platformFee;
    const gst = Math.round(subtotal * gstRate * 100) / 100;
    const total = Math.round((subtotal + gst) * 100) / 100;
    
    // Calculate market price total and savings
    const marketPriceTotal = cart.reduce((sum, item) => {
      const marketPrice = item.product.market_price || item.product.price_per_kg;
      return sum + (item.quantity * marketPrice);
    }, 0);
    const savings = marketPriceTotal - productCost;
    
    // Calculate percentages
    const productPct = total > 0 ? ((productCost / total) * 100).toFixed(1) : 0;
    const packagingPct = total > 0 ? ((packagingCost / total) * 100).toFixed(1) : 0;
    const shippingPct = total > 0 ? ((shippingCost / total) * 100).toFixed(1) : 0;
    const platformPct = total > 0 ? ((platformFee / total) * 100).toFixed(1) : 0;
    const gstPct = total > 0 ? ((gst / total) * 100).toFixed(1) : 0;
    
    return { 
      productCost, productPct,
      packagingCost, packagingPct,
      shippingCost, shippingPct,
      platformFee, platformPct,
      gst, gstPct,
      gstRate: gstRate * 100,
      total,
      marketPriceTotal,
      savings
    };
  };

  const breakdown = getBreakdown();

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    setPhoneError('');
    try {
      // Check for duplicate phone - but for consumers we allow registered phones to continue
      // (they are returning customers)
      const res = await sendOTP(phone);
      setDemoOtp(res.data.demo_otp);
      toast.success(`OTP sent! (Demo: ${res.data.demo_otp})`);
      setStep('otp');
    } catch (err) {
      toast.error('Failed to send OTP');
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOTP(phone, otp);
      if (res.data.verified) {
        toast.success('Phone verified!');
        setStep('address');
      } else {
        toast.error('Invalid OTP');
      }
    } catch (err) {
      toast.error('Verification failed');
    }
    setLoading(false);
  };

  const handlePlaceOrder = async () => {
    if (!form.name || !form.pincode || !form.address) {
      toast.error('Please fill all fields');
      return;
    }
    
    if (form.pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit PIN code');
      return;
    }

    // Construct full address with city/state
    const fullAddress = `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`;

    setLoading(true);
    try {
      const orderPromises = cart.map(item =>
        createOrder({
          product_id: item.product.id,
          quantity_kg: item.quantity,
          consumer_phone: phone,
          consumer_name: form.name,
          delivery_address: fullAddress
        })
      );

      const results = await Promise.all(orderPromises);
      const firstOrderId = results[0].data.id;

      clearCart();
      onOpenChange(false);
      setStep('cart');
      setPhone('');
      setOtp('');
      setForm({ name: '', pincode: '', city: '', state: '', address: '' });
      toast.success('Order placed! Shipping directly from farmer.');
      navigate(`/order-confirmation/${firstOrderId}`);
    } catch (err) {
      toast.error('Failed to place order');
    }
    setLoading(false);
  };

  const resetAndClose = () => {
    setStep('cart');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={resetAndClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            <ShoppingBag className="w-5 h-5" />
            {step === 'cart' && 'Your Cart'}
            {step === 'phone' && 'Enter Phone'}
            {step === 'otp' && 'Verify OTP'}
            {step === 'address' && 'Checkout'}
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Your cart is empty</p>
            <Button
              onClick={() => { onOpenChange(false); navigate('/'); }}
              className="mt-4 btn-pill bg-primary text-primary-foreground"
            >
              Browse Products
            </Button>
          </div>
        ) : step === 'cart' ? (
          <>
            {/* Cart Items - Static quantity display (no dropdown) */}
            <div className="flex-1 overflow-auto py-4 space-y-3">
              {cart.map((item) => (
                <div key={item.product.id} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">₹{item.product.price_per_kg}/{item.product.unit_type === 'liquid' ? 'L' : 'kg'}</p>
                    
                    {/* Static Quantity Display */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm bg-muted px-2 py-1 rounded">
                        {item.quantity < 1 ? `${item.quantity * 1000}${item.product.unit_type === 'liquid' ? 'ml' : 'g'}` : `${item.quantity}${item.product.unit_type === 'liquid' ? 'L' : 'kg'}`}
                      </span>
                      <span className="text-sm font-medium text-primary">
                        ₹{(item.quantity * item.product.price_per_kg).toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" 
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Simple Summary for Cart View */}
            <div className="border-t pt-4 space-y-3">
              {/* Farmer Earnings - Show how much farmer receives */}
              <div className="flex items-center justify-between text-primary bg-primary/5 p-2 rounded-lg">
                <span className="flex items-center gap-1 text-sm">
                  <User className="w-4 h-4" /> Farmer receives
                </span>
                <span className="font-bold">₹{breakdown.productCost.toFixed(0)}</span>
              </div>
              
              {breakdown.savings > 0 && (
                <div className="flex items-center justify-between text-green-600 bg-green-50 p-2 rounded-lg">
                  <span className="flex items-center gap-1 text-sm">
                    <TrendingDown className="w-4 h-4" /> You save vs market price
                  </span>
                  <span className="font-bold">₹{breakdown.savings}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">₹{breakdown.total}</span>
              </div>
              <Button onClick={() => setStep('phone')} className="w-full btn-pill bg-primary text-primary-foreground" data-testid="checkout-btn">
                Checkout <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <p className="text-xs text-center text-muted-foreground">Ships directly from farmers</p>
            </div>
          </>
        ) : step === 'phone' ? (
          <>
            <div className="flex-1 flex flex-col justify-center py-8 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground">Enter your phone number to place order</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">+91</span>
                  <Input
                    data-testid="checkout-phone-input"
                    type="tel"
                    placeholder="10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="pl-12 h-12 text-lg"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <Button onClick={handleSendOTP} disabled={loading || phone.length !== 10} className="w-full h-12 btn-pill bg-primary text-primary-foreground" data-testid="send-otp-checkout">
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
              <Button variant="ghost" onClick={() => setStep('cart')} className="w-full">← Back to Cart</Button>
            </div>
          </>
        ) : step === 'otp' ? (
          <>
            <div className="flex-1 flex flex-col justify-center py-8 space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">OTP sent to <span className="font-medium text-foreground">+91 {phone}</span></p>
                
                <div className="space-y-2 max-w-xs mx-auto">
                  <label className="text-sm font-medium">Enter 6-digit OTP</label>
                  <Input
                    data-testid="checkout-otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="h-14 text-2xl text-center tracking-[0.5em] font-mono"
                  />
                </div>

                {demoOtp && (
                  <p className="text-sm bg-secondary/10 text-secondary p-2 rounded-lg mt-4">
                    Demo OTP: <span className="font-mono font-bold">{demoOtp}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <Button onClick={handleVerifyOTP} disabled={loading || otp.length !== 6} className="w-full h-12 btn-pill bg-primary text-primary-foreground" data-testid="verify-otp-checkout">
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
              <Button variant="ghost" onClick={() => { setStep('phone'); setOtp(''); }} className="w-full">← Change Number</Button>
            </div>
          </>
        ) : (
          <>
            {/* Address Form & Full Price Breakdown */}
            <div className="flex-1 overflow-auto py-4 space-y-4">
              <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm flex items-center gap-2">
                <Check className="w-4 h-4" /> Phone verified: +91 {phone}
              </div>

              <div className="space-y-3">
                {/* Name */}
                <div>
                  <label className="text-sm font-medium">Your Name</label>
                  <Input placeholder="Enter your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="drawer-name-input" />
                </div>
                
                {/* Shipping PIN Code */}
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> Shipping PIN Code
                  </label>
                  <div className="relative">
                    <Input 
                      type="text"
                      inputMode="numeric"
                      placeholder="6-digit PIN code" 
                      value={form.pincode} 
                      onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} 
                      data-testid="drawer-pincode-input" 
                    />
                    {pincodeLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* City & State display */}
                  {(form.city || form.state) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-2 text-sm">
                      <p className="text-green-800 font-medium">
                        {form.city}{form.city && form.state && ', '}{form.state}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Delivery Address */}
                <div>
                  <label className="text-sm font-medium">Delivery Address</label>
                  <Textarea placeholder="House/Flat No, Street, Landmark" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} data-testid="drawer-address-input" />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3 rounded-lg border-2 flex items-center gap-2 text-sm ${
                      paymentMethod === 'upi' 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-lg border-2 flex items-center gap-2 text-sm ${
                      paymentMethod === 'card' 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Card
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {paymentMethod === 'upi' ? 'Pay via PhonePe, Google Pay, or any UPI app' : 'Pay via Credit/Debit card'}
                </p>
              </div>

              {/* Full Price Breakdown with Percentages */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <p className="font-semibold text-sm border-b pb-2">Price Breakdown</p>
                
                {/* Market Price Comparison */}
                {breakdown.marketPriceTotal > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Market Price Total</span>
                    <span className="line-through">₹{breakdown.marketPriceTotal}</span>
                  </div>
                )}
                
                {/* Farmer Price */}
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> Farmers receive
                  </span>
                  <span>₹{breakdown.productCost} <span className="text-muted-foreground text-xs">({breakdown.productPct}%)</span></span>
                </div>
                
                {/* Packaging */}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4" /> Packaging <span className="text-xs italic">(includes our cost)</span>
                  </span>
                  <span>₹{breakdown.packagingCost} <span className="text-xs">({breakdown.packagingPct}%)</span></span>
                </div>
                
                {/* Shipping */}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Logistics <span className="text-xs italic">(includes our cost)</span>
                  </span>
                  <span>₹{breakdown.shippingCost} <span className="text-xs">({breakdown.shippingPct}%)</span></span>
                </div>
                
                {/* Platform Fee */}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Fixed Platform fees <span className="text-xs">(0middle)</span></span>
                  <span>₹{breakdown.platformFee} <span className="text-xs">({breakdown.platformPct}%)</span></span>
                </div>
                
                {/* GST */}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>GST ({breakdown.gstRate}%)</span>
                  <span>₹{breakdown.gst} <span className="text-xs">({breakdown.gstPct}%)</span></span>
                </div>
                
                {/* Savings */}
                {breakdown.savings > 0 && (
                  <div className="flex justify-between text-sm text-green-600 border-t pt-2">
                    <span className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" /> Your Savings
                    </span>
                    <span className="font-medium">₹{breakdown.savings}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">₹{breakdown.total}</span>
              </div>
              <Button onClick={handlePlaceOrder} disabled={loading} className="w-full h-12 btn-pill bg-primary text-primary-foreground" data-testid="place-order-drawer">
                {loading ? 'Placing Order...' : `Pay ₹${breakdown.total}`}
              </Button>
              <Button variant="ghost" onClick={() => setStep('cart')} className="w-full">← Back to Cart</Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
