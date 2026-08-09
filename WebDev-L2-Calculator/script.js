/* ==========================================================================
   Calc — script.js
   Vanilla JS calculator engine. No eval() is used — expressions are tokenized
   and evaluated manually so operator precedence is fully controlled.
   ========================================================================== */

(() => {
  'use strict';

  /* ------------------------------------------------------------------ *
   *  DOM references
   * ------------------------------------------------------------------ */
  const els = {
    calculator: document.getElementById('calculator'),
    prevExpression: document.getElementById('prevExpression'),
    currentExpression: document.getElementById('currentExpression'),
    errorNote: document.getElementById('errorNote'),
    copyBtn: document.getElementById('copyBtn'),
    themeToggle: document.getElementById('themeToggle'),
    soundToggle: document.getElementById('soundToggle'),
    historyToggle: document.getElementById('historyToggle'),
    historyPanel: document.getElementById('historyPanel'),
    historyList: document.getElementById('historyList'),
    clearHistory: document.getElementById('clearHistory'),
    keys: document.querySelectorAll('.key'),
  };

  const OPERATORS = ['+', '-', '×', '÷'];
  const MAX_DIGITS = 15;

  /* ------------------------------------------------------------------ *
   *  State
   * ------------------------------------------------------------------ */
  const state = {
    tokens: [],          // [{ type: 'num'|'op', value: string }]
    justEvaluated: false,
    prevExpressionText: '',
    history: [],
    soundOn: false,
  };

  /* ------------------------------------------------------------------ *
   *  Helpers
   * ------------------------------------------------------------------ */
  function lastToken() {
    return state.tokens[state.tokens.length - 1];
  }

  function showError(message) {
    els.errorNote.textContent = message;
    els.errorNote.classList.add('visible');
    els.currentExpression.classList.add('error-shake');
    setTimeout(() => els.currentExpression.classList.remove('error-shake'), 400);
  }

  function clearError() {
    els.errorNote.textContent = '';
    els.errorNote.classList.remove('visible');
  }

  /** Formats a raw number into a display-safe string (handles rounding,
   *  trailing zeros, and very large/small magnitudes). */
  function formatNumber(num) {
    if (!isFinite(num)) throw new Error("That result isn't a valid number");

    if (Math.abs(num) > 999999999999 || (Math.abs(num) < 1e-9 && num !== 0)) {
      return num.toExponential(6).replace(/e\+?/, 'e');
    }

    // Round to avoid floating point artifacts (e.g. 0.1 + 0.2)
    let rounded = Math.round((num + Number.EPSILON) * 1e10) / 1e10;
    let str = rounded.toString();

    if (str.length > MAX_DIGITS + 2 && str.includes('.')) {
      str = rounded.toFixed(MAX_DIGITS - String(Math.trunc(rounded)).length);
      str = str.replace(/0+$/, '').replace(/\.$/, '');
    }
    return str;
  }

  /** Converts the token list into the text shown on screen / history. */
  function tokensToDisplay(tokens) {
    return tokens
      .map((t) => (t.type === 'op' ? (t.value === '-' ? '−' : t.value) : t.value))
      .join(' ')
      .trim();
  }

  /* ------------------------------------------------------------------ *
   *  Core calculator actions
   * ------------------------------------------------------------------ */
  function appendNumber(digit) {
    clearError();

    if (state.justEvaluated) {
      state.tokens = [{ type: 'num', value: digit }];
      state.justEvaluated = false;
      updateDisplay();
      return;
    }

    if (state.tokens.length === 0) {
      state.tokens.push({ type: 'num', value: digit });
      updateDisplay();
      return;
    }

    const last = lastToken();

    if (last.type === 'op') {
      state.tokens.push({ type: 'num', value: digit });
    } else {
      if (last.value.replace('-', '').length >= MAX_DIGITS) return; // input cap
      if (last.value === '0') {
        last.value = digit === '0' ? '0' : digit;
      } else if (last.value === '-0') {
        last.value = digit === '0' ? '-0' : '-' + digit;
      } else {
        last.value += digit;
      }
    }
    updateDisplay();
  }

  function appendDecimal() {
    clearError();

    if (state.justEvaluated) {
      state.tokens = [{ type: 'num', value: '0.' }];
      state.justEvaluated = false;
      updateDisplay();
      return;
    }

    if (state.tokens.length === 0) {
      state.tokens.push({ type: 'num', value: '0.' });
      updateDisplay();
      return;
    }

    const last = lastToken();
    if (last.type === 'op') {
      state.tokens.push({ type: 'num', value: '0.' });
    } else if (!last.value.includes('.')) {
      last.value += '.';
    }
    updateDisplay();
  }

  function appendOperator(op) {
    clearError();

    if (state.justEvaluated) {
      // Chain a new operation onto the previous result
      state.tokens = [{ type: 'num', value: lastToken().value }];
      state.justEvaluated = false;
    }

    if (state.tokens.length === 0) {
      if (op === '-') state.tokens.push({ type: 'num', value: '-' });
      updateDisplay();
      return;
    }

    const last = lastToken();

    if (last.type === 'num') {
      if (last.value === '-') {
        // Dangling unary minus with no digits — pressing another operator
        // cancels it and swaps the operator before it, if any.
        if (op === '-') { updateDisplay(); return; }
        state.tokens.pop();
        const prev = lastToken();
        if (prev && prev.type === 'op') prev.value = op;
        updateDisplay();
        return;
      }
      state.tokens.push({ type: 'op', value: op });
    } else {
      // Last token is an operator — replace it, or start a negative number
      if (op === '-') {
        state.tokens.push({ type: 'num', value: '-' });
      } else {
        last.value = op;
      }
    }
    updateDisplay();
  }

  function toggleSign() {
    clearError();
    if (state.tokens.length === 0) return;

    const last = lastToken();
    if (last.type !== 'num' || last.value === '' || last.value === '-') return;

    last.value = last.value.startsWith('-') ? last.value.slice(1) : '-' + last.value;
    updateDisplay();
  }

  function percent() {
    clearError();
    if (state.tokens.length === 0) return;

    const last = lastToken();
    if (last.type !== 'num' || last.value === '' || last.value === '-') return;

    const value = parseFloat(last.value) / 100;
    last.value = formatNumber(value);
    updateDisplay();
  }

  /** Manual precedence-aware evaluator — no eval(), no Function(). */
  function evaluateTokens(tokens) {
    const nums = tokens.filter((t) => t.type === 'num').map((t) => parseFloat(t.value));
    const ops = tokens.filter((t) => t.type === 'op').map((t) => t.value);

    if (nums.some((n) => Number.isNaN(n))) {
      throw new Error("That expression isn't valid");
    }

    // Pass 1: multiplication & division (left to right)
    let i = 0;
    while (i < ops.length) {
      if (ops[i] === '×' || ops[i] === '÷') {
        const a = nums[i];
        const b = nums[i + 1];
        let result;
        if (ops[i] === '×') {
          result = a * b;
        } else {
          if (b === 0) throw new Error("Can't divide by zero");
          result = a / b;
        }
        nums.splice(i, 2, result);
        ops.splice(i, 1);
      } else {
        i += 1;
      }
    }

    // Pass 2: addition & subtraction (left to right)
    let total = nums[0];
    for (let j = 0; j < ops.length; j += 1) {
      total = ops[j] === '+' ? total + nums[j + 1] : total - nums[j + 1];
    }
    return total;
  }

  function validateExpression(tokens) {
    if (tokens.length === 0) return false;
    const last = tokens[tokens.length - 1];
    if (last.type === 'op') return false;
    if (last.type === 'num' && (last.value === '' || last.value === '-')) return false;
    return true;
  }

  function calculate() {
    clearError();
    let tokens = state.tokens.slice();

    // Trim any trailing/dangling incomplete tokens so equals never crashes
    if (tokens.length && tokens[tokens.length - 1].type === 'op') tokens.pop();
    if (tokens.length && tokens[tokens.length - 1].value === '-') tokens.pop();
    if (tokens.length && tokens[tokens.length - 1].type === 'op') tokens.pop();

    if (!validateExpression(tokens)) return;

    let result;
    try {
      result = evaluateTokens(tokens);
    } catch (err) {
      showError(err.message);
      return;
    }

    const exprText = tokensToDisplay(tokens);
    const resultText = formatNumber(result);

    state.prevExpressionText = `${exprText} =`;
    state.tokens = [{ type: 'num', value: resultText }];
    state.justEvaluated = true;

    addHistory(exprText, resultText);
    updateDisplay();
  }

  function deleteLast() {
    clearError();

    if (state.justEvaluated) {
      state.tokens = [];
      state.prevExpressionText = '';
      state.justEvaluated = false;
      updateDisplay();
      return;
    }

    if (state.tokens.length === 0) return;
    const last = lastToken();

    if (last.type === 'op') {
      state.tokens.pop();
    } else if (last.value.length <= 1 || (last.value.length === 2 && last.value.startsWith('-'))) {
      state.tokens.pop();
    } else {
      last.value = last.value.slice(0, -1);
    }
    updateDisplay();
  }

  function clearAll() {
    state.tokens = [];
    state.prevExpressionText = '';
    state.justEvaluated = false;
    clearError();
    updateDisplay();
  }

  /* ------------------------------------------------------------------ *
   *  Display
   * ------------------------------------------------------------------ */
  function updateDisplay() {
    els.prevExpression.textContent = state.prevExpressionText || '\u00A0';

    const text = state.tokens.length ? tokensToDisplay(state.tokens) : '0';
    els.currentExpression.textContent = text;

    els.currentExpression.classList.toggle('shrink', text.length > 12);

    els.currentExpression.classList.remove('pop');
    // Force reflow so the animation can retrigger on rapid input
    void els.currentExpression.offsetWidth;
    els.currentExpression.classList.add('pop');

    playTone();
  }

  /* ------------------------------------------------------------------ *
   *  History
   * ------------------------------------------------------------------ */
  function addHistory(exprText, resultText) {
    state.history.unshift({ expr: exprText, result: resultText });
    if (state.history.length > 30) state.history.pop();
    renderHistory();
  }

  function renderHistory() {
    if (state.history.length === 0) {
      els.historyList.innerHTML = '<li class="history-empty">No calculations yet</li>';
      return;
    }
    els.historyList.innerHTML = state.history
      .map(
        (item) => `<li data-result="${item.result}">
          <span>${item.expr}</span>
          <span class="hist-result">${item.result}</span>
        </li>`
      )
      .join('');
  }

  function clearHistoryList() {
    state.history = [];
    renderHistory();
  }

  /* ------------------------------------------------------------------ *
   *  Copy result
   * ------------------------------------------------------------------ */
  async function copyResult() {
    const text = els.currentExpression.textContent;
    try {
      await navigator.clipboard.writeText(text);
      els.copyBtn.classList.add('copied');
      setTimeout(() => els.copyBtn.classList.remove('copied'), 1000);
    } catch (err) {
      showError("Couldn't copy — try selecting the number manually");
    }
  }

  /* ------------------------------------------------------------------ *
   *  Theme
   * ------------------------------------------------------------------ */
  function initTheme() {
    const saved = localStorage.getItem('calc-theme');
    const theme = saved || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('calc-theme', next);
  }

  /* ------------------------------------------------------------------ *
   *  Sound (tiny Web Audio beep, no external assets)
   * ------------------------------------------------------------------ */
  let audioCtx = null;
  function playTone() {
    if (!state.soundOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = 620;
      gain.gain.value = 0.04;
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
      osc.stop(audioCtx.currentTime + 0.09);
    } catch (err) {
      /* Audio not available — fail silently */
    }
  }

  /* ------------------------------------------------------------------ *
   *  Ripple click effect
   * ------------------------------------------------------------------ */
  function spawnRipple(button, x, y) {
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x - rect.left - size / 2}px`;
    ripple.style.top = `${y - rect.top - size / 2}px`;
    button.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  /* ------------------------------------------------------------------ *
   *  Button routing
   * ------------------------------------------------------------------ */
  function handleKeyButton(button, clientX, clientY) {
    spawnRipple(button, clientX, clientY);

    const num = button.dataset.num;
    const op = button.dataset.op;
    const action = button.dataset.action;

    if (num !== undefined) {
      appendNumber(num);
      return;
    }
    if (op !== undefined) {
      appendOperator(op);
      highlightOperator(op);
      return;
    }
    switch (action) {
      case 'clear': clearAll(); break;
      case 'delete': deleteLast(); break;
      case 'percent': percent(); break;
      case 'sign': toggleSign(); break;
      case 'decimal': appendDecimal(); break;
      case 'equals': calculate(); break;
      default: break;
    }
  }

  function highlightOperator(op) {
    document.querySelectorAll('.key-op').forEach((btn) => {
      btn.classList.toggle('active-op', btn.dataset.op === op);
    });
    setTimeout(() => {
      document.querySelectorAll('.key-op').forEach((btn) => btn.classList.remove('active-op'));
    }, 160);
  }

  /* ------------------------------------------------------------------ *
   *  Keyboard support
   * ------------------------------------------------------------------ */
  const KEY_MAP = { '*': '×', '/': '÷' };

  function handleKeyboardInput(e) {
    const key = e.key;

    if (/^[0-9]$/.test(key)) {
      appendNumber(key);
      flashKeyForInput(`[data-num="${key}"]`);
      return;
    }
    if (key === '.') {
      appendDecimal();
      flashKeyForInput('[data-action="decimal"]');
      return;
    }
    if (['+', '-', '*', '/'].includes(key)) {
      const op = KEY_MAP[key] || key;
      appendOperator(op);
      highlightOperator(op);
      return;
    }
    if (key === 'Enter' || key === '=') {
      e.preventDefault();
      calculate();
      flashKeyForInput('[data-action="equals"]');
      return;
    }
    if (key === 'Backspace') {
      deleteLast();
      flashKeyForInput('[data-action="delete"]');
      return;
    }
    if (key === 'Delete') {
      deleteLast();
      return;
    }
    if (key === 'Escape') {
      clearAll();
      flashKeyForInput('[data-action="clear"]');
      return;
    }
    if (key === '%') {
      percent();
      flashKeyForInput('[data-action="percent"]');
    }
  }

  function flashKeyForInput(selector) {
    const btn = document.querySelector(selector);
    if (!btn) return;
    btn.classList.add('active-op');
    setTimeout(() => btn.classList.remove('active-op'), 120);
  }

  /* ------------------------------------------------------------------ *
   *  Event wiring
   * ------------------------------------------------------------------ */
  function init() {
    initTheme();
    updateDisplay();
    renderHistory();

    els.keys.forEach((button) => {
      button.addEventListener('click', (e) => {
        handleKeyButton(button, e.clientX || button.getBoundingClientRect().left, e.clientY || button.getBoundingClientRect().top);
      });
    });

    document.addEventListener('keydown', handleKeyboardInput);

    els.themeToggle.addEventListener('click', toggleTheme);

    els.soundToggle.addEventListener('click', () => {
      state.soundOn = !state.soundOn;
      els.soundToggle.setAttribute('aria-pressed', String(state.soundOn));
    });

    els.historyToggle.addEventListener('click', () => {
      const isOpen = els.historyPanel.classList.toggle('open');
      els.historyPanel.setAttribute('aria-hidden', String(!isOpen));
      els.historyToggle.setAttribute('aria-pressed', String(isOpen));
    });

    els.clearHistory.addEventListener('click', clearHistoryList);

    els.historyList.addEventListener('click', (e) => {
      const item = e.target.closest('li[data-result]');
      if (!item) return;
      state.tokens = [{ type: 'num', value: item.dataset.result }];
      state.justEvaluated = true;
      updateDisplay();
    });

    els.copyBtn.addEventListener('click', copyResult);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
