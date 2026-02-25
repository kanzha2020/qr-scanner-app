import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/Header';
import { useAuth } from '@/App';
import { getConsumerOrders } from '@/lib/api';
import { Package, MapPin, User, Check, Truck, Clock, ChevronRight } from 'lucide-react';

const OrderTracking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.phone) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      const res = await getConsumerOrders(user.phone);
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'placed': return Clock;
      case 'packed': return Package;
      case 'shipped': return Truck;
      case 'delivered': return Check;
      default: return Clock;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed': return 'bg-amber-100 text-amber-800';
      case 'packed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const statusSteps = ['placed', 'packed', 'shipped', 'delivered'];

  const getStatusProgress = (currentStatus) => {
    return statusSteps.indexOf(currentStatus) + 1;
  };

  return (
    <div className="min-h-screen bg-background" data-testid="order-tracking-page">
      <Header variant="consumer" />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="heading-2 text-2xl mb-6">My Orders</h1>

        {!user?.phone ? (
          <Card className="py-16 text-center">
            <CardContent>
              <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="heading-3 text-lg mb-2">Login to view orders</h3>
              <p className="body-text mb-6">Please login to see your order history</p>
              <Button 
                onClick={() => navigate('/login')}
                className="btn-pill bg-primary text-primary-foreground"
              >
                Login
              </Button>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card className="py-16 text-center">
            <CardContent>
              <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="heading-3 text-lg mb-2">No orders yet</h3>
              <p className="body-text mb-6">Start shopping to see your orders here</p>
              <Button 
                onClick={() => navigate('/browse')}
                className="btn-pill bg-primary text-primary-foreground"
              >
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const StatusIcon = getStatusIcon(order.status);
              const progress = getStatusProgress(order.status);
              
              return (
                <Card key={order.id} data-testid={`order-${order.id}`}>
                  <CardContent className="p-6">
                    {/* Order Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Order ID</p>
                        <p className="font-mono font-bold">{order.id}</p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {order.status}
                      </Badge>
                    </div>

                    {/* Product Info */}
                    <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg mb-4">
                      <Package className="w-10 h-10 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">{order.product_name}</p>
                        <p className="text-sm text-muted-foreground">{order.quantity_kg}kg</p>
                      </div>
                      <p className="font-bold text-primary">₹{order.pricing?.total}</p>
                    </div>

                    {/* Farmer & Delivery */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-primary mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">From</p>
                          <p className="font-medium">{order.farmer_name}</p>
                          <p className="text-muted-foreground">{order.farmer_village}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-primary mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Delivering to</p>
                          <p className="font-medium">{order.delivery_address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between mb-2">
                        {statusSteps.map((step, idx) => {
                          const StepIcon = getStatusIcon(step);
                          const isActive = idx < progress;
                          const isCurrent = idx === progress - 1;
                          
                          return (
                            <div 
                              key={step} 
                              className={`flex flex-col items-center ${
                                isActive ? 'text-primary' : 'text-muted-foreground'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isCurrent 
                                  ? 'bg-primary text-primary-foreground' 
                                  : isActive 
                                    ? 'bg-primary/20' 
                                    : 'bg-muted'
                              }`}>
                                <StepIcon className="w-4 h-4" />
                              </div>
                              <span className="text-xs mt-1 capitalize hidden sm:block">{step}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${(progress / statusSteps.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="border-t pt-4 text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-muted-foreground">Farmer received</span>
                        <span>₹{order.pricing?.farmer_receives}</span>
                      </div>
                      <div className="flex justify-between mb-1 text-muted-foreground">
                        <span>Service fees</span>
                        <span>₹{order.pricing?.packaging_cost + order.pricing?.shipping_cost}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>₹{order.pricing?.total}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Platform Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            All orders ship directly from farmers. 0middle coordinates logistics and ensures quality packaging.
          </p>
        </div>
      </main>
    </div>
  );
};

export default OrderTracking;
