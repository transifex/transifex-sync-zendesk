[![Build Status](https://travis-ci.org/transifex/transifex-sync-zendesk.svg)](https://travis-ci.org/transifex/transifex-sync-zendesk)

Tx-Sync JavaScript Application for Zendesk
==================

## Overview
This project integrates the Transifex API with an interactive plugin
application via EmberJS.  It will build a Transifex resource for each supported
object in Zendesk.  The name will be `<object type>-<Zendesk id>`, for example
`articles-123456`. Currently supported objects:
- Help Center
- Articles
- Sections
- Categories


## Releasing

The release process for this application follows the following procedure.
`PRs->Devel (branch)->Master (branch)->Release (master tag)->Zendesk App Store`
(final artifact).
A different set of automation processes applies to each step.
- PRs and Devel: Mocha unit tests, jshint and csslint run in Nodejs
- Master: Webpack build app into a single directory
- Release: Final build using ZAT tool

Code will be versioned in devel but will be marked as `pre-release` until it is
launched on the Zendesk app store (note this might mean that some versions
never get final versions).


## Project Directory Structure
```
├── dist                  // The folder in which webpack packages the built version of your app
├── docs                  // FUTURE: Planning docs
├── inputs.txt            // Preconfigured settings for testing
├── src                   // Main app files
│   ├── assets            // Marketing images
│   │   └── ...
│   ├── javascripts
│   │   ├── transifex-api // Transifex REST API
│   │   ├── zendesk-api   // Zendesk REST API
│   │   └── ui            // UI specific functions for each view
│   ├── stylesheetsi      // Stylesheets, written in SASS
│   │   └── *.scss
│   └── templates         // Handlebars views
│       └── *.hdbs
├── test
│   ├── data              // JSON unit test data files
│   ├── runner.html       // Boilerplate for browser tests
│   ├── schemas           // JSON validators
│   ├── setup             // extra Mocha configuration
│   │   ├── browser       // Loads app dependencies in a browser friendly way
│   │   ├── node          // Loads app dependencies for node tests
│   │   └── setup         // Mocha sandbox, specifically mocks, stubs and spys
│   └── unit              // Unit tests
└─── translations
    └── en.json           // i18n for Zendesk app
```


## Running the code

Be sure you Download and install 'zat' tool by running:
```bash
gem install zendesk_apps_tools
```

To setup the dev environment:
```bash
make init
```

Build source:
```bash
make build
```

Sentry support:

If you want to enable Sentry (recommended) you need to define the `SENTRY_DSN` environment variable

```bash
SENTRY_DSN=https://some_hash@sentry.io/123 make build
```

Remove built files:
```bash
make clean
```

Make deploy package:
```bash
make package
```

To sideload:
```bash
make run
```

Quick load test config settings with `inputs.txt`:

When testing the app in sideload mode using `make run`, you will not have the
ability to use the Zendesk UI to mange the configuration settings.  Instead you
can create an `inputs.txt` file with these settings.  Here is an example:
```
username
pass (or API key)
https://www.transifex.com/test-organization-4/zendesk-test/
<zendesk_api_key>
{"html-tx-resource":false}
```

## Dependencies

Take a look at `lib/javascripts/external_assets.js` to see the CSS and Javascript
files that are loaded via HTTP and are not directly packed within the app.

## Views
- `sync_articles.hdbs` - This displays a list of raw article information
- `sync-project.hdbs` - This displays the Transifex project information
- `sync-resource` - This displays meta information about each Transifex
  resource
- `sync-resource-language` - This displays the content from each Transifex
  resource
- `sync_page.hdbs` - This is the primary page for managing Help Center
  articles/sections/categories
- `layout.hdbs` - This has global tags for the app, it's part of the Zd framework
- `loading_page.hdbs` - This is a spinner page that displays during syncing
- `error_page.hdbs` - This page is displayed when app or ajax errors occur

## Feature Toggle - For planned future enhancement

For backwards compatibility there is a feature switch specified in the
configuration. Feature switches are a JSON object of key names.  Because of the
limited types available in manifest.json...they are specified as a JSON string.
This uses the 'features' config set in the manifest as a `Text` field, so you
will need to specifiy as a JSON object (ie `{"html-tx-resource":false}`).

Example check for a feature flag inside of the app(notice 'this' refers to the
global app object):
```
console.log(this.featureConfig('html-tx-resource'));
```

A list of features:
- `html-tx-resource` - Enables the app to save Transifex resources as HTML
  instead of JSON.  Resources save this way will have a different resource name
  in Transifex (ie `HTML-article-123456` instead of `article-123456`).
