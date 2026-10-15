/**
 * Study Buddy - Multi-AI Provider Architecture
 * Supports Google Gemini, OpenAI, Anthropic Claude, Ollama (Local), and OpenRouter.
 * Injects subject personas, LaTeX math formatting, and jsonquiz schema.
 */

const SUBJECT_PERSONAS = {
  general: {
    label: 'General Eng.',
    emoji: '🌟',
    color: '#a855f7',
    prompt: 'You are Study Buddy, an elite Engineering & STEM tutor. Explain concepts clearly with intuition, step-by-step math, and real-world analogies.'
  },
  eee: {
    label: 'Electrical Eng.',
    emoji: '⚡',
    color: '#eab308',
    prompt: 'You are Study Buddy, an Electrical & Electronics Engineering tutor. Explain circuits, electromagnetics, signals & systems, semiconductors, and power systems with clear steps and LaTeX.'
  },
  mech: {
    label: 'Mechanical Eng.',
    emoji: '⚙️',
    color: '#ef4444',
    prompt: 'You are Study Buddy, a Mechanical Engineering tutor. Explain thermodynamics, fluid mechanics, statics, dynamics, heat transfer, and machine design with physical intuition and equations.'
  },
  civil: {
    label: 'Civil Eng.',
    emoji: '🏗️',
    color: '#10b981',
    prompt: 'You are Study Buddy, a Civil Engineering tutor. Explain structural analysis, mechanics of materials, geotechnical engineering, fluid mechanics, and environmental design.'
  },
  cs: {
    label: 'CS & Software',
    emoji: '💻',
    color: '#f472b6',
    prompt: 'You are Study Buddy, a Computer Science & Software Engineering tutor. Explain data structures, algorithms, operating systems, networking, and clean code snippets.'
  },
  robotics: {
    label: 'Robotics & AI',
    emoji: '🤖',
    color: '#06b6d4',
    prompt: 'You are Study Buddy, a Robotics & AI Engineering tutor. Explain control systems, kinematics, neural networks, machine learning algorithms, and computer vision.'
  },
  math: {
    label: 'Eng. Math',
    emoji: '🔢',
    color: '#fbbf24',
    prompt: 'You are Study Buddy, an Engineering Mathematics tutor. Explain differential equations, linear algebra, multivariable calculus, transforms, and probability step-by-step with LaTeX.'
  },
  physics: {
    label: 'Physics',
    emoji: '⚛️',
    color: '#38bdf8',
    prompt: 'You are Study Buddy, an Engineering Physics tutor. Build intuition first, then formulate equations with LaTeX ($...$ for inline, $$...$$ for block).'
  },
  chem: {
    label: 'Chemistry',
    emoji: '🧪',
    color: '#34d399',
    prompt: 'You are Study Buddy, a Chemical Engineering & Chemistry tutor. Explain reactions, thermodynamics, mass transfer, and stoichiometry.'
  }
};

const BASE_SYSTEM_PROMPT = `You are Study Buddy — an expert, encouraging AI study assistant for STEM & Engineering students.
GUIDELINES:
1. Explain step-by-step with physical intuition and clear reasoning.
2. Format engineering and math equations using LaTeX ($...$ for inline, $$...$$ for display blocks).
3. Code snippets should be formatted with syntax highlighting (\`\`\`python, \`\`\`cpp, etc.).
4. QUIZ GENERATION: When the user requests a quiz, test, or practice questions, format an interactive JSON quiz inside a \`\`\`jsonquiz code block with this EXACT structure:
\`\`\`jsonquiz
{
  "quizzes": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 0,
      "explanation": "Detailed explanation of why Option A is correct."
    }
  ]
}
\`\`\`
Provide 2-3 high-quality conceptual questions.`;

class AIProviderManager {
  constructor() {
    this.geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    this.geminiModels = ['gemini-3.8-flash'];
  }

  getAvailableProviders() {
    return [
      { id: 'gemini', name: 'Google Gemini', models: ['gemini-3.8-flash'] },
      { id: 'openai', name: 'OpenAI (ChatGPT)', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
      { id: 'anthropic', name: 'Anthropic Claude', models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'] },
      { id: 'ollama', name: 'Ollama (Local)', models: ['llama3', 'mistral', 'deepseek-r1', 'qwen2.5', 'phi3'] },
      { id: 'openrouter', name: 'OpenRouter', models: ['google/gemini-3.8-flash', 'openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet'] }
    ];
  }

  getActiveConfig() {
    const settings = window.storageManager.getSettings();
    const provider = settings.activeProvider || 'gemini';
    const model = settings.activeModel || (provider === 'gemini' ? 'gemini-3.8-flash' : 'gpt-4o');
    const apiKey = (settings.apiKeys && settings.apiKeys[provider]) || '';
    const ollamaUrl = (settings.apiKeys && settings.apiKeys.ollamaUrl) || 'http://localhost:11434';
    const ollamaModel = (settings.apiKeys && settings.apiKeys.ollamaModel) || 'llama3';

    return { provider, model, apiKey, ollamaUrl, ollamaModel };
  }

  async testConnection(provider, customCreds = {}) {
    const settings = window.storageManager.getSettings();
    const key = customCreds.apiKey || (settings.apiKeys && settings.apiKeys[provider]) || '';

    if (provider === 'gemini') {
      if (!key) throw new Error('Please enter a Google Gemini API Key.');
      const res = await fetch(`${this.geminiBaseUrl}?key=${key}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
      return 'Connected successfully to Gemini API';
    }

    if (provider === 'openai') {
      if (!key) throw new Error('Please enter an OpenAI API Key.');
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${key}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
      return 'Connected successfully to OpenAI API';
    }

    if (provider === 'anthropic') {
      if (!key) throw new Error('Please enter an Anthropic API Key.');
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 5,
          messages: [{ role: 'user', content: 'hi' }]
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
      return 'Connected successfully to Anthropic Claude';
    }

    if (provider === 'ollama') {
      const url = customCreds.ollamaUrl || (settings.apiKeys && settings.apiKeys.ollamaUrl) || 'http://localhost:11434';
      const res = await fetch(`${url}/api/tags`).catch(() => {
        throw new Error(`Cannot connect to Ollama at ${url}. Ensure Ollama is running with OLLAMA_ORIGINS="*"`);
      });
      if (!res.ok) throw new Error(`Ollama returned status ${res.status}`);
      return 'Connected to local Ollama server';
    }

    if (provider === 'openrouter') {
      if (!key) throw new Error('Please enter an OpenRouter API Key.');
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { Authorization: `Bearer ${key}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
      return 'Connected successfully to OpenRouter';
    }

    throw new Error('Unknown provider');
  }

  async sendMessage({ message, pdfContext = '', history = [], subject = 'general' }) {
    const config = this.getActiveConfig();
    const persona = SUBJECT_PERSONAS[subject] || SUBJECT_PERSONAS.general;
    const systemPrompt = `${BASE_SYSTEM_PROMPT}\n\n${persona.prompt}`;

    let augmentedMessage = message;
    if (pdfContext && !message.includes('PDF Context:')) {
      augmentedMessage = `[Active PDF Context]\n"""\n${pdfContext.substring(0, 2000)}\n"""\n\nStudent Doubt / Question: ${message}`;
    }

    // If key not configured, throw clear actionable error (no fake demo responses)
    if (config.provider !== 'ollama' && !config.apiKey) {
      throw new Error(`API key for ${config.provider.toUpperCase()} is not set. Please configure your key in Settings ⚙️ to ask questions.`);
    }

    switch (config.provider) {
      case 'gemini':
        return await this.callGemini(augmentedMessage, systemPrompt, history, config);
      case 'openai':
        return await this.callOpenAI(augmentedMessage, systemPrompt, history, config);
      case 'anthropic':
        return await this.callAnthropic(augmentedMessage, systemPrompt, history, config);
      case 'ollama':
        return await this.callOllama(augmentedMessage, systemPrompt, history, config);
      case 'openrouter':
        return await this.callOpenRouter(augmentedMessage, systemPrompt, history, config);
      default:
        return await this.callGemini(augmentedMessage, systemPrompt, history, config);
    }
  }

  async callGemini(message, systemPrompt, history, config) {
    const url = `${this.geminiBaseUrl}/${config.model}:generateContent?key=${config.apiKey}`;

    const formattedHistory = history.slice(-8).map((h) => ({
      role: h.role === 'ai' ? 'model' : 'user',
      parts: [{ text: h.text }]
    }));

    formattedHistory.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const body = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: formattedHistory,
      generationConfig: { maxOutputTokens: 2048 }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error?.message || `Gemini API error (HTTP ${res.status})`);
    }

    const reply = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    if (!reply) throw new Error('Empty response from Gemini');
    return reply;
  }

  async callOpenAI(message, systemPrompt, history, config) {
    const formattedMessages = [{ role: 'system', content: systemPrompt }];

    history.slice(-8).forEach((h) => {
      formattedMessages.push({
        role: h.role === 'ai' ? 'assistant' : 'user',
        content: h.text
      });
    });

    formattedMessages.push({ role: 'user', content: message });

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o',
        messages: formattedMessages,
        max_tokens: 2000
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error?.message || `OpenAI error (HTTP ${res.status})`);
    }

    return data?.choices?.[0]?.message?.content || '';
  }

  async callAnthropic(message, systemPrompt, history, config) {
    const formattedMessages = [];

    history.slice(-8).forEach((h) => {
      formattedMessages.push({
        role: h.role === 'ai' ? 'assistant' : 'user',
        content: h.text
      });
    });

    formattedMessages.push({ role: 'user', content: message });

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-5-sonnet-20241022',
        system: systemPrompt,
        messages: formattedMessages,
        max_tokens: 2000
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error?.message || `Claude error (HTTP ${res.status})`);
    }

    return data?.content?.[0]?.text || '';
  }

  async callOllama(message, systemPrompt, history, config) {
    const url = `${config.ollamaUrl}/api/chat`;
    const formattedMessages = [{ role: 'system', content: systemPrompt }];

    history.slice(-8).forEach((h) => {
      formattedMessages.push({
        role: h.role === 'ai' ? 'assistant' : 'user',
        content: h.text
      });
    });

    formattedMessages.push({ role: 'user', content: message });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.ollamaModel || 'llama3',
        messages: formattedMessages,
        stream: false
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`Ollama error: HTTP ${res.status}`);
    }

    return data?.message?.content || '';
  }

  async callOpenRouter(message, systemPrompt, history, config) {
    const formattedMessages = [{ role: 'system', content: systemPrompt }];

    history.slice(-8).forEach((h) => {
      formattedMessages.push({
        role: h.role === 'ai' ? 'assistant' : 'user',
        content: h.text
      });
    });

    formattedMessages.push({ role: 'user', content: message });

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'google/gemini-3.8-flash',
        messages: formattedMessages
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error?.message || `OpenRouter error (HTTP ${res.status})`);
    }

    return data?.choices?.[0]?.message?.content || '';
  }
}

// Global AI manager singleton
window.aiManager = new AIProviderManager();
