"""
Test suite for 0middle platform - New Features Testing
Tests for:
1. New products (Coconut Sugar, Channa Dal, Buffalo Ghee, Brown Rice, Black Pepper)
2. PIN code lookup API
3. Products API with correct images and prices
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://zeromiddle.preview.emergentagent.com').rstrip('/')

class TestNewProducts:
    """Test the 5 new products added to the platform"""
    
    def test_products_api_returns_data(self):
        """Test that products API returns data"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✓ Products API returned {len(data)} products")
    
    def test_coconut_sugar_exists(self):
        """Test Coconut Sugar product (p24) exists with correct data"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        
        coconut_sugar = next((p for p in products if p['name'] == 'Coconut Sugar'), None)
        assert coconut_sugar is not None, "Coconut Sugar product not found"
        assert coconut_sugar['id'] == 'p24'
        assert coconut_sugar['category'] == 'Sweeteners'
        assert coconut_sugar['price_per_kg'] == 280
        assert coconut_sugar['market_price'] == 350
        assert 'Cocunut.Sugar' in coconut_sugar['image'] or 'coconut' in coconut_sugar['image'].lower()
        print(f"✓ Coconut Sugar: ₹{coconut_sugar['price_per_kg']}/kg (Market: ₹{coconut_sugar['market_price']})")
    
    def test_channa_dal_exists(self):
        """Test Channa Dal product (p25) exists with correct data"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        
        channa_dal = next((p for p in products if p['name'] == 'Channa Dal'), None)
        assert channa_dal is not None, "Channa Dal product not found"
        assert channa_dal['id'] == 'p25'
        assert channa_dal['category'] == 'Pulses'
        assert channa_dal['price_per_kg'] == 105
        assert channa_dal['market_price'] == 150
        assert 'Channa.Dal' in channa_dal['image'] or 'channa' in channa_dal['image'].lower()
        print(f"✓ Channa Dal: ₹{channa_dal['price_per_kg']}/kg (Market: ₹{channa_dal['market_price']})")
    
    def test_buffalo_ghee_exists(self):
        """Test Buffalo Ghee product (p26) exists with correct data"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        
        buffalo_ghee = next((p for p in products if p['name'] == 'Buffalo Ghee'), None)
        assert buffalo_ghee is not None, "Buffalo Ghee product not found"
        assert buffalo_ghee['id'] == 'p26'
        assert buffalo_ghee['category'] == 'Dairy'
        assert buffalo_ghee['price_per_kg'] == 480
        assert buffalo_ghee['market_price'] == 600
        assert 'Buffalo.Ghee' in buffalo_ghee['image'] or 'buffalo' in buffalo_ghee['image'].lower()
        print(f"✓ Buffalo Ghee: ₹{buffalo_ghee['price_per_kg']}/kg (Market: ₹{buffalo_ghee['market_price']})")
    
    def test_brown_rice_exists(self):
        """Test Brown Rice product (p27) exists with correct data"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        
        brown_rice = next((p for p in products if p['name'] == 'Brown Rice'), None)
        assert brown_rice is not None, "Brown Rice product not found"
        assert brown_rice['id'] == 'p27'
        assert brown_rice['category'] == 'Rice'
        assert brown_rice['price_per_kg'] == 75
        assert brown_rice['market_price'] == 110
        assert 'Brown.Rice' in brown_rice['image'] or 'brown' in brown_rice['image'].lower()
        print(f"✓ Brown Rice: ₹{brown_rice['price_per_kg']}/kg (Market: ₹{brown_rice['market_price']})")
    
    def test_black_pepper_exists(self):
        """Test Black Pepper product (p28) exists with correct data"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        
        black_pepper = next((p for p in products if p['name'] == 'Black Pepper'), None)
        assert black_pepper is not None, "Black Pepper product not found"
        assert black_pepper['id'] == 'p28'
        assert black_pepper['category'] == 'Spices'
        assert black_pepper['price_per_kg'] == 750
        assert black_pepper['market_price'] == 900
        assert 'Black.Pepper' in black_pepper['image'] or 'pepper' in black_pepper['image'].lower()
        print(f"✓ Black Pepper: ₹{black_pepper['price_per_kg']}/kg (Market: ₹{black_pepper['market_price']})")


class TestGSTRates:
    """Test GST rates are correctly applied by category"""
    
    def test_sweeteners_gst_5_percent(self):
        """Sweeteners should have 5% GST (Coconut Sugar)"""
        response = requests.get(f"{BASE_URL}/api/products/p24/pricing?quantity_kg=1")
        assert response.status_code == 200
        pricing = response.json()
        assert pricing['gst_rate'] == 5, f"Expected 5% GST for Sweeteners, got {pricing['gst_rate']}%"
        print(f"✓ Coconut Sugar (Sweeteners) GST: {pricing['gst_rate']}%")
    
    def test_pulses_gst_0_percent(self):
        """Pulses should have 0% GST (Channa Dal)"""
        response = requests.get(f"{BASE_URL}/api/products/p25/pricing?quantity_kg=1")
        assert response.status_code == 200
        pricing = response.json()
        assert pricing['gst_rate'] == 0, f"Expected 0% GST for Pulses, got {pricing['gst_rate']}%"
        print(f"✓ Channa Dal (Pulses) GST: {pricing['gst_rate']}%")
    
    def test_dairy_gst_5_percent(self):
        """Dairy should have 5% GST (Buffalo Ghee)"""
        response = requests.get(f"{BASE_URL}/api/products/p26/pricing?quantity_kg=1")
        assert response.status_code == 200
        pricing = response.json()
        assert pricing['gst_rate'] == 5, f"Expected 5% GST for Dairy, got {pricing['gst_rate']}%"
        print(f"✓ Buffalo Ghee (Dairy) GST: {pricing['gst_rate']}%")
    
    def test_rice_gst_0_percent(self):
        """Rice should have 0% GST (Brown Rice)"""
        response = requests.get(f"{BASE_URL}/api/products/p27/pricing?quantity_kg=1")
        assert response.status_code == 200
        pricing = response.json()
        assert pricing['gst_rate'] == 0, f"Expected 0% GST for Rice, got {pricing['gst_rate']}%"
        print(f"✓ Brown Rice (Rice) GST: {pricing['gst_rate']}%")
    
    def test_spices_gst_5_percent(self):
        """Spices should have 5% GST (Black Pepper)"""
        response = requests.get(f"{BASE_URL}/api/products/p28/pricing?quantity_kg=1")
        assert response.status_code == 200
        pricing = response.json()
        assert pricing['gst_rate'] == 5, f"Expected 5% GST for Spices, got {pricing['gst_rate']}%"
        print(f"✓ Black Pepper (Spices) GST: {pricing['gst_rate']}%")


class TestPinCodeLookup:
    """Test PIN code lookup API for farmer onboarding"""
    
    def test_valid_pincode_686001(self):
        """Test PIN code 686001 returns Kottayam, Kerala"""
        response = requests.get(f"{BASE_URL}/api/pincode/686001")
        assert response.status_code == 200
        data = response.json()
        assert data['city'] == 'Kottayam'
        assert data['state'] == 'Kerala'
        assert data['district'] == 'Kottayam'
        print(f"✓ PIN 686001: {data['city']}, {data['district']}, {data['state']}")
    
    def test_valid_pincode_600001(self):
        """Test PIN code 600001 returns Chennai, Tamil Nadu"""
        response = requests.get(f"{BASE_URL}/api/pincode/600001")
        assert response.status_code == 200
        data = response.json()
        assert data['city'] == 'Chennai'
        assert data['state'] == 'Tamil Nadu'
        print(f"✓ PIN 600001: {data['city']}, {data['state']}")
    
    def test_invalid_pincode_returns_not_found(self):
        """Test invalid PIN code returns not_found flag"""
        response = requests.get(f"{BASE_URL}/api/pincode/999999")
        assert response.status_code == 200
        data = response.json()
        assert data.get('not_found') == True or data.get('city') == ''
        print(f"✓ Invalid PIN 999999 handled correctly")


class TestProductDetails:
    """Test individual product detail endpoints"""
    
    def test_get_coconut_sugar_details(self):
        """Test getting Coconut Sugar product details"""
        response = requests.get(f"{BASE_URL}/api/products/p24")
        assert response.status_code == 200
        product = response.json()
        assert product['name'] == 'Coconut Sugar'
        assert 'farmer' in product
        assert 'traceability' in product
        print(f"✓ Coconut Sugar details: Farmer - {product['farmer']['name']}")
    
    def test_get_black_pepper_details(self):
        """Test getting Black Pepper product details"""
        response = requests.get(f"{BASE_URL}/api/products/p28")
        assert response.status_code == 200
        product = response.json()
        assert product['name'] == 'Black Pepper'
        assert product['farmer']['name'] == 'Kavitha Nair'  # f10
        assert product['farmer']['state'] == 'Kerala'
        print(f"✓ Black Pepper details: Farmer - {product['farmer']['name']} from {product['farmer']['state']}")


class TestMarketPrices:
    """Test market prices are correctly set for new products"""
    
    def test_all_new_products_have_market_prices(self):
        """Verify all 5 new products have market prices in MARKET_PRICES dict"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        
        new_product_names = ['Coconut Sugar', 'Channa Dal', 'Buffalo Ghee', 'Brown Rice', 'Black Pepper']
        
        for name in new_product_names:
            product = next((p for p in products if p['name'] == name), None)
            assert product is not None, f"{name} not found"
            assert product['market_price'] > 0, f"{name} has no market price"
            assert product['savings_pct'] > 0, f"{name} has no savings percentage"
            print(f"✓ {name}: Market ₹{product['market_price']}, Save {product['savings_pct']}%")


class TestCategories:
    """Test categories API includes all product categories"""
    
    def test_categories_include_dairy(self):
        """Test that Dairy category exists (for Buffalo Ghee)"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        categories = response.json()
        assert 'Dairy' in categories, "Dairy category not found"
        print(f"✓ Categories: {categories}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
