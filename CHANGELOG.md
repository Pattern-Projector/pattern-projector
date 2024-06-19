# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Export PDF button that saves the PDF with selected layers and stitched pages
- Save visible layers by file per browser/device
- Save position by file per browser/device
- Status icons that indicate when a PDF is loading and for when line thickness is updated

### Changed

- Always show stitch menu button regardless of the number of pages in the PDF
- Disabled rendering of PDF links
- A single page PDF is centered on load

### Fixed

- Close overlay options menu on click outside
- Warning no longer flashes when dragging on Android, Chromebook, and in Firefox

## [1.0.2] - 2024-05-25

### Changed

- Line weight adjustment is a dropdown instead of input box
- Reset stitch menu horizontal/vertical on new file open
- Border overlay turned off by default
- Automatically go back into full screen when PDF is opened
- Calibration warnings more descriptive with button to return to full screen

### Fixed

- Menus flickering with large PDFs
- Horizontal and vertical offsets in stitch menu are reset when a new PDF is opened
- Line weight is reset when new PDF is opened

### Removed

- Shift to lock axis when dragging PDF (use arrow keys to move instead)

### Added

- Line tool to rotate to horizontal, mark lines on PDF, flip about the line, move based on the line's length, move between lines, and drag end of measurement line
- Save stitch settings by file to browser/device
- Wrong side overlay that shows dots when pattern is flipped
- Install app button
- Keyboard shortcuts for frequently used tools
- Stepper buttons for incrementing and decrementing columns and horizontal/vertical inputs in the stitch menu
- Disabled layer menu icon when no layers in PDF
- Shift-Tab to move counterclockwise around calibration grid
- Buy me a coffee widget to landing page
- Cursor changes from grab to grabbing hand when dragging
- Selected corner on calibration grid is colored

## [1.0.1] - 2024-04-15

### Added

- Redirect to calibration page when full screen mode is changed or window is moved/resized when projecting
- Check for when calibration page size or location has changed since last projection

### Changed

- Speed up line weight change and movement in Firefox
- Layer menu title and show/hide all is always visible when menu is open
- Scroll bar is shown when the number of layers is greater than the size of the menu

### Fixed

- Apply line weight changes before perspective change to stop disappearing lines when moving

### Removed

- Full screen button from projection page (needed to ensure accurate calibration)

## [1.0.0] - 2024-04-06

### Added

- Spanish translation
- Move tool for calibrating on touch devices
- Drag edges of calibration grid

### Fixed

- Line weight works for colored lines
- Can drag PDFs in Firefox

### Changed

- Arrow key movement happens by 1/2 cm or 1/4 inch

### Removed

- Colored corners on calibration grid
- Press and hold calibration corners to slow down movement

[unreleased]: https://github.com/Pattern-Projector/pattern-projector/compare/main...beta
[1.0.2]: https://github.com/Pattern-Projector/pattern-projector/releases/tag/v1.0.2
[1.0.1]: https://github.com/Pattern-Projector/pattern-projector/releases/tag/v1.0.1
[1.0.0]: https://github.com/Pattern-Projector/pattern-projector/releases/tag/v1.0.0
