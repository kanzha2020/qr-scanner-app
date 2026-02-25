#!/usr/bin/env python3
"""
0middle Platform Backend API Testing
Tests all endpoints for the farmer-to-consumer platform demo
"""

import requests
import sys
import json
from datetime import datetime

class ZeroMiddleAPITester:
    def __init__(self, base_url="https://zeromiddle.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "status": "PASS" if success else "FAIL",
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status_icon = "✅" if success else "❌"
        print(f"{status_icon} {name}: {details}")

    def run_test(self, name, method, endpoint, expected_status=200, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    details = f"Status: {response.status_code}"
                    if isinstance(response_data, dict) and 'message' in response_data:
                        details += f" | {response_data['message']}"
                    elif isinstance(response_data, list):
                        details += f" | Returned {len(response_data)} items"
                except:
                    details = f"Status: {response.status_code}"
            else:
                details = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_data = response.json()
                    if 'detail' in error_data:
                        details += f" | {error_data['detail']}"
                except:
                    pass

            self.log_test(name, success, details)
            return success, response.json() if success else {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_platform_info(self):
        """Test platform information endpoint"""
        success, data = self.run_test("Platform Info", "GET", "platform/info")
        if success:
            # Verify key platform info
            required_fields = ['name', 'tagline', 'fees', 'what_we_provide', 'what_we_dont_do']
            for field in required_fields:
                if field not in data:
                    self.log_test(f"Platform Info - {field}", False, f"Missing field: {field}")
                else:
                    self.log_test(f"Platform Info - {field}", True, f"Field present")
            
            # Check transparent fees
            if 'fees' in data:
                fees = data['fees']
                if fees.get('platform_commission') == '₹0 (Zero)':
                    self.log_test("Zero Commission Verified", True, "Platform commission is ₹0")
                else:
                    self.log_test("Zero Commission Verified", False, f"Commission: {fees.get('platform_commission')}")

    def test_auth_flow(self):
        """Test authentication flow with mock OTP"""
        # Test OTP sending
        phone = "9876543210"
        success, data = self.run_test("Send OTP", "POST", "auth/send-otp", 200, {"phone": phone})
        
        if success and data.get('demo_otp') == '123456':
            self.log_test("Mock OTP Generated", True, "Demo OTP is 123456")
            
            # Test OTP verification with correct OTP
            success, verify_data = self.run_test("Verify OTP - Valid", "POST", "auth/verify-otp", 200, 
                                               {"phone": phone, "otp": "123456"})
            
            if success and verify_data.get('verified'):
                self.log_test("OTP Verification Success", True, f"Farmer status: {verify_data.get('is_registered_farmer')}")
            
            # Test OTP verification with wrong OTP
            success, _ = self.run_test("Verify OTP - Invalid", "POST", "auth/verify-otp", 200, 
                                     {"phone": phone, "otp": "000000"})
        else:
            self.log_test("Mock OTP Generated", False, "Demo OTP not 123456")

    def test_farmers_endpoints(self):
        """Test farmer-related endpoints"""
        # Get all farmers
        success, farmers = self.run_test("Get Farmers", "GET", "farmers")
        
        if success and len(farmers) >= 3:
            self.log_test("Mock Farmers Count", True, f"Found {len(farmers)} farmers")
            
            # Verify expected farmers
            farmer_names = [f['name'] for f in farmers]
            expected_names = ['Ramesh Kumar', 'Lakshmi Devi', 'Suresh Reddy']
            
            for name in expected_names:
                if name in farmer_names:
                    self.log_test(f"Farmer {name}", True, "Found in farmers list")
                else:
                    self.log_test(f"Farmer {name}", False, "Not found in farmers list")
            
            # Test individual farmer
            farmer_id = farmers[0]['id']
            success, farmer = self.run_test("Get Individual Farmer", "GET", f"farmers/{farmer_id}")
            
            if success:
                required_fields = ['id', 'name', 'phone', 'village', 'crop_types']
                for field in required_fields:
                    if field in farmer:
                        self.log_test(f"Farmer Field - {field}", True, f"Value: {farmer.get(field)}")
                    else:
                        self.log_test(f"Farmer Field - {field}", False, "Missing field")
            
            # Test farmer products
            self.run_test("Get Farmer Products", "GET", f"farmers/{farmer_id}/products")
            
            # Test farmer orders
            self.run_test("Get Farmer Orders", "GET", f"farmers/{farmer_id}/orders")
        else:
            self.log_test("Mock Farmers Count", False, f"Expected 3+ farmers, got {len(farmers) if success else 0}")

    def test_products_endpoints(self):
        """Test product-related endpoints"""
        # Get all products
        success, products = self.run_test("Get All Products", "GET", "products")
        
        if success and len(products) >= 6:
            self.log_test("Mock Products Count", True, f"Found {len(products)} products")
            
            # Verify products have farmer info
            first_product = products[0]
            farmer_fields = ['farmer_name', 'farmer_village']
            for field in farmer_fields:
                if field in first_product:
                    self.log_test(f"Product Farmer Info - {field}", True, f"Value: {first_product.get(field)}")
                else:
                    self.log_test(f"Product Farmer Info - {field}", False, "Missing farmer info")
            
            # Test individual product
            product_id = first_product['id']
            success, product = self.run_test("Get Individual Product", "GET", f"products/{product_id}")
            
            if success:
                # Check traceability info
                if 'traceability' in product:
                    self.log_test("Product Traceability", True, "Traceability data present")
                    
                    traceability = product['traceability']
                    if 'journey' in traceability and len(traceability['journey']) > 0:
                        self.log_test("Traceability Journey", True, f"{len(traceability['journey'])} steps")
                    else:
                        self.log_test("Traceability Journey", False, "No journey steps")
                else:
                    self.log_test("Product Traceability", False, "No traceability data")
            
            # Test product pricing
            success, pricing = self.run_test("Get Product Pricing", "GET", f"products/{product_id}/pricing", 
                                           params={"quantity_kg": 2})
            
            if success:
                pricing_fields = ['product_cost', 'packaging_cost', 'shipping_cost', 'platform_fee', 'total', 'farmer_receives']
                for field in pricing_fields:
                    if field in pricing:
                        self.log_test(f"Pricing Field - {field}", True, f"₹{pricing.get(field)}")
                    else:
                        self.log_test(f"Pricing Field - {field}", False, "Missing pricing field")
                
                # Verify zero commission
                if pricing.get('platform_fee') == 0:
                    self.log_test("Zero Platform Fee", True, "Platform fee is ₹0")
                else:
                    self.log_test("Zero Platform Fee", False, f"Platform fee: ₹{pricing.get('platform_fee')}")
        else:
            self.log_test("Mock Products Count", False, f"Expected 6+ products, got {len(products) if success else 0}")

    def test_categories(self):
        """Test product categories"""
        success, categories = self.run_test("Get Categories", "GET", "categories")
        
        if success:
            expected_categories = ['Rice', 'Pulses', 'Sugar', 'Wheat', 'Spices']
            found_categories = 0
            
            for cat in expected_categories:
                if cat in categories:
                    found_categories += 1
                    self.log_test(f"Category - {cat}", True, "Found")
                else:
                    self.log_test(f"Category - {cat}", False, "Not found")
            
            self.log_test("Categories Coverage", found_categories >= 4, f"{found_categories}/{len(expected_categories)} categories found")

    def test_order_flow(self):
        """Test order creation and management"""
        # First get a product to order
        success, products = self.run_test("Get Products for Order", "GET", "products")
        
        if success and len(products) > 0:
            product = products[0]
            
            # Create an order
            order_data = {
                "product_id": product['id'],
                "quantity_kg": 2.0,
                "consumer_phone": "9876543210",
                "consumer_name": "Test Consumer",
                "delivery_address": "123 Test Street, Test City, 123456"
            }
            
            success, order = self.run_test("Create Order", "POST", "orders", 201, order_data)
            
            if success:
                order_id = order.get('id')
                self.log_test("Order ID Generated", bool(order_id), f"Order ID: {order_id}")
                
                # Verify order structure
                order_fields = ['id', 'product_name', 'farmer_name', 'pricing', 'status']
                for field in order_fields:
                    if field in order:
                        self.log_test(f"Order Field - {field}", True, f"Value: {order.get(field)}")
                    else:
                        self.log_test(f"Order Field - {field}", False, "Missing field")
                
                # Test get order
                if order_id:
                    self.run_test("Get Order", "GET", f"orders/{order_id}")
                    
                    # Test update order status
                    self.run_test("Update Order Status", "PATCH", f"orders/{order_id}/status", 200, 
                                {"status": "confirmed"})

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, data = self.run_test("Root Endpoint", "GET", "")
        if success and 'message' in data:
            if '0middle' in data['message']:
                self.log_test("Root Message Branding", True, "Contains 0middle branding")
            else:
                self.log_test("Root Message Branding", False, "Missing 0middle branding")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting 0middle Backend API Tests")
        print("=" * 50)
        
        # Test all endpoints
        self.test_root_endpoint()
        self.test_platform_info()
        self.test_auth_flow()
        self.test_farmers_endpoints()
        self.test_products_endpoints()
        self.test_categories()
        self.test_order_flow()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate < 80:
            print("⚠️  Warning: Low success rate - check failed tests above")
            return 1
        elif success_rate < 100:
            print("⚡ Good: Most tests passing - minor issues to address")
            return 0
        else:
            print("🎉 Excellent: All tests passing!")
            return 0

def main():
    tester = ZeroMiddleAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())