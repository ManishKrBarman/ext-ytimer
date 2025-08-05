# Contributing to YTimer - New Tab Extension

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Any contributions you make will be under the MIT Software License

In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using GitHub's [issue tracker](https://github.com/ManishKrBarman/ext-ytimer/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/ManishKrBarman/ext-ytimer/issues/new).

## Write bug reports with detail, background, and sample code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/ManishKrBarman/ext-ytimer.git
   cd ext-ytimer
   ```

2. Validate the extension structure (optional):
   ```bash
   npm run build
   ```

3. Load the extension in your browser:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the project root directory

4. Make your changes and test thoroughly

5. Submit a pull request with a clear description of your changes

## Code Style

- Use meaningful variable and function names
- Comment your code where necessary
- Follow the existing code style and patterns
- Test your changes in both Chrome and Brave browsers
- Ensure no Node.js dependencies in browser-side code
- Use async/await for Chrome extension API calls
- Add comprehensive error handling with try-catch blocks

## Extension Architecture

### File Structure
```
├── manifest.json              # Extension configuration (Manifest V3)
├── src/
│   ├── js/
│   │   ├── background.js      # Service worker for background tasks
│   │   ├── content-script.js  # Injected into pages for sticky notes
│   │   └── newtab.js         # Main application logic for new tab
│   ├── css/
│   │   ├── styles.css        # Main stylesheet for new tab
│   │   └── sticky-note.css   # Sticky notes styling and themes
│   └── html/
│       └── newtab.html       # New tab page layout
├── assets/
│   └── icons/                # Extension icons (16, 32, 48, 128px)
└── build.js                  # Validation script
```

### Key Components
- **Service Worker** (`src/js/background.js`): Handles alarms, notifications, and extension lifecycle
- **Content Script** (`src/js/content-script.js`): Manages sticky notes on web pages
- **New Tab Override** (`src/html/newtab.html` + `src/js/newtab.js`): Main dashboard functionality
- **Modular CSS**: Separate stylesheets for different features

### Recent Improvements
- ✅ Removed duplicate root-level JS files
- ✅ Fixed Node.js compatibility issues (`process.env` removed)
- ✅ Enhanced error handling throughout codebase
- ✅ Updated manifest references and icon paths
- ✅ Improved service worker stability

## Testing

Before submitting:

1. Test in Chrome and Brave browsers
2. Test all sticky note features
3. Test quick links functionality
4. Test countdown display
5. Check for console errors
6. Verify extension loads without errors

## License

By contributing, you agree that your contributions will be licensed under its MIT License.

## References

This document was adapted from the open-source contribution guidelines for [Facebook's Draft](https://github.com/facebook/draft-js/blob/a9316a723f9e918afde44dea68b5f9f39b7d9b00/CONTRIBUTING.md).
