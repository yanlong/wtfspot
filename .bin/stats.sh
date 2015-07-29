#!/bin/bash
nowtime=$(date +%Y%m%d)
target=~/html/$nowtime
[[ ! -d $target ]] && mkdir -p $target
mongo wtfspot stats.js --quiet  > $target/stats.json
