import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import { getOrder } from '@/lib/api';
import { Check, Package, Truck, Home, ArrowRight, MapPin, User } from 'lucide-react';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const res = await getOrder(orderId);
      setOrder(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header variant="consumer" />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="order-confirmation-page">
      <Header variant="consumer" />
      
      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="heading-1 text-3xl text-green-600 mb-2">Order Confirmed!</h1>
          <p className="body-text">
            Your order has been placed and will be shipped directly from the farmer.
          </p>
        </div>

        {/* Order Details */}
        {order && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono font-bold text-lg">{order.id}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium">
                  {order.status}
                </span>
              </div>

              <div className="border-t pt-4 space-y-4">
                {/* Product */}
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{order.product_name}</p>
                    <p className="text-sm text-muted-foreground">{order.quantity_kg}kg</p>
                  </div>
                </div>

                {/* Farmer */}
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Shipping from</p>
                    <p className="font-medium">{order.farmer_name}, {order.farmer_village}</p>
                  </div>
                </div>

                {/* Delivery */}
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Delivering to</p>
                    <p className="font-medium">{order.delivery_address}</p>
                  </div>
                </div>
              </div>

              {/* Price Summary */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Farmer receives</span>
                  <span>₹{order.pricing?.farmer_receives}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Service fees</span>
                  <span>₹{order.pricing?.packaging_cost + order.pricing?.shipping_cost}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Paid</span>
                  <span className="text-primary">₹{order.pricing?.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expected Journey */}
        <Card className="mb-6 bg-muted/30">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">What happens next?</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium">Order Placed</p>
                  <p className="text-sm text-muted-foreground">Your order is confirmed</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium">Packed by Farmer</p>
                  <p className="text-sm text-muted-foreground">Fresh from the farm</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium">Shipped Direct</p>
                  <p className="text-sm text-muted-foreground">Straight from farm to you</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium">Delivered</p>
                  <p className="text-sm text-muted-foreground">At your doorstep</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => navigate('/orders')}
            className="flex-1 btn-pill bg-primary text-primary-foreground"
            data-testid="track-order-btn"
          >
            Track Order <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/browse')}
            className="flex-1 btn-pill border-2"
            data-testid="continue-shopping-btn"
          >
            Continue Shopping
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          0middle connects you directly with farmers. No middlemen.
        </p>
      </main>
    </div>
  );
};

export default OrderConfirmation;
