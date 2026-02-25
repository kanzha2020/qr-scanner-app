import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import { useAuth } from '@/App';
import { getFarmerProducts, getFarmerOrders, getFarmers } from '@/lib/api';
import { toast } from 'sonner';
import { Package, ShoppingBag, IndianRupee, Plus, ArrowRight, Camera } from 'lucide-react';

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [farmer, setFarmer] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [farmerImage, setFarmerImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      // For demo, use first farmer if not logged in as specific farmer
      const farmersRes = await getFarmers();
      const currentFarmer = user?.farmer || farmersRes.data[0];
      setFarmer(currentFarmer);

      if (currentFarmer) {
        const [productsRes, ordersRes] = await Promise.all([
          getFarmerProducts(currentFarmer.id),
          getFarmerOrders(currentFarmer.id)
        ]);
        setProducts(productsRes.data);
        setOrders(ordersRes.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const totalRevenue = orders.reduce((sum, order) => sum + (order.pricing?.farmer_receives || 0), 0);
  const pendingOrders = orders.filter(o => o.status !== 'delivered').length;

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFarmerImage(reader.result);
        toast.success('Photo updated! Consumers can now see your face.');
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  // Check if farmer has a custom image
  const hasCustomImage = farmerImage || (farmer?.image && !farmer.image.includes('unsplash'));

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header variant="farmer" />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="farmer-dashboard">
      <Header variant="farmer" />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            {/* Profile Image with Upload */}
            <div className="relative">
              {farmerImage ? (
                <img 
                  src={farmerImage} 
                  alt={farmer?.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted border-2 border-dashed border-primary/30 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-muted-foreground/50" />
                </div>
              )}
              {/* Upload Button Overlay */}
              <button
                onClick={triggerImageUpload}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                data-testid="upload-photo-btn"
                title="Add your photo"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              {/* Hidden file input - capture="user" triggers front camera on mobile */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleImageUpload}
                className="hidden"
                data-testid="photo-input"
              />
            </div>
            <div>
              <h1 className="heading-2 text-2xl">Welcome, {farmer?.name || 'Farmer'}</h1>
              <p className="caption-text">{farmer?.village}</p>
            </div>
          </div>
          
          <Button 
            onClick={() => navigate('/farmer/products/add')}
            className="btn-pill bg-primary text-primary-foreground"
            data-testid="add-product-btn"
          >
            <Plus className="w-4 h-4 mr-2" /> Add New Product
          </Button>
        </div>

        {/* Photo Recommendation */}
        {!hasCustomImage && (
          <Card className="mb-6 bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Camera className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-amber-800">Add your photo</h4>
                  <p className="text-sm text-amber-700">
                    Consumers connect better when they see the farmer behind the produce. Add your photo to build trust!
                  </p>
                </div>
                <Button 
                  onClick={triggerImageUpload}
                  variant="outline"
                  className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
                  data-testid="add-photo-cta"
                >
                  <Camera className="w-4 h-4 mr-2" /> Add Photo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="caption-text">Total Products</p>
                  <p className="text-3xl font-bold text-primary">{products.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/5 border-secondary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="caption-text">Pending Orders</p>
                  <p className="text-3xl font-bold text-secondary">{pendingOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-accent/20 border-accent/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center">
                  <IndianRupee className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="caption-text">Total Earnings</p>
                  <p className="text-3xl font-bold text-accent-foreground">₹{totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Products Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="heading-3 text-lg">Your Products</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/farmer/products')}
                data-testid="view-all-products-btn"
              >
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No products yet. Add your first product!
                </p>
              ) : (
                <div className="space-y-3">
                  {products.slice(0, 3).map((product) => (
                    <div key={product.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="caption-text">₹{product.price_per_kg}/kg</p>
                      </div>
                      <span className="text-sm text-muted-foreground">{product.quantity_available}kg</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="heading-3 text-lg">Recent Orders</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/farmer/orders')}
                data-testid="view-all-orders-btn"
              >
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No orders yet. They'll appear here when consumers buy.
                </p>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{order.product_name}</p>
                        <p className="caption-text">{order.quantity_kg}kg • {order.consumer_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm text-primary">₹{order.pricing?.farmer_receives}</p>
                        <span className={`text-xs px-2 py-1 rounded-full status-${order.status}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Platform Note */}
        <Card className="mt-8 bg-muted/30 border-dashed">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">You own your products.</strong> 0middle only provides infrastructure — 
              packaging standards, logistics, and payments. We never take commission on your sales.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FarmerDashboard;
