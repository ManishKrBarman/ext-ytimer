// Sticky notes for any webpage
class StickyNoteManager {
    constructor() {

        // Skip extension pages and chrome:// URLs
        if (window.location.protocol === 'chrome-extension:' ||
            window.location.protocol === 'chrome:' ||
            window.location.protocol === 'moz-extension:') {
            return;
        }

        // Check what browser we're using - Brave gets the full experience
        this.isBrave = this.detectBrave();
        this.isChrome = this.detectChrome();

        // Check if sticky notes are enabled
        chrome.storage.local.get(['stickyNoteEnabled'], (result) => {
            const isEnabled = result.stickyNoteEnabled !== false; // Default to true

            if (!isEnabled) {
                return;
            }

            // Use different interfaces for different browsers
            if (!this.isBrave) {
                this.createChromeCompatibleNote();
                return;
            } else {
                this.initBraveFeatures();
            }
        });
    }

    initBraveFeatures() {
        this.stickyNote = null;
        this.toggleButton = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.isResizing = false;
        this.currentTheme = 'default';
        this.minimized = false;
        this.enabled = true;
        this.visible = false;
        this.content = '';
        this.position = { x: window.innerWidth - 460, y: 100 };
        this.size = { width: 420, height: 320 };
        this.formatting = {
            bold: false,
            italic: false,
            fontSize: 13
        };
        this.lastSaved = new Date();

        // Mouse inactivity tracking for auto-fade
        this.mouseInactivityTimer = null;
        this.isMouseInactive = false;
        this.inactivityDelay = 3000; // 3 seconds of inactivity

        this.loadSettings();
        this.createToggleButton();
        this.loadStickyNoteState();
        this.setupMessageListener();
        this.setupMouseInactivityDetection();
    }

    detectBrave() {
        // Look for Brave-specific features
        return (navigator.brave && typeof navigator.brave.isBrave === 'function') ||
            window.navigator.userAgent.toLowerCase().includes('brave');
    }

    detectChrome() {
        // Chrome detection (but not Brave)
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isChrome = userAgent.includes('chrome') && window.chrome && window.chrome.runtime;
        const isBrave = userAgent.includes('brave') || (navigator.brave && typeof navigator.brave.isBrave === 'function');

        return isChrome && !isBrave;
    }

    createChromeCompatibleNote() {

        // Chrome gets a simpler interface with auto-fade
        this.mouseInactivityTimer = null;
        this.isMouseInactive = false;
        this.inactivityDelay = 3000; // 3 seconds of inactivity

        // Simple toggle button for Chrome
        const toggleButton = document.createElement('div');
        toggleButton.id = 'chrome-note-toggle';
        this.chromeToggleButton = toggleButton; // Store reference for auto-fade
        toggleButton.style.cssText = `
            position: fixed !important;
            bottom: 24px !important;
            right: 24px !important;
            width: 56px !important;
            height: 56px !important;
            background: #1e293b !important;
            border: 2px solid rgba(255, 255, 255, 0.2) !important;
            border-radius: 12px !important;
            cursor: pointer !important;
            z-index: 2147483646 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 20px !important;
            color: #ffffff !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
            transition: all 0.3s ease !important;
            user-select: none !important;
        `;
        toggleButton.innerHTML = '📝';
        toggleButton.title = 'Open Simple Notes (Chrome Compatible)';

        toggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openChromeNoteDialog();
        });

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(toggleButton);
                this.setupChromeMouseInactivity();
            });
        } else {
            document.body.appendChild(toggleButton);
            this.setupChromeMouseInactivity();
        }
    }

    openChromeNoteDialog() {

        try {
            // Remove existing dialog if any
            const existing = document.getElementById('chrome-note-dialog');
            if (existing) {
                existing.remove();
                return;
            }

            // Create overlay
            const overlay = document.createElement('div');
            overlay.id = 'chrome-note-overlay';
            overlay.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: rgba(0, 0, 0, 0.5) !important;
                z-index: 2147483646 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            `;

            // Create simple modal dialog for Chrome
            const dialog = document.createElement('div');
            dialog.id = 'chrome-note-dialog';
            dialog.style.cssText = `
                width: 500px !important;
                height: 450px !important;
                background: white !important;
                border: 1px solid #ccc !important;
                border-radius: 12px !important;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
                display: flex !important;
                flex-direction: column !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                max-width: 90vw !important;
                max-height: 90vh !important;
            `;

            dialog.innerHTML = `
                <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 12px 16px; border-bottom: 1px solid #ddd; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; color: #ffffff; display: flex; align-items: center; gap: 8px;">
                        📝 Advanced Notes (Chrome)
                    </span>
                    <button id="close-chrome-note" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; width: 28px; height: 28px; font-size: 14px; cursor: pointer; color: #ffffff; display: flex; align-items: center; justify-content: center;">✕</button>
                </div>
                
                <div style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 8px 12px; display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
                    <button id="chrome-bold" style="background: #ffffff; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; font-size: 11px; font-weight: 600; cursor: pointer; color: #374151;" title="Bold">B</button>
                    <button id="chrome-italic" style="background: #ffffff; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; font-size: 11px; font-style: italic; cursor: pointer; color: #374151;" title="Italic">I</button>
                    <button id="chrome-code" style="background: #ffffff; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; font-size: 11px; font-family: monospace; cursor: pointer; color: #374151;" title="Code">&lt;/&gt;</button>
                    <button id="chrome-bullet" style="background: #ffffff; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; font-size: 11px; cursor: pointer; color: #374151;" title="Bullet List">• List</button>
                    <button id="chrome-number" style="background: #ffffff; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; font-size: 11px; cursor: pointer; color: #374151;" title="Numbered List">1. List</button>
                    
                    <div style="width: 1px; height: 20px; background: #d1d5db; margin: 0 4px;"></div>
                    
                    <select id="chrome-template" style="background: #ffffff; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; font-size: 11px; cursor: pointer; color: #374151;">
                        <option value="">📋 Templates</option>
                        <option value="meeting">📅 Meeting Notes</option>
                        <option value="todo">✅ To-Do List</option>
                        <option value="study">📚 Study Notes</option>
                        <option value="code">💻 Code Snippet</option>
                        <option value="ideas">💡 Ideas & Brainstorm</option>
                        <option value="research">🔍 Research Notes</option>
                        <option value="project">📊 Project Planning</option>
                        <option value="daily">📝 Daily Journal</option>
                    </select>
                    
                    <div style="width: 1px; height: 20px; background: #d1d5db; margin: 0 4px;"></div>
                    
                    <button id="chrome-export" style="background: #3b82f6; border: 1px solid #3b82f6; border-radius: 4px; padding: 4px 8px; font-size: 11px; cursor: pointer; color: #ffffff;" title="Export Notes">📤 Export</button>
                    <button id="chrome-clear" style="background: #ef4444; border: 1px solid #ef4444; border-radius: 4px; padding: 4px 8px; font-size: 11px; cursor: pointer; color: #ffffff;" title="Clear All">🗑️ Clear</button>
                </div>
                
                <textarea id="chrome-note-content" placeholder="Start typing your notes here...

💡 Pro Tips:
• Use the toolbar above for formatting
• Select templates for quick starts
• Notes auto-save as you type
• Use Ctrl+B for bold, Ctrl+I for italic" style="
                    flex: 1;
                    border: none;
                    padding: 16px;
                    font-family: 'JetBrains Mono', 'Fira Code', Monaco, Consolas, monospace;
                    font-size: 14px;
                    line-height: 1.6;
                    resize: none;
                    outline: none;
                    color: #1e293b;
                    background: #ffffff;
                "></textarea>
                
                <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 8px 16px; font-size: 12px; color: #64748b; display: flex; justify-content: space-between; align-items: center; border-radius: 0 0 12px 12px;">
                    <div style="display: flex; gap: 16px;">
                        <span id="chrome-word-count">0 words</span>
                        <span id="chrome-char-count">0 characters</span>
                        <span id="chrome-line-count">1 lines</span>
                    </div>
                    <span style="color: #10b981; display: flex; align-items: center; gap: 4px;">
                        <span style="width: 6px; height: 6px; background: #10b981; border-radius: 50%;"></span>
                        Auto-saved
                    </span>
                </div>
            `;

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            // Add hover listeners for auto-fade functionality
            if (this.addChromeHoverListeners) {
                this.addChromeHoverListeners(overlay);
            }


            // Debug the template select element after DOM insertion
            setTimeout(() => {
                const templateSelect = document.getElementById('chrome-template');
                if (templateSelect) {
                } else {
                    console.error('Template select not found in DOM!');
                }
            }, 100);

            // Get textarea reference for use in event handlers
            const textarea = document.getElementById('chrome-note-content');

            // Load saved content
            chrome.storage.local.get(['chromeNoteContent'], (result) => {
                if (textarea && result.chromeNoteContent) {
                    textarea.value = result.chromeNoteContent;
                    this.updateChromeWordCount();
                }
            });

            // Event listeners with better error handling
            const closeBtn = document.getElementById('close-chrome-note');
            const boldBtn = document.getElementById('chrome-bold');
            const italicBtn = document.getElementById('chrome-italic');
            const codeBtn = document.getElementById('chrome-code');
            const bulletBtn = document.getElementById('chrome-bullet');
            const numberBtn = document.getElementById('chrome-number');
            const templateSelect = document.getElementById('chrome-template');
            const exportBtn = document.getElementById('chrome-export');
            const clearBtn = document.getElementById('chrome-clear');

            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    overlay.remove();
                });
            }

            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                }
            });

            // Formatting buttons with debugging
            if (boldBtn) {
                boldBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Visual feedback
                    boldBtn.style.background = '#10b981';
                    setTimeout(() => { boldBtn.style.background = '#ffffff'; }, 200);

                    if (textarea) {
                        this.insertChromeFormatting(textarea, '**', '**', 'Bold text');
                    } else {
                        console.error('Textarea not found for bold formatting');
                    }
                });
            }

            if (italicBtn) {
                italicBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Visual feedback
                    italicBtn.style.background = '#10b981';
                    setTimeout(() => { italicBtn.style.background = '#ffffff'; }, 200);

                    if (textarea) {
                        this.insertChromeFormatting(textarea, '_', '_', 'Italic text');
                    } else {
                        console.error('Textarea not found for italic formatting');
                    }
                });
            }

            if (codeBtn) {
                codeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Visual feedback
                    codeBtn.style.background = '#10b981';
                    setTimeout(() => { codeBtn.style.background = '#ffffff'; }, 200);

                    if (textarea) {
                        this.insertChromeFormatting(textarea, '`', '`', 'code');
                    } else {
                        console.error('Textarea not found for code formatting');
                    }
                });
            }

            if (bulletBtn) {
                bulletBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Visual feedback
                    bulletBtn.style.background = '#10b981';
                    setTimeout(() => { bulletBtn.style.background = '#ffffff'; }, 200);

                    if (textarea) {
                        this.insertChromeList(textarea, '• ');
                    } else {
                        console.error('Textarea not found for bullet list');
                    }
                });
            }

            if (numberBtn) {
                numberBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Visual feedback
                    numberBtn.style.background = '#10b981';
                    setTimeout(() => { numberBtn.style.background = '#ffffff'; }, 200);

                    if (textarea) {
                        this.insertChromeList(textarea, '1. ');
                    } else {
                        console.error('Textarea not found for numbered list');
                    }
                });
            }

            // Template selector with debugging
            if (templateSelect) {
                templateSelect.addEventListener('change', (e) => {
                    if (e.target.value && textarea) {
                        this.insertChromeTemplate(textarea, e.target.value);
                        e.target.value = ''; // Reset selector
                    } else if (!textarea) {
                        console.error('Textarea not found for template insertion');
                    }
                });
            }

            // Export button
            if (exportBtn) {
                exportBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (textarea) {
                        this.exportChromeNotes(textarea);
                    } else {
                        console.error('Textarea not found for export');
                    }
                });
            }

            // Clear button
            if (clearBtn) {
                clearBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (confirm('Are you sure you want to clear all notes?')) {
                        if (textarea) {
                            textarea.value = '';
                            this.saveChromeNoteContent();
                            this.updateChromeWordCount();
                        } else {
                            console.error('Textarea not found for clear');
                        }
                    }
                });
            }

            // Keyboard shortcuts - with better event handling for Chrome
            textarea.addEventListener('keydown', (e) => {
                // Only handle shortcuts when textarea is focused and prevent browser conflicts
                if (document.activeElement === textarea && (e.ctrlKey || e.metaKey)) {
                    switch (e.key.toLowerCase()) {
                        case 'b':
                            e.preventDefault();
                            e.stopPropagation();
                            this.insertChromeFormatting(textarea, '**', '**', 'Bold text');
                            break;
                        case 'i':
                            e.preventDefault();
                            e.stopPropagation();
                            this.insertChromeFormatting(textarea, '_', '_', 'Italic text');
                            break;
                        case 'e':
                            e.preventDefault();
                            e.stopPropagation();
                            e.stopImmediatePropagation();
                            this.insertChromeFormatting(textarea, '`', '`', 'code');
                            break;
                        case 'enter':
                            e.preventDefault();
                            e.stopPropagation();
                            this.insertChromeList(textarea, '• ');
                            break;
                        case 't':
                            e.preventDefault();
                            e.stopPropagation();
                            this.insertChromeTemplate(textarea, 'meeting');
                            break;
                        case 'm':
                            e.preventDefault();
                            e.stopPropagation();
                            const templateSelect = document.getElementById('chrome-template');
                            if (templateSelect) {
                                templateSelect.style.backgroundColor = '#ff0000';
                                templateSelect.style.border = '3px solid #00ff00';
                                templateSelect.style.fontSize = '16px';
                                templateSelect.style.padding = '10px';
                                templateSelect.focus();
                            }
                            break;
                    }
                }
            });

            // Additional event listener to capture events before they bubble
            textarea.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    return false;
                }
            }, true); // Use capture phase

            // Auto-save and word count update on textarea input
            textarea.addEventListener('input', () => {
                this.saveChromeNoteContent();
                this.updateChromeWordCount();
            });

            // Focus textarea
            setTimeout(() => {
                textarea.focus();
            }, 100);

        } catch (error) {
            console.error('Error in openChromeNoteDialog:', error);
        }
    }

    saveChromeNoteContent() {
        const textarea = document.getElementById('chrome-note-content');
        if (textarea) {
            chrome.storage.local.set({
                chromeNoteContent: textarea.value
            });
        }
    }

    updateChromeWordCount() {
        const textarea = document.getElementById('chrome-note-content');
        const wordCounter = document.getElementById('chrome-word-count');
        const charCounter = document.getElementById('chrome-char-count');
        const lineCounter = document.getElementById('chrome-line-count');

        if (textarea && wordCounter && charCounter && lineCounter) {
            const text = textarea.value;
            const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
            const chars = text.length;
            const lines = text.split('\n').length;

            wordCounter.textContent = `${words} words`;
            charCounter.textContent = `${chars} characters`;
            lineCounter.textContent = `${lines} lines`;
        }
    }

    insertChromeFormatting(textarea, startSymbol, endSymbol, placeholder) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        const textToInsert = selectedText || placeholder;
        const formattedText = startSymbol + textToInsert + endSymbol;

        textarea.setRangeText(formattedText, start, end, 'end');
        textarea.focus();

        // If no text was selected, select the placeholder
        if (!selectedText) {
            textarea.setSelectionRange(start + startSymbol.length, start + startSymbol.length + placeholder.length);
        }

        this.saveChromeNoteContent();
        this.updateChromeWordCount();
    }

    insertChromeList(textarea, prefix) {
        const start = textarea.selectionStart;
        const text = textarea.value;

        // Find the start of the current line
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        const currentLine = text.substring(lineStart, start);

        // If we're at the beginning of a line or the line is empty, add the prefix
        if (currentLine.trim() === '') {
            textarea.setRangeText(prefix, start, start, 'end');
            textarea.focus();
        } else {
            // Add a new line with the prefix
            textarea.setRangeText('\n' + prefix, start, start, 'end');
            textarea.focus();
        }

        this.saveChromeNoteContent();
        this.updateChromeWordCount();
    }

    insertChromeTemplate(textarea, templateType) {
        const templates = {
            meeting: `# Meeting Notes - ${new Date().toLocaleDateString()}

## Attendees:
• 

## Agenda:
1. 
2. 
3. 

## Discussion:


## Action Items:
• [ ] 
• [ ] 
• [ ] 

## Next Steps:


---`,

            todo: `# To-Do List - ${new Date().toLocaleDateString()}

## High Priority
• [ ] 
• [ ] 
• [ ] 

## Medium Priority
• [ ] 
• [ ] 

## Low Priority
• [ ] 
• [ ] 

## Completed ✅
• [x] Example completed task

---`,

            study: `# Study Notes - ${new Date().toLocaleDateString()}

## Subject: 

## Key Concepts:
1. **Concept 1**: 
2. **Concept 2**: 
3. **Concept 3**: 

## Important Formulas/Rules:
\`\`\`
Formula 1: 
Formula 2: 
\`\`\`

## Examples:


## Questions to Review:
• 
• 
• 

## Summary:


---`,

            code: `# Code Snippet - ${new Date().toLocaleDateString()}

## Description:


## Language: 

\`\`\`javascript
// Your code here
function example() {
    return "Hello World!";
}
\`\`\`

## Notes:
• 
• 
• 

## References:
• 

---`,

            ideas: `# Ideas & Brainstorm - ${new Date().toLocaleDateString()}

## 💡 Main Idea:


## 🎯 Goals:
• 
• 
• 

## 🔍 Research Points:
• 
• 
• 

## 📝 Random Thoughts:


## 🚀 Action Steps:
1. 
2. 
3. 

## 📚 Resources:
• 
• 

---`,

            research: `# Research Notes - ${new Date().toLocaleDateString()}

## 📋 Topic: 

## 🎯 Research Question:


## 📚 Sources:
1. **Source 1**: 
   - Key Points: 
   - Link: 

2. **Source 2**: 
   - Key Points: 
   - Link: 

## 📊 Key Findings:
• 
• 
• 

## 💭 Analysis:


## 🔗 Related Topics:
• 
• 

## 📝 Conclusions:


---`,

            project: `# Project Planning - ${new Date().toLocaleDateString()}

## 🎯 Project Name: 

## 📋 Description:


## 🎯 Objectives:
• 
• 
• 

## 📅 Timeline:
- **Phase 1** (Date): 
- **Phase 2** (Date): 
- **Phase 3** (Date): 

## 📊 Resources Needed:
• 
• 
• 

## 👥 Team Members:
• 
• 

## ⚠️ Risks & Challenges:
• 
• 

## 📈 Success Metrics:
• 
• 

---`,

            daily: `# Daily Journal - ${new Date().toLocaleDateString()}

## 🌅 Morning Thoughts:


## 📋 Today's Goals:
• [ ] 
• [ ] 
• [ ] 

## 📝 What Happened:


## 💪 Achievements:
• 
• 

## 🤔 Challenges:
• 
• 

## 📚 What I Learned:


## 🙏 Grateful For:
• 
• 
• 

## 🌙 Evening Reflection:


---`
        };

        const template = templates[templateType];
        if (template) {
            const start = textarea.selectionStart;
            textarea.setRangeText(template, start, start, 'end');
            textarea.focus();

            this.saveChromeNoteContent();
            this.updateChromeWordCount();
        }
    }

    exportChromeNotes(textarea) {
        const content = textarea.value;
        if (!content.trim()) {
            alert('No content to export!');
            return;
        }

        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `chrome-notes-${timestamp}.txt`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show success message
        const exportBtn = document.getElementById('chrome-export');
        const originalText = exportBtn.innerHTML;
        exportBtn.innerHTML = '✅ Exported!';
        exportBtn.style.background = '#10b981';

        setTimeout(() => {
            exportBtn.innerHTML = originalText;
            exportBtn.style.background = '#3b82f6';
        }, 2000);
    }

    loadSettings() {
        chrome.storage.local.get([
            'stickyNoteEnabled',
            'stickyNoteVisible',
            'stickyNoteContent',
            'stickyNotePosition',
            'stickyNoteSize',
            'stickyNoteTheme',
            'stickyNoteMinimized',
            'stickyNoteFormatting'
        ], (result) => {
            this.enabled = result.stickyNoteEnabled !== false; // Default to true
            this.visible = result.stickyNoteVisible || false;
            this.content = result.stickyNoteContent || '';
            this.position = result.stickyNotePosition || this.position;
            this.size = result.stickyNoteSize || this.size;
            this.currentTheme = result.stickyNoteTheme || 'default';
            this.minimized = result.stickyNoteMinimized || false;
            this.formatting = result.stickyNoteFormatting || this.formatting;

            // Show toggle button if enabled
            if (this.toggleButton) {
                this.toggleButton.style.display = this.enabled ? 'flex' : 'none';
            }

            // Show sticky note if it was visible
            if (this.enabled && this.visible) {
                this.showStickyNote();
            }
        });
    }

    createToggleButton() {
        this.toggleButton = document.createElement('div');
        this.toggleButton.className = 'year-countdown-sticky-toggle';
        this.toggleButton.innerHTML = '📝';
        this.toggleButton.title = 'Toggle Sticky Note';

        this.toggleButton.addEventListener('click', () => {
            this.toggleStickyNote();
        });

        document.body.appendChild(this.toggleButton);

        // Add hover listeners for auto-fade functionality
        if (this.addHoverListeners) {
            this.addHoverListeners(this.toggleButton);
        }

    }

    createStickyNote() {
        if (this.stickyNote) return;

        this.stickyNote = document.createElement('div');
        this.stickyNote.className = `year-countdown-sticky-note theme-${this.currentTheme}`;

        if (this.minimized) {
            this.stickyNote.classList.add('minimized');
        }

        this.stickyNote.style.left = this.position.x + 'px';
        this.stickyNote.style.top = this.position.y + 'px';
        this.stickyNote.style.width = this.size.width + 'px';
        this.stickyNote.style.height = this.size.height + 'px';

        // Force Chrome to apply sizing properly
        this.stickyNote.style.minWidth = this.size.width + 'px';
        this.stickyNote.style.minHeight = this.size.height + 'px';
        this.stickyNote.style.maxWidth = 'none';
        this.stickyNote.style.boxSizing = 'border-box';
        this.stickyNote.style.display = 'flex';
        this.stickyNote.style.flexDirection = 'column';

        const placeholder = this.getPlaceholderText();

        this.stickyNote.innerHTML = `
            <div class="sticky-header">
                <span class="sticky-title">Professional Note</span>
                <div class="sticky-controls">
                    <button class="sticky-minimize" title="Minimize">−</button>
                    <button class="sticky-theme" title="Change Theme">🎨</button>
                    <button class="sticky-close" title="Close">×</button>
                </div>
            </div>
            <div class="sticky-toolbar">
                <button class="format-bold" title="Bold (Ctrl+B)">B</button>
                <button class="format-italic" title="Italic (Ctrl+I)">I</button>
                <div class="separator"></div>
                <button class="format-code" title="Code Block">{ }</button>
                <button class="format-list" title="Bullet List">•</button>
                <div class="separator"></div>
                <select class="template-select" title="Insert Template">
                    <option value="">📋 Templates</option>
                    <option value="meeting">📅 Meeting Notes</option>
                    <option value="todo">✅ To-Do List</option>
                    <option value="study">📚 Study Notes</option>
                    <option value="code">💻 Code Snippet</option>
                    <option value="ideas">💡 Ideas & Brainstorm</option>
                    <option value="research">🔍 Research Notes</option>
                    <option value="project">� Project Planning</option>
                    <option value="daily">📝 Daily Journal</option>
                </select>
                <div class="separator"></div>
                <button class="export-note" title="Export">📤</button>
                <button class="clear-note" title="Clear All">🗑️</button>
            </div>
            <div class="sticky-content">
                <textarea class="sticky-textarea" placeholder="${placeholder}">${this.content}</textarea>
            </div>
            <div class="sticky-footer">
                <div class="sticky-status">
                    <span class="sticky-word-count">${this.getWordCount()} words</span>
                    <span class="sticky-last-saved">Saved ${this.formatTime(this.lastSaved)}</span>
                </div>
            </div>
            <div class="sticky-resize-handle"></div>
        `;

        this.setupStickyNoteEvents();
        document.body.appendChild(this.stickyNote);

        // Add hover listeners for auto-fade functionality
        if (this.addHoverListeners) {
            this.addHoverListeners(this.stickyNote);
        }

        // Focus the textarea and apply formatting
        const textarea = this.stickyNote.querySelector('.sticky-textarea');
        if (textarea) {
            textarea.focus();
            this.applyFormatting(textarea);
        }

    }

    setupStickyNoteEvents() {
        const header = this.stickyNote.querySelector('.sticky-header');
        const textarea = this.stickyNote.querySelector('.sticky-textarea');
        const minimizeBtn = this.stickyNote.querySelector('.sticky-minimize');
        const themeBtn = this.stickyNote.querySelector('.sticky-theme');
        const closeBtn = this.stickyNote.querySelector('.sticky-close');
        const resizeHandle = this.stickyNote.querySelector('.sticky-resize-handle');

        // Toolbar buttons
        const boldBtn = this.stickyNote.querySelector('.format-bold');
        const italicBtn = this.stickyNote.querySelector('.format-italic');
        const codeBtn = this.stickyNote.querySelector('.format-code');
        const listBtn = this.stickyNote.querySelector('.format-list');
        const templateSelect = this.stickyNote.querySelector('.template-select');
        const exportBtn = this.stickyNote.querySelector('.export-note');
        const clearBtn = this.stickyNote.querySelector('.clear-note');

        // Make notes draggable
        header.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            e.preventDefault();
            this.isDragging = true;
            this.dragOffset.x = e.clientX - this.stickyNote.offsetLeft;
            this.dragOffset.y = e.clientY - this.stickyNote.offsetTop;
            this.stickyNote.classList.add('dragging');

            // Bring to front during drag
            this.stickyNote.style.zIndex = '2147483647';
            this.stickyNote.style.cursor = 'grabbing';

            // Prevent text selection during drag
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
        });

        // Make notes resizable
        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.isResizing = true;
            this.stickyNote.classList.add('resizing');

            // Store initial dimensions for better calculation
            this.initialSize = {
                width: this.stickyNote.offsetWidth,
                height: this.stickyNote.offsetHeight
            };
            this.initialMousePos = { x: e.clientX, y: e.clientY };

            // Prevent text selection during resize
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
        });

        // Mouse move and up events
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                e.preventDefault();
                this.position.x = e.clientX - this.dragOffset.x;
                this.position.y = e.clientY - this.dragOffset.y;

                // Keep within viewport with better bounds checking
                const maxX = Math.max(0, window.innerWidth - this.stickyNote.offsetWidth);
                const maxY = Math.max(0, window.innerHeight - this.stickyNote.offsetHeight);

                this.position.x = Math.max(0, Math.min(this.position.x, maxX));
                this.position.y = Math.max(0, Math.min(this.position.y, maxY));

                this.stickyNote.style.left = this.position.x + 'px';
                this.stickyNote.style.top = this.position.y + 'px';

                // Force layout update for Chrome
                this.stickyNote.style.transform = 'translateZ(0)';
            } else if (this.isResizing) {
                e.preventDefault();

                // Calculate new size based on mouse movement
                const deltaX = e.clientX - this.initialMousePos.x;
                const deltaY = e.clientY - this.initialMousePos.y;

                this.size.width = Math.max(300, this.initialSize.width + deltaX);
                this.size.height = Math.max(200, this.initialSize.height + deltaY);

                this.stickyNote.style.width = this.size.width + 'px';
                this.stickyNote.style.height = this.size.height + 'px';
                this.stickyNote.style.minWidth = this.size.width + 'px';
                this.stickyNote.style.minHeight = this.size.height + 'px';

                // Force Chrome to reflow the layout
                this.stickyNote.offsetHeight; // Trigger reflow
                this.stickyNote.style.transform = 'translateZ(0)';
                setTimeout(() => {
                    this.stickyNote.style.transform = '';
                }, 0);
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (this.isDragging || this.isResizing) {
                this.isDragging = false;
                this.isResizing = false;
                this.stickyNote.classList.remove('dragging', 'resizing');
                this.stickyNote.style.cursor = '';
                this.stickyNote.style.transform = '';

                // Restore text selection
                document.body.style.userSelect = '';
                document.body.style.webkitUserSelect = '';

                this.saveStickyNoteState();
            }
        });

        // Button events
        minimizeBtn.addEventListener('click', () => {
            this.minimized = !this.minimized;
            this.stickyNote.classList.toggle('minimized', this.minimized);
            this.saveStickyNoteState();
        });

        themeBtn.addEventListener('click', () => {
            this.cycleTheme();
        });

        closeBtn.addEventListener('click', () => {
            this.hideStickyNote();
        });

        // Toolbar events
        boldBtn.addEventListener('click', () => {
            this.formatting.bold = !this.formatting.bold;
            boldBtn.classList.toggle('active', this.formatting.bold);
            textarea.style.fontWeight = this.formatting.bold ? 'bold' : 'normal';
            this.saveStickyNoteState();
        });

        italicBtn.addEventListener('click', () => {
            this.formatting.italic = !this.formatting.italic;
            italicBtn.classList.toggle('active', this.formatting.italic);
            textarea.style.fontStyle = this.formatting.italic ? 'italic' : 'normal';
            this.saveStickyNoteState();
        });

        codeBtn.addEventListener('click', () => {
            const selection = textarea.selectionStart;
            const text = textarea.value;
            const before = text.substring(0, selection);
            const after = text.substring(textarea.selectionEnd);
            textarea.value = before + '`code`' + after;
            this.content = textarea.value;
            this.updateWordCount();
            this.saveStickyNoteState();
        });

        listBtn.addEventListener('click', () => {
            const selection = textarea.selectionStart;
            const text = textarea.value;
            const before = text.substring(0, selection);
            const after = text.substring(textarea.selectionEnd);
            textarea.value = before + '\n• ' + after;
            this.content = textarea.value;
            this.updateWordCount();
            this.saveStickyNoteState();
        });

        templateSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                this.insertTemplate(e.target.value);
                e.target.value = ''; // Reset selector
            }
        });

        exportBtn.addEventListener('click', () => {
            this.exportNote();
        });

        clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all notes? This action cannot be undone.')) {
                textarea.value = '';
                this.content = '';
                this.updateWordCount();
                this.saveStickyNoteState();
            }
        });

        // Auto-save content and update stats
        textarea.addEventListener('input', () => {
            this.content = textarea.value;
            this.lastSaved = new Date();
            this.updateWordCount();
            this.updateLastSaved();
            this.saveStickyNoteState();
        });

        // Keyboard shortcuts
        textarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'b') {
                    e.preventDefault();
                    boldBtn.click();
                } else if (e.key === 'i') {
                    e.preventDefault();
                    italicBtn.click();
                } else if (e.key === 's') {
                    e.preventDefault();
                    this.saveStickyNoteState();
                }
            }
        });

        // Prevent text selection while dragging
        header.addEventListener('selectstart', (e) => e.preventDefault());
    }

    cycleTheme() {
        const themes = ['default', 'success', 'warning', 'danger', 'purple'];
        const currentIndex = themes.indexOf(this.currentTheme);
        this.currentTheme = themes[(currentIndex + 1) % themes.length];

        // Update note theme
        this.stickyNote.className = `year-countdown-sticky-note theme-${this.currentTheme}`;
        if (this.minimized) {
            this.stickyNote.classList.add('minimized');
        }

        this.saveStickyNoteState();
    }

    getPlaceholderText() {
        const placeholders = [
            "📝 Meeting notes, code snippets, or quick thoughts...",
            "💡 Ideas, TODO items, or research notes...",
            "🔤 Code documentation, bug reports, or study notes...",
            "📚 Lecture notes, formulas, or project planning..."
        ];
        return placeholders[Math.floor(Math.random() * placeholders.length)];
    }

    getWordCount() {
        if (!this.content) return 0;
        return this.content.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    formatTime(date) {
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString();
    }

    applyFormatting(textarea) {
        if (this.formatting.fontSize) {
            textarea.style.fontSize = this.formatting.fontSize + 'px';
        }
    }

    insertTemplate(type) {
        const templates = {
            meeting: `📅 Meeting Notes - ${new Date().toLocaleDateString()}
┌─────────────────────────────────────┐
│ Attendees:                          │
│ •                                   │
│                                     │
│ Agenda:                             │
│ 1.                                  │
│                                     │
│ Action Items:                       │
│ □                                   │
│                                     │
│ Next Steps:                         │
│ •                                   │
└─────────────────────────────────────┘`,

            todo: `✅ TODO List - ${new Date().toLocaleDateString()}
┌─────────────────────────────────────┐
│ High Priority:                      │
│ 🔴                                  │
│                                     │
│ Medium Priority:                    │
│ 🟡                                  │
│                                     │
│ Low Priority:                       │
│ 🟢                                  │
│                                     │
│ Completed:                          │
│ ✅                                  │
└─────────────────────────────────────┘`,

            study: `� Study Notes - ${new Date().toLocaleDateString()}
┌─────────────────────────────────────┐
│ Topic:                              │
│                                     │
│ Key Concepts:                       │
│ •                                   │
│                                     │
│ Formulas/Examples:                  │
│                                     │
│                                     │
│ Questions:                          │
│ ❓                                  │
│                                     │
│ Review Date: ___________            │
└─────────────────────────────────────┘`,

            code: `💻 Code Snippet - ${new Date().toLocaleDateString()}
┌─────────────────────────────────────┐
│ Language:                           │
│                                     │
│ Function/Method:                    │
│ \`\`\`javascript                       │
│ // Code here                        │
│ \`\`\`                                 │
│                                     │
│ Description:                        │
│                                     │
│                                     │
│ Notes:                              │
│ •                                   │
└─────────────────────────────────────┘`,

            ideas: `💡 Ideas & Brainstorm - ${new Date().toLocaleDateString()}
┌─────────────────────────────────────┐
│ Main Idea:                          │
│                                     │
│                                     │
│ Pros:                               │
│ ✅                                  │
│                                     │
│ Cons:                               │
│ ❌                                  │
│                                     │
│ Next Actions:                       │
│ 🎯                                  │
│                                     │
│ Priority: 🔥🔥🔥                    │
└─────────────────────────────────────┘`,

            research: `� Research Notes - ${new Date().toLocaleDateString()}
┌─────────────────────────────────────┐
│ Research Question:                  │
│                                     │
│                                     │
│ Sources:                            │
│ 📖                                  │
│                                     │
│ Key Findings:                       │
│ •                                   │
│                                     │
│ Conclusions:                        │
│                                     │
│                                     │
│ Follow-up:                          │
│ ➡️                                  │
└─────────────────────────────────────┘`,

            project: `📊 Project Planning - ${new Date().toLocaleDateString()}
┌─────────────────────────────────────┐
│ Project Name:                       │
│                                     │
│ Objectives:                         │
│ 🎯                                  │
│                                     │
│ Timeline:                           │
│ Start: ___________                  │
│ End:   ___________                  │
│                                     │
│ Resources Needed:                   │
│ •                                   │
│                                     │
│ Milestones:                         │
│ ✅                                  │
│                                     │
│ Risk Factors:                       │
│ ⚠️                                   │
└─────────────────────────────────────┘`,

            daily: `📝 Daily Journal - ${new Date().toLocaleDateString()}
┌─────────────────────────────────────┐
│ Today's Goals:                      │
│ 🎯                                  │
│                                     │
│ Accomplishments:                    │
│ ✅                                  │
│                                     │
│ Challenges:                         │
│ 🚧                                  │
│                                     │
│ Learnings:                          │
│ 💡                                  │
│                                     │
│ Tomorrow's Focus:                   │
│ ➡️                                  │
│                                     │
│ Mood: 😊 😐 😔                     │
│ Energy: ⚡⚡⚡⚡⚡                    │
└─────────────────────────────────────┘`
        };

        const textarea = this.stickyNote.querySelector('.sticky-textarea');
        if (textarea) {
            textarea.value = templates[type] || templates.meeting;
            this.content = textarea.value;
            this.updateWordCount();
            this.saveStickyNoteState();
        }
    }

    updateWordCount() {
        const wordCountElement = this.stickyNote.querySelector('.sticky-word-count');
        if (wordCountElement) {
            wordCountElement.textContent = `📊 ${this.getWordCount()} words`;
        }
    }

    updateLastSaved() {
        const lastSavedElement = this.stickyNote.querySelector('.sticky-last-saved');
        if (lastSavedElement) {
            lastSavedElement.textContent = `💾 Saved ${this.formatTime(this.lastSaved)}`;
        }
    }

    exportNote() {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `sticky-note-${timestamp}.txt`;

        const blob = new Blob([this.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    toggleStickyNote() {
        if (this.visible) {
            this.hideStickyNote();
        } else {
            this.showStickyNote();
        }
    }

    showStickyNote() {
        this.visible = true;
        this.createStickyNote();

        // Add animation class and force sizing in Chrome
        if (this.stickyNote) {
            // Force Chrome to apply proper sizing
            this.stickyNote.style.width = this.size.width + 'px';
            this.stickyNote.style.height = this.size.height + 'px';
            this.stickyNote.style.minWidth = this.size.width + 'px';
            this.stickyNote.style.minHeight = this.size.height + 'px';

            // Trigger reflow
            this.stickyNote.offsetHeight;

            this.stickyNote.classList.add('animate-in');
            setTimeout(() => {
                if (this.stickyNote) {
                    this.stickyNote.classList.remove('animate-in');
                }
            }, 400);
        }

        this.saveStickyNoteState();
    }

    hideStickyNote() {
        this.visible = false;

        if (this.stickyNote) {
            this.stickyNote.classList.add('animate-out');
            setTimeout(() => {
                if (this.stickyNote) {
                    this.stickyNote.remove();
                    this.stickyNote = null;
                }
            }, 300);
        }

        this.saveStickyNoteState();
    }

    saveStickyNoteState() {
        const state = {
            stickyNoteVisible: this.visible,
            stickyNoteContent: this.content,
            stickyNotePosition: this.position,
            stickyNoteSize: this.size,
            stickyNoteTheme: this.currentTheme,
            stickyNoteMinimized: this.minimized,
            stickyNoteFormatting: this.formatting
        };

        chrome.storage.local.set(state);
    }

    loadStickyNoteState() {
        // This is called from loadSettings(), so the state is already loaded
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'toggleStickyNote') {
                this.toggleStickyNote();
                sendResponse({ success: true });
            } else if (request.action === 'setStickyNoteEnabled') {
                this.enabled = request.enabled;
                if (!this.enabled && this.stickyNote) {
                    this.hideStickyNote();
                }
                if (this.toggleButton) {
                    this.toggleButton.style.display = this.enabled ? 'flex' : 'none';
                }
                sendResponse({ success: true });
            }
        });
    }

    setupChromeMouseInactivity() {

        const resetInactivityTimer = () => {
            if (this.mouseInactivityTimer) {
                clearTimeout(this.mouseInactivityTimer);
            }

            if (this.isMouseInactive) {
                this.showChromeElements();
                this.isMouseInactive = false;
            }

            this.mouseInactivityTimer = setTimeout(() => {
                this.fadeChromeElements();
                this.isMouseInactive = true;
            }, this.inactivityDelay);
        };

        this.fadeChromeElements = () => {
            if (this.chromeToggleButton) {
                this.chromeToggleButton.classList.add('auto-fade');
            }
            const chromeOverlay = document.getElementById('chrome-note-overlay');
            if (chromeOverlay) {
                chromeOverlay.classList.add('auto-fade');
            }
        };

        this.showChromeElements = () => {
            if (this.chromeToggleButton) {
                this.chromeToggleButton.classList.remove('auto-fade');
            }
            const chromeOverlay = document.getElementById('chrome-note-overlay');
            if (chromeOverlay) {
                chromeOverlay.classList.remove('auto-fade');
            }
        };

        const addChromeHoverListeners = (element) => {
            if (element) {
                element.addEventListener('mouseenter', () => {
                    if (this.isMouseInactive) {
                        this.showChromeElements();
                    }
                });

                element.addEventListener('mouseleave', () => {
                    if (this.isMouseInactive) {
                        this.fadeChromeElements();
                    }
                });
            }
        };

        this.addChromeHoverListeners = addChromeHoverListeners;

        // Add hover listeners to the toggle button
        addChromeHoverListeners(this.chromeToggleButton);

        // Mouse activity detection
        document.addEventListener('mousemove', resetInactivityTimer, { passive: true });
        document.addEventListener('mousedown', resetInactivityTimer, { passive: true });
        document.addEventListener('mouseup', resetInactivityTimer, { passive: true });
        document.addEventListener('click', resetInactivityTimer, { passive: true });
        document.addEventListener('scroll', resetInactivityTimer, { passive: true });
        document.addEventListener('keydown', resetInactivityTimer, { passive: true });

        resetInactivityTimer();
    }

    destroy() {
        if (this.stickyNote) {
            this.stickyNote.remove();
            this.stickyNote = null;
        }
        if (this.toggleButton) {
            this.toggleButton.remove();
            this.toggleButton = null;
        }

        // Clear mouse inactivity timer
        if (this.mouseInactivityTimer) {
            clearTimeout(this.mouseInactivityTimer);
        }
    }

    setupMouseInactivityDetection() {

        const resetInactivityTimer = () => {
            // Clear existing timer
            if (this.mouseInactivityTimer) {
                clearTimeout(this.mouseInactivityTimer);
            }

            // Show elements if they were faded
            if (this.isMouseInactive) {
                this.showElements();
                this.isMouseInactive = false;
            }

            // Set new timer
            this.mouseInactivityTimer = setTimeout(() => {
                this.fadeElements();
                this.isMouseInactive = true;
            }, this.inactivityDelay);
        };

        const fadeElements = () => {
            if (this.toggleButton) {
                this.toggleButton.classList.add('auto-fade');
            }
            if (this.stickyNote && this.visible) {
                this.stickyNote.classList.add('auto-fade');
            }
            // Also fade Chrome note overlay if it exists
            const chromeOverlay = document.getElementById('chrome-note-overlay');
            if (chromeOverlay) {
                chromeOverlay.classList.add('auto-fade');
            }
        };

        const showElements = () => {
            if (this.toggleButton) {
                this.toggleButton.classList.remove('auto-fade');
            }
            if (this.stickyNote && this.visible) {
                this.stickyNote.classList.remove('auto-fade');
            }
            // Also show Chrome note overlay if it exists
            const chromeOverlay = document.getElementById('chrome-note-overlay');
            if (chromeOverlay) {
                chromeOverlay.classList.remove('auto-fade');
            }
        };

        // Store methods on the instance for reuse
        this.fadeElements = fadeElements;
        this.showElements = showElements;

        // Mouse movement detection
        document.addEventListener('mousemove', resetInactivityTimer, { passive: true });
        document.addEventListener('mousedown', resetInactivityTimer, { passive: true });
        document.addEventListener('mouseup', resetInactivityTimer, { passive: true });
        document.addEventListener('click', resetInactivityTimer, { passive: true });
        document.addEventListener('scroll', resetInactivityTimer, { passive: true });
        document.addEventListener('keydown', resetInactivityTimer, { passive: true });

        // Also detect when mouse enters sticky note or toggle button areas
        const addHoverListeners = (element) => {
            if (element) {
                element.addEventListener('mouseenter', () => {
                    if (this.isMouseInactive) {
                        this.showElements();
                    }
                });

                element.addEventListener('mouseleave', () => {
                    if (this.isMouseInactive) {
                        this.fadeElements();
                    }
                });
            }
        };

        // Add hover listeners to existing elements
        if (this.toggleButton) {
            addHoverListeners(this.toggleButton);
        }

        // Store method to add listeners to sticky note when created
        this.addHoverListeners = addHoverListeners;

        // Start the initial timer
        resetInactivityTimer();

    }
}

// Initialize sticky note manager when DOM is ready

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new StickyNoteManager();
    });
} else {
    new StickyNoteManager();
}
