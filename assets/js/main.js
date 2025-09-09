/**
 * Dynamic Scroll-Aligned Navigation
 * Main JavaScript functionality with Jekyll data integration
 */

// Jekyll 데이터에서 가져오기
const siteInfo = window.jekyllData.siteInfo;
const projectData = window.jekyllData.projects;
const publicationData = window.jekyllData.publications;
const newsData = window.jekyllData.news;
const sectionsData = window.jekyllData.sections;

// Vision Subgoal Data는 sections 데이터에서 가져오기
const visionSubgoals = sectionsData.vision.subgoals;

// Function to generate vision subgoals HTML
function generateVisionSubgoals() {
    return visionSubgoals.map((subgoal, index) => `
        <div class="subgoal-section">
            <div class="subgoal-title">${subgoal.subgoal}</div>
            <div class="subgoal-divider-2px"></div>
            <div class="subgoal-examples">
                ${subgoal.examples.map(example => `<div class="subgoal-example">• ${parseHighlightText(example)}</div>`).join('')}
            </div>
            <div class="subgoal-divider-1px"></div>
            <div class="subgoal-detail-toggle" onclick="toggleSubgoalDetail(${index})">Detail ></div>
            <div class="subgoal-detail" id="subgoal-detail-${index}" style="display: none;">
                <div class="subgoal-detail-content">${parseHighlightText(subgoal.detail)}</div>
            </div>
            <div class="subgoal-divider-2px"></div>
        </div>
    `).join('');
}


// Function to toggle subgoal detail visibility with smooth animation
function toggleSubgoalDetail(index) {
    const detailElement = document.getElementById(`subgoal-detail-${index}`);
    const isVisible = detailElement.style.display !== 'none';
    
    if (isVisible) {
        // Fade out and collapse
        detailElement.style.opacity = '0';
        detailElement.style.maxHeight = '0';
        detailElement.style.paddingTop = '0';
        detailElement.style.paddingBottom = '0';
        setTimeout(() => {
            detailElement.style.display = 'none';
        }, 300); // 0.3초 후 완전히 숨김
    } else {
        // Show and fade in
        detailElement.style.display = 'block';
        detailElement.style.opacity = '0';
        detailElement.style.maxHeight = '0';
        detailElement.style.paddingTop = '0';
        detailElement.style.paddingBottom = '0';
        
        // Force reflow
        detailElement.offsetHeight;
        
        // Animate in
        detailElement.style.opacity = '1';
        detailElement.style.maxHeight = '500px'; // 충분한 높이
        detailElement.style.paddingTop = '1rem';
        detailElement.style.paddingBottom = '1rem';
    }
}

// Content Data Structure - Jekyll 데이터 활용
const sectionData = [
    {
        id: 1,
        content: `
            <div class="placeholder-container">
                <div class="info-section-1">
                    ${siteInfo.social_links.map(link => 
                        `<a href="${link.url}" class="info-link">${link.name}</a>`
                    ).join('')}
                </div>
                <div class="info-section-2">${siteInfo.name}</div>
                <div class="info-section-3">${siteInfo.degree}</div>
                <div class="departments">
                    ${siteInfo.departments.map(department => `<div class="info-section-4">| ${department}</div>`).join('')}
                </div>
                <div class="info-section-5">I live at <span id="current-time"></span> in ${siteInfo.location}.</div>
            </div>
            <p>${sectionsData.main.content}</p>
            <div class="align-target ${sectionsData.main.target_class}">${sectionsData.main.target}</div>
            <p>In more detail... //
            Interdisciplinary exploration has been the cornerstone of my approach, including
            data science, mechanical engineering, embedded systems, bioengineering, and HCI.
            For three years, I have served as a Research Coordinator at the
            Center for Contemplative Science, pioneering research into jhana states—
            deep, rare states of concentrated awareness—  and discovering that
            humans possess remarkable capacities for robustness and wisdom cultivation.

            While today's AI brings vast knowledge, it struggles to guide us when we're heading in
            wrong directions or provide the transformative insights that go beyond mere information—
            this is the challenge I aim to address.

            I find joy in piano improvisation, watching musical, and cooking.</p>
        `
    },
    {
    id: 2,
    content: `
        <p>${sectionsData.vision.intro}</p>
        <div class="align-target">${sectionsData.vision.target}</div>
        <p>More detailed research questions are described below.</p>
        
        <div class="vision-subgoals">
            ${generateVisionSubgoals()}
        </div>
    `
    },
    {
        id: 3,
        content: `
            <div class="align-target">${sectionsData.projects.target}</div>
            <div id="projects-container" class="projects-container">
                <!-- Project cards will be dynamically inserted here -->
            </div>
        `
    },
    {
        id: 4,
        content: `
            <div class="align-target">${sectionsData.publications.target}</div>
            <div id="publications-container" class="publications-container">
                <!-- Publications cards will be dynamically inserted here -->
            </div>
        `
    }
];

// Application State
let currentSection = 1;
let isAnimating = false;

// DOM Elements
const contentArea = document.getElementById('contentArea');
const navContainer = document.getElementById('navContainer');
const navItems = document.querySelectorAll('.nav-item');
const verticalDivider = document.getElementById('verticalDivider');

/**
 * Parse text and wrap words marked with asterisks in highlight spans
 * @param {string} text - Text with potential *marked* words
 * @returns {string} - HTML string with highlight spans
 */
function parseHighlightText(text) {
    return text.replace(/\*([^*]+)\*/g, '<span class="highlight">$1</span>');
}

/**
 * Generate HTML for a single project card
 * @param {Object} project - Project data object
 * @returns {string} - Complete HTML string for the card
 */
function generateProjectCard(project) {
    const tagsHtml = project.tags.map(tag => {
        const tagClass = tag.toLowerCase(); // "Augmentation" -> "augmentation"
        return `<span class="tag ${tagClass}">${tag}</span>`;
    }).join('');
    
    const detailHtml = parseHighlightText(project.detail);
    const explanationHtml = parseHighlightText(project.explanation);
    
    return `
        <div class="project-card">
            <div class="project-image">
                <img src="${project.image}" alt="${project.title}">
            </div>
            <div class="project-content">
                <div class="project-tags">
                    ${tagsHtml}
                </div>                
                <div class="project-header">
                    <h3 class="project-title">${project.title}</h3>
                    <span class="project-year">${project.year}</span>
                </div>
                <hr class="separator">
                <div class="project-detail">
                    <span class="detail-label">Detail</span>
                    <span class="detail-text">${detailHtml}</span>
                </div>
                <hr class="separator">
                <div class="project-explanation">
                    ${explanationHtml}
                </div>
                <hr class="separator">
            </div>
        </div>
    `;
}

/**
 * Render all project cards to the container
 */
function renderProjectCards() {
    const container = document.getElementById('projects-container');
    if (container) {
        const cardsHtml = projectData.map(project => generateProjectCard(project)).join('');
        container.innerHTML = cardsHtml;
    }
}

/**
 * Generate HTML for a single publication card
 * @param {Object} publication - Publication data object
 * @returns {string} - Complete HTML string for the card
 */
function generatePublicationCard(publication) {
    const authorsHtml = parseHighlightText(publication.authors);
    const abstractHtml = publication.abstract ? parseHighlightText(publication.abstract) : '';
    
    // 링크가 있을 경우에만 HTML을 생성합니다.
    const linkHtml = publication.link 
        ? `<span class="publication-link"><a href="${publication.link}" target="_blank" rel="noopener noreferrer">   [link]</a></span>` 
        : '';

    return `
        <div class="publication-card">
            <div class="publication-content">
                <div class="publication-main">
                    <h3 class="publication-title">${publication.title}</h3>
                    <span class="detail-text">${authorsHtml}  ${linkHtml}</span>
                </div>
                    
                <div class="publication-sub">
                    <span class="publication-year">${publication.year}</span>
                    <span class="publication-organization">${publication.organization}</span>
                </div>
            </div>
            <hr class="separator">
            <div class="publication-abstract">
            ${abstractHtml}
            </div>
        </div>
    `;
}

/**
 * Render all publication cards to the container
 */
function renderPublicationCards() {
    const container = document.getElementById('publications-container');
    if (container) {
        const cardsHtml = publicationData.map(publication => generatePublicationCard(publication)).join('');
        container.innerHTML = cardsHtml;
    }
}

/**
 * Initialize navsubContainer with me.png image and news section
 */
function initializeNavsubContainer() {
    const navsubContainer = document.getElementById('navsubContainer');
    if (!navsubContainer) return;
    
    // Create me.png image element
    const meImage = document.createElement('img');
    meImage.src = siteInfo.profile_image;
    meImage.className = 'me-image';

    // Create news section
    const newsSection = document.createElement('div');
    newsSection.className = 'news-section';
    
    // Create news title
    const newsTitle = document.createElement('div');
    newsTitle.className = 'news-title';
    newsTitle.textContent = 'NEWS';
    newsSection.appendChild(newsTitle);
    
    // Create news items from Jekyll data
    newsData.forEach(news => {
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        
        const newsYear = document.createElement('span');
        newsYear.className = 'news-year';
        newsYear.textContent = news.year;
        
        const newsContent = document.createElement('span');
        newsContent.className = 'news-content';
        newsContent.textContent = news.content;
        
        newsItem.appendChild(newsYear);
        newsItem.appendChild(newsContent);
        newsSection.appendChild(newsItem);
    });
    
    // Add elements to navsubContainer (news first, then image)
    navsubContainer.appendChild(meImage);
    navsubContainer.appendChild(newsSection);
    
    // Position news section dynamically
    positionNewsSection();
}

/**
 * Position news section based on content layout
 */
function positionNewsSection() {
    // News section should be positioned to align with the info-section-1 (CV, LinkedIn, Email)
    // It stays at the top of navsubContainer, which is already aligned with info-section-2
    // No additional positioning needed as it's already in the correct relative position
}

/**
 * Initialize the application
 */
function init() {
    // Load initial content
    loadSectionContent(currentSection, false);
    
    // Initialize navsubContainer
    initializeNavsubContainer();
    
    // Attach event listeners
    attachEventListeners();
    
    // Set initial vertical divider after content loads (no animation)
    setTimeout(() => {
        updateVerticalDivider(false);
    }, 100);
}

/**
 * Attach all event listeners
 */
function attachEventListeners() {
    // Navigation item click handlers
    navItems.forEach(item => {
        item.addEventListener('click', handleNavClick);
    });
    
    // Scroll event listener for vertical divider (no animation)
    window.addEventListener('scroll', throttle(() => updateVerticalDivider(false), 16));
    
    // Resize event listener to recalculate divider (no animation)
    window.addEventListener('resize', debounce(() => updateVerticalDivider(false), 250));
}

/**
 * Handle navigation item clicks
 */
function handleNavClick(event) {
    if (isAnimating) return;
    
    const clickedItem = event.currentTarget;
    const sectionId = parseInt(clickedItem.dataset.section);
    
    if (sectionId === currentSection) return;
    
    switchSection(sectionId);
}

/**
 * Switch to a different section with modified animation sequence
 * New order: Content disappears → Navigation moves to proper position → New content appears
 */
function switchSection(newSectionId) {
    isAnimating = true;
    
    const navsubContainer = document.getElementById('navsubContainer');
    
    // Step 1: Animate content and navsubContainer out simultaneously
    contentArea.classList.add('slide-out');
    
    // Animate navsubContainer out if currently on Main section (section 1)
    if (currentSection === 1 && navsubContainer) {
        navsubContainer.classList.add('navsubContainer-slide-out');
    }
    
    // Wait for slide-out animation to complete
    setTimeout(() => {
        // Step 2: Update active states
        navItems.forEach(item => {
            if (parseInt(item.dataset.section) === newSectionId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Load new content (hidden)
        loadSectionContent(newSectionId, true);
        
        // Reset scroll to top
        window.scrollTo(0, 0);
        
        // Step 3: Update vertical divider for new content WITH ANIMATION
        setTimeout(() => {
            updateVerticalDivider(true); // Animated transition for section changes
            
            // Step 4: Show new content
            setTimeout(() => {
                // Remove slide-out class and add slide-in class
                contentArea.classList.remove('slide-out');
                contentArea.classList.add('slide-in');
                
                // Animate navsubContainer in if switching to Main section (section 1)
                if (newSectionId === 1 && navsubContainer) {
                    navsubContainer.classList.remove('navsubContainer-slide-out');
                    navsubContainer.classList.add('navsubContainer-slide-in');
                }
                
                // Update current section
                currentSection = newSectionId;
                
                // Wait for slide-in animation to complete
                setTimeout(() => {
                    contentArea.classList.remove('slide-in');
                    if (navsubContainer) {
                        navsubContainer.classList.remove('navsubContainer-slide-in');
                    }
                    isAnimating = false;
                    
                    // Final divider update after animation (no animation)
                    updateVerticalDivider(false);
                }, 500);
            }, 100); // Reduced delay
        }, 50);
    }, 500);
}

/**
 * Load section content into the content area
 */
function loadSectionContent(sectionId, animate = false) {
    const section = sectionData.find(s => s.id === sectionId);
    if (section) {
        contentArea.innerHTML = section.content;
        
        // Use a slight delay to ensure the DOM has rendered
        setTimeout(() => {
            const alignTarget = document.querySelector('.align-target');
            const contentColumn = document.querySelector('.content-column');

            if (alignTarget && contentColumn) {
                // Remove existing lines before adding a new one
                const existingLines = alignTarget.querySelectorAll('.horizontal-line');
                existingLines.forEach(line => line.remove());

                // Create and append the new line
                const horizontalLine = document.createElement('div');
                horizontalLine.className = 'horizontal-line';
                alignTarget.appendChild(horizontalLine);
                
                const computedStyle = window.getComputedStyle(contentColumn);
                const paddingLeft = parseInt(computedStyle.getPropertyValue('padding-left'), 10);
                
                // This offsetWidth should now be correct
                const textWidth = alignTarget.offsetWidth;
                
                horizontalLine.style.width = `calc(${textWidth + paddingLeft}px + 3rem)`;
            }

            // Other initializations after content is fully rendered
            if (sectionId === 1) {
                initializeClock();
                // Position news section after content loads
                setTimeout(() => positionNewsSection(), 100);
            }
            if (sectionId === 3) {
                renderProjectCards();
            }
            if (sectionId === 4) {
                renderPublicationCards();
            }
        }, 50); // A small delay
    }
}

/**
 * Update vertical divider line position - New core functionality
 * Line extends from 15px below active nav item to 15px above align-target
 * @param {boolean} animated - Whether to animate the transition
 */
function updateVerticalDivider(animated = false) {
    const alignTarget = document.querySelector('.align-target');
    const activeNavItem = document.querySelector('.nav-item.active');
    const navColumn = document.querySelector('.nav-column');
    
    if (!alignTarget || !activeNavItem || !verticalDivider || !navColumn) return;
    
    // Get positions relative to viewport
    const targetRect = alignTarget.getBoundingClientRect();
    const activeNavRect = activeNavItem.getBoundingClientRect();
    const navColumnRect = navColumn.getBoundingClientRect();
    
    // Calculate line start and end points relative to nav column
    const startValue = activeNavRect.bottom + 36 - navColumnRect.top;
    const endValue = targetRect.top - 12 - navColumnRect.top;

    const lineStart = Math.max(startValue, endValue); // bigger value goes lineStart
    const lineEnd = Math.min(startValue, endValue); // smaller value goes lineEnd
    
    // Update vertical divider position and height
    const lineHeight = Math.max(0, lineStart - lineEnd);
    
    // Apply or remove transition based on animated parameter
    if (animated) {
        verticalDivider.style.transition = 'top 0.3s ease, height 0.3s ease';
    } else {
        verticalDivider.style.transition = 'none';
    }
    
    verticalDivider.style.top = `${lineEnd}px`;
    verticalDivider.style.height = `${lineHeight}px`;
    
    // Reset transition after animation completes (if animated)
    if (animated) {
        setTimeout(() => {
            verticalDivider.style.transition = 'none';
        }, 300);
    }
}

/**
 * Initialize and update real-time clock for KST
 */
function initializeClock() {
    updateTime();
    // Update time every minute
    setInterval(updateTime, 60000);
}

/**
 * Update the time display with current KST time
 */
function updateTime() {
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        const now = new Date();
        // Convert to KST (UTC+9)
        const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const hours = kstTime.getUTCHours().toString().padStart(2, '0');
        const minutes = kstTime.getUTCMinutes().toString().padStart(2, '0');
        timeElement.textContent = `${hours}:${minutes}`;
    }
}

/**
 * Throttle function for performance optimization
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

/**
 * Debounce function for resize events
 */
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

// DOM이 완전히 로드된 후 스크립트를 실행합니다.
document.addEventListener('DOMContentLoaded', () => {
    renderProjectCards();
    renderPublicationCards();
});

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
