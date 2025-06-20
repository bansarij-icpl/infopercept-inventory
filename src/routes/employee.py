from flask import Blueprint, request, jsonify
from src.models.inventory import db, Employee, Stock
from src.routes.stock import adjust_stock_for_employee
import re

employee_bp = Blueprint("employee", __name__)

def validate_email(email):
    """Validate email format"""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None

def validate_employee_data(data, is_update=False):
    """Validate employee data"""
    errors = []
    
    if not is_update:
        # Required fields for new employee
        required_fields = ["employee_id", "first_name", "last_name", "emergency_no", "blood_group", "department_name"]
        for field in required_fields:
            if not data.get(field):
                errors.append(f"{field} is required")
    
    # Validate quantities if provided
    item_fields = ["bag_quantity", "pen_quantity", "diary_quantity", "bottle_quantity",
                   "tshirt_s_quantity", "tshirt_m_quantity", "tshirt_l_quantity",
                   "tshirt_xl_quantity", "tshirt_xxl_quantity", "tshirt_xxxl_quantity"]
    
    for field in item_fields:
        if data.get(field) is not None:
            try:
                quantity = int(data[field])
                if quantity < 0:
                    errors.append(f"{field} cannot be negative")
            except ValueError:
                errors.append(f"{field} must be an integer")
                
    return errors

@employee_bp.route("/employees", methods=["GET"])
def get_all_employees():
    """Get all employees with optional search"""
    try:
        search_query = request.args.get("search", "").strip()
        
        if search_query:
            employees = Employee.query.filter(
                db.or_(
                    Employee.employee_id.ilike(f"%{search_query}%"),
                    Employee.first_name.ilike(f"%{search_query}%"),
                    Employee.last_name.ilike(f"%{search_query}%"),
                    Employee.emergency_no.ilike(f"%{search_query}%"),
                    Employee.blood_group.ilike(f"%{search_query}%"),
                    Employee.department_name.ilike(f"%{search_query}%")
                )
            ).all()
        else:
            employees = Employee.query.all()
        
        return jsonify([emp.to_dict() for emp in employees]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@employee_bp.route("/employees/<employee_id>", methods=["GET"])
def get_employee(employee_id):
    """Get specific employee by ID"""
    try:
        employee = Employee.query.get(employee_id)
        if not employee:
            return jsonify({"error": "Employee not found"}), 404
        
        return jsonify(employee.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@employee_bp.route("/employees", methods=["POST"])
def create_employee():
    """Create new employee and deduct stock"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        errors = validate_employee_data(data)
        if errors:
            return jsonify({"errors": errors}), 400
        
        existing_employee = Employee.query.get(data["employee_id"])
        if existing_employee:
            return jsonify({"error": "Employee ID already exists"}), 400
        
        employee = Employee(
            employee_id=data["employee_id"],
            first_name=data["first_name"],
            last_name=data["last_name"],
            emergency_no=data["emergency_no"],
            blood_group=data["blood_group"],
            department_name=data["department_name"],
            bag_quantity=data.get("bag_quantity", 0),
            pen_quantity=data.get("pen_quantity", 0),
            diary_quantity=data.get("diary_quantity", 0),
            bottle_quantity=data.get("bottle_quantity", 0),
            tshirt_s_quantity=data.get("tshirt_s_quantity", 0),
            tshirt_m_quantity=data.get("tshirt_m_quantity", 0),
            tshirt_l_quantity=data.get("tshirt_l_quantity", 0),
            tshirt_xl_quantity=data.get("tshirt_xl_quantity", 0),
            tshirt_xxl_quantity=data.get("tshirt_xxl_quantity", 0),
            tshirt_xxxl_quantity=data.get("tshirt_xxxl_quantity", 0)
        )
        
        db.session.add(employee)
        db.session.commit()
        
        # Deduct stock for received items
        item_quantities_to_deduct = {
            "bag": employee.bag_quantity,
            "pen": employee.pen_quantity,
            "diary": employee.diary_quantity,
            "bottle": employee.bottle_quantity,
            "tshirt_s": employee.tshirt_s_quantity,
            "tshirt_m": employee.tshirt_m_quantity,
            "tshirt_l": employee.tshirt_l_quantity,
            "tshirt_xl": employee.tshirt_xl_quantity,
            "tshirt_xxl": employee.tshirt_xxl_quantity,
            "tshirt_xxxl": employee.tshirt_xxxl_quantity
        }
        
        adjust_stock_for_employee(item_quantities_to_deduct)
        
        return jsonify(employee.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@employee_bp.route("/employees/<employee_id>", methods=["PUT"])
def update_employee(employee_id):
    """Update existing employee and adjust stock accordingly"""
    try:
        employee = Employee.query.get(employee_id)
        if not employee:
            return jsonify({"error": "Employee not found"}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        errors = validate_employee_data(data, is_update=True)
        if errors:
            return jsonify({"errors": errors}), 400
        
        # Update employee fields
        if "first_name" in data:
            employee.first_name = data["first_name"]
        if "last_name" in data:
            employee.last_name = data["last_name"]
        if "emergency_no" in data:
            employee.emergency_no = data["emergency_no"]
        if "blood_group" in data:
            employee.blood_group = data["blood_group"]
        if "department_name" in data:
            employee.department_name = data["department_name"]
        
        # Update item quantities and calculate stock changes
        item_fields = {
            "bag": "bag_quantity",
            "pen": "pen_quantity",
            "diary": "diary_quantity",
            "bottle": "bottle_quantity",
            "tshirt_s": "tshirt_s_quantity",
            "tshirt_m": "tshirt_m_quantity",
            "tshirt_l": "tshirt_l_quantity",
            "tshirt_xl": "tshirt_xl_quantity",
            "tshirt_xxl": "tshirt_xxl_quantity",
            "tshirt_xxxl": "tshirt_xxxl_quantity"
        }

        stock_changes = {}
        for item_key, field_name in item_fields.items():
            if field_name in data:
                new_quantity = int(data[field_name])
                old_quantity = getattr(employee, field_name)
                setattr(employee, field_name, new_quantity)
                stock_changes[item_key] = new_quantity - old_quantity

        db.session.commit()
        
        # Adjust stock based on changes
        if stock_changes:
            adjust_stock_for_employee(stock_changes)
        
        return jsonify(employee.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@employee_bp.route("/employees/<employee_id>", methods=["DELETE"])
def delete_employee(employee_id):
    """Delete employee (optional functionality)"""
    try:
        employee = Employee.query.get(employee_id)
        if not employee:
            return jsonify({"error": "Employee not found"}), 404
        
        # Add stock back when employee is deleted
        item_quantities_to_add = {
            "bag": employee.bag_quantity,
            "pen": employee.pen_quantity,
            "diary": employee.diary_quantity,
            "bottle": employee.bottle_quantity,
            "tshirt_s": employee.tshirt_s_quantity,
            "tshirt_m": employee.tshirt_m_quantity,
            "tshirt_l": employee.tshirt_l_quantity,
            "tshirt_xl": employee.tshirt_xl_quantity,
            "tshirt_xxl": employee.tshirt_xxl_quantity,
            "tshirt_xxxl": employee.tshirt_xxxl_quantity
        }
        
        # Convert deductions to additions by negating quantities
        stock_additions = {k: -v for k, v in item_quantities_to_add.items()}
        adjust_stock_for_employee(stock_additions)

        db.session.delete(employee)
        db.session.commit()
        
        return jsonify({"message": "Employee deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@employee_bp.route("/employees/stats", methods=["GET"])
def get_employee_stats():
    """Get employee statistics"""
    try:
        total_employees = Employee.query.count()
        
        stats = {
            "total_employees": total_employees,
            "bags_distributed": db.session.query(db.func.sum(Employee.bag_quantity)).scalar() or 0,
            "pens_distributed": db.session.query(db.func.sum(Employee.pen_quantity)).scalar() or 0,
            "diaries_distributed": db.session.query(db.func.sum(Employee.diary_quantity)).scalar() or 0,
            "bottles_distributed": db.session.query(db.func.sum(Employee.bottle_quantity)).scalar() or 0,
            "tshirts_distributed": (
                db.session.query(db.func.sum(Employee.tshirt_s_quantity)).scalar() or 0 +
                db.session.query(db.func.sum(Employee.tshirt_m_quantity)).scalar() or 0 +
                db.session.query(db.func.sum(Employee.tshirt_l_quantity)).scalar() or 0 +
                db.session.query(db.func.sum(Employee.tshirt_xl_quantity)).scalar() or 0 +
                db.session.query(db.func.sum(Employee.tshirt_xxl_quantity)).scalar() or 0 +
                db.session.query(db.func.sum(Employee.tshirt_xxxl_quantity)).scalar() or 0
            )
        }
        
        tshirt_sizes_distributed = {
            "S": db.session.query(db.func.sum(Employee.tshirt_s_quantity)).scalar() or 0,
            "M": db.session.query(db.func.sum(Employee.tshirt_m_quantity)).scalar() or 0,
            "L": db.session.query(db.func.sum(Employee.tshirt_l_quantity)).scalar() or 0,
            "XL": db.session.query(db.func.sum(Employee.tshirt_xl_quantity)).scalar() or 0,
            "XXL": db.session.query(db.func.sum(Employee.tshirt_xxl_quantity)).scalar() or 0,
            "XXXL": db.session.query(db.func.sum(Employee.tshirt_xxxl_quantity)).scalar() or 0
        }
        stats["tshirt_sizes_distributed"] = tshirt_sizes_distributed
        
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


