# Jayanth & Monika — Wedding Invitation

A mobile-first, six-page wedding invitation designed for GitHub Pages.

## Included in this package
- The supplied M&J monogram, cleaned into a transparent antique-gold mark for the cover watermark and wax seal.
- An original, locally stored ambient instrumental loop at `assets/music/wedding-ambience.wav` (no external audio service or database required).
- Seal-triggered music playback, floral and sparkle burst, and page-entry effects.
- Smooth reversible scroll reveals and a touch-friendly scratch-to-reveal message.
- One shared venue card and one Google Maps link for both reception and wedding.

## Run locally
Open a terminal in this folder and run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Customize
Edit `js/config.js` to change names, dates, hidden message, shared venue address and Maps URL. To use your own music, replace `assets/music/wedding-ambience.wav` with your audio file and update `musicFile` in `js/config.js` to its relative path. Music starts only after the guest taps the seal, because mobile browsers block automatic audio before a user gesture.

## Publish on GitHub Pages
Upload the contents of this folder (including the `assets/music` directory) to the repository's Pages branch/root. Keep the folder structure intact. The audio file must be committed along with the HTML, CSS, JavaScript and images.


## Mobile layout and animation notes
- **Fluid sizing:** every size is in `rem`, and the root font-size is calculated from both the phone's width *and* height (`css/style.css`, top of file). Text, spacing and alignment scale together from small Androids to large iPhones, and pages simply grow taller if a short screen needs more room. Safe-area insets (notches / home bar) are respected.
- **Animations:** only `transform` and `opacity` are animated. Scroll reveals are staggered and reversible, petals/sparkles only run for the page currently on screen, and page-to-page scrolling is driven by JavaScript so it is smooth on every phone.
- **Reduced-motion:** if a phone has "Remove animations" / battery-saver motion limits switched on, text still fades in gently but the decorative loops (petals, shine, floating) are turned off.
- **Interactive extras:** tap-to-open envelope with floral burst, music toggle, progress bar, page dots, "next page" arrows, animated countdown digits, scratch card with confetti, tap sparkles, and on the last page: Add-to-calendar (.ics), Copy address and Share on WhatsApp.
- Calendar times and the share message live in `js/config.js` (`events`, `shareMessage`).
