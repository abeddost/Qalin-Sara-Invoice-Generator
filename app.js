// Qalin Sara – Invoice Tool
// State, persistence, UI logic, preview, and PDF generation (pdfmake)

(function () {
  const currencyFmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  const numberFmt = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const STORAGE = {
    DRAFT: 'qsara_draft',
    SETTINGS: 'qsara_settings',
    COUNTER: 'qsara_invoice_counter',
    DATEKEY: 'qsara_last_date_key'
  };

  const DEFAULT_SETTINGS = {
    bankOwner: '',
    bankName: '',
    bankIban: '',
    bankBic: '',
    taxId: ''
  };

  const elements = {
    // header actions
    openSettingsBtn: document.getElementById('openSettingsBtn'),
    clearFormBtn: document.getElementById('clearFormBtn'),

    // form fields
    invoiceNumber: document.getElementById('invoiceNumber'),
    issueDate: document.getElementById('issueDate'),
    serviceDate: document.getElementById('serviceDate'),
    customerName: document.getElementById('customerName'),
    customerAddress: document.getElementById('customerAddress'),
    customerPhone: document.getElementById('customerPhone'),

    // items
    addItemBtn: document.getElementById('addItemBtn'),
    itemsBody: document.getElementById('itemsBody'),

    // totals
    grandTotalDisplay: document.getElementById('grandTotalDisplay'),

    // actions
    downloadPdfBtn: document.getElementById('downloadPdfBtn'),

    // preview removed

    // settings modal
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    resetSettingsBtn: document.getElementById('resetSettingsBtn'),
    // bank fields removed from UI
    taxId: document.getElementById('taxId'),
    // no VAT-related settings anymore
  };

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE.SETTINGS);
      if (!raw) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(STORAGE.SETTINGS, JSON.stringify(settings));
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(STORAGE.DRAFT);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveDraft(draft) {
    localStorage.setItem(STORAGE.DRAFT, JSON.stringify(draft));
  }

  function getTodayISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function getMonthKey(dateStr) {
    // dateStr: YYYY-MM-DD
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const t = getTodayISO();
      return t.slice(0, 7);
    }
    return dateStr.slice(0, 7);
  }

  function nextInvoiceNumber(issueDate) {
    const key = getMonthKey(issueDate);
    const lastKey = localStorage.getItem(STORAGE.DATEKEY);
    let counter = parseInt(localStorage.getItem(STORAGE.COUNTER) || '0', 10);
    if (lastKey !== key || Number.isNaN(counter) || counter < 0) {
      counter = 1;
      localStorage.setItem(STORAGE.COUNTER, String(counter));
      localStorage.setItem(STORAGE.DATEKEY, key);
    } else {
      counter += 1;
      localStorage.setItem(STORAGE.COUNTER, String(counter));
    }
    const padded = String(counter).padStart(3, '0');
    return `${key}-${padded}`;
  }

  function maybeBumpCounterFromNumber(invoiceNumber) {
    // If user overrides invoice number, and it matches YYYY-MM-XXX, adjust stored counter to max
    const m = invoiceNumber && invoiceNumber.match(/^(\d{4})-(\d{2})-(\d{3})$/);
    if (!m) return;
    const key = `${m[1]}-${m[2]}`;
    const n = parseInt(m[3], 10);
    const lastKey = localStorage.getItem(STORAGE.DATEKEY);
    let counter = parseInt(localStorage.getItem(STORAGE.COUNTER) || '0', 10);
    if (lastKey !== key) {
      localStorage.setItem(STORAGE.DATEKEY, key);
      localStorage.setItem(STORAGE.COUNTER, String(n));
    } else if (!Number.isNaN(n) && n > counter) {
      localStorage.setItem(STORAGE.COUNTER, String(n));
    }
  }

  function newEmptyItem() {
    return { description: '', area: 0, pricePerSqm: 0 };
  }

  function sanitizeNumber(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 0;
    return n;
  }

  function computeTotals(items) {
    const sub = items.reduce((acc, it) => acc + sanitizeNumber(it.area) * sanitizeNumber(it.pricePerSqm), 0);
    return { subtotal: sub, total: sub };
  }

  function renderItems(items) {
    elements.itemsBody.innerHTML = '';
    items.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="border p-1">
          <input data-idx="${index}" data-field="description" type="text" class="w-full px-2 py-1" placeholder="Artikel" value="${escapeHtml(item.description)}" />
        </td>
        <td class="border p-1 text-right">
          <input data-idx="${index}" data-field="area" type="number" step="0.01" min="0" class="w-full px-2 py-1 text-right" value="${String(item.area)}" />
        </td>
        <td class="border p-1 text-right">
          <input data-idx="${index}" data-field="pricePerSqm" type="number" step="0.01" min="0" class="w-full px-2 py-1 text-right" value="${String(item.pricePerSqm)}" />
        </td>
        <td class="border p-1 text-right" data-role="lineTotal"></td>
        <td class="border p-1 text-center">
          <button data-idx="${index}" data-action="remove" class="text-red-600 px-2 py-1">Entfernen</button>
        </td>
      `;
      elements.itemsBody.appendChild(tr);
    });
  }

  function updateLineTotals(items) {
    const rows = elements.itemsBody.querySelectorAll('tr');
    rows.forEach((tr, idx) => {
      const amount = sanitizeNumber(items[idx].area) * sanitizeNumber(items[idx].pricePerSqm);
      const cell = tr.querySelector('[data-role="lineTotal"]');
      if (cell) cell.textContent = numberFmt.format(amount);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function getFormState() {
    const items = [];
    elements.itemsBody.querySelectorAll('tr').forEach((tr) => {
      const idxInput = tr.querySelector('input[data-field="description"]');
      if (!idxInput) return;
      const index = Number(idxInput.getAttribute('data-idx'));
      const description = tr.querySelector('input[data-field="description"]').value || '';
      const area = sanitizeNumber(tr.querySelector('input[data-field="area"]').value);
      const pricePerSqm = sanitizeNumber(tr.querySelector('input[data-field="pricePerSqm"]').value);
      items.push({ description, area, pricePerSqm, index });
    });
    // Ensure order by index
    items.sort((a, b) => a.index - b.index);
    items.forEach((it) => delete it.index);

    return {
      invoiceNumber: elements.invoiceNumber.value.trim(),
      issueDate: elements.issueDate.value,
      serviceDate: elements.serviceDate.value,
      customerName: elements.customerName.value.trim(),
      customerAddress: elements.customerAddress.value.trim(),
      customerPhone: elements.customerPhone.value.trim(),
      items
    };
  }

  function setFormState(state) {
    elements.invoiceNumber.value = state.invoiceNumber || '';
    elements.issueDate.value = state.issueDate || getTodayISO();
    elements.serviceDate.value = state.serviceDate || '';
    elements.customerName.value = state.customerName || '';
    elements.customerAddress.value = state.customerAddress || '';
    elements.customerPhone.value = state.customerPhone || '';
    renderItems(state.items && state.items.length ? state.items : [newEmptyItem()]);
    updateTotalsAndUI();
  }

  function updateTotalsAndUI() {
    const draft = getFormState();
    updateLineTotals(draft.items);
    const totals = computeTotals(draft.items);
    elements.grandTotalDisplay.textContent = currencyFmt.format(totals.total);
    saveDraft(draft);
  }

  function addItemRow(focus = true) {
    const draft = loadDraft() || getFormState();
    const items = draft.items && draft.items.length ? draft.items : [];
    items.push(newEmptyItem());
    draft.items = items;
    saveDraft(draft);
    renderItems(items);
    updateTotalsAndUI();
    if (focus) {
      const lastRow = elements.itemsBody.querySelector('tr:last-child input[data-field="description"]');
      if (lastRow) lastRow.focus();
    }
  }

  function removeItem(index) {
    const draft = getFormState();
    const items = draft.items.filter((_, idx) => idx !== index);
    draft.items = items.length ? items : [newEmptyItem()];
    saveDraft(draft);
    renderItems(draft.items);
    updateTotalsAndUI();
  }

  function ensureInvoiceNumber() {
    let num = elements.invoiceNumber.value.trim();
    if (!num) {
      const dateForKey = elements.issueDate.value || getTodayISO();
      num = nextInvoiceNumber(dateForKey);
      elements.invoiceNumber.value = num;
    }
    return num;
  }

  function loadLogoAsDataUrl() {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = function () {
        resolve(null);
      };
      img.src = 'logo.png';
    });
  }

  // Preview functionality removed - PDF generation is the primary output

  function buildPdfDefinition(logoDataUrl) {
    const draft = getFormState();
    const settings = loadSettings();
    const totals = computeTotals(draft.items);

    const body = [
      [
        { text: 'Artikel', style: 'tableHeader' },
        { text: 'Fläche (m²)', style: 'tableHeader', alignment: 'right' },
        { text: '€/m²', style: 'tableHeader', alignment: 'right' },
        { text: 'Gesamt (€)', style: 'tableHeader', alignment: 'right' }
      ]
    ];

    draft.items.forEach((it, i) => {
      const lineTotal = sanitizeNumber(it.area) * sanitizeNumber(it.pricePerSqm);
      body.push([
        { text: it.description || '', margin: [0, 2, 0, 2] },
        { text: numberFmt.format(sanitizeNumber(it.area)), alignment: 'right' },
        { text: numberFmt.format(sanitizeNumber(it.pricePerSqm)), alignment: 'right' },
        { text: numberFmt.format(lineTotal), alignment: 'right' }
      ]);
    });

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      footer: function (currentPage, pageCount) {
        return {
          columns: [
            { text: `Seite ${currentPage} von ${pageCount}`, alignment: 'left', fontSize: 8 },
            { text: 'Qalin Sara', alignment: 'right', fontSize: 8 }
          ],
          margin: [40, 0, 40, 20]
        };
      },
      content: [
        {
          columns: [
            [
              logoDataUrl ? { image: logoDataUrl, width: 60 } : { text: 'Qalin Sara', bold: true, fontSize: 16 },
              { text: 'Industriestraße 17', fontSize: 9 },
              { text: '65474 Bischofsheim', fontSize: 9 },
              { text: 'Tel: 0176 72465789', fontSize: 9 }
            ],
            [
              { text: `Rechnung Nr.: ${draft.invoiceNumber || ''}`, alignment: 'right' },
              { text: `Rechnungsdatum: ${draft.issueDate || ''}`, alignment: 'right' },
              { text: `Liefer-/Leistungsdatum: ${draft.serviceDate || ''}`, alignment: 'right' }
            ]
          ]
        },
        { text: '\n' },
        { text: 'Rechnung an', style: 'sectionHeader' },
        { text: draft.customerName || '' },
        { text: draft.customerAddress || '' },
        { text: draft.customerPhone || '' },
        { text: '\n' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 60, 90, 90],
            body
          },
          layout: {
            fillColor: function (rowIndex) { return rowIndex === 0 ? '#f3f4f6' : (rowIndex % 2 ? null : null); }
          }
        },
        { text: '\n' },
        {
          columns: [
            { text: '' },
            {
              table: {
                widths: [120, 90],
                body: [
                  [{ text: 'Gesamtsumme', bold: true }, { text: currencyFmt.format(totals.total), bold: true }]
                ]
              },
              layout: 'noBorders'
            }
          ]
        },
        { text: '\n' },
        settings.taxId ? { text: `Steuernummer/USt-IdNr.: ${settings.taxId}` } : {},
        {}
      ],
      styles: {
        sectionHeader: { bold: true, fontSize: 12, margin: [0, 0, 0, 4] },
        tableHeader: { bold: true }
      }
    };

    return docDefinition;
  }

  function downloadPdf() {
    const num = ensureInvoiceNumber();
    maybeBumpCounterFromNumber(num);
    loadLogoAsDataUrl().then((dataUrl) => {
      const dd = buildPdfDefinition(dataUrl);
      pdfMake.createPdf(dd).download(`${num}.pdf`);
    });
  }

  function bindEvents() {
    elements.addItemBtn.addEventListener('click', () => addItemRow(true));

    elements.itemsBody.addEventListener('input', (e) => {
      const t = e.target;
      if (!(t instanceof HTMLInputElement)) return;
      const idx = Number(t.getAttribute('data-idx'));
      const field = t.getAttribute('data-field');
      const draft = loadDraft() || getFormState();
      const items = draft.items && draft.items.length ? draft.items : [];
      if (Number.isFinite(idx) && items[idx]) {
        if (field === 'description') items[idx].description = t.value;
        if (field === 'area') items[idx].area = sanitizeNumber(t.value);
        if (field === 'pricePerSqm') items[idx].pricePerSqm = sanitizeNumber(t.value);
        saveDraft(draft);
        updateTotalsAndUI();
      }
    });

    elements.itemsBody.addEventListener('click', (e) => {
      const btn = e.target;
      if (!(btn instanceof HTMLElement)) return;
      if (btn.getAttribute('data-action') === 'remove') {
        const idx = Number(btn.getAttribute('data-idx'));
        if (Number.isFinite(idx)) removeItem(idx);
      }
    });

    ['invoiceNumber','issueDate','serviceDate','customerName','customerAddress','customerPhone'].forEach((id) => {
      const el = elements[id];
      if (el) el.addEventListener('input', updateTotalsAndUI);
      if (id === 'issueDate') el.addEventListener('change', () => {
        // If invoice number is empty, regenerate based on new date
        if (!elements.invoiceNumber.value.trim()) {
          elements.invoiceNumber.value = nextInvoiceNumber(elements.issueDate.value || getTodayISO());
          updateTotalsAndUI();
        }
      });
      if (id === 'invoiceNumber') el.addEventListener('change', () => {
        maybeBumpCounterFromNumber(elements.invoiceNumber.value.trim());
      });
    });

    elements.downloadPdfBtn.addEventListener('click', downloadPdf);

    // preview controls removed

    // Settings modal
    elements.openSettingsBtn.addEventListener('click', () => {
      const s = loadSettings();
      elements.taxId.value = s.taxId;
      elements.settingsModal.classList.remove('hidden');
      elements.settingsModal.classList.add('flex');
    });
    elements.closeSettingsBtn.addEventListener('click', () => {
      elements.settingsModal.classList.add('hidden');
      elements.settingsModal.classList.remove('flex');
    });
    elements.resetSettingsBtn.addEventListener('click', () => {
      saveSettings({ ...DEFAULT_SETTINGS });
      const s = loadSettings();
      elements.taxId.value = s.taxId;
    });
    elements.saveSettingsBtn.addEventListener('click', () => {
      const s = {
        taxId: elements.taxId.value.trim()
      };
      // Preserve any existing bank fields in storage without UI
      const prev = loadSettings();
      saveSettings({ ...prev, ...s });
      elements.settingsModal.classList.add('hidden');
      elements.settingsModal.classList.remove('flex');
      // preview removed
    });

    elements.clearFormBtn.addEventListener('click', () => {
      localStorage.removeItem(STORAGE.DRAFT);
      const s = loadSettings();
      const initial = createInitialDraft(s);
      setFormState(initial);
      // preview removed
    });
  }

  function createInitialDraft(settings) {
    const today = getTodayISO();
    const number = nextInvoiceNumber(today);
    return {
      invoiceNumber: number,
      issueDate: today,
      serviceDate: today,
      customerName: '',
      customerAddress: '',
      customerPhone: '',
      items: [newEmptyItem()]
    };
  }

  function init() {
    const settings = loadSettings();
    const draft = loadDraft();
    if (draft) {
      setFormState(draft);
    } else {
      const initial = createInitialDraft(settings);
      saveDraft(initial);
      setFormState(initial);
    }
    bindEvents();
  }

  // Boot
  document.addEventListener('DOMContentLoaded', init);
})();



