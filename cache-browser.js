// Debug Console - Hierarchical Menu System

/**
 * Filter and format text
 */
function cleanText(text) {
    if (!text) return '';
    return text
        .replace(/[\u2500-\u257F]/g, '')
        .replace(/[\uFFFD\uFFFE\uFFFF]/g, '')
        .replace(/\u00A0/g, ' ')
        .replace(/\u25A0/g, '')
        .trim();
}

function formatTextWithBreaks(text) {
    if (!text) return 'N/A';
    const cleaned = cleanText(text);
    return cleaned.replace(/\n/g, '<br>');
}

/**
 * Show Debug Console
 */
function showDebugConsole() {
    // Access global variables from app.js
    const items = window.feedItems || [];

    if (items.length === 0) {
        alert('No cached items available. Please wait for feeds to load.');
        return;
    }

    // Group by source
    const itemsBySource = {};
    items.forEach(item => {
        if (!itemsBySource[item.source]) {
            itemsBySource[item.source] = [];
        }
        itemsBySource[item.source].push(item);
    });

    const modal = document.createElement('div');
    modal.className = 'debug-console-modal';
    modal.innerHTML = `
        <div class="debug-console-content">
            <div class="debug-console-header">
                <h3>🔍 Debug Console</h3>
                <button class="debug-modal-close" onclick="this.closest('.debug-console-modal').remove()">&times;</button>
            </div>
            <div class="debug-console-body">
                <div class="debug-console-sidebar" id="debugSidebar">
                    <div class="debug-menu-item" onclick="showDebugHome()">
                        <span>📋 Overview</span>
                    </div>
                    <div class="debug-menu-group">
                        <div class="debug-menu-header" onclick="toggleDebugGroup(this)">
                            <span class="debug-toggle">▼</span>
                            <span>📰 Feeds (${Object.keys(itemsBySource).length})</span>
                        </div>
                        <div class="debug-menu-items">
                            ${Object.entries(itemsBySource).map(([source, sourceItems]) => `
                                <div class="debug-menu-subitem" onclick="showFeedItems('${escapeHtml(source)}')">
                                    ${escapeHtml(source)} (${sourceItems.length})
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="debug-menu-item" onclick="showForceRefresh()">
                        <span>🔄 Force Refresh</span>
                    </div>
                </div>
                <div class="debug-console-main" id="debugMain">
                    <div class="debug-home">
                        <h4>Debug Overview</h4>
                        <p><strong>Total Articles:</strong> ${items.length}</p>
                        <p><strong>Sources:</strong> ${Object.keys(itemsBySource).length}</p>
                        <p><strong>Last Updated:</strong> ${new Date().toLocaleString()}</p>
                        <hr>
                        <p>Select a feed from the sidebar to browse articles.</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

/**
 * Toggle debug menu group
 */
function toggleDebugGroup(header) {
    const items = header.nextElementSibling;
    const toggle = header.querySelector('.debug-toggle');

    if (items.style.display === 'none') {
        items.style.display = 'block';
        toggle.textContent = '▼';
    } else {
        items.style.display = 'none';
        toggle.textContent = '▶';
    }
}

/**
 * Show debug home
 */
function showDebugHome() {
    const items = window.feedItems || [];
    const itemsBySource = {};
    items.forEach(item => {
        if (!itemsBySource[item.source]) itemsBySource[item.source] = [];
        itemsBySource[item.source].push(item);
    });

    const main = document.getElementById('debugMain');
    main.innerHTML = `
        <div class="debug-home">
            <h4>Debug Overview</h4>
            <p><strong>Total Articles:</strong> ${items.length}</p>
            <p><strong>Sources:</strong> ${Object.keys(itemsBySource).length}</p>
            <p><strong>Last Updated:</strong> ${new Date().toLocaleString()}</p>
            <hr>
            <p>Select a feed from the sidebar to browse articles.</p>
        </div>
    `;
}

/**
 * Show feed items
 */
function showFeedItems(sourceName) {
    const items = window.feedItems || [];
    const sourceItems = items.filter(item => item.source === sourceName);

    const main = document.getElementById('debugMain');
    main.innerHTML = `
        <div class="debug-feed-view">
            <h4>${escapeHtml(sourceName)}</h4>
            <p class="debug-feed-count">${sourceItems.length} articles</p>
            <div class="debug-items-list">
                ${sourceItems.map(item => `
                    <div class="debug-item-card" onclick="showItemDetail('${item.id}')">
                        <div class="debug-item-title">${escapeHtml(item.title)}</div>
                        <div class="debug-item-meta">${new Date(item.pubDate).toLocaleString()}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Show item detail
 */
function showItemDetail(itemId) {
    const items = window.feedItems || [];
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const main = document.getElementById('debugMain');
    main.innerHTML = `
        <div class="debug-item-detail">
            <button class="debug-back-btn" onclick="showFeedItems('${escapeHtml(item.source)}')">&larr; Back to ${escapeHtml(item.source)}</button>
            <h4>${escapeHtml(item.title)}</h4>
            <div class="debug-item-info">
                <p><strong>Source:</strong> ${escapeHtml(item.source)}</p>
                <p><strong>Published:</strong> ${new Date(item.pubDate).toLocaleString()}</p>
                <p><strong>Link:</strong> <a href="${escapeHtml(item.link)}" target="_blank">${escapeHtml(item.link)}</a></p>
            </div>
            <hr>
            <h5>Description</h5>
            <div class="debug-text-content">${formatTextWithBreaks(item.description || '')}</div>
            <hr>
            <h5>Full Text (${(item.fullText || '').length} characters)</h5>
            <div class="debug-text-content">${formatTextWithBreaks(item.fullText || '')}</div>
        </div>
    `;
}

/**
 * Show force refresh option
 */
function showForceRefresh() {
    const main = document.getElementById('debugMain');
    main.innerHTML = `
        <div class="debug-refresh-view">
            <h4>🔄 Force Refresh</h4>
            <p>This will clear the cache and fetch fresh data from all RSS feeds.</p>
            <p><strong>Warning:</strong> This may take a few moments and will reload the page.</p>
            <hr>
            <button class="debug-refresh-btn" onclick="performForceRefresh()">
                Clear Cache & Refresh Feeds
            </button>
        </div>
    `;
}

/**
 * Perform force refresh
 */
async function performForceRefresh() {
    if (!confirm('Are you sure you want to clear the cache and refresh all feeds?')) {
        return;
    }

    try {
        const response = await fetch('/api/cache', { method: 'DELETE' });
        if (response.ok) {
            alert('Cache cleared! Refreshing feeds...');
            window.location.reload();
        } else {
            alert('Failed to clear cache');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Expose functions globally
window.showDebugConsole = showDebugConsole;
window.toggleDebugGroup = toggleDebugGroup;
window.showDebugHome = showDebugHome;
window.showFeedItems = showFeedItems;
window.showItemDetail = showItemDetail;
window.showForceRefresh = showForceRefresh;
window.performForceRefresh = performForceRefresh;
