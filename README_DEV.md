# Setting up a local development environment

- Install Node.JS and git, either through your favorite package manager or by downloading them from nodejs.org and
  git-scm.com respectively. Make sure to have the installers add the installation directories to your PATH.
- Make a directory to download the source somewhere and open a command prompt there .
- Get the Pattern Projector source code with git:

    git clone https://github.com/Pattern-Projector/pattern-projector.git .

- Install all packages required for Pattern Projector:

    npm install

- Start development webserver:

    npm run dev

This will start a webserver on localhost:3000 . If you edit any files, the development website on localhost will
automatically reload.

# Doing translations

- Set up the development environment as described above.
- Look inside the 'messages' directory for translations per language. Edit or add a new one as required.

