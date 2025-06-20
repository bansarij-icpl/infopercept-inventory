from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Stock(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String(100), unique=True, nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    danger_level = db.Column(db.Integer, nullable=False, default=30)

    def to_dict(self):
        return {
            "id": self.id,
            "item_name": self.item_name,
            "quantity": self.quantity,
            "danger_level": self.danger_level
        }

class Employee(db.Model):
    employee_id = db.Column(db.String(50), primary_key=True, unique=True, nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    emergency_no = db.Column(db.String(20), nullable=False)
    blood_group = db.Column(db.String(10), nullable=False)
    department_name = db.Column(db.String(100), nullable=False)
    
    bag_quantity = db.Column(db.Integer, nullable=False, default=0)
    pen_quantity = db.Column(db.Integer, nullable=False, default=0)
    diary_quantity = db.Column(db.Integer, nullable=False, default=0)
    bottle_quantity = db.Column(db.Integer, nullable=False, default=0)
    tshirt_s_quantity = db.Column(db.Integer, nullable=False, default=0)
    tshirt_m_quantity = db.Column(db.Integer, nullable=False, default=0)
    tshirt_l_quantity = db.Column(db.Integer, nullable=False, default=0)
    tshirt_xl_quantity = db.Column(db.Integer, nullable=False, default=0)
    tshirt_xxl_quantity = db.Column(db.Integer, nullable=False, default=0)
    tshirt_xxxl_quantity = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "employee_id": self.employee_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "emergency_no": self.emergency_no,
            "blood_group": self.blood_group,
            "department_name": self.department_name,
            "bag_quantity": self.bag_quantity,
            "pen_quantity": self.pen_quantity,
            "diary_quantity": self.diary_quantity,
            "bottle_quantity": self.bottle_quantity,
            "tshirt_s_quantity": self.tshirt_s_quantity,
            "tshirt_m_quantity": self.tshirt_m_quantity,
            "tshirt_l_quantity": self.tshirt_l_quantity,
            "tshirt_xl_quantity": self.tshirt_xl_quantity,
            "tshirt_xxl_quantity": self.tshirt_xxl_quantity,
            "tshirt_xxxl_quantity": self.tshirt_xxxl_quantity,
            "created_at": self.created_at.isoformat()
        }

