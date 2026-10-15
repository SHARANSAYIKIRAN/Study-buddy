/**
 * Study Buddy - Main Application Controller
 * Handles user authentication (Login/Register), customized Profile Pictures (PFP),
 * view routing, dashboard metrics, AI chat interactions, and settings.
 */

class StudyBuddyApp {
  constructor() {
    this.currentView = 'dashboard';
    this.currentSubject = 'general';
    this.chatMessages = [];
    this.isAIResponding = false;
    this.authMode = 'login'; // 'login' or 'register'
    this.selectedSignupAvatar = '🦉';
    this.selectedEditAvatar = '🦉';

    this.bindDOM();
    this.bindEvents();
    this.init();
  }

  bindDOM() {
    // Navigation
    this.$sidebar = document.getElementById('app-sidebar');
    this.$sidebarToggle = document.getElementById('sidebar-toggle-btn');
    this.$navItems = document.querySelectorAll('.nav-item');
    this.$views = document.querySelectorAll('.app-view');

    // Header
    this.$headerDate = document.getElementById('header-current-date');
    this.$greetingName = document.getElementById('dashboard-greeting-name');
    this.$greetingTime = document.getElementById('dashboard-greeting-time');
    this.$headerSearch = document.getElementById('header-search-input');

    // Header User Profile & Dropdown
    this.$headerUserBtn = document.getElementById('header-user-btn');
    this.$headerUserAvatar = document.getElementById('header-user-avatar');
    this.$profileDropdown = document.getElementById('profile-dropdown-menu');
    this.$dropdownAvatar = document.getElementById('dropdown-user-avatar');
    this.$dropdownName = document.getElementById('dropdown-user-name');
    this.$dropdownEmail = document.getElementById('dropdown-user-email');
    this.$dropdownEditProfileBtn = document.getElementById('dropdown-edit-profile-btn');
    this.$dropdownSettingsBtn = document.getElementById('dropdown-settings-btn');
    this.$dropdownLogoutBtn = document.getElementById('dropdown-logout-btn');

    // Auth Screen Elements
    this.$authScreen = document.getElementById('auth-screen');
    this.$authTabLogin = document.getElementById('auth-tab-login');
    this.$authTabRegister = document.getElementById('auth-tab-register');
    this.$authUsernameGroup = document.getElementById('auth-username-group');
    this.$authUsernameInput = document.getElementById('auth-username-input');
    this.$authEmailInput = document.getElementById('auth-email-input');
    this.$authPasswordInput = document.getElementById('auth-password-input');
    this.$authTogglePwdBtn = document.getElementById('auth-toggle-pwd-btn');
    this.$authSubmitBtn = document.getElementById('auth-submit-btn');
    this.$authErrorBanner = document.getElementById('auth-error-banner');
    this.$authGuestLink = document.getElementById('auth-guest-link');
    this.$authAvatarSection = document.getElementById('auth-avatar-section');
    this.$authAvatarPreview = document.getElementById('auth-avatar-preview');
    this.$authAvatarIcon = document.getElementById('auth-avatar-icon');
    this.$authPfpFile = document.getElementById('auth-pfp-file');
    this.$authUploadPfpBtn = document.getElementById('auth-upload-pfp-btn');
    this.$authAvatarPresets = document.querySelectorAll('#auth-avatar-presets .avatar-preset-btn');

    // Edit Profile Modal Elements
    this.$editProfileModal = document.getElementById('edit-profile-modal');
    this.$editProfileAvatarPreview = document.getElementById('edit-modal-avatar-preview');
    this.$editProfileAvatarIcon = document.getElementById('edit-modal-avatar-icon');
    this.$editProfilePfpFile = document.getElementById('edit-modal-pfp-file');
    this.$editProfileUploadBtn = document.getElementById('edit-modal-upload-btn');
    this.$editProfileAvatarPresets = document.querySelectorAll('#edit-modal-avatar-presets .avatar-preset-btn');
    this.$editProfileUsernameInput = document.getElementById('edit-profile-username-input');
    this.$editProfileEmailInput = document.getElementById('edit-profile-email-input');
    this.$editProfileSaveBtn = document.getElementById('edit-profile-save-btn');
    this.$editProfileCancelBtn = document.getElementById('edit-profile-cancel-btn');

    // Dashboard Metric Cards
    this.$metricTodayTime = document.getElementById('metric-today-time');
    this.$metricTodayTrend = document.getElementById('metric-today-trend');
    this.$metricTodaySparkline = document.getElementById('metric-today-sparkline');
    this.$metricWeekTime = document.getElementById('metric-week-time');
    this.$metricWeekChart = document.getElementById('metric-week-chart');
    this.$metricStreakDays = document.getElementById('metric-streak-days');
    this.$metricStreakDots = document.getElementById('metric-streak-dots');
    this.$metricWeeklyGoalPct = document.getElementById('metric-weekly-goal-pct');
    this.$metricWeeklyGoalBar = document.getElementById('metric-weekly-goal-bar');
    this.$metricWeeklyGoalSub = document.getElementById('metric-weekly-goal-sub');

    // Dashboard Lists & Charts
    this.$recentPdfsContainer = document.getElementById('dashboard-recent-pdfs');
    this.$todayTasksContainer = document.getElementById('dashboard-today-tasks');
    this.$dashboardAddTaskBtn = document.getElementById('dashboard-add-task-btn');
    this.$distributionDonut = document.getElementById('dashboard-distribution-donut');
    this.$distributionCenterText = document.getElementById('distribution-center-time');
    this.$distributionLegend = document.getElementById('dashboard-distribution-legend');

    // Study Room Right Sidebar Tabs
    this.$studyRoomTabs = document.querySelectorAll('.study-tab-btn');
    this.$studyRoomPanels = document.querySelectorAll('.study-tab-panel');

    // AI Assistant Chat Elements
    this.$aiMessages = document.getElementById('ai-chat-messages');
    this.$aiInput = document.getElementById('ai-chat-input');
    this.$aiSendBtn = document.getElementById('ai-chat-send-btn');
    this.$aiProviderSelect = document.getElementById('ai-model-selector');
    this.$aiSubjectTabs = document.querySelectorAll('.study-subject-pill');
    this.$aiTypingIndicator = document.getElementById('ai-typing-indicator');

    // Action buttons in Study Room
    this.$explainPageBtn = document.getElementById('action-explain-page');
    this.$quizPageBtn = document.getElementById('action-quiz-page');
    this.$quizGeneralBtn = document.getElementById('action-quiz-general');

    // Modals
    this.$addTaskModal = document.getElementById('add-task-modal');
    this.$taskTitleInput = document.getElementById('task-title-input');
    this.$taskTimeInput = document.getElementById('task-time-input');
    this.$taskSubjectSelect = document.getElementById('task-subject-select');
    this.$taskSaveBtn = document.getElementById('task-save-btn');
    this.$taskCancelBtn = document.getElementById('task-cancel-btn');

    // Settings elements
    this.$settingsAvatarPreview = document.getElementById('settings-avatar-preview');
    this.$settingsAvatarIcon = document.getElementById('settings-avatar-icon');
    this.$settingsPfpFile = document.getElementById('settings-pfp-file');
    this.$settingsUploadPfpBtn = document.getElementById('settings-upload-pfp-btn');
    this.$settingsAvatarPresets = document.querySelectorAll('#settings-avatar-presets .avatar-preset-btn');
    this.$settingsNameInput = document.getElementById('settings-user-name');
    this.$settingsUserEmail = document.getElementById('settings-user-email');
    this.$settingsDailyGoal = document.getElementById('settings-daily-goal');
    this.$settingsWeeklyGoal = document.getElementById('settings-weekly-goal');
    this.$settingsPomodoroDuration = document.getElementById('settings-pomodoro-duration');
    this.$settingsShortBreak = document.getElementById('settings-short-break');
    this.$settingsAutoPause = document.getElementById('settings-auto-pause');
    this.$settingsSound = document.getElementById('settings-sound-enabled');
    this.$settingsProviderSelect = document.getElementById('settings-provider-select');
    this.$settingsGeminiKey = document.getElementById('settings-gemini-key');
    this.$settingsOpenaiKey = document.getElementById('settings-openai-key');
    this.$settingsClaudeKey = document.getElementById('settings-claude-key');
    this.$settingsOpenrouterKey = document.getElementById('settings-openrouter-key');
    this.$settingsOllamaUrl = document.getElementById('settings-ollama-url');
    this.$settingsOllamaModel = document.getElementById('settings-ollama-model');
    this.$settingsSaveBtn = document.getElementById('settings-save-btn');
    this.$settingsTestKeyBtn = document.getElementById('settings-test-key-btn');
    this.$settingsExportBtn = document.getElementById('settings-export-data');
    this.$settingsResetBtn = document.getElementById('settings-reset-data');
  }

  bindEvents() {
    this.bindAuthEvents();
    this.bindProfileEvents();

    // Navigation routing
    this.$navItems.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetView = btn.dataset.view;
        this.navigateTo(targetView);
      });
    });

    // Sidebar collapse / expand
    if (this.$sidebarToggle && this.$sidebar) {
      this.$sidebarToggle.addEventListener('click', () => {
        this.$sidebar.classList.toggle('collapsed');
      });
    }

    // Study Room right tabs (AI Assistant, Checklist, Notes)
    this.$studyRoomTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const tabTarget = tab.dataset.tab;
        this.switchStudyTab(tabTarget);
      });
    });

    // AI Subject selection
    this.$aiSubjectTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        this.$aiSubjectTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentSubject = tab.dataset.subject;
        window.showToast(`${tab.textContent.trim()} mode active`);
      });
    });

    // AI Provider / Model dropdown in Study Room
    if (this.$aiProviderSelect) {
      this.$aiProviderSelect.addEventListener('change', () => {
        const [provider, model] = this.$aiProviderSelect.value.split(':');
        window.storageManager.saveSettings({
          activeProvider: provider,
          activeModel: model
        });
        window.showToast(`Switched to ${model}`, 'success');
      });
    }

    // AI Send message
    if (this.$aiSendBtn && this.$aiInput) {
      this.$aiSendBtn.addEventListener('click', () => this.sendAIMessage());
      this.$aiInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendAIMessage();
        }
      });
    }

    // Quick prompt chips
    document.querySelectorAll('.quick-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        if (this.$aiInput) {
          this.$aiInput.value = chip.dataset.prompt;
          this.sendAIMessage();
        }
      });
    });

    // Study Room Action buttons
    if (this.$explainPageBtn) {
      this.$explainPageBtn.addEventListener('click', () => {
        const pageNum = window.pdfViewer.currentPage;
        const pageText = window.pdfViewer.getCurrentPageText();
        this.switchStudyTab('ai');
        if (this.$aiInput) {
          this.$aiInput.value = `Explain the key concepts on Page ${pageNum} in clear, simple terms:\n"${pageText.substring(0, 1200)}"`;
          this.sendAIMessage();
        }
      });
    }

    if (this.$quizPageBtn) {
      this.$quizPageBtn.addEventListener('click', () => {
        const pageNum = window.pdfViewer.currentPage;
        const pageText = window.pdfViewer.getCurrentPageText();
        this.switchStudyTab('ai');
        if (this.$aiInput) {
          this.$aiInput.value = `Generate an interactive 3-question quiz with multiple choice based on Page ${pageNum}:\n"${pageText.substring(0, 1200)}"`;
          this.sendAIMessage();
        }
      });
    }

    if (this.$quizGeneralBtn) {
      this.$quizGeneralBtn.addEventListener('click', () => {
        this.switchStudyTab('ai');
        if (this.$aiInput) {
          this.$aiInput.value = `Quiz me with 3 interactive questions on current topic: Probability & Stochastic Processes`;
          this.sendAIMessage();
        }
      });
    }

    // Tasks modal
    if (this.$dashboardAddTaskBtn) {
      this.$dashboardAddTaskBtn.addEventListener('click', () => this.openTaskModal());
    }
    if (this.$taskCancelBtn) {
      this.$taskCancelBtn.addEventListener('click', () => this.closeTaskModal());
    }
    if (this.$taskSaveBtn) {
      this.$taskSaveBtn.addEventListener('click', () => this.saveNewTask());
    }

    // Settings save
    if (this.$settingsSaveBtn) {
      this.$settingsSaveBtn.addEventListener('click', () => this.saveAllSettings());
    }

    // Settings test key
    if (this.$settingsTestKeyBtn) {
      this.$settingsTestKeyBtn.addEventListener('click', () => this.testActiveProviderKey());
    }

    // Settings Export / Reset
    if (this.$settingsExportBtn) {
      this.$settingsExportBtn.addEventListener('click', () => this.exportUserData());
    }
    if (this.$settingsResetBtn) {
      this.$settingsResetBtn.addEventListener('click', () => this.resetUserData());
    }

    // Notes auto-save in Study Room
    const notesEditor = document.getElementById('study-room-notes-editor');
    if (notesEditor) {
      notesEditor.value = window.storageManager.getNotes('Module 4 Notes.pdf');
      notesEditor.addEventListener('input', () => {
        window.storageManager.saveNotes(window.pdfViewer.currentDocName || 'Module 4 Notes.pdf', notesEditor.value);
      });
    }

    // Search bar handler
    if (this.$headerSearch) {
      this.$headerSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const q = this.$headerSearch.value.trim();
          if (q) {
            this.navigateTo('study');
            this.switchStudyTab('ai');
            if (this.$aiInput) {
              this.$aiInput.value = q;
              this.sendAIMessage();
            }
            this.$headerSearch.value = '';
          }
        }
      });
    }
  }

  // --- AUTHENTICATION & LOGIN/SIGNUP EVENTS ---
  bindAuthEvents() {
    // Toggle Auth Mode (Sign In vs Register)
    if (this.$authTabLogin) {
      this.$authTabLogin.addEventListener('click', () => this.setAuthMode('login'));
    }
    if (this.$authTabRegister) {
      this.$authTabRegister.addEventListener('click', () => this.setAuthMode('register'));
    }

    // Password visibility toggle
    if (this.$authTogglePwdBtn && this.$authPasswordInput) {
      this.$authTogglePwdBtn.addEventListener('click', () => {
        const isPwd = this.$authPasswordInput.type === 'password';
        this.$authPasswordInput.type = isPwd ? 'text' : 'password';
        this.$authTogglePwdBtn.textContent = isPwd ? 'Hide' : 'Show';
      });
    }

    // Custom PFP Upload in Auth
    if (this.$authUploadPfpBtn && this.$authPfpFile) {
      this.$authUploadPfpBtn.addEventListener('click', () => this.$authPfpFile.click());
    }
    if (this.$authAvatarPreview && this.$authPfpFile) {
      this.$authAvatarPreview.addEventListener('click', () => this.$authPfpFile.click());
    }
    if (this.$authPfpFile) {
      this.$authPfpFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            this.selectedSignupAvatar = evt.target.result;
            this.renderAvatar(this.$authAvatarPreview, this.selectedSignupAvatar);
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Preset Avatar Buttons in Auth
    this.$authAvatarPresets.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.$authAvatarPresets.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedSignupAvatar = btn.dataset.avatar;
        this.renderAvatar(this.$authAvatarPreview, this.selectedSignupAvatar);
      });
    });

    // Auth Submit (Login / Register)
    if (this.$authSubmitBtn) {
      this.$authSubmitBtn.addEventListener('click', () => this.handleAuthSubmit());
    }
    if (this.$authPasswordInput) {
      this.$authPasswordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleAuthSubmit();
      });
    }

    // Guest Link
    if (this.$authGuestLink) {
      this.$authGuestLink.addEventListener('click', (e) => {
        e.preventDefault();
        try {
          const guestUser = window.storageManager.register({
            username: 'Student',
            email: 'student@gmail.com',
            password: 'guest',
            avatar: '🦉'
          });
          this.onAuthSuccess(guestUser);
        } catch (err) {
          // If already exists, log in
          const guestUser = window.storageManager.login({
            emailOrUsername: 'student@gmail.com',
            password: 'guest'
          });
          this.onAuthSuccess(guestUser);
        }
      });
    }
  }

  setAuthMode(mode) {
    this.authMode = mode;
    this.hideAuthError();

    if (mode === 'login') {
      this.$authTabLogin.classList.add('active');
      this.$authTabRegister.classList.remove('active');
      this.$authUsernameGroup.style.display = 'none';
      this.$authAvatarSection.style.display = 'none';
      this.$authSubmitBtn.textContent = 'Sign In';
      this.$authEmailInput.placeholder = 'name@gmail.com or username';
    } else {
      this.$authTabLogin.classList.remove('active');
      this.$authTabRegister.classList.add('active');
      this.$authUsernameGroup.style.display = 'flex';
      this.$authAvatarSection.style.display = 'flex';
      this.$authSubmitBtn.textContent = 'Create Account';
      this.$authEmailInput.placeholder = 'name@gmail.com';
    }
  }

  showAuthError(msg) {
    if (this.$authErrorBanner) {
      this.$authErrorBanner.textContent = `⚠️ ${msg}`;
      this.$authErrorBanner.classList.add('show');
    }
  }

  hideAuthError() {
    if (this.$authErrorBanner) {
      this.$authErrorBanner.classList.remove('show');
    }
  }

  handleAuthSubmit() {
    this.hideAuthError();
    const email = this.$authEmailInput.value.trim();
    const password = this.$authPasswordInput.value.trim();
    const username = this.$authUsernameInput ? this.$authUsernameInput.value.trim() : '';

    try {
      if (this.authMode === 'login') {
        const user = window.storageManager.login({ emailOrUsername: email, password });
        this.onAuthSuccess(user);
        window.showToast(`Welcome back, ${user.username}!`, 'success');
      } else {
        const user = window.storageManager.register({
          username,
          email,
          password,
          avatar: this.selectedSignupAvatar
        });
        this.onAuthSuccess(user);
        window.showToast(`Account created! Welcome, ${user.username}!`, 'success');
      }
    } catch (err) {
      this.showAuthError(err.message);
    }
  }

  onAuthSuccess(user) {
    if (this.$authScreen) {
      this.$authScreen.classList.add('hidden');
    }
    this.updateUserUI(user);
    this.refreshDashboardStats();
    this.populateSettingsForm();

    // Auto-load sample PDF in Study Room
    if (window.pdfViewer && !window.pdfViewer.pdfDoc) {
      window.pdfViewer.loadFromUrl('sample/Module_4_Notes.pdf', 'Module 4 Notes.pdf');
    }
  }

  // --- USER PROFILE & PFP MANAGEMENT ---
  bindProfileEvents() {
    // Header Avatar Toggle Dropdown
    if (this.$headerUserBtn && this.$profileDropdown) {
      this.$headerUserBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.$profileDropdown.classList.toggle('hidden');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!this.$profileDropdown.contains(e.target) && !this.$headerUserBtn.contains(e.target)) {
          this.$profileDropdown.classList.add('hidden');
        }
      });
    }

    // Profile Dropdown Actions
    if (this.$dropdownEditProfileBtn) {
      this.$dropdownEditProfileBtn.addEventListener('click', () => {
        this.$profileDropdown.classList.add('hidden');
        this.openEditProfileModal();
      });
    }

    if (this.$dropdownSettingsBtn) {
      this.$dropdownSettingsBtn.addEventListener('click', () => {
        this.$profileDropdown.classList.add('hidden');
        this.navigateTo('settings');
      });
    }

    if (this.$dropdownLogoutBtn) {
      this.$dropdownLogoutBtn.addEventListener('click', () => {
        this.$profileDropdown.classList.add('hidden');
        window.storageManager.logout();
        if (this.$authScreen) {
          this.$authScreen.classList.remove('hidden');
        }
        window.showToast('Signed out', 'info');
      });
    }

    // Edit Profile Modal Events
    if (this.$editProfileCancelBtn) {
      this.$editProfileCancelBtn.addEventListener('click', () => {
        this.$editProfileModal.classList.add('hidden');
      });
    }

    if (this.$editProfileUploadBtn && this.$editProfilePfpFile) {
      this.$editProfileUploadBtn.addEventListener('click', () => this.$editProfilePfpFile.click());
    }
    if (this.$editProfileAvatarPreview && this.$editProfilePfpFile) {
      this.$editProfileAvatarPreview.addEventListener('click', () => this.$editProfilePfpFile.click());
    }
    if (this.$editProfilePfpFile) {
      this.$editProfilePfpFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            this.selectedEditAvatar = evt.target.result;
            this.renderAvatar(this.$editProfileAvatarPreview, this.selectedEditAvatar);
          };
          reader.readAsDataURL(file);
        }
      });
    }

    this.$editProfileAvatarPresets.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.$editProfileAvatarPresets.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedEditAvatar = btn.dataset.avatar;
        this.renderAvatar(this.$editProfileAvatarPreview, this.selectedEditAvatar);
      });
    });

    if (this.$editProfileSaveBtn) {
      this.$editProfileSaveBtn.addEventListener('click', () => this.saveEditProfileModal());
    }

    // Settings Profile & PFP Upload
    if (this.$settingsUploadPfpBtn && this.$settingsPfpFile) {
      this.$settingsUploadPfpBtn.addEventListener('click', () => this.$settingsPfpFile.click());
    }
    if (this.$settingsAvatarPreview && this.$settingsPfpFile) {
      this.$settingsAvatarPreview.addEventListener('click', () => this.$settingsPfpFile.click());
    }
    if (this.$settingsPfpFile) {
      this.$settingsPfpFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const avatarData = evt.target.result;
            window.storageManager.updateProfile({ avatar: avatarData });
            this.updateUserUI(window.storageManager.getCurrentUser());
            window.showToast('Profile photo updated!', 'success');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    this.$settingsAvatarPresets.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.$settingsAvatarPresets.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        window.storageManager.updateProfile({ avatar: btn.dataset.avatar });
        this.updateUserUI(window.storageManager.getCurrentUser());
        window.showToast('Avatar updated!', 'success');
      });
    });
  }

  openEditProfileModal() {
    const user = window.storageManager.getCurrentUser();
    if (!user || !this.$editProfileModal) return;

    this.selectedEditAvatar = user.avatar || '🦉';
    this.renderAvatar(this.$editProfileAvatarPreview, this.selectedEditAvatar);

    if (this.$editProfileUsernameInput) this.$editProfileUsernameInput.value = user.username;
    if (this.$editProfileEmailInput) this.$editProfileEmailInput.value = user.email;

    this.$editProfileModal.classList.remove('hidden');
  }

  saveEditProfileModal() {
    const username = this.$editProfileUsernameInput.value.trim();
    const email = this.$editProfileEmailInput.value.trim();

    if (!username) {
      window.showToast('Please enter a username', 'error');
      return;
    }

    const updatedUser = window.storageManager.updateProfile({
      username,
      email,
      avatar: this.selectedEditAvatar
    });

    this.$editProfileModal.classList.add('hidden');
    this.updateUserUI(updatedUser);
    this.refreshDashboardStats();
    window.showToast('✅ Profile updated successfully!', 'success');
  }

  renderAvatar(containerElement, avatarVal) {
    if (!containerElement) return;

    if (avatarVal && (avatarVal.startsWith('data:image') || avatarVal.startsWith('http'))) {
      containerElement.innerHTML = `<img src="${avatarVal}" alt="PFP" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    } else {
      containerElement.innerHTML = `<span>${avatarVal || '👤'}</span>`;
    }
  }

  updateUserUI(user) {
    if (!user) return;

    // Header avatar
    this.renderAvatar(this.$headerUserAvatar, user.avatar);

    // Dropdown details
    this.renderAvatar(this.$dropdownAvatar, user.avatar);
    if (this.$dropdownName) this.$dropdownName.textContent = user.username;
    if (this.$dropdownEmail) this.$dropdownEmail.textContent = user.email;

    // Settings details
    this.renderAvatar(this.$settingsAvatarPreview, user.avatar);
    if (this.$settingsNameInput) this.$settingsNameInput.value = user.username;
    if (this.$settingsUserEmail) this.$settingsUserEmail.value = user.email;

    // Dashboard greeting
    if (this.$greetingName) this.$greetingName.textContent = user.username;
    this.updateHeaderGreeting();
  }

  init() {
    this.setAuthMode('login');

    const currentUser = window.storageManager.getCurrentUser();
    if (currentUser) {
      if (this.$authScreen) this.$authScreen.classList.add('hidden');
      this.updateUserUI(currentUser);
      this.refreshDashboardStats();
      this.populateSettingsForm();
    } else {
      if (this.$authScreen) this.$authScreen.classList.remove('hidden');
    }

    // Auto-load sample PDF in Study Room
    if (window.pdfViewer) {
      window.pdfViewer.loadFromUrl('sample/Module_4_Notes.pdf', 'Module 4 Notes.pdf');
    }

    // Seed initial AI welcome chat message
    this.renderInitialAIMessage();
  }

  navigateTo(viewId) {
    this.currentView = viewId;

    this.$navItems.forEach((btn) => {
      if (btn.dataset.view === viewId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.$views.forEach((view) => {
      if (view.id === `view-${viewId}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    if (viewId === 'dashboard') {
      this.refreshDashboardStats();
    } else if (viewId === 'study') {
      if (window.pdfViewer && !window.pdfViewer.pdfDoc) {
        window.pdfViewer.loadFromUrl('sample/Module_4_Notes.pdf', 'Module 4 Notes.pdf');
      }
    } else if (viewId === 'tasks') {
      this.renderFullTasksView();
    } else if (viewId === 'statistics') {
      this.renderFullStatisticsView();
    } else if (viewId === 'notes') {
      this.renderFullNotesView();
    } else if (viewId === 'settings') {
      this.populateSettingsForm();
    }
  }

  switchStudyTab(tabId) {
    this.$studyRoomTabs.forEach((t) => {
      if (t.dataset.tab === tabId) t.classList.add('active');
      else t.classList.remove('active');
    });
    this.$studyRoomPanels.forEach((p) => {
      if (p.id === `panel-${tabId}`) p.classList.add('active');
      else p.classList.remove('active');
    });
  }

  updateHeaderGreeting() {
    const user = window.storageManager.getCurrentUser();
    const name = user ? user.username : 'Student';

    if (this.$greetingName) this.$greetingName.textContent = name;

    const hour = new Date().getHours();
    let timeGreeting = 'Good Morning,';
    if (hour >= 12 && hour < 17) timeGreeting = 'Good Afternoon,';
    else if (hour >= 17) timeGreeting = 'Good Evening,';

    if (this.$greetingTime) this.$greetingTime.textContent = timeGreeting;

    if (this.$headerDate) {
      const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
      this.$headerDate.textContent = new Date().toLocaleDateString('en-US', options);
    }
  }

  refreshDashboardStats() {
    const stats = window.storageManager.getTodayStats();
    const streak = window.storageManager.getStreakStats();
    const settings = window.storageManager.getSettings();

    // 1. Today's Study Time
    if (this.$metricTodayTime) {
      this.$metricTodayTime.textContent = window.storageManager.formatHoursMinutes(stats.todaySeconds);
    }
    if (this.$metricTodayTrend) {
      const isPositive = stats.pctChange >= 0;
      this.$metricTodayTrend.textContent = `${isPositive ? '↑' : '↓'} ${Math.abs(stats.pctChange)}%`;
      this.$metricTodayTrend.className = `metric-trend-badge ${isPositive ? 'positive' : 'negative'}`;
    }
    if (this.$metricTodaySparkline) {
      this.renderSparkline(this.$metricTodaySparkline, stats.hourlyBars);
    }

    // 2. This Week
    if (this.$metricWeekTime) {
      this.$metricWeekTime.textContent = window.storageManager.formatHoursMinutes(stats.weekTotalSeconds);
    }
    if (this.$metricWeekChart) {
      this.renderWeeklyBarChart(this.$metricWeekChart, stats.weekDaySeconds);
    }

    // 3. Study Streak
    if (this.$metricStreakDays) {
      this.$metricStreakDays.textContent = `${streak.currentStreak} days`;
    }
    if (this.$metricStreakDots) {
      this.renderStreakDots(this.$metricStreakDots, streak.weekDots);
    }

    // 4. Weekly Goal
    if (this.$metricWeeklyGoalPct) {
      this.$metricWeeklyGoalPct.textContent = `${stats.weeklyGoalPct}%`;
    }
    if (this.$metricWeeklyGoalBar) {
      this.$metricWeeklyGoalBar.style.width = `${stats.weeklyGoalPct}%`;
    }
    if (this.$metricWeeklyGoalSub) {
      const currentHours = Math.round(stats.weekTotalSeconds / 3600);
      const targetHours = settings.weeklyGoalHours || 28;
      this.$metricWeeklyGoalSub.textContent = `${currentHours}h / ${targetHours}h`;
    }

    // 5. Recently Studied PDFs
    this.renderRecentPdfs();

    // 6. Today's Tasks
    this.renderTodayTasks();

    // 7. Study Distribution Donut
    this.renderDistributionChart(stats.subjectBreakdown, stats.todaySeconds);
  }

  renderSparkline(container, barsData) {
    container.innerHTML = '';
    const max = Math.max(1, ...barsData);
    barsData.forEach((val) => {
      const bar = document.createElement('div');
      bar.className = 'spark-bar';
      const heightPct = Math.max(15, Math.round((val / max) * 100));
      bar.style.height = `${heightPct}%`;
      container.appendChild(bar);
    });
  }

  renderWeeklyBarChart(container, dailySeconds) {
    container.innerHTML = '';
    const max = Math.max(3600, ...dailySeconds);
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const currentDay = new Date().getDay();
    const currentIdx = currentDay === 0 ? 6 : currentDay - 1;

    dailySeconds.forEach((sec, idx) => {
      const col = document.createElement('div');
      col.className = `week-col ${idx === currentIdx ? 'active' : ''}`;

      const bar = document.createElement('div');
      bar.className = 'week-bar';
      const pct = Math.max(10, Math.round((sec / max) * 100));
      bar.style.height = `${pct}%`;

      const label = document.createElement('span');
      label.className = 'week-label';
      label.textContent = dayLabels[idx];

      col.appendChild(bar);
      col.appendChild(label);
      container.appendChild(col);
    });
  }

  renderStreakDots(container, weekDots) {
    container.innerHTML = '';
    weekDots.forEach((d) => {
      const dotWrap = document.createElement('div');
      dotWrap.className = 'streak-dot-col';

      const dot = document.createElement('div');
      dot.className = `streak-dot ${d.reached ? 'reached' : ''} ${d.isToday ? 'today' : ''}`;

      const label = document.createElement('span');
      label.className = 'streak-day-label';
      label.textContent = d.dayName;

      dotWrap.appendChild(dot);
      dotWrap.appendChild(label);
      container.appendChild(dotWrap);
    });
  }

  renderRecentPdfs() {
    if (!this.$recentPdfsContainer) return;
    this.$recentPdfsContainer.innerHTML = '';

    const docs = window.storageManager.getDocuments();
    const docEntries = Object.values(docs).sort((a, b) => (b.lastStudied || 0) - (a.lastStudied || 0));

    if (!docEntries.length) {
      this.$recentPdfsContainer.innerHTML = `<div class="empty-state" style="padding:16px; color:var(--text-muted); text-align:center;">No PDFs studied yet. Open Study Room to read your first document.</div>`;
      return;
    }

    docEntries.forEach((doc) => {
      const checklist = window.storageManager.getChecklist(doc.name);
      const total = checklist.length || 8;
      const done = checklist.filter((i) => i.completed).length;
      const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;
      const formattedTime = window.storageManager.formatHoursMinutes(doc.totalSeconds || 0);

      const card = document.createElement('div');
      card.className = 'recent-pdf-row';
      card.innerHTML = `
        <div class="pdf-icon-square">
          <span>📄</span>
        </div>
        <div class="pdf-info-wrap">
          <div class="pdf-title-row">
            <span class="pdf-name">${doc.name}</span>
            <span class="pdf-time-spent">${formattedTime}</span>
          </div>
          <div class="pdf-subject-tag">${doc.subject || 'Engineering'}</div>
          <div class="pdf-progress-track">
            <div class="pdf-progress-fill" style="width: ${progressPct}%"></div>
          </div>
        </div>
        <div class="pdf-fraction-badge">${done} / ${total}</div>
      `;

      card.addEventListener('click', () => {
        this.navigateTo('study');
        if (window.pdfViewer) {
          if (doc.name === 'Module 4 Notes.pdf') {
            window.pdfViewer.loadFromUrl('sample/Module_4_Notes.pdf', doc.name);
          } else {
            window.showToast(`Selected ${doc.name}`);
          }
        }
      });

      this.$recentPdfsContainer.appendChild(card);
    });
  }

  renderTodayTasks() {
    if (!this.$todayTasksContainer) return;
    this.$todayTasksContainer.innerHTML = '';

    const tasks = window.storageManager.getTasks();

    if (!tasks.length) {
      this.$todayTasksContainer.innerHTML = `
        <div class="empty-state" style="padding:16px; text-align:center; color:var(--text-muted);">
          <p style="margin-bottom:8px;">No tasks scheduled for today.</p>
          <button class="panel-card-btn" onclick="window.app.openTaskModal()">+ Add Your First Task</button>
        </div>
      `;
      return;
    }

    tasks.forEach((t) => {
      const row = document.createElement('div');
      row.className = `task-row ${t.completed ? 'completed' : ''}`;
      row.innerHTML = `
        <label class="custom-checkbox">
          <input type="checkbox" ${t.completed ? 'checked' : ''} />
          <span class="checkbox-indicator"></span>
        </label>
        <span class="task-title">${t.title}</span>
        <span class="task-time-badge">${t.time || '10:00 - 11:00'}</span>
        <button class="task-delete-btn" title="Delete">✕</button>
      `;

      const chk = row.querySelector('input');
      chk.addEventListener('change', () => {
        window.storageManager.toggleTask(t.id);
        this.renderTodayTasks();
      });

      const delBtn = row.querySelector('.task-delete-btn');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.storageManager.deleteTask(t.id);
        this.renderTodayTasks();
      });

      this.$todayTasksContainer.appendChild(row);
    });
  }

  renderDistributionChart(subjectMap, totalSeconds) {
    if (!this.$distributionDonut || !this.$distributionLegend) return;
    this.$distributionLegend.innerHTML = '';

    const defaultColors = {
      Probability: '#4ADE80',
      DSA: '#38BDF8',
      'Digital Electronics': '#A855F7',
      'General Eng.': '#FB923C',
      Others: '#71717A'
    };

    const entries = Object.entries(subjectMap || {});

    if (this.$distributionCenterText) {
      this.$distributionCenterText.textContent = window.storageManager.formatHoursMinutes(totalSeconds);
    }

    if (!entries.length || totalSeconds === 0) {
      this.$distributionDonut.innerHTML = `
        <circle cx="100" cy="100" r="70" fill="none" stroke="#262626" stroke-width="24" />
      `;
      this.$distributionLegend.innerHTML = `
        <div style="font-size:12px; color:var(--text-muted); text-align:center; padding:10px;">
          Start studying with the Focus Timer to see your subject breakdown!
        </div>
      `;
      return;
    }

    const circumference = 2 * Math.PI * 70;
    let accumulatedAngle = 0;
    this.$distributionDonut.innerHTML = '';

    entries.forEach(([subj, sec], i) => {
      const color = defaultColors[subj] || ['#4ADE80', '#38BDF8', '#A855F7', '#FB923C', '#FBBF24'][i % 5];
      const ratio = sec / totalSeconds;
      const strokeLength = circumference * ratio;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '100');
      circle.setAttribute('cy', '100');
      circle.setAttribute('r', '70');
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', '24');
      circle.setAttribute('stroke-dasharray', `${strokeLength} ${circumference}`);
      circle.setAttribute('transform', `rotate(${-90 + accumulatedAngle} 100 100)`);
      circle.style.transition = 'stroke-dasharray 0.5s ease';

      this.$distributionDonut.appendChild(circle);
      accumulatedAngle += ratio * 360;

      const legItem = document.createElement('div');
      legItem.className = 'distribution-legend-item';
      legItem.innerHTML = `
        <span class="legend-dot" style="background: ${color}"></span>
        <span class="legend-label">${subj}</span>
        <span class="legend-val">${window.storageManager.formatHoursMinutes(sec)}</span>
      `;
      this.$distributionLegend.appendChild(legItem);
    });
  }

  // --- AI CHAT SYSTEM ---

  renderInitialAIMessage() {
    if (!this.$aiMessages) return;
    this.$aiMessages.innerHTML = '';

    const user = window.storageManager.getCurrentUser();
    const name = user ? user.username : 'there';

    const introDiv = document.createElement('div');
    introDiv.className = 'message ai';
    introDiv.innerHTML = `
      <div class="msg-avatar">🦉</div>
      <div class="msg-content">
        <div class="msg-subject-badge" style="background: rgba(168,85,247,0.15); border: 1px solid rgba(168,85,247,0.3); color: #c4b5fd;">
          🌟 Probability & Engineering Tutor
        </div>
        <div class="msg-bubble">
          <p>Hi ${name}! I'm <strong>Study Buddy</strong>, your AI study assistant. Ask me questions about <strong>Module 4 Notes.pdf</strong>, request step-by-step math derivations, or take an interactive practice quiz!</p>
        </div>
        <div class="msg-time">Just now</div>
      </div>
    `;
    this.$aiMessages.appendChild(introDiv);
  }

  async sendAIMessage() {
    const text = this.$aiInput.value.trim();
    if (!text || this.isAIResponding) return;

    this.$aiInput.value = '';
    this.appendMessage('user', text);

    const pageNum = window.pdfViewer ? window.pdfViewer.currentPage : 1;
    const pageText = window.pdfViewer ? window.pdfViewer.getCurrentPageText() : '';

    this.showTyping(true);
    this.isAIResponding = true;

    try {
      const response = await window.aiManager.sendMessage({
        message: text,
        pdfContext: pageText ? `Page ${pageNum}: ${pageText}` : '',
        history: this.chatMessages,
        subject: this.currentSubject
      });

      this.showTyping(false);
      this.appendMessage('ai', response);
      this.chatMessages.push({ role: 'ai', text: response });
    } catch (err) {
      this.showTyping(false);
      this.appendMessage('ai', `⚠️ **Error**: ${err.message}\n\nPlease check your provider configuration in **Settings ⚙️**.`);
    } finally {
      this.isAIResponding = false;
    }
  }

  appendMessage(role, text) {
    if (!this.$aiMessages) return;

    const user = window.storageManager.getCurrentUser();
    const msg = document.createElement('div');
    msg.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    if (role === 'ai') {
      avatar.textContent = '🦉';
    } else {
      this.renderAvatar(avatar, user ? user.avatar : '👤');
    }

    const content = document.createElement('div');
    content.className = 'msg-content';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    if (role === 'ai') {
      window.quizEngine.processAIMessage(bubble, text);
    } else {
      bubble.textContent = text;
      this.chatMessages.push({ role: 'user', text });
    }

    const time = document.createElement('div');
    time.className = 'msg-time';
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    content.appendChild(bubble);
    content.appendChild(time);
    msg.appendChild(avatar);
    msg.appendChild(content);

    this.$aiMessages.appendChild(msg);
    this.$aiMessages.scrollTop = this.$aiMessages.scrollHeight;
  }

  showTyping(show) {
    if (this.$aiTypingIndicator) {
      this.$aiTypingIndicator.style.display = show ? 'flex' : 'none';
      if (show && this.$aiMessages) {
        this.$aiMessages.scrollTop = this.$aiMessages.scrollHeight;
      }
    }
  }

  // --- TASK MODAL ---
  openTaskModal() {
    if (this.$addTaskModal) {
      this.$addTaskModal.classList.remove('hidden');
      if (this.$taskTitleInput) {
        this.$taskTitleInput.value = '';
        this.$taskTitleInput.focus();
      }
    }
  }

  closeTaskModal() {
    if (this.$addTaskModal) this.$addTaskModal.classList.add('hidden');
  }

  saveNewTask() {
    const title = this.$taskTitleInput.value.trim();
    const time = this.$taskTimeInput.value.trim() || '10:00 - 11:00';
    const subj = this.$taskSubjectSelect ? this.$taskSubjectSelect.value : 'cs';

    if (!title) {
      window.showToast('Please enter a task title', 'error');
      return;
    }

    window.storageManager.addTask({ title, time, subject: subj });
    this.closeTaskModal();
    this.renderTodayTasks();
    window.showToast('Task added to schedule', 'success');
  }

  // --- SETTINGS VIEW ---
  populateSettingsForm() {
    const s = window.storageManager.getSettings();
    const user = window.storageManager.getCurrentUser();

    if (this.$settingsNameInput) this.$settingsNameInput.value = user ? user.username : (s.userName || 'Student');
    if (this.$settingsUserEmail) this.$settingsUserEmail.value = user ? user.email : '';
    if (this.$settingsDailyGoal) this.$settingsDailyGoal.value = s.dailyGoalMinutes || 60;
    if (this.$settingsWeeklyGoal) this.$settingsWeeklyGoal.value = s.weeklyGoalHours || 28;
    if (this.$settingsPomodoroDuration) this.$settingsPomodoroDuration.value = s.pomodoroMinutes || 25;
    if (this.$settingsShortBreak) this.$settingsShortBreak.value = s.shortBreakMinutes || 5;
    if (this.$settingsAutoPause) this.$settingsAutoPause.checked = s.autoPauseOnHidden !== false;
    if (this.$settingsSound) this.$settingsSound.checked = s.soundEnabled !== false;

    if (this.$settingsProviderSelect) {
      this.$settingsProviderSelect.value = s.activeProvider || 'gemini';
    }

    const keys = s.apiKeys || {};
    if (this.$settingsGeminiKey) this.$settingsGeminiKey.value = keys.gemini || '';
    if (this.$settingsOpenaiKey) this.$settingsOpenaiKey.value = keys.openai || '';
    if (this.$settingsClaudeKey) this.$settingsClaudeKey.value = keys.anthropic || '';
    if (this.$settingsOpenrouterKey) this.$settingsOpenrouterKey.value = keys.openrouter || '';
    if (this.$settingsOllamaUrl) this.$settingsOllamaUrl.value = keys.ollamaUrl || 'http://localhost:11434';
    if (this.$settingsOllamaModel) this.$settingsOllamaModel.value = keys.ollamaModel || 'llama3';

    if (user) {
      this.renderAvatar(this.$settingsAvatarPreview, user.avatar);
    }
  }

  saveAllSettings() {
    const updatedName = this.$settingsNameInput.value.trim() || 'Student';
    const updatedEmail = this.$settingsUserEmail.value.trim();

    if (window.storageManager.getCurrentUser()) {
      window.storageManager.updateProfile({
        username: updatedName,
        email: updatedEmail
      });
    }

    const updatedSettings = {
      userName: updatedName,
      dailyGoalMinutes: parseInt(this.$settingsDailyGoal.value, 10) || 60,
      weeklyGoalHours: parseInt(this.$settingsWeeklyGoal.value, 10) || 28,
      pomodoroMinutes: parseInt(this.$settingsPomodoroDuration.value, 10) || 25,
      shortBreakMinutes: parseInt(this.$settingsShortBreak.value, 10) || 5,
      autoPauseOnHidden: this.$settingsAutoPause.checked,
      soundEnabled: this.$settingsSound.checked,
      activeProvider: this.$settingsProviderSelect.value,
      apiKeys: {
        gemini: this.$settingsGeminiKey.value.trim(),
        openai: this.$settingsOpenaiKey.value.trim(),
        anthropic: this.$settingsClaudeKey.value.trim(),
        openrouter: this.$settingsOpenrouterKey.value.trim(),
        ollamaUrl: this.$settingsOllamaUrl.value.trim(),
        ollamaModel: this.$settingsOllamaModel.value.trim()
      }
    };

    window.storageManager.saveSettings(updatedSettings);
    this.updateUserUI(window.storageManager.getCurrentUser());
    this.refreshDashboardStats();
    window.showToast('✅ Settings saved successfully!', 'success');
  }

  async testActiveProviderKey() {
    const provider = this.$settingsProviderSelect.value;
    const creds = {
      apiKey: provider === 'gemini' ? this.$settingsGeminiKey.value.trim() :
              provider === 'openai' ? this.$settingsOpenaiKey.value.trim() :
              provider === 'anthropic' ? this.$settingsClaudeKey.value.trim() :
              provider === 'openrouter' ? this.$settingsOpenrouterKey.value.trim() : '',
      ollamaUrl: this.$settingsOllamaUrl.value.trim()
    };

    try {
      window.showToast(`Testing ${provider} connection...`, 'info');
      const msg = await window.aiManager.testConnection(provider, creds);
      window.showToast(`✅ ${msg}`, 'success');
    } catch (err) {
      window.showToast(`❌ Connection failed: ${err.message}`, 'error');
    }
  }

  exportUserData() {
    const user = window.storageManager.getCurrentUser();
    const data = {
      user: user,
      settings: window.storageManager.getSettings(),
      sessions: window.storageManager.getSessions(),
      tasks: window.storageManager.getTasks(),
      documents: window.storageManager.getDocuments(),
      notes: window.storageManager.getNotes()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_buddy_${user ? user.username : 'data'}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
    window.showToast('Exported Study Buddy data', 'success');
  }

  resetUserData() {
    if (confirm('Are you sure you want to clear your study history and reset settings?')) {
      const user = window.storageManager.getCurrentUser();
      if (user) {
        localStorage.removeItem(`study_buddy_${user.id}_sessions`);
        localStorage.removeItem(`study_buddy_${user.id}_tasks`);
        localStorage.removeItem(`study_buddy_${user.id}_documents`);
        localStorage.removeItem(`study_buddy_${user.id}_checklists`);
        localStorage.removeItem(`study_buddy_${user.id}_notes`);
      }
      window.location.reload();
    }
  }

  // --- FULL VIEWS RENDERING ---
  renderFullTasksView() {
    const container = document.getElementById('full-tasks-list');
    if (!container) return;
    container.innerHTML = '';

    const tasks = window.storageManager.getTasks();
    if (!tasks.length) {
      container.innerHTML = `<div class="empty-state" style="padding:20px; color:var(--text-muted);">No tasks yet. Click "+ Add New Task" to create one.</div>`;
      return;
    }

    tasks.forEach((t) => {
      const card = document.createElement('div');
      card.className = `task-full-card ${t.completed ? 'completed' : ''}`;
      card.innerHTML = `
        <label class="custom-checkbox">
          <input type="checkbox" ${t.completed ? 'checked' : ''} />
          <span class="checkbox-indicator"></span>
        </label>
        <div class="task-full-info">
          <span class="task-full-title">${t.title}</span>
          <span class="task-full-meta">Scheduled: ${t.time} &nbsp;|&nbsp; Subject: ${t.subject.toUpperCase()}</span>
        </div>
        <button class="btn-subtle-delete" title="Delete">✕</button>
      `;

      card.querySelector('input').addEventListener('change', () => {
        window.storageManager.toggleTask(t.id);
        this.renderFullTasksView();
      });

      card.querySelector('.btn-subtle-delete').addEventListener('click', () => {
        window.storageManager.deleteTask(t.id);
        this.renderFullTasksView();
      });

      container.appendChild(card);
    });
  }

  renderFullStatisticsView() {
    const container = document.getElementById('full-statistics-content');
    if (!container) return;

    const stats = window.storageManager.getTodayStats();
    const streak = window.storageManager.getStreakStats();
    const sessions = window.storageManager.getSessions();

    const totalHours = Math.round(sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) / 3600);
    const totalSessions = sessions.length;

    container.innerHTML = `
      <div class="stats-overview-grid">
        <div class="stat-box">
          <span class="stat-box-label">All-Time Study Time</span>
          <span class="stat-box-val">${totalHours} Hours</span>
        </div>
        <div class="stat-box">
          <span class="stat-box-label">Total Focus Sessions</span>
          <span class="stat-box-val">${totalSessions}</span>
        </div>
        <div class="stat-box">
          <span class="stat-box-label">Current Streak</span>
          <span class="stat-box-val">${streak.currentStreak} Days</span>
        </div>
        <div class="stat-box">
          <span class="stat-box-label">Longest Streak</span>
          <span class="stat-box-val">${streak.longestStreak} Days</span>
        </div>
      </div>

      <div class="stat-section-card">
        <h3>Recent Session Log</h3>
        <div class="session-history-table">
          ${sessions.length ? sessions.slice(-8).reverse().map((s) => `
            <div class="session-row">
              <span class="session-date">${s.date}</span>
              <span class="session-doc">${s.documentName}</span>
              <span class="session-subj-badge">${s.subject}</span>
              <span class="session-dur">${window.storageManager.formatHoursMinutes(s.durationSeconds)}</span>
            </div>
          `).join('') : '<div style="padding:16px; color:var(--text-muted);">No study sessions recorded yet. Start the focus timer to track your sessions!</div>'}
        </div>
      </div>
    `;
  }

  renderFullNotesView() {
    const editor = document.getElementById('full-notes-editor');
    const select = document.getElementById('notes-doc-select');
    if (!editor || !select) return;

    const docs = window.storageManager.getDocuments();
    select.innerHTML = `<option value="__general__">General Notes</option>`;
    Object.keys(docs).forEach((d) => {
      select.innerHTML += `<option value="${d}">${d}</option>`;
    });

    const loadNote = () => {
      editor.value = window.storageManager.getNotes(select.value);
    };

    select.addEventListener('change', loadNote);
    editor.addEventListener('input', () => {
      window.storageManager.saveNotes(select.value, editor.value);
    });

    loadNote();
  }
}

// Global Toast function
window.showToast = function (message, type = 'info') {
  const toast = document.getElementById('global-toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast-visible ${type}`;

  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.className = '';
  }, 3000);
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  window.app = new StudyBuddyApp();
});
