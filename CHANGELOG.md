# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Input line length and angle using textboxes
- Português (Brasil), Suomi, and 简体中文 translations
- Opened file name shows in the stitch menu
- Screenshot testing

### Fixed

- Menus will not hide when inputting text
- Able to drag ends of lines on touch devices
- Pressing C resets & recenters the pattern
- App crashing from large width/height inputs by setting the limit to 1000
- Bright instead of pale green lines for SVGs when the green theme is enabled

### Changed

- Line measurement labels match the theme
- Enabled measuring when magnified for precision measuring
- Pressing an arrow button once will move the pattern by 1/8" or 2mm
- Slow down speed of pattern movement with arrow keys

## [1.3.0] - 2025-06-25

### Added

- Slovenščina and Norwegian Bokmål translations

### Changed

- When the page range is a single page, +/- buttons changes the page
- Enter full screen only in calibrate

### Fixed

- Calibration warning popping up when dragging on Chromecast
- Mismatch between exported and viewer stitched pages overlap

## [1.2.1] - 2025-04-29

### Fixed

- Regression where line tool stays constrained after holding shift

## [1.2.0] - 2025-04-23

### Added

- Side menu for stitch, layers, and scale menus
- Scale menu for changing the pattern scale
- "Open With Pattern Projector" for PDF files on desktop, when installed with Chrome/Edge
- Show a pop up when there's an error
- Change page range in stitch menu with +/- (use + to throw beginning pages at the end e.g. for instruction pages)
- Option to arrange stitched pages by column order
- Support for SVG (with layer visibility toggling)

### Changed

- Hide all layers button only switches to show all when all layers are hidden
- Line menu tools are horizontal and below the header
- Stitch menu is opened when the file has multiple pages, or the layer menu is opened if only one page & layers
- Languages in the language switcher are sorted alphabetically
- If no file is open, pressing the "Project" button will open the file picker
- Able to drag outside of PDF

### Fixed

- Bug on international keyboards that was causing key collisions (comma key was triggering magnify tool)

### Removed

- Flags from the language switcher

## [1.1.3] - 2024-11-19

### Fixed

- Allow width and height to be deleted

## [1.1.2] - 2024-10-23

### Fixed

- Don't allow zero for width and height
- Export with the largest page size to avoid incorrect overlap when different sized pages in range

## [1.1.1] - 2024-10-03

### Added

- Mail button for me to send messages

## [1.1.0] - 2024-09-26

### Added

- Export PDF button that saves the PDF with selected layers and stitched pages
- Save visible layers by file per browser/device
- Magnify button to zoom in PDF where tapped or clicked
- Zoom out button to zoom the whole PDF to be shown on the screen, then click a spot on PDF to zoom into that point
- Auto hide the menus after timeout
- Status icons that indicate when a PDF is loading and for when line thickness is updated
- A troubleshooting guide for when the calibration grid doesn't match the mat grid

### Changed

- Always show stitch menu button regardless of the number of pages in the PDF
- Menus are translucent to see pattern through them
- Stitch menu icon moved to the left (above the layer menu)
- Stitch menu wraps on smaller devices
- Disabled rendering of PDF links
- A single page PDF is centered on load
- Larger custom PDF viewer messages
- Different button colors for subdomains: blue for beta, purple for main, and black/gray for old
- Switched from Vercel Analytics to Google Analytics

### Fixed

- Close overlay options menu on click outside
- Warning no longer flashes when dragging on Android, Chromebook, and in Firefox
- Full screen icon enter/exit swapped to be correct versions
- Calibration is saved on keyboard input (not just mouse click)
- Calibration corners no longer stick to cursor on mouse up
- Saving stitched PDF respects multiple copies of the same page (e.g. multiple empty pages)

### Removed

- Hide and show main nav (replaced by auto hide)

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
[1.3.0]: https://github.com/Pattern-Projector/pattern-projector/releases/tag/v1.3.0
[1.2.1]: https://github.com/Pattern-Projector/pattern-projector/releases/tag/v1.2.1
[1.2.0]: https://github.com/Pattern-Projector/pattern-projector/releases/tag/v1.2.0
[1.1.3]: https://github.com/Pattern-Projector/pattern-projector/releases/tag/v1.1.3
[1.1.2]: https://github.com/Pattern-Projector/pattern-projector/releases/tag/v1.1.2
[1.1.1]: https://github.com/Pattern-Projector/pattern-projector/releases/tag/v1.1.1
[1.1.0]: https://github.com/Pattern-Projector/pattern-projector/releases/tag/v1.1.0
[1.0.2]: https://github.com/Pattern-Projector/pattern-projector/releases/tag/v1.0.2
[1.0.1]: https://github.com/Pattern-Projector/pattern-projector/releases/tag/v1.0.1
[1.0.0]: https://github.com/Pattern-Projector/pattern-projector/releases/tag/v1.0.0
