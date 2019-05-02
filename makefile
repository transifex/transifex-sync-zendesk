REPORTER = spec

init:
	npm install;
	ln -sf ./node_modules/webpack/bin/webpack.js ./webpack
	ln -sf ./node_modules/mocha/bin/mocha ./mocha

clean:
	rm ./dist/assets/index.html
	rm ./dist/assets/main.js
	rm ./dist/assets/main.css

build:
	./webpack --env.SENTRY_DSN=${SENTRY_DSN}

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
