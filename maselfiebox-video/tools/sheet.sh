#!/bin/bash
# planche-contact des stills : tools/sheet.sh sortie.jpg f0030 f0060 ...
out=$1; shift
files=(); for f in "$@"; do files+=("out/stills/$f.jpg"); done
montage "${files[@]}" -tile 3x -geometry 640x360+4+4 -background '#333' -label '%f' "$out"
