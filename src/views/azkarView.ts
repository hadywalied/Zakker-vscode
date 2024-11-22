import * as vscode from 'vscode';
import { Azkar } from '../models/azkar';

export class AzkarViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'azkar-view';
    private _view?: vscode.WebviewView;
    private _panel?: vscode.WebviewPanel;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _azkar: Azkar[]
    ) {}
    
    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getWebviewContent();
    }


    public show() {
        if (this._panel) {
            this._panel.reveal();
            return;
        }

        this._panel = vscode.window.createWebviewPanel(
            AzkarViewProvider.viewType,
            'Zakker',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        this._panel.webview.html = this._getWebviewContent();

        this._panel.onDidDispose(() => {
            this._panel = undefined;
        });
    }
    private _getWebviewContent() {
        return `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>ذكِّر</title>
                <style>
                    @font-face {
                        font-family: 'Amiri';
                        font-style: normal;
                        font-weight: 400;
                        font-display: swap;
                        src: url(https://fonts.gstatic.com/s/amiri/v17/J7aRnpd8CGxBHpUrtLMA7w.woff2) format('woff2');
                        unicode-range: U+0600-06FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE80-FEFC;
                    }
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        padding: 20px;
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        line-height: 1.6;
                        max-width: 800px;
                        margin: 0 auto;
                    }

                    .category {
                        margin-bottom: 30px;
                        padding: 15px;
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                        transition: transform 0.2s ease;
                    }

                    .category:hover {
                        transform: translateY(-2px);
                    }

                    .category-header {
                        display: flex;
                        align-items: center;
                        cursor: pointer;
                        margin-bottom: 15px;
                    }

                    .category-header h2 {
                        margin: 0;
                        flex-grow: 1;
                        color: var(--vscode-symbolIcon-classForeground);
                    }

                    .category-content {
                        transition: height 0.3s ease-out;
                        overflow: hidden;
                    }

                    .category-content.collapsed {
                        height: 0;
                    }

                    .toggle-icon {
                        margin-left: 10px;
                        transition: transform 0.3s ease;
                        opacity: 0.7;
                        transform: rotate(0deg);
                    }

                    .category.expanded .toggle-icon {
                        transform: rotate(180deg);
                    }

                    .zekr {
                        margin: 15px 0;
                        padding: 15px;
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 6px;
                        position: relative;
                    }

                    .zekr-text {
                        font-family: 'Amiri', serif;
                        font-size: 1.3em;
                        line-height: 2;
                        margin: 8px 0;
                        text-align: justify;
                        color: var(--vscode-editor-foreground);
                        padding: 10px 0;
                    }

                    /* Optional: Style for specific parts of the text */
                    .zekr-text strong,
                    .zekr-text b {
                        color: var(--vscode-symbolIcon-classForeground);
                    }

                    /* Add a subtle separator between zekr text and metadata */
                    .zekr-text::after {
                        content: '';
                        display: block;
                        width: 50px;
                        height: 2px;
                        background-color: var(--vscode-panel-border);
                        margin: 15px 0 10px;
                        opacity: 0.5;
                    }

                    /* Enhance the description and reference styling */
                    .description {
                        font-family: 'Segoe UI', Tahoma, sans-serif;
                        color: var(--vscode-textPreformat-foreground);
                        font-size: 0.9em;
                        margin-top: 10px;
                        opacity: 0.8;
                    }

                    .reference {
                        font-family: 'Segoe UI', Tahoma, sans-serif;
                        color: var(--vscode-textLink-foreground);
                        font-size: 0.85em;
                        font-style: italic;
                        opacity: 0.8;
                    }

                    /* Optional: Add hover effect for better interaction */
                    .zekr:hover .zekr-text {
                        color: var(--vscode-editor-foreground);
                    }

                    /* Optional: Add print styles */
                    @media print {
                        .zekr-text {
                            color: #000;
                            page-break-inside: avoid;
                        }
                    }

                    .count {
                        position: absolute;
                        bottom: 10px;
                        left: 10px;
                        background-color: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                        padding: 3px 8px;
                        border-radius: 12px;
                        font-size: 0.8em;
                    }

                    .search-container {
                        position: sticky;
                        top: 0;
                        padding: 10px;
                        background-color: var(--vscode-editor-background);
                        z-index: 100;
                        margin-bottom: 20px;
                    }

                    .search-input {
                        width: 100%;
                        padding: 8px 12px;
                        border: 1px solid var(--vscode-input-border);
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border-radius: 4px;
                        font-size: 1em;
                    }

                    .search-input:focus {
                        outline: none;
                        border-color: var(--vscode-focusBorder);
                    }
                </style>
            </head>
            <body>
                <div class="search-container">
                    <input type="text" class="search-input" placeholder="ابحث في الأذكار..." id="searchInput">
                </div>

                <div id="azkarContainer">
                    ${this._azkar.map(category => `
                        <div class="category" data-search="${category.category.search}">
                            <div class="category-header">
                                <h2>${category.category.name}</h2>
                                <span class="toggle-icon">▼</span>
                            </div>
                            <div class="category-content collapsed">
                                ${category.zikr.map(zekr => `
                                    <div class="zekr" data-search="${zekr.search}">
                                        <p class="zekr-text">${zekr.zekr}</p>
                                        ${zekr.description ? `<p class="description">${zekr.description}</p>` : ''}
                                        ${zekr.reference ? `<p class="reference">${zekr.reference}</p>` : ''}
                                        ${zekr.count && zekr.count > 1 ? `<p class="count">${zekr.count}×</p>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <script>
                    // Performance optimization: Use event delegation
                    document.getElementById('azkarContainer').addEventListener('click', (e) => {
                        const header = e.target.closest('.category-header');
                        if (header) {
                            const category = header.closest('.category');
                            category.classList.toggle('expanded');
                            const content = category.querySelector('.category-content');
                            content.classList.toggle('collapsed');
                        }
                    });

                    // Optimized search with debouncing
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

                    const searchInput = document.getElementById('searchInput');
                    const performSearch = debounce((searchTerm) => {
                        const categories = document.querySelectorAll('.category');
                        searchTerm = searchTerm.toLowerCase();

                        categories.forEach(category => {
                            const categorySearch = category.dataset.search.toLowerCase();
                            const azkar = category.querySelectorAll('.zekr');
                            let hasVisibleZekr = false;

                            azkar.forEach(zekr => {
                                const zekrSearch = zekr.dataset.search.toLowerCase();
                                const zekrText = zekr.textContent.toLowerCase();
                                const shouldShow = zekrSearch.includes(searchTerm) || 
                                                 zekrText.includes(searchTerm) ||
                                                 categorySearch.includes(searchTerm);
                                
                                zekr.style.display = shouldShow ? 'block' : 'none';
                                if (shouldShow) hasVisibleZekr = true;
                            });

                            category.style.display = hasVisibleZekr ? 'block' : 'none';
                        });
                    }, 250);

                    searchInput.addEventListener('input', (e) => performSearch(e.target.value));
                </script>
            </body>
            </html>
        `;
    }

}