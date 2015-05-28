var assert = require('assert');
var sinon = require('sinon');
_ = require("underscore");
var util = require('util');
var fs = require('fs');
var tv4 = require('tv4');
var hdbs = require('handlebars');
var spahql = require('spahql');
var myApp = require('../zendesk-app/app').txApp;
var myUtil = require('../zendesk-app/lib/util');
var myZdArticles = require('../zendesk-app/lib/zdArticles');
zdArticles = require('../zendesk-app/lib/zdArticles');
txProject = require('../zendesk-app/lib/txProject');
var myZdTranslations = require('../zendesk-app/lib/zdTranslations');

/*global describe:true*/
/*global it:true*/
/*global before:true*/
/*global after:true*/
/*global sinon:true*/

/*jshint esnext: true */



describe('Test Tx Zendesk App', function() {

    var mockTxLoginResponse = [{
            username: "mjjacko",
            token: "1234567890"
        },
        /* ... */
    ];

    const PATHS = {
        TRANSLATION_EN_JSON: './zendesk-app/translations/en.json',
        MANIFEST_JSON: './zendesk-app/manifest.json',
        MAINPAGE_HDBS: './zendesk-app/templates/mainPage.hdbs',
        TRANSLATION_SCHEMA: './test/schemas/translations.json',
        ZD_ARTICLES_JSON: './test/data/articles.json',
        ZD_TRANSLATIONS_JSON: './test/data/zdTranslations.json',
        ZD_ARTICLE_BODY_JSON: './test/data/articleBody.json',
        TX_RESOURCE_STATS_JSON: './test/data/resourceStats.json',
        TX_RESOURCE_RESPONSE_JSON: './test/data/txResource.json',
        TX_PROJECT_JSON: './test/data/txProject.json'
    };

    before(function() {
        // Display app object for debug
        //       console.log("CONSOLELOG:"+process.cwd());
        //       console.log(util.inspect(myApp, {showHidden: false, depth: null}));
        // Test Setup
    });

    function loadArticlesData() {
        var myStringArticles = fs.readFileSync(PATHS.ZD_ARTICLES_JSON, 'utf8');
        return JSON.parse(myStringArticles);
    }

    function loadTranslationsData() {
        var myStringTranslations = fs.readFileSync(PATHS.ZD_TRANSLATIONS_JSON, 'utf8');
        return JSON.parse(myStringTranslations);
    }

    function loadTxProjectData() {
        var myStringFile = fs.readFileSync(PATHS.TX_PROJECT_JSON, 'utf8');
        return JSON.parse(myStringFile);
    }

    describe("getting tx project", function() {
        var myProject = loadTxProjectData();

        it("check resources", function() {
            var goodResources = ['articles-205686967','articles-205686968','articles-205686969'];
            var myResources = txProject.getResourceArray(myProject);
            assert(_.isEqual(goodResources,myResources));
        });

        it("check source locale", function() {
            assert('en' == txProject.getSourceLocale(myProject));
        });

        it("check locales", function() {
            var goodLocales = ['fr_BE'];
            assert(_.isEqual(goodLocales, txProject.getLocales(myProject)));
        });
    });


    it("check getting objects from tx responses", function() {
        var goodResource = {
            name: 'Cette section est uniquement visible par vos agents secrets',
            title: 'Cette section est uniquement visible par vos agents secrets',
            body: '<p>Si vous pouvez le voir, vous devez être un agent ou un gestionnaire de centre d\'aide. Utilisateurs finaux ne le voient pas. Une restriction a été placée sur la section alors que seulement des agents peuvent le voir. Pour savoir comment c\'est fait, voir la <a href=\'https://support.zendesk.com/entries/23394096#topic_fyv_bsm_kk\'> marche à vue accès au contenu</a>.</p> <p>Ce genre de restriction crée un espace privé dans le centre d\'aide juste pour les agents. Il permet de fournir des agents les documents internes dont ils ont besoin pour faire leur travail.</p>'
        };
        var myStringResource = fs.readFileSync(PATHS.TX_RESOURCE_RESPONSE_JSON, 'utf8');
        assert(typeof myStringResource !== "undefined", "Check for valid resource test data");
        var myResource = JSON.parse(myStringResource);
        var myObject = myUtil.txGetContentObject(myResource);

        assert(_.isEqual(myObject, goodResource));
    });

    it("check getting zd translation object from tx response object", function() {
        var txStrings = {
            name: 'Cette section est uniquement visible par vos agents secrets',
            title: 'Cette section est uniquement visible par vos agents secrets',
            body: '<p>Si vous pouvez le voir, vous devez être un agent ou un gestionnaire de centre d\'aide. Utilisateurs finaux ne le voient pas. Une restriction a été placée sur la section alors que seulement des agents peuvent le voir. Pour savoir comment c\'est fait, voir la <a href=\'https://support.zendesk.com/entries/23394096#topic_fyv_bsm_kk\'> marche à vue accès au contenu</a>.</p> <p>Ce genre de restriction crée un espace privé dans le centre d\'aide juste pour les agents. Il permet de fournir des agents les documents internes dont ils ont besoin pour faire leur travail.</p>'
        };
        var txContent = {
            content: JSON.stringify(txStrings)
        };
        var goodZdTranslationObject = {
            "translation": {
                "locale": "fr",
                "name": "Cette section est uniquement visible par vos agents secrets",
                "title": "Cette section est uniquement visible par vos agents secrets",
                "body": "<p>Si vous pouvez le voir, vous devez être un agent ou un gestionnaire de centre d'aide. Utilisateurs finaux ne le voient pas. Une restriction a été placée sur la section alors que seulement des agents peuvent le voir. Pour savoir comment c'est fait, voir la <a href='https://support.zendesk.com/entries/23394096#topic_fyv_bsm_kk'> marche à vue accès au contenu</a>.</p> <p>Ce genre de restriction crée un espace privé dans le centre d'aide juste pour les agents. Il permet de fournir des agents les documents internes dont ils ont besoin pour faire leur travail.</p>"
            }
        };

        var myZdTranslation = myUtil.zdGetTranslationObject(txContent, "fr");


        assert(_.isEqual(myZdTranslation, goodZdTranslationObject));

    });

    it("completed translations from tx resource stats", function() {
        var goodList = ['fr', 'en'];
        var myStringStats = fs.readFileSync(PATHS.TX_RESOURCE_STATS_JSON, 'utf8');
        assert(typeof myStringStats !== "undefined", "Check for valid stats test data");
        var myStats = JSON.parse(myStringStats);

        var completedLanguageList = myUtil.txGetCompletedTranslations(myStats);
        assert(_.isEqual(completedLanguageList, goodList));

    });


    it("get source locale from tx resource", function() {
        var myStringResource = fs.readFileSync(PATHS.TX_RESOURCE_RESPONSE_JSON, 'utf8');
        assert(typeof myStringResource !== "undefined", "Check for valid resource test data");
        var myResource = JSON.parse(myStringResource);
    });


    it("check locale conversion from Transifex to Zendesk", function(){
        var txLocale = 'fr_BE';
        var result = 'fr-be';
        assert(myUtil.txLocaletoZd(txLocale) === result);
    });

    it("check if a locale is in a locale array", function() {
        var goodLocale = 'en';
        var badLocale = 'de';
        var myArray = ['fr', 'en'];
        assert(myUtil.isStringinArray(goodLocale,myArray));
        assert(!myUtil.isStringinArray(badLocale,myArray));
    });

    it("check zd get translation locale", function() {
        var myTranslations = loadTranslationsData();
        assert(typeof myTranslations !== "undefined", "Check for valid translation test data");
        var goodLocales = [ 'fr-be', 'fr', 'en-us' ];
        assert(_.isEqual(goodLocales,myZdTranslations.getLocale(myTranslations)));
    });

    it("create tx requests for articles", function() {


        var myArticles = loadArticlesData();
        var result = myUtil.txCreateArticleRequests(myArticles);

    });

    it("check zd article processing", function() {
        var goodList = [205686967, 205686977, 205686907, 205686917, 205686927, 205686937, 205686947, 205686957];

        var myArticles = loadArticlesData();
        assert(typeof myArticles !== "undefined", "Check for valid article test data");
        assert(_.isEqual(myZdArticles.getIdList(myArticles), goodList));
    });

    it("check zd get article name", function() {
        var myArticles = loadArticlesData();
        assert(typeof myArticles !== "undefined", "Check for valid article test data");
        assert("Welcome to your Help Center!" === myZdArticles.getName(205686907, myArticles));
    });

    it("check zd get article title", function() {
        var myArticles = loadArticlesData();
        assert(typeof myArticles !== "undefined", "Check for valid article test data");
        assert("Welcome to your Help Center!" === myZdArticles.getTitle(205686907, myArticles));
    });

    it("check zd get article body", function() {
        var myArticles = loadArticlesData();
        assert(typeof myArticles !== "undefined", "Check for valid article test data");
        var goodArticleBody = fs.readFileSync(PATHS.ZD_ARTICLE_BODY_JSON, 'utf8');
        assert(typeof goodArticleBody !== "undefined", "Check for valid article test data");
        var parsedGoodArticleBody = JSON.parse(goodArticleBody);
        assert(parsedGoodArticleBody.body === myZdArticles.getBody(205686907, myArticles));
    });

    it("check zd get article source locale", function() {
        var myArticles = loadArticlesData();
        assert(typeof myArticles !== "undefined", "Check for valid article test data");
        assert("en-us" === myZdArticles.getSourceLocale(205686907, myArticles));
    });

    it("check zd get article locale", function() {
        var myArticles = loadArticlesData();
        assert(typeof myArticles !== "undefined", "Check for valid article test data");
        assert("en-us" === myZdArticles.getLocale(205686907, myArticles));
    });

    it("check tx createResourceName", function() {
        var goodType = "articles";
        var goodId = 23242422442;
        var badType = "crackers";
        var badId = "crackers";
        var result = myUtil.createResourceName(goodId, goodType, "::");
        assert(result === "articles::23242422442");
        assert.throws(function() {
            myUtil.createResourceName(badId, goodType, "::")
        }, "util.createResourceName:InvalidParameter");
        assert.throws(function() {
            myUtil.createResourceName(goodId, badType, "::")
        }, "util.createResourceName:InvalidParameter");
    });

    it("check tx validTxSlugFormat", function() {
        var goodSlug = "this-is_a-Good_one";
        var badSlug = "bad-chars:!@#$)(*&^$";
        assert(myUtil.validTxSlugFormat(goodSlug));
        assert.equal(false, myUtil.validTxSlugFormat(badSlug));
    });

    it("check zdUtil.validZdObject", function() {
        var goodType = "articles";
        var badType = "crackers";
        assert(myUtil.validZdObject(goodType));
        assert.equal(false, myUtil.validZdObject(badType));
    });

    it("check zdUtil.validZdIdFormat", function() {
        var goodId1 = 2322;
        var goodId2 = "34334343";
        var badId2 = "crackers";
        assert(myUtil.validZdIdFormat(goodId1));
        assert(myUtil.validZdIdFormat(goodId2));
        assert.equal(false, myUtil.validZdIdFormat(badId2));
    });

    it("check txUtil.replaceWithObject", function() {
        //Define string
        var string = "teststring";
        var object = {
            string
        };
        var replaceMe = "Thisisaratherlong%%string%%windedexample";
        assert(myUtil.replaceWithObject(replaceMe, '%%', object) === "Thisisaratherlongteststringwindedexample");

    });

    it("validate translation file format", function() {
        var myEnJson = JSON.parse(fs.readFileSync(PATHS.TRANSLATION_EN_JSON, 'utf8'));
        assert(typeof myEnJson !== "undefined", "Check for valid en.json");

        var myTranslationSchema = JSON.parse(fs.readFileSync(PATHS.TRANSLATION_SCHEMA, 'utf8'));
        assert(typeof myTranslationSchema !== "undefined", "Check for valid translation schema def");

        if (tv4.validate(myEnJson, myTranslationSchema, true, true)) {
            assert(true);
        } else {
            assert(false, tv4.error + tv4.error.dataPath);
        }


    });


    //Using http://danski.github.io/spahql/ to search for nodes in Json Handlebars AST
    it("check translations for template", function() {
        var myMainPageName = "mainPage";
        var myMainPage = hdbs.parse(fs.readFileSync(PATHS.MAINPAGE_HDBS, 'utf8'));

        var myMainPageDb = spahql.db(myMainPage);
        var types = myMainPageDb.select("//params/*[/type == 'StringLiteral']/value");
        var resultValues1 = types.values();

        var myEnJson = JSON.parse(fs.readFileSync(PATHS.TRANSLATION_EN_JSON, 'utf8'));
        assert(typeof myEnJson !== "undefined", "Check for valid en.json");
        var myEnJsonDb = spahql.db(myEnJson);
        var keys = myEnJsonDb.select("/mainPage/*");
        var resultValues2 = keys.paths();
        resultValues2.forEach(function(element, index, array) {
            array[index] = element.substring(1).replace("/", ".");
        });

        var is_same = (resultValues1.length == resultValues2.length) &&
            resultValues1.every(
                function(element, index) {
                    
                    return element === resultValues2[index];
                });
        assert(is_same, "Check all template keys exist in translations");
    });

    it("check app functions exist", function() {

        // Predefined ZD objects
        assert((typeof myApp.requests !== "undefined"),"Check for requests");
        assert((typeof myApp.events !== "undefined"), "Check for events");

        // Predefined ZD hooks
        //       assert((typeof myApp.events['app.activated'] !== "undefined"),"Check for app.activated");
        //assert((typeof myApp.events['pane.activated'] !== "undefined"), "Check for pane.activated");

        // TxApp custom functions
        //        assert((typeof myApp.init !== "undefined"),"Check for init");
        //   assert((typeof myApp.showTxAppSettings !== "undefined"), "Check for showTxAppSettings");

    });

    it("check for valid translation file", function() {
        var myEnJson = JSON.parse(fs.readFileSync(PATHS.TRANSLATION_EN_JSON, 'utf8'));
        assert(typeof myEnJson !== "undefined", "Check for valid en.json");
    });

    it("check getDomainFromUrl returns xxx.xxx.xxx", function() {
        var myDomain = "http://txtest.zendesk.com?q=something";
        var expectResult = "txtest.zendesk.com";
        var myResult = myUtil.getDomainFromUrl(myDomain);

        assert(expectResult === myResult);
    });

    it("check manifest parameters", function() {
        var myManifestJson = JSON.parse(fs.readFileSync(PATHS.MANIFEST_JSON, 'utf8'));
        assert(typeof myManifestJson !== "undefined", "Check for valid manifest.json");
        var myParameters = myManifestJson.parameters;
        var myParametersLength = myParameters.length;
        for (var i = 0; i < myParametersLength; i++) {
            assert(myParameters[i].type = "text", "Check type for " + myParameters[i].name);
            assert(myParameters[i].required, "Check required for " + myParameters[i].name);
        }
    });

    it("check parameters in translations", function() {
        var myManifestJson = JSON.parse(fs.readFileSync(PATHS.MANIFEST_JSON, 'utf8'));
        assert(typeof myManifestJson !== "undefined", "Check for valid manifest.json");
        var myParameters = myManifestJson.parameters;
        var myParametersLength = myParameters.length;
        var existTranslation = false;
        for (var i = 0; i < myParametersLength; i++) {
            var myEnJson = JSON.parse(fs.readFileSync(PATHS.TRANSLATION_EN_JSON, 'utf8'));
            assert(typeof myEnJson !== "undefined", "Check for valid en.json");

            var myTranslations = myEnJson.app.parameters;
            existTranslation = false;
            Object.keys(myTranslations).forEach(function(key) {
                if (key === myParameters[i].name) {
                    existTranslation = true;
                }
            });

            assert(existTranslation, "Check translation for key " + myParameters[i].name);
        }

    });

    it("one simple truth", function() {
        var one = 1;
        one.should.equal(1);
    });

    after(function() {
        // Test Teardown
    });
});