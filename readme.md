Tx-Sync JavaScript Application for Zendesk
==================

## Overview
This project integrates the Transifex API with an interactive plugin application via EmberJS.  It will build a Transifex resource for each supported object in Zendesk.  The name will be <object type>-<Zendesk id>, for example 'articles-123456'.
Currently supported objects:
Help Center
- Articles

The project UI has a main activity log screen which can be accessed via the left side navbar.  But additionally there are sync integrations with the following objects:
- Articles

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
   +- testBacon.js // dummy tests to make sure env is loaded ok
|
+- makefile // easy CLI targets - refactor to Grunt at some point
|
+- inputs.txt // Some default app settings used by make
|
+- package.json // npm deps for tests
|
+- node_modules // not checked in created by npm
	|
	+- zdArticles.js // need symbolic link here so node can import - TODO figure out a better approach
|
+- txLiveParser.js // WIP progress...kept outside of app for now
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

The dependencies loaded in package.json are to allow unit testing of the code in NodeJs.  They are not needed to run the application.
Once loaded inside of Zendesk, dependencies 'leak' into the app.  The ones currently used are:
- JQuery Ajax object
- Underscore
- Settings
- Local Storage

NEED TO FIND A GOOD WAY OF SPECIFYING THIS IN CODE

## A final note, a bit about UI integrations
The only UI 'page' for this integration is the sync-page.  The sync page is a button and a message log.  Actual control of the sync is specified via settings.  This is the 'base' implementations.  Additional UI integrations can be enabled by adding interaction buttons...but these are tightly coupled to ZD UI and can be turned on and off via settings as well.