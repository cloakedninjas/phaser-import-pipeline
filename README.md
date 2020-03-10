# Phaser 3 Asset Import Pipeline

- Drop files into corresponding directories
- Have them copied to the desired asset folder with metadata saved to a manifest

## Installation

## Usage

`phaser-import`

- `no args` run copy process (cleanup filenames, add to manifest)
- `init` create source folders (image, audio, spritesheets)
- `watch` watch directories, run base cmd

## Config

- source root folder (./import)
- destination root folder (./assets)
- manifest path (./manifest.json)
- delete on copy (Y)/n
- overwrite on duplicate path (Y)/n