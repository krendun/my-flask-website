// E-Commerce Demo Interactive Features
const EcommerceDemo = {
    // Product database
    products: [
        {
            id: 1,
            name: "Premium Headphones",
            price: 149.99,
            description: "High-quality over-ear headphones with noise cancellation.",
            image: "https://via.placeholder.com/200x150"
        },
        {
            id: 2,
            name: "Smartphone Stand",
            price: 24.95,
            description: "Adjustable aluminum stand for smartphones and tablets.",
            image: "https://via.placeholder.com/200x150"
        },
        {
            id: 3,
            name: "Wireless Mouse",
            price: 39.99,
            description: "Ergonomic wireless mouse with adjustable DPI settings.",
            image: "https://via.placeholder.com/200x150"
        },
        {
            id: 4,
            name: "Mechanical Keyboard",
            price: 89.95,
            description: "RGB backlit mechanical keyboard with customizable keys.",
            image: "https://via.placeholder.com/200x150"
        }
    ],
    
    // Cart management with localStorage
    cart: {
        items: [],
        
        // Load cart from localStorage
        load() {
            const savedCart = localStorage.getItem('ecommerce-demo-cart');
            if (savedCart) {
                this.items = JSON.parse(savedCart);
            }
        },
        
        // Save cart to localStorage
        save() {
            localStorage.setItem('ecommerce-demo-cart', JSON.stringify(this.items));
        },
        
        // Add product to cart
        addItem(productId) {
            const product = EcommerceDemo.products.find(p => p.id === productId);
            if (!product) return false;
            
            const existingItem = this.items.find(item => item.id === productId);
            if (existingItem) {
                existingItem.quantity++;
            } else {
                this.items.push({
                    id: product.id, 
                    name: product.name, 
                    price: product.price, 
                    quantity: 1
                });
            }
            
            this.save();
            return true;
        },
        
        // Remove product from cart
        removeItem(productId) {
            const index = this.items.findIndex(item => item.id === productId);
            if (index !== -1) {
                this.items.splice(index, 1);
                this.save();
                return true;
            }
            return false;
        },
        
        // Update quantity
        updateQuantity(productId, quantity) {
            const item = this.items.find(item => item.id === productId);
            if (item) {
                if (quantity <= 0) {
                    return this.removeItem(productId);
                }
                
                item.quantity = quantity;
                this.save();
                return true;
            }
            return false;
        },
        
        // Get cart total
        getTotal() {
            return this.items.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
        },
        
        // Clear cart
        clear() {
            this.items = [];
            this.save();
        }
    },
    
    // UI management
    ui: {
        // Initialize the UI
        init() {
            // Load cart from localStorage
            EcommerceDemo.cart.load();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Render initial cart
            this.renderCart();
        },
        
        // Set up event listeners
        setupEventListeners() {
            // Add to cart buttons
            const addButtons = document.querySelectorAll('.btn');
            addButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Get product info
                    const productEl = button.closest('.product');
                    const productId = parseInt(productEl.dataset.id || 
                        EcommerceDemo.products.findIndex(p => 
                            p.name === productEl.querySelector('h3').textContent) + 1);
                    
                    // Add to cart
                    if (EcommerceDemo.cart.addItem(productId)) {
                        this.showMessage(`Added ${productEl.querySelector('h3').textContent} to cart!`);
                        this.renderCart();
                    }
                });
            });
            
            // Checkout button
            const checkoutBtn = document.querySelector('.cart a.btn');
            if (checkoutBtn) {
                checkoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    if (EcommerceDemo.cart.items.length === 0) {
                        this.showMessage('Your cart is empty!', 'warning');
                    } else {
                        this.showMessage('Order placed successfully! Thank you for your purchase.', 'success');
                        EcommerceDemo.cart.clear();
                        this.renderCart();
                    }
                });
            }
        },
        
        // Render cart contents
        renderCart() {
            const cartItemsEl = document.querySelector('.cart-items');
            const cartTotalEl = document.querySelector('.cart-total');
            
            if (!cartItemsEl) return;
            
            // Clear existing items
            cartItemsEl.innerHTML = '';
            
            // Add cart items
            if (EcommerceDemo.cart.items.length === 0) {
                const emptyItem = document.createElement('li');
                emptyItem.className = 'cart-item empty';
                emptyItem.textContent = 'Your cart is empty';
                cartItemsEl.appendChild(emptyItem);
            } else {
                EcommerceDemo.cart.items.forEach(item => {
                    const cartItem = document.createElement('li');
                    cartItem.className = 'cart-item';
                    
                    // Create item details
                    const itemDetails = document.createElement('div');
                    itemDetails.textContent = `${item.name} x ${item.quantity}`;
                    
                    // Create price
                    const itemPrice = document.createElement('div');
                    itemPrice.textContent = `$${(item.price * item.quantity).toFixed(2)}`;
                    
                    // Add remove button
                    const removeBtn = document.createElement('button');
                    removeBtn.textContent = 'x';
                    removeBtn.className = 'remove-item';
                    removeBtn.addEventListener('click', () => {
                        EcommerceDemo.cart.removeItem(item.id);
                        this.renderCart();
                    });
                    
                    // Append all elements
                    cartItem.appendChild(itemDetails);
                    cartItem.appendChild(itemPrice);
                    cartItem.appendChild(removeBtn);
                    cartItemsEl.appendChild(cartItem);
                });
            }
            
            // Update total
            if (cartTotalEl) {
                cartTotalEl.textContent = `Total: $${EcommerceDemo.cart.getTotal()}`;
            }
        },
        
        // Show message popup
        showMessage(message, type = 'info') {
            // Create message element if it doesn't exist
            let messageEl = document.getElementById('demo-message');
            if (!messageEl) {
                messageEl = document.createElement('div');
                messageEl.id = 'demo-message';
                document.body.appendChild(messageEl);
                
                // Add styles
                messageEl.style.position = 'fixed';
                messageEl.style.top = '20px';
                messageEl.style.right = '20px';
                messageEl.style.padding = '15px 20px';
                messageEl.style.borderRadius = '5px';
                messageEl.style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
                messageEl.style.zIndex = '9999';
                messageEl.style.maxWidth = '300px';
                messageEl.style.transition = 'all 0.3s ease';
            }
            
            // Set type-specific styles
            if (type === 'success') {
                messageEl.style.backgroundColor = '#4caf50';
                messageEl.style.color = 'white';
            } else if (type === 'warning') {
                messageEl.style.backgroundColor = '#ff9800';
                messageEl.style.color = 'white';
            } else if (type === 'error') {
                messageEl.style.backgroundColor = '#f44336';
                messageEl.style.color = 'white';
            } else {
                messageEl.style.backgroundColor = '#2196f3';
                messageEl.style.color = 'white';
            }
            
            // Display message
            messageEl.textContent = message;
            messageEl.style.transform = 'translateX(0)';
            messageEl.style.opacity = '1';
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                messageEl.style.transform = 'translateX(120%)';
                messageEl.style.opacity = '0';
            }, 3000);
        }
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Add product IDs to products
    const products = document.querySelectorAll('.product');
    products.forEach((product, index) => {
        product.dataset.id = index + 1;
    });
    
    // Add styles for cart
    const style = document.createElement('style');
    style.textContent = `
        .cart-item {
            position: relative;
            padding-right: 30px;
        }
        .remove-item {
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            background: #f44336;
            color: white;
            border: none;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 12px;
        }
        .empty {
            color: #888;
            font-style: italic;
        }
    `;
    document.head.appendChild(style);
    
    // Initialize UI
    EcommerceDemo.ui.init();
});