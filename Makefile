# Netlify uses "make deploy" (see netlify.toml). Vercel uses the "vercel-build" script of package.json.
deploy: install tectonic build

install:
	npm ci

serve:
	npm start

build:
	npm run build

# Tectonic compiles the CV from src/cv.md and src/timeline.md (see README.md, "CV").
# The build images of the platforms do not have it, so this target downloads it into the repository root.
# If the download fails, the build continues and the site keeps the CV PDF from the repository.
tectonic:
	command -v tectonic >/dev/null 2>&1 || [ -x ./tectonic ] || curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net | sh || echo "warning: could not download Tectonic"

cv:
	npm run cv
