// USPTO Patent Search Web Interface

let currentResults = [];
let selectedResults = new Set();
let currentDocumentIndex = -1;

document.addEventListener('DOMContentLoaded', function() {
    const searchBtn = document.getElementById('search-btn');
    const clearBtn = document.getElementById('clear-btn');
    const printBtn = document.getElementById('print-btn');
    const downloadBtn = document.getElementById('download-btn');
    const selectAllResults = document.getElementById('select-all-results');
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    const resultsTbody = document.getElementById('results-tbody');
    const viewerContent = document.getElementById('viewer-content');
    const loading = document.getElementById('loading');
    const errorPanel = document.getElementById('error-panel');
    const resultsPanel = document.getElementById('results-panel');
    const resultsInfo = document.getElementById('results-info');
    const docCounter = document.getElementById('doc-counter');
    const closeViewer = document.getElementById('close-viewer');

    // Event listeners
    searchBtn.addEventListener('click', performSearch);
    clearBtn.addEventListener('click', clearForm);
    printBtn.addEventListener('click', printSelected);
    downloadBtn.addEventListener('click', downloadSelected);
    selectAllResults.addEventListener('click', toggleSelectAll);
    selectAllCheckbox.addEventListener('change', toggleSelectAll);
    closeViewer.addEventListener('click', closeDocumentViewer);

    // Allow Enter key to trigger search
    document.getElementById('query-text').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });


    async function performSearch() {
        const queryText = document.getElementById('query-text').value.trim();
        
        if (!queryText) {
            showError('Please enter a search query');
            return;
        }

        // Parse keywords from query text
        const keywords = queryText.split(/\s+/).filter(k => k.length > 0);
        if (keywords.length > 5) {
            showError('Maximum 5 keywords allowed');
            return;
        }

        const operator = document.getElementById('operator').value;
        const limit = 500; // Default limit

        // Show loading
        loading.classList.remove('hidden');
        hideError();

        try {
            const response = await fetch('/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    keywords: keywords,
                    operator: operator,
                    limit: limit
                })
            });

            const data = await response.json();

            if (data.error) {
                showError(data.error);
                return;
            }

            displayResults(data);

        } catch (error) {
            showError('Error performing search: ' + error.message);
        } finally {
            loading.classList.add('hidden');
        }
    }

    function displayResults(data) {
        currentResults = data.results || [];
        selectedResults.clear();
        
        resultsPanel.style.display = 'flex';
        resultsPanel.classList.remove('hidden');

        const total = data.total || 0;
        const shown = data.shown || 0;
        resultsInfo.textContent = `Found ${total.toLocaleString()} total results. Showing ${shown} results.`;

        resultsTbody.innerHTML = '';

        if (currentResults.length > 0) {
            currentResults.forEach((result, index) => {
                const row = createResultRow(result, index + 1);
                resultsTbody.appendChild(row);
            });
        } else {
            resultsTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No results found.</td></tr>';
        }

        updateActionButtons();
    }

    function createResultRow(result, index) {
        const tr = document.createElement('tr');
        tr.dataset.index = index - 1;
        
        // Get document ID
        const docId = result.publicationNumber || result.patent_number || result.id || 'N/A';
        
        // Get date
        const date = result.officeActionDate || result.publication_date || result.createDateTime || 'N/A';
        
        // Get title or first field
        let title = 'N/A';
        if (result.inventorNameText) {
            title = Array.isArray(result.inventorNameText) 
                ? result.inventorNameText[0] 
                : result.inventorNameText;
        } else if (result.qualitySummaryText) {
            title = String(result.qualitySummaryText).substring(0, 50) + '...';
        }

        tr.innerHTML = `
            <td><input type="checkbox" class="result-checkbox" data-index="${index - 1}"></td>
            <td>${index}</td>
            <td>${escapeHtml(String(docId))}</td>
            <td>${escapeHtml(String(date))}</td>
            <td>${escapeHtml(String(title))}</td>
        `;

        // Add click handler to view document
        tr.addEventListener('click', function(e) {
            if (e.target.type !== 'checkbox') {
                viewDocument(index - 1);
            }
        });

        // Add checkbox change handler
        const checkbox = tr.querySelector('.result-checkbox');
        checkbox.addEventListener('change', function(e) {
            e.stopPropagation();
            const idx = parseInt(this.dataset.index);
            if (this.checked) {
                selectedResults.add(idx);
            } else {
                selectedResults.delete(idx);
            }
            updateActionButtons();
            updateSelectAllCheckbox();
        });

        return tr;
    }

    function viewDocument(index) {
        if (index < 0 || index >= currentResults.length) return;

        currentDocumentIndex = index;
        const result = currentResults[index];
        
        docCounter.textContent = `Doc ${index + 1} of ${currentResults.length}`;
        
        // Build document details HTML
        let html = '<div class="document-details">';
        
        // Document ID
        const docId = result.publicationNumber || result.patent_number || result.id || 'N/A';
        html += `<h2>${escapeHtml(String(docId))}</h2>`;
        
        // Display all fields
        const fieldOrder = [
            'publicationNumber', 'patent_number', 'id',
            'patentApplicationNumber', 'inventorNameText',
            'officeActionDate', 'publication_date', 'createDateTime',
            'techCenter', 'countryCode', 'citationCategoryCode',
            'qualitySummaryText', 'passageLocationText', 'groupArtUnitNumber',
            'workGroupNumber', 'kindCode', 'nplIndicator'
        ];

        fieldOrder.forEach(field => {
            if (result[field] !== undefined && result[field] !== null) {
                html += createFieldHtml(field, result[field]);
            }
        });

        // Add remaining fields
        Object.keys(result).forEach(key => {
            if (!fieldOrder.includes(key) && result[key] !== undefined && result[key] !== null) {
                html += createFieldHtml(key, result[key]);
            }
        });

        html += '</div>';
        viewerContent.innerHTML = html;
    }

    function createFieldHtml(key, value) {
        let displayValue = value;
        
        if (Array.isArray(value)) {
            displayValue = value.join(', ');
        } else if (typeof value === 'object') {
            displayValue = JSON.stringify(value, null, 2);
        } else {
            displayValue = String(value);
        }

        // Format field name
        const fieldName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

        return `
            <div class="field-group">
                <span class="field-label">${escapeHtml(fieldName)}:</span>
                <span class="field-value">${escapeHtml(String(displayValue))}</span>
            </div>
        `;
    }

    function toggleSelectAll() {
        const checkboxes = document.querySelectorAll('.result-checkbox');
        const isChecked = selectAllCheckbox.checked;
        
        checkboxes.forEach((cb, index) => {
            cb.checked = isChecked;
            const idx = parseInt(cb.dataset.index);
            if (isChecked) {
                selectedResults.add(idx);
            } else {
                selectedResults.delete(idx);
            }
        });
        
        updateActionButtons();
    }

    function updateSelectAllCheckbox() {
        const checkboxes = document.querySelectorAll('.result-checkbox');
        const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
        selectAllCheckbox.checked = checkedCount === checkboxes.length && checkboxes.length > 0;
    }

    function updateActionButtons() {
        const hasSelection = selectedResults.size > 0;
        printBtn.disabled = !hasSelection;
        downloadBtn.disabled = !hasSelection;
    }

    function printSelected() {
        if (selectedResults.size === 0) return;

        const selected = Array.from(selectedResults).map(idx => currentResults[idx]);
        const printWindow = window.open('', '_blank');
        
        let html = '<html><head><title>USPTO Patent Search Results</title>';
        html += '<style>body{font-family:Arial,sans-serif;padding:20px;}';
        html += 'h1{color:#0066cc;}table{border-collapse:collapse;width:100%;margin-top:20px;}';
        html += 'th,td{border:1px solid #ddd;padding:8px;text-align:left;}';
        html += 'th{background-color:#f5f5f5;}</style></head><body>';
        html += '<h1>USPTO Patent Search Results</h1>';
        html += '<p>Selected Results: ' + selectedResults.size + '</p>';
        html += '<table><tr><th>Document ID</th><th>Date</th><th>Details</th></tr>';
        
        selected.forEach(result => {
            const docId = result.publicationNumber || result.patent_number || result.id || 'N/A';
            const date = result.officeActionDate || result.publication_date || 'N/A';
            html += `<tr><td>${escapeHtml(String(docId))}</td><td>${escapeHtml(String(date))}</td>`;
            html += `<td>${JSON.stringify(result, null, 2)}</td></tr>`;
        });
        
        html += '</table></body></html>';
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    }

    function downloadSelected() {
        if (selectedResults.size === 0) return;

        const selected = Array.from(selectedResults).map(idx => currentResults[idx]);
        const dataStr = JSON.stringify(selected, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'uspto_patent_results.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function closeDocumentViewer() {
        viewerContent.innerHTML = '<p class="placeholder-text">Select a document from the results to view details</p>';
        currentDocumentIndex = -1;
        docCounter.textContent = 'Doc 0';
    }

    function clearForm() {
        document.getElementById('query-text').value = '';
        document.getElementById('operator').value = 'AND';
        document.getElementById('highlights').value = 'single';
        document.getElementById('show-errors').checked = true;
        document.getElementById('plurals').checked = true;
        document.getElementById('british').checked = true;
        
        resultsTbody.innerHTML = '';
        resultsInfo.textContent = '';
        selectedResults.clear();
        currentResults = [];
        updateActionButtons();
        closeDocumentViewer();
    }

    function showError(message) {
        errorPanel.classList.remove('hidden');
        document.getElementById('error-message').textContent = message;
        setTimeout(() => {
            hideError();
        }, 5000);
    }

    function hideError() {
        errorPanel.classList.add('hidden');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
