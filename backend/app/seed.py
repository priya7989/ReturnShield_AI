import os
import sys
from datetime import datetime, timedelta

# Ensure backend root is on sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, engine, SessionLocal
from app.models import Customer, Product, Order, ReturnCase, Evidence

def seed_database():
    """
    Populate the SQLite database with realistic seed data:
    - 5 Customers
    - 10 Products
    - 15 Orders
    - 5 Return Cases with associated Evidence
    """
    # Create tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Customer).count() > 0:
            print("Database already contains data. Skipping seed.")
            return

        print("Seeding database with initial data...")

        # 1. Create Customers
        customers_data = [
            {"name": "Rohit Kumar", "email": "rohit.kumar@example.com", "phone": "+91 98765 43210"},
            {"name": "Priya Sharma", "email": "priya.sharma@example.com", "phone": "+91 98123 45678"},
            {"name": "Ananya Patel", "email": "ananya.patel@example.com", "phone": "+91 97654 32109"},
            {"name": "Marcus Vance", "email": "marcus.vance@example.com", "phone": "+1 555 019 2831"},
            {"name": "Sarah Jenkins", "email": "sarah.jenkins@example.com", "phone": "+1 555 014 9922"},
        ]

        customers = []
        for c in customers_data:
            cust = Customer(**c, created_at=datetime.utcnow() - timedelta(days=60))
            db.add(cust)
            customers.append(cust)
        db.commit()

        for c in customers:
            db.refresh(c)

        print(f"Created {len(customers)} customers.")

        # 2. Create Products
        products_data = [
            {"name": "iPhone 15 128GB (Black)", "category": "Smartphones", "price": 799.00, "seller": "Apple Official Store", "warranty_period": "12 Months"},
            {"name": "Sony WH-1000XM5 Wireless Headphones", "category": "Audio", "price": 399.99, "seller": "Sony Electronics", "warranty_period": "12 Months"},
            {"name": "MacBook Air M3 15-inch", "category": "Laptops", "price": 1299.00, "seller": "Apple Official Store", "warranty_period": "12 Months"},
            {"name": "Dell UltraSharp 27 4K Monitor", "category": "Monitors", "price": 549.50, "seller": "Dell Direct", "warranty_period": "36 Months"},
            {"name": "Samsung Galaxy S24 Ultra", "category": "Smartphones", "price": 1199.99, "seller": "Samsung Direct", "warranty_period": "12 Months"},
            {"name": "Bose QuietComfort Ultra Earbuds", "category": "Audio", "price": 299.00, "seller": "Bose Official", "warranty_period": "12 Months"},
            {"name": "Apple Watch Series 9 GPS 45mm", "category": "Wearables", "price": 429.00, "seller": "Apple Official Store", "warranty_period": "12 Months"},
            {"name": "Logitech MX Master 3S Mouse", "category": "Accessories", "price": 99.99, "seller": "Logitech Store", "warranty_period": "24 Months"},
            {"name": "Sony PlayStation 5 Slim Console", "category": "Gaming", "price": 499.99, "seller": "Sony Interactive", "warranty_period": "12 Months"},
            {"name": "Canon EOS R6 Mark II Camera", "category": "Cameras", "price": 2499.00, "seller": "Canon Authorized Dealer", "warranty_period": "24 Months"},
        ]

        products = []
        for p in products_data:
            prod = Product(**p, created_at=datetime.utcnow() - timedelta(days=90))
            db.add(prod)
            products.append(prod)
        db.commit()

        for p in products:
            db.refresh(p)

        print(f"Created {len(products)} products.")

        # 3. Create Orders (15 total)
        orders_data = [
            {"order_number": "ORD-10024", "customer_id": customers[0].id, "product_id": products[0].id, "amount": 799.00, "status": "Delivered", "days_ago": 5},
            {"order_number": "ORD-10025", "customer_id": customers[1].id, "product_id": products[1].id, "amount": 399.99, "status": "Delivered", "days_ago": 12},
            {"order_number": "ORD-10026", "customer_id": customers[2].id, "product_id": products[2].id, "amount": 1299.00, "status": "Delivered", "days_ago": 8},
            {"order_number": "ORD-10027", "customer_id": customers[3].id, "product_id": products[3].id, "amount": 549.50, "status": "Delivered", "days_ago": 14},
            {"order_number": "ORD-10028", "customer_id": customers[4].id, "product_id": products[4].id, "amount": 1199.99, "status": "Delivered", "days_ago": 3},
            {"order_number": "ORD-10029", "customer_id": customers[0].id, "product_id": products[7].id, "amount": 99.99, "status": "Delivered", "days_ago": 25},
            {"order_number": "ORD-10030", "customer_id": customers[1].id, "product_id": products[5].id, "amount": 299.00, "status": "Delivered", "days_ago": 30},
            {"order_number": "ORD-10031", "customer_id": customers[2].id, "product_id": products[6].id, "amount": 429.00, "status": "Delivered", "days_ago": 18},
            {"order_number": "ORD-10032", "customer_id": customers[3].id, "product_id": products[8].id, "amount": 499.99, "status": "Delivered", "days_ago": 22},
            {"order_number": "ORD-10033", "customer_id": customers[4].id, "product_id": products[9].id, "amount": 2499.00, "status": "Delivered", "days_ago": 40},
            {"order_number": "ORD-10034", "customer_id": customers[0].id, "product_id": products[1].id, "amount": 399.99, "status": "Delivered", "days_ago": 45},
            {"order_number": "ORD-10035", "customer_id": customers[1].id, "product_id": products[3].id, "amount": 549.50, "status": "Delivered", "days_ago": 50},
            {"order_number": "ORD-10036", "customer_id": customers[2].id, "product_id": products[4].id, "amount": 1199.99, "status": "Delivered", "days_ago": 2},
            {"order_number": "ORD-10037", "customer_id": customers[3].id, "product_id": products[0].id, "amount": 799.00, "status": "In Transit", "days_ago": 1},
            {"order_number": "ORD-10038", "customer_id": customers[4].id, "product_id": products[2].id, "amount": 1299.00, "status": "Processing", "days_ago": 1},
        ]

        orders = []
        for o in orders_data:
            days = o.pop("days_ago")
            ord_date = datetime.utcnow() - timedelta(days=days)
            deliv_date = ord_date + timedelta(days=2) if o["status"] == "Delivered" else None
            ord_obj = Order(**o, order_date=ord_date, delivery_date=deliv_date)
            db.add(ord_obj)
            orders.append(ord_obj)
        db.commit()

        for o in orders:
            db.refresh(o)

        print(f"Created {len(orders)} orders.")

        # Ensure uploads folder exists
        uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
        os.makedirs(uploads_dir, exist_ok=True)

        # Create placeholder evidence images
        placeholder_file_1 = os.path.join(uploads_dir, "sample_cracked_screen.jpg")
        placeholder_file_2 = os.path.join(uploads_dir, "sample_wrong_item.jpg")
        placeholder_file_3 = os.path.join(uploads_dir, "sample_box_damaged.jpg")

        for pfile, color_hex, text_label in [
            (placeholder_file_1, "#ef4444", "CRACKED SCREEN EVIDENCE"),
            (placeholder_file_2, "#f59e0b", "WRONG ITEM RECEIVED"),
            (placeholder_file_3, "#3b82f6", "DAMAGED SHIPPING BOX"),
        ]:
            if not os.path.exists(pfile):
                # Write simple SVG formatted image content
                svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
                <rect width="600" height="400" fill="#1e293b"/>
                <rect x="20" y="20" width="560" height="360" rx="12" fill="#0f172a" stroke="{color_hex}" stroke-width="4"/>
                <text x="300" y="180" font-family="sans-serif" font-size="24" font-weight="bold" fill="{color_hex}" text-anchor="middle">{text_label}</text>
                <text x="300" y="220" font-family="sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle">ReturnShield Evidence Upload Sample</text>
                </svg>'''
                with open(pfile, "w", encoding="utf-8") as f:
                    f.write(svg_content)

        # 4. Create Return Cases (5 total)
        return_cases_data = [
            {
                "case_number": "RET-2026-0001-A9F1",
                "order_id": orders[0].id,  # ORD-10024 (iPhone 15)
                "customer_id": customers[0].id,  # Rohit Kumar
                "reason": "Damaged product",
                "description": "The phone arrived with a cracked screen right out of the sealed box.",
                "status": "Pending",
                "risk_level": "Unassessed",
                "final_decision": "Pending AI Investigation",
                "evidence": [
                    {"file_name": "cracked_screen_photo.svg", "file_path": "/uploads/sample_cracked_screen.jpg", "evidence_type": "image/svg+xml"}
                ]
            },
            {
                "case_number": "RET-2026-0002-B8C2",
                "order_id": orders[1].id,  # ORD-10025 (Sony Headphones)
                "customer_id": customers[1].id,  # Priya Sharma
                "reason": "Defective item",
                "description": "Left earbud has a constant static distortion noise when noise cancellation is enabled.",
                "status": "Needs Human Review",
                "risk_level": "Medium",
                "final_decision": "Flagged for Secondary Manual Verification",
                "evidence": [
                    {"file_name": "audio_issue_photo.svg", "file_path": "/uploads/sample_wrong_item.jpg", "evidence_type": "image/svg+xml"}
                ]
            },
            {
                "case_number": "RET-2026-0003-C7D3",
                "order_id": orders[2].id,  # ORD-10026 (MacBook Air)
                "customer_id": customers[2].id,  # Ananya Patel
                "reason": "Wrong item received",
                "description": "I ordered the 15-inch model but received a 13-inch laptop in the parcel.",
                "status": "Approved",
                "risk_level": "Low",
                "final_decision": "Full Refund Approved - Return Label Generated",
                "evidence": [
                    {"file_name": "shipping_box.svg", "file_path": "/uploads/sample_box_damaged.jpg", "evidence_type": "image/svg+xml"}
                ]
            },
            {
                "case_number": "RET-2026-0004-D6E4",
                "order_id": orders[3].id,  # ORD-10027 (Dell Monitor)
                "customer_id": customers[3].id,  # Marcus Vance
                "reason": "Missing accessories",
                "description": "Monitor power cable and USB-C display cable were missing from the sealed box.",
                "status": "Approved",
                "risk_level": "Low",
                "final_decision": "Partial Refund & Replacement Cable Sent",
                "evidence": [
                    {"file_name": "open_box.svg", "file_path": "/uploads/sample_box_damaged.jpg", "evidence_type": "image/svg+xml"}
                ]
            },
            {
                "case_number": "RET-2026-0005-E5F5",
                "order_id": orders[4].id,  # ORD-10028 (Galaxy S24)
                "customer_id": customers[4].id,  # Sarah Jenkins
                "reason": "Buyer remorse / Changed mind",
                "description": "Claiming item is defective but customer submitted returns on 3 prior expensive items this month.",
                "status": "Rejected",
                "risk_level": "High",
                "final_decision": "Return Rejected - Policy Violation (Serial Returner Risk)",
                "evidence": [
                    {"file_name": "returned_phone.svg", "file_path": "/uploads/sample_cracked_screen.jpg", "evidence_type": "image/svg+xml"}
                ]
            }
        ]

        for rc_data in return_cases_data:
            evidence_data = rc_data.pop("evidence")
            rc = ReturnCase(**rc_data)
            db.add(rc)
            db.commit()
            db.refresh(rc)

            for ev in evidence_data:
                evidence_obj = Evidence(return_case_id=rc.id, **ev)
                db.add(evidence_obj)

            db.commit()

        print(f"Created {len(return_cases_data)} return investigation cases.")
        print("Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
