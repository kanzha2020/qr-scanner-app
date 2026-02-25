import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import { useAuth } from '@/App';
import { getFarmerProducts, getFarmers, toggleProductLive } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Package, Calendar, Rocket, ArrowDownCircle } from 'lucide-react';

const FarmerProducts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [user]);

  const loadProducts = async () => {
    try {
      const farmersRes = await getFarmers();
      const currentFarmer = user?.farmer || farmersRes.data[0];
      
      if (currentFarmer) {
        const res = await getFarmerProducts(currentFarmer.id);
        setProducts(res.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleToggleLive = async (productId, currentStatus) => {
    try {
      await toggleProductLive(productId);
      
      // Update local state
      setProducts(products.map(p => 
        p.id === productId ? { ...p, is_live: !currentStatus } : p
      ));
      
      if (!currentStatus) {
        toast.success('Product is now LIVE! Consumers can see it.');
      } else {
        toast.info('Product pulled back from listing.');
      }
    } catch (err) {
      toast.error('Failed to update product status');
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="farmer-products-page">
      <Header variant="farmer" />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="heading-2 text-2xl">My Products</h1>
            <p className="caption-text mt-1">Manage your product listings</p>
          </div>
          
          <Button 
            onClick={() => navigate('/farmer/products/add')}
            className="btn-pill bg-primary text-primary-foreground"
            data-testid="add-product-btn"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-xl" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <Card className="py-16 text-center">
            <CardContent>
              <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="heading-3 text-lg mb-2">No products yet</h3>
              <p className="body-text mb-6">Start by adding your first product listing</p>
              <Button 
                onClick={() => navigate('/farmer/products/add')}
                className="btn-pill bg-primary text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Your First Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="card-hover overflow-hidden">
                <div className="relative">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  {/* Live Status Badge */}
                  {product.is_live && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      LIVE
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                        {product.category}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-primary">
                      ₹{product.price_per_kg}<span className="text-sm font-normal">/kg</span>
                    </p>
                  </div>
                  
                  <p className="caption-text line-clamp-2 mb-3">{product.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3 mb-3">
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      {product.quantity_available}kg available
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {product.harvest_date || 'Not set'}
                    </div>
                  </div>

                  {/* Go Live / Pull Back Button */}
                  <Button
                    onClick={() => handleToggleLive(product.id, product.is_live)}
                    className={`w-full btn-pill ${
                      product.is_live 
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                    data-testid={`toggle-live-${product.id}`}
                  >
                    {product.is_live ? (
                      <>
                        <ArrowDownCircle className="w-4 h-4 mr-2" />
                        Pull Back My Product
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4 mr-2" />
                        Let's Go Live
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Note */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Only products marked as "Live" will be visible to consumers. 
              Use "Pull Back" to temporarily hide a product without deleting it.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FarmerProducts;
