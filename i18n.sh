#!/bin/sh

mkdir -p po/templates

i18n-scan.pl . > po/templates/mstpd.pot
i18n-update.pl po
