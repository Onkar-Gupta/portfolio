# "Into the Mind": design notes

Last updated 10 Nov 2026. This file describes the site as it is built now. The first version of
this file described a Three.js brain, a stick-figure guide and a dark-to-light toggle. None of
that is in the code any more.

## 1. The idea

You dive into a brain, the screen glitches, and you land in a dark room in front of a modern
computer. The code types `> ejecting...`, the glass shatters and a Pixar-style version of
Onkar comes out, falls through a rain of code, hangs in mid-air while the camera circles him,
and is caught by light cursors. **The film is the portfolio.** While it plays, small cursors
build cards on top of it with everything about Onkar. The full sections sit below the film for
search engines, keyboards and reduced motion.

## 2. Page flow

```
HERO              brain made of points, dives as you scroll (canvas, brain.js)
  GLITCH          one CRT glitch, background #3B2B1A = the film's first frame
FILM RUNWAY       about 10.9 screens of scroll (desktop), four clips scrubbed by scroll
SECTIONS          01 data, 02 architecture, 03 training arc, 04 outputs, 05 evaluation, 06 deploy
FOOTER
```

The runway is an empty section after the hero. A fixed layer (`#film`) plays the clips and a
second fixed layer (`#film-ui`) carries the cards. Scroll position sets the video time, so
scrolling back rewinds.

## 3. The film: scroll frames (desktop; phones use 0.7 of each length)

The film is cut into **beats**. Each beat plays a set piece of video and ends at a **rest point**:
the video has reached its planned frame and that beat's boxes are all built. Scrolling plays the
video toward the next rest point; stop part-way and the page glides on to the nearest rest point
(forward if you pushed at least 36 px, back otherwise; one mouse-wheel notch is about 100 px, so a notch always moves on), with the video playing as it
glides. Arrow keys, Page Up/Down and Space jump one frame. A counter ("05 / 15") and a small
"scroll" hint appear at each rest point.

Every box has a **cue**, a moment in the movie. The box appears when the movie reaches that
moment, so the boxes belong to what is on screen. All the boxes inside the movie rise in with a
light CSS animation (a rise-and-fade, an accent flash around the edge, then the lines dropping in
one after another); there are no cursors inside the movie. The swarm cursors build the sections
below the film, on a fast timetable (about 1.6 s a box). Boxes stay built once built.

| # | Beat | Clip share | Scroll length | Boxes (cues) |
|---|---|---|---|---|
| 1 | a1 | A 0 to 0.55 | 90 vh | none |
| 2 | a2 | A 0.55 to 1 | 80 vh | none |
| 3 | fall | B1 | 120 vh | About card, then the glance card |
| 4 | orbit, front to left | B2 0 to 0.22 | 90 vh | the four skill groups, one by one |
| | orbit gap | B2 to 0.26 | 10 vh | |
| 5 | orbit, left to back | B2 0.26 to 0.48 | 90 vh | the four epochs, one by one |
| | orbit gap | B2 to 0.52 | 10 vh | |
| 6 | orbit, back to right | B2 0.52 to 0.74 | 90 vh | the four certifications, one by one |
| | rest of the orbit | B2 to the end | 70 vh | |
| 7 | catch | C | 110 vh | none; scroll opens at 0.945 (`LEAVE`), when he has left the frame |
| 8 to 13 | floor | C last frame | 300 vh | the floppy disks slide in, one rest point per disk |
| fade | | | 30 vh | the film fades into the dark page |

The scenes follow the menu order: data (About), architecture (skills), training (journey),
evaluation (certifications), outputs (the floppies). Contact and the rest are the sections below
the film. Seven rest points in all: the catch point, where scroll opens, and one per disk.
Snapping is done in `film.js` (not the browser's scroll-snap) so it works the same everywhere;
any new scroll input cancels a glide.

**The movie.** When the film cuts in after the brain has formed and the glitch has played, scroll is
locked and all four clips play by themselves, one after another, as a list of phases (`MOVIE` in
`film.js`): A, the fall (B1), the orbit (B2), and the catch (C) until `LEAVE`. Everything plays at
normal speed and nothing ever stops: the picture does not freeze while boxes appear. The slow
motion is baked into the files (see section 9): B1 is slowed 1.5 times (12 s) and B2 2.5 times
(20 s) with interpolated frames. The whole movie is about 48 s. The page position follows the
movie every frame, so the boxes' cues (positions) fire in step. At `LEAVE` the page position is
snapped to the first rest point (so the video does not rewind), scroll unlocks, and the floppies
appear. The glitch fades out over the still monitor for 0.6 s before clip A plays. It plays once
per visit, and only if the visitor came in from the hero. A "skip intro" pill, Esc or Enter glides
straight to the first rest point, and a 120 second guard releases scroll if a clip ever stalls.
While it plays, wheel, touch and key scrolling are blocked.

**Layout system.** Every two-column scene is one row: the left and right columns share a top
edge and a height (cards stretch to match), with the middle third left clear for the character.
A small chip above the left column names the scene, and a rail of six dots on the right edge
shows where you are.

**The floppy archive.** After the catch the film holds the empty floor while the six projects
scroll past as 3.5 inch floppy disks in a cover-flow (perspective and tilt). Each disk is drawn
in code: a coloured plastic shell, a metal shutter that slides open as the disk reaches the
centre, a paper label with one real number per project (`album` in `content.js`), the
project's title and "ONKAR GUPTA", and a write-protect notch. Click a side disk to bring it to
the centre; click the centre disk to open its contents (the disk, an `A:\NAME> DIR` header,
numbered files made from the project's bullets, tags and links).

Clips are in `media/`: `film-a.mp4`, `film-b1.mp4`, `film-b2.mp4`, `film-c.mp4` (1280 by 720,
24 fps; A and C 8 s, B1 12 s, B2 20 s; about 11 MB in total). Made in Google Flow from a character reference image.

## 4. Colour: one scroll journey, no toggle

`effects.js` writes two numbers on `<html>` every frame and CSS does the mixing.

| Token | Value | Use |
|---|---|---|
| `--brown` | `#2C2016` | base (about 60%), darkened twice at Onkar's request |
| `--paper` | `#E3D7C3` | the light end of the journey: muted warm stone |
| `--cream` | `#F4D9A0` | text on dark, glows, tags |
| `--accent` | `#C8792C` | cursors, lines, dots, highlights |
| `--deep` | `#1A120B` | shadows, text on light, card glass |

- `--j` (0 to 1) mixes `--brown` to `--paper` in sRGB. It runs from the start of `#projects`
  (minus half a screen) to the start of `#contact`, so most of the page stays dark.
- `--jt` (0 to 1) flips the text from cream to deep brown in a short band (j 0.36 to 0.46).
- Contrast (computed from the hex values): cream on brown about 11 to 1, deep on stone about
  13 to 1. Around the middle of the mix it dips to about 4.4 to 1 (an estimate, not re-measured
  with the final colours), just under the 4.5 target. Orange on brown or stone is about 2.5 to
  1, so orange is for decoration and large type only.
- A fine film grain (SVG noise, 7% opacity) sits over the background.

## 5. The build system (`build.js`)

Every card is built by one of four helper cursors (PID 043 to 046) that fly in from the
screen edges on curved paths. Stages, set on `data-state`:

`empty` (hidden, keeps its size) > `trace` (the cursor draws the border) > `fill` (a wipe, top
to bottom) > `content` (the card's parts appear one by one; headlines type in) > `done`.

- Page cards build when they scroll into view. They wait while the film covers the page.
- The film's cards use the same cursors through `window.BUILD` and never wait.
- Chapter titles are typed with no reflow: the real text stays in place, transparent, and the
  typed text sits on top. The hero name keeps the scramble effect.
- A small log in the bottom-left corner prints what the cursors are doing (desktop only).
- Plain-text blocks ("lite") skip the fill stage.

## 6. Interaction map

| Input | Response |
|---|---|
| scroll | sets the film time and the colour journey; builds cards |
| click a project card in the film | opens the full project over the film (Esc or the cross closes it) |
| cursor | custom dot and ring; project cards lift on hover |
| konami code | a short colour inversion |

## 6b. Sound (`sound.js`)

Every sound is synthesised in the browser with Web Audio: no sound files, no libraries, no
licences. It starts only after the visitor presses "Sound on" in the loader (browsers need a
click before they allow audio). "Sound off", the Enter key, or nine seconds of waiting all mean
off. A small speaker button in the bottom-right corner toggles it. The master volume is low and
passes through a compressor; the sound is suspended when the tab is hidden.

| Moment | Sound |
|---|---|
| the page (hero and film only) | a low computer hum; below the film the tune plays alone |
| the brain dive | a rising filtered noise |
| the glitch | a burst of stuttering noise and a low thud |
| clip A, the code writing | a key tick for every 26 px scrolled |
| clip A, the eject | two alarm beeps, a crack, then glass shards |
| clip B1, the free fall | wind that gets louder the faster you scroll |
| clip B2, the orbit | a soft A minor 7 pad |
| each new scene | a two-note chime (a chord for the contact scene) |
| cursors building cards | a whoosh, a tick, a soft fill, a pop and a two-note "done" (rate limited) |
| clip C, the catch | a rising shimmer |
| the sections below the film | a four-bar tune in A minor (chords Am, F, C, G, 84 beats a minute): a plucked arpeggio, a soft bass note and a singing melody with a short echo. It fades in when the film is behind you and out if you scroll back up |
| links, buttons, windows and disks | a soft tick as the pointer arrives and a small blip on a click (at most one every 90 ms) |
| the floppy archive | a drive whirr and seek ticks while you scroll; a clack and shutter tsk for each disk; a spin-up when a disk opens |

The tune is scheduled ahead of time on the audio clock by a 120 ms timer (about 7 notes a second),
so it costs the page almost nothing; `film.js` sets `MIND.film.past` once the film is behind you.
All sound is synthesised in the browser, so there are no audio files.

Sounds listen to events (`site-enter`, `glitch`, `build`, `film-scene`, `film-disk`,
`film-open`) and to `MIND.film`, which `film.js` sets every frame.

## 7. Fallbacks

- **Reduced motion:** no film, no runway, no cursors. The full sections below tell the story.
- **No JavaScript:** nothing is hidden (the hiding class is only added by `build.js`).
- **Phones (under 1000 px):** the runway is 0.7 of its desktop length, cards stack at the top and
  bottom, project cards show only a title and one key number, the log is hidden, and the
  hero brain is smaller and sits above the text.

## 8. Stack

Vanilla HTML, CSS and JavaScript, no build step, no libraries. Fonts: Sora and IBM Plex Mono
(Google Fonts). Script order matters: `content`, `render`, `effects`, `brain`, `build`, `film`.
Shared state: `window.MIND` (scroll, theme, `remeasure`, `playGlitch`) and `window.BUILD`.

## 9. Known limits

- Video seeking needs a server that supports HTTP range requests. GitHub Pages does. A plain
  double-click on `index.html` works in Chrome, but Python's simple `http.server` does not
  seek.
- The sound has been checked for errors and output level (peaks between 0.02 and 0.15 of full
  scale, no clipping) but not by ear; its balance needs listening.
- The clips were re-encoded on 10 Nov 2026 (ffmpeg, via Docker, from `media/_orig/`): H.264 Main,
  1280 by 720, 24 fps, keyframe every 12 frames, no audio. Settings: `-an -c:v libx264
  -profile:v main -preset slow -crf 26 -g 12 -keyint_min 12 -bf 2 -pix_fmt yuv420p
  -movflags +faststart` (A and C; B1 and B2 use crf 24). The original clips had one keyframe in
  192 frames, so every jump decoded from the start; the first re-encode (keyframe every 6, crf 22)
  made seeks about 7 ms but the files were heavy, so this one is about 40% smaller.
- Slow motion is in the files, not in the player. Playing a video at 0.4 or 0.5 speed made it
  judder (each frame is held for several screen refreshes). B1 and B2 were made with ffmpeg frame
  interpolation: `-vf "scale=1280:720,minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,setpts=K*PTS,fps=24"`
  with K = 1.5 for B1 and 2.5 for B2. Checked by eye on sample frames: no warping. Earlier versions
  are in `media/_v2/`.
- Scroll-blocking listeners (wheel, touch) exist only while the movie plays; a permanent blocking
  wheel listener makes every scroll step wait for the script.
- Speed, things that were measured to matter: (0) the background dot network draws its links in 4 batches
  and the cursor ring moves by transform, not left and top; the brain canvas is cleared once, not every
  frame, after it fades. (1) the brain draws its 1,500 lines and 650 dots in
  6 and 8 batches (one path and one fill each) instead of one call each; this was 41% of the main
  thread. (2) While the film covers the screen, the page, both canvases and the grain are hidden
  (`html.film-on`, `visibility: hidden`, so layout is unchanged). (3) Boxes inside the film have no
  panel, border or blur: a soft radial shade, two corner marks, and a fade-and-rise on opacity and
  transform only; each box has its own layer (`will-change`) and sits at opacity 0, not hidden.
  (4) Before the movie, the loader time is used to fetch all font weights and to paint every box,
  scene and clip once at 1% opacity (`html.prewarm`). (5) No slow playback (see above). Also:
  per-frame page writes are cached, and a low-power mode switches off the
  grain and heavier shadows if frames average slower than about 36 fps. Add `?fps` to the
  address to see frames a second.
- Not yet checked on a real phone: the About, skills, certifications and contact scenes, and
  the brain dive.
- The glitch blends into the monitor by colour; this has been set but not seen mid-glitch.
