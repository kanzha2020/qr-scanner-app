from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============== REVIEW DATA ==============
REVIEWER_NAMES = [
    "Priya M.", "Rahul S.", "Anjali K.", "Vikram P.", "Sunita D.",
    "Amit R.", "Neha G.", "Rajesh K.", "Kavitha N.", "Suresh M.",
    "Deepa V.", "Kiran T.", "Meera S.", "Arun B.", "Lakshmi R.",
    "Sanjay P.", "Divya M.", "Ramesh N.", "Pooja A.", "Mohan K.",
    "Ananya S.", "Vijay L.", "Rekha B.", "Prakash D.", "Swati M."
]

REVIEW_TEMPLATES = {
    "Rice": [
        "Excellent quality rice! Grains are long and aromatic. Will order again.",
        "Fresh and tasty. My family loved it. Direct from farm makes a difference.",
        "Best basmati I've had in years. No chemicals, pure taste.",
        "Good quality but delivery took a bit longer than expected.",
        "Amazing aroma while cooking. Kids asked for seconds!",
        "Value for money. Much better than supermarket rice.",
        "Perfectly aged rice. Cooks fluffy every time.",
        "Authentic farm-fresh taste. Reminds me of my village.",
    ],
    "Pulses": [
        "Dal cooks perfectly soft. Great protein source for my family.",
        "Fresh pulses, no stones or debris. Clean and hygienic packaging.",
        "Best toor dal I've ordered online. Thick dal every time.",
        "Good quality but slightly smaller grains than expected.",
        "My go-to for all pulses now. Farm fresh makes a difference!",
        "Soaks well and cooks evenly. Restaurant quality at home.",
        "Nutritious and tasty. Even my picky kids love the dal.",
        "Excellent quality, will definitely reorder.",
    ],
    "Flour": [
        "Soft rotis every time! This atta is fantastic.",
        "Fresh stone-ground taste. No comparison to packaged flour.",
        "Best multigrain atta I've tried. Very nutritious.",
        "Makes fluffy chapatis. My mother-in-law approved!",
        "Good quality but packaging could be better.",
        "Authentic wheat taste. Brings back childhood memories.",
        "Perfect for all my baking needs. Highly recommend.",
        "Fresh and fragrant. You can smell the quality.",
    ],
    "Spices": [
        "Wow! The aroma is incredible. Real farm spices.",
        "Potent and flavorful. A little goes a long way.",
        "Best turmeric I've used. Deep color and taste.",
        "Fresh ground spices make such a difference in cooking.",
        "Authentic Indian spices. My dishes taste restaurant-quality now.",
        "Good quality but wish there were larger pack options.",
        "The color and aroma are amazing. Will order more.",
        "Pure and unadulterated. Exactly what I was looking for.",
    ],
    "Sweeteners": [
        "Pure jaggery taste! Takes me back to my grandmother's kitchen.",
        "Natural sweetness without the guilt. Great for health.",
        "Best quality gud I've found. Perfect for chai.",
        "Kids love it in their milk. Healthy alternative to sugar.",
        "Authentic taste and good texture. Will reorder.",
        "Great for making traditional sweets. Highly recommend.",
        "Pure and chemical-free. You can taste the difference.",
        "Good quality honey, thick and natural taste.",
    ],
    "Dairy": [
        "Pure desi ghee aroma! My dal tadka is now perfect.",
        "Authentic bilona ghee. Worth every rupee.",
        "Rich flavor and pure quality. Using it daily now.",
        "Best ghee I've had in years. Real farm-made taste.",
        "My grandmother would approve of this quality!",
        "Grainy texture shows it's authentic. Love it.",
        "Perfect for cooking and even skincare. Multi-purpose!",
        "A bit pricey but quality is unmatched.",
    ],
}

def generate_reviews_for_product(product_id, category, num_reviews=5):
    """Generate mock reviews for a product"""
    random.seed(hash(product_id))  # Consistent reviews per product
    reviews = []
    templates = REVIEW_TEMPLATES.get(category, REVIEW_TEMPLATES["Rice"])
    selected_reviews = random.sample(templates, min(num_reviews, len(templates)))
    used_names = random.sample(REVIEWER_NAMES, num_reviews)
    
    for i, review_text in enumerate(selected_reviews):
        # Generate rating - mostly 4-5 stars with occasional 3
        rating = random.choices([5, 4, 3], weights=[50, 40, 10])[0]
        days_ago = random.randint(2, 90)
        
        reviews.append({
            "id": f"rev_{product_id}_{i+1}",
            "reviewer_name": used_names[i],
            "rating": rating,
            "comment": review_text,
            "date": (datetime.now(timezone.utc) - __import__('datetime').timedelta(days=days_ago)).strftime("%Y-%m-%d"),
            "verified_purchase": True
        })
    
    return reviews

def get_product_rating(product_id, category):
    """Get average rating and review count for a product"""
    reviews = generate_reviews_for_product(product_id, category)
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews) if reviews else 0
    return {
        "average_rating": round(avg_rating, 1),
        "review_count": len(reviews),
        "reviews": reviews
    }

# ============== MOCK DATA ==============

# PIN Code lookup data (mock)
PIN_CODE_DATA = {
    # Tamil Nadu
    "600001": {"city": "Chennai", "district": "Chennai", "state": "Tamil Nadu"},
    "614001": {"city": "Thanjavur", "district": "Thanjavur", "state": "Tamil Nadu"},
    "625001": {"city": "Madurai", "district": "Madurai", "state": "Tamil Nadu"},
    "641001": {"city": "Coimbatore", "district": "Coimbatore", "state": "Tamil Nadu"},
    # Gujarat
    "380001": {"city": "Ahmedabad", "district": "Ahmedabad", "state": "Gujarat"},
    "388001": {"city": "Anand", "district": "Anand", "state": "Gujarat"},
    "395001": {"city": "Surat", "district": "Surat", "state": "Gujarat"},
    # Uttar Pradesh
    "221001": {"city": "Varanasi", "district": "Varanasi", "state": "Uttar Pradesh"},
    "226001": {"city": "Lucknow", "district": "Lucknow", "state": "Uttar Pradesh"},
    "201001": {"city": "Ghaziabad", "district": "Ghaziabad", "state": "Uttar Pradesh"},
    # Punjab
    "143001": {"city": "Amritsar", "district": "Amritsar", "state": "Punjab"},
    "141001": {"city": "Ludhiana", "district": "Ludhiana", "state": "Punjab"},
    "160001": {"city": "Chandigarh", "district": "Chandigarh", "state": "Chandigarh"},
    # Rajasthan
    "342001": {"city": "Jodhpur", "district": "Jodhpur", "state": "Rajasthan"},
    "302001": {"city": "Jaipur", "district": "Jaipur", "state": "Rajasthan"},
    "313001": {"city": "Udaipur", "district": "Udaipur", "state": "Rajasthan"},
    # Telangana
    "500001": {"city": "Hyderabad", "district": "Hyderabad", "state": "Telangana"},
    "506002": {"city": "Warangal", "district": "Warangal", "state": "Telangana"},
    # Himachal Pradesh
    "171001": {"city": "Shimla", "district": "Shimla", "state": "Himachal Pradesh"},
    "176001": {"city": "Mandi", "district": "Mandi", "state": "Himachal Pradesh"},
    # Odisha
    "753001": {"city": "Cuttack", "district": "Cuttack", "state": "Odisha"},
    "751001": {"city": "Bhubaneswar", "district": "Khordha", "state": "Odisha"},
    # Kerala
    "686001": {"city": "Kottayam", "district": "Kottayam", "state": "Kerala"},
    "682001": {"city": "Kochi", "district": "Ernakulam", "state": "Kerala"},
    "695001": {"city": "Thiruvananthapuram", "district": "Thiruvananthapuram", "state": "Kerala"},
    # Maharashtra
    "400001": {"city": "Mumbai", "district": "Mumbai", "state": "Maharashtra"},
    "411001": {"city": "Pune", "district": "Pune", "state": "Maharashtra"},
    "440001": {"city": "Nagpur", "district": "Nagpur", "state": "Maharashtra"},
    # Karnataka
    "560001": {"city": "Bangalore", "district": "Bangalore Urban", "state": "Karnataka"},
    "570001": {"city": "Mysore", "district": "Mysore", "state": "Karnataka"},
    # West Bengal
    "700001": {"city": "Kolkata", "district": "Kolkata", "state": "West Bengal"},
    # Delhi
    "110001": {"city": "New Delhi", "district": "Central Delhi", "state": "Delhi"},
    # Madhya Pradesh
    "462001": {"city": "Bhopal", "district": "Bhopal", "state": "Madhya Pradesh"},
    "452001": {"city": "Indore", "district": "Indore", "state": "Madhya Pradesh"},
    # Bihar
    "800001": {"city": "Patna", "district": "Patna", "state": "Bihar"},
    # Assam
    "781001": {"city": "Guwahati", "district": "Kamrup", "state": "Assam"},
}

# Market prices for comparison (typical retail prices)
MARKET_PRICES = {
    "Basmati Rice": 140,
    "Toor Dal": 180,
    "Jaggery (Gud)": 120,
    "Whole Wheat Atta": 75,
    "Sona Masoori Rice": 95,
    "Turmeric Powder": 380,
    "Moong Dal": 200,
    "Red Chilli Powder": 420,
    "Organic Basmati Rice": 200,
    "Organic Jaggery": 180,
    "Urad Dal": 160,
    "Rice Flour": 70,
    "Ragi Flour": 90,
    "Ponni Rice": 80,
    "Palm Jaggery": 250,
    "Multigrain Atta": 95,
    "Masoor Dal": 130,
    "Kolam Rice": 85,
    "Jaggery Powder": 140,
    "Honey": 450,
    "Desi Cow Ghee": 700,
    "Cumin Seeds": 400,
    "Coriander Powder": 280,
    "Coconut Sugar": 350,
    "Channa Dal": 150,
    "Buffalo Ghee": 600,
    "Brown Rice": 110,
    "Black Pepper": 900,
    "Besan Flour": 120,
    "A2 Cow Ghee Bilona": 850,
}

MOCK_FARMERS = [
    {
        "id": "f1",
        "name": "Murugan Selvam",
        "phone": "9876543210",
        "village": "Thanjavur",
        "district": "Thanjavur",
        "state": "Tamil Nadu",
        "pincode": "614001",
        "crop_types": ["Rice"],
        "image": "https://images.unsplash.com/photo-1607321809142-5364a2fc94a8?w=400",
        "joined": "2024-01-15",
        "bank_details": {"account_holder": "Murugan Selvam", "bank": "Indian Bank", "account_last4": "4521"},
        "upi_id": "murugan@upi"
    },
    {
        "id": "f2",
        "name": "Lakshmi Narayanan",
        "phone": "9876543211",
        "village": "Madurai",
        "district": "Madurai",
        "state": "Tamil Nadu",
        "pincode": "625001",
        "crop_types": ["Sweeteners"],
        "image": "https://images.unsplash.com/photo-1595956481935-a9e254951d49?w=400",
        "joined": "2024-02-20",
        "bank_details": {"account_holder": "Lakshmi Narayanan", "bank": "Canara Bank", "account_last4": "7832"},
        "upi_id": "lakshmi.farm@paytm"
    },
    {
        "id": "f3",
        "name": "Ramesh Patel",
        "phone": "9876543212",
        "village": "Anand",
        "district": "Anand",
        "state": "Gujarat",
        "pincode": "388001",
        "crop_types": ["Pulses"],
        "image": "https://images.unsplash.com/photo-1632923057240-b6775e4db748?w=400",
        "joined": "2024-03-10",
        "bank_details": {"account_holder": "Ramesh Patel", "bank": "SBI", "account_last4": "1290"},
        "upi_id": "ramesh@gpay"
    },
    {
        "id": "f4",
        "name": "Sunita Devi",
        "phone": "9876543213",
        "village": "Varanasi",
        "district": "Varanasi",
        "state": "Uttar Pradesh",
        "pincode": "221001",
        "crop_types": ["Flour"],
        "image": "https://images.unsplash.com/photo-1707721690746-cdbdabadebc2?w=400",
        "joined": "2024-04-05",
        "bank_details": {"account_holder": "Sunita Devi", "bank": "HDFC", "account_last4": "5643"},
        "upi_id": "sunita.farms@phonepe"
    },
    {
        "id": "f5",
        "name": "Harjinder Singh",
        "phone": "9876543214",
        "village": "Amritsar",
        "district": "Amritsar",
        "state": "Punjab",
        "pincode": "143001",
        "crop_types": ["Rice", "Dairy"],
        "image": "https://images.unsplash.com/photo-1603095432470-905b0e4645c3?w=400",
        "joined": "2024-05-12",
        "bank_details": {"account_holder": "Harjinder Singh", "bank": "PNB", "account_last4": "9087"},
        "upi_id": "harjinder@upi"
    },
    {
        "id": "f6",
        "name": "Meena Kumari",
        "phone": "9876543215",
        "village": "Jodhpur",
        "district": "Jodhpur",
        "state": "Rajasthan",
        "pincode": "342001",
        "crop_types": ["Spices"],
        "image": "https://images.unsplash.com/photo-1707721691170-bf913a7a6231?w=400",
        "joined": "2024-06-18",
        "bank_details": {"account_holder": "Meena Kumari", "bank": "IOB", "account_last4": "3456"},
        "upi_id": "meena.farms@gpay"
    },
    {
        "id": "f7",
        "name": "Prakash Reddy",
        "phone": "9876543216",
        "village": "Warangal",
        "district": "Warangal",
        "state": "Telangana",
        "pincode": "506002",
        "crop_types": ["Rice"],
        "image": "https://images.unsplash.com/photo-1699860777054-13e8d1d6245a?w=400",
        "joined": "2024-07-20",
        "bank_details": {"account_holder": "Prakash Reddy", "bank": "Axis", "account_last4": "7891"},
        "upi_id": "prakash@paytm"
    },
    {
        "id": "f8",
        "name": "Anita Sharma",
        "phone": "9876543217",
        "village": "Shimla",
        "district": "Shimla",
        "state": "Himachal Pradesh",
        "pincode": "171001",
        "crop_types": ["Honey"],
        "image": "https://images.unsplash.com/photo-1707721690544-781fe6ede937?w=400",
        "joined": "2024-08-15",
        "bank_details": {"account_holder": "Anita Sharma", "bank": "UCO", "account_last4": "2345"},
        "upi_id": "anita@phonepe"
    },
    {
        "id": "f9",
        "name": "Biswajit Das",
        "phone": "9876543218",
        "village": "Cuttack",
        "district": "Cuttack",
        "state": "Odisha",
        "pincode": "753001",
        "crop_types": ["Rice"],
        "image": "https://images.unsplash.com/photo-1653674136728-a24982136e60?w=400",
        "joined": "2024-09-10",
        "bank_details": {"account_holder": "Biswajit Das", "bank": "Indian Bank", "account_last4": "6789"},
        "upi_id": "biswajit@upi"
    },
    {
        "id": "f10",
        "name": "Kavitha Nair",
        "phone": "9876543219",
        "village": "Kottayam",
        "district": "Kottayam",
        "state": "Kerala",
        "pincode": "686001",
        "crop_types": ["Spices"],
        "image": "https://images.unsplash.com/photo-1707721690626-10e5f0366bcb?w=400",
        "joined": "2024-10-05",
        "bank_details": {"account_holder": "Kavitha Nair", "bank": "Federal Bank", "account_last4": "4567"},
        "upi_id": "kavitha@gpay"
    },
    {
        "id": "f11",
        "name": "Ravi Kumar",
        "phone": "9876543220",
        "village": "Guntur",
        "district": "Guntur",
        "state": "Andhra Pradesh",
        "pincode": "522001",
        "crop_types": ["Spices"],
        "image": "https://images.unsplash.com/photo-1585718540843-11b15b63a18f?w=400",
        "joined": "2024-02-10",
        "bank_details": {"account_holder": "Ravi Kumar", "bank": "Andhra Bank", "account_last4": "1234"},
        "upi_id": "ravi@upi"
    },
    {
        "id": "f12",
        "name": "Deepak Verma",
        "phone": "9876543221",
        "village": "Indore",
        "district": "Indore",
        "state": "Madhya Pradesh",
        "pincode": "452001",
        "crop_types": ["Pulses"],
        "image": "https://images.unsplash.com/photo-1602138038255-fd72c20ab750?w=400",
        "joined": "2024-03-15",
        "bank_details": {"account_holder": "Deepak Verma", "bank": "Central Bank", "account_last4": "5678"},
        "upi_id": "deepak@gpay"
    },
    {
        "id": "f13",
        "name": "Pooja Sharma",
        "phone": "9876543222",
        "village": "Jaipur",
        "district": "Jaipur",
        "state": "Rajasthan",
        "pincode": "302001",
        "crop_types": ["Flour"],
        "image": "https://images.unsplash.com/photo-1543824618-14d6f50bbd74?w=400",
        "joined": "2024-04-20",
        "bank_details": {"account_holder": "Pooja Sharma", "bank": "ICICI", "account_last4": "9012"},
        "upi_id": "pooja@paytm"
    },
    {
        "id": "f14",
        "name": "Suresh Yadav",
        "phone": "9876543223",
        "village": "Patna",
        "district": "Patna",
        "state": "Bihar",
        "pincode": "800001",
        "crop_types": ["Rice"],
        "image": "https://images.unsplash.com/photo-1710563849800-73af5bfc9f36?w=400",
        "joined": "2024-05-25",
        "bank_details": {"account_holder": "Suresh Yadav", "bank": "SBI", "account_last4": "3456"},
        "upi_id": "suresh@phonepe"
    },
    {
        "id": "f15",
        "name": "Geeta Devi",
        "phone": "9876543224",
        "village": "Ludhiana",
        "district": "Ludhiana",
        "state": "Punjab",
        "pincode": "141001",
        "crop_types": ["Dairy"],
        "image": "https://images.unsplash.com/photo-1644753794359-82e15062d1c5?w=400",
        "joined": "2024-06-30",
        "bank_details": {"account_holder": "Geeta Devi", "bank": "PNB", "account_last4": "7890"},
        "upi_id": "geeta@upi"
    },
    {
        "id": "f16",
        "name": "Mohan Lal",
        "phone": "9876543225",
        "village": "Nagpur",
        "district": "Nagpur",
        "state": "Maharashtra",
        "pincode": "440001",
        "crop_types": ["Pulses"],
        "image": "https://images.unsplash.com/photo-1719593622853-c625441bc4e0?w=400",
        "joined": "2024-07-05",
        "bank_details": {"account_holder": "Mohan Lal", "bank": "Bank of Maharashtra", "account_last4": "2345"},
        "upi_id": "mohan@gpay"
    },
    {
        "id": "f17",
        "name": "Kamala Bai",
        "phone": "9876543226",
        "village": "Mysore",
        "district": "Mysore",
        "state": "Karnataka",
        "pincode": "570001",
        "crop_types": ["Rice"],
        "image": "https://images.unsplash.com/photo-1689210931043-a6040239da15?w=400",
        "joined": "2024-08-10",
        "bank_details": {"account_holder": "Kamala Bai", "bank": "Canara Bank", "account_last4": "6789"},
        "upi_id": "kamala@paytm"
    },
    {
        "id": "f18",
        "name": "Ashok Mishra",
        "phone": "9876543227",
        "village": "Lucknow",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "pincode": "226001",
        "crop_types": ["Sweeteners"],
        "image": "https://images.unsplash.com/photo-1615724320397-9d4db10ec2a5?w=400",
        "joined": "2024-09-15",
        "bank_details": {"account_holder": "Ashok Mishra", "bank": "BOB", "account_last4": "0123"},
        "upi_id": "ashok@phonepe"
    },
    {
        "id": "f19",
        "name": "Savita Kumari",
        "phone": "9876543228",
        "village": "Ranchi",
        "district": "Ranchi",
        "state": "Jharkhand",
        "pincode": "834001",
        "crop_types": ["Flour"],
        "image": "https://images.unsplash.com/photo-1595956936239-4cad0fa009e6?w=400",
        "joined": "2024-10-20",
        "bank_details": {"account_holder": "Savita Kumari", "bank": "HDFC", "account_last4": "4567"},
        "upi_id": "savita@upi"
    },
    {
        "id": "f20",
        "name": "Rajesh Gupta",
        "phone": "9876543229",
        "village": "Bhopal",
        "district": "Bhopal",
        "state": "Madhya Pradesh",
        "pincode": "462001",
        "crop_types": ["Pulses"],
        "image": "https://images.pexels.com/photos/2382681/pexels-photo-2382681.jpeg?w=400",
        "joined": "2024-11-01",
        "bank_details": {"account_holder": "Rajesh Gupta", "bank": "SBI", "account_last4": "8901"},
        "upi_id": "rajesh@gpay"
    },
    {
        "id": "f21",
        "name": "Priya Singh",
        "phone": "9876543230",
        "village": "Dehradun",
        "district": "Dehradun",
        "state": "Uttarakhand",
        "pincode": "248001",
        "crop_types": ["Honey"],
        "image": "https://images.pexels.com/photos/1139319/pexels-photo-1139319.jpeg?w=400",
        "joined": "2024-03-01",
        "bank_details": {"account_holder": "Priya Singh", "bank": "Axis", "account_last4": "2345"},
        "upi_id": "priya@paytm"
    },
    {
        "id": "f22",
        "name": "Venkat Rao",
        "phone": "9876543231",
        "village": "Vijayawada",
        "district": "Krishna",
        "state": "Andhra Pradesh",
        "pincode": "520001",
        "crop_types": ["Rice"],
        "image": "https://images.pexels.com/photos/1459505/pexels-photo-1459505.jpeg?w=400",
        "joined": "2024-04-15",
        "bank_details": {"account_holder": "Venkat Rao", "bank": "Andhra Bank", "account_last4": "6789"},
        "upi_id": "venkat@phonepe"
    },
    {
        "id": "f23",
        "name": "Shanti Devi",
        "phone": "9876543232",
        "village": "Guwahati",
        "district": "Kamrup",
        "state": "Assam",
        "pincode": "781001",
        "crop_types": ["Rice"],
        "image": "https://images.pexels.com/photos/2474307/pexels-photo-2474307.jpeg?w=400",
        "joined": "2024-05-20",
        "bank_details": {"account_holder": "Shanti Devi", "bank": "SBI", "account_last4": "0123"},
        "upi_id": "shanti@upi"
    },
    {
        "id": "f24",
        "name": "Gopal Krishnan",
        "phone": "9876543233",
        "village": "Ernakulam",
        "district": "Ernakulam",
        "state": "Kerala",
        "pincode": "682001",
        "crop_types": ["Spices"],
        "image": "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?w=400",
        "joined": "2024-06-25",
        "bank_details": {"account_holder": "Gopal Krishnan", "bank": "Federal Bank", "account_last4": "4567"},
        "upi_id": "gopal@gpay"
    },
    {
        "id": "f25",
        "name": "Mamta Rawat",
        "phone": "9876543234",
        "village": "Haridwar",
        "district": "Haridwar",
        "state": "Uttarakhand",
        "pincode": "249401",
        "crop_types": ["Flour"],
        "image": "https://images.pexels.com/photos/1642228/pexels-photo-1642228.jpeg?w=400",
        "joined": "2024-07-30",
        "bank_details": {"account_holder": "Mamta Rawat", "bank": "UCO", "account_last4": "8901"},
        "upi_id": "mamta@paytm"
    },
    {
        "id": "f26",
        "name": "Balwinder Kaur",
        "phone": "9876543235",
        "village": "Jalandhar",
        "district": "Jalandhar",
        "state": "Punjab",
        "pincode": "144001",
        "crop_types": ["Dairy"],
        "image": "https://images.pexels.com/photos/3807755/pexels-photo-3807755.jpeg?w=400",
        "joined": "2024-08-05",
        "bank_details": {"account_holder": "Balwinder Kaur", "bank": "PNB", "account_last4": "2345"},
        "upi_id": "balwinder@phonepe"
    },
    {
        "id": "f27",
        "name": "Naresh Kumar",
        "phone": "9876543236",
        "village": "Agra",
        "district": "Agra",
        "state": "Uttar Pradesh",
        "pincode": "282001",
        "crop_types": ["Pulses"],
        "image": "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?w=400",
        "joined": "2024-09-10",
        "bank_details": {"account_holder": "Naresh Kumar", "bank": "BOB", "account_last4": "6789"},
        "upi_id": "naresh@upi"
    },
    {
        "id": "f28",
        "name": "Suma Hegde",
        "phone": "9876543237",
        "village": "Hubli",
        "district": "Dharwad",
        "state": "Karnataka",
        "pincode": "580001",
        "crop_types": ["Sweeteners"],
        "image": "https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?w=400",
        "joined": "2024-10-15",
        "bank_details": {"account_holder": "Suma Hegde", "bank": "Canara Bank", "account_last4": "0123"},
        "upi_id": "suma@gpay"
    },
    {
        "id": "f29",
        "name": "Dilip Mondal",
        "phone": "9876543238",
        "village": "Kolkata",
        "district": "Kolkata",
        "state": "West Bengal",
        "pincode": "700001",
        "crop_types": ["Rice"],
        "image": "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?w=400",
        "joined": "2024-11-20",
        "bank_details": {"account_holder": "Dilip Mondal", "bank": "UBI", "account_last4": "4567"},
        "upi_id": "dilip@paytm"
    },
    {
        "id": "f30",
        "name": "Rekha Pillai",
        "phone": "9876543239",
        "village": "Thiruvananthapuram",
        "district": "Thiruvananthapuram",
        "state": "Kerala",
        "pincode": "695001",
        "crop_types": ["Spices"],
        "image": "https://images.pexels.com/photos/2709388/pexels-photo-2709388.jpeg?w=400",
        "joined": "2024-12-01",
        "bank_details": {"account_holder": "Rekha Pillai", "bank": "Federal Bank", "account_last4": "8901"},
        "upi_id": "rekha@phonepe"
    }
]

MOCK_PRODUCTS = [
    {
        "id": "p1",
        "farmer_id": "f5",
        "name": "Basmati Rice",
        "category": "Rice",
        "price_per_kg": 85,
        "market_price": 140,
        "quantity_available": 500,
        "harvest_date": "2024-10-15",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/u0et87oq_Basmati%20Rice.png",
        "description": "Premium long-grain basmati rice from Punjab farms.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.25, 0.5, 1, 2, 5]
    },
    {
        "id": "p2",
        "farmer_id": "f12",
        "name": "Toor Dal",
        "category": "Pulses",
        "price_per_kg": 120,
        "market_price": 180,
        "quantity_available": 200,
        "harvest_date": "2024-09-20",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/h8osgnvt_Toor.Dal.png",
        "description": "High-protein toor dal from Madhya Pradesh, perfect for daily cooking.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.25, 0.5, 1, 2]
    },
    {
        "id": "p3",
        "farmer_id": "f2",
        "name": "Jaggery (Gud)",
        "category": "Sweeteners",
        "price_per_kg": 95,
        "market_price": 120,
        "quantity_available": 300,
        "harvest_date": "2024-11-01",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/iau57j98_Jaggery.png",
        "description": "Pure sugarcane jaggery from Madurai, Tamil Nadu, made using traditional methods.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.25, 0.5, 1, 2]
    },
    {
        "id": "p4",
        "farmer_id": "f4",
        "name": "Whole Wheat Atta",
        "category": "Flour",
        "price_per_kg": 55,
        "market_price": 75,
        "quantity_available": 400,
        "harvest_date": "2024-08-25",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/6afe52hq_Whole.wheat.Atta-1.png",
        "description": "Fresh stone-ground wheat flour from Varanasi farms.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.5, 1, 2, 5]
    },
    {
        "id": "p5",
        "farmer_id": "f1",
        "name": "Sona Masoori Rice",
        "category": "Rice",
        "price_per_kg": 65,
        "market_price": 95,
        "quantity_available": 600,
        "harvest_date": "2024-10-20",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/ivpdc4ha_Sona.Masoori.Rice.png",
        "description": "Light, aromatic Sona Masoori rice from Thanjavur, Tamil Nadu.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.5, 1, 2, 5, 10]
    },
    {
        "id": "p6",
        "farmer_id": "f10",
        "name": "Turmeric Powder",
        "category": "Spices",
        "price_per_kg": 250,
        "market_price": 380,
        "quantity_available": 100,
        "harvest_date": "2024-07-15",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/f2rgky96_Turmeric.Powder.png",
        "description": "High curcumin content turmeric from Kerala.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.25, 0.5, 1]
    },
    {
        "id": "p7",
        "farmer_id": "f3",
        "name": "Urad Dal",
        "category": "Pulses",
        "price_per_kg": 110,
        "market_price": 160,
        "quantity_available": 180,
        "harvest_date": "2024-09-15",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/sizdaasq_Urad.Dal.png",
        "description": "Premium urad dal from Gujarat, perfect for idli and dosa.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.25, 0.5, 1, 2]
    },
    {
        "id": "p8",
        "farmer_id": "f9",
        "name": "Moong Dal",
        "category": "Pulses",
        "price_per_kg": 140,
        "market_price": 200,
        "quantity_available": 150,
        "harvest_date": "2024-09-10",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/uofj8nb0_Moong.Dal-1.png",
        "description": "Premium yellow moong dal from Odisha.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.25, 0.5, 1, 2]
    },
    {
        "id": "p9",
        "farmer_id": "f6",
        "name": "Red Chilli Powder",
        "category": "Spices",
        "price_per_kg": 280,
        "market_price": 420,
        "quantity_available": 80,
        "harvest_date": "2024-06-20",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/71n90h4b_Red.Chilli.Powder.png",
        "description": "Authentic Rajasthani red chilli powder, perfect heat and deep color.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.25, 0.5, 1]
    },
    {
        "id": "p10",
        "farmer_id": "f15",
        "name": "Organic Basmati Rice",
        "category": "Rice",
        "price_per_kg": 120,
        "market_price": 200,
        "quantity_available": 200,
        "harvest_date": "2024-10-10",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/fmdhqa4h_Basmati%20Rice%20-Organic.png",
        "description": "Certified organic basmati rice from Punjab.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.5, 1, 2, 5]
    },
    {
        "id": "p11",
        "farmer_id": "f18",
        "name": "Organic Jaggery",
        "category": "Sweeteners",
        "price_per_kg": 130,
        "market_price": 180,
        "quantity_available": 100,
        "harvest_date": "2024-11-05",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_5881b8aa-d067-43e8-b728-61b7f8c51465/artifacts/tq1fjeul_Organic.Jaggery.png",
        "description": "Certified organic jaggery from Lucknow.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.25, 0.5, 1, 2]
    },
    {
        "id": "p12",
        "farmer_id": "f7",
        "name": "Rice Flour",
        "category": "Flour",
        "price_per_kg": 48,
        "market_price": 70,
        "quantity_available": 250,
        "harvest_date": "2024-10-25",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/wgw4674y_Rice.Flour.png",
        "description": "Fine rice flour from Telangana, perfect for appam and idiyappam.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.5, 1, 2]
    },
    {
        "id": "p13",
        "farmer_id": "f8",
        "name": "Ragi Flour",
        "category": "Flour",
        "price_per_kg": 65,
        "market_price": 90,
        "quantity_available": 150,
        "harvest_date": "2024-09-30",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/4gjog3cu_Raagi.flour.png",
        "description": "Nutritious ragi flour from Himachal Pradesh, rich in calcium and iron.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.5, 1, 2]
    },
    {
        "id": "p14",
        "farmer_id": "f14",
        "name": "Ponni Rice",
        "category": "Rice",
        "price_per_kg": 55,
        "market_price": 80,
        "quantity_available": 500,
        "harvest_date": "2024-10-18",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/e4oy7q33_Ponni.Rice.png",
        "description": "Traditional Ponni rice from Bihar, ideal for everyday meals.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [1, 2, 5, 10]
    },
    {
        "id": "p15",
        "farmer_id": "f24",
        "name": "Palm Jaggery",
        "category": "Sweeteners",
        "price_per_kg": 180,
        "market_price": 250,
        "quantity_available": 80,
        "harvest_date": "2024-10-20",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/weds72e4_Palm.Jaggery.png",
        "description": "Traditional palm jaggery from Kerala, rich in minerals.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.25, 0.5, 1]
    },
    {
        "id": "p16",
        "farmer_id": "f13",
        "name": "Multigrain Atta",
        "category": "Flour",
        "price_per_kg": 70,
        "market_price": 95,
        "quantity_available": 200,
        "harvest_date": "2024-09-15",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/788xhb38_Mult.Grain.Atta.png",
        "description": "Nutritious multigrain flour blend from Rajasthan.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.5, 1, 2, 5]
    },
    {
        "id": "p17",
        "farmer_id": "f16",
        "name": "Masoor Dal",
        "category": "Pulses",
        "price_per_kg": 95,
        "market_price": 130,
        "quantity_available": 180,
        "harvest_date": "2024-09-25",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/rn0d2h6m_masoor.dal.png",
        "description": "Red masoor dal from Maharashtra, quick-cooking and protein-rich.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.25, 0.5, 1, 2]
    },
    {
        "id": "p18",
        "farmer_id": "f17",
        "name": "Kolam Rice",
        "category": "Rice",
        "price_per_kg": 60,
        "market_price": 85,
        "quantity_available": 400,
        "harvest_date": "2024-10-12",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/ds6kp8qq_Kolam.Rice.png",
        "description": "Premium Kolam rice from Karnataka, soft texture and aromatic.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [1, 2, 5, 10]
    },
    {
        "id": "p19",
        "farmer_id": "f28",
        "name": "Jaggery Powder",
        "category": "Sweeteners",
        "price_per_kg": 110,
        "market_price": 140,
        "quantity_available": 120,
        "harvest_date": "2024-10-28",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/30r4nteb_Jaggery.powder.png",
        "description": "Fine jaggery powder from Karnataka, perfect for sweets and beverages.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.25, 0.5, 1]
    },
    {
        "id": "p20",
        "farmer_id": "f21",
        "name": "Honey",
        "category": "Sweeteners",
        "price_per_kg": 350,
        "market_price": 450,
        "quantity_available": 50,
        "harvest_date": "2024-09-20",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/nv7yca94_honey.png",
        "description": "Pure wild honey from Uttarakhand hills, raw and unprocessed.",
        "is_live": True,
        "unit_type": "liquid",
        "weight_options": [0.25, 0.5, 1]
    },
    {
        "id": "p21",
        "farmer_id": "f26",
        "name": "Desi Cow Ghee",
        "category": "Dairy",
        "price_per_kg": 550,
        "market_price": 700,
        "quantity_available": 40,
        "harvest_date": "2024-11-05",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/8jsvgrfn_Desi.Cow.Ghee.png",
        "description": "Traditional bilona desi cow ghee from Punjab.",
        "is_live": True,
        "unit_type": "liquid",
        "weight_options": [0.25, 0.5, 1]
    },
    {
        "id": "p22",
        "farmer_id": "f11",
        "name": "Cumin Seeds",
        "category": "Spices",
        "price_per_kg": 320,
        "market_price": 400,
        "quantity_available": 60,
        "harvest_date": "2024-08-15",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/4a1fnn2r_Cumin.Seeds.png",
        "description": "Aromatic cumin seeds from Andhra Pradesh, premium quality.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.25, 0.5, 1]
    },
    {
        "id": "p23",
        "farmer_id": "f20",
        "name": "Coriander Powder",
        "category": "Spices",
        "price_per_kg": 200,
        "market_price": 280,
        "quantity_available": 100,
        "harvest_date": "2024-08-20",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/3qac6ok2_Coriander.Powder.png",
        "description": "Fresh coriander powder from Madhya Pradesh, aromatic and flavorful.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.25, 0.5, 1]
    },
    {
        "id": "p24",
        "farmer_id": "f30",
        "name": "Coconut Sugar",
        "category": "Sweeteners",
        "price_per_kg": 280,
        "market_price": 350,
        "quantity_available": 75,
        "harvest_date": "2024-10-30",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_5881b8aa-d067-43e8-b728-61b7f8c51465/artifacts/nfsdnktn_Cocunut.Sugar.png",
        "description": "Natural coconut sugar from Kerala, low glycemic and unrefined.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.25, 0.5, 1]
    },
    {
        "id": "p25",
        "farmer_id": "f27",
        "name": "Channa Dal",
        "category": "Pulses",
        "price_per_kg": 105,
        "market_price": 150,
        "quantity_available": 200,
        "harvest_date": "2024-09-18",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_5881b8aa-d067-43e8-b728-61b7f8c51465/artifacts/fvy59u2y_Channa.Dal.png",
        "description": "Premium channa dal from Uttar Pradesh, perfect for dal and sweets.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.25, 0.5, 1, 2]
    },
    {
        "id": "p26",
        "farmer_id": "f25",
        "name": "Buffalo Ghee",
        "category": "Dairy",
        "price_per_kg": 480,
        "market_price": 600,
        "quantity_available": 35,
        "harvest_date": "2024-11-08",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_5881b8aa-d067-43e8-b728-61b7f8c51465/artifacts/mmyaxupc_Buffalo.Ghee.png",
        "description": "Pure buffalo ghee from Punjab, rich aroma and traditional bilona method.",
        "is_live": True,
        "unit_type": "liquid",
        "weight_options": [0.25, 0.5, 1]
    },
    {
        "id": "p27",
        "farmer_id": "f22",
        "name": "Brown Rice",
        "category": "Rice",
        "price_per_kg": 75,
        "market_price": 110,
        "quantity_available": 300,
        "harvest_date": "2024-10-22",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_5881b8aa-d067-43e8-b728-61b7f8c51465/artifacts/h2d6yr7z_Brown.Rice.png",
        "description": "Unpolished brown rice from Andhra Pradesh, fiber-rich and nutritious.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.5, 1, 2, 5]
    },
    {
        "id": "p28",
        "farmer_id": "f29",
        "name": "Black Pepper",
        "category": "Spices",
        "price_per_kg": 750,
        "market_price": 900,
        "quantity_available": 30,
        "harvest_date": "2024-09-25",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_5881b8aa-d067-43e8-b728-61b7f8c51465/artifacts/kjmvhfwg_Black.Pepper.png",
        "description": "Premium Malabar black pepper from West Bengal, bold flavor and aroma.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.1, 0.25, 0.5]
    },
    {
        "id": "p29",
        "farmer_id": "f19",
        "name": "Besan Flour",
        "category": "Flour",
        "price_per_kg": 85,
        "market_price": 120,
        "quantity_available": 180,
        "harvest_date": "2024-10-15",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_5881b8aa-d067-43e8-b728-61b7f8c51465/artifacts/hnxjoysl_Besan.Flour.png",
        "description": "Premium gram flour (chickpea flour) from Jharkhand, perfect for pakoras and sweets.",
        "is_live": True,
        "unit_type": "solid",
        "weight_options": [0.5, 1, 2]
    },
    {
        "id": "p30",
        "farmer_id": "f23",
        "name": "A2 Cow Ghee Bilona",
        "category": "Dairy",
        "price_per_kg": 680,
        "market_price": 850,
        "quantity_available": 25,
        "harvest_date": "2024-11-10",
        "processing_type": "Hand picked, natural",
        "image": "https://customer-assets.emergentagent.com/job_5881b8aa-d067-43e8-b728-61b7f8c51465/artifacts/uz7tplle_A2.Cow.Ghee.Bilona.png",
        "description": "Pure A2 desi cow ghee from Assam, made using traditional bilona method.",
        "is_live": True,
        "unit_type": "liquid",
        "weight_options": [0.25, 0.5, 1]
    }
]

MOCK_ORDERS = []
MOCK_OTP_STORE = {}

# ============== MODELS ==============
class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str

class FarmerProfile(BaseModel):
    name: str
    village: str
    crop_types: List[str]
    aadhaar_last4: Optional[str] = None

class ProductCreate(BaseModel):
    name: str
    category: str
    price_per_kg: float
    quantity_available: float
    harvest_date: str
    processing_type: str
    description: str
    is_live: bool = False
    image_url: Optional[str] = None  # Optional image URL from farmer upload

class OrderCreate(BaseModel):
    product_id: str
    quantity_kg: float
    consumer_phone: str
    consumer_name: str
    delivery_address: str

# ============== PLATFORM FEES ==============
PACKAGING_FEE_PER_KG = 5
SHIPPING_BASE_FEE = 40
SHIPPING_PER_KG = 8
PLATFORM_FEE = 7  # Flat ₹7 per purchase

# GST rates by category
# Rice, Flour, Pulses = 0% GST
# Spices, Sweeteners = 5% GST
# Dairy = 5% GST
GST_RATES = {
    "Rice": 0.0,
    "Flour": 0.0,
    "Pulses": 0.0,
    "Spices": 0.05,
    "Sweeteners": 0.05,
    "Dairy": 0.05,
}

def calculate_fees(quantity_kg: float, price_per_kg: float, market_price: float = None, category: str = ""):
    product_cost = quantity_kg * price_per_kg
    packaging_cost = quantity_kg * PACKAGING_FEE_PER_KG
    shipping_cost = SHIPPING_BASE_FEE + (quantity_kg * SHIPPING_PER_KG)
    platform_fee = PLATFORM_FEE
    
    # Get GST rate based on category (default 5% if not specified)
    gst_rate = GST_RATES.get(category, 0.05)
    
    # Calculate subtotal before GST
    subtotal = product_cost + packaging_cost + shipping_cost + platform_fee
    
    # GST on total amount
    gst = round(subtotal * gst_rate, 2)
    
    total = subtotal + gst
    grand_total = round(total, 2)
    
    # Calculate percentages
    farmer_pct = round((product_cost / grand_total) * 100, 1) if grand_total > 0 else 0
    packaging_pct = round((packaging_cost / grand_total) * 100, 1) if grand_total > 0 else 0
    shipping_pct = round((shipping_cost / grand_total) * 100, 1) if grand_total > 0 else 0
    platform_pct = round((platform_fee / grand_total) * 100, 1) if grand_total > 0 else 0
    gst_pct = round((gst / grand_total) * 100, 1) if grand_total > 0 else 0
    
    # Market price comparison
    savings = 0
    savings_pct = 0
    market_total = 0
    if market_price:
        market_total = quantity_kg * market_price
        savings = round(market_total - product_cost, 2)
        savings_pct = round((savings / market_total) * 100, 1) if market_total > 0 else 0
    
    return {
        "product_cost": round(product_cost, 2),
        "product_cost_pct": farmer_pct,
        "packaging_cost": round(packaging_cost, 2),
        "packaging_cost_pct": packaging_pct,
        "shipping_cost": round(shipping_cost, 2),
        "shipping_cost_pct": shipping_pct,
        "platform_fee": platform_fee,
        "platform_fee_pct": platform_pct,
        "gst": gst,
        "gst_pct": gst_pct,
        "gst_rate": int(gst_rate * 100),
        "total": grand_total,
        "farmer_receives": round(product_cost, 2),
        "market_price_total": market_total,
        "savings": savings,
        "savings_pct": savings_pct
    }

# ============== AUTH ENDPOINTS ==============
@api_router.post("/auth/send-otp")
async def send_otp(request: OTPRequest):
    # Mock OTP - always "123456" for demo
    MOCK_OTP_STORE[request.phone] = "123456"
    return {"message": "OTP sent successfully", "demo_otp": "123456"}

@api_router.post("/auth/verify-otp")
async def verify_otp(request: OTPVerify):
    stored_otp = MOCK_OTP_STORE.get(request.phone)
    if stored_otp and stored_otp == request.otp:
        # Check if farmer exists
        farmer = next((f for f in MOCK_FARMERS if f["phone"] == request.phone), None)
        return {
            "verified": True,
            "phone": request.phone,
            "is_registered_farmer": farmer is not None,
            "farmer": farmer
        }
    return {"verified": False, "message": "Invalid OTP"}

# ============== PIN CODE LOOKUP ==============
@api_router.get("/pincode/{pincode}")
async def lookup_pincode(pincode: str):
    """Look up city, district, state from PIN code"""
    if pincode in PIN_CODE_DATA:
        return PIN_CODE_DATA[pincode]
    # Return empty if not found - frontend can show "Enter manually"
    return {"city": "", "district": "", "state": "", "not_found": True}

# ============== FARMER ENDPOINTS ==============
# Track registered consumer phones for duplicate check
REGISTERED_CONSUMER_PHONES = set()

@api_router.get("/farmers")
async def get_farmers():
    return MOCK_FARMERS

@api_router.get("/farmers/{farmer_id}")
async def get_farmer(farmer_id: str):
    farmer = next((f for f in MOCK_FARMERS if f["id"] == farmer_id), None)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return farmer

@api_router.get("/check-phone/{phone}")
async def check_phone(phone: str, user_type: str = "farmer"):
    """Check if phone number is already registered"""
    # Check in farmers
    farmer_exists = any(f["phone"] == phone for f in MOCK_FARMERS)
    # Check in consumers
    consumer_exists = phone in REGISTERED_CONSUMER_PHONES
    
    if user_type == "farmer" and farmer_exists:
        return {"exists": True, "message": "This phone number is already registered as a farmer. Please login instead."}
    if user_type == "consumer" and consumer_exists:
        return {"exists": True, "message": "This phone number is already registered. Please login to continue."}
    
    return {"exists": False}

@api_router.post("/farmers/register")
async def register_farmer(profile: FarmerProfile, phone: str):
    # Check for duplicate phone number
    if any(f["phone"] == phone for f in MOCK_FARMERS):
        raise HTTPException(status_code=400, detail="This phone number is already registered as a farmer")
    
    new_farmer = {
        "id": f"f{len(MOCK_FARMERS) + 1}",
        "name": profile.name,
        "phone": phone,
        "village": profile.village,
        "crop_types": profile.crop_types,
        "aadhaar_last4": profile.aadhaar_last4,
        "image": "https://images.unsplash.com/photo-1595956481935-a9e254951d49?w=400",
        "joined": datetime.now(timezone.utc).strftime("%Y-%m-%d")
    }
    MOCK_FARMERS.append(new_farmer)
    return new_farmer

@api_router.get("/farmers/{farmer_id}/products")
async def get_farmer_products(farmer_id: str):
    return [p for p in MOCK_PRODUCTS if p["farmer_id"] == farmer_id]

@api_router.get("/farmers/{farmer_id}/orders")
async def get_farmer_orders(farmer_id: str):
    farmer_product_ids = [p["id"] for p in MOCK_PRODUCTS if p["farmer_id"] == farmer_id]
    return [o for o in MOCK_ORDERS if o["product_id"] in farmer_product_ids]

@api_router.post("/farmers/{farmer_id}/products")
async def add_product(farmer_id: str, product: ProductCreate):
    # Category-based default images
    CATEGORY_DEFAULT_IMAGES = {
        "Rice": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/u0et87oq_Basmati%20Rice.png",
        "Pulses": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/h8osgnvt_Toor.Dal.png",
        "Flour": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/6afe52hq_Whole.wheat.Atta-1.png",
        "Spices": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/f2rgky96_Turmeric.Powder.png",
        "Sweeteners": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/iau57j98_Jaggery.png",
        "Dairy": "https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/8jsvgrfn_Desi.Cow.Ghee.png",
    }
    
    # Get image from product data or use category default
    product_data = product.model_dump()
    image_url = product_data.pop("image_url", None) or CATEGORY_DEFAULT_IMAGES.get(product_data.get("category"), "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400")
    
    new_product = {
        "id": f"p{len(MOCK_PRODUCTS) + 1}",
        "farmer_id": farmer_id,
        **product_data,
        "is_live": False,
        "image": image_url
    }
    MOCK_PRODUCTS.append(new_product)
    return new_product

@api_router.patch("/products/{product_id}/toggle-live")
async def toggle_product_live(product_id: str):
    product = next((p for p in MOCK_PRODUCTS if p["id"] == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product["is_live"] = not product.get("is_live", False)
    return {"id": product_id, "is_live": product["is_live"]}

# ============== PRODUCT ENDPOINTS ==============
@api_router.get("/products")
async def get_products(category: Optional[str] = None, live_only: bool = True):
    products = MOCK_PRODUCTS.copy()
    
    # Filter by live status for consumer view
    if live_only:
        products = [p for p in products if p.get("is_live", False)]
    
    if category:
        products = [p for p in products if p["category"].lower() == category.lower()]
    
    # Enrich with farmer info and savings
    enriched = []
    for p in products:
        farmer = next((f for f in MOCK_FARMERS if f["id"] == p["farmer_id"]), None)
        market_price = p.get("market_price", 0)
        savings = market_price - p["price_per_kg"] if market_price else 0
        savings_pct = round((savings / market_price) * 100) if market_price else 0
        rating_data = get_product_rating(p["id"], p.get("category", "Rice"))
        
        enriched.append({
            **p,
            "farmer_name": farmer["name"] if farmer else "Unknown",
            "farmer_village": f"{farmer['village']}, {farmer['state']}" if farmer else "Unknown",
            "farmer_image": farmer["image"] if farmer else None,
            "savings": savings,
            "savings_pct": savings_pct,
            "rating": rating_data["average_rating"],
            "review_count": rating_data["review_count"]
        })
    return enriched

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = next((p for p in MOCK_PRODUCTS if p["id"] == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    farmer = next((f for f in MOCK_FARMERS if f["id"] == product["farmer_id"]), None)
    market_price = product.get("market_price", 0)
    savings = market_price - product["price_per_kg"] if market_price else 0
    savings_pct = round((savings / market_price) * 100) if market_price else 0
    
    # Get reviews for this product
    rating_data = get_product_rating(product_id, product.get("category", "Rice"))
    
    return {
        **product,
        "farmer": farmer,
        "market_price": market_price,
        "savings": savings,
        "savings_pct": savings_pct,
        "rating": rating_data["average_rating"],
        "review_count": rating_data["review_count"],
        "reviews": rating_data["reviews"],
        "traceability": {
            "harvest_location": f"{farmer['village']}, {farmer['district']}, {farmer['state']}" if farmer else "Unknown",
            "harvest_date": product["harvest_date"],
            "processing": product["processing_type"],
            "quality_check": "Passed - 0middle standards",
            "packaging_date": "Within 2 days of order",
            "journey": [
                {"step": "Harvested", "date": product["harvest_date"], "location": f"{farmer['village']}, {farmer['state']}" if farmer else "Farm"},
                {"step": "Quality Checked", "date": "Post-harvest", "location": "Farm"},
                {"step": "Stored", "date": "Ongoing", "location": "Farmer's facility"},
                {"step": "Packed on Order", "date": "On demand", "location": "Farm"},
                {"step": "Shipped Direct", "date": "Within 24hrs", "location": "To your door"}
            ]
        }
    }

@api_router.get("/products/{product_id}/pricing")
async def get_product_pricing(product_id: str, quantity_kg: float = 1):
    product = next((p for p in MOCK_PRODUCTS if p["id"] == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    market_price = product.get("market_price", 0)
    category = product.get("category", "")
    return calculate_fees(quantity_kg, product["price_per_kg"], market_price, category)

# ============== ORDER ENDPOINTS ==============
@api_router.post("/orders", status_code=201)
async def create_order(order: OrderCreate):
    product = next((p for p in MOCK_PRODUCTS if p["id"] == order.product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    farmer = next((f for f in MOCK_FARMERS if f["id"] == product["farmer_id"]), None)
    pricing = calculate_fees(order.quantity_kg, product["price_per_kg"])
    
    new_order = {
        "id": f"ORD{str(uuid.uuid4())[:8].upper()}",
        "product_id": order.product_id,
        "product_name": product["name"],
        "farmer_id": product["farmer_id"],
        "farmer_name": farmer["name"] if farmer else "Unknown",
        "farmer_village": farmer["village"] if farmer else "Unknown",
        "quantity_kg": order.quantity_kg,
        "pricing": pricing,
        "consumer_phone": order.consumer_phone,
        "consumer_name": order.consumer_name,
        "delivery_address": order.delivery_address,
        "status": "placed",
        "status_history": [
            {"status": "placed", "date": datetime.now(timezone.utc).isoformat(), "note": "Order confirmed"}
        ],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    MOCK_ORDERS.append(new_order)
    return new_order

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    order = next((o for o in MOCK_ORDERS if o["id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.get("/orders/consumer/{phone}")
async def get_consumer_orders(phone: str):
    return [o for o in MOCK_ORDERS if o["consumer_phone"] == phone]

@api_router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str):
    order = next((o for o in MOCK_ORDERS if o["id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order["status"] = status
    order["status_history"].append({
        "status": status,
        "date": datetime.now(timezone.utc).isoformat(),
        "note": f"Status updated to {status}"
    })
    return order

# ============== PLATFORM INFO ==============
@api_router.get("/platform/info")
async def get_platform_info():
    return {
        "name": "0middle",
        "tagline": "Direct from Farm to You",
        "description": "0middle is an infrastructure platform that connects farmers directly with consumers. We don't own inventory or set prices.",
        "how_it_works": [
            {
                "title": "Farmers List Products",
                "description": "Farmers set their own prices and list their produce directly."
            },
            {
                "title": "Consumers Browse & Buy",
                "description": "You see exactly what you're paying - farmer's price plus transparent service fees."
            },
            {
                "title": "Direct Shipping",
                "description": "Products are packed and shipped directly from the farmer to you."
            }
        ],
        "what_we_provide": [
            "Quality packaging standards",
            "Compliance and food safety support",
            "Secure payment processing",
            "Logistics coordination"
        ],
        "what_we_dont_do": [
            "We don't own inventory",
            "We don't set product prices",
            "We don't take commission from farmers"
        ],
        "fees": {
            "packaging": f"₹{PACKAGING_FEE_PER_KG}/kg",
            "shipping_base": f"₹{SHIPPING_BASE_FEE}",
            "shipping_per_kg": f"₹{SHIPPING_PER_KG}/kg",
            "platform_commission": "₹0 (Zero)"
        }
    }

@api_router.get("/categories")
async def get_categories():
    categories = list(set(p["category"] for p in MOCK_PRODUCTS))
    return categories

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "0middle API - Farm Direct Platform"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
