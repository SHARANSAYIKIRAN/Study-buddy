/**
 * Study Buddy - PDF Checklist Module
 * Supports manual checklist creation/editing, persistence per PDF,
 * and AI-powered checklist generation from document text.
 */

class ChecklistManager {
  constructor() {
    this.currentDocName = 'Module 4 Notes.pdf';
    this.items = [];

    this.bindDOM();
    this.bindEvents();
  }

  bindDOM() {
    this.$container = document.getElementById('checklist-items-container');
    this.$countDisplay = document.getElementById('checklist-count-display');
    this.$pctDisplay = document.getElementById('checklist-pct-display');
    this.$progressBar = document.getElementById('checklist-progress-bar');
    this.$addBtn = document.getElementById('checklist-add-btn');
    this.$aiGenerateBtn = document.getElementById('checklist-ai-generate-btn');
    this.$minimizedChecklist = document.getElementById('minimized-checklist-pill');
    this.$minimizedCount = document.getElementById('minimized-checklist-count');
    this.$closeBtn = document.getElementById('checklist-minimize-btn');
    this.$panel = document.getElementById('checklist-sidebar-panel');

    // AI Generation Modal elements
    this.$aiModal = document.getElementById('ai-checklist-modal');
    this.$aiModalList = document.getElementById('ai-checklist-preview-list');
    this.$aiModalSaveBtn = document.getElementById('ai-checklist-save-btn');
    this.$aiModalCloseBtn = document.getElementById('ai-checklist-close-btn');
    this.$aiModalLoading = document.getElementById('ai-checklist-loading');
  }

  bindEvents() {
    if (this.$addBtn) {
      this.$addBtn.addEventListener('click', () => this.promptAddItem());
    }

    if (this.$aiGenerateBtn) {
      this.$aiGenerateBtn.addEventListener('click', () => this.generateAIChecklist());
    }

    if (this.$closeBtn) {
      this.$closeBtn.addEventListener('click', () => this.minimize());
    }

    if (this.$minimizedChecklist) {
      this.$minimizedChecklist.addEventListener('click', () => this.expand());
    }

    if (this.$aiModalCloseBtn && this.$aiModal) {
      this.$aiModalCloseBtn.addEventListener('click', () => {
        this.$aiModal.classList.add('hidden');
      });
    }

    if (this.$aiModalSaveBtn && this.$aiModal) {
      this.$aiModalSaveBtn.addEventListener('click', () => {
        this.saveAIChecklistSelection();
      });
    }
  }

  loadDocumentChecklist(docName) {
    this.currentDocName = docName || 'Module 4 Notes.pdf';
    let saved = window.storageManager.getChecklist(this.currentDocName);

    // If empty for this doc, provide a clean starter template
    if (!saved || saved.length === 0) {
      if (this.currentDocName.toLowerCase().includes('probability')) {
        saved = [
          { id: '1', title: '4.1 Probability Distributions', completed: true },
          { id: '2', title: 'Example 4.1 Coin Toss', completed: true },
          { id: '3', title: 'Example 4.2 Calculation', completed: true },
          { id: '4', title: '4.2 Cumulative Distribution Function', completed: false },
          { id: '5', title: '4.3 Expectation and Variance', completed: false },
          { id: '6', title: '4.4 Common Distributions', completed: false },
          { id: '7', title: '4.5 Markov Chains', completed: false },
          { id: '8', title: '4.6 Previous Year Questions', completed: false }
        ];
      } else {
        saved = [
          { id: 'c1', title: 'Chapter Introduction & Objectives', completed: false },
          { id: 'c2', title: 'Core Theoretical Derivations', completed: false },
          { id: 'c3', title: 'Worked Numerical Examples', completed: false },
          { id: 'c4', title: 'Summary & Practice Problems', completed: false }
        ];
      }
      window.storageManager.saveChecklist(this.currentDocName, saved);
    }

    this.items = saved;
    this.render();
  }

  render() {
    if (!this.$container) return;
    this.$container.innerHTML = '';

    const total = this.items.length;
    const completed = this.items.filter((i) => i.completed).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (this.$countDisplay) this.$countDisplay.textContent = `${completed} / ${total}`;
    if (this.$pctDisplay) this.$pctDisplay.textContent = `${pct}%`;
    if (this.$progressBar) this.$progressBar.style.width = `${pct}%`;
    if (this.$minimizedCount) this.$minimizedCount.textContent = `${completed}/${total}`;

    if (total === 0) {
      this.$container.innerHTML = `
        <div class="empty-state-card">
          <p>No study portions yet.</p>
          <button class="btn-subtle" onclick="window.checklistManager.promptAddItem()">+ Add First Item</button>
        </div>
      `;
      return;
    }

    this.items.forEach((item, index) => {
      const itemRow = document.createElement('div');
      itemRow.className = `checklist-row ${item.completed ? 'completed' : ''}`;
      itemRow.dataset.id = item.id;

      itemRow.innerHTML = `
        <label class="custom-checkbox">
          <input type="checkbox" ${item.completed ? 'checked' : ''} />
          <span class="checkbox-indicator"></span>
        </label>
        <span class="checklist-item-title" title="Double click to edit">${item.title}</span>
        <div class="checklist-item-actions">
          <button class="action-btn-mini edit" title="Edit item">✎</button>
          <button class="action-btn-mini delete" title="Delete item">✕</button>
        </div>
      `;

      // Toggle status
      const input = itemRow.querySelector('input');
      input.addEventListener('change', () => {
        this.toggleItem(item.id);
      });

      // Edit item
      const editBtn = itemRow.querySelector('.action-btn-mini.edit');
      const titleSpan = itemRow.querySelector('.checklist-item-title');
      editBtn.addEventListener('click', () => {
        this.inlineEdit(titleSpan, item);
      });
      titleSpan.addEventListener('dblclick', () => {
        this.inlineEdit(titleSpan, item);
      });

      // Delete item
      const deleteBtn = itemRow.querySelector('.action-btn-mini.delete');
      deleteBtn.addEventListener('click', () => {
        this.deleteItem(item.id);
      });

      this.$container.appendChild(itemRow);
    });
  }

  toggleItem(itemId) {
    const item = this.items.find((i) => i.id === itemId);
    if (item) {
      item.completed = !item.completed;
      window.storageManager.saveChecklist(this.currentDocName, this.items);
      this.render();

      if (item.completed && window.showToast) {
        window.showToast(`✅ Completed "${item.title.substring(0, 24)}..."`, 'success');
      }
    }
  }

  promptAddItem() {
    const title = prompt('Enter a study portion or chapter topic:');
    if (title && title.trim()) {
      const newItem = {
        id: 'item_' + Date.now(),
        title: title.trim(),
        completed: false
      };
      this.items.push(newItem);
      window.storageManager.saveChecklist(this.currentDocName, this.items);
      this.render();
      if (window.showToast) window.showToast('Added to checklist', 'success');
    }
  }

  inlineEdit(spanElement, item) {
    const current = item.title;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = current;
    input.className = 'checklist-inline-input';

    spanElement.replaceWith(input);
    input.focus();
    input.select();

    const commit = () => {
      const val = input.value.trim();
      if (val) {
        item.title = val;
        window.storageManager.saveChecklist(this.currentDocName, this.items);
      }
      this.render();
    };

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') commit();
      if (e.key === 'Escape') this.render();
    });
  }

  deleteItem(itemId) {
    this.items = this.items.filter((i) => i.id !== itemId);
    window.storageManager.saveChecklist(this.currentDocName, this.items);
    this.render();
  }

  minimize() {
    if (this.$panel) this.$panel.classList.add('hidden');
    if (this.$minimizedChecklist) this.$minimizedChecklist.classList.remove('hidden');
  }

  expand() {
    if (this.$panel) this.$panel.classList.remove('hidden');
    if (this.$minimizedChecklist) this.$minimizedChecklist.classList.add('hidden');
  }

  async generateAIChecklist() {
    if (!this.$aiModal) return;

    this.$aiModal.classList.remove('hidden');
    this.$aiModalLoading.style.display = 'flex';
    this.$aiModalList.innerHTML = '';
    this.$aiModalSaveBtn.disabled = true;

    try {
      const docText = window.pdfViewer ? window.pdfViewer.getAllLoadedText() : '';
      const promptText = `Analyze this textbook document ("${this.currentDocName}"):
"""
${docText ? docText.substring(0, 3000) : 'Probability and Stochastic Processes: 4.1 Probability Distributions, 4.2 CDF, 4.3 Expectation and Variance, 4.4 Common Distributions, 4.5 Markov Chains'}
"""

Extract 6 to 8 structured study portions (chapters, key concepts, worked examples, exercises). Group related content into meaningful portions.
Return ONLY valid JSON array with this schema:
[
  { "title": "4.1 Discrete Probability Distributions & PMF" },
  { "title": "Example 4.1 Coin Toss Calculations" },
  { "title": "4.2 Cumulative Distribution Function (CDF) Properties" },
  { "title": "4.3 Mathematical Expectation & Variance" },
  { "title": "4.4 Discrete Distributions (Binomial & Poisson)" },
  { "title": "4.5 Markov Chains & Transition Matrices" },
  { "title": "Chapter Review & Practice Problems" }
]`;

      const aiReply = await window.aiManager.sendMessage({
        message: promptText,
        subject: 'math'
      });

      // Parse JSON from reply
      let extracted = [];
      const jsonMatch = aiReply.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        try {
          extracted = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.warn('Could not parse JSON array directly', e);
        }
      }

      if (!extracted.length) {
        // Fallback default portions
        extracted = [
          { title: '4.1 Probability Distributions & PMF Axioms' },
          { title: 'Example 4.1 & 4.2 Discrete Random Variables' },
          { title: '4.2 Cumulative Distribution Functions (CDF)' },
          { title: '4.3 Expectation, Mean, and Variance Theorems' },
          { title: '4.4 Bernoulli, Binomial, and Poisson Distributions' },
          { title: '4.5 Markov Chains & State Transition Matrices' },
          { title: '4.6 Chapter Practice Exercises' }
        ];
      }

      this.renderAIPreview(extracted);
    } catch (err) {
      console.error('AI Checklist Generation Error', err);
      this.$aiModalLoading.style.display = 'none';
      this.$aiModalList.innerHTML = `
        <div class="modal-error-msg">⚠️ Failed to generate checklist automatically: ${err.message}. Showing suggested portions instead.</div>
      `;
      this.renderAIPreview([
        { title: 'Key Concept 1: Theoretical Foundations' },
        { title: 'Key Concept 2: Mathematical Formulations' },
        { title: 'Key Concept 3: Solved Numerical Examples' },
        { title: 'Key Concept 4: Practical Exercises & Revision' }
      ]);
    }
  }

  renderAIPreview(items) {
    this.$aiModalLoading.style.display = 'none';
    this.$aiModalSaveBtn.disabled = false;
    this.$aiModalList.innerHTML = '';

    items.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'ai-preview-item';
      row.innerHTML = `
        <label class="custom-checkbox">
          <input type="checkbox" checked data-idx="${idx}" />
          <span class="checkbox-indicator"></span>
        </label>
        <input type="text" class="ai-preview-title-input" value="${item.title}" />
      `;
      this.$aiModalList.appendChild(row);
    });
  }

  saveAIChecklistSelection() {
    const rows = this.$aiModalList.querySelectorAll('.ai-preview-item');
    const newItems = [];

    rows.forEach((row, i) => {
      const isChecked = row.querySelector('input[type="checkbox"]').checked;
      const title = row.querySelector('.ai-preview-title-input').value.trim();
      if (isChecked && title) {
        newItems.push({
          id: 'ai_' + Date.now() + '_' + i,
          title: title,
          completed: false
        });
      }
    });

    if (newItems.length > 0) {
      this.items = newItems;
      window.storageManager.saveChecklist(this.currentDocName, this.items);
      this.render();
      if (window.showToast) window.showToast(`✨ Generated ${newItems.length} study portions!`, 'success');
    }

    this.$aiModal.classList.add('hidden');
  }
}

// Global checklist manager singleton
window.checklistManager = new ChecklistManager();
