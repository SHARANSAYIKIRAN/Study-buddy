/**
 * Study Buddy - PDF Viewer & Thumbnails Engine
 * Powered by Mozilla PDF.js. Handles multi-page rendering, zoom, thumbnails sidebar,
 * text extraction for AI context, and document switching.
 */

class PDFViewerEngine {
  constructor() {
    this.pdfDoc = null;
    this.currentDocName = 'Module 4 Notes.pdf';
    this.currentPage = 1;
    this.totalPages = 0;
    this.scale = 1.15;
    this.pageTexts = {};
    this.isRendering = false;
    this.thumbnailsGenerated = false;

    // Worker setup
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    this.bindDOM();
    this.bindEvents();
  }

  bindDOM() {
    this.$canvasContainer = document.getElementById('pdf-canvas-container');
    this.$placeholder = document.getElementById('pdf-placeholder');
    this.$filenameDisplay = document.getElementById('pdf-filename-display');
    this.$pageInput = document.getElementById('pdf-page-input');
    this.$pageTotal = document.getElementById('pdf-page-total');
    this.$prevBtn = document.getElementById('pdf-prev-page');
    this.$nextBtn = document.getElementById('pdf-next-page');
    this.$zoomInBtn = document.getElementById('pdf-zoom-in');
    this.$zoomOutBtn = document.getElementById('pdf-zoom-out');
    this.$zoomDisplay = document.getElementById('pdf-zoom-display');
    this.$thumbnailsStrip = document.getElementById('pdf-thumbnails-strip');
    this.$thumbnailsToggle = document.getElementById('toggle-thumbnails-btn');
    this.$fileInput = document.getElementById('pdf-file-input');
    this.$openPdfBtn = document.getElementById('open-pdf-btn');
    this.$placeholderUploadBtn = document.getElementById('placeholder-upload-btn');
  }

  bindEvents() {
    if (this.$openPdfBtn && this.$fileInput) {
      this.$openPdfBtn.addEventListener('click', () => this.$fileInput.click());
    }
    if (this.$placeholderUploadBtn && this.$fileInput) {
      this.$placeholderUploadBtn.addEventListener('click', () => this.$fileInput.click());
    }

    if (this.$fileInput) {
      this.$fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
          this.loadFromFile(file);
        }
      });
    }

    // Drag and drop onto placeholder
    if (this.$placeholder) {
      this.$placeholder.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.$placeholder.classList.add('dragover');
      });
      this.$placeholder.addEventListener('dragleave', () => {
        this.$placeholder.classList.remove('dragover');
      });
      this.$placeholder.addEventListener('drop', (e) => {
        e.preventDefault();
        this.$placeholder.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
          this.loadFromFile(file);
        } else if (window.showToast) {
          window.showToast('⚠️ Please drop a valid PDF file!', 'error');
        }
      });
    }

    // Page navigation
    if (this.$prevBtn) {
      this.$prevBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
    }
    if (this.$nextBtn) {
      this.$nextBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
    }
    if (this.$pageInput) {
      this.$pageInput.addEventListener('change', () => {
        let val = parseInt(this.$pageInput.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > this.totalPages) val = this.totalPages;
        this.goToPage(val);
      });
    }

    // Zoom
    if (this.$zoomInBtn) {
      this.$zoomInBtn.addEventListener('click', () => this.setZoom(this.scale + 0.15));
    }
    if (this.$zoomOutBtn) {
      this.$zoomOutBtn.addEventListener('click', () => this.setZoom(this.scale - 0.15));
    }

    // Toggle thumbnails strip
    if (this.$thumbnailsToggle && this.$thumbnailsStrip) {
      this.$thumbnailsToggle.addEventListener('click', () => {
        this.$thumbnailsStrip.classList.toggle('collapsed');
        const isCollapsed = this.$thumbnailsStrip.classList.contains('collapsed');
        this.$thumbnailsToggle.setAttribute('title', isCollapsed ? 'Show Thumbnails' : 'Hide Thumbnails');
      });
    }
  }

  async loadFromUrl(url, displayName = 'Module 4 Notes.pdf') {
    try {
      if (window.showToast) window.showToast('⏳ Loading document...', 'info');
      const loadingTask = window.pdfjsLib.getDocument(url);
      this.pdfDoc = await loadingTask.promise;
      this.currentDocName = displayName;
      this.totalPages = this.pdfDoc.numPages;
      this.currentPage = 1;
      this.pageTexts = {};

      this.updateHeaderUI();
      await this.renderPage(1);
      this.generateThumbnails();

      // Connect timer and checklist
      if (window.focusTimer) {
        window.focusTimer.setContext(displayName, 'Probability');
      }
      if (window.checklistManager) {
        window.checklistManager.loadDocumentChecklist(displayName);
      }

      if (window.showToast) window.showToast(`📖 ${displayName} loaded (${this.totalPages} pages)`, 'success');
    } catch (err) {
      console.error('Failed to load PDF from URL', err);
      if (window.showToast) window.showToast('⚠️ Could not load sample PDF', 'error');
    }
  }

  async loadFromFile(file) {
    try {
      if (window.showToast) window.showToast(`⏳ Loading ${file.name}...`, 'info');
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
      this.pdfDoc = await loadingTask.promise;
      this.currentDocName = file.name;
      this.totalPages = this.pdfDoc.numPages;
      this.currentPage = 1;
      this.pageTexts = {};

      this.updateHeaderUI();
      await this.renderPage(1);
      this.generateThumbnails();

      // Save document metadata
      window.storageManager.saveDocumentMeta(file.name, {
        totalPages: this.totalPages,
        currentPage: 1
      });

      if (window.focusTimer) {
        window.focusTimer.setContext(file.name, 'General Study');
      }
      if (window.checklistManager) {
        window.checklistManager.loadDocumentChecklist(file.name);
      }

      if (window.showToast) window.showToast(`📖 ${file.name} loaded (${this.totalPages} pages)`, 'success');
    } catch (err) {
      console.error('Failed to load PDF from file', err);
      if (window.showToast) window.showToast('⚠️ Failed to parse PDF file', 'error');
    }
  }

  updateHeaderUI() {
    if (this.$filenameDisplay) this.$filenameDisplay.textContent = this.currentDocName;
    if (this.$pageTotal) this.$pageTotal.textContent = this.totalPages;
    if (this.$pageInput) {
      this.$pageInput.value = this.currentPage;
      this.$pageInput.max = this.totalPages;
    }
    if (this.$placeholder) this.$placeholder.style.display = 'none';
  }

  async goToPage(pageNum) {
    if (!this.pdfDoc) return;
    if (pageNum < 1 || pageNum > this.totalPages) return;
    this.currentPage = pageNum;
    if (this.$pageInput) this.$pageInput.value = pageNum;

    await this.renderPage(pageNum);
    this.highlightActiveThumbnail(pageNum);

    // Update document record
    window.storageManager.saveDocumentMeta(this.currentDocName, {
      currentPage: pageNum
    });
  }

  setZoom(newScale) {
    this.scale = Math.max(0.5, Math.min(2.5, newScale));
    if (this.$zoomDisplay) {
      this.$zoomDisplay.textContent = Math.round(this.scale * 100) + '%';
    }
    this.renderPage(this.currentPage);
  }

  async renderPage(pageNum) {
    if (!this.pdfDoc || this.isRendering) return;
    this.isRendering = true;

    try {
      const page = await this.pdfDoc.getPage(pageNum);
      const pixelRatio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: this.scale });

      // Clear previous canvas
      const oldCanvas = this.$canvasContainer.querySelector('.pdf-page-canvas');
      if (oldCanvas) oldCanvas.remove();

      const canvas = document.createElement('canvas');
      canvas.className = 'pdf-page-canvas';
      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = Math.floor(viewport.width) + 'px';
      canvas.style.height = Math.floor(viewport.height) + 'px';

      const ctx = canvas.getContext('2d');
      ctx.scale(pixelRatio, pixelRatio);

      this.$canvasContainer.appendChild(canvas);

      await page.render({ canvasContext: ctx, viewport: viewport }).promise;

      // Extract text content if not already cached
      if (!this.pageTexts[pageNum]) {
        const textContent = await page.getTextContent();
        const text = textContent.items.map((item) => item.str).join(' ');
        this.pageTexts[pageNum] = text;
      }
    } catch (e) {
      console.error('Error rendering page', e);
    } finally {
      this.isRendering = false;
    }
  }

  async generateThumbnails() {
    if (!this.pdfDoc || !this.$thumbnailsStrip) return;
    this.$thumbnailsStrip.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'thumbnails-header';
    header.innerHTML = `<span>Pages (${this.totalPages})</span>`;
    this.$thumbnailsStrip.appendChild(header);

    const list = document.createElement('div');
    list.className = 'thumbnails-list';
    this.$thumbnailsStrip.appendChild(list);

    // Limit live thumbnail rendering to first 30 pages for maximum speed
    const maxThumbs = Math.min(this.totalPages, 30);

    for (let i = 1; i <= maxThumbs; i++) {
      const thumbCard = document.createElement('div');
      thumbCard.className = `thumbnail-card ${i === this.currentPage ? 'active' : ''}`;
      thumbCard.dataset.page = i;

      const canvasWrap = document.createElement('div');
      canvasWrap.className = 'thumb-canvas-wrap';

      const canvas = document.createElement('canvas');
      canvas.className = 'thumb-canvas';
      canvasWrap.appendChild(canvas);

      const label = document.createElement('span');
      label.className = 'thumb-label';
      label.textContent = `${i}`;

      thumbCard.appendChild(canvasWrap);
      thumbCard.appendChild(label);
      list.appendChild(thumbCard);

      thumbCard.addEventListener('click', () => {
        this.goToPage(i);
      });

      // Render miniature page on canvas
      this.renderThumbnailCanvas(i, canvas);
    }
  }

  async renderThumbnailCanvas(pageNum, canvas) {
    try {
      const page = await this.pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 0.18 });
      const pixelRatio = window.devicePixelRatio || 1;

      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = Math.floor(viewport.width) + 'px';
      canvas.style.height = Math.floor(viewport.height) + 'px';

      const ctx = canvas.getContext('2d');
      ctx.scale(pixelRatio, pixelRatio);

      await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    } catch (err) {
      // Ignore miniature render fail
    }
  }

  highlightActiveThumbnail(pageNum) {
    if (!this.$thumbnailsStrip) return;
    const cards = this.$thumbnailsStrip.querySelectorAll('.thumbnail-card');
    cards.forEach((c) => {
      if (parseInt(c.dataset.page, 10) === pageNum) {
        c.classList.add('active');
        c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        c.classList.remove('active');
      }
    });
  }

  getCurrentPageText() {
    return this.pageTexts[this.currentPage] || '';
  }

  getAllLoadedText() {
    return Object.entries(this.pageTexts)
      .map(([page, text]) => `--- Page ${page} ---\n${text}`)
      .join('\n\n');
  }
}

// Global PDF Viewer singleton
window.pdfViewer = new PDFViewerEngine();
