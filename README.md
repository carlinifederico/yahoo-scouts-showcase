# Yahoo Scouts — Character System Showcase

A single-page presentation site for the **Yahoo Scouts** illustration system: two directions
(Humanoid / Iconic), four scouts (Science, Sports, Technology, Weather), construction specs and
an in-product mockup. Styled in the Yahoo brand with a clean, Duolingo-Design-System feel.

**Live site:** https://carlinifederico.github.io/yahoo-scouts-showcase/

## Structure

```
index.html      – all sections (hero, styles, scouts, specs, in-product, animation)
styles.css      – design system (Yahoo purple, rounded headings, responsive)
script.js       – A/B style toggle, lightbox, scroll-spy, reveal, animation auto-detect
assets/
  scouts/       – <scout>-a.png (humanoid) and <scout>-b.png (iconic)
  specs/        – construction matrices + prop language
  product/      – in-product mockup
  anim/         – motion test clips (see below)
```

## Adding motion tests

The **Motion tests** section auto-detects clips. Just drop MP4s here:

```
assets/anim/science.mp4
assets/anim/sports.mp4
assets/anim/technology.mp4
assets/anim/weather.mp4
```

Any file present will replace its "coming soon" placeholder and autoplay (muted, looped).
Then commit & push — GitHub Pages redeploys automatically.

## Local preview

Open `index.html` directly, or serve it:

```
python -m http.server 8000
```

## Deploy

Hosted on GitHub Pages from `main` (root). Push to `main` to publish.
