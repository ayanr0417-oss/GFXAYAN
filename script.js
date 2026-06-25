/* ==========================================================================
   PARTICLE BACKGROUND SYSTEM
   ========================================================================== */
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

let particlesArray = [];
const mouse = {
    x: null,
    y: null,
    radius: 100
};

// Set canvas dimensions
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Track mouse position
window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});

window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
});

// Particle Class
class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1; // Size of particle
        this.speedX = (Math.random() - 0.5) * 0.4; // Velocity X
        this.speedY = (Math.random() - 0.5) * 0.4; // Velocity Y
        this.baseColor = 'rgba(217, 119, 6, 0.4)'; // Soft amber glow
    }

    update() {
        // Bounce off borders
        if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
        if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;

        this.x += this.speedX;
        this.y += this.speedY;

        // Mouse collision interaction (repelling effect)
        if (mouse.x !== null && mouse.y !== null) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < mouse.radius) {
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                let force = (mouse.radius - distance) / mouse.radius;
                let directionX = forceDirectionX * force * 1.5;
                let directionY = forceDirectionY * force * 1.5;

                this.x -= directionX;
                this.y -= directionY;
            }
        }
    }

    draw() {
        ctx.fillStyle = this.baseColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Populate particles
function initParticles() {
    particlesArray = [];
    let numberOfParticles = Math.min((canvas.width * canvas.height) / 18000, 100);
    for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
    }
}
initParticles();
window.addEventListener('resize', initParticles);

// Drawing lines between close particles (constellation effect)
function connectParticles() {
    let opacityValue = 1;
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            let dx = particlesArray[a].x - particlesArray[b].x;
            let dy = particlesArray[a].y - particlesArray[b].y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 120) {
                opacityValue = 1 - (distance / 120);
                ctx.strokeStyle = `rgba(217, 119, 6, ${opacityValue * 0.15})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}

// Animation loop
function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
    }
    connectParticles();
    requestAnimationFrame(animateParticles);
}
animateParticles();

/* ==========================================================================
   3D PARALLAX TILT EFFECT (For Hero Card & Portfolio Items)
   ========================================================================== */
function bindTiltEvent(card) {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left; // Mouse position inside card (x)
        const y = e.clientY - rect.top;  // Mouse position inside card (y)
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Tilt calculation (Max tilt angle: 6 degrees)
        const tiltX = ((y - centerY) / centerY) * -6;
        const tiltY = ((x - centerX) / centerX) * 6;
        
        card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-8px)`;
        
        // Glow effect adjustment based on mouse coords
        card.style.borderColor = `rgba(217, 119, 6, ${Math.max(0.3, (Math.abs(tiltX) + Math.abs(tiltY)) / 10)})`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
        card.style.borderColor = 'rgba(255, 255, 255, 0.08)';
    });
}

// Bind tilt to existing elements
document.querySelectorAll('.showcase-card, .portfolio-item').forEach(bindTiltEvent);

/* ==========================================================================
   PORTFOLIO FILTER SYSTEM
   ========================================================================== */
const filterButtons = document.querySelectorAll('.filter-btn');

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from other buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const filterValue = button.getAttribute('data-filter');
        const currentPortfolioItems = document.querySelectorAll('.portfolio-item');
        
        currentPortfolioItems.forEach(item => {
            const itemCategory = item.getAttribute('data-category');
            
            if (filterValue === 'all' || itemCategory === filterValue) {
                item.style.display = 'block';
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'scale(1)';
                }, 50);
            } else {
                item.style.opacity = '0';
                item.style.transform = 'scale(0.85)';
                setTimeout(() => {
                    item.style.display = 'none';
                }, 400); // Match CSS transition
            }
        });
    });
});

/* ==========================================================================
   LIGHTBOX SYSTEM (Using Event Delegation for Dynamic Elements)
   ========================================================================== */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const closeLightbox = document.querySelector('.lightbox-close');

// Delegate zoom button clicks to document body to handle dynamic portfolio additions
document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-zoom');
    if (btn) {
        e.stopPropagation();
        const item = btn.closest('.portfolio-item');
        const img = item.querySelector('.portfolio-img');
        const title = item.querySelector('.portfolio-item-title').textContent;
        
        lightbox.style.display = 'block';
        lightboxImg.src = img.src;
        lightboxCaption.innerHTML = title;
        document.body.style.overflow = 'hidden'; // Lock background scrolling
    }
});

function closeLightboxModal() {
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto'; // Unlock background scrolling
}

closeLightbox.addEventListener('click', closeLightboxModal);
lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
        closeLightboxModal();
    }
});

// Close lightbox on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.style.display === 'block') {
        closeLightboxModal();
    }
});

/* ==========================================================================
   DYNAMIC PORTFOLIO UPLOAD ("Add Photo" Option)
   ========================================================================== */
const addWorkModal = document.getElementById('addWorkModal');
const openAddWorkBtn = document.getElementById('openAddWorkBtn');
const addWorkCloseBtn = document.getElementById('addWorkCloseBtn');
const addWorkForm = document.getElementById('addWorkForm');

openAddWorkBtn.addEventListener('click', () => {
    addWorkModal.classList.add('show');
});

addWorkCloseBtn.addEventListener('click', () => {
    addWorkModal.classList.remove('show');
});

addWorkModal.addEventListener('click', (e) => {
    if (e.target === addWorkModal) {
        addWorkModal.classList.remove('show');
    }
});

addWorkForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('work-title').value;
    const category = document.getElementById('work-category').value;
    const fileInput = document.getElementById('work-file');
    
    if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const dataUrl = event.target.result;
            
            const newItem = {
                id: 'custom-' + Date.now(),
                title: title,
                category: category,
                image: dataUrl
            };
            
            // Save to LocalStorage
            let customItems = JSON.parse(localStorage.getItem('customPortfolioItems')) || [];
            customItems.push(newItem);
            localStorage.setItem('customPortfolioItems', JSON.stringify(customItems));
            
            // Render on Grid
            renderPortfolioItem(newItem, true);
            
            // Close modal & Reset form
            addWorkModal.classList.remove('show');
            addWorkForm.reset();
            
            // Trigger active filter reset
            document.getElementById('filter-all').click();
        };
        
        reader.readAsDataURL(file);
    }
});

function renderPortfolioItem(item, isNew = false) {
    const grid = document.getElementById('portfolioGrid');
    const itemEl = document.createElement('div');
    itemEl.className = 'portfolio-item float-animation';
    itemEl.setAttribute('data-category', item.category);
    itemEl.setAttribute('id', item.id);
    
    let categoryLabel = 'Gaming Live';
    if (item.category === 'cinematic') categoryLabel = 'Cinematic Composite';
    if (item.category === 'aesthetic') categoryLabel = 'Aesthetic & Streams';
    
    const isCustom = String(item.id).startsWith('custom-');
    const deleteBtn = isCustom ? `<button class="btn-delete" data-id="${item.id}" title="Delete Design"><i class="fa-solid fa-trash"></i></button>` : '';
    
    itemEl.innerHTML = `
        <div class="portfolio-img-wrapper">
            <img src="${item.image}" alt="${item.title}" class="portfolio-img">
            ${deleteBtn}
            <div class="portfolio-overlay">
                <span class="portfolio-category">${categoryLabel}</span>
                <h3 class="portfolio-item-title">${item.title}</h3>
                <button class="btn-zoom"><i class="fa-solid fa-expand"></i></button>
            </div>
        </div>
    `;
    
    if (isNew) {
        grid.insertBefore(itemEl, grid.firstChild);
    } else {
        grid.appendChild(itemEl);
    }
    
    // Bind 3D Tilt handler
    bindTiltEvent(itemEl);
}

// Load custom portfolio designs from LocalStorage on page load
function loadSavedDesigns() {
    const savedDesigns = JSON.parse(localStorage.getItem('customPortfolioItems')) || [];
    // Render custom designs at the beginning of the grid
    savedDesigns.forEach(design => renderPortfolioItem(design, true));
}
loadSavedDesigns();

// Event delegation for delete buttons (handles dynamic elements)
document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-delete');
    if (btn) {
        e.stopPropagation();
        const itemId = btn.getAttribute('data-id');
        
        if (confirm("Are you sure you want to delete this custom design?")) {
            // Remove from Grid (with fading transition)
            const itemEl = document.getElementById(itemId);
            if (itemEl) {
                itemEl.style.opacity = '0';
                itemEl.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    itemEl.remove();
                }, 400);
            }
            
            // Remove from LocalStorage
            let customItems = JSON.parse(localStorage.getItem('customPortfolioItems')) || [];
            customItems = customItems.filter(item => item.id !== itemId);
            localStorage.setItem('customPortfolioItems', JSON.stringify(customItems));
        }
    }
});

/* ==========================================================================
   CONTACT FORM HANDLER (Direct Mailto + Modal Backup)
   ========================================================================== */
const form = document.getElementById('projectRequestForm');
const successModal = document.getElementById('successModal');
const successCloseBtn = document.getElementById('successCloseBtn');
const manualMailtoLink = document.getElementById('manualMailtoLink');
const formattedMessageText = document.getElementById('formattedMessageText');
const copyMessageBtn = document.getElementById('copyMessageBtn');

form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Gather form inputs
    const clientName = document.getElementById('client-name').value;
    const clientContact = document.getElementById('client-email').value;
    const workDetails = document.getElementById('work-details').value;
    
    const targetEmail = "ayanr0417@gmail.com";
    
    // Format Subject and Body
    const subject = encodeURIComponent(`Project Request from ${clientName}`);
    const emailBody = `Hi Ayan,\n\nI visited your portfolio and would like to request thumbnail/logo design services.\n\nHere are my project details:\n----------------------------------------\nName: ${clientName}\nContact: ${clientContact}\n\nProject Requirements:\n${workDetails}\n----------------------------------------\n\nLooking forward to collaborating!`;
    const mailtoUrl = `mailto:${targetEmail}?subject=${subject}&body=${encodeURIComponent(emailBody)}`;
    
    // Open mail client
    window.location.href = mailtoUrl;
    
    // Populate backup info in the success modal
    manualMailtoLink.href = mailtoUrl;
    formattedMessageText.value = `Hey Ayan Rana, my name is ${clientName} (${clientContact}). I want to request this work:\n\n"${workDetails}"`;
    
    // Show custom confirmation modal
    successModal.classList.add('show');
    
    // Clear form inputs
    form.reset();
});

// Close Modal
successCloseBtn.addEventListener('click', () => {
    successModal.classList.remove('show');
});

successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
        successModal.classList.remove('show');
    }
});

// Copy pre-formatted message
copyMessageBtn.addEventListener('click', () => {
    formattedMessageText.select();
    formattedMessageText.setSelectionRange(0, 99999); // For mobile devices
    
    navigator.clipboard.writeText(formattedMessageText.value)
        .then(() => {
            copyMessageBtn.innerHTML = "Copied successfully! <i class='fa-solid fa-check'></i>";
            copyMessageBtn.style.borderColor = "var(--success)";
            copyMessageBtn.style.color = "var(--success)";
            
            setTimeout(() => {
                copyMessageBtn.innerHTML = "Copy Details to Clipboard";
                copyMessageBtn.style.borderColor = "var(--border-color)";
                copyMessageBtn.style.color = "var(--text-primary)";
            }, 2500);
        })
        .catch(err => {
            console.error("Failed to copy text: ", err);
        });
});

/* ==========================================================================
   COPY DETAILS TO CLIPBOARD (Email & Phone on Sidebar)
   ========================================================================== */
const copyButtons = document.querySelectorAll('.copy-btn');

copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const textToCopy = btn.getAttribute('data-copy');
        const icon = btn.querySelector('i');
        
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                icon.className = "fa-solid fa-check";
                icon.style.color = "var(--success)";
                btn.style.color = "var(--success)";
                
                setTimeout(() => {
                    icon.className = "fa-regular fa-copy";
                    icon.style.color = "inherit";
                    btn.style.color = "inherit";
                }, 2000);
            })
            .catch(err => {
                console.error("Failed to copy text: ", err);
            });
    });
});

/* ==========================================================================
   ACTIVE NAVIGATION SCROLL TRACKING
   ========================================================================== */
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    const scrollPosition = window.pageYOffset + 200; // Offset for better timing
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').substring(1) === current) {
            link.classList.add('active');
        }
    });
});
