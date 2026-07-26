# 🧮 Student Math Calc - Ultimate Student Calculator & Math Suite

Student Math Calc is a modern, fast, and feature-complete web application built for students. It includes a Scientific Calculator, 2D Function Grapher, Statistical Dataset Analyzer, Algebraic & Geometry Solvers, and a Multi-Unit Converter.

---

## 🚀 How to Publish & Deploy Online

### Option 1: Deploy for Free on GitHub Pages (Recommended)
1. Push this project folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of OmniCalc"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/omnicalc.git
   git push -u origin main
   ```
2. Go to your GitHub Repository -> **Settings** -> **Pages**.
3. Under **Build and deployment**, set Source to `Deploy from a branch` and select `main` / `/ (root)`.
4. Click **Save**. Your website will be live at `https://YOUR_USERNAME.github.io/omnicalc/`.

---

### Option 2: Deploy on Netlify (Drag & Drop)
1. Log in to [Netlify.com](https://www.netlify.com/).
2. Go to **Sites** -> **Add new site** -> **Deploy manually**.
3. Drag & drop the entire `student-calculator` project folder onto the Netlify upload box.
4. Netlify will generate a free live URL (e.g. `https://omnicalc-student.netlify.app`).

---

### Option 3: Deploy on Vercel
1. Install the Vercel CLI or connect via GitHub on [Vercel.com](https://vercel.com/):
   ```bash
   npm i -g vercel
   vercel
   ```
2. Press **Enter** to accept all default settings. Your site will be live instantly!

---

## 📁 File Structure

```text
student-calculator/
├── index.html        # Main HTML structure & tabs
├── styles.css        # Glassmorphism dark/light design system
├── app.js            # Main evaluator & state management
├── js/
│   ├── grapher.js    # Interactive 2D canvas graph engine
│   ├── stats.js      # Statistical analysis engine
│   ├── solvers.js    # Quadratic & linear algebra solvers
│   └── converter.js  # Multi-unit converter
├── vercel.json       # Vercel deployment config
├── netlify.toml      # Netlify deployment config
└── package.json      # NPM scripts & metadata
```

---

## 💻 Local Execution
To run locally on your machine:
```bash
npm start
```
Then open `http://localhost:8080` in your web browser.
