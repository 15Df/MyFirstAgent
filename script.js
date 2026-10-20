'use strict';

const displayEl = document.getElementById('display');
const expressionEl = document.getElementById('expression');
const keysEl = document.querySelector('.keys');

const SYMBOLS = { '+': '+', '-': '−', '*': '×', '/': '÷' };
const PRECEDENCE = { '+': 1, '-': 1, '*': 2, '/': 2 };

const state = {
  tokens: [],
  entry: '0',
  replaceEntry: true,
  justEvaluated: false,
  error: false,
  errorMessage: '',
  lastExpression: '',
  lastAnswer: null,
};

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    throw new Error('Result is out of range');
  }
  if (Object.is(value, -0)) {
    value = 0;
  }
  const rounded = Number(value.toPrecision(12));
  return String(rounded);
}

function formatToken(token) {
  return typeof token === 'number' ? formatNumber(token) : SYMBOLS[token];
}

function reset() {
  state.tokens = [];
  state.entry = '0';
  state.replaceEntry = true;
  state.justEvaluated = false;
  state.error = false;
  state.errorMessage = '';
  state.lastExpression = '';
}

function resetForEditing() {
  state.justEvaluated = false;
  state.error = false;
  state.errorMessage = '';
  state.lastExpression = '';
}

function inputDigit(digit) {
  if (state.error) {
    reset();
  }

  if (state.justEvaluated) {
    state.tokens = [];
    resetForEditing();
    state.entry = digit === '.' ? '0.' : digit;
    state.replaceEntry = false;
    return;
  }

  if (state.replaceEntry) {
    state.entry = digit === '.' ? '0.' : digit;
    state.replaceEntry = false;
    state.lastExpression = '';
    return;
  }

  if (digit === '.') {
    if (!state.entry.includes('.')) {
      state.entry += '.';
    }
    return;
  }

  state.entry = state.entry === '0' ? digit : state.entry + digit;
}

function inputOperator(operator) {
  if (state.error) {
    reset();
  }

  if (state.justEvaluated) {
    state.tokens = [Number(state.entry)];
    resetForEditing();
  } else if (!state.replaceEntry) {
    state.tokens.push(Number(state.entry));
  } else if (state.tokens.length === 0) {
    state.tokens.push(Number(state.entry));
  }

  if (typeof state.tokens[state.tokens.length - 1] === 'string') {
    state.tokens.pop();
  }

  state.tokens.push(operator);
  state.replaceEntry = true;
  state.lastExpression = '';
}

function inputPercent() {
  if (state.error) {
    reset();
  }

  const value = Number(state.entry);
  if (!Number.isFinite(value)) {
    return;
  }

  state.entry = formatNumber(value / 100);
  state.replaceEntry = false;
  resetForEditing();
}

function inputAns() {
  if (state.error) {
    reset();
  }

  if (state.justEvaluated) {
    state.tokens = [];
    resetForEditing();
  }

  state.entry = formatNumber(state.lastAnswer ?? 0);
  state.replaceEntry = false;
  state.lastExpression = '';
}

function inputBackspace() {
  if (state.error || state.justEvaluated) {
    reset();
    return;
  }

  state.lastExpression = '';

  if (state.replaceEntry) {
    if (typeof state.tokens[state.tokens.length - 1] === 'string') {
      state.tokens.pop();
      const previous = state.tokens[state.tokens.length - 1];
      if (typeof previous === 'number') {
        state.tokens.pop();
        state.entry = formatNumber(previous);
        state.replaceEntry = false;
      }
    }
    return;
  }

  state.entry = state.entry.slice(0, -1);
  if (state.entry === '' || state.entry === '-') {
    state.entry = '0';
    state.replaceEntry = true;
  }
}

function evaluate(tokens) {
  const output = [];
  const operators = [];

  for (const token of tokens) {
    if (typeof token === 'number') {
      output.push(token);
      continue;
    }

    while (
      operators.length > 0 &&
      PRECEDENCE[operators[operators.length - 1]] >= PRECEDENCE[token]
    ) {
      output.push(operators.pop());
    }
    operators.push(token);
  }

  while (operators.length > 0) {
    output.push(operators.pop());
  }

  const stack = [];

  for (const token of output) {
    if (typeof token === 'number') {
      stack.push(token);
      continue;
    }

    const right = stack.pop();
    const left = stack.pop();
    if (left === undefined || right === undefined) {
      throw new Error('Invalid expression');
    }

    let result;
    switch (token) {
      case '+':
        result = left + right;
        break;
      case '-':
        result = left - right;
        break;
      case '*':
        result = left * right;
        break;
      case '/':
        if (right === 0) {
          throw new Error('Cannot divide by zero');
        }
        result = left / right;
        break;
      default:
        throw new Error('Invalid expression');
    }

    stack.push(result);
  }

  if (stack.length !== 1 || !Number.isFinite(stack[0])) {
    throw new Error('Invalid expression');
  }

  return stack[0];
}

function calculate() {
  if (state.error) {
    return;
  }

  const expression = [...state.tokens];
  if (!state.replaceEntry) {
    expression.push(Number(state.entry));
  }

  while (expression.length > 0 && typeof expression[expression.length - 1] === 'string') {
    expression.pop();
  }

  if (expression.length === 0) {
    return;
  }

  const expressionText = `${expression.map(formatToken).join(' ')} =`;

  try {
    const value = evaluate(expression);
    state.lastAnswer = value;
    state.entry = formatNumber(value);
    state.tokens = [];
    state.replaceEntry = true;
    state.justEvaluated = true;
    state.error = false;
    state.errorMessage = '';
    state.lastExpression = expressionText;
  } catch (error) {
    state.entry = 'Error';
    state.tokens = [];
    state.replaceEntry = true;
    state.justEvaluated = false;
    state.error = true;
    state.errorMessage = error.message;
    state.lastExpression = '';
  }
}

function render() {
  if (state.error) {
    displayEl.textContent = 'Error';
    expressionEl.textContent = state.errorMessage;
    return;
  }

  displayEl.textContent = state.entry;

  if (state.justEvaluated) {
    expressionEl.textContent = state.lastExpression;
    return;
  }

  let text = state.tokens.map(formatToken).join(' ');
  if (!state.replaceEntry && state.tokens.length > 0) {
    text += `${text ? ' ' : ''}${state.entry}`;
  }
  expressionEl.textContent = text;
}

function handleAction(action) {
  switch (action) {
    case 'clear':
      reset();
      break;
    case 'backspace':
      inputBackspace();
      break;
    case 'percent':
      inputPercent();
      break;
    case 'ans':
      inputAns();
      break;
    case 'equals':
      calculate();
      break;
    default:
      break;
  }
}

keysEl.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) {
    return;
  }

  if (button.dataset.digit !== undefined) {
    inputDigit(button.dataset.digit);
  } else if (button.dataset.operator !== undefined) {
    inputOperator(button.dataset.operator);
  } else if (button.dataset.action !== undefined) {
    handleAction(button.dataset.action);
  }

  render();
});

document.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  const { key } = event;

  if (/^[0-9]$/.test(key)) {
    event.preventDefault();
    inputDigit(key);
    render();
    return;
  }

  if (key === '.' || key === ',') {
    event.preventDefault();
    inputDigit('.');
    render();
    return;
  }

  if (key === '+' || key === '-' || key === '*' || key === '/') {
    event.preventDefault();
    inputOperator(key);
    render();
    return;
  }

  if (key === 'x' || key === 'X') {
    event.preventDefault();
    inputOperator('*');
    render();
    return;
  }

  if (key === '%') {
    event.preventDefault();
    inputPercent();
    render();
    return;
  }

  if (key === 'a' || key === 'A') {
    event.preventDefault();
    inputAns();
    render();
    return;
  }

  if (key === 'Enter' || key === '=') {
    event.preventDefault();
    calculate();
    render();
    return;
  }

  if (key === 'Backspace') {
    event.preventDefault();
    inputBackspace();
    render();
    return;
  }

  if (key === 'Escape' || key === 'Delete' || key === 'c' || key === 'C') {
    event.preventDefault();
    reset();
    render();
  }
});

render();
