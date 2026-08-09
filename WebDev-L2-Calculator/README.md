# Calc — A Modern Calculator Web App

A responsive, glassmorphic calculator built with plain HTML, CSS, and JavaScript — no frameworks, no build tools. Created to fulfill the **Oasis Infobyte Level 2 Web Development Internship** requirements.

The signature look pairs a soft, blurred glass panel with a retro amber LED/VFD-style readout — a small nod to old-school calculator displays inside a modern shell.

---

## Overview

Open `index.html` in any browser and get a fully working calculator: type with your mouse or your keyboard, switch between light and dark themes, review your last calculations, and copy a result with one click. Everything runs client-side — there's nothing to install and nothing to configure.

---

## Features

**Core (internship requirements)**
- Digits 0–9 and decimal point
- Addition, subtraction, multiplication, division
- Equals, Clear (AC), and Delete (DEL)
- Correct operator precedence (× and ÷ resolve before + and −)
- Sequential/chained calculations
- Friendly division-by-zero handling
- Input validation — the display never shows `undefined` or `NaN`
- Fully responsive layout using CSS Grid
- All interactions wired through `addEventListener` (no inline `onclick`)

**Bonus**
- Percentage (%) and plus/minus (+/−)
- Full keyboard support (0–9, `.`, `+ - * /`, `Enter`, `Backspace`, `Delete`, `Escape`, `%`)
- Calculation history panel (click a past result to reuse it)
- Copy-result button with a confirmation state
- Light/dark theme toggle, saved between visits
- Optional key-press sound toggle (generated with the Web Audio API — no audio files)
- Ripple click effect and subtle press/pop/shake animations
- Auto-shrinking display for long expressions
- Inline error notifications with a shake animation

---

## Technologies Used

- **HTML5** — semantic structure and accessibility attributes
- **CSS3** — custom properties (design tokens), Grid layout, glassmorphism, transitions
- **Vanilla JavaScript (ES6+)** — an IIFE module with no external dependencies

No frameworks, no libraries, no bundlers.

---

## Folder Structure

```
WebDev-L2-Calculator/
├── index.html
├── style.css
├── script.js
├── README.md
├── assets/
│   ├── icons/
│   └── images/
└── screenshots/
```

---

## Installation

1. Download or clone this folder.
2. Open `index.html` directly in any modern browser (Chrome, Firefox, Edge, Safari).

That's it — there is no build step, no `npm install`, and no server required.

---

## Usage

- Click the on-screen keys, or type using your keyboard.
- Press `Enter` or `=` to evaluate, `Backspace` to delete a character, `Escape` to clear everything.
- Click the clock icon to open your calculation history; click any past result to load it back in.
- Click the sun/moon icon to switch themes — your choice is remembered next time.
- Click the copy icon next to the result to copy it to your clipboard.

---

## Screenshots

_Add screenshots of the light and dark themes here before publishing:_

```
screenshots/dark-theme.png
screenshots/light-theme.png
screenshots/mobile-view.png
```

---

## Future Improvements

- Scientific mode (exponents, roots, trigonometric functions)
- Persist calculation history across sessions with `localStorage`
- Unit conversion mode
- Support for parentheses in expressions

---

## License

Released under the MIT License — free to use, modify, and distribute.

---

## Author

Built as a submission for the **Oasis Infobyte Level 2 Web Development Internship**.
