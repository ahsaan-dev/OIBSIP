# WebDev-L2-TributePage

A premium, fully responsive tribute page dedicated to **Dr. A.P.J. Abdul Kalam** — aerospace scientist, the "Missile Man of India," and the 11th President of India — built for the Oasis Infobyte Web Development Level 2 internship task.

## Project Overview

This project goes beyond a standard tribute-page assignment: instead of a simple biography with a static timeline, the whole page is built around a single visual idea — a **flight path**. A launch trajectory animates through the hero section and becomes the connecting spine of the timeline, echoing a life that arced from a small fishing town to orbit, and back to the classroom.

The result is meant to feel like a small digital museum exhibit rather than a school assignment: a full-screen animated hero, glass-panel biography cards, an alternating timeline, an honours wall, a full-bleed quote section, an illustrated "facets of his life" gallery, and an interesting-facts grid — all built with plain HTML, CSS, and JavaScript.

## Tribute Subject

**Dr. Avul Pakir Jainulabdeen Abdul Kalam (1931–2015)** — chosen for his rare combination of scientific achievement, public service, and enduring accessibility as a teacher and mentor. His story (fisherman's son → aerospace scientist → President of India → full-time teacher again) gives the page a natural narrative arc to design around.

## Features

- Full-screen animated hero with a drawn SVG launch trajectory and an orbiting marker
- Sticky, accessible navigation with mobile hamburger menu and active-section highlighting
- Glassmorphism-style biography cards (Early Life, Career, Public Service, Legacy)
- Alternating left/right timeline connected by a single animated "flight path" spine
- Honours & achievements grid (Bharat Ratna, Padma awards, books, presidency, and more)
- Full-bleed inspirational quote section with ambient glow
- Illustrated "Facets" gallery (Scientist, Musician, Author, Statesman, Teacher, Dreamer) with hover-zoom cards
- "Small details, well remembered" facts grid (8 facts)
- Scroll-triggered fade/slide-up reveals, hover micro-interactions, and a back-to-top button
- Fully responsive: multi-column desktop layout → two-column tablet → single-column mobile
- Respects `prefers-reduced-motion` and includes a skip-to-content link, visible focus states, and semantic HTML throughout

## Technologies Used

- **HTML5** — semantic structure, `<header>`, `<main>`, `<section>`, `<figure>`, `<blockquote>`, etc.
- **CSS3** — custom properties (design tokens), Grid & Flexbox, `clamp()` for fluid type, scroll-triggered `IntersectionObserver`-driven classes, animated SVG stroke paths
- **Vanilla JavaScript** — no frameworks or libraries; handles navigation, scroll reveals, and the back-to-top control
- **Google Fonts** — Fraunces (display serif), IBM Plex Sans (body), IBM Plex Mono (labels/captions)

No build tools, bundlers, or package managers are required.

## Folder Structure

```
WebDev-L2-TributePage/
├── index.html
├── style.css
├── script.js
├── README.md
├── assets/
│   ├── images/     ← add portrait photos here (see "A note on images" below)
│   └── icons/      ← add any custom icon assets here
└── screenshots/     ← add your own screenshots of the finished page here
```

## A Note on Images

This template deliberately ships **without photographs** of Dr. Kalam. The hero and gallery sections use CSS/SVG illustration and emoji-based motifs instead, so the page works out of the box with zero licensing concerns.

If you'd like to add real photographs:

1. Source portraits that you have the right to use (for example, images explicitly released into the public domain, such as official Press Information Bureau / Government of India archive photos, or your own licensed images).
2. Drop them into `assets/images/`.
3. In `index.html`, swap the relevant `.gallery-card__art` `<div>` (or the hero) for an `<img>` tag with descriptive `alt` text — the surrounding CSS grid and card styling will continue to work unchanged.

## Installation

No installation required.

```bash
git clone <your-repo-url>
cd WebDev-L2-TributePage
```

## Usage

Simply open `index.html` in any modern browser:

- **Double-click** `index.html`, or
- Right-click → **Open with** → your browser of choice, or
- Serve it locally with any static server, e.g. `npx serve .` or the VS Code "Live Server" extension (optional — not required).

## Screenshots

Add screenshots of the running page to the `screenshots/` folder and reference them here, for example:

```
![Hero section](screenshots/hero.png)
![Timeline section](screenshots/timeline.png)
![Mobile view](screenshots/mobile.png)
```

## Future Enhancements

- Add a light/dark theme toggle
- Add real photography once licensed images are sourced
- Add a "read more" modal for each timeline milestone with extended detail
- Localize the page into Tamil and Hindi
- Add print-friendly styles for a "biography sheet" export

## License

This project is provided for educational purposes as part of the Oasis Infobyte internship program. Feel free to fork, adapt, and reuse the code. Biographical content is written from general public knowledge and should be independently verified before reuse in any formal publication.

## Author

Built as a submission for the **Oasis Infobyte Web Development Internship — Level 2, Tribute Page**.
