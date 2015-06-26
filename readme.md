Tx-Sync JavaScript Application for Zendesk
==================

## Overview
This project integrates the Transifex API with an interactive plugin application via EmberJS.  It will build a Transifex resource for each supported object in Zendesk.  The name will be <object type>-<Zendesk id>, for example 'articles-123456'.
Currently supported objects:
Help Center
- Articles
- Sections
- Categories


Project Directory Structure (the interesting bits)
```
|
+- transifex-zendesk-app 
   |
   +- assets // basically images
   |
   +- lib // CommonJS Modules
   |
   +- templates // Handlebars UI
   |
   +- translations // locale specific json for the app
   |
   +- app.css // All CSS UI styles is here
   |
   +- app.js // Main app definition, includes all external endpoints
   |
   +- manifest.json // ZD Settings for the app

|
+- test
   |
   +- data // json files used to mock external calls
   |
   +- schemas // json files used to validate...er...well json files
   |
   +- testApp.js // main unit tests...needs refactoring

|
+- makefile // easy CLI targets - refactor to Grunt at some point
|
+- inputs.txt // Some default app settings used by make - not checked in
|
+- package.json // npm deps for tests
|
+- node_modules // not checked in created by npm
	|
	+- // symbolic links for libraries - TODO figure out a better approach
```
    
## Running the code

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

## Feature Switch

For backward compatibility there is a feature switch specified in the configuration.  This switch is a series of binary 'flags' which is represented by a hex number.  The current set of planned features are:

- digit 1 = Html parsing - https://github.com/transifex/transifex-sync-zendesk/issues/21
- digit 2 = Zendesk Ticket support - https://github.com/transifex/transifex-sync-zendesk/issues/22
- digit 3 = Locale sync - https://github.com/transifex/transifex-sync-zendesk/issues/23
- digit 4 = iFrame Transifex view - https://github.com/transifex/transifex-sync-zendesk/issues/24
