const resultElement = document.querySelector('#result');
const expressionElement = document.querySelector('#expression');
const keypad = document.querySelector('.keypad');
const historyPanel = document.querySelector('#historyPanel');
const historyList = document.querySelector('#historyList');
const themeToggle = document.querySelector('#themeToggle');

let currentValue = '0';
let previousValue = null;
let operator = null;
let waitingForOperand = false;
let expression = '';
let history = JSON.parse(localStorage.getItem('novaCalcHistory') || '[]');

function updateDisplay() {
  resultElement.textContent = currentValue;
  expressionElement.textContent = expression || 'Ready to calculate';
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return 'Error';
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(10)));
}

function calculate(a, b, action) {
  if (action === '+') return a + b;
  if (action === '−') return a - b;
  if (action === '×') return a * b;
  if (action === '÷') return b === 0 ? NaN : a / b;
  return b;
}

function inputDigit(digit) {
  if (currentValue === 'Error' || waitingForOperand) {
    currentValue = digit;
    waitingForOperand = false;
  } else {
    currentValue = currentValue === '0' ? digit : currentValue + digit;
  }
  updateDisplay();
}

function inputDecimal() {
  if (waitingForOperand || currentValue === 'Error') {
    currentValue = '0.';
    waitingForOperand = false;
  } else if (!currentValue.includes('.')) {
    currentValue += '.';
  }
  updateDisplay();
}

function chooseOperator(nextOperator) {
  const value = Number(currentValue);
  if (Number.isNaN(value)) return;

  if (operator && waitingForOperand) {
    operator = nextOperator;
    expression = `${previousValue} ${operator}`;
    updateDisplay();
    return;
  }

  if (previousValue !== null && operator) {
    const computed = calculate(previousValue, value, operator);
    currentValue = formatNumber(computed);
    previousValue = computed;
  } else {
    previousValue = value;
  }

  operator = nextOperator;
  waitingForOperand = true;
  expression = `${currentValue} ${operator}`;
  updateDisplay();
}

function equals() {
  if (!operator || previousValue === null) return;
  const first = previousValue;
  const second = Number(currentValue);
  const action = operator;
  const answer = calculate(first, second, action);
  const readableExpression = `${formatNumber(first)} ${action} ${formatNumber(second)}`;

  currentValue = formatNumber(answer);
  expression = `${readableExpression} =`;
  addHistory(readableExpression, currentValue);
  previousValue = null;
  operator = null;
  waitingForOperand = true;
  updateDisplay();
}

function clearCalculator() {
  currentValue = '0';
  previousValue = null;
  operator = null;
  waitingForOperand = false;
  expression = '';
  updateDisplay();
}

function deleteLast() {
  if (waitingForOperand || currentValue === 'Error') return;
  currentValue = currentValue.length > 1 ? currentValue.slice(0, -1) : '0';
  if (currentValue === '-') currentValue = '0';
  updateDisplay();
}

function changeSign() {
  if (currentValue === '0' || currentValue === 'Error') return;
  currentValue = currentValue.startsWith('-') ? currentValue.slice(1) : `-${currentValue}`;
  updateDisplay();
}

function percentage() {
  if (currentValue === 'Error') return;
  currentValue = formatNumber(Number(currentValue) / 100);
  updateDisplay();
}

function addHistory(calculation, answer) {
  history.unshift({ calculation, answer });
  history = history.slice(0, 12);
  localStorage.setItem('novaCalcHistory', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  if (!history.length) {
    historyList.innerHTML = '<p class="empty-state">Your calculations will appear here.</p>';
    return;
  }
  historyList.innerHTML = history.map(item => `
    <div class="history-item">
      <strong>${item.calculation}</strong>
      <span>= ${item.answer}</span>
    </div>
  `).join('');
}

function toggleHistory(open) {
  const shouldOpen = typeof open === 'boolean' ? open : historyPanel.getAttribute('aria-hidden') === 'true';
  historyPanel.setAttribute('aria-hidden', String(!shouldOpen));
}

keypad.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const value = button.dataset.value;
  const action = button.dataset.action;
  if (value && /^\d$/.test(value)) inputDigit(value);
  else if (value === '.') inputDecimal();
  else if (value) chooseOperator(value);
  else if (action === 'decimal') inputDecimal();
  else if (action === 'equals') equals();
  else if (action === 'clear') clearCalculator();
  else if (action === 'delete') deleteLast();
  else if (action === 'sign') changeSign();
  else if (action === 'percent') percentage();
});

document.addEventListener('keydown', (event) => {
  if (/\d/.test(event.key)) inputDigit(event.key);
  else if (event.key === '.') inputDecimal();
  else if (['+', '-', '*', '/'].includes(event.key)) chooseOperator({ '+': '+', '-': '−', '*': '×', '/': '÷' }[event.key]);
  else if (event.key === 'Enter' || event.key === '=') equals();
  else if (event.key === 'Escape') clearCalculator();
  else if (event.key === 'Backspace') deleteLast();
  else return;
  event.preventDefault();
});

document.querySelector('#historyToggle').addEventListener('click', () => toggleHistory(true));
document.querySelector('#closeHistory').addEventListener('click', () => toggleHistory(false));
document.querySelector('#clearHistory').addEventListener('click', () => {
  history = [];
  localStorage.removeItem('novaCalcHistory');
  renderHistory();
});

themeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('light');
  localStorage.setItem('novaCalcTheme', document.documentElement.classList.contains('light') ? 'light' : 'dark');
});

if (localStorage.getItem('novaCalcTheme') === 'light') document.documentElement.classList.add('light');
renderHistory();
updateDisplay();
