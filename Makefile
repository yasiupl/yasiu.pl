deploy: install tectonic copy build 

install:
	npm ci

copy:
	mkdir -p dist/assets
	cp -r src/static/. dist/

serve: copy
	npm start

build: copy
	npm run build

# Tectonic compiles the CV from src/cv.md and src/timeline.md (see README.md, "CV").
# The Netlify build image does not have it, so this target downloads it into the repository root.
# If the download fails, the build continues and the site keeps the CV PDF from the repository.
tectonic:
	command -v tectonic >/dev/null 2>&1 || [ -x ./tectonic ] || curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net | sh || echo "warning: could not download Tectonic"

cv:
	npm run cv
