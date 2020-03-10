const MANIFEST_FILE = './manifest.json';
const SOURCE_DIR = './source';
const ASSET_DIR = './assets';

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

// const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'));

/* Object.keys(manifest).forEach((fileType) => {
    Object.keys(manifest[fileType]).forEach((key) => {
        const entry = manifest[fileType][key];
        const stats = fs.statSync(path.join(ASSET_DIR, fileType, entry.file));

        entry.size = stats.size;

        console.log('Adding', entry.file, entry.size);
    });
});

fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest)); */

function readSourceDirectories() {
    fsp.readdir(SOURCE_DIR)
        .then(ensureAssetDirExists)
        .then(ensureTypeDirsExist)
        .then(processAssets)
        .catch(e => { console.error(e) });
}

function ensureAssetDirExists(sourceFolders) {
    try {
        fs.statSync(ASSET_DIR);
    } catch (e) {
        if (e.code === 'ENOENT') {
            fs.mkdirSync(ASSET_DIR);
        }
    }

    return sourceFolders;
}

function ensureTypeDirsExist(types) {
    return Promise.all(types.map(type => {
        const destPath = path.join(ASSET_DIR, type);

        fsp.stat(destPath)
            .catch(e => {
                if (e.code === 'ENOENT') {
                    fs.mkdirSync(destPath);
                }
            })
    })).then(() => {
        return types;
    });
}

function processAssets(types) {
    console.log(1, types);

    types.forEach(type => {
        const destPath = path.join(ASSET_DIR, type);

        fsp.readdir(path.join(SOURCE_DIR, type))
            .then(assetPath => {
                console.log(assetPath);
            })

        //const newFilename = renameFile
    });
}

function renameFile(input) {
    let output = input.toLowerCase();
    output = output.replace(/\s+/g, '_');

    return output;
}

module.exports = {
    renameFile,
    readSourceDirectories
};
