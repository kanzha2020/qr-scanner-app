import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/App';
import { getProducts, getCategories, getPlatformInfo } from '@/lib/api';
import { toast } from 'sonner';
import { Search, MapPin, User, Leaf, ShoppingCart, Plus, Sprout, ChevronDown, Star } from 'lucide-react';

// Star Rating Component
const StarRating = ({ rating, size = 'sm' }) => {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : star - 0.5 <= rating
              ? 'fill-yellow-400/50 text-yellow-400'
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { addToCart, cart, openCart } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategoriesList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [platformInfo, setPlatformInfo] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, platformRes] = await Promise.all([
        getProducts(selectedCategory || undefined),
        getCategories(),
        getPlatformInfo()
      ]);
      setProducts(productsRes.data);
      setCategoriesList(categoriesRes.data);
      setPlatformInfo(platformRes.data);
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
    // Default to smallest weight option or 1kg
    const defaultWeight = product.weight_options ? product.weight_options[0] : 1;
    addToCart(product, defaultWeight, false); // Don't force cart open
    toast.success(`Added ${product.name} to cart`);
  };

  const scrollToProducts = () => {
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo - More Prominent */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img 
                src="https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/lhuchfmv_0middle-logo.png" 
                alt="0middle" 
                className="h-12 w-auto"
              />
              <span className="hidden sm:inline text-lg font-semibold text-primary" style={{ fontFamily: 'Playfair Display, serif' }}>
                <span className="font-mono">0</span>middle
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={openCart}
                className="relative"
                data-testid="cart-btn"
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </Button>
              
              <Button
                onClick={() => navigate('/farmer/login')}
                className="btn-pill bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="farmers-corner-btn"
              >
                <Sprout className="w-4 h-4 mr-2" />
                Farmer's Corner
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Compact */}
      <section className="bg-gradient-to-b from-primary/5 to-transparent py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Leaf className="w-4 h-4" />
            Farm-Direct Staples • Zero Middlemen
          </div>
          
          <h1 className="heading-1 text-3xl md:text-5xl max-w-3xl mx-auto leading-tight mb-4">
            Direct Staples from <span className="text-secondary">Farmers</span>
          </h1>
          
          <p className="body-text text-base md:text-lg max-w-xl mx-auto mb-6">
            Premium staples at transparent prices. No middlemen. See exactly where your money goes — farmers keep more.
          </p>

          {/* How It Works - Compact inline */}
          <div className="mt-8 max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold mb-4">How <span className="font-mono">0</span>middle Works</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
              <div className="bg-white/80 rounded-lg p-3 border border-border/30">
                <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm mb-2">1</div>
                <p className="text-sm font-medium">Farmers List Products</p>
                <p className="text-xs text-muted-foreground">They set their own prices</p>
              </div>
              <div className="bg-primary/10 rounded-lg p-3 border border-primary/30">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm mb-2">
                  <span className="font-mono">0</span>
                </div>
                <p className="text-sm font-medium text-primary"><span className="font-mono">0</span>middle Connects</p>
                <p className="text-xs text-muted-foreground">We connect, not sell — farmers go to market</p>
              </div>
              <div className="bg-white/80 rounded-lg p-3 border border-border/30">
                <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm mb-2">2</div>
                <p className="text-sm font-medium">You See Full Breakdown</p>
                <p className="text-xs text-muted-foreground">Farmer price + service fees</p>
              </div>
              <div className="bg-white/80 rounded-lg p-3 border border-border/30">
                <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm mb-2">3</div>
                <p className="text-sm font-medium">Ships Direct from Farm</p>
                <p className="text-xs text-muted-foreground">No middlemen, zero commission</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={scrollToProducts}
            variant="outline"
            className="btn-pill border-primary text-primary mt-6"
          >
            Browse Staples <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Products Section */}
      <section id="products-section" className="max-w-6xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
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
                  {product.savings_pct > 0 && (
                    <Badge className="absolute top-3 right-3 bg-green-600 text-white">
                      Save {product.savings_pct}%
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg leading-tight">{product.name}</h3>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-xl font-bold text-primary">
                        ₹{product.price_per_kg}<span className="text-sm font-normal text-muted-foreground">/kg</span>
                      </p>
                      {product.market_price > 0 && (
                        <p className="text-xs text-muted-foreground line-through">
                          ₹{product.market_price}/kg
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Farmer Info */}
                  <div className="flex items-center gap-3 py-3 border-t border-b border-border/50 my-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                      {product.farmer_image ? (
                        <img src={product.farmer_image} alt={product.farmer_name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className="text-sm flex-1">
                      <p className="font-medium">{product.farmer_name}</p>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {product.farmer_village}
                      </p>
                    </div>
                    {/* Rating */}
                    {product.rating && (
                      <div className="flex items-center gap-1">
                        <StarRating rating={product.rating} size="sm" />
                        <span className="text-xs text-muted-foreground">({product.review_count})</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{product.quantity_available}kg available</span>
                    <Button
                      size="sm"
                      onClick={(e) => handleQuickBuy(e, product)}
                      className="btn-pill bg-primary text-primary-foreground text-xs px-3 h-8"
                      data-testid={`quick-buy-${product.id}`}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            <span style={{ fontFamily: 'monospace' }}>0</span>middle
          </h3>
          <p className="text-primary-foreground/80 text-sm">
            Infrastructure for farm-direct commerce. We don't own products or set prices.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
