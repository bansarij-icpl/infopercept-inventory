from src.models.inventory import db, Stock, Employee

def init_database():
    """Initialize database with default stock items"""
    
    # Create all tables
    db.create_all()
    
    # Check if stock items already exist
    if Stock.query.count() == 0:
        # Initialize default stock items
        default_items = [
            {"item_name": "bag", "quantity": 100, "danger_level": 30},
            {"item_name": "pen", "quantity": 100, "danger_level": 30},
            {"item_name": "diary", "quantity": 100, "danger_level": 30},
            {"item_name": "bottle", "quantity": 100, "danger_level": 30},
            {"item_name": "tshirt_s", "quantity": 100, "danger_level": 30},
            {"item_name": "tshirt_m", "quantity": 100, "danger_level": 30},
            {"item_name": "tshirt_l", "quantity": 100, "danger_level": 30},
            {"item_name": "tshirt_xl", "quantity": 100, "danger_level": 30},
            {"item_name": "tshirt_xxl", "quantity": 100, "danger_level": 30},
            {"item_name": "tshirt_xxxl", "quantity": 100, "danger_level": 30}
        ]
        
        for item_data in default_items:
            item = Stock(**item_data)
            db.session.add(item)
    
    # Commit all changes
    db.session.commit()
    print("Database initialized successfully!")

def get_low_stock_items():
    """Get all items that are below danger level"""
    low_stock_items = []
    
    # Check regular stock items
    stock_items = Stock.query.filter(Stock.quantity <= Stock.danger_level).all()
    for item in stock_items:
        low_stock_items.append({
            "type": "item",
            "name": item.item_name,
            "quantity": item.quantity,
            "danger_level": item.danger_level
        })
    
    return low_stock_items


