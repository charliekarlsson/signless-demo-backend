// ==================== Tab Switching ====================
document.addEventListener('DOMContentLoaded', () => {
    // Tab functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.querySelector(`[data-tab-content="${targetTab}"]`).classList.add('active');
        });
    });

    // Smooth scroll with offset for fixed navbar
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.offsetTop - navbarHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navbar background on scroll
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            navbar.style.background = 'rgba(15, 15, 30, 0.95)';
            navbar.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4)';
        } else {
            navbar.style.background = 'rgba(15, 15, 30, 0.8)';
            navbar.style.boxShadow = 'none';
        }
        
        lastScroll = currentScroll;
    });

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all cards and sections
    document.querySelectorAll('.feature-card, .pricing-card, .use-case, .step').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// ==================== Copy Code Functionality ====================
function copyCode(button) {
    const codeBlock = button.closest('.code-block');
    const code = codeBlock.querySelector('code').textContent;
    
    navigator.clipboard.writeText(code).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = '#10B981';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        button.textContent = 'Failed';
        setTimeout(() => {
            button.textContent = 'Copy';
        }, 2000);
    });
}

// ==================== Code Syntax Highlighting (Simple) ====================
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('code').forEach(block => {
        // Skip if already highlighted or has no-highlight class
        if (block.querySelector('span') || block.classList.contains('no-highlight')) return;
        
        let html = block.innerHTML;
        
        // Simple syntax highlighting
        html = html
            // Comments
            .replace(/(\/\/.*$)/gm, '<span style="color: #6B7280;">$1</span>')
            // Strings
            .replace(/(['"`])(.*?)\1/g, '<span style="color: #10B981;">$1$2$1</span>')
            // Keywords
            .replace(/\b(const|let|var|function|async|await|return|if|else|for|while|import|from|export|default|class|extends|new)\b/g, '<span style="color: #A78BFA;">$1</span>')
            // Numbers
            .replace(/\b(\d+)\b/g, '<span style="color: #F59E0B;">$1</span>')
            // Functions
            .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, '<span style="color: #22D3EE;">$1</span>(')
            // Operators
            .replace(/([=+\-*/<>!&|]+)/g, '<span style="color: #A78BFA;">$1</span>');
        
        block.innerHTML = html;
    });
});

// ==================== Live Demo Modal (Optional) ====================
function openDemo() {
    // You can implement a modal here that shows a live demo
    // For now, it can redirect to your demo page
    window.location.href = '#demo';
}

// ==================== Stats Counter Animation ====================
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// ==================== Easter Egg: Konami Code ====================
let konamiCode = [];
const konamiPattern = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);
    
    if (konamiCode.join(',') === konamiPattern.join(',')) {
        // Easter egg: Add some fun effect
        document.body.style.animation = 'rainbow 3s infinite';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 3000);
    }
});

// ==================== Mobile Menu Toggle (if needed) ====================
function createMobileMenu() {
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelector('.nav-links');
    
    // Check if we're on mobile
    if (window.innerWidth <= 768) {
        // Create hamburger button if it doesn't exist
        if (!document.querySelector('.hamburger')) {
            const hamburger = document.createElement('button');
            hamburger.className = 'hamburger';
            hamburger.innerHTML = '☰';
            hamburger.style.cssText = `
                display: block;
                font-size: 1.5rem;
                color: white;
                background: none;
                border: none;
                cursor: pointer;
                padding: 0.5rem;
            `;
            
            hamburger.addEventListener('click', () => {
                navLinks.classList.toggle('mobile-open');
            });
            
            navbar.querySelector('.nav-content').insertBefore(
                hamburger,
                navLinks
            );
        }
        
        // Style mobile menu
        navLinks.style.cssText = `
            position: fixed;
            top: 80px;
            left: -100%;
            width: 100%;
            height: calc(100vh - 80px);
            background: rgba(15, 15, 30, 0.98);
            flex-direction: column;
            justify-content: flex-start;
            padding: 2rem;
            transition: left 0.3s ease;
            z-index: 999;
        `;
        
        // Toggle class for opening
        const style = document.createElement('style');
        style.textContent = `
            .nav-links.mobile-open {
                left: 0 !important;
            }
        `;
        document.head.appendChild(style);
    }
}

// Call on load and resize
window.addEventListener('load', createMobileMenu);
window.addEventListener('resize', createMobileMenu);

// ==================== Performance: Lazy Load Images ====================
document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
});
