deploy: install copy build 

install:
	npm ci

copy:
	mkdir -p dist/assets
	cp -r src/assets dist

serve: copy
	npm start

build: copy
	npm run build
