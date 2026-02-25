import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/Header';
import { useAuth } from '@/App';
import { getFarmerOrders, getFarmers, updateOrderStatus } from '@/lib/api';
import { toast } from 'sonner';
import { Package, MapPin, User, IndianRupee, ChevronDown, ChevronUp } from 'lucide-react';

const FarmerOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    try {
      const farmersRes = await getFarmers();
      const currentFarmer = user?.farmer || farmersRes.data[0];
      
      if (currentFarmer) {
        const res = await getFarmerOrders(currentFarmer.id);
        setOrders(res.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      loadOrders();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const statusSteps = ['placed', 'packed', 'shipped', 'delivered'];

  const getNextStatus = (currentStatus) => {
    const currentIndex = statusSteps.indexOf(currentStatus);
    return currentIndex < statusSteps.length - 1 ? statusSteps[currentIndex + 1] : null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'packed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="farmer-orders-page">
      <Header variant="farmer" />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="heading-2 text-2xl">Orders</h1>
          <p className="caption-text mt-1">Manage orders from consumers</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
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
              <p className="body-text">Orders will appear here when consumers buy your products</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Order Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    data-testid={`order-${order.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-semibold">{order.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Order #{order.id} • {order.quantity_kg}kg
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={`${getStatusColor(order.status)} border`}>
                          {order.status}
                        </Badge>
                        <p className="font-bold text-primary">₹{order.pricing?.farmer_receives}</p>
                        {expandedOrder === order.id ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedOrder === order.id && (
                    <div className="border-t px-4 py-4 bg-muted/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Customer Details */}
                        <div>
                          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                            <User className="w-4 h-4" /> Customer Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="text-muted-foreground">Name:</span> {order.consumer_name}</p>
                            <p><span className="text-muted-foreground">Phone:</span> +91 {order.consumer_phone}</p>
                            <p className="flex items-start gap-1">
                              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                              {order.delivery_address}
                            </p>
                          </div>
                        </div>

                        {/* Payout Details */}
                        <div>
                          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                            <IndianRupee className="w-4 h-4" /> Your Payout
                          </h4>
                          <div className="bg-card p-3 rounded-lg space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Product Value</span>
                              <span>₹{order.pricing?.product_cost}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground text-xs">
                              <span>Packaging (paid by consumer)</span>
                              <span>-₹{order.pricing?.packaging_cost}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground text-xs">
                              <span>Shipping (paid by consumer)</span>
                              <span>-₹{order.pricing?.shipping_cost}</span>
                            </div>
                            <div className="flex justify-between font-bold border-t pt-2">
                              <span>You Receive</span>
                              <span className="text-primary">₹{order.pricing?.farmer_receives}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status Update */}
                      {getNextStatus(order.status) && (
                        <div className="mt-4 pt-4 border-t flex justify-end">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(order.id, getNextStatus(order.status));
                            }}
                            className="btn-pill bg-primary text-primary-foreground"
                            data-testid={`update-status-${order.id}`}
                          >
                            Mark as {getNextStatus(order.status)}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default FarmerOrders;
