// Global variables
const API_BASE_URL = "/api";

let pendingStockQuantity = 0;

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

// Add after modal DOM elements
const addStockItemModal = document.getElementById("add-stock-item-modal");
const addStockItemBtn = document.getElementById("add-stock-item-btn");
const closeAddStockItemModalBtn = document.getElementById("close-add-stock-item-modal");

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

    // Add Stock Item button
    if (addStockItemBtn) {
        addStockItemBtn.addEventListener("click", () => {
            showModal(addStockItemModal);
        });
    }
    if (closeAddStockItemModalBtn) {
        closeAddStockItemModalBtn.addEventListener("click", () => {
            closeModal(addStockItemModal);
        });
    }
    const addStockItemForm = document.getElementById("add-stock-item-form");
    if (addStockItemForm) {
        addStockItemForm.addEventListener("submit", handleAddStockItem);
    }

    // Update Stock Modal + and - buttons
    const increaseBtn = document.getElementById("increase-stock-btn");
    const decreaseBtn = document.getElementById("decrease-stock-btn");
    const adjustAmountInput = document.getElementById("adjust-amount");
    const stockItemNameInput = document.getElementById("stock-item-name");
    if (increaseBtn && decreaseBtn && adjustAmountInput && stockItemNameInput) {
        increaseBtn.onclick = () => {
            const amount = parseInt(adjustAmountInput.value) || 1;
            pendingStockQuantity += amount;
            document.getElementById("stock-current-quantity").textContent = pendingStockQuantity;
        };
        decreaseBtn.onclick = () => {
            const amount = parseInt(adjustAmountInput.value) || 1;
            pendingStockQuantity = Math.max(0, pendingStockQuantity - amount);
            document.getElementById("stock-current-quantity").textContent = pendingStockQuantity;
        };
    }

    // Event delegation for dynamically created restock buttons in alerts
    document.getElementById("low-stock-alerts").addEventListener("click", function(e) {
        if (e.target.classList.contains("restock-btn")) {
            const itemName = e.target.getAttribute("data-item");
            const quantity = parseInt(e.target.getAttribute("data-quantity")) || 0;
            openUpdateStockModal(itemName, quantity);
        }
    });
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
            <div class="alert alert-info" style="border-left: 4px solid #667eea; background: #f4f7ff; padding: 1.5rem; border-radius: 1rem; margin-bottom: 1rem;">
                <h4 style="color: #2d3748; margin-bottom: 0.5rem;">All Good!</h4>
                <p style="color: #4a5568;">No items are currently low in stock.</p>
            </div>
        `;
        return;
    }

    alertsContainer.innerHTML = lowStockItems.map(item => `
        <div class="alert alert-warning" style="display: flex; align-items: center; justify-content: flex-start; border-left: 4px solid #e53e3e; background: #fff5f5; padding: 1.5rem; border-radius: 1rem; margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(229,62,62,0.08);">
            <div style="flex: 1;">
                <h4 style="color: #c53030; margin-bottom: 0.5rem; font-weight: 700;">Low Stock Alert: <span style='text-transform: capitalize;'>${item.name || item.item_name}</span></h4>
                <p style="color: #a94442; margin-bottom: 1rem;">Current quantity: <b>${item.quantity}</b> <span style='color:#718096;'>(Danger level: ${item.danger_level})</span></p>
                <button class="btn btn-primary restock-btn" 
                    style="background: linear-gradient(135deg, #5161a6 0%, #091239 100%); color: white; font-weight: 600; border: none; border-radius: 0.5rem; padding: 0.6rem 1.5rem; box-shadow: 0 2px 8px rgba(102,126,234,0.08); margin-top: 0.5rem; margin-left: 280px;" 
                    data-item="${item.item_name || item.name}" 
                    data-quantity="${item.quantity}">
                    <i class="fas fa-plus-circle"></i> Restock Item
                </button>
            </div>
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
    const standardGrid = document.getElementById("stock-grid-standard");
    const tshirtsGrid = document.getElementById("stock-grid-tshirts");
    
    const standardItems = [];
    const tshirtItems = [];

    stockItems.forEach(item => {
        if (item.item_name.startsWith("tshirt_")) {
            tshirtItems.push(item);
        } else {
            standardItems.push(item);
        }
    });

    const renderItems = (items) => items.map(item => `
        <div class="stock-item">
            <div class="stock-item-header">
                <div class="stock-item-name">${formatItemName(item.item_name)}</div>
                <div class="stock-quantity ${item.quantity <= item.danger_level ? 'low' : ''}">${item.quantity}</div>
            </div>
            <div class="stock-actions">
                <button class="btn btn-primary" onclick="openUpdateStockModal('${item.item_name}', ${item.quantity})">
                    <i class="fas fa-edit"></i> Update
                </button>
            </div>
        </div>
    `).join("");

    standardGrid.innerHTML = renderItems(standardItems);
    tshirtsGrid.innerHTML = renderItems(tshirtItems);
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
                    <h3>${employee.first_name} ${employee.last_name}</h3>
                </div>
                <div class="employee-id">${employee.employee_id}</div>
            </div>
            <div class="employee-details">
                <p><strong>Department:</strong> ${employee.department_name}</p>
                <p><strong>Blood Group:</strong> ${employee.blood_group}</p>
                <p><strong>Emergency No:</strong> ${employee.emergency_no}</p>
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
    document.getElementById("adjust-amount").value = 1;
    pendingStockQuantity = currentQuantity;
    document.getElementById("stock-current-quantity").textContent = pendingStockQuantity;
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
        const itemName = document.getElementById("stock-item-name").value;
        const response = await fetch(`${API_BASE_URL}/stock/${itemName}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: pendingStockQuantity })
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
    return itemName
        .replace(/_/g, " ")
        .replace(/\b\w/g, l => l.toUpperCase())
        .replace("Tshirt", "T-shirt");
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

// Add handler for adding new stock item
async function handleAddStockItem(e) {
    e.preventDefault();
    try {
        showLoading(true);
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.quantity = parseInt(data.quantity) || 0;
        data.danger_level = parseInt(data.danger_level) || 30;
        const response = await fetch(`${API_BASE_URL}/stock`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            showToast("Stock item added successfully!");
            closeModal(addStockItemModal);
            loadStock();
        } else {
            const error = await response.json();
            showToast(error.error || "Error adding stock item", "error");
        }
    } catch (error) {
        showToast("Error adding stock item", "error");
    } finally {
        showLoading(false);
    }
}

