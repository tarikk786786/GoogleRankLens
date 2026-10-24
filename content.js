/**
 * GoogleRankLens — In-SERP Content Script
 * Scans Google SERP, computes organic ranking positions (#1 to #N),
 * highlights target domains, and displays the Google Ecosystem Intelligence HUD.
 * Author: tarikislam.in
 */

(() => {
  'use strict';

  // Prevent multiple injections
  if (window.__GRL_LOADED__) return;
  window.__GRL_LOADED__ = true;

  let state = {
    query: '',
    resultStats: '',
    organicResults: [],
    targetRank: null,
    settings: {
      targetDomains: ['dezo.in', 'tarikislam.in'],
      showBadges: true,
      showFloatingHUD: true,
      highlightTarget: true
    },
    intelligenceData: null,
    isHudCollapsed: false
  };

  // Debounce helper
  function debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * 1. Detect current search query
   */
  function detectQuery() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlQuery = urlParams.get('q');
      if (urlQuery && urlQuery.trim()) {
        return urlQuery.trim();
      }
      const searchInput = document.querySelector('input[name="q"], textarea[name="q"]');
      if (searchInput && searchInput.value) {
        return searchInput.value.trim();
      }
    } catch (e) {
      console.warn('[GoogleRankLens] Query detect error:', e);
    }
    return '';
  }

  /**
   * 2. Extract Google #result-stats
   */
  function detectResultStats() {
    const statsEl = document.getElementById('result-stats');
    return statsEl ? statsEl.textContent.trim() : '';
  }

  /**
   * 3. Traverse and identify organic search result elements
   */
  function identifyOrganicResults() {
    const results = [];
    state.targetRank = null;

    // Standard organic container selectors on Google
    // Select all potential result card blocks
    const potentialCards = document.querySelectorAll(
      '#search div.g:not(.kno-kp), #rso div.g:not(.kno-kp), div[data-sokoban-container] div.g, div.MjjYud > div.g, div.tF2Cxc'
    );

    let rankCounter = 0;
    const seenUrls = new Set();

    potentialCards.forEach(card => {
      // Exclude Ads, People Also Ask, Knowledge Panels, and Carousels
      if (card.closest('#taw, #bottomads, div.uEierd, div[data-text-ad], div.related-question-pair, div.kno-kp, div#rhs, g-scrolling-carousel')) {
        return;
      }

      // Find primary link anchor containing <h3>
      const titleLink = card.querySelector('a:has(h3)') || card.querySelector('a[href^="http"] h3')?.closest('a');
      if (!titleLink) return;

      const href = titleLink.href;
      if (!href || href.startsWith('javascript:') || href.includes('google.com/search') || href.includes('webcache.googleusercontent.com')) {
        return;
      }

      // Avoid duplicate sub-links within same snippet
      let cleanUrl;
      try {
        const parsed = new URL(href);
        cleanUrl = parsed.origin + parsed.pathname;
      } catch (e) {
        cleanUrl = href;
      }

      if (seenUrls.has(cleanUrl)) return;
      seenUrls.add(cleanUrl);

      rankCounter++;
      const currentRank = rankCounter;

      let domain = '';
      try {
        domain = new URL(href).hostname.replace(/^www\./, '');
      } catch (e) {
        domain = href;
      }

      const h3El = titleLink.querySelector('h3');
      const title = h3El ? h3El.textContent.trim() : titleLink.textContent.trim();

      // Check if matches target domain
      const isTarget = isTargetDomain(domain);
      if (isTarget && state.targetRank === null) {
        state.targetRank = currentRank;
      }

      results.push({
        rank: currentRank,
        cardElement: card,
        anchorElement: titleLink,
        url: href,
        domain,
        title,
        isTarget
      });
    });

    state.organicResults = results;
    return results;
  }

  function isTargetDomain(domain) {
    if (!state.settings.targetDomains || !Array.isArray(state.settings.targetDomains)) return false;
    const clean = domain.toLowerCase();
    return state.settings.targetDomains.some(target => {
      const t = target.trim().toLowerCase().replace(/^www\./, '');
      return t && (clean === t || clean.endsWith('.' + t));
    });
  }

  /**
   * 4. Inject Rank Badges into the DOM
   */
  function renderRankBadges() {
    if (!state.settings.showBadges) {
      document.querySelectorAll('.grl-badge-wrapper').forEach(el => el.remove());
      return;
    }

    state.organicResults.forEach(item => {
      if (item.cardElement.dataset.grlInjected === 'true') {
        // Update target status if changed
        if (item.isTarget && state.settings.highlightTarget) {
          item.cardElement.classList.add('grl-target-container');
        } else {
          item.cardElement.classList.remove('grl-target-container');
        }
        return;
      }

      item.cardElement.dataset.grlInjected = 'true';

      if (item.isTarget && state.settings.highlightTarget) {
        item.cardElement.classList.add('grl-target-container');
      }

      const badgeWrapper = document.createElement('div');
      badgeWrapper.className = 'grl-badge-wrapper';

      // Rank Pill
      const rankBadge = document.createElement('span');
      rankBadge.className = `grl-rank-badge ${item.isTarget ? 'grl-target-badge' : ''}`;
      rankBadge.innerHTML = `
        <span class="grl-rank-num">${item.isTarget ? '🎯 #' : '#'}${item.rank}</span>
        <span class="grl-rank-type">${item.isTarget ? 'TARGET MATCH' : 'ORGANIC'}</span>
      `;

      // Domain Badge
      const domainBadge = document.createElement('span');
      domainBadge.className = 'grl-domain-badge';
      domainBadge.textContent = item.domain;
      domainBadge.title = item.url;

      // Copy Link Button
      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'grl-copy-btn';
      copyBtn.textContent = 'Copy';
      copyBtn.title = 'Copy Result URL';
      copyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(item.url).then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
        });
      });

      badgeWrapper.appendChild(rankBadge);
      badgeWrapper.appendChild(domainBadge);
      badgeWrapper.appendChild(copyBtn);

      // Prepend to card or insert before title anchor
      if (item.anchorElement && item.anchorElement.parentNode) {
        item.anchorElement.parentNode.insertBefore(badgeWrapper, item.anchorElement);
      } else {
        item.cardElement.prepend(badgeWrapper);
      }
    });
  }

  /**
   * 5. In-SERP Floating HUD
   */
  function renderFloatingHUD() {
    if (!state.settings.showFloatingHUD || !state.query) {
      const existing = document.getElementById('grl-hud-root');
      if (existing) existing.remove();
      return;
    }

    let hudRoot = document.getElementById('grl-hud-root');
    if (!hudRoot) {
      hudRoot = document.createElement('div');
      hudRoot.id = 'grl-hud-root';
      document.body.appendChild(hudRoot);
    }

    if (state.isHudCollapsed) {
      hudRoot.innerHTML = `
        <div class="grl-hud-pill" id="grl-btn-expand" title="Click to expand GoogleRankLens HUD">
          <div class="grl-pulse-dot"></div>
          <span>GoogleRankLens</span>
          ${state.targetRank ? `<span style="color:#10b981;font-weight:700;">#${state.targetRank}</span>` : `<span style="color:#94a3b8;">${state.organicResults.length} Ranks</span>`}
        </div>
      `;
      document.getElementById('grl-btn-expand')?.addEventListener('click', () => {
        state.isHudCollapsed = false;
        renderFloatingHUD();
      });
      return;
    }

    const intel = state.intelligenceData || {};
    const ai = intel.aiMetrics || {};
    const suggestions = intel.googleSuggest || [];

    hudRoot.innerHTML = `
      <div class="grl-hud-panel">
        <!-- Header -->
        <div class="grl-hud-header">
          <div class="grl-hud-brand">
            <span>⌕ GoogleRankLens</span>
            <span class="grl-brand-badge">SERP Intelligence</span>
          </div>
          <div class="grl-hud-controls">
            <button class="grl-icon-btn" id="grl-btn-collapse" title="Collapse HUD">─</button>
            <button class="grl-icon-btn" id="grl-btn-close" title="Close HUD">✕</button>
          </div>
        </div>

        <!-- Body -->
        <div class="grl-hud-body">
          <!-- Active Query -->
          <div class="grl-query-box">
            <div class="grl-query-label">Active Google Query</div>
            <div class="grl-query-text" title="${escapeHtml(state.query)}">${escapeHtml(state.query)}</div>
          </div>

          <!-- Target Match Status -->
          <div class="grl-target-banner ${state.targetRank ? '' : 'not-found'}">
            <div>
              <span style="color: #94a3b8; font-size: 11px;">Target Domain: </span>
              <span class="grl-target-domain">${escapeHtml(state.settings.targetDomains[0] || 'None')}</span>
            </div>
            ${state.targetRank 
              ? `<span class="grl-target-rank-pill">🎯 Rank #${state.targetRank}</span>` 
              : `<span style="font-size:11px;color:#f59e0b;font-weight:600;">Not in Top ${state.organicResults.length}</span>`
            }
          </div>

          <!-- Metrics Grid -->
          <div class="grl-metrics-grid">
            <!-- Search Volume Tier -->
            <div class="grl-metric-card">
              <div class="grl-metric-header">
                <span>Search Volume</span>
                <span style="font-size:8px;color:#38bdf8;">LIVE</span>
              </div>
              <div class="grl-metric-value" style="color:#38bdf8;">
                ${ai.volumeTier || 'Analyzing...'}
              </div>
              <div class="grl-metric-sub">
                ${ai.volumeNumericEst ? `~${ai.volumeNumericEst.toLocaleString()} est/mo` : 'Google SERP model'}
              </div>
            </div>

            <!-- SEO Difficulty & Intent -->
            <div class="grl-metric-card">
              <div class="grl-metric-header">
                <span>Competition</span>
                <span class="grl-intent-pill grl-intent-${(ai.intent || 'info').toLowerCase()}">${ai.intent || 'INFO'}</span>
              </div>
              <div class="grl-metric-value" style="color: ${getDifficultyColor(ai.competitionScore)};">
                ${ai.competitionScore !== undefined ? `${ai.competitionScore}/100` : '--'}
                <span style="font-size:10px;font-weight:400;color:#94a3b8;">${ai.competitionTier || ''}</span>
              </div>
              <div class="grl-metric-sub">Est. CPC: ${ai.cpcEstUsd || '$1.00 - $2.50'}</div>
            </div>

            <!-- Total Results Indexed -->
            <div class="grl-metric-card">
              <div class="grl-metric-header">Indexed Results</div>
              <div class="grl-metric-value">${intel.totalIndexed || 'Google Index'}</div>
              <div class="grl-metric-sub">${intel.searchDurationSec ? `${intel.searchDurationSec}s search time` : 'Indexed web pages'}</div>
            </div>

            <!-- Organic Items on Page -->
            <div class="grl-metric-card">
              <div class="grl-metric-header">SERP Organics</div>
              <div class="grl-metric-value" style="color:#10b981;">${state.organicResults.length} Results</div>
              <div class="grl-metric-sub">Numbered #1 to #${state.organicResults.length}</div>
            </div>
          </div>

          <!-- Google Suggest Live Chips -->
          ${suggestions.length > 0 ? `
            <div class="grl-suggestions-box">
              <div class="grl-suggestions-title">
                <span>Google Suggest Autocomplete</span>
                <span style="font-size:9px;color:#38bdf8;">Real-Time</span>
              </div>
              <div class="grl-chip-container">
                ${suggestions.map(sugg => `
                  <a href="https://www.google.com/search?q=${encodeURIComponent(sugg)}" class="grl-suggest-chip" title="Search for '${escapeHtml(sugg)}'">
                    + ${escapeHtml(sugg)}
                  </a>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Source Tag -->
        <div class="grl-source-tag">Source: ${escapeHtml(intel.dataSource || 'Google Search Infrastructure')}</div>

        <!-- Footer Actions -->
        <div class="grl-actions-footer">
          <button class="grl-action-btn primary" id="grl-btn-export-csv" title="Export full SERP table to CSV">
            📥 Export CSV
          </button>
          <button class="grl-action-btn" id="grl-btn-copy-urls" title="Copy all organic URLs">
            📋 Copy URLs
          </button>
          <button class="grl-action-btn" id="grl-btn-toggle-badges" title="Toggle SERP badges visibility">
            👁 Badges
          </button>
        </div>
      </div>
    `;

    // Event handlers
    document.getElementById('grl-btn-collapse')?.addEventListener('click', () => {
      state.isHudCollapsed = true;
      renderFloatingHUD();
    });

    document.getElementById('grl-btn-close')?.addEventListener('click', () => {
      state.settings.showFloatingHUD = false;
      renderFloatingHUD();
    });

    document.getElementById('grl-btn-export-csv')?.addEventListener('click', () => {
      exportSerpToCSV();
    });

    document.getElementById('grl-btn-copy-urls')?.addEventListener('click', (e) => {
      const urls = state.organicResults.map(r => r.url).join('\n');
      navigator.clipboard.writeText(urls).then(() => {
        const btn = e.target.closest('button');
        const orig = btn.innerHTML;
        btn.innerHTML = '✓ Copied!';
        setTimeout(() => { btn.innerHTML = orig; }, 1500);
      });
    });

    document.getElementById('grl-btn-toggle-badges')?.addEventListener('click', () => {
      state.settings.showBadges = !state.settings.showBadges;
      renderRankBadges();
      chrome.runtime.sendMessage({
        action: 'SAVE_SETTINGS',
        settings: { showBadges: state.settings.showBadges }
      });
    });
  }

  function getDifficultyColor(score) {
    if (score === undefined || score === null) return '#38bdf8';
    if (score < 40) return '#10b981'; // Green
    if (score < 70) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m]));
  }

  /**
   * 6. Export SERP results to CSV (RFC-4180 compliant with formula injection protection)
   */
  function exportSerpToCSV() {
    if (state.organicResults.length === 0) {
      alert('No organic results to export.');
      return;
    }

    const headers = ['Rank', 'Domain', 'Title', 'URL', 'Target Match'];
    const rows = state.organicResults.map(item => [
      item.rank.toString(),
      item.domain,
      sanitizeCsvField(item.title),
      item.url,
      item.isTarget ? 'YES' : 'NO'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `GoogleRankLens_${(state.query || 'serp').replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function sanitizeCsvField(field) {
    if (!field) return '';
    const clean = String(field).trim();
    // Prevent spreadsheet formula execution injection
    if (/^[=+@-]/i.test(clean)) {
      return `'${clean}`;
    }
    return clean;
  }

  /**
   * 7. Fetch Unified Intelligence from Background Service Worker
   */
  async function fetchIntelligence() {
    if (!state.query) return;
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'GET_KEYWORD_INTELLIGENCE',
        query: state.query,
        resultStats: state.resultStats
      });

      if (response && response.success && response.data) {
        state.intelligenceData = response.data;
        renderFloatingHUD();
      }
    } catch (err) {
      console.warn('[GoogleRankLens] Intelligence fetch skipped:', err.message);
    }
  }

  /**
   * 8. Full Page Scan & Initialization
   */
  async function init() {
    state.query = detectQuery();
    state.resultStats = detectResultStats();

    // Fetch user settings
    try {
      const settings = await chrome.runtime.sendMessage({ action: 'GET_SETTINGS' });
      if (settings) {
        state.settings = { ...state.settings, ...settings };
      }
    } catch (e) {
      // Background worker might be waking up
    }

    identifyOrganicResults();
    renderRankBadges();
    renderFloatingHUD();

    if (state.query) {
      fetchIntelligence();
    }

    // Listen to messages from popup or background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'GET_SERP_STATUS') {
        sendResponse({
          count: state.organicResults.length,
          targetRank: state.targetRank,
          query: state.query
        });
        return;
      }
      if (request.action === 'TRIGGER_EXPORT_CSV') {
        exportSerpToCSV();
        sendResponse({ success: true });
        return;
      }
      if (request.action === 'TRIGGER_COPY_URLS') {
        const urls = state.organicResults.map(r => r.url).join('\n');
        navigator.clipboard.writeText(urls);
        sendResponse({ success: true });
        return;
      }
    });
  }

  // Debounced scan for continuous scroll and dynamic page updates
  const handleMutations = debounce(() => {
    const prevCount = state.organicResults.length;
    identifyOrganicResults();
    if (state.organicResults.length !== prevCount) {
      renderRankBadges();
      renderFloatingHUD();
    }
  }, 200);

  // Set up MutationObserver
  const observer = new MutationObserver(handleMutations);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
