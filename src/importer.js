const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const assetTypeProps = require('./asset-type-properties');

const DEFAULT_OPTS = {
    sourceDir: 'source',
    destDir: 'assets',
    manifestPath: 'assets/manifest.json',
    deleteOriginal: true
};

let options;
let manifest;

function run(opts) {
    options = Object.assign({}, DEFAULT_OPTS, opts);

    return ensureDirExists(options.destDir)
        .then(ensureManifestExists)
        .then(recurseDirectory)
        .then(saveManifest)
        .catch(e => {
            console.log('ERROR!');
            console.error(e)
        });
}

function recurseDirectory(sourceDirectory) {
    sourceDirectory = sourceDirectory || '';
    const rootPath = path.join(options.sourceDir, sourceDirectory);

    return fsp.readdir(rootPath, { withFileTypes: true })
        .then(files => {
            return Promise.all(
                files.map(file => {
                    const srcFilePath = path.join(rootPath, file.name);

                    if (file.isDirectory()) {
                        const destFolder = path.join(sourceDirectory, file.name);
                        const destPath = path.join(options.destDir, destFolder);

                        return ensureDirExists(destPath)
                            .then(() => {
                                return recurseDirectory(destFolder);
                            });
                    } else {
                        const destFilePath = path.join(options.destDir, sourceDirectory, renameFile(file.name));
                        return moveFile(srcFilePath, destFilePath)
                            .then(() => {
                                return addEntryToManifest(destFilePath);
                            });
                    }
                })
            );
        });
}

function ensureManifestExists() {
    return fsp.readFile(options.manifestPath, 'utf8')
        .then(manifestData => {
            manifest = JSON.parse(manifestData);
        })
        .catch(error => {
            if (error.code === 'ENOENT') {
                manifest = {};
                return fsp.writeFile(options.manifestPath, '{}');
            } else {
                throw e;
            }
        });
}

function ensureDirExists(directory) {
    return fsp.stat(directory)
        .catch(error => {
            if (error.code === 'ENOENT') {
                return fsp.mkdir(directory, { recursive: true });
            } else {
                throw error;
            }
        });
}

function moveFile(srcFile, destFile) {
    // TODO - change to move
    // fsp.moveFile(srcFile, destFile);
    return fsp.copyFile(srcFile, destFile);
}

function renameFile(input) {
    let output = input.toLowerCase();
    output = output.replace(/\s+/g, '_');
    output = output.replace(/-/g, '_');

    return output;
}

function addEntryToManifest(filePath) {
    return fsp.stat(filePath)
        .then(stats => {
            const basePath = filePath.substring(options.destDir.length + 1);
            const parts = basePath.split(path.sep);

            const assetType = parts.shift();

            if (parts.length === 0) {
                console.warn(`${assetType} in root source folder, unable to determine type for manifest`);
                return;
            }

            if (!manifest[assetType]) {
                manifest[assetType] = {};
            }

            const key = parts.join('_')
                .replace(/\..+$/, '');

            const extraProps = assetTypeProps[assetType] || {};

            manifest[assetType][key] = {
                size: stats.size,
                ...extraProps
            };
        })
        .catch(e => {
            console.error('bugger', e);
        });
}

function saveManifest() {
    return fsp.writeFile(options.manifestPath, JSON.stringify(manifest));
}

module.exports = {
    renameFile,
    run
};
