/**
 * GoogleRankLens — Options Controller
 * Author: tarikislam.in
 */

document.addEventListener('DOMContentLoaded', async () => {
  const geminiKeyEl = document.getElementById('gemini-key');
  const geminiModelEl = document.getElementById('gemini-model');
  const targetDomainsEl = document.getElementById('target-domains');
  const toggleHighlightEl = document.getElementById('toggle-highlight');
  const toggleBadgesEl = document.getElementById('toggle-badges');
  const toggleHudEl = document.getElementById('toggle-hud');
  const btnTestKey = document.getElementById('btn-test-key');
  const testKeyResult = document.getElementById('test-key-result');
  const btnClearCache = document.getElementById('btn-clear-cache');
  const cacheStatus = document.getElementById('cache-status');
  const btnSave = document.getElementById('btn-save');
  const saveToast = document.getElementById('save-toast');

  // Load current settings
  try {
    const settings = await chrome.runtime.sendMessage({ action: 'GET_SETTINGS' });
    if (settings) {
      geminiKeyEl.value = settings.geminiApiKey || '';
      geminiModelEl.value = settings.geminiModel || 'gemini-1.5-flash';
      targetDomainsEl.value = Array.isArray(settings.targetDomains) ? settings.targetDomains.join(', ') : '';
      toggleHighlightEl.checked = settings.highlightTarget !== false;
      toggleBadgesEl.checked = settings.showBadges !== false;
      toggleHudEl.checked = settings.showFloatingHUD !== false;
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }

  // Save changes
  btnSave.addEventListener('click', async () => {
    const rawDomains = targetDomainsEl.value
      .split(',')
      .map(d => d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0])
      .filter(d => d.length > 0);

    const updated = {
      geminiApiKey: geminiKeyEl.value.trim(),
      geminiModel: geminiModelEl.value,
      targetDomains: rawDomains,
      highlightTarget: toggleHighlightEl.checked,
      showBadges: toggleBadgesEl.checked,
      showFloatingHUD: toggleHudEl.checked
    };

    try {
      await chrome.runtime.sendMessage({
        action: 'SAVE_SETTINGS',
        settings: updated
      });

      saveToast.style.display = 'inline-block';
      setTimeout(() => {
        saveToast.style.display = 'none';
      }, 2500);
    } catch (err) {
      alert('Error saving settings: ' + err.message);
    }
  });

  // Test API Key
  btnTestKey.addEventListener('click', async () => {
    const key = geminiKeyEl.value.trim();
    if (!key) {
      testKeyResult.style.color = '#ef4444';
      testKeyResult.textContent = 'Please enter an API key to test.';
      return;
    }

    testKeyResult.style.color = '#38bdf8';
    testKeyResult.textContent = 'Testing Google Gemini endpoint...';

    try {
      const res = await chrome.runtime.sendMessage({
        action: 'TEST_API_KEY',
        apiKey: key,
        model: geminiModelEl.value
      });

      if (res && res.success) {
        testKeyResult.style.color = '#10b981';
        testKeyResult.textContent = '✓ Successfully connected to Google Gemini API!';
      } else {
        testKeyResult.style.color = '#ef4444';
        testKeyResult.textContent = '✗ Connection failed: ' + (res.error || 'Unknown error');
      }
    } catch (err) {
      testKeyResult.style.color = '#ef4444';
      testKeyResult.textContent = '✗ Test failed: ' + err.message;
    }
  });

  // Clear Cache
  btnClearCache.addEventListener('click', async () => {
    try {
      const res = await chrome.runtime.sendMessage({ action: 'CLEAR_CACHE' });
      cacheStatus.textContent = `✓ Purged ${res.count || 0} cached query records.`;
      setTimeout(() => { cacheStatus.textContent = ''; }, 3000);
    } catch (err) {
      cacheStatus.textContent = 'Failed to clear cache: ' + err.message;
    }
  });
});
