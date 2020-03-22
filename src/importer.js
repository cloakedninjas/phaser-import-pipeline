const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const DEFAULT_OPTS = {
    sourceDir: 'source',
    destDir: 'assets',
    manifestPath: 'assets/manfiest.json',
    deleteOriginal: true
};

let options;

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

function run(opts) {
    options = Object.assign({}, DEFAULT_OPTS, opts);

    return recurseDirectory()
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
                    const fullPath = path.join(rootPath, file.name);

                    if (file.isDirectory()) {
                        const destFolder = path.join(sourceDirectory, file.name);
                        const destPath = path.join(options.destDir, destFolder);

                        return ensureDirExists(destPath)
                            .then(() => {
                                return recurseDirectory(destFolder);
                            });
                    } else {
                        const destFilePath = path.join(options.destDir, sourceDirectory, renameFile(file.name));
                        return moveFile(fullPath, destFilePath);
                    }
                })
            );
        });
}

function ensureDirExists(directory) {
    return fsp.stat(directory)
        .catch(e => {
            if (e.code === 'ENOENT') {
                fs.mkdirSync(directory, { recursive: true });
            } else {
                throw e;
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

module.exports = {
    renameFile,
    run
};
