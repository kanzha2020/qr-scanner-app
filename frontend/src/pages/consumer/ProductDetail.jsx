import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Header from '@/components/layout/Header';
import { useAuth } from '@/App';
import { getProduct, getProductPricing } from '@/lib/api';
import { toast } from 'sonner';
import { 
  ArrowLeft, MapPin, User, Calendar, Leaf, ShoppingCart, 
  ChevronDown, ChevronUp, Check, QrCode, Truck, Package, Star
} from 'lucide-react';

// Star Rating Component
const StarRating = ({ rating, size = 'sm' }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
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

const ProductDetail = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { addToCart } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [traceOpen, setTraceOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  useEffect(() => {
    if (product) {
      loadPricing();
    }
  }, [quantity, product]);

  const loadProduct = async () => {
    try {
      const res = await getProduct(productId);
      setProduct(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Product not found');
    }
    setLoading(false);
  };

  const loadPricing = async () => {
    try {
      const res = await getProductPricing(productId, quantity);
      setPricing(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, quantity, true); // true = open drawer
    toast.success(`Added ${quantity}kg of ${product.name} to cart`);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, true); // Add and open drawer for quick checkout
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

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header variant="consumer" />
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h2 className="heading-2">Product not found</h2>
          <Button onClick={() => navigate('/browse')} className="mt-4">
            Back to Browse
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="product-detail-page">
      <Header variant="consumer" />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/browse')}
          className="mb-6 text-muted-foreground hover:text-foreground"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Browse
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full aspect-square object-cover"
              />
              <Badge className="absolute top-4 left-4 bg-card/90 text-foreground">
                {product.category}
              </Badge>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="heading-1 text-3xl mb-2">{product.name}</h1>
              {/* Rating Display */}
              {product.rating && (
                <div className="flex items-center gap-2 mb-2">
                  <StarRating rating={product.rating} />
                  <span className="text-sm font-medium">{product.rating}</span>
                  <span className="text-sm text-muted-foreground">
                    ({product.review_count} reviews)
                  </span>
                </div>
              )}
              <p className="body-text">{product.description}</p>
            </div>

            {/* Farmer Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <img 
                    src={product.farmer?.image} 
                    alt={product.farmer?.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Sold by</p>
                    <p className="font-semibold text-lg">{product.farmer?.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {product.farmer?.village}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Farmer Price</p>
                    <p className="text-2xl font-bold text-primary">₹{product.price_per_kg}</p>
                    <p className="text-sm text-muted-foreground">per kg</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Harvest Date</p>
                  <p className="font-medium">{product.harvest_date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Leaf className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Processing</p>
                  <p className="font-medium">{product.processing_type}</p>
                </div>
              </div>
            </div>

            {/* Traceability Section */}
            <Collapsible open={traceOpen} onOpenChange={setTraceOpen}>
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:bg-muted/30 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium">Product Traceability</p>
                        <p className="text-sm text-muted-foreground">See the complete journey</p>
                      </div>
                    </div>
                    {traceOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </CardContent>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="mt-2 border-dashed" data-testid="traceability-section">
                  <CardContent className="p-4">
                    {/* Mock QR Code */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="qr-placeholder shrink-0">
                        <QrCode className="w-12 h-12 text-primary/50" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium mb-1">Scan for verification</p>
                        <p className="text-muted-foreground">
                          Each product comes with a QR code linking to its complete journey from farm to your door.
                        </p>
                      </div>
                    </div>

                    {/* Journey Timeline */}
                    <div className="relative pl-6 space-y-4">
                      <div className="timeline-connector" />
                      {product.traceability?.journey?.map((step, idx) => (
                        <div key={idx} className="relative flex items-start gap-3">
                          <div className={`absolute -left-6 w-8 h-8 rounded-full flex items-center justify-center ${
                            idx === product.traceability.journey.length - 1 
                              ? 'bg-secondary text-secondary-foreground' 
                              : 'bg-primary/10 text-primary'
                          }`}>
                            <Check className="w-4 h-4" />
                          </div>
                          <div className="pt-1">
                            <p className="font-medium">{step.step}</p>
                            <p className="text-sm text-muted-foreground">
                              {step.date} • {step.location}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            {/* Quantity and Pricing */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <label className="font-medium">Quantity (kg):</label>
                  <Input
                    data-testid="quantity-input"
                    type="number"
                    min="1"
                    max={product.quantity_available}
                    value={quantity}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 1);
                      // Limit to available quantity
                      setQuantity(Math.min(val, product.quantity_available));
                    }}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    Max {product.quantity_available}kg available
                  </span>
                </div>
                {quantity >= product.quantity_available && (
                  <p className="text-xs text-amber-600">
                    You've selected the maximum available quantity from this farmer.
                  </p>
                )}

                {/* Price Breakdown */}
                {pricing && (
                  <div className="border-t pt-4 space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground mb-3">Transparent Price Breakdown</h4>
                    
                    <div className="price-row">
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        Farmer receives
                      </span>
                      <span className="font-medium">
                        ₹{pricing.farmer_receives} <span className="text-muted-foreground text-xs">({pricing.product_cost_pct}%)</span>
                      </span>
                    </div>
                    
                    <div className="price-row text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Packaging <span className="text-xs italic">(includes our cost)</span>
                      </span>
                      <span>₹{pricing.packaging_cost} <span className="text-xs">({pricing.packaging_cost_pct}%)</span></span>
                    </div>
                    
                    <div className="price-row text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Shipping <span className="text-xs italic">(includes our cost)</span>
                      </span>
                      <span>₹{pricing.shipping_cost} <span className="text-xs">({pricing.shipping_cost_pct}%)</span></span>
                    </div>
                    
                    <div className="price-row text-sm text-muted-foreground">
                      <span>Fixed Platform fees <span className="text-xs">(0middle)</span></span>
                      <span>₹{pricing.platform_fee} <span className="text-xs">({pricing.platform_fee_pct}%)</span></span>
                    </div>
                    
                    <div className="price-row text-sm text-muted-foreground">
                      <span>GST ({pricing.gst_rate}%)</span>
                      <span>₹{pricing.gst} <span className="text-xs">({pricing.gst_pct}%)</span></span>
                    </div>
                    
                    {pricing.savings > 0 && (
                      <div className="price-row text-sm text-green-600 border-t pt-2">
                        <span>Your savings vs market price</span>
                        <span className="font-medium">₹{pricing.savings} ({pricing.savings_pct}%)</span>
                      </div>
                    )}
                    
                    <div className="price-row border-t pt-3">
                      <span className="font-bold">Total</span>
                      <span className="price-total">₹{pricing.total}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleAddToCart}
                className="flex-1 btn-pill border-2 border-primary text-primary hover:bg-primary/5"
                data-testid="add-to-cart-btn"
              >
                <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
              </Button>
              <Button
                onClick={handleBuyNow}
                className="flex-1 btn-pill bg-primary text-primary-foreground"
                data-testid="buy-now-btn"
              >
                Buy from {product.farmer?.name?.split(' ')[0]}
              </Button>
            </div>

            {/* Trust Badge */}
            <p className="text-center text-sm text-muted-foreground">
              Ships directly from {product.farmer?.village}. 0middle ensures quality packaging.
            </p>
          </div>
        </div>

        {/* Customer Reviews Section */}
        {product.reviews && product.reviews.length > 0 && (
          <div className="mt-12">
            <Collapsible open={reviewsOpen} onOpenChange={setReviewsOpen}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <h3 className="font-semibold text-lg">Customer Reviews</h3>
                    <Badge variant="secondary">{product.review_count} reviews</Badge>
                    <div className="flex items-center gap-1 ml-2">
                      <StarRating rating={product.rating} size="sm" />
                      <span className="text-sm font-medium ml-1">{product.rating}</span>
                    </div>
                  </div>
                  {reviewsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-4 space-y-4">
                  {product.reviews.map((review) => (
                    <Card key={review.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{review.reviewer_name}</p>
                              {review.verified_purchase && (
                                <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
                                  <Check className="w-3 h-3 mr-1" /> Verified Purchase
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <StarRating rating={review.rating} size="sm" />
                              <span className="text-xs text-muted-foreground">
                                {new Date(review.date).toLocaleDateString('en-IN', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductDetail;
