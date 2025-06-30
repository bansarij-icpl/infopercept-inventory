from flask import Blueprint, request, jsonify, send_file, render_template, make_response, Response
from src.models.inventory import db, Employee, Stock
from src.routes.stock import adjust_stock_for_employee
import re
import os
from io import BytesIO, StringIO
from weasyprint import HTML
import base64
import csv

employee_bp = Blueprint("employee", __name__)
EMP_IMG_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'emp_img')

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
    
    # Blood group validation
    valid_blood_groups = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}
    if data.get("blood_group") and data["blood_group"] not in valid_blood_groups:
        errors.append("Invalid blood group selected")
    
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

@employee_bp.route('/employees/upload_photo', methods=['POST'])
def upload_photo():
    photo = request.files.get('photo')
    employee_id = request.form.get('employee_id')
    if not photo or not employee_id:
        return jsonify({'success': False, 'error': 'Missing photo or employee_id'}), 400
    if not os.path.exists(EMP_IMG_FOLDER):
        os.makedirs(EMP_IMG_FOLDER)
    ext = os.path.splitext(photo.filename)[1].lower()
    if ext not in ['.jpg', '.jpeg', '.png']:
        return jsonify({'success': False, 'error': 'Invalid file type'}), 400
    filename = f"{employee_id}.jpg"
    photo.save(os.path.join(EMP_IMG_FOLDER, filename))
    return jsonify({'success': True})

@employee_bp.route('/employees/icard/<employee_id>', methods=['GET'])
def generate_icard(employee_id):
    employee = Employee.query.get(employee_id)
    if not employee:
        return "Employee not found", 404

    # Get photo path
    img_path = os.path.join(EMP_IMG_FOLDER, f"{employee_id}.jpg")
    photo_data = None
    if os.path.exists(img_path):
        with open(img_path, "rb") as img_file:
            photo_data = "data:image/jpeg;base64," + base64.b64encode(img_file.read()).decode('utf-8')
    else:
        # Use a placeholder image or blank
        photo_data = None

    # Render HTML with employee data
    html = render_template(
        "icard.html",
        first_name=employee.first_name,
        last_name=employee.last_name,
        emergency_no=employee.emergency_no,
        blood_group=employee.blood_group,
        department_name=employee.department_name,
        employee_id=employee.employee_id,
        photo_data=photo_data
    )

    # Generate PDF from HTML
    pdf = HTML(string=html, base_url=request.host_url).write_pdf()

    response = make_response(pdf)
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f'attachment; filename={employee_id}_icard.pdf'
    return response

@employee_bp.route('/export/employees')
def export_employees():
    output = StringIO()
    writer = csv.writer(output)
    # Write header
    writer.writerow([
        'Employee ID', 'First Name', 'Last Name', 'Emergency No',
        'Blood Group', 'Department Name', 'Bag', 'Pen', 'Diary', 'Bottle',
        'T-shirt S', 'T-shirt M', 'T-shirt L', 'T-shirt XL', 'T-shirt XXL', 'T-shirt XXXL'
    ])
    # Query all employees
    employees = Employee.query.all()
    for emp in employees:
        writer.writerow([
            emp.employee_id, emp.first_name, emp.last_name, emp.emergency_no,
            emp.blood_group, emp.department_name, emp.bag_quantity, emp.pen_quantity,
            emp.diary_quantity, emp.bottle_quantity, emp.tshirt_s_quantity,
            emp.tshirt_m_quantity, emp.tshirt_l_quantity, emp.tshirt_xl_quantity,
            emp.tshirt_xxl_quantity, emp.tshirt_xxxl_quantity
        ])
    output.seek(0)
    return Response(
        output,
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment;filename=employees.csv'}
    )


