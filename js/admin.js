// Admin Panel JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initDropdowns();
    initAlertCloses();
    initFileUpload();
    initSidebar();
    initTabs();
    updateCurrentYear();
    setupEditors();
});

// Dropdown functionality
function initDropdowns() {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const dropdown = this.closest('.dropdown');
            dropdown.classList.toggle('show');
            
            // Close other dropdowns
            dropdownToggles.forEach(otherToggle => {
                if (otherToggle !== this) {
                    otherToggle.closest('.dropdown').classList.remove('show');
                }
            });
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        dropdownToggles.forEach(toggle => {
            const dropdown = toggle.closest('.dropdown');
            if (dropdown && !dropdown.contains(event.target)) {
                dropdown.classList.remove('show');
            }
        });
    });
}

// Alert close buttons
function initAlertCloses() {
    const alertCloses = document.querySelectorAll('.alert-close');
    
    alertCloses.forEach(close => {
        close.addEventListener('click', function() {
            const alert = this.closest('.alert');
            alert.style.opacity = '0';
            setTimeout(() => {
                alert.style.display = 'none';
            }, 300);
        });
    });
    
    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            if (alert) {
                alert.style.opacity = '0';
                setTimeout(() => {
                    if (alert) {
                        alert.style.display = 'none';
                    }
                }, 300);
            }
        }, 5000);
    });
}

// File upload preview
function initFileUpload() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            const fileNameElement = this.closest('.file-upload').querySelector('.selected-file');
            const previewElement = this.closest('.file-upload').querySelector('.image-preview');
            
            if (fileNameElement) {
                if (this.files.length > 0) {
                    fileNameElement.textContent = `Selected: ${this.files[0].name}`;
                } else {
                    fileNameElement.textContent = '';
                }
            }
            
            if (previewElement && this.files.length > 0) {
                const file = this.files[0];
                
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    
                    reader.onload = function(e) {
                        previewElement.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                    };
                    
                    reader.readAsDataURL(file);
                } else {
                    previewElement.innerHTML = '';
                }
            }
        });
    });
}

// Mobile sidebar toggle
function initSidebar() {
    const sidebarToggle = document.querySelector('.toggle-sidebar');
    const sidebar = document.querySelector('.admin-sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(event) {
            if (window.innerWidth <= 768) {
                if (sidebar && !sidebar.contains(event.target) && !sidebarToggle.contains(event.target)) {
                    sidebar.classList.remove('show');
                }
            }
        });
    }
}

// Tab navigation
function initTabs() {
    const tabNavs = document.querySelectorAll('.tab-nav button');
    
    tabNavs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            const tabContainer = this.closest('.tabs');
            
            // Update active tab nav
            tabContainer.querySelectorAll('.tab-nav button').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            
            // Update active tab content
            tabContainer.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            tabContainer.querySelector(`.tab-content[data-tab="${tabId}"]`).classList.add('active');
        });
    });
}

// Update current year
function updateCurrentYear() {
    const yearElement = document.querySelector('.current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// Rich text editor setup
function setupEditors() {
    const editors = document.querySelectorAll('.editor-container');
    
    editors.forEach(editor => {
        const toolbar = editor.querySelector('.editor-toolbar');
        const content = editor.querySelector('.editor-content');
        
        if (!toolbar || !content) return;
        
        // Make content editable
        content.contentEditable = true;
        
        // Listen for input and update hidden field
        const hiddenInput = editor.nextElementSibling;
        if (hiddenInput && hiddenInput.type === 'hidden') {
            content.addEventListener('input', function() {
                hiddenInput.value = this.innerHTML;
            });
            
            // Initialize with existing content
            if (hiddenInput.value) {
                content.innerHTML = hiddenInput.value;
            }
        }
        
        // Toolbar button functionality
        const buttons = toolbar.querySelectorAll('button');
        
        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                const command = this.getAttribute('data-command');
                
                if (command === 'h2' || command === 'h3' || command === 'p') {
                    document.execCommand('formatBlock', false, command);
                } else if (command === 'createlink') {
                    const url = prompt('Enter the link URL:');
                    if (url) document.execCommand(command, false, url);
                } else {
                    document.execCommand(command, false, null);
                }
                
                content.focus();
            });
        });
    });
}

// Confirm delete
function confirmDelete(message) {
    return confirm(message || 'Are you sure you want to delete this item?');
}

// Date and time formatting
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Form validation
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let valid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            
            // Add error message if not exists
            let errorMessage = field.nextElementSibling;
            if (!errorMessage || !errorMessage.classList.contains('invalid-feedback')) {
                errorMessage = document.createElement('div');
                errorMessage.className = 'invalid-feedback';
                errorMessage.textContent = 'This field is required';
                field.parentNode.insertBefore(errorMessage, field.nextSibling);
            }
            
            valid = false;
        } else {
            field.classList.remove('is-invalid');
            
            // Remove error message if exists
            const errorMessage = field.nextElementSibling;
            if (errorMessage && errorMessage.classList.contains('invalid-feedback')) {
                errorMessage.remove();
            }
        }
    });
    
    return valid;
}