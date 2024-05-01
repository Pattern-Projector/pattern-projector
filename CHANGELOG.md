# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Warning instead of redirect when window location or size is different when projecting versus calibrating
- Line weight adjustment is a dropdown instead of input box

### Fixed

- Menus flickering with large PDFs
- Horizontal and vertical offsets in stitch menu are reset when a new PDF is opened

### Removed

- Shift to lock axis when dragging PDF (use arrow keys to move instead)

### Added

- Tool to align grain to horizontal
- Full screen button to projection page
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
[1.0.1]: https://github.com/Pattern-Projector/pattern-projector/releases/tag/v1.0.1
[1.0.0]: https://github.com/Pattern-Projector/pattern-projector/releases/tag/v1.0.0
