// Main JavaScript for Portfolio Website

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initThemeToggle();
    initSkillBars();
    initScrollAnimation();
    initPortfolioFilter();
    initContactForm();
    initLazyLoading();
    initMobileMenu();
    initDynamicYear();
    initBackToTop();
});

// Theme Toggle Functionality
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    const body = document.body;
    const themeIcon = themeToggle.querySelector('i');
    
    // Check for saved theme preference or preferred color scheme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        if (themeIcon) themeIcon.className = 'fas fa-sun';
    } else if (savedTheme === 'light') {
        body.classList.add('light-theme');
        if (themeIcon) themeIcon.className = 'fas fa-moon';
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        body.classList.add('dark-theme');
        if (themeIcon) themeIcon.className = 'fas fa-sun';
    }
    
    // Toggle theme on button click
    themeToggle.addEventListener('click', function() {
        if (body.classList.contains('dark-theme')) {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
            if (themeIcon) themeIcon.className = 'fas fa-moon';
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
            if (themeIcon) themeIcon.className = 'fas fa-sun';
        }
    });
}

// Animate skill bars on scroll
function initSkillBars() {
    const skillBars = document.querySelectorAll('.skill-progress');
    if (skillBars.length === 0) return;
    
    const animateSkillBars = () => {
        skillBars.forEach(bar => {
            const width = bar.getAttribute('data-width') + '%';
            setTimeout(() => {
                bar.style.width = width;
            }, 200);
        });
    };
    
    // If IntersectionObserver is available, use it
    if ('IntersectionObserver' in window) {
        const skillsContainer = document.querySelector('.skills-container');
        if (!skillsContainer) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateSkillBars();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        
        observer.observe(skillsContainer);
    } else {
        // Fallback for older browsers
        window.addEventListener('load', animateSkillBars);
    }
}

// Scroll animations for elements
function initScrollAnimation() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll, .section-title');
    if (animatedElements.length === 0) return;
    
    // If IntersectionObserver is available, use it
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                    
                    // If it's the skills section, also animate the skill bars
                    if (entry.target.closest('#skills')) {
                        initSkillBars();
                    }
                    
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        
        animatedElements.forEach(element => {
            observer.observe(element);
        });
    } else {
        // Fallback for older browsers
        animatedElements.forEach(element => {
            element.classList.add('animate');
        });
    }
}

// Portfolio filtering
function initPortfolioFilter() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    if (categoryButtons.length === 0 || portfolioItems.length === 0) return;
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const selectedCategory = this.textContent.trim().toLowerCase();
            
            // Filter portfolio items with animation
            portfolioItems.forEach(item => {
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    if (selectedCategory === 'all' || item.dataset.category === selectedCategory) {
                        item.style.display = 'block';
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        }, 50);
                    } else {
                        item.style.display = 'none';
                    }
                }, 300);
            });
        });
    });
}

// Contact form validation and AJAX submission
function initContactForm() {
    const contactForm = document.querySelector('#contactForm');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form inputs
        const nameInput = this.querySelector('input[name="name"]');
        const emailInput = this.querySelector('input[name="email"]');
        const subjectInput = this.querySelector('input[name="subject"]');
        const messageInput = this.querySelector('textarea[name="message"]');
        const submitButton = this.querySelector('button[type="submit"]');
        
        // Validate inputs
        let isValid = true;
        
        if (!nameInput.value.trim()) {
            markInvalid(nameInput, 'Please enter your name');
            isValid = false;
        } else {
            markValid(nameInput);
        }
        
        if (!emailInput.value.trim()) {
            markInvalid(emailInput, 'Please enter your email');
            isValid = false;
        } else if (!isValidEmail(emailInput.value)) {
            markInvalid(emailInput, 'Please enter a valid email');
            isValid = false;
        } else {
            markValid(emailInput);
        }
        
        if (!messageInput.value.trim()) {
            markInvalid(messageInput, 'Please enter your message');
            isValid = false;
        } else {
            markValid(messageInput);
        }
        
        if (isValid) {
            // Check if form is using AJAX or traditional submission
            if (window.location.pathname === '/') {
                // AJAX submission for homepage
                submitButton.disabled = true;
                submitButton.textContent = 'Sending...';
                
                // Prepare data for AJAX submission
                const formData = {
                    name: nameInput.value.trim(),
                    email: emailInput.value.trim(),
                    subject: subjectInput ? subjectInput.value.trim() : '',
                    message: messageInput.value.trim()
                };
                
                // Send data using the Fetch API
                fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Show success message
                        contactForm.innerHTML = '<div class="success-message"><h3>Thank You!</h3><p>Your message has been sent successfully. I\'ll get back to you soon.</p></div>';
                    } else {
                        // Show error message
                        submitButton.disabled = false;
                        submitButton.textContent = 'Send Message';
                        showFormError(contactForm, data.error || 'An error occurred. Please try again.');
                    }
                })
                .catch(error => {
                    // Show error message
                    submitButton.disabled = false;
                    submitButton.textContent = 'Send Message';
                    showFormError(contactForm, 'An error occurred. Please try again.');
                    console.error('Error:', error);
                });
            } else {
                // For regular contact page, allow the form to submit normally
                this.submit();
            }
        }
    });
    
    function markInvalid(element, message) {
        element.classList.add('invalid');
        
        // Find or create error message container
        let errorMessage = element.parentElement.querySelector('.error-message');
        
        if (!errorMessage) {
            errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            element.parentElement.appendChild(errorMessage);
        }
        
        errorMessage.textContent = message;
    }
    
    function markValid(element) {
        element.classList.remove('invalid');
        
        // Remove error message if exists
        const errorMessage = element.parentElement.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }
    
    function isValidEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }
    
    function showFormError(form, message) {
        // Check if an error message already exists
        let errorContainer = form.querySelector('.form-error');
        
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'form-error';
            form.prepend(errorContainer);
        }
        
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorContainer.style.opacity = '0';
            setTimeout(() => {
                errorContainer.style.display = 'none';
                errorContainer.style.opacity = '1';
            }, 500);
        }, 5000);
    }
}

// Lazy loading for images
function initLazyLoading() {
    // Check if IntersectionObserver is available
    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('[data-src]');
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
    } else {
        // Fallback for browsers that don't support IntersectionObserver
        const lazyImages = document.querySelectorAll('[data-src]');
        
        // Load all images immediately
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
    }
}

// Mobile menu toggle
function initMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (!mobileMenuToggle || !navLinks) return;
    
    mobileMenuToggle.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        this.classList.toggle('active');
    });
    
    // Close mobile menu when clicking a link
    const menuLinks = navLinks.querySelectorAll('a');
    menuLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                navLinks.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            }
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 768) {
            if (!navLinks.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
                navLinks.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            }
        }
    });
}

// Update copyright year dynamically
function initDynamicYear() {
    const yearElement = document.querySelector('.current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// Back to top button
function initBackToTop() {
    const backToTopButton = document.querySelector('.back-to-top');
    if (!backToTopButton) return;
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    });
    
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        
        // Only process if it's a hash link
        if (targetId.startsWith('#') && targetId.length > 1) {
            e.preventDefault();
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// Testimonial slider
function initTestimonialSlider() {
    const testimonialSlider = document.querySelector('.testimonial-slider');
    if (!testimonialSlider) return;
    
    const testimonials = testimonialSlider.querySelectorAll('.testimonial-item');
    if (testimonials.length <= 1) return;
    
    let currentSlide = 0;
    
    // Hide all testimonials except the first one
    testimonials.forEach((testimonial, index) => {
        if (index !== 0) {
            testimonial.style.display = 'none';
        }
    });
    
    // Create navigation dots
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'slider-dots';
    
    testimonials.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.className = index === 0 ? 'dot active' : 'dot';
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
        dotsContainer.appendChild(dot);
    });
    
    testimonialSlider.appendChild(dotsContainer);
    
    // Create navigation arrows
    const prevButton = document.createElement('button');
    prevButton.className = 'slider-arrow prev';
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.addEventListener('click', prevSlide);
    
    const nextButton = document.createElement('button');
    nextButton.className = 'slider-arrow next';
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.addEventListener('click', nextSlide);
    
    testimonialSlider.appendChild(prevButton);
    testimonialSlider.appendChild(nextButton);
    
    // Auto advance slides every 5 seconds
    let slideInterval = setInterval(nextSlide, 5000);
    
    // Pause auto-advance on hover
    testimonialSlider.addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
    });
    
    testimonialSlider.addEventListener('mouseleave', () => {
        slideInterval = setInterval(nextSlide, 5000);
    });
    
    function nextSlide() {
        goToSlide((currentSlide + 1) % testimonials.length);
    }
    
    function prevSlide() {
        goToSlide((currentSlide - 1 + testimonials.length) % testimonials.length);
    }
    
    function goToSlide(index) {
        // Hide current slide
        testimonials[currentSlide].style.display = 'none';
        
        // Update dots
        dotsContainer.querySelectorAll('.dot')[currentSlide].classList.remove('active');
        
        // Show new slide
        currentSlide = index;
        testimonials[currentSlide].style.display = 'block';
        
        // Update active dot
        dotsContainer.querySelectorAll('.dot')[currentSlide].classList.add('active');
    }
}

// Initialize the testimonial slider on document ready
document.addEventListener('DOMContentLoaded', function() {
    initTestimonialSlider();
});

// Fix for browser loading indicator
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    
    // Throttle animations when tab is not visible to save resources
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            document.body.classList.add('reduced-motion');
        } else {
            document.body.classList.remove('reduced-motion');
        }
    });
    
    // Initialize project modals
    initProjectModals();
});

// Project details modal functionality
function initProjectModals() {
    // Open modal when clicking on project details links
    const projectLinks = document.querySelectorAll('.js-open-modal');
    
    projectLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const projectId = this.getAttribute('data-project');
            const modal = document.getElementById(`modal-${projectId}`);
            
            if (modal) {
                openModal(modal);
            }
        });
    });
    
    // Close modal when clicking on close button or outside the modal
    const closeButtons = document.querySelectorAll('.close-modal');
    const modals = document.querySelectorAll('.project-modal');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.project-modal');
            closeModal(modal);
        });
    });
    
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this);
            }
        });
    });
    
    // Close modal when pressing Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.project-modal.show');
            if (openModal) {
                closeModal(openModal);
            }
        }
    });
}

function openModal(modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function closeModal(modal) {
    modal.classList.remove('show');
    document.body.style.overflow = ''; // Re-enable scrolling
}

// Performance optimization for animations
function debounce(func, wait = 20, immediate = true) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// Optimize scroll animations
const scrollEvents = debounce(function() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll:not(.animate)');
    
    animatedElements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementPosition < windowHeight * 0.8) {
            element.classList.add('animate');
        }
    });
});

// Use optimized scroll handler
window.addEventListener('scroll', scrollEvents);