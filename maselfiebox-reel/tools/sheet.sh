#!/bin/bash
# tools/sheet.sh sortie.jpg 30 60 90 ... : rend les images puis une planche-contact
out=$1; shift
node tools/stills.mjs "$@" > /dev/null 2>&1 || { echo "rendu en échec"; node tools/stills.mjs "$@" 2>&1 | tail -20; exit 1; }
files=(); for fr in "$@"; do files+=("out/stills/f$(printf %04d $fr).jpg"); done
montage "${files[@]}" -tile 6x -geometry 270x480+3+3 -background '#888' "$out"
