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
├── .gitignore           # Git ignore rules
│
├── src/                 # Source code
│   ├── js/             # JavaScript files
│   │   ├── background.js    # Service worker
│   │   ├── content-script.js # Content script for sticky notes
│   │   └── newtab.js       # New tab page functionality
│   ├── css/            # Stylesheets
│   │   ├── styles.css      # Main styles for new tab
│   │   └── sticky-note.css # Styles for sticky notes
│   └── html/           # HTML files
│       └── newtab.html     # New tab page
│
└── assets/             # Static assets
    ├── icons/         # Extension icons
    │   ├── icon-16.png
    │   ├── icon-32.png
    │   ├── icon-48.png
    │   └── icon-128.png
    └── imgs/          # Other images
        ├── notes_toggle.png
        ├── notes_window.png
        └── tab.png
```

## Development Commands

- `npm run build` - Validate extension structure
- `npm run validate` - Same as build
- `npm run dev` - Instructions for development setup

## Key Features

- 📁 **Organized Structure**: Clean separation of concerns
- 🔧 **Build Validation**: Automated checking of required files
- 📋 **Manifest V3**: Latest Chrome extension standard
- 🎨 **Professional Layout**: Industry-standard folder organization
