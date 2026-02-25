# 0middle - Farm Direct Platform PRD

## Original Problem Statement
Build a prototype web app called "0middle" that demonstrates how a farmer-to-consumer platform works without owning inventory or setting prices.

## Core Concept
- **Platform Role**: Infrastructure layer connecting farmers directly with consumers
- **Zero Commission**: 0middle doesn't own inventory or set prices
- **Transparent Pricing**: Full breakdown of costs visible to consumers
- **Farm Direct**: Products ship directly from farmers to consumers

---

## What's Been Implemented (January 2025)

### 1. Branding & Visual Identity ✅
- Custom 0middle logo (crossed-out zero design)
- Earth-toned theme (greens, browns)
- "Farm-direct, transparent, simple" visual language
- Hero: "Direct Staples from Farmers" + tagline "Premium staples at transparent prices"

### 2. User Roles & Flows

#### Farmer Experience (Seller Side) ✅
- **Onboarding**: Name, PIN code (auto-fills city/district/state), Full Address, Aadhaar
- **Payment Setup**: UPI ID or Bank account details (account number, IFSC)
- **Product Management**: 
  - Add products with category, variety, price, quantity
  - Market price recommendations
  - Organic/Regular toggle
  - Earnings calculator
  - "Go Live" / "Pull Back" visibility control
- **Dashboard**: View products, orders, earnings

#### Consumer Experience (Buyer Side) ✅
- **Browse-First UX**: Products visible without login
- **Product Cards**: Show total price, savings badge, farmer photo & location
- **Weight Options**: Predefined options (250g/500g/1kg for solids, 500ml/1L for liquids)
- **Cart Behavior**: Adding to cart doesn't force navigation
- **OTP Checkout**: Phone verification during checkout (not before)
- **Payment Options**: UPI and Card (MOCKED for demo)

### 3. Pricing Transparency ✅
- **Product Page**: Total price + "Save X%" badge + market price strikethrough
- **Checkout Breakdown**:
  - Farmer price (with %)
  - Packaging cost (with %)
  - Logistics cost (with %)
  - Platform fee ₹7 (with %)
  - Category-specific GST (0% for Rice/Flour/Pulses, 5% for Spices/Sweeteners/Dairy)
  - Market price comparison
  - Total savings displayed

### 4. "How 0middle Works" Section ✅ (Updated Jan 2025)
- **Step 1**: Farmers List Products (they set their own prices)
- **Step 0**: 0middle Enables Market Access (we connect, not sell — farmers go to market)
- **Step 2**: You See Full Breakdown (farmer price + service fees)
- **Step 3**: Ships Direct from Farm (no middlemen, zero commission)

### 5. Demo Data ✅ (Updated Jan 2025)
- **10 Pan-India Farmers**:
  - Murugan Selvam (Thanjavur, Tamil Nadu)
  - Lakshmi Narayanan (Madurai, Tamil Nadu)
  - Ramesh Patel (Anand, Gujarat)
  - Sunita Devi (Varanasi, Uttar Pradesh)
  - Harjinder Singh (Amritsar, Punjab)
  - Meena Kumari (Jodhpur, Rajasthan)
  - Prakash Reddy (Warangal, Telangana)
  - Anita Sharma (Shimla, Himachal Pradesh)
  - Biswajit Das (Cuttack, Odisha)
  - Kavitha Nair (Kottayam, Kerala)
- **30 Products** (Categories: Rice, Pulses, Flour, Spices, Sweeteners, Dairy):
  - Rice: Basmati, Sona Masoori, Organic Basmati, Ponni, Kolam, Brown Rice
  - Pulses: Toor Dal, Urad Dal, Moong Dal, Masoor Dal, Channa Dal
  - Flour: Whole Wheat Atta, Rice Flour, Ragi Flour, Multigrain Atta, Besan Flour
  - Spices: Turmeric Powder, Red Chilli Powder, Cumin Seeds, Coriander Powder, Black Pepper
  - Sweeteners: Jaggery, Organic Jaggery, Palm Jaggery, Jaggery Powder, Honey, Coconut Sugar
  - Dairy: Desi Cow Ghee, Buffalo Ghee, A2 Cow Ghee Bilona
- **User-uploaded product images**

---

## Technical Architecture

### Frontend (React)
```
/app/frontend/src/
├── components/
│   ├── layout/Header.jsx
│   ├── CartDrawer.jsx
│   └── ui/ (Shadcn components)
├── pages/
│   ├── LandingPage.jsx
│   ├── consumer/
│   │   ├── ProductDetail.jsx
│   │   ├── OrderConfirmation.jsx
│   │   └── OrderTracking.jsx
│   └── farmer/
│       ├── FarmerLogin.jsx
│       ├── FarmerOnboarding.jsx
│       ├── FarmerDashboard.jsx
│       ├── FarmerProducts.jsx
│       └── AddProduct.jsx
├── lib/api.js
└── App.js
```

### Backend (FastAPI)
```
/app/backend/
└── server.py (Mock data + API routes)
```

### Key API Endpoints
- `GET /api/products` - List products with farmer info, market price, savings
- `GET /api/products/{id}/pricing?quantity_kg=X` - Full price breakdown
- `GET /api/pincode/{pincode}` - City/District/State lookup
- `POST /api/auth/send-otp` / `POST /api/auth/verify-otp`
- `POST /api/farmers/register`
- `POST /api/orders`

---

## Mocked Features (Demo Only)
- Phone/OTP verification (always accepts 123456)
- Payment processing (UPI/Card)
- PIN code lookup (limited dataset)
- No actual database (in-memory mock data)

---

## Pending/Upcoming Tasks

### P0 (High Priority)
- [ ] Mock traceability QR code on product pages (expandable section)
- [ ] OTP input UX improvement (currently using basic text input)

### P1 (Medium Priority)
- [ ] Analytics dashboard for farmers
- [ ] WhatsApp share button for products
- [ ] Edit existing product listings
- [ ] Farmer photo upload for products

### P2 (Future)
- [ ] Price change notifications
- [ ] QR code generation for tracking
- [ ] Real database integration
- [ ] Actual payment gateway
- [ ] Refactor server.py into separate modules (data.py, routes.py)

---

## Test Credentials
- **Phone**: Any 10-digit number
- **OTP**: 123456
- **Demo Farmer Phone**: 9876543210

---

## Preview URL
https://zeromiddle.preview.emergentagent.com
