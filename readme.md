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

Semantic versioning -
Each release should be versioned in Github. THese releases will be marked as 'pre-release' until the version is launched on the Zendesk app store.

DevMaster branch -
This branch enables testing with the ZAT client.  The only difference between this and master is any dev specific configuration so examples include the 'private' property in manifest.json and secure properties in Transifex api calls.


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
For example turning on HTML formatting feature: '["tx-resource-html"]'.  

A list of features:
tx-resource-html - Enables the Sync app to save Transifex Resources as HTML instead of JSON
