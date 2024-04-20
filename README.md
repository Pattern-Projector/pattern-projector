# Welcome to Pattern Projector!

Pattern projector is a free and open source web app that helps users quickly calibrate projectors for sewing patterns. This project is currently in beta, so expect large changes and new features to be added as we iterate.

## What You’ll Need

- Projector: at least 720p recommended
- Cutting mat: ideally with grid lines at every inch
- Tripod or wall/shelf/table mount for projector
- Computer or tablet to connect to the projector
- A PDF sewing pattern

## Setup

Place the projector above the cutting mat, pointing at the cutting mat. Try to place the projector directly above the cutting mat and pointing directly at it.

Connect your computer or tablet to the projector and either mirror or extend the display.

Adjust the focus on the projector, until text is crisp in the centre of the projection. If you cannot get a clear image, ensure the distance between the projector and cutting mat is within the functional range recommended by the manufacturer.

If your projector has a keystone, adjust it so that projection is close to rectangular and focus near the edges improves.

## Calibration

Open “Calibration”.

Enter the width and height of your mat into the page.

Enter fullscreen mode by clicking (or tapping) “Fullscreen”

Drag the corners of the grid to align with your mat. With your eyes on the mat, adjust the corners on the tablet or computer.
Adjust the placement of the corners until the projected grid matches your mat’s grid.

When the projected grid is aligned with your mat, click (or tap) “Project Pattern”

## Projecting a Pattern

Click (or tap) “Open File” to load the PDF document.

Cut along the projected design.

In projection mode there are several tools provided:

- Drag to move: Move the PDF by dragging it around the screen.

- Invert Colours: When projecting, it’s usually easier to see white lines on black. Click “invert” to invert the colours.

- Flip Vertical/Horizontal: helpful to unwrap fold lines in patterns

- Rotate: to change the orientation of the pattern

- Fullscreen: It’s generally easier to use the software in fullscreen mode, tap or click “Fullscreen”

## Setup up a local development environment

- Install Node.JS and git, either through your favorite package manager or by downloading them from nodejs.org and
  git-scm.com respectively. Make sure to have the installers add the installation directories to your PATH.
- Make a directory to download the source somewhere and open a command prompt there.
- Install yarn:

  npm install --global yarn

- Get the Pattern Projector source code with git:

  git clone https://github.com/Pattern-Projector/pattern-projector.git .

- Install all packages required for Pattern Projector:

  yarn

- Start development webserver:

  yarn dev

This will start a webserver on localhost:3000 . If you edit any files, the development website on localhost will
automatically reload.

### Workflow for contributions

If you want to help out, you can either look through to issue database to find bugs or features to work on, or open your
own issue to propose an improvement or feature.

Once you know what to program, log in to Github and create a fork of the project. Clone your fork locally like you did
in the description for getting your local development environment up and running.

Make a local git branch to work in:

    git checkout -b your-branch-name

Make your changes on this branch, then do

    git commit <all files you changed>
    git push

Then go to Github and create pull request (PR) from your branch.

Before creating a (PR), make sure to do

    yarn build

on your local machine to check that building the app still works.

Your PR will be picked up and reviewed before being merged into Pattern Projector proper.

### Doing translations

- Set up the development environment as described above.
- Look inside the 'messages' directory for translations per language. Edit or add a new one as required.

### FAQ

Annotation Support: planned for upcoming release.
Chromecast/Miracast: While it’s possible to cast this webpage, the lag in the connection can be frustrating, especially when calibrating.
Phones: While possible to visit and use the webpage on a Phone, the limited screen size makes it difficult to use.

## Translations

Pattern Projector uses [Weblate](https://hosted.weblate.org/projects/pattern-projector/pattern-projector/) for translations. It's currently available in English, Dutch, German, and Danish.

Feedback, code contributions, translations, and feature requests are welcome.
