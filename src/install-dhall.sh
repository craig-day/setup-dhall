#!/bin/sh

echo "Downloading dhall from: $1"
wget --quiet $1

echo "Downloading dhall-json from: $2"
wget --quiet $2

echo "Downloading dhall-yaml from: $3"
wget --quiet $3

# Extract dhall-json and dhall-yaml first, makes final shell glob easier
tar --extract --bzip2 --file dhall-json-*.tar.bz2
rm -f dhall-json-*.tar.bz2

tar --extract --bzip2 --file dhall-yaml-*.tar.bz2
rm -f dhall-yaml-*.tar.bz2

# Extract dhall now that dhall-json is done
tar --extract --bzip2 --file dhall-*.tar.bz2
rm -f dhall-*.tar.bz2

# Add the dhall executables to the path for future actions
echo "$(pwd)/bin" >> $GITHUB_PATH
