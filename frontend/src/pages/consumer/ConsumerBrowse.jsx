import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/Header';
import { useAuth } from '@/App';
import { getProducts, getCategories } from '@/lib/api';
import { toast } from 'sonner';
import { Search, MapPin, User, Filter, ShoppingCart, Plus } from 'lucide-react';

const ConsumerBrowse = () => {
  const navigate = useNavigate();
  const { addToCart } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategoriesList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        getProducts(selectedCategory || undefined),
        getCategories()
      ]);
      setProducts(productsRes.data);
      setCategoriesList(categoriesRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.farmer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleQuickBuy = (e, product) => {
    e.stopPropagation();
    addToCart(product, 1, true); // true = open cart drawer
    toast.success(`Added ${product.name} to cart`);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="consumer-browse-page">
      <Header variant="consumer" />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-r from-primary/10 to-secondary/10 p-8 md:p-12">
          <div className="relative z-10">
            <h1 className="heading-1 text-3xl md:text-4xl mb-2">Buy Direct from Farmers</h1>
            <p className="body-text text-lg max-w-xl">
              Fresh staples delivered straight from the farm. Know your farmer, see the price breakdown, 
              and support local agriculture.
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              data-testid="search-input"
              placeholder="Search products or farmers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('')}
              className="btn-pill shrink-0"
              data-testid="filter-all"
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat)}
                className="btn-pill shrink-0"
                data-testid={`filter-${cat.toLowerCase()}`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-xl" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="py-16 text-center">
            <CardContent>
              <Filter className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="heading-3 text-lg mb-2">No products found</h3>
              <p className="body-text">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="card-hover overflow-hidden cursor-pointer"
                onClick={() => navigate(`/product/${product.id}`)}
                data-testid={`product-card-${product.id}`}
              >
                <div className="relative">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <Badge className="absolute top-3 left-3 bg-card/90 text-foreground">
                    {product.category}
                  </Badge>
                </div>
                
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg leading-tight">{product.name}</h3>
                    <p className="text-xl font-bold text-primary shrink-0 ml-2">
                      ₹{product.price_per_kg}<span className="text-sm font-normal text-muted-foreground">/kg</span>
                    </p>
                  </div>
                  
                  {/* Farmer Info */}
                  <div className="flex items-center gap-3 py-3 border-t border-b border-border/50 my-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">{product.farmer_name}</p>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {product.farmer_village}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{product.quantity_available}kg available</span>
                    <Button
                      size="sm"
                      onClick={(e) => handleQuickBuy(e, product)}
                      className="btn-pill bg-primary text-primary-foreground text-xs px-3 h-8"
                      data-testid={`quick-buy-${product.id}`}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Platform Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            <strong className="text-foreground">0middle connects, not sells.</strong> Every product is owned and priced by the farmer. 
            We only add transparent service fees for packaging and shipping.
          </p>
        </div>
      </main>
    </div>
  );
};

export default ConsumerBrowse;
