REPORTER = spec

init:
	npm install;
	ln -s ./node_modules/webpack/bin/webpack.js ./webpack
	ln -s ./node_modules/gulp/bin/gulp.js ./gulp
	ln -s ./node_modules/babel-cli/bin/babel.js ./babel
	ln -s ./node_modules/mocha/bin/mocha ./mocha

run:
	cd ./dist;cat ../inputs.txt | zat server;

package:
	cd ./dist;zat package

.PHONY: test test-w