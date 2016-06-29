REPORTER = spec

init:
	npm install;
	ln -s ./node_modules/webpack/bin/webpack.js ./webpack

test:
		@NODE_ENV=test ./node_modules/.bin/csslint ./**/*.css
		@NODE_ENV=test ./node_modules/.bin/jshint ./**/*.js || echo
		@NODE_ENV=test ./node_modules/mocha/bin/mocha \
				--reporter $(REPORTER) 

test-w:
		@NODE_ENV=test ./node_modules/.bin/mocha \
				--reporter $(REPORTER) \
				--watch
run:
	cd ./dist;cat ../inputs.txt | zat server;

package:
	cd ./dist;zat package

.PHONY: test test-w
