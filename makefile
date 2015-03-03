out=out

targetnames=keyframes.svg keyframes.svg.js bower_scripts.js bower_styles.css scripts.js styles.css $(pages)
targets=$(targetnames:%=$(out)/%)

bower_styles=
bower_scripts=underscore/underscore.js

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

ifeq ($(filter $(MAKECMDGOALS),release),release)
out:=$(out)/release
uglifyjs_opts=-c -m
else
uglifyjs_opts=-b
endif

.PHONY: release all clean

all: $(targets)

release: all
	@true

clean:
	$(rmrf) $(targets) $(out)

$(out):
	$(mkdirp) $@

bower_components:
	bower install

$(out)/bower_styles.css: $(bower_styles:%=bower_components/%) | bower_components
	$(uglifycss) $^ > $@ || $(rm) $@

$(out)/styles.css: $(styles)
	$(uglifycss) $^ > $@ || $(rm) $@

$(out)/bower_scripts.js: $(bower_scripts:%=bower_components/%) | bower_components
	$(uglifyjs) $(uglifyjs_opts) --source-map $@.map $^ > $@ || $(rm) $@*

$(out)/scripts.js: $(scripts)
	#$(uglifyjs) $(uglifyjs_opts) --source-map $@.map $^ > $@ || $(rm) $@*
	browserify -d $(main_script) -o $@

$(out)/%.svg.js: %.svg | $(out)
	./util/svg-bbox.js $< --var-name $(<:%.svg=%) > $@ || $(rm) $@

$(out)/%: % | $(out)
	$(cp) $^ $@
