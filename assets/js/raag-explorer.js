(function () {
  const listEl = document.getElementById('raagList');
  const searchEl = document.getElementById('raagSearch');
  const statusEl = document.getElementById('dataStatus');
  const countEl = document.getElementById('resultCount');

  const detailEls = {
    title: document.getElementById('detailName'),
    thaat: document.getElementById('detailThaat'),
    time: document.getElementById('detailTime'),
    mood: document.getElementById('detailMood'),
    aroh: document.getElementById('detailAroh'),
    avroh: document.getElementById('detailAvroh'),
    pakad: document.getElementById('detailPakad'),
    description: document.getElementById('detailDescription')
  };

  let allRows = [];
  let filteredRows = [];
  let selectedRaagId = '';

  function updateStatus(text) {
    statusEl.textContent = text;
  }

  function showDetail(raag) {
    detailEls.title.textContent = raag.name || '-';
    detailEls.thaat.textContent = raag.thaat || '-';
    detailEls.time.textContent = raag.time || '-';
    detailEls.mood.textContent = raag.mood || '-';
    detailEls.aroh.textContent = raag.aroh || '-';
    detailEls.avroh.textContent = raag.avroh || '-';
    detailEls.pakad.textContent = raag.pakad || '-';
    detailEls.description.textContent = raag.description || 'No description available.';
  }

  function renderList() {
    listEl.innerHTML = '';
    countEl.textContent = `${filteredRows.length} raag${filteredRows.length === 1 ? '' : 's'}`;

    if (!filteredRows.length) {
      const empty = document.createElement('p');
      empty.className = 'list-empty';
      empty.textContent = 'No raag matched your search.';
      listEl.appendChild(empty);
      return;
    }

    filteredRows.forEach((raag) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `raag-list-item${raag.id === selectedRaagId ? ' active' : ''}`;
      button.textContent = `${raag.name} • ${raag.thaat || 'Unknown thaat'}`;

      button.addEventListener('click', () => {
        selectedRaagId = raag.id;
        showDetail(raag);
        renderList();
      });

      listEl.appendChild(button);
    });
  }

  function applyFilter() {
    const q = (searchEl.value || '').toLowerCase().trim();

    if (!q) {
      filteredRows = allRows.slice();
    } else {
      filteredRows = allRows.filter((row) => {
        const bag = [row.name, row.thaat, row.time, row.mood, row.pakad, row.description]
          .join(' ')
          .toLowerCase();
        return bag.includes(q);
      });
    }

    const stillVisible = filteredRows.some((row) => row.id === selectedRaagId);
    if (!stillVisible && filteredRows.length) {
      selectedRaagId = filteredRows[0].id;
      showDetail(filteredRows[0]);
    }

    renderList();
  }

  function setupSheetConfigForm() {
    const sheetIdInput = document.getElementById('sheetIdInput');
    const gidInput = document.getElementById('sheetGidInput');
    const applyButton = document.getElementById('sheetApplyButton');

    sheetIdInput.value = window.RaagData.config.sheetId;
    gidInput.value = window.RaagData.config.gid;

    applyButton.addEventListener('click', async () => {
      window.RaagData.config.sheetId = sheetIdInput.value.trim();
      window.RaagData.config.gid = gidInput.value.trim() || '0';
      await loadAndRenderData();
    });
  }

  async function loadAndRenderData() {
    updateStatus('Loading raag data...');

    try {
      const result = await window.RaagData.loadRaagData();
      allRows = result.rows.slice().sort((a, b) => a.name.localeCompare(b.name));
      filteredRows = allRows.slice();

      if (!allRows.length) {
        selectedRaagId = '';
        showDetail({});
      } else {
        const match = allRows.find((row) => row.id === selectedRaagId);
        const current = match || allRows[0];
        selectedRaagId = current.id;
        showDetail(current);
      }

      renderList();

      updateStatus(
        result.source === 'google-sheet'
          ? 'Showing data from Google Sheet.'
          : 'Showing fallback sample data. Add your Sheet ID to connect live data.'
      );
    } catch (error) {
      allRows = window.RaagData.fallbackRaags.slice();
      filteredRows = allRows.slice();
      selectedRaagId = allRows[0].id;
      showDetail(allRows[0]);
      renderList();
      updateStatus(`Could not load Google Sheet data (${error.message}). Showing fallback sample data.`);
    }
  }

  searchEl.addEventListener('input', applyFilter);

  setupSheetConfigForm();
  loadAndRenderData();
})();
