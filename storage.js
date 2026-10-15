/**
 * Study Buddy - Storage & User Authentication Management Module
 * Supports multiple user accounts, user registration, login, logout,
 * customizable profile pictures (PFP), and user-scoped data persistence.
 */

const StorageKeys = {
  USERS: 'study_buddy_users',
  CURRENT_USER_ID: 'study_buddy_current_user_id',
  LEGACY_SETTINGS: 'study_buddy_settings',
  LEGACY_API_KEY: 'study_buddy_api_key'
};

const DefaultUserSettings = {
  dailyGoalMinutes: 60,
  weeklyGoalHours: 28,
  pomodoroMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoPauseOnHidden: true,
  soundEnabled: true,
  notificationsEnabled: false,
  activeProvider: 'gemini',
  activeModel: 'gemini-3.8-flash',
  apiKeys: {
    gemini: '',
    openai: '',
    anthropic: '',
    openrouter: '',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'llama3'
  },
  preferredTimerPos: { x: null, y: null }
};

class StorageManager {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    const users = this.getAllUsers();

    // Check if a user is currently logged in
    const currentId = localStorage.getItem(StorageKeys.CURRENT_USER_ID);
    if (currentId) {
      this.currentUser = users.find(u => u.id === currentId) || null;
    }

    // Migrate any legacy Gemini API key
    const legacyKey = localStorage.getItem(StorageKeys.LEGACY_API_KEY);
    if (legacyKey && this.currentUser) {
      const s = this.getSettings();
      if (!s.apiKeys.gemini) {
        s.apiKeys.gemini = legacyKey;
        this.saveSettings(s);
      }
    }
  }

  // --- USER AUTHENTICATION & PROFILES ---

  getAllUsers() {
    try {
      const data = localStorage.getItem(StorageKeys.USERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveAllUsers(users) {
    localStorage.setItem(StorageKeys.USERS, JSON.stringify(users));
  }

  getCurrentUser() {
    return this.currentUser;
  }

  register({ username, email, password, avatar = '🦉' }) {
    const cleanUsername = (username || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanUsername) throw new Error('Please enter a username.');
    if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Please enter a valid email address (e.g. name@gmail.com).');
    if (!password || password.length < 4) throw new Error('Password must be at least 4 characters.');

    const users = this.getAllUsers();
    const exists = users.find(u => u.email === cleanEmail || u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (exists) {
      throw new Error('An account with this email or username already exists. Please log in.');
    }

    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      username: cleanUsername,
      email: cleanEmail,
      password: password, // client-side local storage
      avatar: avatar || '🦉',
      createdAt: Date.now()
    };

    users.push(newUser);
    this.saveAllUsers(users);

    // Set as active session
    this.currentUser = newUser;
    localStorage.setItem(StorageKeys.CURRENT_USER_ID, newUser.id);

    // Initialize user-scoped clean settings
    this.saveSettings({
      ...DefaultUserSettings,
      userName: newUser.username
    });

    // Provide one initial starter task for new users
    this.saveTasks([
      {
        id: 't_starter',
        title: 'Complete your first 25m Focus Session in Study Room',
        time: 'Today',
        subject: 'general',
        completed: false,
        date: this.getLocalDateString()
      }
    ]);

    return newUser;
  }

  login({ emailOrUsername, password }) {
    const query = (emailOrUsername || '').trim().toLowerCase();
    if (!query) throw new Error('Please enter your email or username.');
    if (!password) throw new Error('Please enter your password.');

    const users = this.getAllUsers();
    const user = users.find(u => 
      u.email.toLowerCase() === query || u.username.toLowerCase() === query
    );

    if (!user) {
      throw new Error('No account found with this username/email.');
    }

    if (user.password !== password) {
      throw new Error('Incorrect password. Please try again.');
    }

    this.currentUser = user;
    localStorage.setItem(StorageKeys.CURRENT_USER_ID, user.id);
    return user;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(StorageKeys.CURRENT_USER_ID);
  }

  updateProfile({ username, email, avatar, password }) {
    if (!this.currentUser) throw new Error('Not logged in');

    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.id === this.currentUser.id);
    if (userIndex === -1) throw new Error('User not found');

    if (username && username.trim()) {
      users[userIndex].username = username.trim();
      this.currentUser.username = username.trim();
    }

    if (email && email.trim() && email.includes('@')) {
      users[userIndex].email = email.trim().toLowerCase();
      this.currentUser.email = email.trim().toLowerCase();
    }

    if (avatar) {
      users[userIndex].avatar = avatar;
      this.currentUser.avatar = avatar;
    }

    if (password && password.length >= 4) {
      users[userIndex].password = password;
      this.currentUser.password = password;
    }

    this.saveAllUsers(users);

    // Sync settings userName
    const settings = this.getSettings();
    settings.userName = this.currentUser.username;
    this.saveSettings(settings);

    return this.currentUser;
  }

  // --- USER SCOPED DATA HELPERS ---

  _getUserKey(baseKey) {
    const uid = this.currentUser ? this.currentUser.id : 'guest';
    return `study_buddy_${uid}_${baseKey}`;
  }

  getSettings() {
    const key = this._getUserKey('settings');
    try {
      const data = localStorage.getItem(key);
      const username = this.currentUser ? this.currentUser.username : 'Student';
      const stored = data ? JSON.parse(data) : {};
      const settings = {
        ...DefaultUserSettings,
        userName: username,
        ...stored,
        apiKeys: { ...DefaultUserSettings.apiKeys, ...(stored.apiKeys || {}) }
      };

      // Migrate stale persisted Gemini model selections, not just the default.
      const oldGeminiModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      if (settings.activeProvider === 'gemini' && oldGeminiModels.includes(settings.activeModel)) {
        settings.activeModel = 'gemini-3.8-flash';
        localStorage.setItem(key, JSON.stringify(settings));
      }
      if (settings.activeProvider === 'openrouter' && settings.activeModel === 'google/gemini-2.5-flash') {
        settings.activeModel = 'google/gemini-3.8-flash';
        localStorage.setItem(key, JSON.stringify(settings));
      }
      return settings;
    } catch (e) {
      return { ...DefaultUserSettings, userName: this.currentUser ? this.currentUser.username : 'Student' };
    }
  }

  saveSettings(partial) {
    const key = this._getUserKey('settings');
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    if (partial.apiKeys) {
      updated.apiKeys = { ...current.apiKeys, ...partial.apiKeys };
    }
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  }

  getSessions() {
    const key = this._getUserKey('sessions');
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  addSession(session) {
    const key = this._getUserKey('sessions');
    const sessions = this.getSessions();
    const newSession = {
      id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      timestamp: Date.now(),
      date: this.getLocalDateString(new Date()),
      durationSeconds: Math.round(session.durationSeconds || 0),
      subject: session.subject || 'General Eng.',
      documentName: session.documentName || 'General Study',
      mode: session.mode || 'focus',
      completed: !!session.completed
    };

    sessions.push(newSession);
    localStorage.setItem(key, JSON.stringify(sessions));

    if (newSession.documentName && newSession.documentName !== 'General Study') {
      this.updateDocumentTime(newSession.documentName, newSession.durationSeconds, newSession.subject);
    }

    return newSession;
  }

  getLocalDateString(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getDocuments() {
    const key = this._getUserKey('documents');
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  updateDocumentTime(docName, additionalSeconds, subject = '') {
    const key = this._getUserKey('documents');
    const docs = this.getDocuments();
    if (!docs[docName]) {
      docs[docName] = {
        name: docName,
        subject: subject || 'Engineering',
        totalSeconds: 0,
        totalPages: 1,
        currentPage: 1,
        lastStudied: Date.now()
      };
    }
    docs[docName].totalSeconds = (docs[docName].totalSeconds || 0) + additionalSeconds;
    docs[docName].lastStudied = Date.now();
    if (subject) docs[docName].subject = subject;
    localStorage.setItem(key, JSON.stringify(docs));
  }

  saveDocumentMeta(docName, meta) {
    const key = this._getUserKey('documents');
    const docs = this.getDocuments();
    docs[docName] = { ...(docs[docName] || {}), ...meta, name: docName, lastStudied: Date.now() };
    localStorage.setItem(key, JSON.stringify(docs));
  }

  getChecklist(docName) {
    const key = this._getUserKey('checklists');
    try {
      const all = JSON.parse(localStorage.getItem(key) || '{}');
      return all[docName] || [];
    } catch (e) {
      return [];
    }
  }

  saveChecklist(docName, items) {
    const key = this._getUserKey('checklists');
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    all[docName] = items;
    localStorage.setItem(key, JSON.stringify(all));
  }

  toggleChecklistItem(docName, itemId) {
    const items = this.getChecklist(docName);
    const item = items.find(i => i.id === itemId);
    if (item) {
      item.completed = !item.completed;
      this.saveChecklist(docName, items);
    }
    return items;
  }

  getTasks() {
    const key = this._getUserKey('tasks');
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveTasks(tasks) {
    const key = this._getUserKey('tasks');
    localStorage.setItem(key, JSON.stringify(tasks));
  }

  addTask(task) {
    const tasks = this.getTasks();
    const newTask = {
      id: 'task_' + Date.now(),
      title: task.title.trim(),
      time: task.time || '10:00 - 11:00',
      subject: task.subject || 'general',
      completed: false,
      date: this.getLocalDateString()
    };
    tasks.push(newTask);
    this.saveTasks(tasks);
    return newTask;
  }

  toggleTask(taskId) {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks(tasks);
    }
    return tasks;
  }

  deleteTask(taskId) {
    let tasks = this.getTasks();
    tasks = tasks.filter(t => t.id !== taskId);
    this.saveTasks(tasks);
    return tasks;
  }

  getNotes(docName = '__general__') {
    const key = this._getUserKey('notes');
    try {
      const all = JSON.parse(localStorage.getItem(key) || '{}');
      return all[docName] || '';
    } catch (e) {
      return '';
    }
  }

  saveNotes(docName = '__general__', content) {
    const key = this._getUserKey('notes');
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    all[docName] = content;
    localStorage.setItem(key, JSON.stringify(all));
  }

  // --- STATS CALCULATIONS ---

  getTodayStats() {
    const todayStr = this.getLocalDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = this.getLocalDateString(yesterday);

    const sessions = this.getSessions();
    const settings = this.getSettings();

    let todaySeconds = 0;
    let yesterdaySeconds = 0;
    const subjectMap = {};
    const hourlyBars = [0, 0, 0, 0, 0, 0];

    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push(this.getLocalDateString(d));
    }

    const weekDaySeconds = [0, 0, 0, 0, 0, 0, 0];
    let weekTotalSeconds = 0;

    sessions.forEach(s => {
      const dur = s.durationSeconds || 0;
      if (s.date === todayStr) {
        todaySeconds += dur;
        const subj = s.subject || 'General Eng.';
        subjectMap[subj] = (subjectMap[subj] || 0) + dur;

        if (s.timestamp) {
          const hour = new Date(s.timestamp).getHours();
          const bucket = Math.min(5, Math.floor(hour / 4));
          hourlyBars[bucket] += dur;
        }
      } else if (s.date === yesterdayStr) {
        yesterdaySeconds += dur;
      }

      const weekIndex = weekDays.indexOf(s.date);
      if (weekIndex !== -1) {
        weekDaySeconds[weekIndex] += dur;
        weekTotalSeconds += dur;
      }
    });

    let pctChange = 0;
    if (yesterdaySeconds > 0) {
      pctChange = Math.round(((todaySeconds - yesterdaySeconds) / yesterdaySeconds) * 100);
    } else if (todaySeconds > 0) {
      pctChange = 100;
    }

    const weeklyGoalSeconds = (settings.weeklyGoalHours || 28) * 3600;
    const weeklyGoalPct = Math.min(100, Math.round((weekTotalSeconds / weeklyGoalSeconds) * 100));

    return {
      todaySeconds,
      yesterdaySeconds,
      pctChange,
      weekTotalSeconds,
      weeklyGoalSeconds,
      weeklyGoalPct,
      weekDaySeconds,
      hourlyBars,
      subjectBreakdown: subjectMap
    };
  }

  getStreakStats() {
    const settings = this.getSettings();
    const dailyGoalSeconds = (settings.dailyGoalMinutes || 60) * 60;
    const sessions = this.getSessions();

    const dailyTotals = {};
    sessions.forEach(s => {
      dailyTotals[s.date] = (dailyTotals[s.date] || 0) + (s.durationSeconds || 0);
    });

    const now = new Date();
    const currentDayIndex = now.getDay();
    const startOfWeekSunday = new Date(now);
    startOfWeekSunday.setDate(now.getDate() - currentDayIndex);

    const weekDots = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeekSunday);
      d.setDate(startOfWeekSunday.getDate() + i);
      const dStr = this.getLocalDateString(d);
      const reached = (dailyTotals[dStr] || 0) >= dailyGoalSeconds;
      weekDots.push({
        dayName: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][i],
        date: dStr,
        isToday: dStr === this.getLocalDateString(now),
        isFuture: d > now,
        reached
      });
    }

    let streak = 0;
    let checkDate = new Date();
    const todayStr = this.getLocalDateString(checkDate);
    const todayReached = (dailyTotals[todayStr] || 0) >= dailyGoalSeconds;

    if (todayReached) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dStr = this.getLocalDateString(checkDate);
      if ((dailyTotals[dStr] || 0) >= dailyGoalSeconds) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const todayDuration = dailyTotals[todayStr] || 0;
    const todayGoalPct = Math.min(100, Math.round((todayDuration / dailyGoalSeconds) * 100));

    return {
      currentStreak: streak,
      longestStreak: streak,
      weekDots,
      todayGoalPct,
      todayDuration,
      dailyGoalSeconds
    };
  }

  formatHoursMinutes(seconds) {
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours === 0 && mins === 0) return '0m';
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  }
}

// Global storage singleton
window.storageManager = new StorageManager();
