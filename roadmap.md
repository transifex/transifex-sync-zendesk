Tx-Sync JavaScript Application Roadmap
==================

## Overview
Initially the Tx-Sync Javascript application was concieved to work with Zendesk only.  However the core approach *should* be applicable to any help desk system.  It is likely that that each Help Desk system has similar abstractions around their 'articles' and these can be accessed via an API.

Additionally, there appears to be a trend by many Help Desk SaaS providers to allow a more generic 'pluggable' UI framework, usually involving iFrames.  The existing 'minimalist' handlebar templates easily fit this model and would just need to be 'hosted' (note since the current solution is client-based, this could simply be a CDN).

## Architecture Specifics
The basic approach to the app can be broken down as follows:

- **Transifex APIs and abstraction libraries**

This code will be consistent across all Help Desk solutions.  In the current codebase, the APIs are defined inside of the central app.  These need to be refactorted to the type specific libraries (ie those starting with a 'tx').

- **The help desk APIs and abstraction libraries**

Currently these components are all specific to Zendesk.  Similar to the Transifex APIs, they need to be moved to the specific libraries (ie those starting with a 'zd').  But we might also consider a higher-level abstraction that would allow these components to be 'pluggable'.

- **UI and Sync logic**

The last component of the app is the main UI and 'sync' logic.  This part of the codebase is the main app logic.  It's important that the interface be consistent across all services in order to be easily maintainable and supportable.  Additionally it will need to be compatible with the UI integration provided by the help desk provider.  By keeping the UI complexity low and using handlebar templates with a basic jQuery action framework it should be easily compatible with widget/iFrame/HTML canvas type of integrations.

## Technical Details
In order to support building this type of master 'app' from a single codebase, there are a few key pieces of technology that need to be in place.

- webpack: We have added a webpack step to the build process before any custom packaging utilities.  This gives us the flexibility to build the app however is needed to support the integration.  I expect each provider will have a different webpack configuration.

- promises:  The currently app is asyncronous which is good, but in a callback hell way which is bad.  Promises are essential for managing API calls and being able to give the user more options for failure recovery.

- ES2015: This is critcal in reducing dependencies and enables supporting the rest of the stack.

- Simple UI: For this to work in many places, it's important that the UI be conceptually simple (also this seems to work well based on customer feedback) and not have many dependencies.  Right now the UI uses handlebars, but we might move to something even simpler.  Having some type of asyncronous action framework is still a *must* but this can be satisfied by jQuery for the forseeable future.

## Reference Informnation

This roadmap is based on development information from a number of sources:

- Zendesk[https://developer.zendesk.com/apps/docs/agent/introduction](https://developer.zendesk.com/apps/docs/agent/introduction)
- Desk.com [http://dev.desk.com/guides/](http://dev.desk.com/guides/)
- Freshdesk [https://support.freshdesk.com/support/solutions/120519](https://support.freshdesk.com/support/solutions/120519)
