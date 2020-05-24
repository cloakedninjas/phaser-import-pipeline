const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { rcFile } = require('rc-config-loader');

const assetTypeProps = require('./asset-type-properties');

const DEFAULT_OPTS = {
    sourceDir: 'source',
    destDir: 'assets',
    manifestPath: 'assets/manifest.json',
    deleteOriginal: true
};

let options;
let manifest;

function run() {
    const configFile = rcFile('pipeline');
    const configOpts = configFile ? configFile.config : {}
    options = Object.assign({}, DEFAULT_OPTS, configOpts);

    return ensureDirExists(options.destDir)
        .then(ensureManifestExists)
        .then(recurseDirectory)
        .then(saveManifest)
        .catch(e => {
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
                manifest = {
                    assetRoot: options.destDir,
                    totalSize: 0,
                    assets: {}
                };
                return fsp.writeFile(options.manifestPath, JSON.stringify(manifest));
            } else {
                throw error;
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
    if (options.deleteOriginal) {
        return fsp.rename(srcFile, destFile);
    }

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

            if (!manifest.assets[assetType]) {
                manifest.assets[assetType] = {};
            }

            const key = parts.join('_')
                .replace(/\..+$/, '');

            const extraProps = assetTypeProps[assetType] || {};

            manifest.assets[assetType][key] = {
                file: parts.join('/'),
                size: stats.size,
                ...extraProps
            };

            manifest.totalSize += stats.size
        });
}

function saveManifest() {
    return fsp.writeFile(options.manifestPath, JSON.stringify(manifest));
}

module.exports = {
    renameFile,
    run
};
