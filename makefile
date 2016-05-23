REPORTER = spec

init:
	npm install;
	cd ./node_modules | ln -s ../zendesk-app/lib/syncUtil.js ./node_modules/syncUtil.js;
	cd ./node_modules | ln -s ../zendesk-app/lib/txProject.js ./node_modules/txProject.js;
	cd ./node_modules | ln -s ../zendesk-app/lib/zdArticles.js ./node_modules/zdArticles.js;
	cd ./node_modules | ln -s ../zendesk-app/lib/zdCategories.js ./node_modules/zdCategories.js;
	cd ./node_modules | ln -s ../zendesk-app/lib/zdSections.js ./node_modules/zdSections.js;
	cd ./node_modules | ln -s ../zendesk-app/lib/zdTranslations.js ./node_modules/zdTranslations.js;
	cd ./node_modules | ln -s ../zendesk-app/lib/messages.js ./node_modules/messages.js;

test:
		@NODE_ENV=test ./node_modules/.bin/csslint ./**/*.css
		@NODE_ENV=test ./node_modules/.bin/jshint ./**/*.js --exclude ./node_modules || echo
		@NODE_ENV=test ./node_modules/mocha/bin/mocha \
				--reporter $(REPORTER) 

test-w:
		@NODE_ENV=test ./node_modules/.bin/mocha \
				--reporter $(REPORTER) \
				--watch
run:
	cd ./zendesk-app;cat ../inputs.txt | zat server;

package:
	cd ./zendesk-app;zat package

.PHONY: test test-w