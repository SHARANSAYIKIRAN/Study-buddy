/**
 * Study Buddy - Quiz Engine & Markdown / KaTeX Formatter
 * Parses ```jsonquiz ... ``` blocks, renders interactive cards with instant feedback,
 * KaTeX equations ($...$ and $$...$$), and code highlighting.
 */

class QuizEngine {
  constructor() {
    this.quizStats = {
      totalAnswered: 0,
      totalCorrect: 0
    };
  }

  renderMarkdownWithMath(text) {
    if (!text) return '';

    const placeholders = [];
    // Protect $$...$$ block math
    let safe = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, m) => {
      placeholders.push({ type: 'block', m });
      return `MATHBLOCK${placeholders.length - 1}END`;
    });

    // Protect $...$ inline math
    safe = safe.replace(/\$((?!\s)[^$\n]+?(?<!\s))\$/g, (_, m) => {
      placeholders.push({ type: 'inline', m });
      return `MATHINLINE${placeholders.length - 1}END`;
    });

    if (window.marked) {
      window.marked.setOptions({ breaks: true, gfm: true });
      safe = window.marked.parse(safe);
    }

    // Restore math
    safe = safe.replace(/MATHBLOCK(\d+)END/g, (_, i) => `$$${placeholders[+i].m}$$`);
    safe = safe.replace(/MATHINLINE(\d+)END/g, (_, i) => `$${placeholders[+i].m}$`);

    if (window.DOMPurify) {
      safe = window.DOMPurify.sanitize(safe);
    }

    return safe;
  }

  processAIMessage(container, rawText) {
    // Check if message contains JSON Quiz
    const quizMatch = rawText.match(/```jsonquiz\s*([\s\S]*?)\s*```/i);

    if (quizMatch) {
      try {
        const quizData = JSON.parse(quizMatch[1]);
        const cleanTextBefore = rawText.replace(/```jsonquiz\s*[\s\S]*?\s*```/i, '');

        if (cleanTextBefore.trim()) {
          const introDiv = document.createElement('div');
          introDiv.className = 'msg-markdown-content';
          introDiv.innerHTML = this.renderMarkdownWithMath(cleanTextBefore);
          container.appendChild(introDiv);
        }

        this.renderQuizCards(container, quizData.quizzes || []);
      } catch (e) {
        console.warn('Could not parse jsonquiz block', e);
        container.innerHTML = this.renderMarkdownWithMath(rawText);
      }
    } else {
      container.innerHTML = this.renderMarkdownWithMath(rawText);
    }

    // Render KaTeX math
    if (window.renderMathInElement) {
      window.renderMathInElement(container, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    }

    // Highlight code blocks
    if (window.hljs) {
      container.querySelectorAll('pre code').forEach((b) => {
        window.hljs.highlightElement(b);
      });
    }
  }

  renderQuizCards(container, quizzes) {
    if (!quizzes || !quizzes.length) return;

    const quizWrap = document.createElement('div');
    quizWrap.className = 'quiz-wrapper';

    quizzes.forEach((q, qIndex) => {
      const card = document.createElement('div');
      card.className = 'quiz-card';

      const header = document.createElement('div');
      header.className = 'quiz-card-header';
      header.innerHTML = `
        <span class="quiz-badge">📝 Question ${qIndex + 1} of ${quizzes.length}</span>
        <span class="quiz-pts">10 pts</span>
      `;

      const questionEl = document.createElement('div');
      questionEl.className = 'quiz-question';
      questionEl.innerHTML = this.renderMarkdownWithMath(q.question);

      const optionsContainer = document.createElement('div');
      optionsContainer.className = 'quiz-options';

      const explanationEl = document.createElement('div');
      explanationEl.className = 'quiz-explanation';
      explanationEl.innerHTML = `<strong>💡 Explanation:</strong> ${this.renderMarkdownWithMath(q.explanation || '')}`;

      q.options.forEach((optText, optIndex) => {
        const optBtn = document.createElement('button');
        optBtn.className = 'quiz-option-btn';
        const letter = String.fromCharCode(65 + optIndex);
        optBtn.innerHTML = `
          <span class="opt-letter">${letter}</span>
          <span class="opt-text">${optText}</span>
        `;

        optBtn.addEventListener('click', () => {
          // Disable all buttons in this card
          optionsContainer.querySelectorAll('.quiz-option-btn').forEach((btn, idx) => {
            btn.disabled = true;
            if (idx === q.answerIndex) {
              btn.classList.add('correct');
            }
          });

          this.quizStats.totalAnswered++;

          if (optIndex === q.answerIndex) {
            optBtn.classList.add('correct');
            this.quizStats.totalCorrect++;
            if (window.showToast) window.showToast('🎉 Correct Answer! (+10 pts)', 'success');
          } else {
            optBtn.classList.add('wrong');
            if (window.showToast) window.showToast('❌ Incorrect! Review explanation below.', 'error');
          }

          explanationEl.classList.add('show');
        });

        optionsContainer.appendChild(optBtn);
      });

      card.appendChild(header);
      card.appendChild(questionEl);
      card.appendChild(optionsContainer);
      card.appendChild(explanationEl);
      quizWrap.appendChild(card);
    });

    container.appendChild(quizWrap);
  }
}

// Global quiz engine singleton
window.quizEngine = new QuizEngine();
