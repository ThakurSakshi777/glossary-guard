document.addEventListener('DOMContentLoaded', function() {
    const itemsKey = 'foodItems';
    let foodItems = JSON.parse(localStorage.getItem(itemsKey)) || [];
    let alertShownItems = new Set(); // Track items that have shown alerts

    // Initialize the page
    renderItems();
    setupForm();
    updateBadgeCount();
    startGlobalExpiryCheck();

    function startGlobalExpiryCheck() {
        setInterval(() => {
            foodItems.forEach(item => {
                checkExpiryStatus(item, true);
            });
        }, 60000); // Check every minute
    }

    function updateBadgeCount() {
        const badge = document.getElementById('expiringSoonBadge');
        if(badge) badge.textContent = foodItems.length;
        localStorage.setItem(itemsKey, JSON.stringify(foodItems));
    }

    function renderItems() {
        const container = document.getElementById('itemsContainer');
        const emptyState = document.getElementById('emptyState');
        
        container.innerHTML = '';
        
        if (foodItems.length === 0) {
            emptyState.classList.remove('d-none');
            return;
        }
        
        emptyState.classList.add('d-none');
        foodItems.sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
        
        foodItems.forEach(item => {
            const safeItem = {
                id: item.id || Date.now(),
                name: item.name || 'Unnamed Item',
                expiry: item.expiry || new Date().toISOString().split('T')[0],
                quantity: item.quantity || '1',
                category: item.category || 'general'
            };
            
            const card = createItemCard(safeItem);
            container.appendChild(card);
            startCountdown(card.querySelector('.countdown-text'), safeItem.expiry);
        });
    }

    function createItemCard(item) {
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4 mb-4';
        const isExpired = new Date(item.expiry) < new Date();
        
        card.innerHTML = `
            <div class="card ${isExpired ? 'border-danger' : 'border-success'}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="card-title text-success">
                            <i class="fas fa-${getCategoryIcon(item.category)} me-2"></i>
                            ${item.name}
                        </h5>
                        <button class="delete-btn btn btn-danger btn-sm">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <hr>
                    <div class="card-text">
                        <div class="mb-2">
                            <small class="text-muted">Expiry:</small>
                            <div class="fw-bold">${new Date(item.expiry).toLocaleDateString('en-US')}</div>
                        </div>
                        <div class="mb-2">
                            <small class="text-muted">Quantity:</small>
                            <div class="fw-bold">${item.quantity}</div>
                        </div>
                        <div class="mb-3">
                            <small class="text-muted">Category:</small>
                            <div class="badge bg-secondary">${item.category}</div>
                        </div>
                        <div class="countdown mb-2 text-center ${isExpired ? 'text-danger' : 'text-success'}">
                            <span class="countdown-text">${getCountdownText(item.expiry)}</span>
                        </div>
                        ${getProgressBar(item.expiry)}
                    </div>
                </div>
            </div>
        `;

        card.querySelector('.delete-btn').addEventListener('click', () => {
            if(confirm('Delete this item?')) {
                foodItems = foodItems.filter(i => i.id !== item.id);
                updateBadgeCount();
                renderItems();
            }
        });
        
        return card;
    }

    function setupForm() {
        const form = document.getElementById('foodForm');
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const newItem = {
                id: Date.now(),
                name: document.getElementById('item').value.trim(),
                expiry: document.getElementById('date').value,
                quantity: document.getElementById('quantity').value || '1',
                category: document.getElementById('category').value || 'general'
            };
            
            if (!newItem.name || !newItem.expiry) {
                showAlert('Please fill required fields!', 'danger');
                return;
            }
            
            const expiryDate = new Date(newItem.expiry);
            if (expiryDate < new Date()) {
                showAlert(`"${newItem.name}" has expired!`, 'warning');
                return;
            }
            
            foodItems.push(newItem);
            updateBadgeCount();
            renderItems();
            form.reset();
            
            // Immediate expiry check
            checkExpiryStatus(newItem);
        });
    }

    function checkExpiryStatus(item, isBackgroundCheck = false) {
        const expiry = new Date(item.expiry);
        const now = new Date();
        const diffHours = (expiry - now) / (1000 * 60 * 60);
        
        if (diffHours <= 0 && !alertShownItems.has(item.id)) {
            showAlert(`🚨 "${item.name}" has expired!`, 'danger');
            alertShownItems.add(item.id);
        }
        else if (diffHours <= 24 && !alertShownItems.has(item.id)) {
            showAlert(`⚠️ "${item.name}" expires in less than 24 hours!`, 'warning');
            alertShownItems.add(item.id);
        }
        else if (diffHours <= 48 && !isBackgroundCheck && !alertShownItems.has(item.id)) {
            showAlert(`ℹ️ "${item.name}" expires in about 2 days`, 'info');
            alertShownItems.add(item.id);
        }
    }

    // Helper functions
    function getCountdownText(expiryDate) {
        const now = new Date();
        const expiry = new Date(expiryDate);
        const diff = expiry - now;
        
        if (diff <= 0) return 'EXPIRED!';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    function startCountdown(element, expiryDate) {
        const interval = setInterval(() => {
            const text = getCountdownText(expiryDate);
            element.textContent = text;
            
            if (text.includes('EXPIRED')) {
                element.classList.add('text-danger');
                clearInterval(interval);
                checkExpiryStatus({ expiry: expiryDate }, true);
            }
        }, 1000);
    }

    function getProgressBar(expiryDate) {
        const expiry = new Date(expiryDate);
        const now = new Date();
        const total = expiry - now;
        
        if (total <= 0) return '<div class="progress"><div class="progress-bar bg-danger" style="width: 100%"></div></div>';
        
        const passed = now - new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
        const percentage = Math.min(100, Math.floor((passed / total) * 100));
        const color = percentage > 75 ? 'bg-danger' : percentage > 50 ? 'bg-warning' : 'bg-success';
        
        return `<div class="progress"><div class="progress-bar ${color}" style="width: ${percentage}%"></div></div>`;
    }

    function showAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show fixed-top mt-5`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.prepend(alert);
        setTimeout(() => alert.remove(), 5000);
    }

    function getCategoryIcon(category) {
        const icons = {
            dairy: 'cheese',
            vegetables: 'carrot',
            meat: 'drumstick-bite',
            general: 'box'
        };
        return icons[category.toLowerCase()] || 'shopping-basket';
    }
});