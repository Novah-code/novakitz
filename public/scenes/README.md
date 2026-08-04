# Home scene artwork

The home screen shows a circular window onto an illustrated landscape.
`HomeScene` looks for the files below and falls back to the vector stand-in in
`src/components/SceneArt.tsx` when one is missing, so a half-finished set never
breaks the screen.

| File | When it shows |
| --- | --- |
| `scene-day.png` | 06:00–18:59 local, or manually selected |
| `scene-night.png` | 19:00–05:59 local, or manually selected |

## Requirements

- **Square.** The disc is a perfect circle and the image is `object-fit: cover`,
  so anything not square gets cropped on the long axis.
- **1500×1500 recommended.** The disc is capped at 420 CSS px
  (`--scene-size` in `home-scene.css`), which is 1260 device pixels on a 3x
  display. 1260 is the true minimum; 1500 leaves room to enlarge the disc later
  without re-exporting.
- **Horizon at the vertical centre.** The page splits into sky and ground at the
  middle of the screen and the disc is centred on that line. The illusion only
  works if the horizon inside the artwork sits at the same height.
- **Bleed to the edges.** Do not bake a circular mask or padding into the file —
  the circle is applied in CSS. Fill the whole square.

## Two things to keep in sync

The flat sky and ground colours behind the disc live in
`src/styles/home-scene.css` as `--sky` and `--ground`. They should match the
artwork's own sky and grass at the horizon, or the seam becomes visible.

Night is gated behind `NIGHT_SCENE_READY` in `src/lib/useTimeOfDay.ts`. While it
is `false` the day scene always shows and the manual toggle is hidden. Flip it
to `true` once `scene-night.png` and the night palette are both in.

## File size

These are full-bleed painterly images. Export as PNG only if the grain demands
it — otherwise WebP at quality ~82 is typically a third of the size for the same
result, and the app bundle ships inside the binary where every megabyte counts
against the download. Update `SCENE_SOURCES` in `HomeScene.tsx` if you change
the extension.
