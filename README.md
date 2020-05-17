# Phaser 3 Asset Import Pipeline

- Drop files into corresponding directories:
  - source/image
  - source/audio
- Have them copied to the output directory:
  - assets/image
  - assets/audio
- Normalize the filenames
  - to lower case
  - convert spaces, hyphens to underscores
- Record filesize of each asset into a
  - manifest.json
- Append metadata into manifest
  - spritesheet (frameWidth, frameHeight)

## Installation

`npm i phaser-import-pipeline`

## Usage

Via CLI:
```
$ ./node_modules/.bin/phaser-import-pipeline
```

Via npm script:
```json
{
  "scripts": {
    "import": "phaser-import-pipeline"
  }
}
```

- `no args` run copy process (cleanup filenames, add to manifest)
- `watch` watch directories, run base cmd

## Config

Can be set using a `.pipelinerc` file. With sample contents:

```json
{
  "sourceDir": "source",
  "destDir": "assets",
  "manifestPath": "assets/manifest.json",
  "deleteOriginal": true
}
```

## Asset types

`spritesheet` includes the following default manifest data

```json
{
  "frameWidth": 0,
  "frameHeight": 0
}
```

## Example output `manifest.json`

```json
{
  "assetRoot": "assets",
  "totalSize": 420615,
  "assets": {
    "image": {
      "house": {
        "size": 2975
      },
      "person": {
        "size": 66520
      }
    },
    "audio": {
      "door_close": {
        "size": 314500
      }
    }
  }
}
```
