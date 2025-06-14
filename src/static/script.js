// Global variables
const API_BASE_URL = "/api";

// DOM elements
const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");
const pageTitle = document.getElementById("page-title");
const searchContainer = document.getElementById("search-container");
const searchInput = document.getElementById("search-input");
const addEmployeeBtn = document.getElementById("add-employee-btn");
const loading = document.getElementById("loading");
const toastContainer = document.getElementById("toast-container");

// Modals
const addEmployeeModal = document.getElementById("add-employee-modal");
const updateEmployeeModal = document.getElementById("update-employee-modal");
const updateStockModal = document.getElementById("update-stock-modal");

// Add New Item Modal logic
const addItemBtn = document.getElementById('add-item-btn');
const addItemModal = document.getElementById('add-item-modal');
const closeAddItemModal = document.getElementById('close-add-item-modal');
const cancelAddItem = document.getElementById('cancel-add-item');
const addItemForm = document.getElementById('add-item-form');

// Initialize app
document.addEventListener("DOMContentLoaded", function() {
    initializeApp();
    setupEventListeners();
    loadDashboardData();
});

function initializeApp() {
    // Set initial page
    showPage("dashboard");
}

function setupEventListeners() {
    // Navigation
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const page = item.dataset.page;
            showPage(page);
        });
    });

    // Search
    searchInput.addEventListener("input", debounce(handleSearch, 300));

    // Add employee button
    addEmployeeBtn.addEventListener("click", () => {
        openAddEmployeeModal();
    });

    // Modal close buttons
    document.querySelectorAll(".close").forEach(closeBtn => {
        closeBtn.addEventListener("click", (e) => {
            closeModal(e.target.closest(".modal"));
        });
    });

    // Cancel buttons
    document.getElementById("cancel-employee").addEventListener("click", () => {
        closeModal(addEmployeeModal);
    });
    
    document.getElementById("cancel-update-employee").addEventListener("click", () => {
        closeModal(updateEmployeeModal);
    });
    
    document.getElementById("cancel-stock").addEventListener("click", () => {
        closeModal(updateStockModal);
    });

    // Form submissions
    document.getElementById("add-employee-form").addEventListener("submit", handleAddEmployee);
    document.getElementById("update-employee-form").addEventListener("submit", handleUpdateEmployee);
    document.getElementById("update-stock-form").addEventListener("submit", handleUpdateStock);

    // Quantity controls
    setupQuantityControls();

    // Close modals on outside click
    window.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal")) {
            closeModal(e.target);
        }
    });

    // Add New Item Modal logic
    if (addItemBtn) {
        addItemBtn.addEventListener('click', () => {
            addItemModal.style.display = 'block';
        });
    }
    if (closeAddItemModal) {
        closeAddItemModal.addEventListener('click', () => {
            addItemModal.style.display = 'none';
        });
    }
    if (cancelAddItem) {
        cancelAddItem.addEventListener('click', () => {
            addItemModal.style.display = 'none';
        });
    }
    if (addItemForm) {
        addItemForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const itemName = document.getElementById('new-item-name').value.trim();
            const quantity = parseInt(document.getElementById('new-item-quantity').value);
            const dangerLevel = parseInt(document.getElementById('new-item-danger').value);
            try {
                const response = await fetch(`${API_BASE_URL}/stock`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ item_name: itemName, quantity, danger_level: dangerLevel })
                });
                if (!response.ok) throw new Error('Failed to add item');
                showToast('Item added successfully!');
                addItemModal.style.display = 'none';
                loadStock();
                loadDashboardData();
            } catch (error) {
                showToast('Error adding item', 'error');
            }
        });
    }
}

function setupQuantityControls() {
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("qty-btn")) {
            const isPlus = e.target.classList.contains("plus");
            const isMinus = e.target.classList.contains("minus");
            const item = e.target.dataset.item;
            const input = e.target.parentElement.querySelector("input[type='number']");
            
            if (isPlus) {
                input.value = parseInt(input.value) + 1;
            } else if (isMinus && parseInt(input.value) > 0) {
                input.value = parseInt(input.value) - 1;
            }
        }
    });
}

function showPage(pageName) {
    // Update navigation
    navItems.forEach(item => {
        item.classList.toggle("active", item.dataset.page === pageName);
    });

    // Update pages
    pages.forEach(page => {
        page.classList.toggle("active", page.id === `${pageName}-page`);
    });

    // Update header
    const titles = {
        dashboard: "Dashboard",
        stock: "Stock Management",
        employees: "Employee Management"
    };
    pageTitle.textContent = titles[pageName];

    // Show/hide search and add button based on page
    if (pageName === "employees") {
        searchContainer.style.display = "flex";
        addEmployeeBtn.style.display = "inline-flex";
        loadEmployees();
    } else {
        searchContainer.style.display = "none";
        addEmployeeBtn.style.display = "none";
    }

    // Load page-specific data
    if (pageName === "stock") {
        loadStock();
    } else if (pageName === "dashboard") {
        loadDashboardData();
    }
}

async function loadDashboardData() {
    try {
        showLoading(true);
        
        const [stockResponse, statsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/stock`),
            fetch(`${API_BASE_URL}/employees/stats`)
        ]);

        const stockData = await stockResponse.json();
        const statsData = await statsResponse.json();

        updateDashboardStats(statsData);
        updateLowStockAlerts(stockData.low_stock_items || []);
        
    } catch (error) {
        console.error("Error loading dashboard data:", error);
        showToast("Error loading dashboard data", "error");
    } finally {
        showLoading(false);
    }
}

function updateDashboardStats(stats) {
    document.getElementById("total-employees").textContent = stats.total_employees || 0;
    document.getElementById("bags-distributed").textContent = stats.bags_distributed || 0;
    document.getElementById("pens-distributed").textContent = stats.pens_distributed || 0;
    document.getElementById("diaries-distributed").textContent = stats.diaries_distributed || 0;
    document.getElementById("bottles-distributed").textContent = stats.bottles_distributed || 0;
    
    // Update individual T-shirt sizes
    const tshirtSizes = stats.tshirt_sizes_distributed || {};
    document.getElementById("tshirt-s-distributed").textContent = tshirtSizes.S || 0;
    document.getElementById("tshirt-m-distributed").textContent = tshirtSizes.M || 0;
    document.getElementById("tshirt-l-distributed").textContent = tshirtSizes.L || 0;
    document.getElementById("tshirt-xl-distributed").textContent = tshirtSizes.XL || 0;
    document.getElementById("tshirt-xxl-distributed").textContent = tshirtSizes.XXL || 0;
    document.getElementById("tshirt-xxxl-distributed").textContent = tshirtSizes.XXXL || 0;
}

function updateLowStockAlerts(lowStockItems) {
    const alertsContainer = document.getElementById("low-stock-alerts");
    
    if (lowStockItems.length === 0) {
        alertsContainer.innerHTML = `
            <div class="alert alert-info">
                <h4>All Good!</h4>
                <p>No items are currently low in stock.</p>
            </div>
        `;
        return;
    }

    alertsContainer.innerHTML = lowStockItems.map(item => `
        <div class="alert">
            <h4>Low Stock Alert: ${item.name}</h4>
            <p>Current quantity: ${item.quantity} (Danger level: ${item.danger_level})</p>
        </div>
    `).join("");
}

async function loadStock() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/stock`);
        const data = await response.json();
        
        displayStock(data.stock_items || []);
    } catch (error) {
        console.error("Error loading stock:", error);
        showToast("Error loading stock data", "error");
    } finally {
        showLoading(false);
    }
}

function displayStock(stockItems) {
    const stockGrid = document.getElementById("stock-grid");
    stockGrid.innerHTML = stockItems.map(item => `
        <div class="stock-item">
            <div class="stock-item-header">
                <div class="stock-item-name">${formatItemName(item.item_name)}</div>
                <div class="stock-quantity ${item.quantity <= item.danger_level ? 'low' : ''}">${item.quantity}</div>
            </div>
            <div class="danger-level-label" style="margin: 0.5rem 0 1rem 0;">
                Danger Level: <span class="danger-level-value">${item.danger_level}</span>
                <i class="fas fa-edit edit-danger-level" data-item="${item.item_name}" style="cursor:pointer; margin-left:6px;"></i>
            </div>
            <div class="stock-actions">
                <button class="btn btn-primary" onclick="openUpdateStockModal('${item.item_name}', ${item.quantity})">
                    <i class="fas fa-edit"></i> Update
                </button>
                <button class="btn btn-danger delete-stock-btn" data-item="${item.item_name}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join("");
    addStockItemEventListeners();
}

function addStockItemEventListeners() {
    // Delete button
    document.querySelectorAll('.delete-stock-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const item = this.dataset.item;
            if (!confirm('Are you sure you want to delete this item?')) return;
            try {
                const response = await fetch(`${API_BASE_URL}/stock/${item}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Failed to delete item');
                showToast('Item deleted successfully!');
                loadStock();
                loadDashboardData();
            } catch (error) {
                showToast('Error deleting item', 'error');
            }
        });
    });
    // Edit danger level
    document.querySelectorAll('.edit-danger-level').forEach(icon => {
        icon.addEventListener('click', function() {
            const item = this.dataset.item;
            const valueSpan = this.closest('.danger-level-label').querySelector('.danger-level-value');
            const currentValue = valueSpan.textContent;
            const input = document.createElement('input');
            input.type = 'number';
            input.value = currentValue;
            input.min = 0;
            input.style.width = '60px';
            valueSpan.replaceWith(input);
            input.focus();
            input.addEventListener('blur', async function() {
                const newValue = parseInt(input.value);
                try {
                    const response = await fetch(`${API_BASE_URL}/stock/${item}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ danger_level: newValue })
                    });
                    if (!response.ok) throw new Error('Failed to update danger level');
                    showToast('Danger level updated!');
                    loadStock();
                    loadDashboardData();
                } catch (error) {
                    showToast('Error updating danger level', 'error');
                }
            });
        });
    });
}

async function loadEmployees(searchQuery = "") {
    try {
        showLoading(true);
        const url = searchQuery 
            ? `${API_BASE_URL}/employees?search=${encodeURIComponent(searchQuery)}`
            : `${API_BASE_URL}/employees`;
            
        const response = await fetch(url);
        const employees = await response.json();
        
        displayEmployees(employees);
    } catch (error) {
        console.error("Error loading employees:", error);
        showToast("Error loading employees", "error");
    } finally {
        showLoading(false);
    }
}

function displayEmployees(employees) {
    const employeesGrid = document.getElementById("employees-grid");
    
    if (employees.length === 0) {
        employeesGrid.innerHTML = `
            <div class="text-center" style="grid-column: 1 / -1; padding: 2rem;">
                <h3>No employees found</h3>
                <p>Add some employees to get started.</p>
            </div>
        `;
        return;
    }

    employeesGrid.innerHTML = employees.map(employee => `
        <div class="employee-card">
            <div class="employee-header">
                <div class="employee-info">
                    <h3>${employee.name}</h3>
                    <p>${employee.email}</p>
                </div>
                <div class="employee-id">${employee.employee_id}</div>
            </div>
            <div class="employee-details">
                <p><strong>Department:</strong> ${employee.department}</p>
                <p><strong>Designation:</strong> ${employee.designation}</p>
            </div>
            <div class="employee-items">
                <h4>Items Received</h4>
                <div class="items-grid">
                    <div class="item-badge ${employee.bag_quantity > 0 ? 'has-items' : ''}">
                        Bag: ${employee.bag_quantity}
                    </div>
                    <div class="item-badge ${employee.pen_quantity > 0 ? 'has-items' : ''}">
                        Pen: ${employee.pen_quantity}
                    </div>
                    <div class="item-badge ${employee.diary_quantity > 0 ? 'has-items' : ''}">
                        Diary: ${employee.diary_quantity}
                    </div>
                    <div class="item-badge ${employee.bottle_quantity > 0 ? 'has-items' : ''}">
                        Bottle: ${employee.bottle_quantity}
                    </div>
                    <div class="item-badge ${employee.tshirt_s_quantity > 0 ? 'has-items' : ''}">
                        T-shirt S: ${employee.tshirt_s_quantity}
                    </div>
                    <div class="item-badge ${employee.tshirt_m_quantity > 0 ? 'has-items' : ''}">
                        T-shirt M: ${employee.tshirt_m_quantity}
                    </div>
                    <div class="item-badge ${employee.tshirt_l_quantity > 0 ? 'has-items' : ''}">
                        T-shirt L: ${employee.tshirt_l_quantity}
                    </div>
                    <div class="item-badge ${employee.tshirt_xl_quantity > 0 ? 'has-items' : ''}">
                        T-shirt XL: ${employee.tshirt_xl_quantity}
                    </div>
                    <div class="item-badge ${employee.tshirt_xxl_quantity > 0 ? 'has-items' : ''}">
                        T-shirt XXL: ${employee.tshirt_xxl_quantity}
                    </div>
                    <div class="item-badge ${employee.tshirt_xxxl_quantity > 0 ? 'has-items' : ''}">
                        T-shirt XXXL: ${employee.tshirt_xxxl_quantity}
                    </div>
                </div>
            </div>
            <div class="employee-actions">
                <button class="btn btn-primary" onclick="openUpdateEmployeeModal('${employee.employee_id}')">
                    <i class="fas fa-edit"></i> Update
                </button>
                <button class="btn btn-danger" onclick="deleteEmployee('${employee.employee_id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join("");
}

function openAddEmployeeModal() {
    // Reset form
    document.getElementById("add-employee-form").reset();
    
    // Reset all quantity inputs to 0
    const quantityInputs = addEmployeeModal.querySelectorAll("input[type='number']");
    quantityInputs.forEach(input => input.value = 0);
    
    showModal(addEmployeeModal);
}

async function openUpdateEmployeeModal(employeeId) {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`);
        const employee = await response.json();
        
        // Populate form
        document.getElementById("update-employee-id").value = employee.employee_id;
        document.getElementById("update-employee-name").value = employee.name;
        document.getElementById("update-employee-email").value = employee.email;
        document.getElementById("update-employee-department").value = employee.department;
        document.getElementById("update-employee-designation").value = employee.designation;
        
        // Populate kit items
        populateUpdateKitItems(employee);
        
        showModal(updateEmployeeModal);
    } catch (error) {
        console.error("Error loading employee:", error);
        showToast("Error loading employee data", "error");
    } finally {
        showLoading(false);
    }
}

function populateUpdateKitItems(employee) {
    const kitItemsContainer = document.getElementById("update-kit-items");
    const tshirtSizesContainer = document.getElementById("update-tshirt-sizes");
    
    const kitItems = [
        { name: "bag", label: "Bag", quantity: employee.bag_quantity },
        { name: "pen", label: "Pen", quantity: employee.pen_quantity },
        { name: "diary", label: "Diary", quantity: employee.diary_quantity },
        { name: "bottle", label: "Bottle", quantity: employee.bottle_quantity }
    ];
    
    const tshirtSizes = [
        { name: "tshirt_s", label: "S", quantity: employee.tshirt_s_quantity },
        { name: "tshirt_m", label: "M", quantity: employee.tshirt_m_quantity },
        { name: "tshirt_l", label: "L", quantity: employee.tshirt_l_quantity },
        { name: "tshirt_xl", label: "XL", quantity: employee.tshirt_xl_quantity },
        { name: "tshirt_xxl", label: "XXL", quantity: employee.tshirt_xxl_quantity },
        { name: "tshirt_xxxl", label: "XXXL", quantity: employee.tshirt_xxxl_quantity }
    ];
    
    kitItemsContainer.innerHTML = kitItems.map(item => `
        <div class="kit-item">
            <label>${item.label}</label>
            <div class="quantity-controls">
                <button type="button" class="qty-btn minus" data-item="${item.name}">-</button>
                <input type="number" name="${item.name}_quantity" value="${item.quantity}" min="0" readonly>
                <button type="button" class="qty-btn plus" data-item="${item.name}">+</button>
            </div>
        </div>
    `).join("");
    
    tshirtSizesContainer.innerHTML = tshirtSizes.map(item => `
        <div class="kit-item">
            <label>${item.label}</label>
            <div class="quantity-controls">
                <button type="button" class="qty-btn minus" data-item="${item.name}">-</button>
                <input type="number" name="${item.name}_quantity" value="${item.quantity}" min="0" readonly>
                <button type="button" class="qty-btn plus" data-item="${item.name}">+</button>
            </div>
        </div>
    `).join("");
}

function openUpdateStockModal(itemName, currentQuantity) {
    document.getElementById("stock-item-name").value = itemName;
    document.getElementById("stock-item-display").value = formatItemName(itemName);
    document.getElementById("stock-quantity").value = currentQuantity;
    
    showModal(updateStockModal);
}

async function handleAddEmployee(e) {
    e.preventDefault();
    
    try {
        showLoading(true);
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Convert quantity strings to numbers
        Object.keys(data).forEach(key => {
            if (key.includes("quantity")) {
                data[key] = parseInt(data[key]) || 0;
            }
        });
        
        const response = await fetch(`${API_BASE_URL}/employees`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showToast("Employee added successfully!");
            closeModal(addEmployeeModal);
            loadEmployees();
            loadDashboardData();
        } else {
            const error = await response.json();
            showToast(error.error || "Error adding employee", "error");
        }
    } catch (error) {
        console.error("Error adding employee:", error);
        showToast("Error adding employee", "error");
    } finally {
        showLoading(false);
    }
}

async function handleUpdateEmployee(e) {
    e.preventDefault();
    
    try {
        showLoading(true);
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        const employeeId = data.employee_id;
        
        // Convert quantity strings to numbers
        Object.keys(data).forEach(key => {
            if (key.includes("quantity")) {
                data[key] = parseInt(data[key]) || 0;
            }
        });
        
        delete data.employee_id; // Remove from data as it's in the URL
        
        const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showToast("Employee updated successfully!");
            closeModal(updateEmployeeModal);
            loadEmployees();
            loadDashboardData();
        } else {
            const error = await response.json();
            showToast(error.error || "Error updating employee", "error");
        }
    } catch (error) {
        console.error("Error updating employee:", error);
        showToast("Error updating employee", "error");
    } finally {
        showLoading(false);
    }
}

async function handleUpdateStock(e) {
    e.preventDefault();
    
    try {
        showLoading(true);
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        const response = await fetch(`${API_BASE_URL}/stock/${data.item_name}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ quantity: parseInt(data.quantity) })
        });
        
        if (response.ok) {
            showToast("Stock updated successfully!");
            closeModal(updateStockModal);
            loadStock();
            loadDashboardData();
        } else {
            const error = await response.json();
            showToast(error.error || "Error updating stock", "error");
        }
    } catch (error) {
        console.error("Error updating stock:", error);
        showToast("Error updating stock", "error");
    } finally {
        showLoading(false);
    }
}

async function deleteEmployee(employeeId) {
    if (!confirm("Are you sure you want to delete this employee?")) {
        return;
    }
    
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
            method: "DELETE"
        });
        
        if (response.ok) {
            showToast("Employee deleted successfully!");
            loadEmployees();
            loadDashboardData();
        } else {
            const error = await response.json();
            showToast(error.error || "Error deleting employee", "error");
        }
    } catch (error) {
        console.error("Error deleting employee:", error);
        showToast("Error deleting employee", "error");
    } finally {
        showLoading(false);
    }
}

function handleSearch() {
    const query = searchInput.value.trim();
    loadEmployees(query);
}

function showModal(modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeModal(modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
}

function showLoading(show) {
    loading.classList.toggle("active", show);
}

function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div>
            <strong>${type === "error" ? "Error" : "Success"}</strong>
            <p>${message}</p>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function formatItemName(itemName) {
    // Format T-shirt items
    const tshirtMap = {
        'tshirt_s': 'T-shirt S',
        'tshirt_m': 'T-shirt M',
        'tshirt_l': 'T-shirt L',
        'tshirt_xl': 'T-shirt XL',
        'tshirt_xxl': 'T-shirt XXL',
        'tshirt_xxxl': 'T-shirt XXXL'
    };
    if (tshirtMap[itemName]) return tshirtMap[itemName];
    // Capitalize first letter for other items
    return itemName.charAt(0).toUpperCase() + itemName.slice(1);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

