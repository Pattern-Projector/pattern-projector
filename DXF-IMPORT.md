# DXF import (fork)

This fork opens AAMA/ASTM DXF pattern files (as exported by CLO 3D) directly and can
watch a folder so new exports appear on the mat automatically.

## Run it locally

Needs Node.js 20+ and Chrome or Edge (folder watching uses the File System Access API).

```sh
corepack enable          # once, provides yarn
yarn install
yarn build && yarn start # then open http://localhost:3000
```

`yarn dev` also works while changing code. Use `localhost` (not a LAN IP): browsers only
allow folder access on `https://` or `localhost`.

## Using it

1. Calibrate as usual, then click **Project**.
2. Open the **DXF** panel (pattern-piece icon at the bottom of the left rail).
3. **Choose folder** and pick the folder CLO exports to. When Chrome asks, choose
   **Allow on every visit** so watching resumes by itself after a reload.
4. Export a DXF from CLO into that folder. It loads within a couple of seconds. Exporting
   again under the same name reloads it in place and keeps where you moved it.

You can also open a `.dxf` with the normal **Open** button.

## What the converter does

- Each piece's cut line is whichever outline encloses the other. CLO puts the sew line on
  layer 1 and the cut line (with seam allowance) on layer 14, the reverse of the standard.
- Curved edges are rebuilt from the dense layer-84/85 curves, so the sew line sits at
  the true seam allowance instead of following straight chords.
- Notches come from CLO's paired notch points (cut line and sew line); unpaired ones are
  drawn square to the edge.
- CLO's piece IDs and point numbers are hidden; your own annotations are kept.
- Units come from the file's `UNITS:` text (metric or English).

## Panel settings

- **Watch folder**: on/off, folder, **Load newest**, and what was last loaded.
- **Pack pieces**: arranges pieces in compact rows (no rotation, so grainlines keep their
  direction) instead of CLO's 2D-window layout.
- **Line styles** per element (cut, sew, notches, internal, fold, grainline, drill holes,
  labels): visibility, width in mm, colour, dash style, plus notch depth, drill-mark size
  and text size. Changes apply instantly; previews show the colour after the theme filter.

Code: `app/_lib/dxf/` (parser, converter, styles, change detection, tests),
`app/_hooks/use-dxf-watcher.ts`, `app/_components/menus/dxf-menu.tsx`.

Tests: `yarn test:unit`. To check a real export as well:
`PATTERN_DXF=path/to/file.dxf SEAM_ALLOWANCES_MM=12.7,30 yarn test:unit`.
