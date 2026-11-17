#!/bin/sh
# Run from any directory. Provide appimagetool, the x86_64 Type 2 runtime and Node.
set -eu
if [ "$#" -ne 5 ]; then
 printf '%s\n' 'Usage: build-appimage.sh APPIMAGETOOL RUNTIME NODE PUBLISHED_COMMIT OUTPUT.AppImage' >&2
 exit 2
fi
packager=$1
runtime=$2
node=$3
revision=$4
output=$5
case "$revision" in ''|*[!a-f0-9]*) exit 2;; esac
[ "${#revision}" -eq 40 ] || exit 2
files=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repo=$(CDPATH= cd -- "$files/../.." && pwd)
temp=$(mktemp -d)
trap 'rm -rf -- "$temp"' EXIT
app="$temp/MyrrenEditor.AppDir"
mkdir -p -- "$app/usr/bin" "$app/usr/share/myrren"
install -m 755 "$node" "$app/usr/bin/node"
install -m 755 "$files/AppRun" "$app/AppRun"
install -m 644 "$files/myrren-editor.desktop" "$app/myrren-editor.desktop"
install -m 644 "$files/myrren-editor.svg" "$app/myrren-editor.svg"
cp -a -- "$repo/public" "$repo/tools" "$app/usr/share/myrren/"
printf '%s\n' "$revision" >"$app/usr/share/myrren-revision"
ARCH=x86_64 "$packager" --runtime-file "$runtime" "$app" "$output"
chmod +x "$output"
