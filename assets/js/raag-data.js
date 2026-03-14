(function () {
  const DATASET_CONFIG = {
    sheetId: '',
    gid: '0',
    columns: {
      id: 'id',
      name: 'name',
      thaat: 'thaat',
      time: 'time',
      mood: 'mood',
      aroh: 'aroh',
      avroh: 'avroh',
      pakad: 'pakad',
      description: 'description'
    }
  };

  const FALLBACK_RAAGS = [
    {
      id: 'yaman',
      name: 'Raag Yaman',
      thaat: 'Kalyan',
      time: 'Evening (1st quarter of night)',
      mood: 'Serene, luminous, devotional',
      aroh: "N R G M^ D N S'",
      avroh: "S' N D P M^ G R S",
      pakad: 'N R G, R G M^, D N R S',
      description: 'A foundational raag for developing intonation and phrase clarity.'
    },
    {
      id: 'bhupali',
      name: 'Raag Bhupali',
      thaat: 'Kalyan',
      time: 'Early night',
      mood: 'Peaceful, uplifting',
      aroh: "S R G P D S'",
      avroh: "S' D P G R S",
      pakad: 'G R S, D S R G, P G R',
      description: 'Pentatonic raag with clean movement and highly teachable phrasing.'
    },
    {
      id: 'bageshree',
      name: 'Raag Bageshree',
      thaat: 'Kafi',
      time: 'Late evening',
      mood: 'Romantic, introspective',
      aroh: "S G M D n S'",
      avroh: "S' n D M G R S",
      pakad: 'n D M G, M G R S',
      description: 'Expressive raag with a soft glide-based character around Madhyam.'
    }
  ];

  function normalizeSlug(value) {
    return String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function normalizeRow(row) {
    const columns = DATASET_CONFIG.columns;
    const name = row[columns.name] || row.name || '';
    const id = normalizeSlug(row[columns.id] || row.id || name);

    return {
      id,
      name,
      thaat: row[columns.thaat] || '',
      time: row[columns.time] || '',
      mood: row[columns.mood] || '',
      aroh: row[columns.aroh] || '',
      avroh: row[columns.avroh] || '',
      pakad: row[columns.pakad] || '',
      description: row[columns.description] || ''
    };
  }

  function getSheetUrl() {
    if (!DATASET_CONFIG.sheetId) {
      return '';
    }

    return `https://docs.google.com/spreadsheets/d/${DATASET_CONFIG.sheetId}/gviz/tq?gid=${DATASET_CONFIG.gid}&tqx=out:json`;
  }

  function parseGvizJson(text) {
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');

    if (startIndex < 0 || endIndex < 0) {
      throw new Error('Google Sheets response could not be parsed.');
    }

    const raw = JSON.parse(text.slice(startIndex, endIndex + 1));
    const table = raw.table || {};
    const cols = Array.isArray(table.cols) ? table.cols : [];
    const rows = Array.isArray(table.rows) ? table.rows : [];

    const headers = cols.map((col) => (col.label || col.id || '').trim());

    return rows.map((row) => {
      const cells = Array.isArray(row.c) ? row.c : [];
      const item = {};

      headers.forEach((header, index) => {
        const cell = cells[index] || null;
        const value = cell && typeof cell.v !== 'undefined' ? cell.v : '';
        item[header] = value == null ? '' : String(value).trim();
      });

      return item;
    });
  }

  async function loadRaagData() {
    const url = getSheetUrl();

    if (!url) {
      return {
        source: 'fallback',
        rows: FALLBACK_RAAGS
      };
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load sheet data: ${response.status}`);
    }

    const text = await response.text();
    const rows = parseGvizJson(text)
      .map(normalizeRow)
      .filter((item) => item.name);

    return {
      source: 'google-sheet',
      rows: rows.length ? rows : FALLBACK_RAAGS
    };
  }

  window.RaagData = {
    config: DATASET_CONFIG,
    fallbackRaags: FALLBACK_RAAGS,
    loadRaagData,
    normalizeSlug
  };
})();
