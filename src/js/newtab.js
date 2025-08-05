class YearCountdown {
    constructor() {
        this.init();
        this.startCountdown();
        this.initQuickLinks();
        this.initSettings();
        this.initGroupTabs();
        // Note: initWidgets() is called later in initializeAllFeatures()
    }

    init() {
        this.updateCurrentDate();
    }

    initSettings() {
        // Apply initial settings state
        setTimeout(() => {
            this.loadSettings();
        }, 100);
    }

    initQuickLinks() {
        this.loadQuickLinksSettings();
        this.bindQuickLinksEvents();
    }

    removeLinkElement(linkElement) {
        this.showConfirmation(
            'Remove Link',
            `Are you sure you want to remove "${linkElement.getAttribute('data-name')}"?`,
            () => {
                linkElement.remove();
                this.saveQuickLinks();
            }
        );
    }

    loadQuickLinksSettings() {
        const savedLinks = localStorage.getItem('quickLinks');
        const linksVisible = localStorage.getItem('quickLinksVisible');

        // Handle visibility state on page load
        if (linksVisible === 'false') {
            // Let DOM load first, then hide links properly
            setTimeout(() => {
                const wasDisabledBySettings = localStorage.getItem('quickLinksDisabledBySettings') === 'true';
                if (wasDisabledBySettings) {
                    this.hideQuickLinksViaSettings();
                } else {
                    this.hideQuickLinksTemporarily();
                }
            }, 50);
        } else {
            setTimeout(() => {
                this.showQuickLinks();
            }, 50);
        }

        if (savedLinks) {
            try {
                const links = JSON.parse(savedLinks);
                this.renderQuickLinks(links);
            } catch (e) {
            }
        }
    }

    bindQuickLinksEvents() {
        // Settings icon - opens settings menu
        const settingsIcon = document.getElementById('settings-icon');
        if (settingsIcon) {
            settingsIcon.addEventListener('click', () => this.showSettingsMenu());
        }

        // Show links button
        const showLinksBtn = document.getElementById('show-links-btn');
        if (showLinksBtn) {
            showLinksBtn.addEventListener('click', () => this.showQuickLinks());
        }

        // Add link button
        const addLinkBtn = document.getElementById('add-link-btn');
        if (addLinkBtn) {
            addLinkBtn.addEventListener('click', () => this.showAddLinkModal());
        }

        // Modal events
        const saveLinkBtn = document.getElementById('save-link-btn');
        const cancelLinkBtn = document.getElementById('cancel-link-btn');
        const modal = document.getElementById('add-link-modal');

        if (saveLinkBtn) {
            // Remove any existing event listeners to prevent duplicates
            saveLinkBtn.removeEventListener('click', this.saveNewLinkHandler);
            this.saveNewLinkHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                // Add small delay to prevent rapid clicks
                setTimeout(() => this.saveNewLink(), 10);
            };
            saveLinkBtn.addEventListener('click', this.saveNewLinkHandler);
        }

        if (cancelLinkBtn) {
            cancelLinkBtn.addEventListener('click', () => this.hideAddLinkModal());
        }

        // Handle form submission to prevent default behavior
        const addLinkForm = document.getElementById('add-link-form');
        if (addLinkForm) {
            addLinkForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            });
        }

        // Handle Enter key in modal inputs
        const linkNameInput = document.getElementById('link-name');
        const linkUrlInput = document.getElementById('link-url');

        if (linkNameInput) {
            linkNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    linkUrlInput.focus();
                }
            });
        }

        if (linkUrlInput) {
            // Add real-time URL formatting as user types
            linkUrlInput.addEventListener('blur', (e) => {
                let url = e.target.value.trim();
                if (url && !url.match(/^https?:\/\//i)) {
                    e.target.value = 'https://' + url;
                }
            });

            linkUrlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    // Add small delay to prevent conflicts with button click
                    setTimeout(() => this.saveNewLink(), 10);
                }
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideAddLinkModal();
                }
            });
        }

        // Bind remove link events
        this.bindRemoveEvents();

        // Settings menu events
        this.bindSettingsEvents();

        // Confirmation dialog events
        this.bindConfirmationEvents();
    }

    bindRemoveEvents() {
        const removeButtons = document.querySelectorAll('.remove-link');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.removeLinkElement(btn.parentElement);
            });
        });

        // Bind drag and drop events
        this.bindDragEvents();
    }

    bindDragEvents() {
        const linkElements = document.querySelectorAll('.quick-link');
        const linksGrid = document.getElementById('links-grid');

        linkElements.forEach(link => {
            // Make links draggable
            link.draggable = true;

            link.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', link.outerHTML);
                e.dataTransfer.setData('text/plain', link.href);

                link.classList.add('dragging');
                linksGrid.classList.add('drag-active');

                // Store the dragged element reference
                this.draggedElement = link;
            });

            link.addEventListener('dragend', (e) => {
                link.classList.remove('dragging');
                linksGrid.classList.remove('drag-active');

                // Remove drag-over class from all links
                linkElements.forEach(l => l.classList.remove('drag-over'));

                this.draggedElement = null;
            });

            link.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';

                if (link !== this.draggedElement) {
                    link.classList.add('drag-over');
                }
            });

            link.addEventListener('dragleave', (e) => {
                link.classList.remove('drag-over');
            });

            link.addEventListener('drop', (e) => {
                e.preventDefault();

                if (link !== this.draggedElement && this.draggedElement) {
                    this.reorderLinks(this.draggedElement, link);
                }

                link.classList.remove('drag-over');
            });
        });

        // Allow dropping on the grid itself
        if (linksGrid) {
            linksGrid.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            linksGrid.addEventListener('drop', (e) => {
                e.preventDefault();

                if (this.draggedElement && !e.target.classList.contains('quick-link')) {
                    // Dropped on empty space, move to end
                    linksGrid.appendChild(this.draggedElement);
                    this.saveQuickLinks();
                }
            });
        }
    }

    reorderLinks(draggedElement, targetElement) {
        const linksGrid = document.getElementById('links-grid');
        if (!linksGrid || !draggedElement || !targetElement) return;

        const allLinks = Array.from(linksGrid.children);
        const draggedIndex = allLinks.indexOf(draggedElement);
        const targetIndex = allLinks.indexOf(targetElement);

        if (draggedIndex < targetIndex) {
            // Moving forward
            targetElement.parentNode.insertBefore(draggedElement, targetElement.nextSibling);
        } else {
            // Moving backward
            targetElement.parentNode.insertBefore(draggedElement, targetElement);
        }

        // Save the new order
        this.saveQuickLinks();

        // Re-bind events for the reordered elements
        setTimeout(() => {
            this.bindRemoveEvents();
        }, 100);
    }

    showAddLinkModal() {
        const modal = document.getElementById('add-link-modal');
        if (modal) {
            modal.classList.remove('hidden');
            const nameInput = document.getElementById('link-name');
            if (nameInput) {
                nameInput.focus();
            }
        }
    }

    hideAddLinkModal() {
        const modal = document.getElementById('add-link-modal');
        if (modal) {
            modal.classList.add('hidden');
            // Clear inputs
            const nameInput = document.getElementById('link-name');
            const urlInput = document.getElementById('link-url');
            if (nameInput) nameInput.value = '';
            if (urlInput) urlInput.value = '';

            // Reset processing flag
            this.isProcessingLink = false;
            if (this.saveNewLinkTimeout) {
                clearTimeout(this.saveNewLinkTimeout);
                this.saveNewLinkTimeout = null;
            }
        }
    }

    saveNewLink() {

        // Prevent double-clicking issues
        if (this.isProcessingLink) {
            return false;
        }

        this.isProcessingLink = true;

        // Clear any pending timeouts for this function
        if (this.saveNewLinkTimeout) {
            clearTimeout(this.saveNewLinkTimeout);
        }

        const nameInput = document.getElementById('link-name');
        const urlInput = document.getElementById('link-url');

        if (!nameInput || !urlInput) {
            this.isProcessingLink = false;
            return false;
        }

        const name = nameInput.value.trim();
        let url = urlInput.value.trim();


        // Check if both fields have content
        if (!name || !url) {
            this.isProcessingLink = false;
            return false;
        }

        // Auto-format URL: add https:// if no protocol is specified
        if (!url.match(/^https?:\/\//i)) {
            url = 'https://' + url;
            // Update the input field to show the formatted URL
            urlInput.value = url;
        }

        // Validate the formatted URL
        try {
            new URL(url);
        } catch (e) {
            this.isProcessingLink = false;
            return false;
        }

        this.addNewLink(name, url);
        this.hideAddLinkModal();

        // Reset processing flag after a short delay
        this.saveNewLinkTimeout = setTimeout(() => {
            this.isProcessingLink = false;
        }, 500);

        return true;
    }

    addNewLink(name, url) {
        const linksGrid = document.getElementById('links-grid');
        if (!linksGrid) return;

        const linkElement = document.createElement('a');
        linkElement.href = url;
        linkElement.className = 'quick-link';
        linkElement.setAttribute('data-name', name);
        linkElement.draggable = true;
        linkElement.innerHTML = `
            <span class="link-text">${name}</span>
            <button class="remove-link" title="Remove">×</button>
        `;

        linksGrid.appendChild(linkElement);

        // Bind all events to new link
        setTimeout(() => {
            this.bindRemoveEvents();
        }, 100);

        this.saveQuickLinks();
    }

    showQuickLinks() {
        const quickLinksSection = document.getElementById('quick-links-section');
        const showLinksBtn = document.getElementById('show-links-btn');
        const container = document.querySelector('.container');

        if (quickLinksSection) {
            quickLinksSection.classList.remove('hidden');
        }

        if (showLinksBtn) {
            showLinksBtn.classList.add('hidden');
        }

        if (container) {
            container.classList.remove('centered');
            container.classList.remove('fully-centered');
        }

        localStorage.setItem('quickLinksVisible', 'true');
    }

    hideQuickLinksTemporarily() {
        // This method is specifically for the toggle button (temporary hiding)
        const quickLinksSection = document.getElementById('quick-links-section');
        const showLinksBtn = document.getElementById('show-links-btn');
        const container = document.querySelector('.container');

        if (quickLinksSection) {
            quickLinksSection.classList.add('hidden');
        }

        // For temporary hiding, always use centered mode and show the button
        if (container) {
            container.classList.add('centered');
            container.classList.remove('fully-centered');
        }

        if (showLinksBtn) {
            showLinksBtn.classList.remove('hidden');
        }

        localStorage.setItem('quickLinksVisible', 'false');
        // Don't set quickLinksDisabledBySettings flag for temporary hiding
        localStorage.removeItem('quickLinksDisabledBySettings');
    }

    hideQuickLinksViaSettings() {
        // This method is specifically for settings checkbox (complete disable)
        const quickLinksSection = document.getElementById('quick-links-section');
        const showLinksBtn = document.getElementById('show-links-btn');
        const container = document.querySelector('.container');

        if (quickLinksSection) {
            quickLinksSection.classList.add('hidden');
        }

        // For settings-based hiding, use fully-centered mode and hide the button
        if (container) {
            container.classList.add('fully-centered');
            container.classList.remove('centered');
        }

        if (showLinksBtn) {
            showLinksBtn.classList.add('hidden');
        }

        localStorage.setItem('quickLinksVisible', 'false');
        localStorage.setItem('quickLinksDisabledBySettings', 'true');
    }

    saveQuickLinks() {
        const linkElements = document.querySelectorAll('.quick-link');
        const links = Array.from(linkElements).map(link => ({
            name: link.getAttribute('data-name'),
            url: link.href
        }));

        localStorage.setItem('quickLinks', JSON.stringify(links));
        this.adjustGridLayout(); // Adjust layout when links change
    }

    renderQuickLinks(links) {
        const linksGrid = document.getElementById('links-grid');
        if (!linksGrid) return;

        linksGrid.innerHTML = '';

        links.forEach(link => {
            const linkElement = document.createElement('a');
            linkElement.href = link.url;
            linkElement.className = 'quick-link';
            linkElement.setAttribute('data-name', link.name);
            linkElement.draggable = true;
            linkElement.innerHTML = `
                <span class="link-text">${link.name}</span>
                <button class="remove-link" title="Remove">×</button>
            `;

            // Add click tracking for usage statistics
            linkElement.addEventListener('click', (e) => {
                // Only track if not clicking the remove button
                if (!e.target.classList.contains('remove-link')) {
                    this.trackLinkClick();
                }
            });

            linksGrid.appendChild(linkElement);
        });

        this.bindRemoveEvents();
        this.adjustGridLayout(); // Add dynamic grid adjustment
    }

    adjustGridLayout() {
        const linksGrid = document.getElementById('links-grid');
        const linkCount = document.querySelectorAll('.quick-link').length;

        // Remove any existing dynamic classes
        linksGrid.classList.remove('few-links', 'many-links', 'single-row');

        if (linkCount === 0) {
            return;
        } else if (linkCount <= 3) {
            // Few links - keep them compact and centered
            linksGrid.classList.add('few-links');
        } else if (linkCount <= 8) {
            // Normal amount - single row likely
            linksGrid.classList.add('single-row');
        } else {
            // Many links - need scrolling
            linksGrid.classList.add('many-links');
        }
    }

    updateCurrentDate() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        const currentDateEl = document.getElementById('current-date');
        if (currentDateEl) {
            currentDateEl.textContent = now.toLocaleDateString('en-US', options);
        }
    }

    calculateTimeRemaining() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const endOfYear = new Date(currentYear + 1, 0, 1, 0, 0, 0); // January 1st of next year

        const timeDifference = endOfYear.getTime() - now.getTime();

        if (timeDifference <= 0) {
            // Year has ended, reset everything
            this.handleYearEnd();
            return {
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                percentage: 100
            };
        }

        const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

        // Calculate year progress percentage
        const startOfYear = new Date(currentYear, 0, 1);
        const totalYearTime = endOfYear.getTime() - startOfYear.getTime();
        const elapsedTime = now.getTime() - startOfYear.getTime();
        const percentage = Math.min(100, Math.max(0, (elapsedTime / totalYearTime) * 100));

        return {
            days,
            hours,
            minutes,
            seconds,
            percentage: percentage.toFixed(2)
        };
    }

    handleYearEnd() {
        // Refresh the page to show the new year
        setTimeout(() => {
            location.reload();
        }, 1000);
    }

    updateDisplay() {
        const timeData = this.calculateTimeRemaining();

        // Update countdown numbers with safety checks
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');

        if (daysEl) daysEl.textContent = this.formatNumber(timeData.days);
        if (hoursEl) hoursEl.textContent = this.formatNumber(timeData.hours);
        if (minutesEl) minutesEl.textContent = this.formatNumber(timeData.minutes);
        if (secondsEl) secondsEl.textContent = this.formatNumber(timeData.seconds);

        // Update progress bar
        const progressFill = document.getElementById('progress-fill');
        const progressPercentage = document.getElementById('progress-percentage');

        if (progressFill) progressFill.style.width = `${timeData.percentage}%`;
        if (progressPercentage) progressPercentage.textContent = `${timeData.percentage}%`;

        // Update current date
        this.updateCurrentDate();

        // Add celebration effect when less than 24 hours remain
        if (timeData.days === 0) {
            this.addCelebrationEffect();
        }

        // Debug log
    }

    formatNumber(num) {
        return num.toString().padStart(2, '0');
    }

    addCelebrationEffect() {
        const countdownCard = document.querySelector('.countdown-card');
        if (!countdownCard.classList.contains('celebration')) {
            countdownCard.classList.add('celebration');
            this.addCelebrationStyles();
        }
    }

    addCelebrationStyles() {
        if (!document.getElementById('celebration-styles')) {
            const style = document.createElement('style');
            style.id = 'celebration-styles';
            style.textContent = `
                .celebration {
                    animation: celebrationPulse 2s infinite;
                    border: 2px solid #ffffff !important;
                    box-shadow: 
                        0 0 20px rgba(255, 255, 255, 0.3),
                        0 4px 20px rgba(0, 0, 0, 0.8) !important;
                }
                
                @keyframes celebrationPulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.01); }
                    100% { transform: scale(1); }
                }
                
                .celebration .time-unit {
                    background: rgba(255, 255, 255, 0.1) !important;
                    border-color: rgba(255, 255, 255, 0.2) !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    startCountdown() {
        // Update immediately
        this.updateDisplay();

        // Update every second
        this.intervalId = setInterval(() => {
            this.updateDisplay();
        }, 1000);

        // Debug: Log that countdown started
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
}

// Initialize the countdown when the page loads
let yearCountdown; // Declare it globally

document.addEventListener('DOMContentLoaded', () => {

    // Start up the app
    yearCountdown = new YearCountdown();
    yearCountdown.initializeAllFeatures();

    // Progress text toggle
    const progressBar = document.getElementById('progress-bar-toggle');
    const progressText = document.getElementById('progress-text');
    let progressTextVisible = false; // Default to hidden

    if (progressBar && progressText) {
        // Start with progress text hidden
        progressText.classList.add('hidden');

        progressBar.addEventListener('click', () => {
            progressTextVisible = !progressTextVisible;
            if (progressTextVisible) {
                progressText.classList.remove('hidden');
            } else {
                progressText.classList.add('hidden');
            }

            // Save preference to localStorage
            localStorage.setItem('progressTextVisible', progressTextVisible.toString());
        });

        // Load saved preference
        const savedPreference = localStorage.getItem('progressTextVisible');
        if (savedPreference !== null) {
            progressTextVisible = savedPreference === 'true';
            if (progressTextVisible) {
                progressText.classList.remove('hidden');
            } else {
                progressText.classList.add('hidden');
            }
        }
        // If no saved preference, keep default hidden state
    }

    // Update display when page becomes visible again
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && yearCountdown) {
            yearCountdown.updateDisplay();
        }
    });

    // Update display when window gets focus
    window.addEventListener('focus', () => {
        if (yearCountdown) {
            yearCountdown.updateDisplay();
        }
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (yearCountdown) {
            yearCountdown.stop();
        }
    });
});

// Add keyboard shortcuts for common actions
document.addEventListener('keydown', (event) => {
    // Ctrl/Cmd + R to refresh
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        location.reload();
    }

    // P key to toggle progress text
    if (event.key === 'p' || event.key === 'P') {
        const progressBar = document.getElementById('progress-bar-toggle');
        if (progressBar) {
            progressBar.click(); // Trigger the same toggle functionality
        }
    }

    // Escape to clear focus from any active element
    if (event.key === 'Escape') {
        document.activeElement.blur();
    }
});

// Settings Menu Methods
YearCountdown.prototype.showSettingsMenu = function () {
    const settingsMenu = document.getElementById('settings-menu');
    if (settingsMenu) {
        settingsMenu.classList.remove('hidden');
        this.loadSettings();
    }
};

YearCountdown.prototype.hideSettingsMenu = function () {
    const settingsMenu = document.getElementById('settings-menu');
    if (settingsMenu) {
        settingsMenu.classList.add('hidden');
    }
};

YearCountdown.prototype.loadSettings = function () {
    const progressVisibility = document.getElementById('progress-visibility');
    const quickLinksVisibility = document.getElementById('quick-links-visibility');
    const showSeconds = document.getElementById('show-seconds');

    if (progressVisibility) {
        const isVisible = localStorage.getItem('progressTextVisible') === 'true';
        progressVisibility.checked = isVisible;
        const progressText = document.getElementById('progress-text');
        if (progressText) {
            if (isVisible) {
                progressText.classList.remove('hidden');
            } else {
                progressText.classList.add('hidden');
            }
        }
    }

    if (quickLinksVisibility) {
        const shouldShowQuickLinks = localStorage.getItem('quickLinksVisible') !== 'false';
        quickLinksVisibility.checked = shouldShowQuickLinks;

        // Apply the quick links visibility setting
        if (shouldShowQuickLinks) {
            this.showQuickLinks();
        } else {
            // Check if it was disabled by settings or just hidden temporarily
            const wasDisabledBySettings = localStorage.getItem('quickLinksDisabledBySettings') === 'true';
            if (wasDisabledBySettings) {
                this.hideQuickLinksViaSettings();
            } else {
                this.hideQuickLinksTemporarily();
            }
        }
    }

    if (showSeconds) {
        const shouldShow = localStorage.getItem('showSeconds') !== 'false';
        showSeconds.checked = shouldShow;
        const secondsEl = document.getElementById('seconds').parentElement;
        const countdownDisplay = document.querySelector('.countdown-display');

        if (secondsEl) {
            if (shouldShow) {
                secondsEl.style.display = 'flex';
                countdownDisplay.classList.remove('no-seconds');
            } else {
                secondsEl.style.display = 'none';
                countdownDisplay.classList.add('no-seconds');
            }
        }
    }
};

YearCountdown.prototype.showConfirmation = function (title, message, onConfirm) {
    const dialog = document.getElementById('confirmation-dialog');
    const titleEl = document.getElementById('confirmation-title');
    const messageEl = document.getElementById('confirmation-message');

    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;

    this.confirmationCallback = onConfirm;

    if (dialog) {
        dialog.classList.remove('hidden');
    }
};

YearCountdown.prototype.handleConfirmation = function (confirmed) {
    const dialog = document.getElementById('confirmation-dialog');

    if (dialog) {
        dialog.classList.add('hidden');
    }

    if (confirmed && this.confirmationCallback) {
        this.confirmationCallback();
    }

    this.confirmationCallback = null;
};

YearCountdown.prototype.bindSettingsEvents = function () {
    const settingsMenu = document.getElementById('settings-menu');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const resetSettingsBtn = document.getElementById('reset-settings-btn');

    // Settings checkboxes
    const progressVisibility = document.getElementById('progress-visibility');
    const quickLinksVisibility = document.getElementById('quick-links-visibility');
    const showSeconds = document.getElementById('show-seconds');

    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', () => this.hideSettingsMenu());
    }

    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', () => {
            // Close settings menu first to avoid layering issues
            this.hideSettingsMenu();

            // Show confirmation after a brief delay to ensure settings menu is closed
            setTimeout(() => {
                this.showConfirmation(
                    'Reset Settings',
                    'Are you sure you want to reset all settings to default? This will also remove all custom links.',
                    () => {
                        localStorage.clear();
                        location.reload();
                    }
                );
            }, 100);
        });
    }

    // Progress visibility checkbox
    if (progressVisibility) {
        progressVisibility.addEventListener('change', (e) => {
            const progressText = document.getElementById('progress-text');
            if (e.target.checked) {
                if (progressText) progressText.classList.remove('hidden');
                localStorage.setItem('progressTextVisible', 'true');
            } else {
                if (progressText) progressText.classList.add('hidden');
                localStorage.setItem('progressTextVisible', 'false');
            }
        });
    }

    // Quick links visibility checkbox
    if (quickLinksVisibility) {
        quickLinksVisibility.addEventListener('change', (e) => {
            if (e.target.checked) {
                localStorage.removeItem('quickLinksDisabledBySettings');
                this.showQuickLinks();
            } else {
                this.hideQuickLinksViaSettings();
            }
        });
    }

    // Show seconds checkbox
    if (showSeconds) {
        showSeconds.addEventListener('change', (e) => {
            const secondsEl = document.getElementById('seconds').parentElement;
            const countdownDisplay = document.querySelector('.countdown-display');

            if (e.target.checked) {
                secondsEl.style.display = 'flex';
                countdownDisplay.classList.remove('no-seconds');
                localStorage.setItem('showSeconds', 'true');
            } else {
                secondsEl.style.display = 'none';
                countdownDisplay.classList.add('no-seconds');
                localStorage.setItem('showSeconds', 'false');
            }
        });

        if (settingsMenu) {
            settingsMenu.addEventListener('click', (e) => {
                if (e.target === settingsMenu) {
                    this.hideSettingsMenu();
                }
            });
        }
    }
};

// Confirmation Events
YearCountdown.prototype.bindConfirmationEvents = function () {
    const confirmationDialog = document.getElementById('confirmation-dialog');
    const confirmYesBtn = document.getElementById('confirm-yes-btn');
    const confirmNoBtn = document.getElementById('confirm-no-btn');

    if (confirmYesBtn) {
        confirmYesBtn.addEventListener('click', () => this.handleConfirmation(true));
    }

    if (confirmNoBtn) {
        confirmNoBtn.addEventListener('click', () => this.handleConfirmation(false));
    }

    if (confirmationDialog) {
        confirmationDialog.addEventListener('click', (e) => {
            if (e.target === confirmationDialog) {
                this.handleConfirmation(false);
            }
        });
    }
};

// Group Tabs Methods
YearCountdown.prototype.initGroupTabs = function () {
    this.bindGroupEvents();
};

YearCountdown.prototype.bindGroupEvents = function () {
    const addGroupBtn = document.getElementById('add-group-btn');
    const openGroupsBtn = document.getElementById('open-groups-btn');
    const saveGroupBtn = document.getElementById('save-group-btn');
    const cancelGroupBtn = document.getElementById('cancel-group-btn');
    const closeGroupsBtn = document.getElementById('close-groups-btn');

    // Remove existing listeners to prevent duplicates
    if (addGroupBtn && !addGroupBtn.hasEventListener) {
        addGroupBtn.addEventListener('click', () => this.showAddGroupModal());
        addGroupBtn.hasEventListener = true;
    }

    if (openGroupsBtn && !openGroupsBtn.hasEventListener) {
        openGroupsBtn.addEventListener('click', () => this.showSavedGroupsModal());
        openGroupsBtn.hasEventListener = true;
    }

    if (saveGroupBtn && !saveGroupBtn.hasEventListener) {
        saveGroupBtn.addEventListener('click', () => this.saveTabGroup());
        saveGroupBtn.hasEventListener = true;
    }

    if (cancelGroupBtn && !cancelGroupBtn.hasEventListener) {
        cancelGroupBtn.addEventListener('click', () => this.hideAddGroupModal());
        cancelGroupBtn.hasEventListener = true;
    }

    if (closeGroupsBtn && !closeGroupsBtn.hasEventListener) {
        closeGroupsBtn.addEventListener('click', () => this.hideSavedGroupsModal());
        closeGroupsBtn.hasEventListener = true;
    }

    // Close modals when clicking outside
    const addGroupModal = document.getElementById('add-group-modal');
    const savedGroupsModal = document.getElementById('saved-groups-modal');

    if (addGroupModal) {
        addGroupModal.addEventListener('click', (e) => {
            if (e.target === addGroupModal) {
                this.hideAddGroupModal();
            }
        });
    }

    if (savedGroupsModal) {
        savedGroupsModal.addEventListener('click', (e) => {
            if (e.target === savedGroupsModal) {
                this.hideSavedGroupsModal();
            }
        });
    }
};

YearCountdown.prototype.showAddGroupModal = function () {
    const modal = document.getElementById('add-group-modal');
    const checklist = document.getElementById('links-checklist');
    const groupNameInput = document.getElementById('group-name');

    if (!modal || !checklist) return;

    // Populate checklist with current links
    this.populateLinksChecklist();

    // Clear previous input
    if (groupNameInput) {
        groupNameInput.value = '';
        groupNameInput.focus();
    }

    modal.classList.remove('hidden');
};

YearCountdown.prototype.hideAddGroupModal = function () {
    const modal = document.getElementById('add-group-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

YearCountdown.prototype.showSavedGroupsModal = function () {
    const modal = document.getElementById('saved-groups-modal');
    if (!modal) return;

    this.populateSavedGroups();
    modal.classList.remove('hidden');
};

YearCountdown.prototype.hideSavedGroupsModal = function () {
    const modal = document.getElementById('saved-groups-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

YearCountdown.prototype.populateLinksChecklist = function () {
    const checklist = document.getElementById('links-checklist');
    const links = document.querySelectorAll('.quick-link');

    if (!checklist) return;

    checklist.innerHTML = '';

    links.forEach((link, index) => {
        const linkName = link.getAttribute('data-name');
        const linkUrl = link.href;

        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'link-checkbox-item';

        checkboxItem.innerHTML = `
            <input type="checkbox" id="link-${index}" data-url="${linkUrl}" data-name="${linkName}">
            <label for="link-${index}">${linkName}</label>
        `;

        checklist.appendChild(checkboxItem);
    });
};

YearCountdown.prototype.saveTabGroup = function () {
    const groupNameInput = document.getElementById('group-name');
    const checkedBoxes = document.querySelectorAll('#links-checklist input[type="checkbox"]:checked');

    if (!groupNameInput || !groupNameInput.value.trim()) {
        alert('Please enter a group name');
        return;
    }

    if (checkedBoxes.length === 0) {
        alert('Please select at least one link');
        return;
    }

    const groupName = groupNameInput.value.trim();
    const selectedLinks = Array.from(checkedBoxes).map(checkbox => ({
        name: checkbox.getAttribute('data-name'),
        url: checkbox.getAttribute('data-url')
    }));

    // Save to localStorage
    const savedGroups = this.getSavedGroups();
    const newGroup = {
        id: Date.now(),
        name: groupName,
        links: selectedLinks,
        createdAt: new Date().toISOString()
    };

    savedGroups.push(newGroup);
    localStorage.setItem('tabGroups', JSON.stringify(savedGroups));

    // Track group creation for usage statistics
    this.trackGroupCreation();

    this.hideAddGroupModal();

    // Show success message
    this.showTemporaryMessage(`Group "${groupName}" created successfully!`);
};

YearCountdown.prototype.getSavedGroups = function () {
    const saved = localStorage.getItem('tabGroups');
    return saved ? JSON.parse(saved) : [];
};

YearCountdown.prototype.populateSavedGroups = function () {
    const groupsList = document.getElementById('groups-list');
    const savedGroups = this.getSavedGroups();

    if (!groupsList) return;

    if (savedGroups.length === 0) {
        groupsList.innerHTML = `
            <div style="text-align: center; color: #64748b; padding: 40px 20px;">
                <p>No saved groups yet.</p>
                <p>Create your first group to get started!</p>
            </div>
        `;
        return;
    }

    groupsList.innerHTML = '';

    savedGroups.forEach(group => {
        const groupItem = document.createElement('div');
        groupItem.className = 'group-item';

        const linksPreview = group.links.slice(0, 3).map(link => link.name).join(', ');
        const additionalCount = group.links.length > 3 ? ` +${group.links.length - 3} more` : '';

        groupItem.innerHTML = `
            <div class="group-header">
                <div class="group-name">${group.name}</div>
                <div class="group-actions">
                    <button class="open-group-btn" data-group-id="${group.id}">
                        Open
                    </button>
                    <button class="delete-group-btn" data-group-id="${group.id}">
                        Delete
                    </button>
                </div>
            </div>
            <div class="group-links">${linksPreview}${additionalCount}</div>
            <div class="group-links-count">${group.links.length} link${group.links.length !== 1 ? 's' : ''} • Created ${this.formatDate(group.createdAt)}</div>
        `;

        // Add event listeners to the buttons
        const openBtn = groupItem.querySelector('.open-group-btn');
        const deleteBtn = groupItem.querySelector('.delete-group-btn');

        if (openBtn) {
            openBtn.addEventListener('click', () => this.openTabGroup(group.links, group.name));
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteTabGroup(group.id));
        }

        groupsList.appendChild(groupItem);
    });
};

YearCountdown.prototype.openTabGroup = function (links, groupName = 'Tab Group') {
    // Show tab selection modal instead of opening all tabs automatically
    this.showTabSelectionModal(links, groupName);
};

YearCountdown.prototype.deleteTabGroup = function (groupId) {
    this.showConfirmation(
        'Delete Group',
        'Are you sure you want to delete this group? This action cannot be undone.',
        () => {
            const savedGroups = this.getSavedGroups();
            const updatedGroups = savedGroups.filter(group => group.id !== groupId);
            localStorage.setItem('tabGroups', JSON.stringify(updatedGroups));
            this.populateSavedGroups(); // Refresh the list
            this.showTemporaryMessage('Group deleted successfully');
        }
    );
};

YearCountdown.prototype.formatDate = function (dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'today';
    } else if (diffDays === 1) {
        return 'yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
};

YearCountdown.prototype.showTemporaryMessage = function (message) {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
        padding: 12px 20px;
        border-radius: 8px;
        border: 1px solid rgba(34, 197, 94, 0.3);
        z-index: 10000;
        font-weight: 500;
        backdrop-filter: blur(10px);
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
};

// Tab Selection Modal Methods
YearCountdown.prototype.showTabSelectionModal = function (links, groupName) {
    const modal = document.getElementById('tab-selection-modal');
    const title = document.getElementById('tab-selection-title');
    const checklist = document.getElementById('tabs-checklist');

    if (!modal || !checklist) return;

    // Set title
    if (title) {
        title.textContent = `Select Tabs to Open from "${groupName}"`;
    }

    // Store links for later use
    this.currentGroupLinks = links;

    // Populate checklist with group links
    this.populateTabsChecklist(links);

    // Bind tab selection events
    this.bindTabSelectionEvents();

    modal.classList.remove('hidden');
};

YearCountdown.prototype.populateTabsChecklist = function (links) {
    const checklist = document.getElementById('tabs-checklist');

    if (!checklist) return;

    checklist.innerHTML = '';

    links.forEach((link, index) => {
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'link-checkbox-item';

        checkboxItem.innerHTML = `
            <input type="checkbox" id="tab-${index}" data-url="${link.url}" data-name="${link.name}" checked>
            <label for="tab-${index}">${link.name}</label>
        `;

        checklist.appendChild(checkboxItem);
    });
};

YearCountdown.prototype.bindTabSelectionEvents = function () {
    const openSelectedBtn = document.getElementById('open-selected-tabs-btn');
    const openAllBtn = document.getElementById('open-all-tabs-btn');
    const cancelBtn = document.getElementById('cancel-tab-selection-btn');
    const modal = document.getElementById('tab-selection-modal');

    // Remove existing listeners to prevent duplicates
    if (openSelectedBtn && !openSelectedBtn.hasTabListener) {
        openSelectedBtn.addEventListener('click', () => this.openSelectedTabs());
        openSelectedBtn.hasTabListener = true;
    }

    if (openAllBtn && !openAllBtn.hasTabListener) {
        openAllBtn.addEventListener('click', () => this.openAllTabsWithConfirmation());
        openAllBtn.hasTabListener = true;
    }

    if (cancelBtn && !cancelBtn.hasTabListener) {
        cancelBtn.addEventListener('click', () => this.hideTabSelectionModal());
        cancelBtn.hasTabListener = true;
    }

    // Close modal when clicking outside
    if (modal && !modal.hasTabListener) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideTabSelectionModal();
            }
        });
        modal.hasTabListener = true;
    }
};

YearCountdown.prototype.hideTabSelectionModal = function () {
    const modal = document.getElementById('tab-selection-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    this.currentGroupLinks = null;
};

YearCountdown.prototype.openSelectedTabs = function () {
    const checkedBoxes = document.querySelectorAll('#tabs-checklist input[type="checkbox"]:checked');

    if (checkedBoxes.length === 0) {
        alert('Please select at least one tab to open');
        return;
    }

    const selectedTabs = Array.from(checkedBoxes).map(checkbox => ({
        name: checkbox.getAttribute('data-name'),
        url: checkbox.getAttribute('data-url')
    }));

    // Check if many tabs and show confirmation
    if (selectedTabs.length > 5) {
        this.showConfirmation(
            'Open Many Tabs',
            `You are about to open ${selectedTabs.length} tabs. This might slow down your browser. Continue?`,
            () => {
                this.openTabsWithDelay(selectedTabs);
                this.hideTabSelectionModal();
            }
        );
    } else {
        this.openTabsWithDelay(selectedTabs);
        this.hideTabSelectionModal();
    }
};

YearCountdown.prototype.openAllTabsWithConfirmation = function () {
    if (!this.currentGroupLinks) return;

    const tabCount = this.currentGroupLinks.length;

    if (tabCount > 5) {
        this.showConfirmation(
            'Open All Tabs',
            `You are about to open ${tabCount} tabs. This might slow down your browser. Continue?`,
            () => {
                this.openTabsWithDelay(this.currentGroupLinks);
                this.hideTabSelectionModal();
            }
        );
    } else {
        this.openTabsWithDelay(this.currentGroupLinks);
        this.hideTabSelectionModal();
    }
};

YearCountdown.prototype.openTabsWithDelay = function (tabs) {
    // Open tabs with a delay to prevent browser blocking and crashes
    tabs.forEach((tab, index) => {
        setTimeout(() => {
            window.open(tab.url, '_blank');
        }, index * 200); // Increased delay to 200ms for safety
    });

    this.showTemporaryMessage(`Opening ${tabs.length} tab${tabs.length !== 1 ? 's' : ''}...`);
};

// ===== NEW FEATURES IMPLEMENTATION =====

// Widgets Management
YearCountdown.prototype.initWidgets = function () {
    this.initQuoteWidget();
    this.initWeatherWidget();
    this.initCalendarWidget();
    this.initTimezoneWidget();
    this.initStatsWidget();
    this.loadWidgetSettings();
};

// Quote Widget
YearCountdown.prototype.initQuoteWidget = function () {
    this.quotes = [
        { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
        { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
        { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
        { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
        { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
        { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
        { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
        { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
        { text: "It is not the mountain we conquer, but ourselves.", author: "Sir Edmund Hillary" },
        { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" }
    ];
    this.displayRandomQuote();
};

YearCountdown.prototype.displayRandomQuote = function () {
    const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
    document.getElementById('quote-text').textContent = `"${randomQuote.text}"`;
    document.getElementById('quote-author').textContent = `— ${randomQuote.author}`;
};

// Weather Widget
YearCountdown.prototype.initWeatherWidget = function () {
    this.bindWeatherEvents();
    this.loadWeather();
    this.startWeatherRefresh();
};

YearCountdown.prototype.bindWeatherEvents = function () {
    // No weather refresh button anymore since it's integrated into quote widget
};

YearCountdown.prototype.loadWeather = function () {
    const self = this;

    // Check if we have cached weather data that's still fresh (within 10 minutes)
    const cachedWeather = localStorage.getItem('weatherData');
    const cacheTime = localStorage.getItem('weatherCacheTime');
    const now = Date.now();
    const cacheExpiry = 10 * 60 * 1000; // 10 minutes in milliseconds

    if (cachedWeather && cacheTime && (now - parseInt(cacheTime)) < cacheExpiry) {
        try {
            const weather = JSON.parse(cachedWeather);
            this.displayWeather(weather);
            return;
        } catch (e) {
        }
    }

    // If no valid cache, fetch fresh data
    this.getCurrentPosition()
        .then(position => this.fetchWeather(position.coords.latitude, position.coords.longitude))
        .then(weather => {
            this.displayWeather(weather);
            // Cache the weather data
            localStorage.setItem('weatherData', JSON.stringify(weather));
            localStorage.setItem('weatherCacheTime', now.toString());
        })
        .catch(error => {
            this.displayWeatherError();
        });
};

YearCountdown.prototype.getCurrentPosition = function () {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            // If geolocation is not supported, use a default location (New York)
            resolve({
                coords: {
                    latitude: 40.7128,
                    longitude: -74.0060
                }
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            position => resolve(position),
            error => {
                // If user denies location or there's an error, use default location
                resolve({
                    coords: {
                        latitude: 40.7128, // New York coordinates as fallback
                        longitude: -74.0060
                    }
                });
            },
            {
                timeout: 15000, // Increased timeout for better accuracy
                enableHighAccuracy: true, // Enable high accuracy
                maximumAge: 300000 // Accept cached position up to 5 minutes old (more frequent updates)
            }
        );
    });
};

YearCountdown.prototype.getPreciseLocationName = function (lat, lon) {
    // Check if we have cached location data that's still fresh (within 1 hour)
    const cacheKey = `location_${lat.toFixed(3)}_${lon.toFixed(3)}`;
    const cachedLocation = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(`${cacheKey}_time`);
    const now = Date.now();
    const cacheExpiry = 60 * 60 * 1000; // 1 hour in milliseconds

    if (cachedLocation && cacheTime && (now - parseInt(cacheTime)) < cacheExpiry) {
        return Promise.resolve(cachedLocation);
    }

    // Use Nominatim OpenStreetMap reverse geocoding (free, no API key needed)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;

    return fetch(url, {
        method: 'GET',
        headers: {
            'User-Agent': 'WeatherWidget/1.0' // Nominatim requires a User-Agent
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Geocoding error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const address = data.address || {};

            // Build location string with priority: city > town > village > suburb
            let locationName = '';

            if (address.city) {
                locationName = address.city;
            } else if (address.town) {
                locationName = address.town;
            } else if (address.village) {
                locationName = address.village;
            } else if (address.suburb) {
                locationName = address.suburb;
            } else if (address.municipality) {
                locationName = address.municipality;
            } else if (address.county) {
                locationName = address.county;
            }

            // Add state/region if available and different from city
            if (address.state && address.state !== locationName) {
                locationName += `, ${address.state}`;
            }

            // Add country if available
            if (address.country) {
                locationName += `, ${address.country}`;
            }

            const finalLocation = locationName || 'Your Location';

            // Cache the location result
            localStorage.setItem(cacheKey, finalLocation);
            localStorage.setItem(`${cacheKey}_time`, now.toString());

            return finalLocation;
        })
        .catch(error => {
            return 'Your Location'; // Fallback
        });
};

YearCountdown.prototype.fetchWeather = function (lat, lon) {
    // Get both weather data and precise location name in parallel
    const weatherPromise = this.fetchWeatherData(lat, lon);
    const locationPromise = this.getPreciseLocationName(lat, lon);

    return Promise.all([weatherPromise, locationPromise])
        .then(([weatherData, preciseLocation]) => {
            // Combine weather data with precise location
            return {
                ...weatherData,
                location: preciseLocation
            };
        })
        .catch(error => {
            // Fallback to weather data without precise location
            return this.fetchWeatherData(lat, lon);
        });
};

YearCountdown.prototype.fetchWeatherData = function (lat, lon) {
    // Using wttr.in weather service - free, no API key required
    const url = `https://wttr.in/${lat},${lon}?format=j1`;

    return fetch(url, {
        method: 'GET',
        headers: {
            'User-Agent': 'curl/7.68.0' // wttr.in expects a User-Agent
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const current = data.current_condition[0];
            const location = data.nearest_area[0];
            const units = localStorage.getItem('weatherUnits') || 'metric';

            let temperature, feelsLike;
            if (units === 'imperial') {
                temperature = Math.round(parseFloat(current.temp_F));
                feelsLike = Math.round(parseFloat(current.FeelsLikeF));
            } else {
                temperature = Math.round(parseFloat(current.temp_C));
                feelsLike = Math.round(parseFloat(current.FeelsLikeC));
            }

            return {
                temperature: temperature,
                description: current.weatherDesc[0].value,
                location: `${location.areaName[0].value}, ${location.country[0].value}`, // Fallback location
                feelsLike: feelsLike,
                humidity: current.humidity,
                windSpeed: current.windspeedKmph,
                coordinates: { lat: lat, lon: lon }
            };
        })
        .catch(error => {
            // Fallback to another free service
            return this.fetchWeatherFallback(lat, lon);
        });
};

YearCountdown.prototype.fetchWeatherFallback = function (lat, lon) {
    // Fallback using Open-Meteo (free, no API key required)
    const units = localStorage.getItem('weatherUnits') || 'metric';
    const tempUnit = units === 'imperial' ? 'fahrenheit' : 'celsius';
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=${tempUnit}&timezone=auto`;

    // Try to get both weather and precise location
    const weatherPromise = fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Fallback weather API error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const current = data.current_weather;
            const temperature = Math.round(current.temperature);

            // Map weather codes to descriptions
            const weatherCodeMap = {
                0: 'Clear sky',
                1: 'Mainly clear',
                2: 'Partly cloudy',
                3: 'Overcast',
                45: 'Fog',
                48: 'Depositing rime fog',
                51: 'Light drizzle',
                53: 'Moderate drizzle',
                55: 'Dense drizzle',
                61: 'Slight rain',
                63: 'Moderate rain',
                65: 'Heavy rain',
                71: 'Slight snow',
                73: 'Moderate snow',
                75: 'Heavy snow',
                80: 'Rain showers',
                81: 'Rain showers',
                82: 'Rain showers',
                95: 'Thunderstorm',
                96: 'Thunderstorm with hail',
                99: 'Thunderstorm with hail'
            };

            return {
                temperature: temperature,
                description: weatherCodeMap[current.weathercode] || 'Unknown',
                location: 'Your Location', // Default fallback
                feelsLike: temperature, // Open-Meteo doesn't provide feels-like temp
                humidity: null,
                windSpeed: Math.round(current.windspeed),
                coordinates: { lat: lat, lon: lon }
            };
        });

    const locationPromise = this.getPreciseLocationName(lat, lon).catch(() => 'Your Location');

    return Promise.all([weatherPromise, locationPromise])
        .then(([weatherData, preciseLocation]) => {
            return {
                ...weatherData,
                location: preciseLocation
            };
        })
        .catch(error => {
            // Return a default error state
            throw new Error('Unable to fetch weather data');
        });
};

YearCountdown.prototype.displayWeather = function (weather) {
    const units = localStorage.getItem('weatherUnits') || 'metric';
    const tempSymbol = units === 'metric' ? '°C' : '°F';

    // Update the integrated weather display in quote widget
    const tempDisplay = document.getElementById('temp-display');
    const weatherCondition = document.getElementById('weather-condition');
    const weatherLocationSmall = document.getElementById('weather-location-small');
    const feelsLikeTemp = document.getElementById('feels-like-temp');

    if (tempDisplay) tempDisplay.textContent = `${weather.temperature}${tempSymbol}`;
    if (weatherCondition) weatherCondition.textContent = weather.description;
    if (weatherLocationSmall) weatherLocationSmall.textContent = weather.location;
    if (feelsLikeTemp) feelsLikeTemp.textContent = `${weather.feelsLike}${tempSymbol}`;

    // If only weather is visible (quotes disabled), load and display forecast
    const quoteWidget = document.getElementById('quote-widget');
    const isWeatherOnly = quoteWidget && quoteWidget.classList.contains('weather-only');

    if (isWeatherOnly) {
        this.loadWeatherForecast(weather.coordinates || { lat: null, lon: null });
    }
};

YearCountdown.prototype.loadWeatherForecast = function (coords) {
    if (!coords.lat || !coords.lon) {
        // Try to get coordinates from geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    this.fetchWeatherForecast(position.coords.latitude, position.coords.longitude);
                },
                error => {
                    this.displayForecastError();
                }
            );
        } else {
            this.displayForecastError();
        }
    } else {
        this.fetchWeatherForecast(coords.lat, coords.lon);
    }
};

YearCountdown.prototype.fetchWeatherForecast = function (lat, lon) {
    const units = localStorage.getItem('weatherUnits') || 'metric';
    const tempUnit = units === 'imperial' ? 'fahrenheit' : 'celsius';

    // Use Open-Meteo for 5-day forecast
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&temperature_unit=${tempUnit}&timezone=auto&forecast_days=5`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Forecast API error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            this.displayWeatherForecast(data.daily);
        })
        .catch(error => {
            this.displayForecastError();
        });
};

YearCountdown.prototype.displayWeatherForecast = function (dailyData) {
    // Create or update forecast container
    let forecastContainer = document.getElementById('weather-forecast-container');
    if (!forecastContainer) {
        forecastContainer = document.createElement('div');
        forecastContainer.id = 'weather-forecast-container';
        forecastContainer.className = 'weather-forecast-container';

        // Insert after weather info but before quote content
        const quoteWidget = document.getElementById('quote-widget');
        const weatherInfo = document.getElementById('weather-info');
        const quoteContent = document.querySelector('.quote-content');

        if (quoteWidget && weatherInfo && quoteContent) {
            quoteWidget.insertBefore(forecastContainer, quoteContent);
        }
    }

    const weatherCodeMap = {
        0: { desc: 'Clear', emoji: '☀️' },
        1: { desc: 'Mostly Clear', emoji: '🌤️' },
        2: { desc: 'Partly Cloudy', emoji: '⛅' },
        3: { desc: 'Overcast', emoji: '☁️' },
        45: { desc: 'Fog', emoji: '🌫️' },
        48: { desc: 'Rime Fog', emoji: '🌫️' },
        51: { desc: 'Light Drizzle', emoji: '🌦️' },
        53: { desc: 'Drizzle', emoji: '🌦️' },
        55: { desc: 'Heavy Drizzle', emoji: '🌧️' },
        61: { desc: 'Light Rain', emoji: '🌧️' },
        63: { desc: 'Rain', emoji: '🌧️' },
        65: { desc: 'Heavy Rain', emoji: '⛈️' },
        71: { desc: 'Light Snow', emoji: '🌨️' },
        73: { desc: 'Snow', emoji: '❄️' },
        75: { desc: 'Heavy Snow', emoji: '❄️' },
        80: { desc: 'Rain Showers', emoji: '🌦️' },
        81: { desc: 'Rain Showers', emoji: '🌧️' },
        82: { desc: 'Heavy Showers', emoji: '⛈️' },
        95: { desc: 'Thunderstorm', emoji: '⛈️' },
        96: { desc: 'Thunderstorm', emoji: '⛈️' },
        99: { desc: 'Heavy Thunderstorm', emoji: '⛈️' }
    };

    let forecastHTML = '<div class="forecast-title">5-Day Forecast</div><div class="forecast-days">';

    for (let i = 0; i < Math.min(5, dailyData.time.length); i++) {
        const date = new Date(dailyData.time[i]);
        const tempMax = Math.round(dailyData.temperature_2m_max[i]);
        const tempMin = Math.round(dailyData.temperature_2m_min[i]);
        const weatherCode = dailyData.weathercode[i];
        const precipitation = dailyData.precipitation_probability_max[i] || 0;
        const weather = weatherCodeMap[weatherCode] || { desc: 'Unknown', emoji: '❓' };

        const dayName = i === 0 ? 'Today' :
            i === 1 ? 'Tomorrow' :
                date.toLocaleDateString('en-US', { weekday: 'short' });

        const units = localStorage.getItem('weatherUnits') || 'metric';
        const tempSymbol = units === 'metric' ? '°' : '°';

        forecastHTML += `
            <div class="forecast-day">
                <div class="forecast-day-name">${dayName}</div>
                <div class="forecast-emoji">${weather.emoji}</div>
                <div class="forecast-temps">
                    <span class="temp-high">${tempMax}${tempSymbol}</span>
                    <span class="temp-low">${tempMin}${tempSymbol}</span>
                </div>
                <div class="forecast-precipitation">${precipitation}%</div>
            </div>
        `;
    }

    forecastHTML += '</div>';
    forecastContainer.innerHTML = forecastHTML;
    forecastContainer.style.display = 'block';
};

YearCountdown.prototype.displayForecastError = function () {
    let forecastContainer = document.getElementById('weather-forecast-container');
    if (!forecastContainer) {
        forecastContainer = document.createElement('div');
        forecastContainer.id = 'weather-forecast-container';
        forecastContainer.className = 'weather-forecast-container';

        const quoteWidget = document.getElementById('quote-widget');
        const weatherInfo = document.getElementById('weather-info');
        const quoteContent = document.querySelector('.quote-content');

        if (quoteWidget && weatherInfo && quoteContent) {
            quoteWidget.insertBefore(forecastContainer, quoteContent);
        }
    }

    forecastContainer.innerHTML = '<div class="forecast-error">Unable to load weather forecast</div>';
    forecastContainer.style.display = 'block';
};

YearCountdown.prototype.hideForecast = function () {
    const forecastContainer = document.getElementById('weather-forecast-container');
    if (forecastContainer) {
        forecastContainer.style.display = 'none';
    }
};

YearCountdown.prototype.displayWeatherError = function () {
    // Update the integrated weather display in quote widget with error state
    const tempDisplay = document.getElementById('temp-display');
    const weatherCondition = document.getElementById('weather-condition');
    const weatherLocationSmall = document.getElementById('weather-location-small');
    const feelsLikeTemp = document.getElementById('feels-like-temp');

    if (tempDisplay) tempDisplay.textContent = '--°';
    if (weatherCondition) weatherCondition.textContent = 'Unable to load weather';
    if (weatherLocationSmall) weatherLocationSmall.textContent = 'Location unavailable';
    if (feelsLikeTemp) feelsLikeTemp.textContent = '--°';
};

YearCountdown.prototype.startWeatherRefresh = function () {
    const autoRefresh = localStorage.getItem('autoRefreshWeather') === 'true';
    if (autoRefresh) {
        // Clear any existing weather refresh interval
        if (this.weatherRefreshInterval) {
            clearInterval(this.weatherRefreshInterval);
        }

        // Set up new refresh interval (30 minutes)
        this.weatherRefreshInterval = setInterval(() => {
            // Clear cache before refreshing to ensure fresh data
            localStorage.removeItem('weatherData');
            localStorage.removeItem('weatherCacheTime');
            this.loadWeather();
        }, 30 * 60 * 1000); // 30 minutes
    }
};

YearCountdown.prototype.clearWeatherCache = function () {
    localStorage.removeItem('weatherData');
    localStorage.removeItem('weatherCacheTime');
};

YearCountdown.prototype.refreshWeatherNow = function () {
    this.clearWeatherCache();
    this.loadWeather();
};

// Calendar Widget
YearCountdown.prototype.initCalendarWidget = function () {
    this.currentCalendarDate = new Date();
    this.bindCalendarEvents();
    this.generateCalendar();
};

YearCountdown.prototype.bindCalendarEvents = function () {
    document.getElementById('prev-month').addEventListener('click', () => {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
        this.generateCalendar();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
        this.generateCalendar();
    });
};

YearCountdown.prototype.generateCalendar = function () {
    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();
    const today = new Date();

    document.getElementById('current-month-year').textContent =
        new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const calendarGrid = document.getElementById('calendar-grid');
    calendarGrid.innerHTML = '';

    // Add day headers
    const dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    dayHeaders.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day header';
        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);
    });

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Add previous month's trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.textContent = daysInPrevMonth - i;
        calendarGrid.appendChild(dayElement);
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;

        const isToday = today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;

        if (isToday) {
            dayElement.classList.add('today');
        }

        calendarGrid.appendChild(dayElement);
    }

    // Fill remaining cells with next month's days
    const totalCells = calendarGrid.children.length;
    const remainingCells = 42 - totalCells; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);
    }
};

// Timezone Widget
YearCountdown.prototype.initTimezoneWidget = function () {
    this.loadTimeZones();
    this.bindTimezoneEvents();
    this.startTimezoneUpdates();
};

YearCountdown.prototype.bindTimezoneEvents = function () {
    const timezoneSettings = document.getElementById('timezone-settings');
    const addTimezoneBtn = document.getElementById('add-timezone-btn');
    const closeTimezoneBtn = document.getElementById('close-timezone-config-btn');

    if (timezoneSettings) {
        timezoneSettings.addEventListener('click', () => {
            this.showTimezoneConfig();
        });
    }

    if (addTimezoneBtn) {
        addTimezoneBtn.addEventListener('click', () => {
            this.addTimezone();
        });
    }

    if (closeTimezoneBtn) {
        closeTimezoneBtn.addEventListener('click', () => {
            this.hideModal('timezone-config-modal');
        });
    }
};

YearCountdown.prototype.loadTimeZones = function () {
    const savedTimezones = JSON.parse(localStorage.getItem('timezones') || '["UTC", "America/New_York", "Europe/London", "Asia/Tokyo"]');
    this.displayTimezones(savedTimezones);
};

YearCountdown.prototype.displayTimezones = function (timezones) {
    const container = document.getElementById('timezone-content');
    if (!container) return;

    container.innerHTML = '';

    timezones.forEach(timezone => {
        const timezoneElement = document.createElement('div');
        timezoneElement.className = 'timezone-item';

        const location = timezone.split('/')[1]?.replace('_', ' ') || timezone;
        const time = new Date().toLocaleTimeString('en-US', {
            timeZone: timezone,
            hour12: true,
            hour: '2-digit',
            minute: '2-digit'
        });

        timezoneElement.innerHTML = `
            <span class="timezone-location">${location}</span>
            <span class="timezone-time">${time}</span>
        `;

        container.appendChild(timezoneElement);
    });
};

YearCountdown.prototype.showTimezoneConfig = function () {
    this.showModal('timezone-config-modal');
    this.updateTimezoneConfig();
};

YearCountdown.prototype.updateTimezoneConfig = function () {
    const savedTimezones = JSON.parse(localStorage.getItem('timezones') || '["UTC"]');
    const container = document.getElementById('current-timezones');
    if (!container) return;

    container.innerHTML = '';

    savedTimezones.forEach(timezone => {
        const item = document.createElement('div');
        item.className = 'timezone-config-item';
        const location = timezone.split('/')[1]?.replace('_', ' ') || timezone;

        item.innerHTML = `
            <span class="timezone-config-name">${location}</span>
            <button class="timezone-config-remove" data-timezone="${timezone}">×</button>
        `;

        const removeBtn = item.querySelector('.timezone-config-remove');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.removeTimezone(timezone);
            });
        }

        container.appendChild(item);
    });
};

YearCountdown.prototype.addTimezone = function () {
    const selector = document.getElementById('timezone-selector');
    if (!selector) return;

    const timezone = selector.value;
    const savedTimezones = JSON.parse(localStorage.getItem('timezones') || '[]');

    if (!savedTimezones.includes(timezone)) {
        savedTimezones.push(timezone);
        localStorage.setItem('timezones', JSON.stringify(savedTimezones));
        this.displayTimezones(savedTimezones);
        this.updateTimezoneConfig();
    }
};

YearCountdown.prototype.removeTimezone = function (timezone) {
    const savedTimezones = JSON.parse(localStorage.getItem('timezones') || '[]');
    const filtered = savedTimezones.filter(tz => tz !== timezone);
    localStorage.setItem('timezones', JSON.stringify(filtered));
    this.displayTimezones(filtered);
    this.updateTimezoneConfig();
};

YearCountdown.prototype.startTimezoneUpdates = function () {
    setInterval(() => {
        const savedTimezones = JSON.parse(localStorage.getItem('timezones') || '[]');
        this.displayTimezones(savedTimezones);
    }, 60000); // Update every minute
};

// Usage Statistics Widget
YearCountdown.prototype.initStatsWidget = function () {
    // Enable usage analytics by default if not set
    if (localStorage.getItem('usageAnalytics') === null) {
        localStorage.setItem('usageAnalytics', 'true');
    }

    // Set default for count reloads (false = only count unique tabs)
    if (localStorage.getItem('countReloads') === null) {
        localStorage.setItem('countReloads', 'false');
    }

    this.loadStats();
    this.trackPageLoad();
    this.startSessionTracking();
    this.cleanupOldTabData();
};

YearCountdown.prototype.loadStats = function () {
    const stats = this.getStats();
    const tabsEl = document.getElementById('tabs-today');
    const linksEl = document.getElementById('links-clicked');
    const groupsEl = document.getElementById('groups-created');
    const timeEl = document.getElementById('total-time');

    if (tabsEl) tabsEl.textContent = stats.tabsToday;
    if (linksEl) linksEl.textContent = stats.linksClicked;
    if (groupsEl) groupsEl.textContent = stats.groupsCreated;
    if (timeEl) timeEl.textContent = this.formatTime(stats.totalTime, stats.totalSeconds);
};

YearCountdown.prototype.getStats = function () {
    const today = new Date().toDateString();
    const stats = JSON.parse(localStorage.getItem('usageStats') || '{}');

    return {
        tabsToday: stats[today]?.tabs || 0,
        linksClicked: stats.totalLinksClicked || 0,
        groupsCreated: stats.totalGroupsCreated || 0,
        totalTime: stats.totalTime || 0,
        totalSeconds: stats.totalSeconds || 0
    };
};

YearCountdown.prototype.trackPageLoad = function () {
    if (localStorage.getItem('usageAnalytics') === 'true') {
        const today = new Date().toDateString();
        const stats = JSON.parse(localStorage.getItem('usageStats') || '{}');
        const countReloads = localStorage.getItem('countReloads') === 'true';

        // Generate a unique session identifier for this tab
        if (!sessionStorage.getItem('tabSessionId')) {
            sessionStorage.setItem('tabSessionId', 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
            sessionStorage.setItem('isNewTab', 'true');
        } else {
            sessionStorage.setItem('isNewTab', 'false');
        }

        const tabSessionId = sessionStorage.getItem('tabSessionId');
        const isNewTab = sessionStorage.getItem('isNewTab') === 'true';

        // Initialize today's stats if not exists
        if (!stats[today]) stats[today] = { tabs: 0, uniqueTabIds: [] };
        if (!stats[today].uniqueTabIds) stats[today].uniqueTabIds = [];

        let shouldCount = false;

        if (countReloads) {
            // Count every page load (original behavior)
            shouldCount = true;
        } else {
            // Only count if this is a genuinely new tab (not seen in this session today)
            if (isNewTab && !stats[today].uniqueTabIds.includes(tabSessionId)) {
                shouldCount = true;
                stats[today].uniqueTabIds.push(tabSessionId);

                // Clean up old tab IDs (keep only last 500 to prevent storage bloat)
                if (stats[today].uniqueTabIds.length > 500) {
                    stats[today].uniqueTabIds = stats[today].uniqueTabIds.slice(-500);
                }
            }
        }

        if (shouldCount) {
            stats[today].tabs = (stats[today].tabs || 0) + 1;
            localStorage.setItem('usageStats', JSON.stringify(stats));
            this.loadStats();
        }

        // Always set isNewTab to false after first load to prevent counting reloads
        sessionStorage.setItem('isNewTab', 'false');
    }
};

YearCountdown.prototype.trackLinkClick = function () {
    if (localStorage.getItem('usageAnalytics') === 'true') {
        const stats = JSON.parse(localStorage.getItem('usageStats') || '{}');
        stats.totalLinksClicked = (stats.totalLinksClicked || 0) + 1;
        localStorage.setItem('usageStats', JSON.stringify(stats));
        this.loadStats();
    }
};

YearCountdown.prototype.trackGroupCreation = function () {
    if (localStorage.getItem('usageAnalytics') === 'true') {
        const stats = JSON.parse(localStorage.getItem('usageStats') || '{}');
        stats.totalGroupsCreated = (stats.totalGroupsCreated || 0) + 1;
        localStorage.setItem('usageStats', JSON.stringify(stats));
        this.loadStats();
    }
};

YearCountdown.prototype.cleanupOldTabData = function () {
    try {
        const stats = JSON.parse(localStorage.getItem('usageStats') || '{}');
        const today = new Date();
        const cutoffDate = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago

        let hasChanges = false;

        // Remove tracking data older than 7 days
        Object.keys(stats).forEach(dateStr => {
            if (dateStr !== 'totalLinksClicked' && dateStr !== 'totalGroupsCreated' &&
                dateStr !== 'totalTime' && dateStr !== 'totalSeconds') {
                const statDate = new Date(dateStr);
                if (statDate < cutoffDate) {
                    // Keep the tab count but remove the uniqueTabIds array to save space
                    if (stats[dateStr] && stats[dateStr].uniqueTabIds) {
                        delete stats[dateStr].uniqueTabIds;
                        hasChanges = true;
                    }
                }
            }
        });

        if (hasChanges) {
            localStorage.setItem('usageStats', JSON.stringify(stats));
        }
    } catch (error) {
    }
};

YearCountdown.prototype.formatTime = function (minutes, seconds = 0) {
    // If we have stored seconds, use them for more precise display
    const totalSeconds = seconds || (minutes * 60);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${mins}m`;
    } else if (mins > 0) {
        return `${mins}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
};

// Session time tracking
YearCountdown.prototype.startSessionTracking = function () {
    if (localStorage.getItem('usageAnalytics') === 'true') {
        this.sessionStartTime = Date.now();

        // Clear any existing session interval to prevent duplicates
        if (this.sessionInterval) {
            clearInterval(this.sessionInterval);
        }

        // Update session time every 10 seconds for more responsive tracking
        this.sessionInterval = setInterval(() => {
            this.updateSessionTime();
        }, 10000); // Update every 10 seconds

        // Track session end when page is closed/refreshed
        window.addEventListener('beforeunload', () => {
            this.updateSessionTime();
        });

        // Track when tab becomes visible again
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // Reset start time when tab becomes visible
                this.sessionStartTime = Date.now();
            } else {
                // Update time when tab becomes hidden
                this.updateSessionTime();
            }
        });
    }
};

YearCountdown.prototype.updateSessionTime = function () {
    if (localStorage.getItem('usageAnalytics') === 'true' && this.sessionStartTime) {
        const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000); // in seconds

        if (sessionDuration >= 10) { // Only update if at least 10 seconds have passed
            const stats = JSON.parse(localStorage.getItem('usageStats') || '{}');
            const sessionMinutes = Math.floor(sessionDuration / 60); // Convert to minutes for storage

            stats.totalTime = (stats.totalTime || 0) + sessionMinutes;

            // Also track seconds for more precise display
            if (!stats.totalSeconds) stats.totalSeconds = 0;
            stats.totalSeconds = (stats.totalSeconds || 0) + sessionDuration;

            localStorage.setItem('usageStats', JSON.stringify(stats));
            this.loadStats();
            this.sessionStartTime = Date.now(); // Reset start time
        }
    }
};

// Modal Helper Methods
YearCountdown.prototype.showModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
};

YearCountdown.prototype.hideModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
};

// Settings and widget management
YearCountdown.prototype.initEnhancedSettings = function () {
    this.initSettingsTabs();
    this.initThemeSystem();
    this.initFontSystem();
    this.bindEnhancedSettingsEvents();
};

YearCountdown.prototype.initSettingsTabs = function () {
    const tabs = document.querySelectorAll('.settings-tab');
    const panels = document.querySelectorAll('.settings-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const targetPanel = document.getElementById(tab.dataset.tab + '-panel');
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
};

YearCountdown.prototype.initThemeSystem = function () {
    const themeSelector = document.getElementById('theme-selector');
    const savedTheme = localStorage.getItem('selectedTheme') || 'dark';
    if (themeSelector) {
        themeSelector.value = savedTheme;
        this.applyTheme(savedTheme);

        themeSelector.addEventListener('change', (e) => {
            const theme = e.target.value;
            this.applyTheme(theme);
            localStorage.setItem('selectedTheme', theme);
        });
    }
};

YearCountdown.prototype.applyTheme = function (theme) {
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    if (theme !== 'default') {
        document.body.classList.add(`theme-${theme}`);
    }
};

YearCountdown.prototype.initFontSystem = function () {
    const fontSelector = document.getElementById('font-selector');
    const savedFont = localStorage.getItem('selectedFont') || 'fira-code';
    if (fontSelector) {
        fontSelector.value = savedFont;
        this.applyFont(savedFont);

        fontSelector.addEventListener('change', (e) => {
            const font = e.target.value;
            this.applyFont(font);
            localStorage.setItem('selectedFont', font);
        });
    }
};

YearCountdown.prototype.applyFont = function (font) {
    document.body.className = document.body.className.replace(/font-\w+/g, '');
    if (font !== 'system') {
        document.body.classList.add(`font-${font.replace('-', '-')}`);
    }
    this.loadFontFamily(font);
};

YearCountdown.prototype.loadFontFamily = function (font) {
    const fontMap = {
        'inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
        'roboto': 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
        'open-sans': 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap',
        'poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
        'fira-code': 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600&display=swap',
        'playfair': 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap'
    };

    if (fontMap[font]) {
        let linkElement = document.getElementById('google-font');
        if (!linkElement) {
            linkElement = document.createElement('link');
            linkElement.id = 'google-font';
            linkElement.rel = 'stylesheet';
            document.head.appendChild(linkElement);
        }
        linkElement.href = fontMap[font];
    }
};

YearCountdown.prototype.bindEnhancedSettingsEvents = function () {
    // Widget visibility toggles
    const widgetToggles = [
        'quote-widget-visibility',
        'weather-widget-visibility',
        'calendar-widget-visibility',
        'timezone-widget-visibility',
        'stats-widget-visibility'
    ];

    widgetToggles.forEach(toggleId => {
        const element = document.getElementById(toggleId);
        if (element) {
            const widgetId = toggleId.replace('-visibility', '');
            element.addEventListener('change', (e) => {
                this.toggleWidget(widgetId, e.target.checked);
            });
        }
    });

    // Other settings
    const settingsToggles = {
        'usage-analytics': 'usageAnalytics',
        'count-reloads': 'countReloads',
        'sticky-note-enabled': 'stickyNoteEnabled',
        'auto-refresh-weather': 'autoRefreshWeather'
    };

    Object.entries(settingsToggles).forEach(([elementId, storageKey]) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('change', (e) => {
                localStorage.setItem(storageKey, e.target.checked);

                // Special handling for sticky note setting
                if (elementId === 'sticky-note-enabled') {
                    this.updateStickyNoteSettings(e.target.checked);
                }
            });
        }
    });

    // Select settings
    const selectSettings = {
        'weather-units': 'weatherUnits',
        'default-timezone': 'defaultTimezone'
    };

    Object.entries(selectSettings).forEach(([elementId, storageKey]) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('change', (e) => {
                localStorage.setItem(storageKey, e.target.value);
                if (elementId === 'weather-units') {
                    // Clear cached weather data when units change
                    localStorage.removeItem('weatherData');
                    localStorage.removeItem('weatherCacheTime');
                    this.loadWeather(); // Refresh weather display with new units
                }
            });
        }
    });

    // Export settings button
    const exportBtn = document.getElementById('export-settings-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            this.exportSettings();
        });
    }
};

YearCountdown.prototype.toggleWidget = function (widgetId, visible) {
    localStorage.setItem(`${widgetId}-visible`, visible);

    // Handle quote and weather widgets independently but in the same container
    if (widgetId === 'quote-widget' || widgetId === 'weather-widget') {
        const quoteWidget = document.getElementById('quote-widget');
        const quoteContent = document.querySelector('.quote-content');
        const weatherInfo = document.getElementById('weather-info');

        const quoteEnabled = localStorage.getItem('quote-widget-visible') !== 'false';
        const weatherEnabled = localStorage.getItem('weather-widget-visible') !== 'false';

        // Show the container if either quote or weather is enabled
        if (quoteWidget) {
            quoteWidget.style.display = (quoteEnabled || weatherEnabled) ? 'block' : 'none';

            // Add/remove weather-only class for styling
            if (weatherEnabled && !quoteEnabled) {
                quoteWidget.classList.add('weather-only');
                // Load forecast when entering weather-only mode
                this.loadWeatherForecast({ lat: null, lon: null });
            } else {
                quoteWidget.classList.remove('weather-only');
                // Hide forecast when exiting weather-only mode
                this.hideForecast();
            }
        }

        // Show/hide individual components
        if (quoteContent) {
            quoteContent.style.display = quoteEnabled ? 'block' : 'none';
        }
        if (weatherInfo) {
            weatherInfo.style.display = weatherEnabled ? 'block' : 'none';
        }
    } else {
        // Handle other widgets normally
        const widget = document.getElementById(widgetId);
        if (widget) {
            widget.style.display = visible ? 'block' : 'none';
        }
    }
};

YearCountdown.prototype.loadWidgetSettings = function () {
    // Load widget visibility settings - now including weather separately
    const widgets = ['quote-widget', 'weather-widget', 'calendar-widget', 'timezone-widget', 'stats-widget'];

    widgets.forEach(widgetId => {
        const visible = localStorage.getItem(`${widgetId}-visible`) !== 'false';
        const checkbox = document.getElementById(`${widgetId}-visibility`);

        if (checkbox) checkbox.checked = visible;
    });

    // Handle the quote container visibility based on both quote and weather settings
    const quoteWidget = document.getElementById('quote-widget');
    const quoteContent = document.querySelector('.quote-content');
    const weatherInfo = document.getElementById('weather-info');

    const quoteEnabled = localStorage.getItem('quote-widget-visible') !== 'false';
    const weatherEnabled = localStorage.getItem('weather-widget-visible') !== 'false';

    // Show the container if either quote or weather is enabled
    if (quoteWidget) {
        quoteWidget.style.display = (quoteEnabled || weatherEnabled) ? 'block' : 'none';

        // Add/remove weather-only class for styling
        if (weatherEnabled && !quoteEnabled) {
            quoteWidget.classList.add('weather-only');
            // Load forecast when in weather-only mode
            setTimeout(() => {
                this.loadWeatherForecast({ lat: null, lon: null });
            }, 1000); // Small delay to ensure weather data is loaded first
        } else {
            quoteWidget.classList.remove('weather-only');
            // Hide forecast when not in weather-only mode
            this.hideForecast();
        }
    }

    // Show/hide individual components
    if (quoteContent) {
        quoteContent.style.display = quoteEnabled ? 'block' : 'none';
    }
    if (weatherInfo) {
        weatherInfo.style.display = weatherEnabled ? 'block' : 'none';
    }

    // Handle other widgets normally
    ['calendar-widget', 'timezone-widget', 'stats-widget'].forEach(widgetId => {
        const visible = localStorage.getItem(`${widgetId}-visible`) !== 'false';
        const widget = document.getElementById(widgetId);
        if (widget) widget.style.display = visible ? 'block' : 'none';
    });    // Load other settings
    const settingsMap = {
        'usage-analytics': 'usageAnalytics',
        'count-reloads': 'countReloads',
        'sticky-note-enabled': 'stickyNoteEnabled',
        'auto-refresh-weather': 'autoRefreshWeather'
    };

    Object.entries(settingsMap).forEach(([elementId, storageKey]) => {
        const element = document.getElementById(elementId);
        let value = localStorage.getItem(storageKey) === 'true';

        // Enable usage analytics by default if not set
        if (storageKey === 'usageAnalytics' && localStorage.getItem(storageKey) === null) {
            value = true;
            localStorage.setItem(storageKey, 'true');
        }

        // Set default for count reloads (false = only count unique tabs)
        if (storageKey === 'countReloads' && localStorage.getItem(storageKey) === null) {
            value = false;
            localStorage.setItem(storageKey, 'false');
        }

        // Enable sticky notes by default if not set
        if (storageKey === 'stickyNoteEnabled' && localStorage.getItem(storageKey) === null) {
            value = true;
            localStorage.setItem(storageKey, 'true');
        }

        if (element) element.checked = value;
    });

    // Load select settings
    const selectSettings = {
        'weather-units': 'weatherUnits',
        'default-timezone': 'defaultTimezone'
    };

    Object.entries(selectSettings).forEach(([elementId, storageKey]) => {
        const element = document.getElementById(elementId);
        const value = localStorage.getItem(storageKey);
        if (element && value) element.value = value;
    });
};

YearCountdown.prototype.exportSettings = function () {
    const settings = {
        theme: localStorage.getItem('selectedTheme'),
        font: localStorage.getItem('selectedFont'),
        widgets: {},
        preferences: {}
    };

    // Export widget settings
    const widgets = ['quote-widget', 'weather-widget', 'calendar-widget', 'timezone-widget', 'stats-widget'];
    widgets.forEach(widget => {
        settings.widgets[widget] = localStorage.getItem(`${widget}-visible`) !== 'false';
    });

    // Export other preferences
    const preferences = ['animatedBackground', 'usageAnalytics', 'countReloads', 'stickyNoteEnabled', 'autoRefreshWeather', 'weatherUnits', 'defaultTimezone'];
    preferences.forEach(pref => {
        settings.preferences[pref] = localStorage.getItem(pref);
    });

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'year-countdown-settings.json';
    a.click();
    URL.revokeObjectURL(url);
};

// Drag and Drop functionality for widgets
YearCountdown.prototype.initDragAndDrop = function () {
    const widgetsContainer = document.getElementById('widgets-container');
    let draggedElement = null;
    let draggedOrder = [];

    // Load saved widget order
    const savedOrder = localStorage.getItem('widget-order');
    if (savedOrder) {
        draggedOrder = JSON.parse(savedOrder);
        this.reorderWidgets(draggedOrder);
    }

    // Add drag event listeners to all widgets
    const widgets = document.querySelectorAll('.widget');
    widgets.forEach(widget => {
        widget.draggable = true;

        widget.addEventListener('dragstart', (e) => {
            draggedElement = widget;
            widget.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', widget.outerHTML);
        });

        widget.addEventListener('dragend', () => {
            widget.classList.remove('dragging');
            draggedElement = null;
        });

        widget.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            if (draggedElement && draggedElement !== widget) {
                widget.classList.add('drag-over');
            }
        });

        widget.addEventListener('dragleave', () => {
            widget.classList.remove('drag-over');
        });

        widget.addEventListener('drop', (e) => {
            e.preventDefault();
            widget.classList.remove('drag-over');

            if (draggedElement && draggedElement !== widget) {
                const container = widget.parentNode;
                const afterElement = this.getDragAfterElement(container, e.clientY);

                if (afterElement == null) {
                    container.appendChild(draggedElement);
                } else {
                    container.insertBefore(draggedElement, afterElement);
                }

                this.saveWidgetOrder();
            }
        });
    });

    // Container drag events
    widgetsContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });

    widgetsContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedElement) {
            const afterElement = this.getDragAfterElement(widgetsContainer, e.clientY);
            if (afterElement == null) {
                widgetsContainer.appendChild(draggedElement);
            } else {
                widgetsContainer.insertBefore(draggedElement, afterElement);
            }
            this.saveWidgetOrder();
        }
    });
};

YearCountdown.prototype.getDragAfterElement = function (container, y) {
    const draggableElements = [...container.querySelectorAll('.widget:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
};

YearCountdown.prototype.saveWidgetOrder = function () {
    const container = document.getElementById('widgets-container');
    const widgets = container.querySelectorAll('.widget');
    const order = Array.from(widgets).map(widget => widget.id);
    localStorage.setItem('widget-order', JSON.stringify(order));
};

YearCountdown.prototype.reorderWidgets = function (order) {
    const container = document.getElementById('widgets-container');

    order.forEach(widgetId => {
        const widget = document.getElementById(widgetId);
        if (widget && widget.parentNode === container) {
            container.appendChild(widget);
        }
    });
};

// Update widget management to handle dynamic layout
YearCountdown.prototype.updateWidgetLayout = function () {
    const container = document.getElementById('widgets-container');
    const visibleWidgets = container.querySelectorAll('.widget[style*="block"], .widget:not([style*="none"])');

    // Update container classes based on number of visible widgets
    container.classList.remove('has-1', 'has-2', 'has-3', 'has-4', 'has-5');
    container.classList.add(`has-${visibleWidgets.length}`);

    // Re-enable drag and drop for visible widgets
    this.initDragAndDrop();
};

// Update sticky note settings across all content scripts
YearCountdown.prototype.updateStickyNoteSettings = function (enabled) {
    // Send message to all tabs to update sticky note setting
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'setStickyNoteEnabled',
                enabled: enabled
            }).catch(() => {
                // Silently ignore errors for tabs that don't have content scripts
            });
        });
    });
};

// Override the toggle widget visibility to update layout
const originalToggleWidget = YearCountdown.prototype.toggleWidgetVisibility;
YearCountdown.prototype.toggleWidgetVisibility = function (widgetId, visible) {
    originalToggleWidget.call(this, widgetId, visible);
    setTimeout(() => this.updateWidgetLayout(), 100);
};

// Update sticky note settings across all content scripts
YearCountdown.prototype.updateStickyNoteSettings = function (enabled) {
    // Send message to all tabs to update sticky note setting
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'setStickyNoteEnabled',
                enabled: enabled
            }).catch(() => {
                // Silently ignore errors for tabs that don't have content scripts
            });
        });
    });
};

// Initialize new features
YearCountdown.prototype.initializeAllFeatures = function () {
    this.initWidgets();
    this.initEnhancedSettings();
    this.initDragAndDrop();
    this.updateWidgetLayout();

    // Initialize sticky note settings on all tabs
    setTimeout(() => {
        const stickyNoteEnabled = localStorage.getItem('stickyNoteEnabled') !== 'false';
        this.updateStickyNoteSettings(stickyNoteEnabled);
    }, 1000); // Delay to ensure tabs are ready
};
