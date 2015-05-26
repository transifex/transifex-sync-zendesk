REPORTER = spec

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