# Onkar Gupta: portfolio, "Into the Mind"

A scroll-driven portfolio. You dive into a brain, the screen glitches, and a character of Onkar comes out of a computer, falls, and is circled by the camera while cards about his work appear on top of the film. Computer vision and applied AI engineer, MSc Applied AI, University of Warwick.

**Live site:** https://onkar-gupta.github.io/portfolio/

## Quick start

Open `index.html` in Chrome. The internet is needed once for the fonts. For local testing with video scrubbing, use a server that supports range requests (GitHub Pages does; Python's `http.server` does not, so videos will not seek there). No build step, no dependencies.

## What it does

The whole opening plays by itself in about 50 seconds (Esc skips it), then scroll opens on the project floppy disks and the sections below. Each section below the film is a window styled as the program that fits its content.

## Edit the words

All the words live in **`js/content.js`**. It follows `master-cv.json`
(`01_CV_Optimization/References_Samples`). Rules for the text: UK English, no em dashes, no
AWS claims, and only numbers that exist in a report or README. Cards take `points` for bullet
points. Each project has a `key` (its one key number) and an `album` (the big number and its unit) printed on its floppy disk in the film.

Still open in the content: the personal hook, a tagline of your own, the resume link, and the
crop-research results.

## Structure

```
portfolio/
├── index.html          shell: canvases, glitch overlay, script order
├── DESIGN.md           how it works and why
├── css/
│   ├── base.css        colour journey tokens, grain, loader, glitch, nav, buttons
│   ├── sections.css    chapters, hero, skills, timeline, projects, bullet points
│   ├── animations.css  reveals, glitch keyframes
│   ├── build.css       the card build stages, helper cursors, typed titles, log
│   ├── windows.css     the desktop windows below the film
│   └── film.css        the film layer, the cards over it, the project modal
├── js/
│   ├── content.js      ALL the words (edit this)
│   ├── render.js       builds the sections from content.js
│   ├── effects.js      smooth scroll, colour journey, glitch, HUD, particles
│   ├── brain.js        the point-cloud brain and its dive (canvas)
│   ├── build.js        helper cursors, staged card building, typed titles, corner log
│   ├── film.js         the scroll-scrubbed film, the scenes and the floppy archive
│   └── sound.js        all sounds, synthesised in the browser (no audio files)
└── media/
    ├── film-a.mp4      the eject
    ├── film-b1.mp4     the free fall
    ├── film-b2.mp4     the 360 degree orbit
    └── film-c.mp4      the catch
```

The original clips and earlier encodes are kept locally in `media/_orig/`, `media/_v2/` and `media/_slow/` (not in this repository).

## The film clips

Four clips (8, 12, 20 and 8 seconds), 1280 by 720, 24 fps, made in Google Flow from one character reference
image. To change a clip, replace the file with the same name. The slow motion in the fall and the orbit is baked into the files (see `DESIGN.md`, section 9). The opening is a list of play phases (`MOVIE`), and the film is cut into beats with
rest points and cues, set in `MOVIE`, `SEGS` and `DEFS` at the top of `js/film.js`.

## Accessibility and fallbacks

With reduced motion on, or without JavaScript, the film and the cursors are skipped and the
full sections below tell the same story. The film's cards repeat content that is also in
those sections.

## Roadmap

- Check the remaining scenes and the dive on a real phone
- Real tagline, personal hook and resume link
- Deploy on GitHub Pages and add the URL to LinkedIn and the CV

## Licence

MIT. See `LICENSE`. Copyright (c) 2026 Onkar Gupta.

## Author

Onkar Gupta. [LinkedIn](https://www.linkedin.com/in/onkar-gupta-ai)
