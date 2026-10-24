/**
 * GoogleRankLens — Popup Controller
 * Displays current search tab intelligence, target domain configuration, and quick exports.
 * Author: tarikislam.in
 */

document.addEventListener('DOMContentLoaded', async () => {
  const tabQueryEl = document.getElementById('tab-query');
  const targetInputEl = document.getElementById('target-domain-input');
  const btnSaveTarget = document.getElementById('btn-save-target');
  const targetDomainLabel = document.getElementById('target-domain-label');
  const targetRankResult = document.getElementById('target-rank-result');
  const targetRankBox = document.getElementById('target-rank-box');
  const metricVolumeEl = document.getElementById('metric-volume');
  const metricDiffEl = document.getElementById('metric-diff');
  const metricIntentEl = document.getElementById('metric-intent');
  const metricCountEl = document.getElementById('metric-organic-count');
  const btnExport = document.getElementById('btn-popup-export');
  const btnCopy = document.getElementById('btn-popup-copy');
  const linkOptions = document.getElementById('link-options');

  let currentSettings = null;
  let activeTabQuery = '';

  // 1. Load Settings
  try {
    currentSettings = await chrome.runtime.sendMessage({ action: 'GET_SETTINGS' });
    if (currentSettings && currentSettings.targetDomains) {
      const primaryTarget = currentSettings.targetDomains[0] || '';
      targetInputEl.value = primaryTarget;
      targetDomainLabel.textContent = primaryTarget || 'None';
    }
  } catch (e) {
    console.error('Settings load error:', e);
  }

  // 2. Query Active Tab
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];

    if (activeTab && activeTab.url && isGoogleSearchUrl(activeTab.url)) {
      const url = new URL(activeTab.url);
      activeTabQuery = url.searchParams.get('q') || '';
      tabQueryEl.textContent = activeTabQuery || 'Google Search (No Query)';

      if (activeTabQuery) {
        // Fetch intelligence for active query
        const intel = await chrome.runtime.sendMessage({
          action: 'GET_KEYWORD_INTELLIGENCE',
          query: activeTabQuery
        });

        if (intel && intel.success && intel.data) {
          const ai = intel.data.aiMetrics || {};
          metricVolumeEl.textContent = ai.volumeTier || 'Active';
          metricDiffEl.textContent = ai.competitionScore !== undefined ? `${ai.competitionScore}/100` : '--';
          metricIntentEl.textContent = ai.intent || 'Info';
        }
      }

      // Check results from content script via script execution or message
      try {
        const response = await chrome.tabs.sendMessage(activeTab.id, { action: 'GET_SERP_STATUS' });
        if (response && response.count !== undefined) {
          metricCountEl.textContent = `${response.count} Organics`;
          if (response.targetRank) {
            targetRankResult.textContent = `🎯 Rank #${response.targetRank}`;
            targetRankBox.classList.remove('not-found');
          } else {
            targetRankResult.textContent = `Not in Top ${response.count}`;
            targetRankBox.classList.add('not-found');
          }
        } else {
          metricCountEl.textContent = 'Active SERP';
          targetRankResult.textContent = 'Checking...';
        }
      } catch (err) {
        metricCountEl.textContent = 'Loaded';
        targetRankResult.textContent = 'Active Tab';
      }
    } else {
      tabQueryEl.textContent = 'Open Google Search to inspect';
      tabQueryEl.classList.add('status-non-google');
      metricVolumeEl.textContent = '--';
      metricDiffEl.textContent = '--';
      metricIntentEl.textContent = '--';
      metricCountEl.textContent = '--';
      targetRankResult.textContent = 'No Search Tab';
      targetRankBox.classList.add('not-found');
    }
  } catch (err) {
    console.error('Tab query error:', err);
  }

  // 3. Save Target Domain
  btnSaveTarget.addEventListener('click', async () => {
    const newDomain = targetInputEl.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    if (!newDomain) return;

    const updatedDomains = [newDomain];
    await chrome.runtime.sendMessage({
      action: 'SAVE_SETTINGS',
      settings: { targetDomains: updatedDomains }
    });

    targetDomainLabel.textContent = newDomain;
    btnSaveTarget.textContent = '✓ Saved';
    setTimeout(() => { btnSaveTarget.textContent = 'Save'; }, 1500);

    // Refresh active tab if it's Google
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0] && isGoogleSearchUrl(tabs[0].url)) {
      chrome.tabs.reload(tabs[0].id);
    }
  });

  // 4. Export CSV button
  btnExport.addEventListener('click', async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0] && isGoogleSearchUrl(tabs[0].url)) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'TRIGGER_EXPORT_CSV' });
      window.close();
    } else {
      alert('Please open a Google Search results page first.');
    }
  });

  // 5. Copy URLs button
  btnCopy.addEventListener('click', async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0] && isGoogleSearchUrl(tabs[0].url)) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'TRIGGER_COPY_URLS' });
      btnCopy.textContent = '✓ Copied!';
      setTimeout(() => { btnCopy.textContent = '📋 Copy URLs'; }, 1500);
    } else {
      alert('Please open a Google Search results page first.');
    }
  });

  // 6. Options Link
  linkOptions.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  function isGoogleSearchUrl(url) {
    if (!url) return false;
    return /https?:\/\/(www\.)?google\.[a-z.]+\/search/i.test(url);
  }
});
