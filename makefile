REPORTER = spec

init:
	npm install;
	ln -s ./node_modules/webpack/bin/webpack.js ./webpack
	ln -s ./node_modules/mocha/bin/mocha ./mocha

clean:
	rm ./dist/assets/index.html
	rm ./dist/assets/main.js
	rm ./dist/assets/main.css

build:
	webpack

run:
	cat inputs.txt | zat server --path=./dist;

jstest:
	node mocha test/setup/node.js test/unit

validate:
	cd ./dist;zat validate

package:
	cd ./dist;zat package

buildpack: build package

.PHONY: build
