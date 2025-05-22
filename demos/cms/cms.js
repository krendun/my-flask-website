// CMS Demo Interactive Features
const CMSDemo = {
    // Blog posts database
    posts: [
        {
            id: 1,
            title: "Getting Started with Our CMS",
            author: "Admin User",
            categories: ["Tutorials", "Documentation"],
            status: "published",
            date: "May 15, 2025"
        },
        {
            id: 2,
            title: "New Features Coming Soon",
            author: "Admin User",
            categories: ["News", "Updates"],
            status: "published",
            date: "May 12, 2025"
        },
        {
            id: 3,
            title: "How to Customize Your Theme",
            author: "Admin User",
            categories: ["Tutorials", "Design"],
            status: "draft",
            date: "May 10, 2025"
        },
        {
            id: 4,
            title: "SEO Best Practices for Content",
            author: "Admin User",
            categories: ["Tutorials", "SEO"],
            status: "published",
            date: "May 5, 2025"
        },
        {
            id: 5,
            title: "User Management Guide",
            author: "Admin User",
            categories: ["Documentation", "Security"],
            status: "draft",
            date: "May 3, 2025"
        }
    ],
    
    // Post management with localStorage
    postManager: {
        // Load posts from localStorage or use defaults
        loadPosts() {
            const savedPosts = localStorage.getItem('cms-demo-posts');
            if (savedPosts) {
                return JSON.parse(savedPosts);
            }
            return [...CMSDemo.posts]; // Return a copy of the default posts
        },
        
        // Save posts to localStorage
        savePosts(posts) {
            localStorage.setItem('cms-demo-posts', JSON.stringify(posts));
        },
        
        // Get posts with filtering/sorting options
        getPosts(options = {}) {
            let posts = this.loadPosts();
            
            // Filter by status if specified
            if (options.status) {
                posts = posts.filter(post => post.status === options.status);
            }
            
            // Filter by category if specified
            if (options.category) {
                posts = posts.filter(post => post.categories.includes(options.category));
            }
            
            // Sort posts if specified
            if (options.sortBy) {
                posts.sort((a, b) => {
                    if (options.sortOrder === 'asc') {
                        return a[options.sortBy] > b[options.sortBy] ? 1 : -1;
                    } else {
                        return a[options.sortBy] < b[options.sortBy] ? 1 : -1;
                    }
                });
            }
            
            return posts;
        },
        
        // Get a single post by ID
        getPost(id) {
            const posts = this.loadPosts();
            return posts.find(post => post.id === id);
        },
        
        // Add a new post
        addPost(post) {
            const posts = this.loadPosts();
            
            // Generate a new ID
            const maxId = posts.reduce((max, post) => Math.max(max, post.id), 0);
            post.id = maxId + 1;
            
            // Add current date if not provided
            if (!post.date) {
                const now = new Date();
                post.date = `${now.toLocaleString('default', { month: 'short' })} ${now.getDate()}, ${now.getFullYear()}`;
            }
            
            // Add post to array
            posts.push(post);
            this.savePosts(posts);
            return post;
        },
        
        // Update an existing post
        updatePost(id, updatedPost) {
            const posts = this.loadPosts();
            const index = posts.findIndex(post => post.id === id);
            
            if (index !== -1) {
                posts[index] = { ...posts[index], ...updatedPost };
                this.savePosts(posts);
                return posts[index];
            }
            
            return null;
        },
        
        // Delete a post
        deletePost(id) {
            const posts = this.loadPosts();
            const index = posts.findIndex(post => post.id === id);
            
            if (index !== -1) {
                posts.splice(index, 1);
                this.savePosts(posts);
                return true;
            }
            
            return false;
        },
        
        // Reset posts to default
        resetPosts() {
            this.savePosts([...CMSDemo.posts]);
        }
    },
    
    // UI management
    ui: {
        // Initialize the UI
        init() {
            // Setup event listeners
            this.setupEventListeners();
            
            // Initial render
            this.renderPosts();
        },
        
        // Set up event listeners
        setupEventListeners() {
            // Edit buttons
            document.querySelectorAll('.actions a:first-child').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const row = button.closest('tr');
                    const postId = parseInt(row.dataset.id);
                    this.showEditModal(postId);
                });
            });
            
            // View/Preview buttons
            document.querySelectorAll('.actions a:nth-child(2)').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const row = button.closest('tr');
                    const postId = parseInt(row.dataset.id);
                    const post = CMSDemo.postManager.getPost(postId);
                    this.showMessage(`Viewing post: "${post.title}"`, 'info');
                });
            });
            
            // Delete buttons
            document.querySelectorAll('.actions a:nth-child(3)').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const row = button.closest('tr');
                    const postId = parseInt(row.dataset.id);
                    const post = CMSDemo.postManager.getPost(postId);
                    
                    if (confirm(`Are you sure you want to delete "${post.title}"?`)) {
                        CMSDemo.postManager.deletePost(postId);
                        this.renderPosts();
                        this.showMessage(`Post "${post.title}" deleted successfully`, 'success');
                    }
                });
            });
            
            // Add New Post button
            const addButton = document.querySelector('.btn');
            if (addButton) {
                addButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showEditModal();
                });
            }
            
            // Reset demo button (add one if it doesn't exist)
            let resetButton = document.querySelector('.demo-reset');
            if (!resetButton) {
                resetButton = document.createElement('button');
                resetButton.className = 'demo-reset';
                resetButton.textContent = 'Reset Demo';
                
                // Add styles for reset button
                resetButton.style.position = 'fixed';
                resetButton.style.bottom = '20px';
                resetButton.style.right = '20px';
                resetButton.style.padding = '10px 15px';
                resetButton.style.backgroundColor = '#f44336';
                resetButton.style.color = 'white';
                resetButton.style.border = 'none';
                resetButton.style.borderRadius = '4px';
                resetButton.style.cursor = 'pointer';
                
                document.body.appendChild(resetButton);
            }
            
            resetButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset the demo? All changes will be lost.')) {
                    CMSDemo.postManager.resetPosts();
                    this.renderPosts();
                    this.showMessage('Demo reset successfully', 'info');
                }
            });
        },
        
        // Render the posts table
        renderPosts() {
            const tableBody = document.querySelector('tbody');
            if (!tableBody) return;
            
            // Clear existing rows
            tableBody.innerHTML = '';
            
            // Get posts
            const posts = CMSDemo.postManager.getPosts();
            
            // Add post rows
            posts.forEach(post => {
                const row = document.createElement('tr');
                row.dataset.id = post.id;
                
                // Title
                const titleCell = document.createElement('td');
                titleCell.textContent = post.title;
                row.appendChild(titleCell);
                
                // Author
                const authorCell = document.createElement('td');
                authorCell.textContent = post.author;
                row.appendChild(authorCell);
                
                // Categories
                const categoriesCell = document.createElement('td');
                categoriesCell.textContent = post.categories.join(', ');
                row.appendChild(categoriesCell);
                
                // Status
                const statusCell = document.createElement('td');
                const statusSpan = document.createElement('span');
                statusSpan.className = `status ${post.status}`;
                statusSpan.textContent = post.status.charAt(0).toUpperCase() + post.status.slice(1);
                statusCell.appendChild(statusSpan);
                row.appendChild(statusCell);
                
                // Date
                const dateCell = document.createElement('td');
                dateCell.textContent = post.date;
                row.appendChild(dateCell);
                
                // Actions
                const actionsCell = document.createElement('td');
                actionsCell.className = 'actions';
                
                const editLink = document.createElement('a');
                editLink.href = '#';
                editLink.textContent = 'Edit';
                actionsCell.appendChild(editLink);
                
                const viewLink = document.createElement('a');
                viewLink.href = '#';
                viewLink.textContent = post.status === 'published' ? 'View' : 'Preview';
                actionsCell.appendChild(viewLink);
                
                const deleteLink = document.createElement('a');
                deleteLink.href = '#';
                deleteLink.textContent = 'Delete';
                actionsCell.appendChild(deleteLink);
                
                row.appendChild(actionsCell);
                
                // Add row to table
                tableBody.appendChild(row);
            });
            
            // Re-attach event listeners
            this.setupEventListeners();
        },
        
        // Show edit modal
        showEditModal(postId = null) {
            // Get post data if editing existing post
            const post = postId ? CMSDemo.postManager.getPost(postId) : null;
            
            // Create modal element
            const modal = document.createElement('div');
            modal.className = 'edit-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h2>${post ? 'Edit Post' : 'Add New Post'}</h2>
                    <form>
                        <div class="form-group">
                            <label for="title">Title</label>
                            <input type="text" id="title" value="${post ? post.title : ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="author">Author</label>
                            <input type="text" id="author" value="${post ? post.author : 'Admin User'}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="categories">Categories (comma-separated)</label>
                            <input type="text" id="categories" value="${post ? post.categories.join(', ') : ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="status">Status</label>
                            <select id="status">
                                <option value="published" ${post && post.status === 'published' ? 'selected' : ''}>Published</option>
                                <option value="draft" ${post && post.status === 'draft' ? 'selected' : ''}>Draft</option>
                            </select>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-cancel">Cancel</button>
                            <button type="submit" class="btn-save">Save</button>
                        </div>
                    </form>
                </div>
            `;
            
            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .edit-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                
                .modal-content {
                    background-color: white;
                    border-radius: 5px;
                    padding: 20px;
                    width: 500px;
                    max-width: 90%;
                }
                
                .form-group {
                    margin-bottom: 15px;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                }
                
                .form-group input, .form-group select {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                
                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 20px;
                }
                
                .btn-save {
                    background-color: #3498db;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                }
                
                .btn-cancel {
                    background-color: #e0e0e0;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                }
            `;
            document.head.appendChild(style);
            
            // Add modal to page
            document.body.appendChild(modal);
            
            // Focus first input
            setTimeout(() => {
                modal.querySelector('input').focus();
            }, 100);
            
            // Handle cancel button
            modal.querySelector('.btn-cancel').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            // Handle form submission
            modal.querySelector('form').addEventListener('submit', (e) => {
                e.preventDefault();
                
                // Get form data
                const formData = {
                    title: modal.querySelector('#title').value,
                    author: modal.querySelector('#author').value,
                    categories: modal.querySelector('#categories').value.split(',').map(cat => cat.trim()),
                    status: modal.querySelector('#status').value
                };
                
                // Validate form
                if (!formData.title || !formData.author || formData.categories.length === 0) {
                    this.showMessage('Please fill in all required fields', 'error');
                    return;
                }
                
                // Save post
                if (post) {
                    CMSDemo.postManager.updatePost(post.id, formData);
                    this.showMessage(`Post "${formData.title}" updated successfully`, 'success');
                } else {
                    CMSDemo.postManager.addPost(formData);
                    this.showMessage(`Post "${formData.title}" created successfully`, 'success');
                }
                
                // Close modal and update table
                document.body.removeChild(modal);
                this.renderPosts();
            });
        },
        
        // Show message popup
        showMessage(message, type = 'info') {
            // Create message element if it doesn't exist
            let messageEl = document.getElementById('cms-message');
            if (!messageEl) {
                messageEl = document.createElement('div');
                messageEl.id = 'cms-message';
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
                messageEl.style.backgroundColor = '#13c296';
                messageEl.style.color = 'white';
            } else if (type === 'warning') {
                messageEl.style.backgroundColor = '#fbb040';
                messageEl.style.color = 'white';
            } else if (type === 'error') {
                messageEl.style.backgroundColor = '#fb5d5d';
                messageEl.style.color = 'white';
            } else {
                messageEl.style.backgroundColor = '#3aa1ff';
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
    // Add post IDs to table rows
    const rows = document.querySelectorAll('tbody tr');
    rows.forEach((row, index) => {
        row.dataset.id = index + 1;
    });
    
    // Initialize UI
    CMSDemo.ui.init();
});