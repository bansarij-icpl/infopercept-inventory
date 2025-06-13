# Updated Inventory Management System

## What's New in This Version

### ✨ **Major Improvements**

1. **Quantity-Based Item Management**
   - Employees can now receive multiple quantities of each item (not just 1)
   - Use `+` and `-` buttons to adjust quantities when adding/updating employees
   - Track exact quantities for bags, pens, diaries, bottles, and all T-shirt sizes

2. **Enhanced Employee Updates**
   - When updating existing employees (like Bansari asking for another bottle), use the quantity controls
   - Simply increase the bottle quantity from 1 to 2 using the `+` button
   - Stock is automatically adjusted based on quantity changes

3. **Professional Grid Layout**
   - Employees are now displayed in a clean grid view instead of cards
   - Better organization and easier scanning of employee information
   - Responsive design that works on all screen sizes

4. **Modern Gray-Light Color Theme**
   - Replaced blue theme with professional gray-light color scheme
   - Improved readability and modern appearance
   - Subtle gradients and shadows for depth

### 🎯 **Key Features**

- **Dashboard**: Overview of all statistics and low stock alerts
- **Stock Management**: View and update inventory levels for all items
- **Employee Management**: Add, search, update, and delete employees
- **Quantity Controls**: Easy `+`/`-` buttons for item quantities
- **Email Alerts**: Automatic notifications when stock is low
- **Search Functionality**: Find employees by ID, name, email, department, or designation
- **Responsive Design**: Works perfectly on desktop and mobile devices

### 🚀 **How to Use**

1. **Setup**:
   ```bash
   cd inventory_management_system
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Run the Application**:
   ```bash
   python src/main.py
   ```

3. **Access the Application**:
   - Open your browser to `http://localhost:5000`
   - Navigate between Dashboard, Stock Management, and Employee Management

### 📋 **Usage Examples**

**Adding a New Employee:**
1. Go to Employee Management
2. Click "Add Employee"
3. Fill in employee details
4. Use `+`/`-` buttons to set quantities for each item
5. Submit the form

**Updating an Existing Employee (e.g., Bansari needs another bottle):**
1. Go to Employee Management
2. Find Bansari's card and click "Update"
3. In the bottle section, use the `+` button to increase from 1 to 2
4. Save the changes - stock will be automatically adjusted

**Managing Stock:**
1. Go to Stock Management
2. View current quantities for all items
3. Click "Update" on any item to modify stock levels
4. Low stock alerts appear automatically on the dashboard

### 🎨 **Design Features**

- **Professional Color Scheme**: Gray-light theme with purple accents
- **Grid Layout**: Clean, organized display of employees
- **Quantity Controls**: Intuitive `+`/`-` buttons for item management
- **Responsive Design**: Adapts to any screen size
- **Modern UI**: Smooth animations and hover effects
- **Clear Typography**: Easy-to-read fonts and proper spacing

### 📧 **Email Configuration**

To enable email notifications for low stock alerts:
1. Edit `src/email_service.py`
2. Configure your SMTP settings
3. The system will automatically send alerts to `bansrijiyani07@gmail.com` when stock falls below 30 items

### 🔧 **Technical Details**

- **Backend**: Python Flask with SQLite database
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Database**: SQLite with quantity-based tracking
- **API**: RESTful endpoints for all operations
- **Responsive**: Mobile-first design approach

This updated version provides a much more flexible and professional inventory management solution that meets all your requirements for quantity-based item tracking and modern UI design.

