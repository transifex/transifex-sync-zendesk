REPORTER = spec

init:
	npm install;
	ln -s ./node_modules/webpack/bin/webpack.js ./webpack

run:
	cd ./dist;cat ../inputs.txt | zat server;

package:
	cd ./dist;zat package

.PHONY: test test-w