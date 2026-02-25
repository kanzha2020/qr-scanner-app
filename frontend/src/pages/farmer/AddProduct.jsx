import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/layout/Header';
import { useAuth } from '@/App';
import { addFarmerProduct, getFarmers } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Info, TrendingUp, Calculator, Upload, Image, Clock } from 'lucide-react';

// Varieties and market prices by category - STAPLES ONLY
const CATEGORY_VARIETIES = {
  'Rice': {
    varieties: [
      { name: 'Basmati Rice', regular: { min: 80, max: 120, avg: 95 }, organic: { min: 120, max: 180, avg: 145 } },
      { name: 'Sona Masoori', regular: { min: 50, max: 75, avg: 60 }, organic: { min: 80, max: 110, avg: 90 } },
      { name: 'Ponni Rice', regular: { min: 45, max: 65, avg: 55 }, organic: { min: 70, max: 100, avg: 85 } },
      { name: 'Brown Rice', regular: { min: 70, max: 100, avg: 85 }, organic: { min: 100, max: 140, avg: 120 } },
      { name: 'Kolam Rice', regular: { min: 55, max: 80, avg: 65 }, organic: { min: 85, max: 120, avg: 100 } },
    ]
  },
  'Pulses': {
    varieties: [
      { name: 'Toor Dal', regular: { min: 110, max: 150, avg: 125 }, organic: { min: 150, max: 200, avg: 170 } },
      { name: 'Moong Dal', regular: { min: 120, max: 160, avg: 140 }, organic: { min: 160, max: 220, avg: 185 } },
      { name: 'Chana Dal', regular: { min: 80, max: 110, avg: 95 }, organic: { min: 110, max: 150, avg: 130 } },
      { name: 'Urad Dal', regular: { min: 100, max: 140, avg: 120 }, organic: { min: 140, max: 190, avg: 160 } },
      { name: 'Masoor Dal', regular: { min: 90, max: 120, avg: 105 }, organic: { min: 120, max: 160, avg: 140 } },
    ]
  },
  'Flour': {
    varieties: [
      { name: 'Whole Wheat Atta', regular: { min: 40, max: 60, avg: 50 }, organic: { min: 65, max: 90, avg: 75 } },
      { name: 'Multigrain Atta', regular: { min: 55, max: 80, avg: 65 }, organic: { min: 80, max: 110, avg: 95 } },
      { name: 'Besan (Gram Flour)', regular: { min: 80, max: 110, avg: 95 }, organic: { min: 110, max: 150, avg: 130 } },
      { name: 'Rice Flour', regular: { min: 50, max: 70, avg: 60 }, organic: { min: 75, max: 100, avg: 85 } },
      { name: 'Ragi Flour', regular: { min: 60, max: 90, avg: 75 }, organic: { min: 90, max: 130, avg: 110 } },
    ]
  },
  'Spices': {
    varieties: [
      { name: 'Turmeric Powder', regular: { min: 180, max: 280, avg: 220 }, organic: { min: 280, max: 400, avg: 330 } },
      { name: 'Red Chilli Powder', regular: { min: 200, max: 320, avg: 250 }, organic: { min: 300, max: 450, avg: 360 } },
      { name: 'Coriander Powder', regular: { min: 150, max: 220, avg: 180 }, organic: { min: 220, max: 320, avg: 260 } },
      { name: 'Cumin Seeds', regular: { min: 280, max: 400, avg: 330 }, organic: { min: 380, max: 550, avg: 450 } },
      { name: 'Black Pepper', regular: { min: 500, max: 700, avg: 600 }, organic: { min: 650, max: 900, avg: 750 } },
    ]
  },
  'Sweeteners': {
    varieties: [
      { name: 'Jaggery (Gud)', regular: { min: 60, max: 100, avg: 80 }, organic: { min: 100, max: 150, avg: 120 } },
      { name: 'Jaggery Powder', regular: { min: 80, max: 120, avg: 95 }, organic: { min: 120, max: 170, avg: 140 } },
      { name: 'Palm Jaggery', regular: { min: 150, max: 220, avg: 180 }, organic: { min: 200, max: 300, avg: 250 } },
      { name: 'Honey', regular: { min: 250, max: 400, avg: 320 }, organic: { min: 400, max: 600, avg: 500 } },
      { name: 'Coconut Sugar', regular: { min: 200, max: 300, avg: 250 }, organic: { min: 280, max: 400, avg: 340 } },
    ]
  },
  'Other': {
    varieties: [
      { name: 'Coconut Oil', regular: { min: 180, max: 280, avg: 220 }, organic: { min: 280, max: 400, avg: 330 } },
      { name: 'Groundnut Oil', regular: { min: 160, max: 240, avg: 200 }, organic: { min: 240, max: 350, avg: 290 } },
      { name: 'Mustard Oil', regular: { min: 150, max: 220, avg: 180 }, organic: { min: 220, max: 320, avg: 260 } },
    ]
  }
};

// Default prices for custom "Other" entries
const DEFAULT_OTHER_PRICE = { min: 50, max: 200, avg: 100 };

const AddProduct = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [productImage, setProductImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [form, setForm] = useState({
    name: '',
    category: '',
    variety: '',
    customVariety: '',
    isOrganic: false,
    price_per_kg: '',
    quantity_available: '',
    harvest_date: '',
    processing_type: '',
    description: ''
  });

  const categories = ['Rice', 'Pulses', 'Flour', 'Spices', 'Sweeteners', 'Other'];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    
    // Reset variety when category changes
    if (field === 'category') {
      setForm(prev => ({ ...prev, [field]: value, variety: '', customVariety: '' }));
    }
  };

  // Get varieties for selected category
  const getVarieties = () => {
    if (!form.category) return [];
    const categoryData = CATEGORY_VARIETIES[form.category];
    return categoryData ? [...categoryData.varieties.map(v => v.name), 'Other'] : ['Other'];
  };

  // Get market price for selected variety
  const getMarketPrice = () => {
    if (!form.category) return null;
    
    // If "Other" is selected, try to find similar product or use default
    if (form.variety === 'Other') {
      if (form.customVariety) {
        // Search across all categories for similar product
        const searchTerm = form.customVariety.toLowerCase();
        for (const cat of Object.values(CATEGORY_VARIETIES)) {
          for (const variety of cat.varieties) {
            if (variety.name.toLowerCase().includes(searchTerm) || 
                searchTerm.includes(variety.name.toLowerCase().split(' ')[0])) {
              return form.isOrganic ? variety.organic : variety.regular;
            }
          }
        }
      }
      // Return category average or default
      const categoryData = CATEGORY_VARIETIES[form.category];
      if (categoryData && categoryData.varieties.length > 0) {
        const avgPrice = {
          min: Math.round(categoryData.varieties.reduce((s, v) => s + (form.isOrganic ? v.organic.min : v.regular.min), 0) / categoryData.varieties.length),
          max: Math.round(categoryData.varieties.reduce((s, v) => s + (form.isOrganic ? v.organic.max : v.regular.max), 0) / categoryData.varieties.length),
          avg: Math.round(categoryData.varieties.reduce((s, v) => s + (form.isOrganic ? v.organic.avg : v.regular.avg), 0) / categoryData.varieties.length)
        };
        return avgPrice;
      }
      return form.isOrganic 
        ? { min: DEFAULT_OTHER_PRICE.min * 1.4, max: DEFAULT_OTHER_PRICE.max * 1.4, avg: DEFAULT_OTHER_PRICE.avg * 1.4 }
        : DEFAULT_OTHER_PRICE;
    }
    
    // Find selected variety
    const categoryData = CATEGORY_VARIETIES[form.category];
    if (!categoryData) return null;
    
    const variety = categoryData.varieties.find(v => v.name === form.variety);
    if (!variety) return null;
    
    return form.isOrganic ? variety.organic : variety.regular;
  };

  const marketPrice = getMarketPrice();

  // Calculate potential earnings
  const calculateEarnings = () => {
    const price = parseFloat(form.price_per_kg) || 0;
    const quantity = parseFloat(form.quantity_available) || 0;

    if (price > 0 && quantity > 0) {
      return {
        perOrder: price,
        ifSoldAll: price * quantity
      };
    }
    return null;
  };

  const earnings = calculateEarnings();

  // Price comparison
  const getPriceStatus = () => {
    if (!marketPrice || !form.price_per_kg) return null;
    const price = parseFloat(form.price_per_kg);

    if (price < marketPrice.min) return { status: 'low', message: 'Below market range - consider increasing' };
    if (price > marketPrice.max) return { status: 'high', message: 'Above market range - may sell slower' };
    if (price >= marketPrice.avg - 10 && price <= marketPrice.avg + 10) return { status: 'optimal', message: 'Competitive price!' };
    return { status: 'good', message: 'Within market range' };
  };

  const priceStatus = getPriceStatus();

  // Get final product name
  const getProductName = () => {
    let name = form.variety === 'Other' ? form.customVariety : form.variety;
    if (!name) name = form.name;
    if (form.isOrganic && name && !name.toLowerCase().includes('organic')) {
      name = `Organic ${name}`;
    }
    return name;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const productName = getProductName();
    
    // Detailed validation with specific error messages
    if (!form.category) {
      toast.error('Please select a category');
      return;
    }
    
    if (!form.variety) {
      toast.error('Please select a product type');
      return;
    }
    
    if (form.variety === 'Other' && !form.customVariety) {
      toast.error('Please enter the product name');
      return;
    }
    
    if (!form.price_per_kg) {
      toast.error('Please enter the price per KG');
      return;
    }
    
    if (!form.quantity_available) {
      toast.error('Please enter the quantity available');
      return;
    }

    setLoading(true);
    try {
      const farmersRes = await getFarmers();
      const currentFarmer = user?.farmer || farmersRes.data[0];

      await addFarmerProduct(currentFarmer.id, {
        name: productName,
        category: form.category,
        price_per_kg: parseFloat(form.price_per_kg),
        quantity_available: parseFloat(form.quantity_available),
        harvest_date: form.harvest_date,
        processing_type: form.isOrganic ? `${form.processing_type} (Organic)`.trim() : form.processing_type,
        description: form.description
      });

      toast.success('Product added successfully!');
      navigate('/farmer/products');
    } catch (err) {
      toast.error('Failed to add product');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="add-product-page">
      <Header variant="farmer" />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/farmer/products')}
          className="mb-6 text-muted-foreground hover:text-foreground"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="heading-2 text-xl">Add New Product</CardTitle>
            {/* 7-Day Payment Info */}
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium">7-Day Payment Cycle</p>
                <p className="text-xs text-blue-600">
                  Payments are released 7 days after delivery to handle returns. You receive 100% of your price.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Image className="w-4 h-4 text-primary" /> Product Photo
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Product preview" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setProductImage(null);
                          setImagePreview(null);
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        data-testid="product-image-input"
                      />
                      <div className="py-6">
                        <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload photo of your produce
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Show actual product for better sales
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <Select value={form.category} onValueChange={(v) => handleChange('category', v)}>
                  <SelectTrigger data-testid="category-select">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Variety - shows after category is selected */}
              {form.category && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Type *</label>
                  <Select value={form.variety} onValueChange={(v) => handleChange('variety', v)}>
                    <SelectTrigger data-testid="variety-select">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {getVarieties().map((variety) => (
                        <SelectItem key={variety} value={variety}>{variety}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Custom variety input - shows when "Other" is selected */}
              {form.variety === 'Other' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Enter Product Name *</label>
                  <Input
                    data-testid="custom-variety-input"
                    placeholder="e.g., Organic Kodo Millet"
                    value={form.customVariety}
                    onChange={(e) => handleChange('customVariety', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">We'll try to suggest market price based on similar products</p>
                </div>
              )}

              {/* Organic Toggle */}
              {(form.variety || form.customVariety) && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Is this product organic?</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange('isOrganic', false)}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                        !form.isOrganic
                          ? 'border-primary bg-primary/5 text-primary font-medium'
                          : 'border-border hover:border-primary/30'
                      }`}
                      data-testid="organic-no"
                    >
                      No, Regular
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('isOrganic', true)}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                        form.isOrganic
                          ? 'border-green-600 bg-green-50 text-green-700 font-medium'
                          : 'border-border hover:border-green-300'
                      }`}
                      data-testid="organic-yes"
                    >
                      ✓ Yes, Organic
                    </button>
                  </div>
                  {form.isOrganic && (
                    <p className="text-xs text-green-600">Organic products typically sell at 30-50% higher prices</p>
                  )}
                </div>
              )}

              {/* Price with Market Recommendation */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Price per KG (₹) *</label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      data-testid="price-input"
                      type="number"
                      placeholder="e.g., 85"
                      value={form.price_per_kg}
                      onChange={(e) => handleChange('price_per_kg', e.target.value)}
                    />
                  </div>

                  {/* Market Price Indicator */}
                  {marketPrice && (
                    <div className="w-48 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-1 text-blue-700 text-xs font-medium mb-1">
                        <TrendingUp className="w-3 h-3" /> Market Price
                      </div>
                      <div className="text-sm text-blue-900 font-medium">
                        ₹{marketPrice.min} - ₹{marketPrice.max}/kg
                      </div>
                      <div className="text-xs text-blue-600">
                        Avg: ₹{marketPrice.avg}/kg
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Status */}
                {priceStatus && (
                  <div className={`text-sm flex items-center gap-1 ${
                    priceStatus.status === 'optimal' ? 'text-green-600' :
                    priceStatus.status === 'low' ? 'text-amber-600' :
                    priceStatus.status === 'high' ? 'text-amber-600' :
                    'text-green-600'
                  }`}>
                    <Info className="w-3 h-3" />
                    {priceStatus.message}
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity Available (KG) *</label>
                <Input
                  data-testid="quantity-input"
                  type="number"
                  placeholder="e.g., 500"
                  value={form.quantity_available}
                  onChange={(e) => handleChange('quantity_available', e.target.value)}
                />
              </div>

              {/* Potential Earnings Card */}
              {earnings && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-green-700 font-medium mb-3">
                      <Calculator className="w-5 h-5" />
                      Your Potential Earnings
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-green-600 mb-1">Per KG sold</p>
                        <p className="text-xl font-bold text-green-800">₹{earnings.perOrder}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600 mb-1">If all {form.quantity_available}kg sold</p>
                        <p className="text-xl font-bold text-green-800">₹{earnings.ifSoldAll.toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-xs text-green-600 mt-3 pt-3 border-t border-green-200">
                      💰 You receive 100% of product price. 0middle charges zero commission.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Harvest Date and Processing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Harvest Date</label>
                  <Input
                    data-testid="harvest-date-input"
                    type="date"
                    value={form.harvest_date}
                    onChange={(e) => handleChange('harvest_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Processing Type</label>
                  <Input
                    data-testid="processing-input"
                    placeholder="e.g., Sun-dried, Cold-pressed"
                    value={form.processing_type}
                    onChange={(e) => handleChange('processing_type', e.target.value)}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  data-testid="description-input"
                  placeholder="Describe your product..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full btn-pill bg-primary text-primary-foreground"
                data-testid="submit-product-btn"
              >
                {loading ? 'Adding...' : 'Add Product'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AddProduct;
