# Changelog

All notable changes to YTimer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2025-08-06

### Fixed
- **Service Worker Registration**: Resolved "process is not defined" error by removing Node.js `process.env` references
- **Code Structure**: Removed duplicate root-level `background.js` and `content-script.js` files
- **Browser Compatibility**: Eliminated Node.js dependencies from browser-side code
- **Icon References**: Fixed missing `icon.svg` references in newtab.html and manifest.json
- **Error Handling**: Added comprehensive try-catch blocks throughout service worker

### Changed
- **File Organization**: Consolidated all source code to `src/` directory structure
- **Service Worker**: Enhanced background script with better error handling and alarm management
- **Build Process**: Improved validation script and updated documentation
- **Manifest**: Updated web accessible resources to reference existing PNG icons

### Documentation
- **README.md**: Updated installation instructions and technical details section
- **STRUCTURE.md**: Added detailed file descriptions and recent changes documentation
- **CONTRIBUTING.md**: Updated development setup and architecture documentation
- **Repository URLs**: Fixed GitHub repository references in contributing guidelines

## [1.1.0] - 2025-08-04

### Added
- Advanced sticky notes functionality with browser detection
- Support for both Brave (advanced features) and Chrome (simplified dialog)
- Rich text formatting: Bold, Italic, Code blocks, Lists
- 8 professional note templates (Meeting, Todo, Study, Code, Ideas, Research, Project, Daily)
- Auto-save functionality with real-time word/character counting
- Export capabilities to text files
- Auto-fade during mouse inactivity for distraction-free browsing
- Drag and drop for sticky note positioning
- Resizable sticky notes with multiple themes
- Cross-tab sticky note settings synchronization

### Fixed
- Service worker registration errors (Status code: 15)
- Syntax errors in background.js (missing console.log statements, empty catch blocks)
- Content script syntax errors and incomplete function calls
- Duplicate variable declarations in newtab.js
- Missing settings menu structure in newtab.html
- Browser compatibility detection for Brave vs Chrome

### Changed
- Updated manifest.json for better compatibility
- Improved error handling across all scripts
- Enhanced browser detection for optimal feature delivery
- Streamlined codebase by removing redundant files

### Security
- All data stored locally in browser storage
- No external API calls or data transmission
- Content Security Policy implemented

## [1.0.0] - 2025-07-15

### Added
- Initial release
- Year countdown with real-time updates
- Quick links management with drag & drop
- Basic new tab page replacement
- Settings panel for customization
- Multiple themes support
- Progress bar visualization
- Keyboard shortcuts

### Technical
- Manifest V3 compliance
- Service worker implementation
- Local storage for user data
- Responsive design
- Cross-browser compatibility

## [Unreleased]

### Planned
- Dark/Light theme toggle
- Cloud sync for settings and notes
- Mobile companion app
- Collaborative sticky notes
- Export to PDF/Markdown formats