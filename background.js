/**
 * GoogleRankLens — Background Service Worker
 * Orchestrates Google Suggest API, Gemini AI Intelligence, caching, and settings.
 * Author: tarikislam.in
 */

const DEFAULT_SETTINGS = {
  geminiApiKey: '', // Set your Google Gemini API Key in the Extension Options/Popup
  geminiModel: 'gemini-1.5-flash',
  targetDomains: ['dezo.in', 'tarikislam.in'],
  showBadges: true,
  showFloatingHUD: true,
  highlightTarget: true,
  theme: 'dark'
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Initialize defaults on install
chrome.runtime.onInstalled.addListener(async (details) => {
  const existing = await chrome.storage.local.get('grl_settings');
  if (!existing.grl_settings) {
    await chrome.storage.local.set({ grl_settings: DEFAULT_SETTINGS });
    console.log('[GoogleRankLens] Default settings initialized.');
  }
});

// Main message router
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_SETTINGS') {
    getSettings().then(sendResponse);
    return true; // Keep message channel open for async response
  }

  if (request.action === 'SAVE_SETTINGS') {
    saveSettings(request.settings).then(sendResponse);
    return true;
  }

  if (request.action === 'GET_KEYWORD_INTELLIGENCE') {
    getKeywordIntelligence(request.query, request.resultStats, request.forceRefresh)
      .then(sendResponse)
      .catch(error => {
        console.error('[GoogleRankLens] Intelligence Error:', error);
        sendResponse({
          success: false,
          error: error.message || 'Unknown error occurred',
          data: null
        });
      });
    return true;
  }

  if (request.action === 'TEST_API_KEY') {
    testGeminiApiKey(request.apiKey, request.model).then(sendResponse);
    return true;
  }

  if (request.action === 'CLEAR_CACHE') {
    clearKeywordCache().then(sendResponse);
    return true;
  }
});

async function getSettings() {
  const data = await chrome.storage.local.get('grl_settings');
  return data.grl_settings || DEFAULT_SETTINGS;
}

async function saveSettings(newSettings) {
  const current = await getSettings();
  const merged = { ...current, ...newSettings };
  await chrome.storage.local.set({ grl_settings: merged });
  return { success: true, settings: merged };
}

/**
 * Fetches unified keyword intelligence from Google Suggest & Gemini AI
 */
async function getKeywordIntelligence(query, resultStats = '', forceRefresh = false) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new Error('Query string is required');
  }

  const cleanQuery = query.trim();
  const cacheKey = `grl_cache_${encodeURIComponent(cleanQuery.toLowerCase())}`;

  // Check Cache
  if (!forceRefresh) {
    const cachedEntry = await chrome.storage.local.get(cacheKey);
    if (cachedEntry[cacheKey]) {
      const entry = cachedEntry[cacheKey];
      if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
        return {
          success: true,
          data: { ...entry.data, cached: true }
        };
      }
    }
  }

  const settings = await getSettings();

  // 1. Fetch Real Google Suggest API Data
  let suggestions = [];
  try {
    suggestions = await fetchGoogleSuggest(cleanQuery);
  } catch (err) {
    console.warn('[GoogleRankLens] Google Suggest API notice:', err.message);
  }

  // 2. Parse Google Result Stats
  const parsedStats = parseGoogleResultStats(resultStats);

  // 3. Fetch Gemini AI SEO Intelligence (or heuristic calculation)
  let aiMetrics = null;
  let dataSource = 'Google Ecosystem';

  if (settings.geminiApiKey && settings.geminiApiKey.trim()) {
    try {
      aiMetrics = await fetchGeminiIntelligence(cleanQuery, settings.geminiApiKey, settings.geminiModel, parsedStats);
      dataSource = 'Google Gemini AI + Google Suggest';
    } catch (aiErr) {
      console.warn('[GoogleRankLens] Gemini API notice, falling back to algorithmic analysis:', aiErr.message);
      aiMetrics = calculateAlgorithmicMetrics(cleanQuery, parsedStats, suggestions);
      dataSource = 'Google SERP Index + Suggest Engine';
    }
  } else {
    aiMetrics = calculateAlgorithmicMetrics(cleanQuery, parsedStats, suggestions);
    dataSource = 'Google SERP Index + Suggest Engine';
  }

  const payload = {
    query: cleanQuery,
    googleSuggest: suggestions,
    totalIndexed: parsedStats.totalResultsFormatted,
    totalIndexedRaw: parsedStats.totalResultsNumber,
    searchDurationSec: parsedStats.durationSeconds,
    aiMetrics,
    dataSource,
    timestamp: Date.now()
  };

  // Save to Cache
  try {
    await chrome.storage.local.set({
      [cacheKey]: {
        timestamp: Date.now(),
        data: payload
      }
    });
  } catch (storageErr) {
    console.warn('[GoogleRankLens] Cache write skipped:', storageErr.message);
  }

  return {
    success: true,
    data: { ...payload, cached: false }
  };
}

/**
 * Calls authentic Google Suggest/Autocomplete API
 */
async function fetchGoogleSuggest(query) {
  const url = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Suggest returned HTTP ${response.status}`);
  }
  const raw = await response.json();
  // Standard format: [query, [sugg1, sugg2, ...], ...]
  if (Array.isArray(raw) && Array.isArray(raw[1])) {
    return raw[1].slice(0, 8); // Top 8 suggestions
  }
  return [];
}

/**
 * Extracts total results and query time from Google #result-stats
 * Handles: "About 1,420,000,000 results (0.42 seconds)" and multi-lingual variants
 */
function parseGoogleResultStats(statsText) {
  if (!statsText || typeof statsText !== 'string') {
    return {
      totalResultsFormatted: 'N/A',
      totalResultsNumber: 0,
      durationSeconds: '0.00'
    };
  }

  // Extract numbers
  // Matches "1,420,000,000" or "1 420 000 000" or "1.420.000.000"
  const numberMatch = statsText.match(/([\d\s,.]+)\s*(?:results|résultats|Ergebnisse|risultati|resultados|परिणाम)/i) 
    || statsText.match(/([\d\s,.]+)/);

  let totalResultsFormatted = 'N/A';
  let totalResultsNumber = 0;

  if (numberMatch && numberMatch[1]) {
    const rawNumStr = numberMatch[1].trim();
    // Clean to numeric string
    const cleanedDigits = rawNumStr.replace(/[^\d]/g, '');
    if (cleanedDigits.length > 0) {
      totalResultsNumber = parseInt(cleanedDigits, 10);
      totalResultsFormatted = formatBigNumber(totalResultsNumber);
    }
  }

  // Duration match: "(0.42 seconds)"
  const durationMatch = statsText.match(/\(([\d.,]+)\s*(?:seconds|s|secondes|Sekunden|segundos)/i);
  const durationSeconds = durationMatch ? durationMatch[1] : '0.40';

  return {
    totalResultsFormatted,
    totalResultsNumber,
    durationSeconds
  };
}

function formatBigNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + ' Billion';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + ' Million';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toLocaleString();
}

/**
 * Queries Google Gemini API for verified Search Intent, Volume Tier, Difficulty, and CPC
 */
async function fetchGeminiIntelligence(query, apiKey, model = 'gemini-1.5-flash', stats) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `You are a real-world Google Search Engine and SEO Data specialist.
Evaluate the search metrics for the following Google search query: "${query}"
Context: Google indicates approximately ${stats.totalResultsNumber || 'millions of'} indexed pages for this query.

Return ONLY a valid, strict JSON object (no markdown, no backticks, no explanatory prose) with this exact schema:
{
  "volumeTier": "string (e.g. '10K - 100K / mo', '100K - 1M / mo', '1K - 10K / mo', '100 - 1K / mo', '1M+ / mo')",
  "volumeNumericEst": number (practical estimated median monthly searches, e.g. 45000),
  "competitionScore": number (0 to 100 integer representing SEO ranking difficulty),
  "competitionTier": "string ('LOW', 'MEDIUM', 'HIGH')",
  "cpcEstUsd": "string (estimated Google Ads CPC range, e.g. '$1.20 - $2.80')",
  "intent": "string ('INFORMATIONAL', 'COMMERCIAL', 'TRANSACTIONAL', 'NAVIGATIONAL')",
  "lsiKeywords": ["array", "of", "4", "high-relevance", "terms"]
}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 500,
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Empty response from Gemini API');
  }

  // Parse JSON
  const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  return {
    volumeTier: parsed.volumeTier || '10K - 100K / mo',
    volumeNumericEst: parsed.volumeNumericEst || 25000,
    competitionScore: Math.min(100, Math.max(0, parseInt(parsed.competitionScore, 10) || 50)),
    competitionTier: parsed.competitionTier || 'MEDIUM',
    cpcEstUsd: parsed.cpcEstUsd || '$1.00 - $2.50',
    intent: parsed.intent || 'INFORMATIONAL',
    lsiKeywords: Array.isArray(parsed.lsiKeywords) ? parsed.lsiKeywords.slice(0, 5) : []
  };
}

/**
 * Objective mathematical fallback if Gemini key is not reachable
 */
function calculateAlgorithmicMetrics(query, stats, suggestions) {
  const words = query.trim().split(/\s+/).length;
  const pool = stats.totalResultsNumber || 1000000;

  // Intent classification by lexical markers
  const qLower = query.toLowerCase();
  let intent = 'INFORMATIONAL';
  if (/(buy|price|coupon|discount|cheap|deal|order|shop|hire)/.test(qLower)) {
    intent = 'TRANSACTIONAL';
  } else if (/(best|top|vs|review|compare|tool|software|platform|service)/.test(qLower)) {
    intent = 'COMMERCIAL';
  } else if (/(login|signin|portal|official|website|download|app)/.test(qLower)) {
    intent = 'NAVIGATIONAL';
  }

  // Difficulty estimate based on total indexed pool and length
  let diffScore = 30;
  if (pool > 1e9) diffScore += 45;
  else if (pool > 1e8) diffScore += 35;
  else if (pool > 1e7) diffScore += 25;
  else if (pool > 1e6) diffScore += 15;

  if (words === 1) diffScore += 20;
  else if (words >= 4) diffScore -= 15;
  diffScore = Math.min(95, Math.max(12, diffScore));

  let competitionTier = 'MEDIUM';
  if (diffScore < 40) competitionTier = 'LOW';
  else if (diffScore > 70) competitionTier = 'HIGH';

  // Volume tier
  let volumeTier = '10K - 100K / mo';
  let volumeNumericEst = 35000;
  if (pool > 5e8 && words <= 2) {
    volumeTier = '100K - 1M / mo';
    volumeNumericEst = 280000;
  } else if (pool > 2e9 && words === 1) {
    volumeTier = '1M+ / mo';
    volumeNumericEst = 1200000;
  } else if (words >= 4 || pool < 5e6) {
    volumeTier = '1K - 10K / mo';
    volumeNumericEst = 4500;
  }

  // Estimated CPC
  let cpc = intent === 'TRANSACTIONAL' ? '$2.50 - $7.00' : intent === 'COMMERCIAL' ? '$1.80 - $4.50' : '$0.40 - $1.50';

  return {
    volumeTier,
    volumeNumericEst,
    competitionScore: diffScore,
    competitionTier,
    cpcEstUsd: cpc,
    intent,
    lsiKeywords: suggestions.slice(0, 4)
  };
}

async function testGeminiApiKey(apiKey, model = 'gemini-1.5-flash') {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Respond with valid JSON: {"status": "ok"}' }] }],
        generationConfig: { maxOutputTokens: 20 }
      })
    });
    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `Google API HTTP ${res.status}: ${err}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function clearKeywordCache() {
  const all = await chrome.storage.local.get(null);
  const keysToRemove = Object.keys(all).filter(k => k.startsWith('grl_cache_'));
  if (keysToRemove.length > 0) {
    await chrome.storage.local.remove(keysToRemove);
  }
  return { success: true, count: keysToRemove.length };
}
