Yadda - Webdriver Integration Testing
====================

Boilerplate project to run WebdriverIO tests with Cucumber syntax forked from [cucumber-boilerplate](https://github.com/webdriverio/cucumber-boilerplate). It is based on a framework called [yadda](https://github.com/acuminous/yadda).

# How to run the test

[install required packages]

```sh
npm install
```

[install selenium-standalone]
```sh
npm install -g selenium-standalone
selenium-standalone install
```

[start selenium]

```sh
selenium-standalone start
```

To run your tests just call the testFeature.js file:

```sh
$ ./testFeature.js --feature=<name of the feature>
```

# List of predefined steps

Check out all predefined snippets. You can see how they get used in [`sampleSnippets.feature`](https://github.com/webdriverio/cucumber-boilerplate/blob/master/test/features/sampleSnippets.feature).

## Given steps

- `/I open the (url|site) "$string"` <br>Open a site in the current browser window/tab
- `the element "$string" is( not)* visible` <br>Check the (in)visibility of a element
- `the element "$string" is( not)* enabled` <br>Check if a element is (not) enabled
- `the element "$string" is( not)* selected` <br>Check if a element is (not) selected
- `the checkbox "$string" is( not)* checked` <br>Check if a checkbox is (not) checked
- `there is (an|no) element "$string" on the page` <br>Check if a element (does not) exist
- `the title is( not)* "$string"` <br>Check the title of the current browser window/tab
- `the element "$string" contains( not)* the same text as element "$string"` <br>Compaire the text of two elements
- `the (element|inputfield) "$string" does( not)* contain the text "$string"` <br>Check if a element contains the given text
- `the (element|inputfield) "$string" does( not)* contain any text` <br>Check if a element does not contain any text
- `the page url is( not)* "$string"` <br>Check the url of the current browser window/tab
- `the( css)* attribute "$string" from element "$string" is( not)* "$string"` <br>Check the value of a element's (css) attribute
- `the cookie "$string" contains( not)* the value "$string"` <br>Check the value of a cookie
- `the cookie "$string" does( not)* exist` <br>Check the existence of a cookie
- `the element "$string" is( not)* ([\d]+)px (broad|tall)` <br>Check the width/height of a element
- `the element "$string" is( not)* positioned at ([\d]+)px on the (x|y) axis` <br>Check the position of a element
- `I have a screen that is ([\d]+) by ([\d]+) pixels` <br>Set the browser size to a given size
- `I have closed all but the first (window|tab)` <br>Close all but the first browser window/tab
- `a (alertbox|confirmbox|prompt) is( not)* opened` <br>Check if a modal is opened

## Then steps

- `I expect that the title is( not)* "$string"` <br>Check the title of the current browser window/tab
- `I expect that element "$string" is( not)* visible` <br>Check if a certain element is visible
- `I expect that element "$string" becomes( not)* visible` <br>Check if a certain element becomes visible
- `I expect that element "$string" is( not)* within the viewport` <br>Check if a certain element is within the current viewport
- `I expect that element "$string" does( not)* exist` <br>Check if a certain element exists
- `I expect that element "$string" does( not)* contain the same text as element "$string"` <br>Compaire the text of two elements
- `I expect that (element|inputfield) "$string"( not)* contains the text "$string"` <br>Check if a element or input field contains the given text
- `I expect that (element|inputfield) "$string" does( not)* contain any text` <br>Check if a element or input field contains any text
- `I expect that (element|inputfield) "$string" is( not)* empty` <br>Check if a element or input field is empty
- `I expect that the url is( not)* "$string"` <br>Check if the the url of the current browser window/tab is a certain string
- `I expect that the path is( not)* "$string"` <br>Check if the path of the url of the current browser window/tab is a certain string
- `I expect the url to( not)* contain "$string"` <br>Check if the url of the current browser window/tab contains a certain string
- `I expect that the( css)* attribute "$string" from element "$string" is( not)* "$string"` <br>Check the value of a element's (css) attribute
- `I expect that checkbox "$string" is( not)* checked` <br>Check if a checkbox is (not) checked
- `I expect that element "$string" is( not)* selected` <br>Check if a element is (not) selected
- `I expect that element "$string" is( not)* enabled` <br>Check if a element is (not) enabled
- `I expect that cookie "$string"( not)* contains "$string"` <br>Check if a cookie with a certain name contains a certain value
- `I expect that cookie "$string"( not)* exists` <br>Check if a cookie with a certain name exist
- `I expect that element "$string" is( not)* ([\d]+)px (broad|tall)` <br>Check the width/height of an element
- `I expect that element "$string" is( not)* positioned at ([\d]+)px on the (x|y) axis` <br>Check the position of an element
- `I expect that element "$string" (has|does not have) the class "$string"` <br>Check if a element has a certain class
- `I expect a new (window|tab) has( not)* been opened` <br>Check if a new window/tab has been opened
- `I expect the url "$string" is opened in a new (tab|window)` <br>Check if a url is opened in a new browser window/tab
- `I expect that element "$string" is( not)* focused` <br>Check if a element has the focus
- `I wait on element "$string"( for (\d+)ms)*( to( not)* (be checked|be enabled|be selected|be visible|contain a text|contain a value|exist))*` <br>Wait for a element to be checked, enabled, selected, visible, contain a certain value or text or to exist
- `I expect that a (alertbox|confirmbox|prompt) is( not)* opened` <br>Check if a modal is opened
- `I expect that a (alertbox|confirmbox|prompt)( not)* contains the text "$text"` <br>Check the text of a modal

## When steps

- `I (click|doubleclick) on the (link|button|element) "$string"` <br>(Double)click a link, button or element
- `I (add|set) "$string" to the inputfield "$string"` <br>Add or set the content of an input field
- `I clear the inputfield "$string"` <br>Clear an input field
- `I drag element "$string" to element "$string"` <br>Drag a element to another element
- `I submit the form "$string"` <br>Submit a form
- `I pause for (\d+)ms` <br>Pause for a certain number of milliseconds
- `I set a cookie "$string" with the content "$string"` <br>Set the content of a cookie with the given name to  the given string
- `I delete the cookie "$string"` <br>Delete the cookie with the given name
- `I press "$string"` <br>Press a given key. You’ll find all supported characters [here](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value). To do that, the value has to correspond to a key from the table.
- `I (accept|dismiss) the (alertbox|confirmbox|prompt)` <br>Accept or dismiss a modal window
- `I enter "$string" into the prompt` <br>Enter a given text into a modal prompt
- `I scroll to element "$string"` <br>Scroll to a given element
- `I close the last opened (window|tab)` <br>Close the last opened browser window/tab
- `I focus the last opened (window|tab)` <br>Focus the last opened browser window/tab
- `I log in to site with username "$string" and password "$string"` <br>Login to a site with the given username and password
- `I select the (\d+)(st|nd|rd|th) option for element "$string"` <br>Select a option based on it's index
- `I select the option with the (name|value|text) "$string" for element "$string"` <br>Select a option based on it's name, value or visible text
