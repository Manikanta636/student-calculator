/**
 * Student Math Calc - Unified Application Bundle
 * Contains 2D Grapher Engine, Statistics Engine, Solvers Engine, Converter Engine, and App Controller.
 */

// ==========================================================================
// 1. 2D GRAPHER ENGINE
// ==========================================================================
class Grapher {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    // View bounds
    this.xMin = -10;
    this.xMax = 10;
    this.yMin = -10;
    this.yMax = 10;

    // Functions to plot
    this.func1Str = "x^2 - 4";
    this.color1 = "#00f2fe";
    
    this.func2Str = "sin(x)";
    this.color2 = "#ff4b8b";

    // Mouse pan/zoom state
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.traceX = 0;
    this.traceY1 = null;
    this.traceY2 = null;

    this.initEvents();
    this.resizeCanvas();
  }

  resizeCanvas() {
    if (!this.canvas || !this.canvas.parentElement) return;
    const wrapper = this.canvas.parentElement;
    const rect = wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    
    this.width = rect.width;
    this.height = rect.height;
    this.draw();
  }

  initEvents() {
    if (!this.canvas) return;
    window.addEventListener('resize', () => this.resizeCanvas());

    // Mouse wheel zoom
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 0.85 : 1.15;
      
      const xRange = (this.xMax - this.xMin) * zoomFactor;
      const yRange = (this.yMax - this.yMin) * zoomFactor;

      const xCenter = (this.xMin + this.xMax) / 2;
      const yCenter = (this.yMin + this.yMax) / 2;

      this.xMin = xCenter - xRange / 2;
      this.xMax = xCenter + xRange / 2;
      this.yMin = yCenter - yRange / 2;
      this.yMax = yCenter + yRange / 2;

      this.updateBoundsUI();
      this.draw();
    });

    // Mouse drag pan
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const dx = e.clientX - this.dragStartX;
        const dy = e.clientY - this.dragStartY;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;

        const xUnitsPerPx = (this.xMax - this.xMin) / this.width;
        const yUnitsPerPx = (this.yMax - this.yMin) / this.height;

        this.xMin -= dx * xUnitsPerPx;
        this.xMax -= dx * xUnitsPerPx;
        this.yMin += dy * yUnitsPerPx;
        this.yMax += dy * yUnitsPerPx;

        this.updateBoundsUI();
        this.draw();
      } else {
        // Trace coordinates on hover
        const rect = this.canvas.getBoundingClientRect();
        const px = e.clientX - rect.left;
        if (px >= 0 && px <= this.width) {
          const mathX = this.pxToX(px);
          this.traceX = mathX;
          this.traceY1 = this.evaluateFunction(this.func1Str, mathX);
          this.traceY2 = this.evaluateFunction(this.func2Str, mathX);

          if (this.onTraceUpdate) {
            this.onTraceUpdate(this.traceX, this.traceY1, this.traceY2);
          }
          this.draw();
        }
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
  }

  updateBoundsUI() {
    const elXMin = document.getElementById('xMin');
    const elXMax = document.getElementById('xMax');
    const elYMin = document.getElementById('yMin');
    const elYMax = document.getElementById('yMax');
    if (elXMin) elXMin.value = this.xMin.toFixed(1);
    if (elXMax) elXMax.value = this.xMax.toFixed(1);
    if (elYMin) elYMin.value = this.yMin.toFixed(1);
    if (elYMax) elYMax.value = this.yMax.toFixed(1);
  }

  setFunctions(f1, color1, f2, color2) {
    this.func1Str = f1;
    this.color1 = color1;
    this.func2Str = f2;
    this.color2 = color2;
    this.draw();
  }

  setBounds(xMin, xMax, yMin, yMax) {
    this.xMin = parseFloat(xMin) || -10;
    this.xMax = parseFloat(xMax) || 10;
    this.yMin = parseFloat(yMin) || -10;
    this.yMax = parseFloat(yMax) || 10;
    this.draw();
  }

  xToPx(x) { return ((x - this.xMin) / (this.xMax - this.xMin)) * this.width; }
  yToPx(y) { return this.height - ((y - this.yMin) / (this.yMax - this.yMin)) * this.height; }
  pxToX(px) { return this.xMin + (px / this.width) * (this.xMax - this.xMin); }
  pxToY(py) { return this.yMin + ((this.height - py) / this.height) * (this.yMax - this.yMin); }

  evaluateFunction(expr, xVal) {
    if (!expr || expr.trim() === '') return null;
    try {
      let formatted = expr.replace(/\^/g, '**')
                          .replace(/sin/g, 'Math.sin')
                          .replace(/cos/g, 'Math.cos')
                          .replace(/tan/g, 'Math.tan')
                          .replace(/sqrt/g, 'Math.sqrt')
                          .replace(/abs/g, 'Math.abs')
                          .replace(/log/g, 'Math.log10')
                          .replace(/ln/g, 'Math.log')
                          .replace(/pi/g, 'Math.PI')
                          .replace(/e/g, 'Math.E');

      formatted = formatted.replace(/(\d+)\s*x/g, '$1*x');
      formatted = formatted.replace(/x/g, `(${xVal})`);

      const res = Function(`"use strict"; return (${formatted})`)();
      if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
        return res;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  draw() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawGrid();
    this.drawAxes();
    if (this.func1Str) this.plotCurve(this.func1Str, this.color1);
    if (this.func2Str) this.plotCurve(this.func2Str, this.color2);
    this.drawTracePoint();
  }

  drawGrid() {
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    this.ctx.lineWidth = 1;
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    this.ctx.font = "10px Fira Code";

    const xStep = Math.pow(10, Math.floor(Math.log10((this.xMax - this.xMin) / 5)));
    const yStep = Math.pow(10, Math.floor(Math.log10((this.yMax - this.yMin) / 5)));

    const startX = Math.ceil(this.xMin / xStep) * xStep;
    for (let x = startX; x <= this.xMax; x += xStep) {
      const px = this.xToPx(x);
      this.ctx.beginPath();
      this.ctx.moveTo(px, 0);
      this.ctx.lineTo(px, this.height);
      this.ctx.stroke();

      if (Math.abs(x) > 0.0001) {
        const py = Math.min(Math.max(this.yToPx(0) + 12, 12), this.height - 5);
        this.ctx.fillText(x.toFixed(xStep < 1 ? 2 : 0), px + 2, py);
      }
    }

    const startY = Math.ceil(this.yMin / yStep) * yStep;
    for (let y = startY; y <= this.yMax; y += yStep) {
      const py = this.yToPx(y);
      this.ctx.beginPath();
      this.ctx.moveTo(0, py);
      this.ctx.lineTo(this.width, py);
      this.ctx.stroke();

      if (Math.abs(y) > 0.0001) {
        const px = Math.min(Math.max(this.xToPx(0) + 4, 4), this.width - 25);
        this.ctx.fillText(y.toFixed(yStep < 1 ? 2 : 0), px, py - 3);
      }
    }
  }

  drawAxes() {
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    this.ctx.lineWidth = 1.5;

    const y0 = this.yToPx(0);
    this.ctx.beginPath();
    this.ctx.moveTo(0, y0);
    this.ctx.lineTo(this.width, y0);
    this.ctx.stroke();

    const x0 = this.xToPx(0);
    this.ctx.beginPath();
    this.ctx.moveTo(x0, 0);
    this.ctx.lineTo(x0, this.height);
    this.ctx.stroke();
  }

  plotCurve(expr, color) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();

    let isDrawing = false;
    const stepPx = 1.5;

    for (let px = 0; px <= this.width; px += stepPx) {
      const mathX = this.pxToX(px);
      const mathY = this.evaluateFunction(expr, mathX);

      if (mathY !== null && !isNaN(mathY) && Math.abs(mathY) < 1e5) {
        const py = this.yToPx(mathY);
        if (!isDrawing) {
          this.ctx.moveTo(px, py);
          isDrawing = true;
        } else {
          const prevPy = this.lastPy || py;
          if (Math.abs(py - prevPy) > this.height * 0.8) {
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(px, py);
          } else {
            this.ctx.lineTo(px, py);
          }
        }
        this.lastPy = py;
      } else {
        if (isDrawing) {
          this.ctx.stroke();
          this.ctx.beginPath();
          isDrawing = false;
        }
      }
    }
    if (isDrawing) this.ctx.stroke();
  }

  drawTracePoint() {
    if (this.traceX === undefined) return;

    const px = this.xToPx(this.traceX);

    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    this.ctx.setLineDash([4, 4]);
    this.ctx.beginPath();
    this.ctx.moveTo(px, 0);
    this.ctx.lineTo(px, this.height);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    if (this.traceY1 !== null) {
      const py1 = this.yToPx(this.traceY1);
      if (py1 >= 0 && py1 <= this.height) {
        this.ctx.fillStyle = this.color1;
        this.ctx.beginPath();
        this.ctx.arc(px, py1, 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = "#fff";
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
      }
    }

    if (this.traceY2 !== null) {
      const py2 = this.yToPx(this.traceY2);
      if (py2 >= 0 && py2 <= this.height) {
        this.ctx.fillStyle = this.color2;
        this.ctx.beginPath();
        this.ctx.arc(px, py2, 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = "#fff";
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
      }
    }
  }
}
window.Grapher = Grapher;

// ==========================================================================
// 2. STATISTICS ENGINE
// ==========================================================================
const StatsEngine = {
  parseInput(rawText) {
    if (!rawText) return [];
    const tokens = rawText.split(/[\s,;\n]+/);
    return tokens.map(t => parseFloat(t)).filter(n => !isNaN(n) && isFinite(n));
  },

  analyze(nums) {
    if (!nums || nums.length === 0) return null;

    const n = nums.length;
    const sorted = [...nums].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;

    let median = 0;
    if (n % 2 === 1) {
      median = sorted[Math.floor(n / 2)];
    } else {
      const mid = n / 2;
      median = (sorted[mid - 1] + sorted[mid]) / 2;
    }

    const freqMap = {};
    let maxFreq = 0;
    sorted.forEach(val => {
      freqMap[val] = (freqMap[val] || 0) + 1;
      if (freqMap[val] > maxFreq) maxFreq = freqMap[val];
    });

    let modes = [];
    if (maxFreq > 1) {
      modes = Object.keys(freqMap).filter(k => freqMap[k] === maxFreq).map(Number);
    }

    const min = sorted[0];
    const max = sorted[n - 1];
    const range = max - min;

    const popVariance = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const popStdDev = Math.sqrt(popVariance);

    const sampleVariance = n > 1 ? sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1) : 0;
    const sampleStdDev = Math.sqrt(sampleVariance);

    const getPercentile = (arr, p) => {
      const index = (arr.length - 1) * p;
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const weight = index - lower;
      return arr[lower] * (1 - weight) + arr[upper] * weight;
    };

    return {
      count: n,
      sum: sum,
      mean: mean,
      median: median,
      mode: modes.length > 0 ? modes.join(', ') : 'None',
      min: min,
      max: max,
      range: range,
      popVariance: popVariance,
      popStdDev: popStdDev,
      sampleVariance: sampleVariance,
      sampleStdDev: sampleStdDev,
      q1: getPercentile(sorted, 0.25),
      q3: getPercentile(sorted, 0.75),
      sorted: sorted
    };
  }
};
window.StatsEngine = StatsEngine;

// ==========================================================================
// 3. SOLVERS & GEOMETRY ENGINE
// ==========================================================================
const SolversEngine = {
  solveQuadratic(a, b, c) {
    if (a === 0) {
      if (b === 0) {
        return { roots: c === 0 ? "Infinite solutions" : "No solution", steps: "Invalid equation" };
      }
      const x = -c / b;
      return { roots: `Linear Equation: x = ${x.toFixed(4)}`, steps: `Reduced to linear ${b}x + ${c} = 0 → x = ${x.toFixed(4)}` };
    }

    const delta = b * b - 4 * a * c;
    const absA = Math.abs(a);

    if (delta > 0) {
      const sqrtDelta = Math.sqrt(delta);
      const x1 = (-b + sqrtDelta) / (2 * a);
      const x2 = (-b - sqrtDelta) / (2 * a);
      return {
        roots: `x₁ = ${x1.toFixed(4)},  x₂ = ${x2.toFixed(4)}`,
        steps: `Discriminant Δ = b² - 4ac = (${b})² - 4(${a})(${c}) = ${delta.toFixed(4)} > 0 (Two Real Roots)`
      };
    } else if (delta === 0) {
      const x = -b / (2 * a);
      return { roots: `x₁ = x₂ = ${x.toFixed(4)}`, steps: `Discriminant Δ = 0 (One Double Real Root)` };
    } else {
      const realPart = (-b / (2 * a)).toFixed(4);
      const imagPart = (Math.sqrt(-delta) / (2 * absA)).toFixed(4);
      return {
        roots: `x₁ = ${realPart} + ${imagPart}i,  x₂ = ${realPart} - ${imagPart}i`,
        steps: `Discriminant Δ = ${delta.toFixed(4)} < 0 (Complex Conjugate Roots)`
      };
    }
  },

  solveLinear2x2(a1, b1, c1, a2, b2, c2) {
    const det = a1 * b2 - a2 * b1;
    if (Math.abs(det) < 1e-12) {
      const detC1 = c1 * b2 - c2 * b1;
      return Math.abs(detC1) < 1e-12 ? { roots: "Dependent Lines (Infinitely Many Solutions)" } : { roots: "Parallel Lines (No Solution)" };
    }

    const x = (c1 * b2 - c2 * b1) / det;
    const y = (a1 * c2 - a2 * c1) / det;
    return { roots: `x = ${x.toFixed(4)},  y = ${y.toFixed(4)}` };
  },

  solveGeometry(shape, params) {
    if (shape === 'circle') {
      const r = parseFloat(params.radius) || 0;
      return `Radius = ${r}\nArea = ${(Math.PI * r * r).toFixed(4)}\nCircumference = ${(2 * Math.PI * r).toFixed(4)}`;
    } else if (shape === 'triangle') {
      const a = parseFloat(params.base) || 0;
      const b = parseFloat(params.height) || 0;
      const c = Math.sqrt(a * a + b * b);
      return `Hypotenuse c = ${c.toFixed(4)}\nArea = ${(0.5 * a * b).toFixed(4)}\nPerimeter = ${(a + b + c).toFixed(4)}`;
    } else if (shape === 'sphere') {
      const r = parseFloat(params.radius) || 0;
      return `Radius = ${r}\nVolume = ${((4 / 3) * Math.PI * Math.pow(r, 3)).toFixed(4)}\nSurface Area = ${(4 * Math.PI * r * r).toFixed(4)}`;
    } else if (shape === 'cylinder') {
      const r = parseFloat(params.radius) || 0;
      const h = parseFloat(params.height) || 0;
      return `Radius = ${r}, Height = ${h}\nVolume = ${(Math.PI * r * r * h).toFixed(4)}\nTotal Surface Area = ${(2 * Math.PI * r * (r + h)).toFixed(4)}`;
    }
    return 'Invalid selection';
  }
};
window.SolversEngine = SolversEngine;

// ==========================================================================
// 4. MULTI-UNIT CONVERTER ENGINE
// ==========================================================================
const ConverterEngine = {
  units: {
    length: {
      rates: { 'm': 1, 'km': 1000, 'cm': 0.01, 'mm': 0.001, 'mile': 1609.344, 'yard': 0.9144, 'foot': 0.3048, 'inch': 0.0254 },
      labels: { 'm': 'Meter (m)', 'km': 'Kilometer (km)', 'cm': 'Centimeter (cm)', 'mm': 'Millimeter (mm)', 'mile': 'Mile (mi)', 'yard': 'Yard (yd)', 'foot': 'Feet (ft)', 'inch': 'Inch (in)' }
    },
    mass: {
      rates: { 'kg': 1, 'g': 0.001, 'mg': 0.000001, 'lb': 0.45359237, 'oz': 0.028349523125, 'ton': 1000 },
      labels: { 'kg': 'Kilogram (kg)', 'g': 'Gram (g)', 'mg': 'Milligram (mg)', 'lb': 'Pound (lb)', 'oz': 'Ounce (oz)', 'ton': 'Metric Ton (t)' }
    },
    temperature: {
      labels: { 'c': 'Celsius (°C)', 'f': 'Fahrenheit (°F)', 'k': 'Kelvin (K)' }
    },
    area: {
      rates: { 'm2': 1, 'km2': 1000000, 'ft2': 0.092903, 'acre': 4046.86, 'hectare': 10000 },
      labels: { 'm2': 'Square Meter (m²)', 'km2': 'Square Kilometer (km²)', 'ft2': 'Square Feet (ft²)', 'acre': 'Acre', 'hectare': 'Hectare' }
    },
    volume: {
      rates: { 'l': 1, 'ml': 0.001, 'm3': 1000, 'gal': 3.78541, 'cup': 0.236588 },
      labels: { 'l': 'Liter (L)', 'ml': 'Milliliter (mL)', 'm3': 'Cubic Meter (m³)', 'gal': 'US Gallon (gal)', 'cup': 'US Cup' }
    },
    speed: {
      rates: { 'ms': 1, 'kmh': 0.277778, 'mph': 0.44704, 'knot': 0.514444 },
      labels: { 'ms': 'Meters / sec (m/s)', 'kmh': 'Km / hour (km/h)', 'mph': 'Miles / hour (mph)', 'knot': 'Knot (kt)' }
    }
  },

  convert(cat, val, fromUnit, toUnit) {
    if (isNaN(val)) return 0;
    if (cat === 'temperature') {
      let celsius = val;
      if (fromUnit === 'f') celsius = (val - 32) * (5 / 9);
      if (fromUnit === 'k') celsius = val - 273.15;

      if (toUnit === 'c') return celsius;
      if (toUnit === 'f') return celsius * (9 / 5) + 32;
      if (toUnit === 'k') return celsius + 273.15;
    }

    const catData = this.units[cat];
    if (!catData || !catData.rates) return val;

    const baseVal = val * catData.rates[fromUnit];
    return baseVal / catData.rates[toUnit];
  }
};
window.ConverterEngine = ConverterEngine;

// ==========================================================================
// 5. MAIN APPLICATION CONTROLLER
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  const state = {
    expression: '',
    result: 0,
    ans: 0,
    memory: 0,
    isDeg: true,
    isShift: false,
    isHyp: false,
    history: JSON.parse(localStorage.getItem('student_math_calc_history') || '[]')
  };

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

  // Initialize Grapher
  const grapher = new Grapher('graphCanvas');
  if (grapher) {
    grapher.onTraceUpdate = (x, y1, y2) => {
      const elX = document.getElementById('traceX');
      const elY1 = document.getElementById('traceY1');
      const elY2 = document.getElementById('traceY2');
      if (elX) elX.textContent = x.toFixed(2);
      if (elY1) elY1.textContent = y1 !== null ? y1.toFixed(3) : '--';
      if (elY2) elY2.textContent = y2 !== null ? y2.toFixed(3) : '--';
    };
  }

  // Navigation & Tab Switching
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

      if (targetTab === 'graphing' && grapher) {
        setTimeout(() => grapher.resizeCanvas(), 50);
      }
    });
  });

  // Theme Switcher
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      themeToggleBtn.querySelector('i').className = newTheme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
      if (grapher) setTimeout(() => grapher.draw(), 50);
    });
  }

  // History Drawer & Shortcuts Modal
  document.getElementById('historyToggleBtn').addEventListener('click', () => {
    historyDrawer.classList.toggle('open');
    renderHistory();
  });
  document.getElementById('closeHistoryBtn').addEventListener('click', () => {
    historyDrawer.classList.remove('open');
  });

  document.getElementById('shortcutsBtn').addEventListener('click', () => {
    shortcutsModal.classList.add('open');
  });
  document.getElementById('closeShortcutsBtn').addEventListener('click', () => {
    shortcutsModal.classList.remove('open');
  });

  // Scientific Calculator Display & Actions
  function updateDisplay() {
    if (expressionLine) expressionLine.textContent = state.expression;
    
    if (state.expression.trim() === '') {
      if (resultLine) resultLine.textContent = '0';
    } else {
      const liveRes = evaluateExpression(state.expression);
      if (liveRes !== null && !isNaN(liveRes) && resultLine) {
        resultLine.textContent = formatNumber(liveRes);
      }
    }

    if (angleUnitBtn) angleUnitBtn.textContent = state.isDeg ? 'DEG' : 'RAD';
    if (degRadToggle) {
      degRadToggle.textContent = state.isDeg ? 'DEG' : 'RAD';
      degRadToggle.classList.toggle('active', state.isDeg);
    }

    if (memoryBadge) memoryBadge.classList.toggle('hidden', state.memory === 0);
    if (shiftBadge) shiftBadge.classList.toggle('hidden', !state.isShift);

    if (secondToggle) secondToggle.classList.toggle('active', state.isShift);
    if (hypToggle) hypToggle.classList.toggle('active', state.isHyp);

    document.querySelectorAll('.key-func[data-shift]').forEach(btn => {
      const defaultText = btn.getAttribute('data-cmd');
      const shiftText = btn.getAttribute('data-shift');
      btn.textContent = state.isShift ? shiftText : defaultText;
    });
  }

  function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return 'Error';
    if (!isFinite(num)) return num > 0 ? '∞' : '-∞';
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
    if (resultLine) resultLine.textContent = '0';
    updateDisplay();
  }

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
      const toRad = state.isDeg ? `*(Math.PI/180)` : '';
      const fromRad = state.isDeg ? `*(180/Math.PI)` : '';

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

      sanitized = sanitized.replace(/ln\(/g, 'Math.log(')
                           .replace(/log\(/g, 'Math.log10(')
                           .replace(/sqrt\(/g, 'Math.sqrt(')
                           .replace(/cbrt\(/g, 'Math.cbrt(')
                           .replace(/abs\(/g, 'Math.abs(')
                           .replace(/π|pi/g, 'Math.PI')
                           .replace(/\be\b/g, 'Math.E')
                           .replace(/\^/g, '**')
                           .replace(/Ans/g, state.ans.toString());

      sanitized = sanitized.replace(/(\d+)!/g, 'factorial($1)');

      return Function('factorial', `"use strict"; return (${sanitized})`)(factorial);
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
      if (resultLine) resultLine.textContent = formatNumber(finalVal);

      saveHistoryItem(state.expression, formatNumber(finalVal));
      state.expression = formatNumber(finalVal);
    } else {
      if (resultLine) resultLine.textContent = 'Syntax Error';
    }
  }

  // Keypad Event Handlers
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

  // Pill Toggles & Memory
  if (angleUnitBtn) angleUnitBtn.addEventListener('click', () => { state.isDeg = !state.isDeg; updateDisplay(); });
  if (degRadToggle) degRadToggle.addEventListener('click', () => { state.isDeg = !state.isDeg; updateDisplay(); });
  if (secondToggle) secondToggle.addEventListener('click', () => { state.isShift = !state.isShift; updateDisplay(); });
  if (hypToggle) hypToggle.addEventListener('click', () => { state.isHyp = !state.isHyp; updateDisplay(); });

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

  // History Management
  function saveHistoryItem(expr, val) {
    state.history.unshift({ expr, val, time: new Date().toLocaleTimeString() });
    if (state.history.length > 30) state.history.pop();
    localStorage.setItem('student_math_calc_history', JSON.stringify(state.history));
  }

  function renderHistory() {
    if (!historyList) return;
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
    localStorage.removeItem('student_math_calc_history');
    renderHistory();
  });

  // Graphing Interactions
  const plotGraphBtn = document.getElementById('plotGraphBtn');
  if (plotGraphBtn && grapher) {
    plotGraphBtn.addEventListener('click', () => {
      const f1 = document.getElementById('func1').value;
      const c1 = document.getElementById('color1').value;
      const f2 = document.getElementById('func2').value;
      const c2 = document.getElementById('color2').value;
      grapher.setFunctions(f1, c1, f2, c2);
    });
  }

  document.querySelectorAll('.preset-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const f1 = btn.getAttribute('data-f1');
      const f2 = btn.getAttribute('data-f2');
      document.getElementById('func1').value = f1;
      document.getElementById('func2').value = f2;
      if (grapher) grapher.setFunctions(f1, '#00f2fe', f2, '#ff4b8b');
    });
  });

  const resetZoomBtn = document.getElementById('resetZoomBtn');
  if (resetZoomBtn && grapher) {
    resetZoomBtn.addEventListener('click', () => {
      grapher.setBounds(-10, 10, -10, 10);
      grapher.updateBoundsUI();
    });
  }

  ['xMin', 'xMax', 'yMin', 'yMax'].forEach(id => {
    const el = document.getElementById(id);
    if (el && grapher) {
      el.addEventListener('change', () => {
        const xMin = document.getElementById('xMin').value;
        const xMax = document.getElementById('xMax').value;
        const yMin = document.getElementById('yMin').value;
        const yMax = document.getElementById('yMax').value;
        grapher.setBounds(xMin, xMax, yMin, yMax);
      });
    }
  });

  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  if (zoomInBtn && grapher) {
    zoomInBtn.addEventListener('click', () => {
      grapher.setBounds(grapher.xMin * 0.75, grapher.xMax * 0.75, grapher.yMin * 0.75, grapher.yMax * 0.75);
      grapher.updateBoundsUI();
    });
  }
  if (zoomOutBtn && grapher) {
    zoomOutBtn.addEventListener('click', () => {
      grapher.setBounds(grapher.xMin * 1.3, grapher.xMax * 1.3, grapher.yMin * 1.3, grapher.yMax * 1.3);
      grapher.updateBoundsUI();
    });
  }

  if (grapher) grapher.setFunctions('x^2 - 4', '#00f2fe', 'sin(x)', '#ff4b8b');

  // Statistics Interactions
  const statsInput = document.getElementById('statsDataInput');
  const calcStatsBtn = document.getElementById('calcStatsBtn');

  if (calcStatsBtn) {
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
  }

  const sampleDataBtn = document.getElementById('sampleDataBtn');
  if (sampleDataBtn) {
    sampleDataBtn.addEventListener('click', () => {
      statsInput.value = "14, 18, 22, 25, 29, 31, 18, 22, 35, 40, 18";
      calcStatsBtn.click();
    });
  }

  const clearStatsBtn = document.getElementById('clearStatsBtn');
  if (clearStatsBtn) {
    clearStatsBtn.addEventListener('click', () => {
      statsInput.value = '';
      document.getElementById('sortedTags').innerHTML = '<span class="placeholder-text">Enter data and click Analyze</span>';
    });
  }

  // Solvers Interactions
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

  const solveQuadBtn = document.getElementById('solveQuadBtn');
  if (solveQuadBtn) {
    solveQuadBtn.addEventListener('click', () => {
      const a = parseFloat(document.getElementById('quadA').value) || 0;
      const b = parseFloat(document.getElementById('quadB').value) || 0;
      const c = parseFloat(document.getElementById('quadC').value) || 0;

      const res = SolversEngine.solveQuadratic(a, b, c);
      document.getElementById('quadRoots').textContent = res.roots;
      document.getElementById('quadSteps').textContent = res.steps;
    });
  }

  const solveLinearBtn = document.getElementById('solveLinearBtn');
  if (solveLinearBtn) {
    solveLinearBtn.addEventListener('click', () => {
      const a1 = parseFloat(document.getElementById('linA1').value) || 0;
      const b1 = parseFloat(document.getElementById('linB1').value) || 0;
      const c1 = parseFloat(document.getElementById('linC1').value) || 0;
      const a2 = parseFloat(document.getElementById('linA2').value) || 0;
      const b2 = parseFloat(document.getElementById('linB2').value) || 0;
      const c2 = parseFloat(document.getElementById('linC2').value) || 0;

      const res = SolversEngine.solveLinear2x2(a1, b1, c1, a2, b2, c2);
      document.getElementById('linearRoots').textContent = res.roots;
    });
  }

  const geomShapeSelect = document.getElementById('geomShapeSelect');
  const geomInputs = document.getElementById('geomInputs');

  function renderGeomInputs() {
    if (!geomShapeSelect || !geomInputs) return;
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

  if (geomShapeSelect) {
    geomShapeSelect.addEventListener('change', renderGeomInputs);
    renderGeomInputs();
  }

  const solveGeomBtn = document.getElementById('solveGeomBtn');
  if (solveGeomBtn) {
    solveGeomBtn.addEventListener('click', () => {
      const shape = geomShapeSelect.value;
      const params = {};
      if (document.getElementById('geomR')) params.radius = document.getElementById('geomR').value;
      if (document.getElementById('geomA')) params.base = document.getElementById('geomA').value;
      if (document.getElementById('geomB')) params.height = document.getElementById('geomB').value;
      if (document.getElementById('geomH')) params.height = document.getElementById('geomH').value;

      const resText = SolversEngine.solveGeometry(shape, params);
      document.getElementById('geomDisplay').innerText = resText;
    });
  }

  // Converter Interactions
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
    if (fromSelect) fromSelect.innerHTML = options;
    if (toSelect) toSelect.innerHTML = options;

    const keys = Object.keys(labels);
    if (keys.length > 1 && toSelect) {
      toSelect.selectedIndex = 1;
    }
    doConversion();
  }

  function doConversion() {
    if (!fromValInput || !fromSelect || !toSelect || !toValInput) return;
    const val = parseFloat(fromValInput.value) || 0;
    const fromUnit = fromSelect.value;
    const toUnit = toSelect.value;

    const res = ConverterEngine.convert(currentCategory, val, fromUnit, toUnit);
    toValInput.value = res.toFixed(6).replace(/\.?0+$/, '');

    const sample = ConverterEngine.convert(currentCategory, 1, fromUnit, toUnit);
    const fromName = ConverterEngine.units[currentCategory].labels[fromUnit];
    const toName = ConverterEngine.units[currentCategory].labels[toUnit];
    if (formulaText) {
      formulaText.textContent = `1 ${fromName} = ${sample.toFixed(6).replace(/\.?0+$/, '')} ${toName}`;
    }
  }

  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      catBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      populateUnitDropdowns(btn.getAttribute('data-cat'));
    });
  });

  if (fromValInput) fromValInput.addEventListener('input', doConversion);
  if (fromSelect) fromSelect.addEventListener('change', doConversion);
  if (toSelect) toSelect.addEventListener('change', doConversion);

  const swapUnitsBtn = document.getElementById('swapUnitsBtn');
  if (swapUnitsBtn) {
    swapUnitsBtn.addEventListener('click', () => {
      const temp = fromSelect.value;
      fromSelect.value = toSelect.value;
      toSelect.value = temp;
      doConversion();
    });
  }

  populateUnitDropdowns('length');
});
