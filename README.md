# Inventory Management System

A comprehensive web application for managing employee kit distribution in your company.

## Features

### Backend (Python Flask + SQLite)
- Complete REST API with all endpoints
- SQLite database with Stock and Employee tables
- Automatic stock deduction when employees receive items
- Low stock alerts (triggers when items < 30)
- Email notifications to bansrijiyani07@gmail.com
- Employee validation (unique employee_id, email format)
- T-shirt size management (S/M/L/XL/XXL/XXXL)

### Frontend (HTML/CSS/JavaScript)
- Modern, responsive dashboard with statistics
- Stock management page with real-time updates
- Employee management with search functionality
- Add new employee form with kit item selection
- Update existing employee items
- Beautiful, professional UI design
- Mobile-friendly responsive layout

### Key Functionalities
- **Stock Management:** View all item counts, update stock levels
- **Employee Management:** Add, search, and update employee records
- **Kit Distribution:** Automatic stock deduction for bag, pen, diary, bottle, t-shirt
- **T-shirt Sizes:** Full size selection (S/M/L/XL/XXL/XXXL)
- **Email Alerts:** Automatic notifications when stock is low
- **Search:** Find employees by ID, name, email, department, designation
- **Validation:** Prevents duplicate employee IDs, validates email format
- **Update Items:** Give additional items to existing employees

## Installation & Setup

1. **Navigate to the project directory:**
   ```bash
   cd inventory_management_system
   ```

2. **Activate virtual environment:**
   ```bash
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application:**
   ```bash
   python src/main.py
   ```

5. **Access the application:**
   - Open your browser and go to `http://localhost:5000`
   - The system will automatically initialize with sample stock data

## Email Configuration

To enable email notifications, update the email settings in `src/email_service.py` with your SMTP credentials:

```python
SMTP_SERVER = "your-smtp-server.com"
SMTP_PORT = 587
EMAIL_USER = "your-email@company.com"
EMAIL_PASSWORD = "your-app-password"
```

## Project Structure

```
inventory_management_system/
├── src/
│   ├── main.py                 # Main Flask application
│   ├── database_init.py        # Database initialization
│   ├── email_service.py        # Email notification service
│   ├── models/
│   │   └── inventory.py        # Database models
│   ├── routes/
│   │   ├── stock.py           # Stock management routes
│   │   └── employee.py        # Employee management routes
│   └── static/
│       ├── index.html         # Main frontend application
│       ├── styles.css         # CSS styles
│       └── script.js          # JavaScript functionality
├── requirements.txt           # Python dependencies
└── README.md                 # This file
```

## API Endpoints

### Stock Management
- `GET /api/stock` - Get all stock items
- `POST /api/stock/update` - Update stock quantities

### Employee Management
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Add new employee
- `PUT /api/employees/<id>` - Update employee items
- `GET /api/employees/search` - Search employees

## Database Schema

### Stock Table
- id (Primary Key)
- item_name (bag, pen, diary, bottle, tshirt_s, tshirt_m, etc.)
- quantity (Current stock count)

### Employee Table
- employee_id (Primary Key)
- name
- email
- department
- designation
- bag, pen, diary, bottle (Boolean fields)
- tshirt_size (S/M/L/XL/XXL/XXXL or None)
- created_at

## Usage

1. **Dashboard:** View overall statistics and low stock alerts
2. **Stock Management:** Monitor and update inventory levels
3. **Employee Management:** Add new employees and manage kit distribution
4. **Search:** Find employees using various criteria
5. **Updates:** Give additional items to existing employees

## Email Notifications

The system automatically sends email alerts to bansrijiyani07@gmail.com when any item stock falls below 30 units.

## Support

The system is production-ready and includes comprehensive error handling, validation, and a user-friendly interface.

