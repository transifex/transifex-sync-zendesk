[![Build Status](https://travis-ci.org/transifex/transifex-sync-zendesk.svg)](https://travis-ci.org/transifex/transifex-sync-zendesk)

Tx-Sync JavaScript Application for Zendesk
==================

## Overview
This project integrates the Transifex API with an interactive plugin application via EmberJS.  It will build a Transifex resource for each supported object in Zendesk.  The name will be <object type>-<Zendesk id>, for example 'articles-123456'.
Currently supported objects:
Help Center
- Articles
- Sections
- Categories


## Releasing

The release process for this application follows the following procedure. PRs->Devel (branch)->Master (branch)->Release (master tag)->Zendesk App Store (final artifact).
A different set of automation processes applies to each step.
- PRs and Devel: Mocha unit tests,jshint and csslint run in Nodejs
- Master: Webpack build app into a single directory
- Release: Final build using ZAT tool

Code will be versioned in devel but will be marked as 'pre-release' until it is launched on the Zendesk app store (note this might mean that some versions never get final versions).


## Project Directory Structure
```
├── assets             // marketing images
├── bin
│   └── repl.js        // interactive cli commands
├── dist               // final app built by webpack 
│   
├── lib                // app modules
├── makefile           // handy CLI commands (legacy)
├── package.json       // webpack and testing deps
├── readme.md          // this file
├── src                // main app files
│   ├── app.css
│   ├── app.js
│   └── manifest.json
├── templates          // handlebars views
├── test
│   ├── data           // Json unit test data files
│   ├── testApp.js     // main unittests
├── translations
│   └── en.json        // i18n for zendesk app
└── webpack.config.js  // webpack config
```
    
## Running the code (Legacy)

Note: I am moving away from maintaining a separate makefile, and instead using an interactive repl

Note all make commands should be run from 'root'.
Be sure you Download and install 'zat' tool

Make deploy package:
```bash
make package
```

To run tests:
```bash
make test
```

To sideload:
```bash
make run
```

## Dependencies

The dependencies loaded in package.json are to allow unit testing of the code in NodeJs.
The application uses a separate set of dependencies loaded in app.js.  The ones currently used are:
- JQuery Ajax object
- Underscore
- Settings
- Local Storage

## Views

Currently the app consists of 4 pages:
- sync_page.hdbs - This is the primary page for user interaction
- layout.hdbs - This has global tags for the app, it's part of the Zd framework
- loading_page.hdbs - This is a spinner page that displays during syncing
- error_page.hdbs - This page is displayed when app or ajax errors occur

## Feature Toggle - For planned future enhancement

For backward compatibility there is a feature switch specified in the configuration. Feature switches are a JSON array of key names.  Because of the limited types available in manifest.json...they are specified as a JSON string.
For example turning on HTML formatting feature: ```'["tx-resource-html"]'```

A list of features:
- tx-resource-html - Enables the app to save Transifex resources as HTML instead of JSON
