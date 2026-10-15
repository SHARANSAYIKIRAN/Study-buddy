/**
 * Study Buddy - Focus Timer Module
 * Implements compact circular draggable focus timer, Page Visibility auto-pause,
 * accurate delta timing, Web Audio chime, and Pomodoro cycle tracking.
 */

class FocusTimer {
  constructor() {
    this.mode = 'focus'; // 'focus', 'shortBreak', 'longBreak'
    this.isRunning = false;
    this.totalDurationSeconds = 25 * 60;
    this.remainingSeconds = 25 * 60;
    this.elapsedSeconds = 0;
    this.accumulatedStudySeconds = 0;
    this.completedSessionsCount = 1; // 1-indexed (e.g. Session 2 of 4)
    this.timerInterval = null;
    this.lastTickTimestamp = null;
    this.currentDocumentName = 'Module 4 Notes.pdf';
    this.currentSubject = 'Probability';

    // Drag state
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.initialLeft = 0;
    this.initialTop = 0;
    this.hasMoved = false;

    // Radius & Circumference for SVG ring
    // For 110px widget, SVG viewBox 0 0 110 110, center (55, 55), radius = 48
    this.radius = 48;
    this.circumference = 2 * Math.PI * this.radius;

    this.init();
  }

  init() {
    const settings = window.storageManager.getSettings();
    this.totalDurationSeconds = (settings.pomodoroMinutes || 25) * 60;
    this.remainingSeconds = this.totalDurationSeconds;

    this.bindDOM();
    this.bindEvents();
    this.bindPageVisibility();
    this.restorePosition();
    this.updateDisplay();
  }

  bindDOM() {
    // Floating Timer Elements
    this.$widget = document.getElementById('floating-timer-widget');
    this.$progressRing = document.getElementById('timer-ring-progress');
    this.$timeDisplay = document.getElementById('timer-display-time');
    this.$totalDisplay = document.getElementById('timer-display-total');
    this.$modeTag = document.getElementById('timer-display-mode');
    this.$playPauseBtn = document.getElementById('timer-btn-toggle');
    this.$playPauseIcon = document.getElementById('timer-icon-playpause');
    this.$dragHandle = document.getElementById('timer-drag-handle');
    this.$closeBtn = document.getElementById('timer-btn-minimize');

    // Minimized Pill Element
    this.$minimizedPill = document.getElementById('minimized-timer-pill');
    this.$minimizedTime = document.getElementById('minimized-timer-time');
    this.$minimizedIcon = document.getElementById('minimized-timer-icon');

    // Full Focus Timer View Elements (in dedicated view or right panel)
    this.$fullTimeDisplay = document.getElementById('full-timer-time');
    this.$fullTotalDisplay = document.getElementById('full-timer-total');
    this.$fullRingProgress = document.getElementById('full-timer-ring-progress');
    this.$fullPlayPauseBtn = document.getElementById('full-timer-playpause');
    this.$fullSessionText = document.getElementById('full-timer-session-text');
    this.$fullDotsContainer = document.getElementById('full-timer-session-dots');

    if (this.$progressRing) {
      this.$progressRing.style.strokeDasharray = `${this.circumference}`;
      this.$progressRing.style.strokeDashoffset = `${this.circumference}`;
    }
  }

  bindEvents() {
    if (!this.$widget) return;

    // Dragging using pointer events
    const onPointerDown = (e) => {
      // Don't drag if clicking buttons directly
      if (e.target.closest('button')) return;

      this.isDragging = true;
      this.hasMoved = false;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;

      const rect = this.$widget.getBoundingClientRect();
      this.initialLeft = rect.left;
      this.initialTop = rect.top;

      if (e.target.setPointerCapture) {
        e.target.setPointerCapture(e.pointerId);
      }
      e.preventDefault();
    };

    const onPointerMove = (e) => {
      if (!this.isDragging) return;

      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        this.hasMoved = true;
      }

      let newLeft = this.initialLeft + dx;
      let newTop = this.initialTop + dy;

      // Constrain within viewport bounds
      const widgetWidth = this.$widget.offsetWidth || 110;
      const widgetHeight = this.$widget.offsetHeight || 110;
      const maxLeft = window.innerWidth - widgetWidth - 10;
      const maxTop = window.innerHeight - widgetHeight - 10;

      newLeft = Math.max(10, Math.min(newLeft, maxLeft));
      newTop = Math.max(10, Math.min(newTop, maxTop));

      this.$widget.style.left = `${newLeft}px`;
      this.$widget.style.top = `${newTop}px`;
      this.$widget.style.right = 'auto';
      this.$widget.style.bottom = 'auto';
    };

    const onPointerUp = (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;

      if (this.hasMoved) {
        // Save preferred position
        const rect = this.$widget.getBoundingClientRect();
        window.storageManager.saveSettings({
          preferredTimerPos: { x: Math.round(rect.left), y: Math.round(rect.top) }
        });
      } else {
        // If minimal movement, treat as tap to toggle pause/resume
        this.toggle();
      }
    };

    this.$widget.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Minimize / Expand
    if (this.$closeBtn) {
      this.$closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.minimize();
      });
    }

    if (this.$minimizedPill) {
      this.$minimizedPill.addEventListener('click', () => {
        this.expand();
      });
    }

    if (this.$playPauseBtn) {
      this.$playPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });
    }

    if (this.$fullPlayPauseBtn) {
      this.$fullPlayPauseBtn.addEventListener('click', () => {
        this.toggle();
      });
    }
  }

  bindPageVisibility() {
    document.addEventListener('visibilitychange', () => {
      const settings = window.storageManager.getSettings();
      if (document.hidden) {
        if (this.isRunning && settings.autoPauseOnHidden !== false) {
          this.pause();
          if (window.showToast) {
            window.showToast('⏸ Focus timer auto-paused while tab is hidden', 'info');
          }
        }
      }
    });

    // Also auto-pause on window blur if configured
    window.addEventListener('blur', () => {
      // Optional background pause behavior
    });
  }

  restorePosition() {
    const settings = window.storageManager.getSettings();
    const pos = settings.preferredTimerPos;
    if (pos && pos.x !== null && pos.y !== null && this.$widget) {
      // Check if coordinates fit in current viewport
      const maxLeft = window.innerWidth - 130;
      const maxTop = window.innerHeight - 130;
      const safeLeft = Math.max(10, Math.min(pos.x, maxLeft));
      const safeTop = Math.max(10, Math.min(pos.y, maxTop));
      this.$widget.style.left = `${safeLeft}px`;
      this.$widget.style.top = `${safeTop}px`;
      this.$widget.style.right = 'auto';
      this.$widget.style.bottom = 'auto';
    }
  }

  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTickTimestamp = Date.now();

    this.timerInterval = setInterval(() => this.tick(), 250); // fast tick for responsiveness
    this.updateDisplay();

    if (window.showToast) {
      window.showToast(`⏱ ${this.mode === 'focus' ? 'Focus session started' : 'Break started'}`, 'success');
    }
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    clearInterval(this.timerInterval);
    this.timerInterval = null;

    // Commit any active study time accumulated in this session to storage
    this.commitAccumulatedStudyTime();

    this.updateDisplay();
  }

  reset() {
    this.pause();
    this.remainingSeconds = this.totalDurationSeconds;
    this.elapsedSeconds = 0;
    this.accumulatedStudySeconds = 0;
    this.updateDisplay();
  }

  tick() {
    if (!this.isRunning) return;

    const now = Date.now();
    const deltaMs = now - (this.lastTickTimestamp || now);
    const deltaSeconds = deltaMs / 1000;
    this.lastTickTimestamp = now;

    this.remainingSeconds -= deltaSeconds;
    this.elapsedSeconds += deltaSeconds;

    if (this.mode === 'focus') {
      this.accumulatedStudySeconds += deltaSeconds;

      // Periodically commit study time every 60 seconds of continuous study
      if (this.accumulatedStudySeconds >= 60) {
        this.commitAccumulatedStudyTime();
      }
    }

    if (this.remainingSeconds <= 0) {
      this.remainingSeconds = 0;
      this.handleSessionCompletion();
    } else {
      this.updateDisplay();
    }
  }

  commitAccumulatedStudyTime() {
    if (this.accumulatedStudySeconds < 1) return;

    const secondsToCommit = Math.round(this.accumulatedStudySeconds);
    this.accumulatedStudySeconds = 0;

    window.storageManager.addSession({
      durationSeconds: secondsToCommit,
      subject: this.currentSubject || 'General Eng.',
      documentName: this.currentDocumentName || 'General Study',
      mode: this.mode,
      completed: false
    });

    // Notify dashboard / views to refresh statistics
    if (window.app && typeof window.app.refreshDashboardStats === 'function') {
      window.app.refreshDashboardStats();
    }
  }

  handleSessionCompletion() {
    this.pause();
    this.commitAccumulatedStudyTime();

    this.playChime();

    if (this.mode === 'focus') {
      // Mark session as complete
      window.storageManager.addSession({
        durationSeconds: 0,
        subject: this.currentSubject || 'General Eng.',
        documentName: this.currentDocumentName || 'General Study',
        mode: 'focus',
        completed: true
      });

      this.completedSessionsCount++;
      const settings = window.storageManager.getSettings();
      const longBreakInterval = settings.longBreakInterval || 4;

      if (this.completedSessionsCount % longBreakInterval === 0) {
        this.switchMode('longBreak');
        if (window.showToast) window.showToast('🎉 Focus completed! Time for a Long Break (15m)', 'success');
      } else {
        this.switchMode('shortBreak');
        if (window.showToast) window.showToast('🎉 Focus completed! Take a 5m Short Break', 'success');
      }
    } else {
      this.switchMode('focus');
      if (window.showToast) window.showToast('🔔 Break over! Ready to focus?', 'info');
    }

    if (window.app && typeof window.app.refreshDashboardStats === 'function') {
      window.app.refreshDashboardStats();
    }
  }

  switchMode(newMode) {
    this.pause();
    this.mode = newMode;
    const settings = window.storageManager.getSettings();

    if (newMode === 'focus') {
      this.totalDurationSeconds = (settings.pomodoroMinutes || 25) * 60;
    } else if (newMode === 'shortBreak') {
      this.totalDurationSeconds = (settings.shortBreakMinutes || 5) * 60;
    } else if (newMode === 'longBreak') {
      this.totalDurationSeconds = (settings.longBreakMinutes || 15) * 60;
    }

    this.remainingSeconds = this.totalDurationSeconds;
    this.elapsedSeconds = 0;
    this.accumulatedStudySeconds = 0;
    this.updateDisplay();
  }

  setCustomDuration(minutes) {
    this.pause();
    this.totalDurationSeconds = Math.max(1, Math.min(180, minutes)) * 60;
    this.remainingSeconds = this.totalDurationSeconds;
    this.elapsedSeconds = 0;
    this.accumulatedStudySeconds = 0;
    this.updateDisplay();
  }

  adjustMinutes(delta) {
    const currentMins = Math.round(this.totalDurationSeconds / 60);
    this.setCustomDuration(currentMins + delta);
  }

  setContext(documentName, subject) {
    if (documentName) this.currentDocumentName = documentName;
    if (subject) this.currentSubject = subject;
  }

  updateDisplay() {
    const remaining = Math.max(0, Math.ceil(this.remainingSeconds));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const totalMins = Math.floor(this.totalDurationSeconds / 60);
    const totalSecs = this.totalDurationSeconds % 60;
    const totalFormatted = `/ ${String(totalMins).padStart(2, '0')}:${String(totalSecs).padStart(2, '0')}`;

    // Circular progress: ELAPSED percentage
    // At start: elapsed is 0 -> offset is circumference (empty)
    // At completion: elapsed is total -> offset is 0 (full)
    const elapsedRatio = Math.min(1, Math.max(0, (this.totalDurationSeconds - remaining) / this.totalDurationSeconds));
    const strokeOffset = this.circumference * (1 - elapsedRatio);

    // Update Floating Circular Widget
    if (this.$timeDisplay) this.$timeDisplay.textContent = timeFormatted;
    if (this.$totalDisplay) this.$totalDisplay.textContent = totalFormatted;
    if (this.$modeTag) {
      this.$modeTag.textContent = this.mode === 'focus' ? 'Focus' : (this.mode === 'shortBreak' ? 'Short Break' : 'Long Break');
    }
    if (this.$progressRing) {
      this.$progressRing.style.strokeDashoffset = `${strokeOffset}`;
      // Highlight color
      this.$progressRing.style.stroke = this.mode === 'focus' ? '#4ADE80' : '#38BDF8';
    }
    if (this.$playPauseIcon) {
      this.$playPauseIcon.textContent = this.isRunning ? '⏸' : '▶';
    }

    // Update Minimized Pill
    if (this.$minimizedTime) this.$minimizedTime.textContent = timeFormatted;
    if (this.$minimizedIcon) this.$minimizedIcon.textContent = this.isRunning ? '⏸' : '▶';

    // Update Full Focus Timer View
    if (this.$fullTimeDisplay) this.$fullTimeDisplay.textContent = timeFormatted;
    if (this.$fullTotalDisplay) this.$fullTotalDisplay.textContent = totalFormatted;
    if (this.$fullPlayPauseBtn) {
      this.$fullPlayPauseBtn.innerHTML = this.isRunning ? '<span>⏸</span> Pause' : '<span>▶</span> Start';
    }
    if (this.$fullRingProgress) {
      // For full ring with r = 120 (circumference ~ 753.98)
      const fullCircumference = 2 * Math.PI * 120;
      this.$fullRingProgress.style.strokeDasharray = `${fullCircumference}`;
      this.$fullRingProgress.style.strokeDashoffset = `${fullCircumference * (1 - elapsedRatio)}`;
      this.$fullRingProgress.style.stroke = this.mode === 'focus' ? '#4ADE80' : '#38BDF8';
    }
    if (this.$fullSessionText) {
      const cycleNum = ((this.completedSessionsCount - 1) % 4) + 1;
      this.$fullSessionText.textContent = `Session ${cycleNum} / 4`;
    }
    if (this.$fullDotsContainer) {
      const cycleNum = ((this.completedSessionsCount - 1) % 4) + 1;
      const dots = this.$fullDotsContainer.querySelectorAll('.session-dot');
      dots.forEach((dot, idx) => {
        if (idx < cycleNum) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }

    // Document title ticker when running
    if (this.isRunning) {
      document.title = `(${timeFormatted}) Study Buddy — Focus`;
    } else {
      document.title = 'Study Buddy — PDF Reader & AI Tutor';
    }
  }

  minimize() {
    if (this.$widget) this.$widget.classList.add('hidden');
    if (this.$minimizedPill) this.$minimizedPill.classList.remove('hidden');
  }

  expand() {
    if (this.$widget) this.$widget.classList.remove('hidden');
    if (this.$minimizedPill) this.$minimizedPill.classList.add('hidden');
  }

  // Synthesize pleasant completion chime using Web Audio API
  playChime() {
    const settings = window.storageManager.getSettings();
    if (settings.soundEnabled === false) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Dual chime chord (C5 + G5 or E5)
      const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.12);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.12 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 1.25);
      });
    } catch (e) {
      console.warn('Web Audio chime could not play:', e);
    }
  }
}

// Global timer singleton
window.focusTimer = new FocusTimer();
