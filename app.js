/**
 * OmniCalc - Main Application Controller
 * Handles scientific evaluator, memory state, keyboard shortcuts, history, and UI tab navigation.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    expression: '',
    result: 0,
    ans: 0,
    memory: 0,
    isDeg: true,
    isShift: false,
    isHyp: false,
    history: JSON.parse(localStorage.getItem('omni_calc_history') || '[]')
  };

  // DOM Element References
  const expressionLine = document.getElementById('expressionLine');
  const resultLine = document.getElementById('resultLine');
  const angleUnitBtn = document.getElementById('angleUnitBtn');
  const degRadToggle = document.getElementById('degRadToggle');
  const secondToggle = document.getElementById('secondToggle');
  const hypToggle = document.getElementById('hypToggle');
  const memoryBadge = document.getElementById('memoryBadge');
  const shiftBadge = document.getElementById('shiftBadge');

  const historyDrawer = document.getElementById('historyDrawer');
  const historyList = document.getElementById('historyList');
  const shortcutsModal = document.getElementById('shortcutsModal');

  // Initialize Sub-Engines
  const grapher = new Grapher('graphCanvas');
  grapher.onTraceUpdate = (x, y1, y2) => {
    document.getElementById('traceX').textContent = x.toFixed(2);
    document.getElementById('traceY1').textContent = y1 !== null ? y1.toFixed(3) : '--';
    document.getElementById('traceY2').textContent = y2 !== null ? y2.toFixed(3) : '--';
  };

  // ==========================================================================
  // 1. NAVIGATION & TAB SWITCHING
  // ==========================================================================
  const tabButtons = document.querySelectorAll('.nav-tabs .tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetEl = document.getElementById(`tab-${targetTab}`);
      if (targetEl) targetEl.classList.add('active');

      if (targetTab === 'graphing') {
        setTimeout(() => grapher.resizeCanvas(), 50);
      }
    });
  });

  // Theme Switcher (Dark / Light)
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    themeToggleBtn.querySelector('i').className = newTheme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    setTimeout(() => grapher.draw(), 50);
  });

  // History Drawer Toggle
  document.getElementById('historyToggleBtn').addEventListener('click', () => {
    historyDrawer.classList.toggle('open');
    renderHistory();
  });
  document.getElementById('closeHistoryBtn').addEventListener('click', () => {
    historyDrawer.classList.remove('open');
  });

  // Shortcuts Modal Toggle
  document.getElementById('shortcutsBtn').addEventListener('click', () => {
    shortcutsModal.classList.add('open');
  });
  document.getElementById('closeShortcutsBtn').addEventListener('click', () => {
    shortcutsModal.classList.remove('open');
  });

  // ==========================================================================
  // 2. SCIENTIFIC CALCULATOR ENGINE
  // ==========================================================================

  function updateDisplay() {
    expressionLine.textContent = state.expression;
    
    // Live result preview or main output
    if (state.expression.trim() === '') {
      resultLine.textContent = '0';
    } else {
      const liveRes = evaluateExpression(state.expression);
      if (liveRes !== null && !isNaN(liveRes)) {
        resultLine.textContent = formatNumber(liveRes);
      }
    }

    // Indicators
    angleUnitBtn.textContent = state.isDeg ? 'DEG' : 'RAD';
    degRadToggle.textContent = state.isDeg ? 'DEG' : 'RAD';
    degRadToggle.classList.toggle('active', state.isDeg);

    memoryBadge.classList.toggle('hidden', state.memory === 0);
    shiftBadge.classList.toggle('hidden', !state.isShift);

    secondToggle.classList.toggle('active', state.isShift);
    hypToggle.classList.toggle('active', state.isHyp);

    // Dynamic shift label updates
    document.querySelectorAll('.key-func[data-shift]').forEach(btn => {
      const defaultText = btn.getAttribute('data-cmd');
      const shiftText = btn.getAttribute('data-shift');
      btn.textContent = state.isShift ? shiftText : defaultText;
    });
  }

  function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return 'Error';
    if (!isFinite(num)) return num > 0 ? '∞' : '-∞';
    
    // Clean precision up to 10 decimal places
    const str = num.toString();
    if (str.length > 12 && !str.includes('e')) {
      return parseFloat(num.toFixed(8)).toString();
    }
    return str;
  }

  function appendToExpression(str) {
    state.expression += str;
    updateDisplay();
  }

  function deleteLastChar() {
    // Check if trailing is a function keyword
    const funcMatch = state.expression.match(/(sin\(|cos\(|tan\(|asin\(|acos\(|atan\(|ln\(|log\(|sqrt\(|abs\()$/);
    if (funcMatch) {
      state.expression = state.expression.slice(0, -funcMatch[0].length);
    } else {
      state.expression = state.expression.slice(0, -1);
    }
    updateDisplay();
  }

  function clearAll() {
    state.expression = '';
    resultLine.textContent = '0';
    updateDisplay();
  }

  // Factorial helper function
  function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }

  function evaluateExpression(expr) {
    if (!expr || expr.trim() === '') return 0;
    try {
      let sanitized = expr;

      // Handle Angle conversions for Trig functions if in DEG mode
      const toRad = state.isDeg ? `*(Math.PI/180)` : '';
      const fromRad = state.isDeg ? `*(180/Math.PI)` : '';

      // Trigonometric replacements
      if (state.isHyp) {
        sanitized = sanitized.replace(/sin\(/g, 'Math.sinh(')
                             .replace(/cos\(/g, 'Math.cosh(')
                             .replace(/tan\(/g, 'Math.tanh(');
      } else {
        if (state.isDeg) {
          sanitized = sanitized.replace(/sin\(([^)]+)\)/g, `Math.sin(($1)${toRad})`)
                               .replace(/cos\(([^)]+)\)/g, `Math.cos(($1)${toRad})`)
                               .replace(/tan\(([^)]+)\)/g, `Math.tan(($1)${toRad})`)
                               .replace(/asin\(([^)]+)\)/g, `(Math.asin($1)${fromRad})`)
                               .replace(/acos\(([^)]+)\)/g, `(Math.acos($1)${fromRad})`)
                               .replace(/atan\(([^)]+)\)/g, `(Math.atan($1)${fromRad})`);
        } else {
          sanitized = sanitized.replace(/sin\(/g, 'Math.sin(')
                               .replace(/cos\(/g, 'Math.cos(')
                               .replace(/tan\(/g, 'Math.tan(')
                               .replace(/asin\(/g, 'Math.asin(')
                               .replace(/acos\(/g, 'Math.acos(')
                               .replace(/atan\(/g, 'Math.atan(');
        }
      }

      // Other math functions
      sanitized = sanitized.replace(/ln\(/g, 'Math.log(')
                           .replace(/log\(/g, 'Math.log10(')
                           .replace(/sqrt\(/g, 'Math.sqrt(')
                           .replace(/cbrt\(/g, 'Math.cbrt(')
                           .replace(/abs\(/g, 'Math.abs(')
                           .replace(/π|pi/g, 'Math.PI')
                           .replace(/\be\b/g, 'Math.E')
                           .replace(/\^/g, '**')
                           .replace(/Ans/g, state.ans.toString());

      // Replace factorials like 5! -> factorial(5)
      sanitized = sanitized.replace(/(\d+)!/g, 'factorial($1)');

      // Safe JS evaluation
      const res = Function('factorial', `"use strict"; return (${sanitized})`)(factorial);
      return res;
    } catch (e) {
      return null;
    }
  }

  function calculateFinalResult() {
    if (state.expression.trim() === '') return;
    const finalVal = evaluateExpression(state.expression);

    if (finalVal !== null && !isNaN(finalVal)) {
      state.result = finalVal;
      state.ans = finalVal;
      resultLine.textContent = formatNumber(finalVal);

      // Save to History
      saveHistoryItem(state.expression, formatNumber(finalVal));
      state.expression = formatNumber(finalVal);
    } else {
      resultLine.textContent = 'Syntax Error';
    }
  }

  // Keypad Click Event Delegation
  document.querySelectorAll('.keypad-grid .key').forEach(key => {
    key.addEventListener('click', () => {
      const val = key.getAttribute('data-val');
      const op = key.getAttribute('data-op');
      const cmd = key.getAttribute('data-cmd');
      const action = key.getAttribute('data-action');

      if (val) appendToExpression(val);
      if (op) appendToExpression(` ${op} `);
      if (action === 'clear') clearAll();
      if (action === 'delete') deleteLastChar();
      if (action === 'equals') calculateFinalResult();

      if (cmd) {
        let activeCmd = state.isShift && key.hasAttribute('data-shift') ? key.getAttribute('data-shift') : cmd;
        
        switch(activeCmd) {
          case 'sin': case 'cos': case 'tan':
          case 'asin': case 'acos': case 'atan':
          case 'ln': case 'log': case 'sqrt': case 'cbrt': case 'abs':
            appendToExpression(`${activeCmd}(`);
            break;
          case '^': appendToExpression('^'); break;
          case '^2': appendToExpression('^2'); break;
          case '^3': appendToExpression('^3'); break;
          case 'fact': appendToExpression('!'); break;
          case 'recip': appendToExpression('^( -1 )'); break;
          case 'pi': appendToExpression('π'); break;
          case 'e': appendToExpression('e'); break;
          case 'ans': appendToExpression('Ans'); break;
          case '(': case ')': appendToExpression(activeCmd); break;
          case 'e^x': appendToExpression('e^('); break;
          case '10^x': appendToExpression('10^('); break;
        }

        if (state.isShift) {
          state.isShift = false;
          updateDisplay();
        }
      }
    });
  });

  // Controls & Memory Buttons
  angleUnitBtn.addEventListener('click', () => { state.isDeg = !state.isDeg; updateDisplay(); });
  degRadToggle.addEventListener('click', () => { state.isDeg = !state.isDeg; updateDisplay(); });
  secondToggle.addEventListener('click', () => { state.isShift = !state.isShift; updateDisplay(); });
  hypToggle.addEventListener('click', () => { state.isHyp = !state.isHyp; updateDisplay(); });

  document.querySelectorAll('.mem-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const act = btn.getAttribute('data-action');
      const currentRes = evaluateExpression(state.expression) || 0;

      switch(act) {
        case 'mc': state.memory = 0; break;
        case 'mr': appendToExpression(state.memory.toString()); break;
        case 'm-plus': state.memory += currentRes; break;
        case 'm-minus': state.memory -= currentRes; break;
        case 'ms': state.memory = currentRes; break;
      }
      updateDisplay();
    });
  });

  // Physical Keyboard Listener
  window.addEventListener('keydown', (e) => {
    // Only capture keypresses when not focused in an input or textarea
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

    if (e.key >= '0' && e.key <= '9') appendToExpression(e.key);
    else if (e.key === '.') appendToExpression('.');
    else if (e.key === '+') appendToExpression(' + ');
    else if (e.key === '-') appendToExpression(' - ');
    else if (e.key === '*') appendToExpression(' * ');
    else if (e.key === '/') appendToExpression(' / ');
    else if (e.key === '%') appendToExpression(' % ');
    else if (e.key === '^') appendToExpression('^');
    else if (e.key === '(' || e.key === ')') appendToExpression(e.key);
    else if (e.key === 'Enter' || e.key === '=') calculateFinalResult();
    else if (e.key === 'Backspace') deleteLastChar();
    else if (e.key === 'Escape') clearAll();
    else if (e.key.toLowerCase() === 's') appendToExpression('sin(');
    else if (e.key.toLowerCase() === 'c') appendToExpression('cos(');
    else if (e.key.toLowerCase() === 't') appendToExpression('tan(');
    else if (e.key.toLowerCase() === 'l') appendToExpression('ln(');
    else if (e.key.toLowerCase() === 'p') appendToExpression('π');
  });

  // ==========================================================================
  // 3. HISTORY MANAGEMENT
  // ==========================================================================

  function saveHistoryItem(expr, val) {
    state.history.unshift({ expr, val, time: new Date().toLocaleTimeString() });
    if (state.history.length > 30) state.history.pop();
    localStorage.setItem('omni_calc_history', JSON.stringify(state.history));
  }

  function renderHistory() {
    if (state.history.length === 0) {
      historyList.innerHTML = '<div class="empty-history">No calculation history yet.</div>';
      return;
    }

    historyList.innerHTML = state.history.map(item => `
      <div class="history-item" data-expr="${item.expr}">
        <div class="history-expr">${item.expr} =</div>
        <div class="history-val">${item.val}</div>
      </div>
    `).join('');

    document.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        state.expression = el.getAttribute('data-expr');
        updateDisplay();
        historyDrawer.classList.remove('open');
      });
    });
  }

  document.getElementById('clearHistoryBtn').addEventListener('click', () => {
    state.history = [];
    localStorage.removeItem('omni_calc_history');
    renderHistory();
  });

  // ==========================================================================
  // 4. GRAPHING TAB INTERACTIONS
  // ==========================================================================

  document.getElementById('plotGraphBtn').addEventListener('click', () => {
    const f1 = document.getElementById('func1').value;
    const c1 = document.getElementById('color1').value;
    const f2 = document.getElementById('func2').value;
    const c2 = document.getElementById('color2').value;
    grapher.setFunctions(f1, c1, f2, c2);
  });

  document.querySelectorAll('.preset-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const f1 = btn.getAttribute('data-f1');
      const f2 = btn.getAttribute('data-f2');
      document.getElementById('func1').value = f1;
      document.getElementById('func2').value = f2;
      grapher.setFunctions(f1, '#00f2fe', f2, '#ff4b8b');
    });
  });

  document.getElementById('resetZoomBtn').addEventListener('click', () => {
    grapher.setBounds(-10, 10, -10, 10);
    grapher.updateBoundsUI();
  });

  ['xMin', 'xMax', 'yMin', 'yMax'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      const xMin = document.getElementById('xMin').value;
      const xMax = document.getElementById('xMax').value;
      const yMin = document.getElementById('yMin').value;
      const yMax = document.getElementById('yMax').value;
      grapher.setBounds(xMin, xMax, yMin, yMax);
    });
  });

  document.getElementById('zoomInBtn').addEventListener('click', () => {
    grapher.setBounds(grapher.xMin * 0.75, grapher.xMax * 0.75, grapher.yMin * 0.75, grapher.yMax * 0.75);
    grapher.updateBoundsUI();
  });
  document.getElementById('zoomOutBtn').addEventListener('click', () => {
    grapher.setBounds(grapher.xMin * 1.3, grapher.xMax * 1.3, grapher.yMin * 1.3, grapher.yMax * 1.3);
    grapher.updateBoundsUI();
  });

  // Initial Graph Draw
  grapher.setFunctions('x^2 - 4', '#00f2fe', 'sin(x)', '#ff4b8b');

  // ==========================================================================
  // 5. STATISTICS TAB INTERACTIONS
  // ==========================================================================

  const statsInput = document.getElementById('statsDataInput');
  const calcStatsBtn = document.getElementById('calcStatsBtn');

  calcStatsBtn.addEventListener('click', () => {
    const nums = StatsEngine.parseInput(statsInput.value);
    const res = StatsEngine.analyze(nums);

    if (!res) {
      alert('Please enter valid numbers.');
      return;
    }

    document.getElementById('statCount').textContent = res.count;
    document.getElementById('statSum').textContent = res.sum.toFixed(4);
    document.getElementById('statMean').textContent = res.mean.toFixed(4);
    document.getElementById('statMedian').textContent = res.median.toFixed(4);
    document.getElementById('statMode').textContent = res.mode;
    document.getElementById('statMinMax').textContent = `${res.min} / ${res.max}`;
    document.getElementById('statRange').textContent = res.range.toFixed(4);
    document.getElementById('statSampleStdDev').textContent = res.sampleStdDev.toFixed(4);
    document.getElementById('statPopStdDev').textContent = res.popStdDev.toFixed(4);
    document.getElementById('statSampleVar').textContent = res.sampleVariance.toFixed(4);
    document.getElementById('statQ1').textContent = res.q1.toFixed(4);
    document.getElementById('statQ3').textContent = res.q3.toFixed(4);

    document.getElementById('sortedTags').innerHTML = res.sorted
      .map(n => `<span class="tag-num">${n}</span>`)
      .join('');
  });

  document.getElementById('sampleDataBtn').addEventListener('click', () => {
    statsInput.value = "14, 18, 22, 25, 29, 31, 18, 22, 35, 40, 18";
    calcStatsBtn.click();
  });

  document.getElementById('clearStatsBtn').addEventListener('click', () => {
    statsInput.value = '';
    document.getElementById('sortedTags').innerHTML = '<span class="placeholder-text">Enter data and click Analyze</span>';
  });

  // ==========================================================================
  // 6. SOLVERS TAB INTERACTIONS
  // ==========================================================================

  const solverTabBtns = document.querySelectorAll('.solver-tab-btn');
  const solverViews = document.querySelectorAll('.solver-view');

  solverTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-solver');
      solverTabBtns.forEach(b => b.classList.remove('active'));
      solverViews.forEach(v => v.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`solver-${target}`).classList.add('active');
    });
  });

  // Quadratic Solver
  document.getElementById('solveQuadBtn').addEventListener('click', () => {
    const a = parseFloat(document.getElementById('quadA').value) || 0;
    const b = parseFloat(document.getElementById('quadB').value) || 0;
    const c = parseFloat(document.getElementById('quadC').value) || 0;

    const res = SolversEngine.solveQuadratic(a, b, c);
    document.getElementById('quadRoots').textContent = res.roots;
    document.getElementById('quadSteps').textContent = res.steps;
  });

  // Linear Solver
  document.getElementById('solveLinearBtn').addEventListener('click', () => {
    const a1 = parseFloat(document.getElementById('linA1').value) || 0;
    const b1 = parseFloat(document.getElementById('linB1').value) || 0;
    const c1 = parseFloat(document.getElementById('linC1').value) || 0;
    const a2 = parseFloat(document.getElementById('linA2').value) || 0;
    const b2 = parseFloat(document.getElementById('linB2').value) || 0;
    const c2 = parseFloat(document.getElementById('linC2').value) || 0;

    const res = SolversEngine.solveLinear2x2(a1, b1, c1, a2, b2, c2);
    document.getElementById('linearRoots').textContent = res.roots;
  });

  // Geometry Solver Dynamic Inputs
  const geomShapeSelect = document.getElementById('geomShapeSelect');
  const geomInputs = document.getElementById('geomInputs');

  function renderGeomInputs() {
    const shape = geomShapeSelect.value;
    if (shape === 'circle' || shape === 'sphere') {
      geomInputs.innerHTML = `
        <div class="quad-field"><label>Radius (r):</label><input type="number" id="geomR" value="5" step="any"></div>
      `;
    } else if (shape === 'triangle') {
      geomInputs.innerHTML = `
        <div class="quad-field"><label>Base (a):</label><input type="number" id="geomA" value="3" step="any"></div>
        <div class="quad-field"><label>Height (b):</label><input type="number" id="geomB" value="4" step="any"></div>
      `;
    } else if (shape === 'cylinder') {
      geomInputs.innerHTML = `
        <div class="quad-field"><label>Radius (r):</label><input type="number" id="geomR" value="3" step="any"></div>
        <div class="quad-field"><label>Height (h):</label><input type="number" id="geomH" value="10" step="any"></div>
      `;
    }
  }

  geomShapeSelect.addEventListener('change', renderGeomInputs);
  renderGeomInputs();

  document.getElementById('solveGeomBtn').addEventListener('click', () => {
    const shape = geomShapeSelect.value;
    const params = {};
    if (document.getElementById('geomR')) params.radius = document.getElementById('geomR').value;
    if (document.getElementById('geomA')) params.base = document.getElementById('geomA').value;
    if (document.getElementById('geomB')) params.height = document.getElementById('geomB').value;
    if (document.getElementById('geomH')) params.height = document.getElementById('geomH').value;

    const resText = SolversEngine.solveGeometry(shape, params);
    document.getElementById('geomDisplay').innerText = resText;
  });

  // ==========================================================================
  // 7. UNIT CONVERTER INTERACTIONS
  // ==========================================================================

  let currentCategory = 'length';
  const catBtns = document.querySelectorAll('.converter-category-bar .cat-btn');
  const fromSelect = document.getElementById('convertFromUnit');
  const toSelect = document.getElementById('convertToUnit');
  const fromValInput = document.getElementById('convertFromVal');
  const toValInput = document.getElementById('convertToVal');
  const formulaText = document.getElementById('conversionFormulaText');

  function populateUnitDropdowns(cat) {
    currentCategory = cat;
    const catData = ConverterEngine.units[cat];
    const labels = catData.labels;

    const options = Object.keys(labels).map(k => `<option value="${k}">${labels[k]}</option>`).join('');
    fromSelect.innerHTML = options;
    toSelect.innerHTML = options;

    // Pick reasonable defaults
    const keys = Object.keys(labels);
    if (keys.length > 1) {
      toSelect.selectedIndex = 1;
    }
    doConversion();
  }

  function doConversion() {
    const val = parseFloat(fromValInput.value) || 0;
    const fromUnit = fromSelect.value;
    const toUnit = toSelect.value;

    const res = ConverterEngine.convert(currentCategory, val, fromUnit, toUnit);
    toValInput.value = res.toFixed(6).replace(/\.?0+$/, '');

    // Show 1 Unit sample
    const sample = ConverterEngine.convert(currentCategory, 1, fromUnit, toUnit);
    const fromName = ConverterEngine.units[currentCategory].labels[fromUnit];
    const toName = ConverterEngine.units[currentCategory].labels[toUnit];
    formulaText.textContent = `1 ${fromName} = ${sample.toFixed(6).replace(/\.?0+$/, '')} ${toName}`;
  }

  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      catBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      populateUnitDropdowns(btn.getAttribute('data-cat'));
    });
  });

  fromValInput.addEventListener('input', doConversion);
  fromSelect.addEventListener('change', doConversion);
  toSelect.addEventListener('change', doConversion);

  document.getElementById('swapUnitsBtn').addEventListener('click', () => {
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    doConversion();
  });

  populateUnitDropdowns('length');

});
