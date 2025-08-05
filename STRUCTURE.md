# Project Structure

YTimer extension follows a clean, organized structure:

```
├── manifest.json          # Extension manifest (Manifest V3)
├── package.json           # Node.js package configuration
├── build.js              # Build and validation script
├── LICENSE               # MIT License
├── README.md             # Project documentation
├── CHANGELOG.md          # Version history
├── CONTRIBUTING.md       # Contribution guidelines
├── PRIVACY.md            # Privacy policy
├── STRUCTURE.md          # This file - project structure overview
├── .gitignore           # Git ignore rules
│
├── src/                 # Source code directory
│   ├── js/             # JavaScript files
│   │   ├── background.js    # Service worker (main background script)
│   │   ├── content-script.js # Content script for sticky notes feature
│   │   └── newtab.js       # New tab page functionality and widgets
│   ├── css/            # Stylesheets
│   │   ├── styles.css      # Main styles for new tab interface
│   │   └── sticky-note.css # Dedicated styles for sticky notes
│   └── html/           # HTML templates
│       └── newtab.html     # New tab page template
│
└── assets/             # Static assets and resources
    ├── icons/         # Extension icons (multiple sizes)
    │   ├── icon-16.png    # 16x16 icon for extension toolbar
    │   ├── icon-32.png    # 32x32 icon for extension management
    │   ├── icon-48.png    # 48x48 icon for extension details
    │   └── icon-128.png   # 128x128 icon for Web Store
    └── imgs/          # Documentation and feature images
        ├── notes_toggle.png   # Sticky notes toggle demonstration
        ├── notes_window.png   # Notes interface showcase
        └── tab.png           # Main new tab interface preview
```

## File Descriptions

### Core Files
- **manifest.json**: Chrome Extension Manifest V3 configuration
- **build.js**: Validation script ensuring all required files exist
- **package.json**: Project metadata and npm scripts

### Source Code (`src/`)
- **background.js**: Service worker handling alarms, notifications, and extension lifecycle
- **content-script.js**: Injected script for sticky notes functionality on web pages
- **newtab.js**: Main script for new tab dashboard, countdown, and quick links
- **styles.css**: Primary stylesheet for the new tab interface
- **sticky-note.css**: Specialized styles for sticky notes with themes and animations
- **newtab.html**: HTML structure for the new tab replacement page

### Assets (`assets/`)
- **icons/**: All required icon sizes for Chrome Web Store and browser UI
- **imgs/**: Documentation images used in README.md

## Development Commands

```bash
# Build and validate extension structure
npm run build

# Validate extension (same as build)
npm run validate

# Development setup instructions
npm run dev

# Run build script directly
node build.js
```

## Project Architecture

### Extension Structure
- **Manifest V3**: Modern Chrome extension architecture
- **Service Worker**: Efficient background processing with `src/js/background.js`
- **Content Scripts**: Page injection via `src/js/content-script.js`
- **New Tab Override**: Custom dashboard with `src/html/newtab.html`

### Code Organization
- **Separation of Concerns**: Clear division between background, content, and UI scripts
- **Modular CSS**: Separate stylesheets for different components
- **Asset Management**: Organized icons and documentation images
- **Build Validation**: Automated checks for file existence and manifest validity

## Development Notes

### Recent Changes
- ✅ **Cleaned up duplicate files**: Removed outdated `background.js` and `content-script.js` from root
- ✅ **Fixed Node.js compatibility**: Removed `process.env` references for browser compatibility
- ✅ **Enhanced error handling**: Added comprehensive try-catch blocks in service worker
- ✅ **Updated manifest references**: Fixed icon paths and web accessible resources
- ✅ **Improved build validation**: Enhanced build script with better file checking

### Key Features
- 📁 **Clean Structure**: No duplicate files, organized source code
- 🔧 **Build Validation**: Automated checking of required files and manifest
- 📋 **Manifest V3 Compliance**: Latest Chrome extension standards
- 🎨 **Professional Organization**: Industry-standard folder hierarchy
- 🚀 **Browser Optimized**: Removed Node.js dependencies for pure browser compatibility
