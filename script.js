// Scroll animations
document.addEventListener('DOMContentLoaded', function() {
    // Intersection Observer for timeline sections
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Stagger animations for event cards within the section
                const cards = entry.target.querySelectorAll('.event-card');
                cards.forEach((card, index) => {
                    setTimeout(() => {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        card.style.transition = 'all 0.6s ease-out';
                        
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 50);
                    }, index * 150);
                });
            }
        });
    }, observerOptions);

    // Observe all timeline sections
    const timelineSections = document.querySelectorAll('.timeline-section');
    timelineSections.forEach(section => {
        observer.observe(section);
    });

    // Smooth scroll for hero scroll indicator
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', function() {
            const introSection = document.querySelector('.introduction');
            introSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Progress indicator
    let progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 4px;
        background: linear-gradient(to right, var(--socialist-color), var(--optimal-color), var(--republican-color));
        z-index: 1000;
        transition: width 0.3s ease;
        width: 0%;
    `;
    document.body.appendChild(progressBar);

    // Update progress bar on scroll
    window.addEventListener('scroll', function() {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPosition = window.scrollY;
        const progress = (scrollPosition / scrollHeight) * 100;
        progressBar.style.width = progress + '%';
    });

    // Add hover effects to path cards
    const pathCards = document.querySelectorAll('.path-card');
    pathCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add click-to-expand functionality for event cards
    const eventCards = document.querySelectorAll('.event-card');
    eventCards.forEach(card => {
        card.style.cursor = 'pointer';
        
        card.addEventListener('click', function() {
            // Toggle expanded state
            if (this.style.maxHeight && this.style.maxHeight !== 'none') {
                this.style.maxHeight = null;
            } else {
                this.style.maxHeight = this.scrollHeight + 50 + 'px';
            }
        });
    });

    // Parallax effect for year markers
    const yearMarkers = document.querySelectorAll('.year-marker');
    window.addEventListener('scroll', function() {
        yearMarkers.forEach(marker => {
            const rect = marker.getBoundingClientRect();
            const speed = 0.5;
            const yPos = rect.top * speed;
            
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                marker.style.transform = `translateY(${yPos * 0.1}px)`;
            }
        });
    });

    // Add dynamic connecting lines between timeline events
    function createConnectingLines() {
        const sections = document.querySelectorAll('.timeline-section');
        
        sections.forEach((section, index) => {
            if (index < sections.length - 1) {
                const columns = section.querySelectorAll('.column');
                
                columns.forEach((column, colIndex) => {
                    const lastCard = column.querySelector('.event-card:last-child');
                    const nextSection = sections[index + 1];
                    const nextColumn = nextSection.querySelectorAll('.column')[colIndex];
                    const firstNextCard = nextColumn.querySelector('.event-card:first-child');
                    
                    if (lastCard && firstNextCard) {
                        const line = document.createElement('div');
                        line.className = 'connecting-line';
                        line.style.cssText = `
                            position: absolute;
                            width: 2px;
                            background-color: var(--border-color);
                            opacity: 0.3;
                            left: 50%;
                            transform: translateX(-50%);
                            pointer-events: none;
                            transition: opacity 0.6s ease;
                        `;
                        
                        // Position the line
                        const updateLinePosition = () => {
                            const startRect = lastCard.getBoundingClientRect();
                            const endRect = firstNextCard.getBoundingClientRect();
                            const containerRect = section.parentElement.getBoundingClientRect();
                            
                            const startY = startRect.bottom - containerRect.top;
                            const endY = endRect.top - containerRect.top;
                            
                            line.style.top = startY + 'px';
                            line.style.height = (endY - startY) + 'px';
                        };
                        
                        column.style.position = 'relative';
                        column.appendChild(line);
                        
                        // Update on scroll
                        window.addEventListener('scroll', updateLinePosition);
                        window.addEventListener('resize', updateLinePosition);
                        updateLinePosition();
                    }
                });
            }
        });
    }
    
    // Initialize connecting lines after a short delay
    setTimeout(createConnectingLines, 500);
    
    // Create timeline progress indicator
    const createTimelineProgress = () => {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'timeline-progress';
        
        const years = [2025, 2026, 2027, 2028, 2030, 2035];
        years.forEach(year => {
            const dot = document.createElement('div');
            dot.className = 'timeline-dot';
            dot.setAttribute('data-year', year);
            dot.addEventListener('click', () => {
                const section = document.querySelector(`[data-year="${year}"]`);
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth' });
                }
            });
            progressContainer.appendChild(dot);
        });
        
        document.body.appendChild(progressContainer);
        
        // Update active dot on scroll
        const updateActiveDot = () => {
            const sections = document.querySelectorAll('.timeline-section');
            const scrollPosition = window.scrollY + window.innerHeight / 2;
            
            let activeYear = null;
            sections.forEach(section => {
                const rect = section.getBoundingClientRect();
                const sectionTop = rect.top + window.scrollY;
                const sectionBottom = sectionTop + rect.height;
                
                if (scrollPosition >= sectionTop && scrollPosition <= sectionBottom) {
                    activeYear = section.getAttribute('data-year');
                }
            });
            
            document.querySelectorAll('.timeline-dot').forEach(dot => {
                if (dot.getAttribute('data-year') === activeYear) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
            
            // Show/hide progress indicator
            if (window.scrollY > window.innerHeight) {
                progressContainer.classList.add('visible');
            } else {
                progressContainer.classList.remove('visible');
            }
        };
        
        window.addEventListener('scroll', updateActiveDot);
        updateActiveDot();
    };
    
    createTimelineProgress();

    // Add subtle animations to metrics
    const animateNumbers = (element, start, end, duration) => {
        const startTime = performance.now();
        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = start + (end - start) * progress;
            element.textContent = current.toFixed(0);
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };
        
        requestAnimationFrame(update);
    };

    // Animate metrics when they come into view
    const metricsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                entry.target.dataset.animated = 'true';
                
                const metrics = entry.target.querySelectorAll('.metrics li');
                metrics.forEach(metric => {
                    const text = metric.textContent;
                    const match = text.match(/(\d+(?:\.\d+)?)/);
                    
                    if (match) {
                        const number = parseFloat(match[1]);
                        const span = document.createElement('span');
                        span.textContent = '0';
                        
                        metric.innerHTML = text.replace(match[1], span.outerHTML);
                        
                        setTimeout(() => {
                            const targetSpan = metric.querySelector('span');
                            animateNumbers(targetSpan, 0, number, 1000);
                        }, 200);
                    }
                });
            }
        });
    }, observerOptions);

    // Observe all event cards with metrics
    document.querySelectorAll('.event-card').forEach(card => {
        if (card.querySelector('.metrics')) {
            metricsObserver.observe(card);
        }
    });
    
    // Mobile tab switching functionality
    const setupMobileTabs = () => {
        const tabButtons = document.querySelectorAll('.tab-button');
        const columns = document.querySelectorAll('.column');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const selectedPath = button.getAttribute('data-path');
                
                // Update active tab
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Show/hide columns
                columns.forEach(column => {
                    column.classList.remove('active');
                    if (column.classList.contains(selectedPath)) {
                        column.classList.add('active');
                    }
                });
                
                // Re-trigger animations for newly visible cards
                const visibleCards = document.querySelectorAll(`.column.${selectedPath} .event-card`);
                visibleCards.forEach((card, index) => {
                    setTimeout(() => {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        
                        setTimeout(() => {
                            card.style.transition = 'all 0.6s ease-out';
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 50);
                    }, index * 100);
                });
            });
        });
        
        // Set initial active state
        const isMobile = window.innerWidth <= 968;
        if (isMobile) {
            columns.forEach(column => {
                column.classList.remove('active');
                if (column.classList.contains('socialist')) {
                    column.classList.add('active');
                }
            });
        }
    };
    
    setupMobileTabs();
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const columns = document.querySelectorAll('.column');
            const isMobile = window.innerWidth <= 968;
            
            if (!isMobile) {
                // Reset all columns to visible on desktop
                columns.forEach(column => {
                    column.classList.remove('active');
                });
            } else {
                // Ensure one column is active on mobile
                const hasActive = Array.from(columns).some(col => col.classList.contains('active'));
                if (!hasActive) {
                    columns.forEach(column => {
                        if (column.classList.contains('socialist')) {
                            column.classList.add('active');
                        }
                    });
                }
            }
        }, 250);
    });
});