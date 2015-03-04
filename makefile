out=out
data=data

targetnames=keyframes.svg scripts.js styles.css $(pages)
targets=$(targetnames:%=$(out)/%)

svgdata=$(patsubst %.svg,$(data)/%.js,$(wildcard *.svg))

styles=$(wildcard *.css)
scripts=$(wildcard *.js)
pages=$(wildcard *.html)

main_script=siilid.js

rm=rm -f --
rmrf=rm -rf --
mkdirp=mkdir -p --
cp=cp --
cat=cat -- /dev/null

uglifyjs=uglifyjs /dev/null --source-map-include-sources 
uglifycss=uglifycss /dev/null
browserify=browserify
phantomjs=phantomjs

ifeq ($(filter clean,$(MAKECMDGOALS)),)
ifeq ($(wildcard node_modules),)
dummy:=$(shell npm install)
endif
endif

ifeq ($(filter $(MAKECMDGOALS),release),release)
out:=$(out)/release
uglifyjs_opts=-c -m
browserify_opts=
else
uglifyjs_opts=-b
browserify_opts=-d
endif

PATH:=$(PWD)/node_modules/.bin:$(PATH)

ifeq ($(wildcard node_modules),)
MAKECMDGOALS:=node_modules $(MAKECMDGOALS)
endif

.PHONY: release all clean deps

all: $(targets)

release: all
	@true

clean:
	$(rmrf) $(out) $(data)

$(out):
	$(mkdirp) $@

$(data):
	$(mkdirp) $@

node_modules:
	npm install

$(out)/styles.css: $(styles)
	$(uglifycss) $^ > $@ || $(rm) $@

$(out)/scripts.js: $(scripts) $(svgdata)
	@#$(uglifyjs) $(uglifyjs_opts) --source-map $@.map $^ > $@ || $(rm) $@*
	$(browserify) $(browserify_opts) $(main_script) -o $@

$(data)/%.js: %.svg $(data)
	$(phantomjs) util/svg-bbox.js $< --var-name ^module.exports > $@ || $(rm) $@

$(out)/%: % | $(out)
	$(cp) $^ $@
