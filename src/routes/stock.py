from flask import Blueprint, request, jsonify, Response
from src.models.inventory import db, Stock
from src.database_init import get_low_stock_items
from src.email_service import send_low_stock_alert
import csv
from io import StringIO

stock_bp = Blueprint("stock", __name__)

@stock_bp.route("/stock", methods=["GET"])
def get_all_stock():
    """Get all stock items"""
    try:
        stock_items = Stock.query.all()
        response_data = {
            "stock_items": [item.to_dict() for item in stock_items],
            "low_stock_items": get_low_stock_items()
        }
        return jsonify(response_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@stock_bp.route("/stock/<item_name>", methods=["GET"])
def get_stock_item(item_name):
    """Get specific stock item"""
    try:
        item = Stock.query.filter_by(item_name=item_name).first()
        if not item:
            return jsonify({"error": "Item not found"}), 404
        return jsonify(item.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@stock_bp.route("/stock/<item_name>", methods=["PUT"])
def update_stock_item(item_name):
    """Update stock quantity for an item"""
    try:
        data = request.get_json()
        if not data or "quantity" not in data:
            return jsonify({"error": "Quantity is required"}), 400
        
        item = Stock.query.filter_by(item_name=item_name).first()
        if not item:
            return jsonify({"error": "Item not found"}), 404
        
        new_quantity = int(data["quantity"])
        if new_quantity < 0:
            return jsonify({"error": "Quantity cannot be negative"}), 400
        
        item.quantity = new_quantity
        db.session.commit()
        
        check_and_send_low_stock_alert()
        
        return jsonify(item.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@stock_bp.route("/stock/<item_name>/add", methods=["POST"])
def add_stock_quantity(item_name):
    """Add quantity to existing stock"""
    try:
        data = request.get_json()
        if not data or "quantity" not in data:
            return jsonify({"error": "Quantity is required"}), 400
        
        item = Stock.query.filter_by(item_name=item_name).first()
        if not item:
            return jsonify({"error": "Item not found"}), 404
        
        add_quantity = int(data["quantity"])
        if add_quantity <= 0:
            return jsonify({"error": "Quantity to add must be positive"}), 400
        
        item.quantity += add_quantity
        db.session.commit()
        
        return jsonify(item.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@stock_bp.route("/stock/low-stock-check", methods=["POST"])
def check_low_stock():
    """Manually check for low stock and send alerts"""
    try:
        low_stock_items = get_low_stock_items()
        
        if low_stock_items:
            send_low_stock_alert(low_stock_items)
            return jsonify({
                "message": "Low stock alert sent",
                "low_stock_items": low_stock_items
            }), 200
        else:
            return jsonify({"message": "No low stock items found"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def check_and_send_low_stock_alert():
    """Helper function to check and send low stock alerts"""
    try:
        low_stock_items = get_low_stock_items()
        if low_stock_items:
            send_low_stock_alert(low_stock_items)
    except Exception as e:
        print(f"Error sending low stock alert: {e}")

def adjust_stock_for_employee(item_quantities):
    """Adjust stock based on items given/taken from employee"""
    try:
        for item_name, quantity_change in item_quantities.items():
            item = Stock.query.filter_by(item_name=item_name).first()
            if item:
                item.quantity -= quantity_change  # Deduct for positive, add for negative
                if item.quantity < 0:
                    item.quantity = 0  # Ensure stock doesn't go below zero
        
        db.session.commit()
        
        check_and_send_low_stock_alert()
        
    except Exception as e:
        db.session.rollback()
        raise e

@stock_bp.route("/stock", methods=["POST"])
def add_stock_item():
    """Add a new stock item"""
    try:
        data = request.get_json()
        name = data.get("item_name")
        quantity = int(data.get("quantity", 0))
        danger_level = int(data.get("danger_level", 30))
        if not name:
            return jsonify({"error": "Item name is required"}), 400
        if Stock.query.filter_by(item_name=name).first():
            return jsonify({"error": "Item already exists"}), 400
        item = Stock(item_name=name, quantity=quantity, danger_level=danger_level)
        db.session.add(item)
        db.session.commit()
        return jsonify(item.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@stock_bp.route('/export/stock')
def export_stock():
    output = StringIO()
    writer = csv.writer(output)
    # Write header
    writer.writerow(['Item Name', 'Quantity', 'Danger Level'])
    # Query all stock items
    stocks = Stock.query.all()
    for item in stocks:
        writer.writerow([item.item_name, item.quantity, item.danger_level])
    output.seek(0)
    return Response(
        output,
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment;filename=stock.csv'}
    )