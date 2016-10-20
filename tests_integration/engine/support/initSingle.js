var Yadda = require('yadda'),
    chai = require('chai'),
    path = require('path'),
    glob = require('glob'),
    merge = require('deepmerge'),
    config = require('./configure'),
    beforeHook = require('../hooks/before.js'),
    afterHook = require('../hooks/after.js'),
    beforeEachHook = require('../hooks/beforeEach.js'),
    afterEachHook = require('../hooks/afterEach.js'),
    processed = 0,
    fileCount = null,
    context = {},
    runIsolateTestOnly = false;

/**
 * expose assertion library
 */
global.expect = chai.expect;
global.assert = chai.assert;
global.should = chai.should();

/**
 * register own global namespace
 */
global.testscope = {};

Yadda.plugins.mocha.StepLevelPlugin.init();
process.argv.slice(2).forEach(function (arg) {
    if (arg.split('=')[0] == '--feature') file = __dirname + '/../../features/' + arg.split('=')[1] + '.feature';
});

featureFile(
    file,
    function (feature) {
        if (feature.annotations.pending) {
            fileCount--;
        }

        before(function (done) {
            if (processed === 0) {
                return beforeHook.call(global.testscope, beforeEachHook.bind(global.testscope, done));
            }

            beforeEachHook.call(global.testscope, done);
        });

        scenarios(
            feature.scenarios,
            function (scenario) {
                var stepDefinitions = require('./step-definitions');
                var yadda = new Yadda.Yadda(stepDefinitions, context);

                steps(
                    scenario.steps,
                    function (step, done) {
                        var context = merge(global.testscope, config.env);

                        if (scenario.annotations.executedBy) {
                            context.browser = context.browser.select(scenario.annotations.executedBy);
                        }

                        yadda.run(step, context, done);
                    }
                );
            }
        );

        Yadda.EventBus.instance().on(
            Yadda.EventBus.ON_EXECUTE,
            function (event) {
                currentStep = event.data.step;
            }
        );

        after(function (done) {
            return afterEachHook.call(global.testscope, afterHook.bind(global.testscope, done));
        });

    }
);
