// YTimer background service worker
chrome.runtime.onInstalled.addListener(async (details) => {
    try {
        if (details.reason === 'install') {
            // Set up initial data when extension is first installed
            await chrome.storage.local.set({
                installDate: new Date().toISOString(),
                lastYearCheck: new Date().getFullYear()
            });
        }

        // Set up alarm for year checking
        chrome.alarms.create('yearCheck', { periodInMinutes: 60 });
    } catch (error) {
        console.error('Error during extension installation:', error);
    }
});

// Check for year changes when browser starts
chrome.runtime.onStartup.addListener(() => {
    try {
        checkYearChange();
    } catch (error) {
        console.error('Error during startup:', error);
    }
});

async function checkYearChange() {
    try {
        const result = await chrome.storage.local.get(['lastYearCheck']);
        const currentYear = new Date().getFullYear();
        const lastCheckedYear = result.lastYearCheck || currentYear;

        if (currentYear > lastCheckedYear) {
            // Update our records
            await chrome.storage.local.set({
                lastYearCheck: currentYear,
                yearChangeDetected: true,
                yearChangeDate: new Date().toISOString()
            });

            // Show a Happy New Year notification
            if (chrome.notifications) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'assets/icons/icon-48.png',
                    title: 'Happy New Year!',
                    message: `Welcome to ${currentYear}! The countdown has reset.`
                });
            }
        }
    } catch (error) {
        console.error('Error checking year change:', error);
    }
}

chrome.alarms.onAlarm.addListener((alarm) => {
    try {
        if (alarm.name === 'yearCheck') {
            checkYearChange();
        }
    } catch (error) {
        console.error('Error in alarm handler:', error);
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    try {
        // Open new tab with countdown
        chrome.tabs.create({ url: 'chrome://newtab/' });
    } catch (error) {
        console.error('Error handling action click:', error);
    }
});

// Monitor tab creation for new tab page
chrome.tabs.onCreated.addListener((tab) => {
    if (tab.url === 'chrome://newtab/' || tab.pendingUrl === 'chrome://newtab/') {
        // New tab page will load
    }
});

// Log storage changes for debugging (remove in production)
// Uncomment the following block for debugging storage changes:
/*
chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        console.log(
            `Storage key "${key}" in namespace "${namespace}" changed.`,
            `Old value was "${oldValue}", new value is "${newValue}".`
        );
    }
});
*/

// Keep service worker alive with periodic storage writes
let heartbeatInterval;

function startHeartbeat() {
    // Only start heartbeat if not already running
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }

    heartbeatInterval = setInterval(async () => {
        try {
            await chrome.storage.local.set({ lastHeartbeat: Date.now() });
        } catch (error) {
            console.error('Heartbeat error:', error);
            // If heartbeat fails, try to restart it
            setTimeout(startHeartbeat, 5000);
        }
    }, 25000); // Every 25 seconds
}

// Start heartbeat
startHeartbeat();

// Stop heartbeat on suspend
chrome.runtime.onSuspend.addListener(() => {
    try {
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }
    } catch (error) {
        console.error('Error during suspend:', error);
    }
});
