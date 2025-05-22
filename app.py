from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session
import sqlite3
import os
import datetime
import hashlib
import re
import markdown
import bleach
from werkzeug.utils import secure_filename
from pathlib import Path

# Initialize Flask app
app = Flask(__name__, static_folder='static', static_url_path='/static')
app.secret_key = '389428896f95672825a590adb0925c4572f1cfc8170f681e1876e58ad2ec036b' 

# Configuration
DATABASE = 'portfolio.db'
UPLOAD_FOLDER = Path('static/uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'svg'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload size

# Create upload folder if it doesn't exist
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Helper functions
def allowed_file(filename):
    """Check if the file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db_connection():
    """Create a database connection and return it"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database with necessary tables"""
    with get_db_connection() as conn:
        conn.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            image_path TEXT,
            category TEXT NOT NULL,
            url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        conn.execute('''
        CREATE TABLE IF NOT EXISTS blog_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            image_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        conn.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            read BOOLEAN DEFAULT 0
        )
        ''')
        
        conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            is_admin BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        conn.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            site_title TEXT NOT NULL DEFAULT 'Portfolio',
            site_description TEXT DEFAULT 'Web Designer & Developer',
            contact_email TEXT,
            contact_phone TEXT,
            contact_address TEXT,
            social_facebook TEXT,
            social_twitter TEXT,
            social_instagram TEXT,
            social_linkedin TEXT,
            about_content TEXT,
            hero_headline TEXT DEFAULT 'Web Designer & Developer',
            hero_subheadline TEXT DEFAULT 'Elevating brands through intelligent design'
        )
        ''')
        
        # Insert default settings if they don't exist
        if conn.execute('SELECT COUNT(*) FROM settings').fetchone()[0] == 0:
            conn.execute('''
            INSERT INTO settings (
                site_title, 
                site_description, 
                hero_headline, 
                hero_subheadline
            ) VALUES (?, ?, ?, ?)
            ''', ('Callidus Digital', 'Elevating brands through intelligent design', 'Web Designer & Developer', 'Elevating brands through intelligent design'))
        
        conn.commit()

def hash_password(password):
    """Create a secure password hash"""
    return hashlib.sha256(password.encode()).hexdigest()

def is_authenticated():
    """Check if the user is logged in"""
    return 'user_id' in session

def is_admin():
    """Check if the logged-in user is an admin"""
    if not is_authenticated():
        return False
    
    with get_db_connection() as conn:
        user = conn.execute('SELECT is_admin FROM users WHERE id = ?', (session['user_id'],)).fetchone()
        return user and user['is_admin'] == 1

def clean_html(html_content):
    """Clean HTML content to prevent XSS attacks"""
    allowed_tags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'br', 'img']
    allowed_attributes = {
        'a': ['href', 'title'],
        'img': ['src', 'alt', 'title']
    }
    return bleach.clean(html_content, tags=allowed_tags, attributes=allowed_attributes)

# Initialize the database on startup
init_db()

# Routes
@app.route('/')
def home():
    """Render the home page with dynamic content from database"""
    projects = []
    blog_posts = []
    
    with get_db_connection() as conn:
        # Get site settings
        settings = conn.execute('SELECT * FROM settings WHERE id = 1').fetchone()
        
        if settings:
            settings = dict(settings)
            # Add logo path to settings if not already present
            if 'logo_path' not in settings or not settings['logo_path']:
                settings['logo_path'] = '/static/img/logo.jpg'  # Your specific logo path
        else:
            settings = {
                'site_title': 'My Portfolio',
                'site_description': 'Elevating brands through intelligent design',
                'hero_headline': 'Web Designer & Developer',
                'hero_subheadline': 'Elevating brands through intelligent design',
                'logo_path': '/static/img/logo.jpg'  # Your specific logo path
            }
            
        # Get featured projects (latest 6)
        project_rows = conn.execute('''
            SELECT * FROM projects
            ORDER BY created_at DESC
            LIMIT 6
        ''').fetchall()
        
        # Convert projects to dictionaries
        projects = [dict(row) for row in project_rows]
        
        # Get recent blog posts (latest 3)
        blog_post_rows = conn.execute('''
            SELECT id, title, content, image_path, created_at
            FROM blog_posts
            ORDER BY created_at DESC
            LIMIT 3
        ''').fetchall()
        
        # Convert blog posts to dictionaries and create previews
        blog_posts = []
        for post_row in blog_post_rows:
            post = dict(post_row)  # Convert to dictionary
            
            # Check if content is markdown (if you're using markdown)
            if post['content'] and post['content'].startswith('---md'):
                content = post['content'][5:]  # Remove markdown marker
                # Strip markdown formatting for preview
                content = re.sub(r'#|\*\*|__|\[|\]|\(|\)|`', '', content)
            else:
                # Strip HTML and truncate to 150 characters
                content = re.sub('<.*?>', '', post['content'])
                
            post['preview'] = content[:150] + '...' if len(content) > 150 else content
            blog_posts.append(post)
    
    return render_template('index.html', 
                          settings=settings,
                          projects=projects,
                          blog_posts=blog_posts)

@app.route('/about')
def about():
    """Render the about page"""
    with get_db_connection() as conn:
        settings = conn.execute('SELECT * FROM settings').fetchone()
    
    return render_template('about.html', settings=settings)

@app.route('/portfolio')
def portfolio():
    """Render the portfolio page with all projects"""
    category = request.args.get('category', '')
    
    with get_db_connection() as conn:
        settings = conn.execute('SELECT * FROM settings').fetchone()
        
        if category:
            projects = conn.execute('''
                SELECT * FROM projects
                WHERE category = ?
                ORDER BY created_at DESC
            ''', (category,)).fetchall()
        else:
            projects = conn.execute('''
                SELECT * FROM projects
                ORDER BY created_at DESC
            ''').fetchall()
        
        # Get unique categories for filtering
        categories = conn.execute('''
            SELECT DISTINCT category FROM projects
        ''').fetchall()
        
    return render_template('portfolio.html', 
                          settings=settings,
                          projects=projects,
                          categories=categories,
                          selected_category=category)

@app.route('/project/<int:project_id>')
def project_detail(project_id):
    """Show details for a specific project"""
    with get_db_connection() as conn:
        settings = conn.execute('SELECT * FROM settings').fetchone()
        project = conn.execute('SELECT * FROM projects WHERE id = ?', (project_id,)).fetchone()
        
        if not project:
            flash('Project not found', 'error')
            return redirect(url_for('portfolio'))
        
    return render_template('project_detail.html', settings=settings, project=project)

@app.route('/blog')
def blog():
    """Render the blog listing page"""
    with get_db_connection() as conn:
        blog_post_rows = conn.execute('''
            SELECT id, title, content, image_path, created_at
            FROM blog_posts
            ORDER BY created_at DESC
        ''').fetchall()
        
        # Convert blog posts to dictionaries and create previews
        blog_posts = []
        for post_row in blog_post_rows:
            post = dict(post_row)  # Convert to dictionary
            
            # Check if content is markdown
            if post['content'] and post['content'].startswith('---md'):
                content = post['content'][5:]  # Remove markdown marker
                # Strip markdown formatting for preview
                content = re.sub(r'#|\*\*|__|\[|\]|\(|\)|`', '', content)
            else:
                # Strip HTML and truncate to 150 characters
                content = re.sub('<.*?>', '', post['content'])
                
            post['preview'] = content[:150] + '...' if len(content) > 150 else content
            blog_posts.append(post)
    
    return render_template('blog.html', blog_posts=blog_posts)

@app.route('/blog/<int:post_id>')
def blog_post(post_id):
    """Render a single blog post"""
    with get_db_connection() as conn:
        post_row = conn.execute('''
            SELECT id, title, content, image_path, created_at
            FROM blog_posts
            WHERE id = ?
        ''', (post_id,)).fetchone()
        
        if post_row is None:
            abort(404)
        
        post = dict(post_row)  # Convert to dictionary
    
    return render_template('blog_post.html', post=post)

@app.route('/contact', methods=['GET', 'POST'])
def contact():
    """Handle the contact form"""
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        subject = request.form.get('subject')
        message = request.form.get('message')
        
        # Validate form data
        if not name or not email or not message:
            flash('Please fill in all required fields', 'error')
            return render_template('contact.html', 
                                  form_data=request.form)
        
        # Save message to database
        with get_db_connection() as conn:
            conn.execute('''
                INSERT INTO messages (name, email, subject, message)
                VALUES (?, ?, ?, ?)
            ''', (name, email, subject, message))
            conn.commit()
            
        flash('Your message has been sent successfully!', 'success')
        return redirect(url_for('contact'))
    
    with get_db_connection() as conn:
        settings = conn.execute('SELECT * FROM settings').fetchone()
        
    return render_template('contact.html', settings=settings)

# Admin routes
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    """Admin login page"""
    if is_authenticated():
        return redirect(url_for('admin_dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        with get_db_connection() as conn:
            user = conn.execute('''
                SELECT id, password_hash, is_admin
                FROM users
                WHERE username = ?
            ''', (username,)).fetchone()
            
            if user and user['password_hash'] == hash_password(password):
                session['user_id'] = user['id']
                session['is_admin'] = user['is_admin']
                
                flash('Login successful', 'success')
                return redirect(url_for('admin_dashboard'))
            
        flash('Invalid username or password', 'error')
        
    return render_template('admin/login.html')

@app.route('/admin/logout')
def admin_logout():
    """Log out the admin user"""
    session.pop('user_id', None)
    session.pop('is_admin', None)
    flash('You have been logged out', 'success')
    return redirect(url_for('admin_login'))

@app.route('/admin')
def admin_dashboard():
    """Admin dashboard"""
    if not is_authenticated():
        return redirect(url_for('admin_login'))
    
    if not is_admin() and 'is_admin' not in session:
        flash('Access denied', 'error')
        return redirect(url_for('home'))
    
    with get_db_connection() as conn:
        # Count items for dashboard
        project_count = conn.execute('SELECT COUNT(*) FROM projects').fetchone()[0]
        blog_count = conn.execute('SELECT COUNT(*) FROM blog_posts').fetchone()[0]
        message_count = conn.execute('SELECT COUNT(*) FROM messages').fetchone()[0]
        unread_messages = conn.execute('SELECT COUNT(*) FROM messages WHERE read = 0').fetchone()[0]
        
        # Get recent items for dashboard
        recent_projects = conn.execute('SELECT * FROM projects ORDER BY created_at DESC LIMIT 5').fetchall()
        recent_posts = conn.execute('SELECT * FROM blog_posts ORDER BY created_at DESC LIMIT 5').fetchall()
        recent_messages = conn.execute('SELECT * FROM messages ORDER BY created_at DESC LIMIT 5').fetchall()
        
        # Get site settings
        settings = conn.execute('SELECT * FROM settings').fetchone()
        
    return render_template('admin/dashboard.html',
                          settings=settings,
                          project_count=project_count,
                          blog_count=blog_count,
                          message_count=message_count,
                          unread_messages=unread_messages,
                          recent_projects=recent_projects,
                          recent_posts=recent_posts,
                          recent_messages=recent_messages)
    
    if not is_admin() and 'is_admin' not in session:
        flash('Access denied', 'error')
        return redirect(url_for('home'))
    
    with get_db_connection() as conn:
        # Count items for dashboard
        project_count = conn.execute('SELECT COUNT(*) FROM projects').fetchone()[0]
        blog_count = conn.execute('SELECT COUNT(*) FROM blog_posts').fetchone()[0]
        message_count = conn.execute('SELECT COUNT(*) FROM messages').fetchone()[0]
        unread_messages = conn.execute('SELECT COUNT(*) FROM messages WHERE read = 0').fetchone()[0]
        
    return render_template('admin/dashboard.html',
                          project_count=project_count,
                          blog_count=blog_count,
                          message_count=message_count,
                          unread_messages=unread_messages)

@app.route('/admin/projects')
def admin_projects():
    """Manage projects in admin panel"""
    if not is_authenticated() or not is_admin():
        return redirect(url_for('admin_login'))
    
    with get_db_connection() as conn:
        projects = conn.execute('SELECT * FROM projects ORDER BY created_at DESC').fetchall()
        
    return render_template('admin/projects.html', projects=projects)

@app.route('/admin/projects/add', methods=['GET', 'POST'])
def admin_add_project():
    """Add a new project"""
    if not is_authenticated() or not is_admin():
        return redirect(url_for('admin_login'))
    
    if request.method == 'POST':
        title = request.form.get('title')
        description = request.form.get('description')
        category = request.form.get('category')
        url = request.form.get('url')
        
        # Validate required fields
        if not title or not description or not category:
            flash('Please fill in all required fields', 'error')
            return render_template('admin/project_form.html', 
                                  form_data=request.form)
        
        # Handle image upload
        image_path = None
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                # Add timestamp to filename to avoid duplicates
                filename = f"{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                image_path = f"uploads/{filename}"
        
        # Clean description HTML
        description = clean_html(description)
        
        with get_db_connection() as conn:
            conn.execute('''
                INSERT INTO projects (title, description, image_path, category, url)
                VALUES (?, ?, ?, ?, ?)
            ''', (title, description, image_path, category, url))
            conn.commit()
            
        flash('Project added successfully', 'success')
        return redirect(url_for('admin_projects'))
    
    return render_template('admin/project_form.html')

@app.route('/admin/projects/edit/<int:project_id>', methods=['GET', 'POST'])
def admin_edit_project(project_id):
    """Edit an existing project"""
    if not is_authenticated() or not is_admin():
        return redirect(url_for('admin_login'))
    
    with get_db_connection() as conn:
        project = conn.execute('SELECT * FROM projects WHERE id = ?', (project_id,)).fetchone()
        
        if not project:
            flash('Project not found', 'error')
            return redirect(url_for('admin_projects'))
        
        if request.method == 'POST':
            title = request.form.get('title')
            description = request.form.get('description')
            category = request.form.get('category')
            url = request.form.get('url')
            
            # Validate required fields
            if not title or not description or not category:
                flash('Please fill in all required fields', 'error')
                return render_template('admin/project_form.html', 
                                      project=project,
                                      form_data=request.form)
            
            # Handle image upload
            image_path = project['image_path']
            if 'image' in request.files:
                file = request.files['image']
                if file and file.filename and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    # Add timestamp to filename to avoid duplicates
                    filename = f"{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
                    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                    
                    # Delete old image if it exists
                    if project['image_path']:
                        old_image_path = os.path.join(app.config['UPLOAD_FOLDER'], project['image_path'].replace('uploads/', ''))
                        if os.path.exists(old_image_path):
                            os.remove(old_image_path)
                    
                    image_path = f"uploads/{filename}"
            
            # Clean description HTML
            description = clean_html(description)
            
            conn.execute('''
                UPDATE projects
                SET title = ?, description = ?, image_path = ?, category = ?, url = ?
                WHERE id = ?
            ''', (title, description, image_path, category, url, project_id))
            conn.commit()
            
            flash('Project updated successfully', 'success')
            return redirect(url_for('admin_projects'))
    
    return render_template('admin/project_form.html', project=project)

@app.route('/admin/projects/delete/<int:project_id>', methods=['POST'])
def admin_delete_project(project_id):
    """Delete a project"""
    if not is_authenticated() or not is_admin():
        return redirect(url_for('admin_login'))
    
    with get_db_connection() as conn:
        # Get project to delete the image file
        project = conn.execute('SELECT image_path FROM projects WHERE id = ?', (project_id,)).fetchone()
        
        if project and project['image_path']:
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], project['image_path'].replace('uploads/', ''))
            if os.path.exists(image_path):
                os.remove(image_path)
        
        conn.execute('DELETE FROM projects WHERE id = ?', (project_id,))
        conn.commit()
    
    flash('Project deleted successfully', 'success')
    return redirect(url_for('admin_projects'))

@app.route('/admin/blog')
def admin_blog():
    """Manage blog posts in admin panel"""
    if not is_authenticated() or not is_admin():
        return redirect(url_for('admin_login'))
    
    with get_db_connection() as conn:
        blog_post_rows = conn.execute('SELECT * FROM blog_posts ORDER BY created_at DESC').fetchall()
        # Convert to list of dictionaries
        blog_posts = [dict(row) for row in blog_post_rows]
        
    return render_template('admin/blog.html', blog_posts=blog_posts)

@app.route('/admin/blog/add', methods=['GET', 'POST'])
def admin_add_blog():
    """Add a new blog post"""
    if not is_authenticated() or not is_admin():
        return redirect(url_for('admin_login'))
    
    if request.method == 'POST':
        title = request.form.get('title')
        content = request.form.get('content')
        
        # Validate required fields
        if not title or not content:
            flash('Please fill in all required fields', 'error')
            return render_template('admin/blog_form.html', 
                                  form_data=request.form)
        
        # Handle image upload
        image_path = None
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                # Add timestamp to filename to avoid duplicates
                filename = f"{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                image_path = f"uploads/{filename}"
        
        # Clean content HTML or preserve markdown
        if request.form.get('content_format') == 'markdown':
            content = f"---md{content}"
        else:
            content = clean_html(content)
        
        with get_db_connection() as conn:
            conn.execute('''
                INSERT INTO blog_posts (title, content, image_path)
                VALUES (?, ?, ?)
            ''', (title, content, image_path))
            conn.commit()
            
        flash('Blog post added successfully', 'success')
        return redirect(url_for('admin_blog'))
    
    return render_template('admin/blog_form.html')

@app.route('/admin/blog/edit/<int:post_id>', methods=['GET', 'POST'])
def admin_edit_blog(post_id):
    """Edit an existing blog post"""
    if not is_authenticated() or not is_admin():
        return redirect(url_for('admin_login'))
    
    with get_db_connection() as conn:
        post = conn.execute('SELECT * FROM blog_posts WHERE id = ?', (post_id,)).fetchone()
        
        if not post:
            flash('Blog post not found', 'error')
            return redirect(url_for('admin_blog'))
        
        # Check if content is markdown
        is_markdown = post['content'].startswith('---md')
        if is_markdown:
            post_content = post['content'][5:]  # Remove markdown marker
        else:
            post_content = post['content']
        
        if request.method == 'POST':
            title = request.form.get('title')
            content = request.form.get('content')
            
            # Validate required fields
            if not title or not content:
                flash('Please fill in all required fields', 'error')
                return render_template('admin/blog_form.html', 
                                      post=post,
                                      post_content=post_content,
                                      is_markdown=is_markdown,
                                      form_data=request.form)
            
            # Handle image upload
            image_path = post['image_path']
            if 'image' in request.files:
                file = request.files['image']
                if file and file.filename and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    # Add timestamp to filename to avoid duplicates
                    filename = f"{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
                    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                    
                    # Delete old image if it exists
                    if post['image_path']:
                        old_image_path = os.path.join(app.config['UPLOAD_FOLDER'], post['image_path'].replace('uploads/', ''))
                        if os.path.exists(old_image_path):
                            os.remove(old_image_path)
                    
                    image_path = f"uploads/{filename}"
            
            # Handle content format
            if request.form.get('content_format') == 'markdown':
                processed_content = f"---md{content}"
            else:
                processed_content = clean_html(content)
            
            conn.execute('''
                UPDATE blog_posts
                SET title = ?, content = ?, image_path = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (title, processed_content, image_path, post_id))
            conn.commit()
            
            flash('Blog post updated successfully', 'success')
            return redirect(url_for('admin_blog'))
        
    return render_template('admin/blog_form.html', 
                          post=post, 
                          post_content=post_content, 
                          is_markdown=is_markdown)

@app.route('/admin/blog/delete/<int:post_id>', methods=['POST'])
def admin_delete_blog(post_id):
    """Delete a blog post"""
    if not is_authenticated() or not is_admin():
        return redirect(url_for('admin_login'))
    
    try:
        with get_db_connection() as conn:
            # Get post info for image deletion
            post = conn.execute('SELECT * FROM blog_posts WHERE id = ?', (post_id,)).fetchone()
            
            if post and post['image_path']:
                # Delete image file if it exists
                try:
                    image_path = os.path.join(app.config['UPLOAD_FOLDER'], post['image_path'].replace('uploads/', ''))
                    if os.path.exists(image_path):
                        os.remove(image_path)
                except Exception as e:
                    print(f"Error deleting image: {e}")
            
            # Delete the post
            conn.execute('DELETE FROM blog_posts WHERE id = ?', (post_id,))
            conn.commit()
            
        flash('Blog post deleted successfully', 'success')
    except Exception as e:
        flash(f'Error deleting post: {e}', 'error')
    
    return redirect(url_for('admin_blog'))


@app.route('/admin/messages')
def admin_messages():
    """View all contact form messages"""
    if not is_authenticated() or not is_admin():
        return redirect(url_for('admin_login'))
    
    with get_db_connection() as conn:
        messages_rows = conn.execute('''
            SELECT * FROM messages 
            ORDER BY created_at DESC
        ''').fetchall()
        contact_messages = [dict(row) for row in messages_rows]
    
    return render_template('admin/messages.html', contact_messages=contact_messages)

@app.route('/admin/messages/<int:message_id>')
def admin_view_message(message_id):
    """View a specific message and mark as read"""
    if not is_authenticated() or not is_admin():
        return redirect(url_for('admin_login'))
    
    with get_db_connection() as conn:
        # Get the message
        message_row = conn.execute('SELECT * FROM messages WHERE id = ?', (message_id,)).fetchone()
        
        if not message_row:
            flash('Message not found', 'error')
            return redirect(url_for('admin_messages'))
            
        message = dict(message_row)
        
        # Mark as read if unread
        if not message['read']:
            conn.execute('UPDATE messages SET read = 1 WHERE id = ?', (message_id,))
            conn.commit()
    
    return render_template('admin/message_detail.html', message=message)

@app.route('/admin/messages/delete/<int:message_id>', methods=['POST'])
def admin_delete_message(message_id):
    """Delete a message"""
    if not is_authenticated() or not is_admin():
        return redirect(url_for('admin_login'))
    
    with get_db_connection() as conn:
        conn.execute('DELETE FROM messages WHERE id = ?', (message_id,))
        conn.commit()
    
    flash('Message deleted successfully', 'success')
    return redirect(url_for('admin_messages'))

@app.route('/admin/settings', methods=['GET', 'POST'])
def admin_settings():
    """Manage site settings"""
    if not is_authenticated() or not is_admin():
        return redirect(url_for('admin_login'))
    
    with get_db_connection() as conn:
        settings = conn.execute('SELECT * FROM settings').fetchone()
        
        if request.method == 'POST':
            site_title = request.form.get('site_title')
            site_description = request.form.get('site_description')
            contact_email = request.form.get('contact_email')
            contact_phone = request.form.get('contact_phone')
            contact_address = request.form.get('contact_address')
            social_facebook = request.form.get('social_facebook')
            social_twitter = request.form.get('social_twitter')
            social_instagram = request.form.get('social_instagram')
            social_linkedin = request.form.get('social_linkedin')
            about_content = request.form.get('about_content')
            hero_headline = request.form.get('hero_headline')
            hero_subheadline = request.form.get('hero_subheadline')
            
            # Validate required fields
            if not site_title:
                flash('Site title is required', 'error')
                return render_template('admin/settings.html', 
                                      settings=settings,
                                      form_data=request.form)
            
            # Clean about content HTML
            about_content = clean_html(about_content) if about_content else None
            
            conn.execute('''
                UPDATE settings
                SET site_title = ?, site_description = ?, contact_email = ?,
                    contact_phone = ?, contact_address = ?, social_facebook = ?,
                    social_twitter = ?, social_instagram = ?, social_linkedin = ?,
                    about_content = ?, hero_headline = ?, hero_subheadline = ?
            ''', (site_title, site_description, contact_email,
                 contact_phone, contact_address, social_facebook,
                 social_twitter, social_instagram, social_linkedin,
                 about_content, hero_headline, hero_subheadline))
            conn.commit()
            
            flash('Settings updated successfully', 'success')
            return redirect(url_for('admin_settings'))
        
    return render_template('admin/settings.html', settings=settings)

@app.template_filter('nl2br')
def nl2br(value):
    """Convert newlines to <br> tags"""
    if value:
        return value.replace('\n', '<br>')
    return value

@app.route('/admin/account', methods=['GET', 'POST'])
def admin_account():
    """Manage admin account"""
    if not is_authenticated():
        return redirect(url_for('admin_login'))
    
    with get_db_connection() as conn:
        user = conn.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],)).fetchone()
        
        if request.method == 'POST':
            current_password = request.form.get('current_password')
            new_password = request.form.get('new_password')
            confirm_password = request.form.get('confirm_password')
            
            # Validate passwords
            if not current_password or not new_password or not confirm_password:
                flash('All fields are required', 'error')
                return render_template('admin/account.html', user=user)
            
            if hash_password(current_password) != user['password_hash']:
                flash('Current password is incorrect', 'error')
                return render_template('admin/account.html', user=user)
            
            if new_password != confirm_password:
                flash('New passwords do not match', 'error')
                return render_template('admin/account.html', user=user)
            
            if len(new_password) < 8:
                flash('Password must be at least 8 characters long', 'error')
                return render_template('admin/account.html', user=user)
            
            # Update password
            conn.execute('''
                UPDATE users
                SET password_hash = ?
                WHERE id = ?
            ''', (hash_password(new_password), user['id']))
            conn.commit()
            
            flash('Password updated successfully', 'success')
            return redirect(url_for('admin_account'))
        
    return render_template('admin/account.html', user=user)

@app.route('/api/contact', methods=['POST'])
def api_contact():
    """API endpoint for contact form submissions (for AJAX requests)"""
    if not request.is_json:
        return jsonify({'success': False, 'error': 'Invalid request format'}), 400
    
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    subject = data.get('subject')
    message = data.get('message')
    
    # Validate required fields
    if not name or not email or not message:
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400
    
    # Basic email validation
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({'success': False, 'error': 'Invalid email address'}), 400
    
    # Save message to database
    try:
        with get_db_connection() as conn:
            conn.execute('''
                INSERT INTO messages (name, email, subject, message)
                VALUES (?, ?, ?, ?)
            ''', (name, email, subject, message))
            conn.commit()
            
        return jsonify({'success': True, 'message': 'Message sent successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/portfolio')
def api_portfolio():
    """API endpoint to get portfolio projects"""
    category = request.args.get('category', '')
    limit = request.args.get('limit', default=0, type=int)
    
    try:
        with get_db_connection() as conn:
            query = 'SELECT * FROM projects'
            params = []
            
            if category:
                query += ' WHERE category = ?'
                params.append(category)
            
            query += ' ORDER BY created_at DESC'
            
            if limit > 0:
                query += ' LIMIT ?'
                params.append(limit)
            
            projects = conn.execute(query, params).fetchall()
            
            # Convert to list of dictionaries
            result = []
            for project in projects:
                project_dict = dict(project)
                result.append(project_dict)
            
            return jsonify({'success': True, 'projects': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/blog')
def api_blog():
    """API endpoint to get blog posts"""
    limit = request.args.get('limit', default=0, type=int)
    
    try:
        with get_db_connection() as conn:
            query = 'SELECT id, title, image_path, created_at FROM blog_posts ORDER BY created_at DESC'
            params = []
            
            if limit > 0:
                query += ' LIMIT ?'
                params.append(limit)
            
            posts = conn.execute(query, params).fetchall()
            
            # Convert to list of dictionaries
            result = []
            for post in posts:
                post_dict = dict(post)
                result.append(post_dict)
            
            return jsonify({'success': True, 'posts': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/blog/<int:post_id>')
def api_blog_post(post_id):
    """API endpoint to get a specific blog post"""
    try:
        with get_db_connection() as conn:
            post = conn.execute('SELECT * FROM blog_posts WHERE id = ?', (post_id,)).fetchone()
            
            if not post:
                return jsonify({'success': False, 'error': 'Post not found'}), 404
            
            post_dict = dict(post)
            
            # Convert Markdown to HTML if content is in Markdown format
            if post_dict['content'].startswith('---md'):
                post_dict['content_html'] = markdown.markdown(post_dict['content'][5:])
                post_dict['is_markdown'] = True
            else:
                post_dict['content_html'] = post_dict['content']
                post_dict['is_markdown'] = False
            
            return jsonify({'success': True, 'post': post_dict})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/settings')
def api_settings():
    """API endpoint to get public site settings"""
    try:
        with get_db_connection() as conn:
            settings = conn.execute('''
                SELECT site_title, site_description, 
                       social_facebook, social_twitter, social_instagram, social_linkedin,
                       hero_headline, hero_subheadline
                FROM settings
            ''').fetchone()
            
            if not settings:
                return jsonify({'success': False, 'error': 'Settings not found'}), 404
            
            settings_dict = dict(settings)
            return jsonify({'success': True, 'settings': settings_dict})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Analytics routes (optional)
@app.route('/api/analytics/pageview', methods=['POST'])
def api_analytics_pageview():
    """Record a page view for analytics"""
    if not request.is_json:
        return jsonify({'success': False, 'error': 'Invalid request format'}), 400
    
    data = request.get_json()
    path = data.get('path', '')
    referrer = data.get('referrer', '')
    user_agent = data.get('user_agent', '')
    ip_address = request.remote_addr
    
    # Create analytics table if it doesn't exist
    with get_db_connection() as conn:
        conn.execute('''
        CREATE TABLE IF NOT EXISTS analytics_pageviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT NOT NULL,
            referrer TEXT,
            user_agent TEXT,
            ip_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        conn.execute('''
            INSERT INTO analytics_pageviews (path, referrer, user_agent, ip_address)
            VALUES (?, ?, ?, ?)
        ''', (path, referrer, user_agent, ip_address))
        conn.commit()
    
    return jsonify({'success': True})

@app.context_processor
def inject_unread_messages():
    """Add unread messages count to all templates"""
    if is_authenticated() and is_admin():
        try:
            with get_db_connection() as conn:
                count = conn.execute('''
                    SELECT COUNT(*) as count 
                    FROM messages 
                    WHERE read = 0
                ''').fetchone()['count']
            return {'unread_messages_count': count}
        except Exception as e:
            # Log the error but don't break template rendering
            print(f"Error getting unread messages: {e}")
    
    # Default value when not authenticated or if there's an error
    return {'unread_messages_count': 0}

@app.context_processor
def inject_settings():
    """Add settings to all templates"""
    try:
        with get_db_connection() as conn:
            settings_row = conn.execute('SELECT * FROM settings WHERE id = 1').fetchone()
            
            if settings_row:
                settings = dict(settings_row)
                # Add logo path to settings if not already present
                if 'logo_path' not in settings or not settings['logo_path']:
                    settings['logo_path'] = '/static/img/logo.jpg'
            else:
                settings = {
                    'site_title': 'My Portfolio',
                    'site_description': 'Elevating brands through intelligent design',
                    'hero_headline': 'Web Designer & Developer',
                    'hero_subheadline': 'Elevating brands through intelligent design',
                    'logo_path': '/static/img/logo.jpg'
                }
                
            return {'settings': settings}
    except Exception as e:
        # Log the error but don't break template rendering
        print(f"Error getting settings: {e}")
        
        # Return default settings if there's an error
        return {'settings': {
            'site_title': 'My Portfolio',
            'site_description': 'Elevating brands through intelligent design',
            'hero_headline': 'Web Designer & Developer',
            'hero_subheadline': 'Elevating brands through intelligent design',
            'logo_path': '/static/img/logo.jpg'
        }}

# Error handlers
@app.errorhandler(404)
def page_not_found(e):
    """Handle 404 errors"""
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_server_error(e):
    """Handle 500 errors"""
    return render_template('500.html'), 500

# Custom template filters
@app.template_filter('format_date')
def format_date(date):
    """Format a date to a nice string"""
    if isinstance(date, str):
        try:
            date = datetime.datetime.strptime(date, '%Y-%m-%d %H:%M:%S')
        except ValueError:
            return date
    return date.strftime('%B %d, %Y')

@app.template_filter('markdown')
def render_markdown(text):
    """Render markdown text to HTML"""
    import markdown
    return markdown.markdown(text, extensions=['extra', 'nl2br'])

# Initialize the first admin user if none exists
def create_admin_user():
    """Create the initial admin user if no users exist"""
    with get_db_connection() as conn:
        user_count = conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]
        
        if user_count == 0:
            username = 'admin'
            password = 'admin123'  # This should be changed immediately after first login
            email = 'admin@example.com'
            
            conn.execute('''
                INSERT INTO users (username, password_hash, email, is_admin)
                VALUES (?, ?, ?, 1)
            ''', (username, hash_password(password), email))
            conn.commit()
            print("Initial admin user created. Username: admin, Password: admin123")
            print("Please change this password immediately after logging in!")

# Run the application
if __name__ == '__main__':
    create_admin_user()
    app.run(debug=True, port=8080)  # Use port 8080 instead of 5000