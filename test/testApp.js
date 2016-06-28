// npm included dependencies
var assert = require('assert');
var sinon = require('sinon');
_ = require("underscore");
var util = require('util');
var fs = require('fs');
var tv4 = require('tv4');
var hdbs = require('handlebars');
var spahql = require('spahql');

// application included dependencies
var myApp = require('../src/app.js').txApp;
var myUtil = require('../lib/syncUtil.js');
var syncUtil = require('../lib/syncUtil.js');
var myZdArticles = require('../lib/zdArticles.js');
zdArticles = require('../lib/zdArticles.js');
zdSections = require('../lib/zdSections.js');
zdCategories = require('../lib/zdCategories.js');
txProject = require('../lib/txProject.js');
var myZdTranslations = require('../lib/zdTranslations.js');

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
        TRANSLATION_EN_JSON: './translations/en.json',
        MANIFEST_JSON: './src/manifest.json',
        SYNCPAGE_HDBS: './templates/sync_page.hdbs',
        TRANSLATION_SCHEMA: './test/schemas/translations.json',
        ZD_ARTICLE_JSON: './test/data/article.json',
        ZD_SECTION_JSON: './test/data/zdSection.json',
        ZD_CATEGORY_JSON: './test/data/zdCategory.json',
        ZD_ARTICLES_JSON: './test/data/articles.json',
        ZD_ARTICLES_TRANSLATIONS_JSON: './test/data/articlesTranslations.json',
        ZD_SECTIONS_JSON: './test/data/zdSections.json',
        ZD_CATEGORIES_JSON: './test/data/zdCategories.json',
        ZD_TRANSLATIONS_JSON: './test/data/zdTranslations.json',
        ZD_ARTICLE_BODY_JSON: './test/data/articleBody.json',
        TX_RESOURCE_STATS_JSON: './test/data/resourceStats.json',
        TX_RESOURCE_RESPONSE_JSON: './test/data/txResource.json',
        TX_PROJECT_JSON: './test/data/txProject.json',
        TX_REQUEST_SINGLE: './test/data/txRequest.json',
        TX_REQUEST_SECTION: './test/data/txRequestSection.json',
        TX_REQUEST_CATEGORY: './test/data/txRequestCategory.json',
        TX_REQUEST_ARRAY: './test/data/txRequestArray.json',

        ARTICLE_ARRAY_JSON: './test/data/syncArticleArray.json',
        SECTION_ARRAY_JSON: './test/data/syncSectionArray.json',
        CATEGORY_ARRAY_JSON: './test/data/syncCategoryArray.json',

        PAGE_SYNC_JSON: './test/data/syncPageDataSet.json',
        PAGE_SYNC_SECTION_JSON: './test/data/syncPageSectionData.json',
        PAGE_SYNC_CATEGORY_JSON: './test/data/syncPageCategoryData.json'
    };

    before(function() {
        // Display app object for debug
        //       console.log("CONSOLELOG:"+process.cwd());
        //       console.log(util.inspect(myApp, {showHidden: false, depth: null}));
        // Test Setup
    });

    function loadTxRequestSingle() {
        var myStringArticle = fs.readFileSync(PATHS.TX_REQUEST_SINGLE, 'utf8');
        return JSON.parse(myStringArticle);
    }

    function loadTxRequestSection() {
        var myStringArticle = fs.readFileSync(PATHS.TX_REQUEST_SECTION, 'utf8');
        return JSON.parse(myStringArticle);
    }

    function loadTxRequestCategory() {
        var myStringArticle = fs.readFileSync(PATHS.TX_REQUEST_CATEGORY, 'utf8');
        return JSON.parse(myStringArticle);
    }

    function loadTxRequestArray() {
        var myStringArticle = fs.readFileSync(PATHS.TX_REQUEST_ARRAY, 'utf8');
        return JSON.parse(myStringArticle);
    }

    function loadArticleData() {
        var myStringArticle = fs.readFileSync(PATHS.ZD_ARTICLE_JSON, 'utf8');
        return JSON.parse(myStringArticle);
    }

    function loadSectionData() {
        var myStringArticle = fs.readFileSync(PATHS.ZD_SECTION_JSON, 'utf8');
        return JSON.parse(myStringArticle);
    }

    function loadCategoryData() {
        var myStringArticle = fs.readFileSync(PATHS.ZD_CATEGORY_JSON, 'utf8');
        return JSON.parse(myStringArticle);
    }

    function loadArticlesData() {
        var myStringArticles = fs.readFileSync(PATHS.ZD_ARTICLES_JSON, 'utf8');
        return JSON.parse(myStringArticles);
    }

    function loadSectionsData() {
        var myStringSections = fs.readFileSync(PATHS.ZD_SECTIONS_JSON, 'utf8');
        return JSON.parse(myStringSections);
    }

    function loadCategoriesData() {
        var myStringSections = fs.readFileSync(PATHS.ZD_CATEGORIES_JSON, 'utf8');
        return JSON.parse(myStringSections);
    }

    function loadArticlesTranslationsData() {
        var myStringArticlesTranslations = fs.readFileSync(PATHS.ZD_ARTICLES_TRANSLATIONS_JSON, 'utf8');
        return JSON.parse(myStringArticlesTranslations);
    }

    function loadSyncArticlesArrayData() {
        var myStringArticles = fs.readFileSync(PATHS.ARTICLE_ARRAY_JSON, 'utf8');
        return JSON.parse(myStringArticles);
    }

    function loadSyncSectionsArrayData() {
        var myStringArticles = fs.readFileSync(PATHS.SECTION_ARRAY_JSON, 'utf8');
        return JSON.parse(myStringArticles);
    }

    function loadSyncCategoriesArrayData() {
        var myStringArticles = fs.readFileSync(PATHS.CATEGORY_ARRAY_JSON, 'utf8');
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

    function loadTxStatsData() {
        var myStringFile = fs.readFileSync(PATHS.TX_RESOURCE_STATS_JSON, 'utf8');
        return JSON.parse(myStringFile);
    }

    function loadSyncPageData() {
        var myStringFile = fs.readFileSync(PATHS.PAGE_SYNC_JSON, 'utf8');
        return JSON.parse(myStringFile);
    }

    function loadSyncPageDatawithSection() {
        var myStringFile = fs.readFileSync(PATHS.PAGE_SYNC_SECTION_JSON, 'utf8');
        return JSON.parse(myStringFile);
    }

    function loadSyncPageDatawithCategory() {
        var myStringFile = fs.readFileSync(PATHS.PAGE_SYNC_CATEGORY_JSON, 'utf8');
        return JSON.parse(myStringFile);
    }


    describe("getting tx project", function() {
        var myProject = loadTxProjectData();

        it("convert project url to api url", function() {
            var goodProjectUrl = "https://www.transifex.com/projects/p/zendesk/";
            var badProjectUrl = "http://www.transifex.com/api/2/project/txtest-1/";
            var apiProjectUrl = txProject.convertUrlToApi(goodProjectUrl);
            var goodApiProjectUrl = "http://www.transifex.com/api/2/project/zendesk/";
            var badApiProjectUrl = txProject.convertUrlToApi(badProjectUrl);
            assert(_.isEqual(apiProjectUrl, goodApiProjectUrl));

        });

        it("is valid project url", function() {
            var goodProject = "http://www.transifex.com/api/2/project/txtest-1/"
            var result = txProject.checkProjectApiUrl(goodProject);
            assert(result, "for a good project url");

            var badProject = "txtest-1";
            var badResult = txProject.checkProjectUrl(badProject);
            assert(badResult === false, "for a bad project url");
        });
        it("check resources", function() {
            var goodResources = ['articles-205686967', 'articles-205686968', 'articles-205686969'];
            var myResources = txProject.getResourceArray(myProject);
            assert(_.isEqual(goodResources, myResources));
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

    it("check getting zd translation object from tx response object for section", function() {
        var txStrings = {
            name: 'Cette section est uniquement visible par vos agents secrets'
        };
        var txContent = {
            content: JSON.stringify(txStrings)
        };
        var goodZdTranslationObject = {
            "translation": {
                "locale": "fr",
                "title": "Cette section est uniquement visible par vos agents secrets"
            }
        };

        var myZdTranslation = zdSections.zdGetTranslationObject(txContent, "fr");

        assert(_.isEqual(myZdTranslation, goodZdTranslationObject));

    });

    it("completed translations from tx resource stats", function() {
        //       var testLang1 = [{"name":"articles-205686957","locale_completed":["en","fr_BE"]}];
        var testLangs = {
            name: "articles-205686967",
            locale_completed: ['fr', 'en']
        };
        //        var goodList = ['fr', 'en'];
        var myStringStats = fs.readFileSync(PATHS.TX_RESOURCE_STATS_JSON, 'utf8');
        assert(typeof myStringStats !== "undefined", "Check for valid stats test data");
        var myStats = JSON.parse(myStringStats);

        var completedLanguageList = myUtil.txGetCompletedTranslations("articles-205686967", myStats);
        assert(_.isEqual(completedLanguageList, testLangs));

    });

    it("get locale list from completed array", function() {
        var testLang1 = [{
            "name": "articles-205686937",
            "locale_completed": ["en"]
        }];
        var goodTest1 = ['en'];
        var testLangs = [{
            name: "articles-205686967",
            locale_completed: ['fr', 'en']
        }];
        var myLocales = myUtil.getLocalesFromArray("articles-205686937", testLang1);
        assert(_.isEqual(myLocales, goodTest1));
        var myNullLocales = myUtil.getLocalesFromArray("articles-205686937", null);
        assert(_.isEqual(myNullLocales, []));
        var myLocales2 = myUtil.getLocalesFromArray("articles-205686977", testLang1);
        assert(_.isEqual(myLocales2, []));
    });

    it("get source locale from tx resource", function() {
        var myStringResource = fs.readFileSync(PATHS.TX_RESOURCE_RESPONSE_JSON, 'utf8');
        assert(typeof myStringResource !== "undefined", "Check for valid resource test data");
        var myResource = JSON.parse(myStringResource);
    });


    it("check locale conversion from Transifex to Zendesk", function() {
        var txLocale = 'fr_BE';
        var result = 'fr-be';
        assert(myUtil.txLocaletoZd(txLocale) === result);
    });

    it("check if a locale is in a locale array", function() {
        var goodLocale = 'en';
        var badLocale = 'de';
        var myArray = ['fr', 'en'];
        assert(myUtil.isStringinArray(goodLocale, myArray));
        assert(!myUtil.isStringinArray(badLocale, myArray));
    });

    it("check if a resource is in array", function() {
        var goodResource = "categories-200287177";
        var myArray = ["articles-205686907","articles-205686927","articles-205686937","articles-205686947","articles-205686957","articles-205686967","articles-205686977","articles-206142477","articles-206631717","articles-206631727","categories-200287177","httpstxtestzendeskcom-1","sections-200287177","sections-200700727","sections-200801107","sections-200801117"];
        assert(myUtil.isStringinArray(goodResource, myArray));
    });

    it("check get locale from zd translation", function() {
        var myTranslations = loadTranslationsData();
        assert(typeof myTranslations !== "undefined", "Check for valid translation test data");
        var goodLocales = {
            "id": 205686967,
            "zd_locale": [ 'fr-be', 'fr', 'en-us' ]
        };

        assert(_.isEqual(goodLocales, myZdTranslations.getLocale(205686967,myTranslations)));
    });

    it("check get status from zd translation", function() {
        var myTranslations = loadTranslationsData();
        assert(typeof myTranslations !== "undefined", "Check for valid translation test data");

        var goodStatus = [{
            "outdated": false
        }, {
            "draft": false
        }, {
            "hidden": false
        }];
        var articledId = 205686967;
        var stringArticleId = "205686967";
        var locale = "fr-be";

        assert(_.isEqual(goodStatus, myZdTranslations.getStatus(myTranslations, articledId, locale)));
        assert(_.isEqual(goodStatus, myZdTranslations.getStatus(myTranslations, stringArticleId, locale)));
    });


    describe("getting zd articles", function() {
        var myArticles = loadArticlesData();

        var goodArticleArray = loadSyncArticlesArrayData();

        it("check array", function() {

            var myArray = zdArticles.getArray(myArticles);
            assert(_.isEqual(goodArticleArray, myArray));
        });

        it("get single", function() {
            var goodArticle = loadArticleData();
            var myArticle = zdArticles.getSingle(205686977, myArticles);

            assert(_.isEqual(myArticle, goodArticle));
        });

        it("has pagination", function() {
            var myBoolean = zdArticles.checkPagination(myArticles);
            assert(myBoolean === true, "Check for valid pagination");
        });

        it("get pages", function() {
            var goodPages = [1, 2, 3, 4, 5];
            var myPages = zdArticles.getPages(myArticles);
            assert(_.isEqual(goodPages, myPages));
        });
    });


    describe("getting zd sections", function() {
        var mySections = loadSectionsData();

        var goodSectionArray = loadSyncSectionsArrayData();

        it("check array", function() {

            var myArray = zdSections.getArray(mySections);
            assert(_.isEqual(goodSectionArray, myArray));
        });

        it("get single", function() {
            var goodSection = loadSectionData();
            var mySection = zdSections.getSingle(200801107, mySections);

            assert(_.isEqual(mySection, goodSection));
        })
    });

    describe("getting zd categories", function() {
        var myCategories = loadCategoriesData();

        var goodCategoryArray = loadSyncCategoriesArrayData();

        it("check array", function() {

            var myArray = zdCategories.getArray(myCategories);
            assert(_.isEqual(goodCategoryArray, myArray));
        });

        it("get single", function() {
            var goodCategory = loadCategoryData();
            var myCategory = zdCategories.getSingle(200287177, myCategories);


            assert(_.isEqual(myCategory, goodCategory));
        })
    });

    describe("getting zd articles with translations sideloaded", function() {
        var myArticles = loadArticlesTranslationsData();

        it("check array", function() {

            var goodArticleArray = _.sortBy(loadSyncArticlesArrayData(), "id");
            var myArray = zdArticles.getArray(myArticles);
            var mySortedArray = _.sortBy(myArray, "id");

            assert(_.isEqual(goodArticleArray, mySortedArray));
        });
    });

    describe("getting ui array", function() {
        var myCategories = loadCategoriesData();
        var mySections = loadSectionsData();
        var myArticles = loadArticlesData();
        var myStats = loadTxStatsData();
        var myGoodArray = loadSyncPageData();

        var myGoodSectionArray = loadSyncPageDatawithSection();

        var myGoodCategoryArray = loadSyncPageDatawithCategory();

        var completedLanguagesArray = myUtil.txGetCompletedTranslations(myStats);

        var testLangs = [{
            "id": 205686967,
            "locale_completed": ["fr-be", "en"]
        }, {
            "id": 205686927,
            "locale_completed": ["fr-be", "en"]
        }];
        var sectionArray = zdSections.getArray(mySections);
        var articleArray = zdArticles.getArray(myArticles);
        var categoryArray = zdCategories.getArray(myCategories);


        it("combine data articles", function() {
            var articleUIArray = myUtil.mapSyncPage(articleArray, testLangs, "https://www.transifex.com/projects/p/live-test-1/");
            assert(_.isEqual(myGoodArray, articleUIArray));

        });

        it("combine data sections", function() {
            var sectionUIArray = zdSections.mapSyncPage(sectionArray, testLangs, "https://www.transifex.com/projects/p/live-test-1/");
            assert(_.isEqual(myGoodSectionArray, sectionUIArray));

        });

        it("combine data categories", function() {
            var categoryUIArray = zdCategories.mapSyncPage(categoryArray, testLangs, "https://www.transifex.com/projects/p/live-test-1/");
            assert(_.isEqual(myGoodCategoryArray, categoryUIArray));

        });
    });

    it("create tx request for articles", function() {
        var goodRequestArray = loadTxRequestArray();
        var myArticles = loadArticlesData();
        var myRequestArray = myZdArticles.getTxRequest(myArticles);
        assert(_.isEqual(goodRequestArray, myRequestArray));


    });

    it("create tx request for a single article", function() {
        var goodRequest = loadTxRequestSingle();
        var myArticles = loadArticlesData();
        var myArticle = zdArticles.getSingle("205686957", myArticles);

        var myArticle1 = zdArticles.getSingle(205686957, myArticles);
        var myRequest = myZdArticles.getTxRequest(myArticle1);
        assert(_.isEqual(goodRequest, myRequest));


    });

    it("create tx request for a single section", function() {
        var goodRequest = loadTxRequestSection();
        var mySections = loadSectionsData();
        var mySection = zdSections.getSingle("200801107", mySections);

        var mySection1 = zdSections.getSingle(200801107, mySections);
        var myRequest = zdSections.getTxRequest(mySection1);
        assert(_.isEqual(goodRequest, myRequest));


    });

    it("create tx request for a single category", function() {
        var goodRequest = loadTxRequestCategory();
        var myCategories = loadCategoriesData();
        var myCategory = zdCategories.getSingle("200287177", myCategories);

        var myCategory1 = zdCategories.getSingle(200287177, myCategories);
        var myRequest = zdCategories.getTxRequest(myCategory1);
        assert(_.isEqual(goodRequest, myRequest));


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
        var result = myZdArticles.createResourceName(goodId, goodType, "::");
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
        assert(myZdArticles.validZdObject(goodType));
        assert.equal(false, myZdArticles.validZdObject(badType));
    });

    it("check zdUtil.validZdIdFormat", function() {
        var goodId1 = 2322;
        var goodId2 = "34334343";
        var badId2 = "crackers";
        assert(myZdArticles.validZdIdFormat(goodId1));
        assert(myZdArticles.validZdIdFormat(goodId2));
        assert.equal(false, myZdArticles.validZdIdFormat(badId2));
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
        var myPageNameName = "syncPage";
        var myPage = hdbs.parse(fs.readFileSync(PATHS.SYNCPAGE_HDBS, 'utf8'));

        var myPageDb = spahql.db(myPage);
        var types = myPageDb.select("//params/*[/type == 'StringLiteral']/value");
        var resultValues1 = types.values();

        var myEnJson = JSON.parse(fs.readFileSync(PATHS.TRANSLATION_EN_JSON, 'utf8'));
        assert(typeof myEnJson !== "undefined", "Check for valid en.json");
        var myEnJsonDb = spahql.db(myEnJson);
        var keys = myEnJsonDb.select("/syncPage/*");
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
        assert((typeof myApp.requests !== "undefined"), "Check for requests");
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
            if (assert(myParameters[i].type !== "hidden")) {
                assert(myParameters[i].required, "Check required for " + myParameters[i].name);
            }
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