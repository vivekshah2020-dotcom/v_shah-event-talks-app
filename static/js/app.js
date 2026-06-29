document.addEventListener('DOMContentLoaded', () => {
    // State Variables
    let allNotes = [];
    let activeCategory = 'all';
    let searchQuery = '';
    let selectedNoteForTweet = null;

    // DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search');
    const categoryFilters = document.getElementById('category-filters');
    
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');
    const retryBtn = document.getElementById('retry-btn');
    const emptyState = document.getElementById('empty-state');
    const notesGrid = document.getElementById('notes-grid');
    const lastUpdatedEl = document.getElementById('last-updated');

    // Modal Elements
    const tweetModal = document.getElementById('tweet-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
    const shareTweetBtn = document.getElementById('share-tweet-btn');
    const modalNoteTitle = document.getElementById('modal-note-title');
    const modalNoteDate = document.getElementById('modal-note-date');
    const tweetTextarea = document.getElementById('tweet-text');
    const charCountEl = document.getElementById('char-count');

    // Fetch Release Notes from Flask API
    async function fetchReleaseNotes() {
        showLoading(true);
        refreshBtn.classList.add('loading');

        try {
            const response = await fetch('/api/release-notes');
            const data = await response.json();

            if (data.status === 'success') {
                allNotes = data.notes;
                if (data.updated) {
                    lastUpdatedEl.innerHTML = `<i class="fa-regular fa-clock"></i> Updated: ${data.updated}`;
                } else {
                    lastUpdatedEl.innerHTML = `<i class="fa-regular fa-clock"></i> Live Feed Synced`;
                }
                renderNotes();
                showToast('Release notes updated successfully!');
            } else {
                showError(data.message || 'Failed to fetch release notes.');
            }
        } catch (err) {
            showError('Network connection error or server offline.');
            console.error(err);
        } finally {
            showLoading(false);
            refreshBtn.classList.remove('loading');
        }
    }

    // Filter notes based on active category and search query
    function getFilteredNotes() {
        return allNotes.filter(note => {
            const matchesCategory = activeCategory === 'all' || 
                (note.categories && note.categories.includes(activeCategory));

            const matchesSearch = searchQuery === '' || 
                note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                note.plain_text.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesCategory && matchesSearch;
        });
    }

    // Render filtered and searched notes
    function renderNotes() {
        notesGrid.innerHTML = '';
        const filtered = getFilteredNotes();

        if (filtered.length === 0) {
            notesGrid.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        notesGrid.classList.remove('hidden');

        filtered.forEach(note => {
            const card = createNoteCard(note);
            notesGrid.appendChild(card);
        });
    }

    // Create single Card HTML element
    function createNoteCard(note) {
        const card = document.createElement('div');
        card.className = 'note-card';

        // Badges HTML
        const badgesHtml = note.categories.map(cat => {
            let badgeClass = 'badge-default';
            if (cat === 'Feature') badgeClass = 'badge-feature';
            if (cat === 'Changed') badgeClass = 'badge-changed';
            if (cat === 'Deprecated') badgeClass = 'badge-deprecated';
            if (cat === 'Preview') badgeClass = 'badge-preview';
            return `<span class="category-badge ${badgeClass}">${cat}</span>`;
        }).join(' ');

        card.innerHTML = `
            <div class="card-header">
                <div class="badge-group">${badgesHtml}</div>
                <span class="card-date">${note.published}</span>
            </div>
            <h3 class="card-title">${escapeHtml(note.title)}</h3>
            <div class="card-body">${note.content_html}</div>
            <div class="card-footer">
                <a href="${note.link}" target="_blank" rel="noopener noreferrer" class="card-link">
                    <span>View Docs</span> <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
                <div class="card-actions">
                    <button class="action-btn copy-btn" title="Copy release update text to clipboard">
                        <i class="fa-regular fa-copy"></i> <span>Copy</span>
                    </button>
                    <button class="action-btn share-tweet-trigger" data-id="${note.id}" title="Tweet this update">
                        <i class="fa-brands fa-x-twitter"></i> <span>Tweet</span>
                    </button>
                </div>
            </div>
        `;

        // Attach Button listeners
        const copyBtn = card.querySelector('.copy-btn');
        copyBtn.addEventListener('click', () => copyNoteToClipboard(note, copyBtn));

        const tweetBtn = card.querySelector('.share-tweet-trigger');
        tweetBtn.addEventListener('click', () => openTweetModal(note));

        return card;
    }

    // Copy Note to Clipboard Feature
    async function copyNoteToClipboard(note, buttonEl) {
        const textToCopy = `Google BigQuery Update: ${note.title}\nDate: ${note.published}\n\n${note.plain_text}\n\nRead more: ${note.link}`;
        try {
            await navigator.clipboard.writeText(textToCopy);
            showToast('Copied update to clipboard!');

            // Visual feedback on button
            const originalHtml = buttonEl.innerHTML;
            buttonEl.innerHTML = `<i class="fa-solid fa-check" style="color: #34a853;"></i> <span>Copied!</span>`;
            setTimeout(() => {
                buttonEl.innerHTML = originalHtml;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            showToast('Failed to copy to clipboard.');
        }
    }

    // Export to CSV Feature
    function exportToCSV() {
        const notesToExport = getFilteredNotes();

        if (notesToExport.length === 0) {
            showToast('No notes available to export.');
            return;
        }

        // Define CSV headers
        const headers = ['Title', 'Published Date', 'Categories', 'Documentation Link', 'Summary'];
        
        // Convert notes to CSV rows
        const rows = notesToExport.map(note => [
            escapeCsvCell(note.title),
            escapeCsvCell(note.published),
            escapeCsvCell(note.categories ? note.categories.join(', ') : ''),
            escapeCsvCell(note.link),
            escapeCsvCell(note.plain_text)
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        // Trigger file download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `bigquery_release_notes_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast(`Exported ${notesToExport.length} release notes to CSV!`);
    }

    function escapeCsvCell(cellText) {
        if (!cellText) return '""';
        const str = String(cellText).replace(/"/g, '""');
        return `"${str}"`;
    }

    // Modal Handling
    function openTweetModal(note) {
        selectedNoteForTweet = note;
        modalNoteTitle.textContent = note.title;
        modalNoteDate.innerHTML = `<i class="fa-regular fa-calendar"></i> ${note.published}`;
        
        // Construct default tweet text
        const baseMessage = `🚀 BigQuery Update: ${note.title}\n\nCheck out the latest features in Google Cloud BigQuery!`;
        tweetTextarea.value = baseMessage;
        updateCharCount();

        tweetModal.classList.remove('hidden');
    }

    function closeTweetModal() {
        tweetModal.classList.add('hidden');
        selectedNoteForTweet = null;
    }

    function updateCharCount() {
        const len = tweetTextarea.value.length;
        charCountEl.textContent = len;
        if (len > 260) {
            charCountEl.style.color = '#ea4335';
        } else {
            charCountEl.style.color = 'var(--text-dim)';
        }
    }

    function launchTwitterIntent() {
        if (!selectedNoteForTweet) return;

        let tweetBody = tweetTextarea.value.trim();

        // Collect checked hashtags
        const checkboxes = document.querySelectorAll('.hashtag-chips input[type="checkbox"]:checked');
        const hashtags = Array.from(checkboxes).map(cb => cb.value).join(' ');

        if (hashtags) {
            tweetBody += `\n\n${hashtags}`;
        }

        // Add doc link if available
        if (selectedNoteForTweet.link) {
            tweetBody += `\n${selectedNoteForTweet.link}`;
        }

        // Encode for Twitter Intent URL
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetBody)}`;
        window.open(twitterUrl, '_blank');

        closeTweetModal();
        showToast('Opening X (Twitter) to publish your tweet!');
    }

    // UI Helpers
    function showLoading(isLoading) {
        if (isLoading) {
            loadingState.classList.remove('hidden');
            errorState.classList.add('hidden');
            notesGrid.classList.add('hidden');
            emptyState.classList.add('hidden');
        } else {
            loadingState.classList.add('hidden');
        }
    }

    function showError(msg) {
        loadingState.classList.add('hidden');
        notesGrid.classList.add('hidden');
        emptyState.classList.add('hidden');
        errorMessage.textContent = msg;
        errorState.classList.remove('hidden');
    }

    function showToast(message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        toastMessage.textContent = message;
        toast.classList.remove('hidden');

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3500);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Event Listeners
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    exportCsvBtn.addEventListener('click', exportToCSV);
    retryBtn.addEventListener('click', fetchReleaseNotes);

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        if (searchQuery) {
            clearSearchBtn.classList.remove('hidden');
        } else {
            clearSearchBtn.classList.add('hidden');
        }
        renderNotes();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.classList.add('hidden');
        renderNotes();
    });

    categoryFilters.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-chip')) {
            document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
            e.target.classList.add('active');
            activeCategory = e.target.dataset.category;
            renderNotes();
        }
    });

    closeModalBtn.addEventListener('click', closeTweetModal);
    cancelTweetBtn.addEventListener('click', closeTweetModal);
    shareTweetBtn.addEventListener('click', launchTwitterIntent);
    tweetTextarea.addEventListener('input', updateCharCount);

    // Close modal on background overlay click
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) closeTweetModal();
    });

    // Initial Fetch on load
    fetchReleaseNotes();
});
