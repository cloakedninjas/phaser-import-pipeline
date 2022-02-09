const fs = require('fs');
const mockFS = require('mock-fs');
const importer = require('./importer');

const MANIFEST_PATH = 'assets/manifest.json';

describe('renameFile()', () => {
    it('should perform correct string replacements', () => {
        expect(importer.renameFile('Test FILE  1.jpg')).toEqual('test_file_1.jpg');
    });
});

describe('run()', () => {
    beforeEach(() => {
        mockFS({
            'assets': {
            },
            'source': {
                'image': {
                    'A Test image-1.jpg': 'image-content here',
                    'dir1': {
                        'test-file-2.png': 'more image-content here'
                    }
                },
                'audio': {
                    'test.mp3': 'audio-content'
                }
            }
        });
    });

    afterEach(() => {
        mockFS.restore();
    });

    it('should create the output directory if it does not exist', (done) => {
        fs.rmdirSync('assets');

        importer.run()
            .then(() => {
                expect(fs.existsSync('assets')).toEqual(true);
                done();
            });
    });

    it('should move files to the correct location', (done) => {
        importer.run()
            .then(() => {
                expect(fs.existsSync('assets/image/a_test_image_1.jpg')).toEqual(true);
                expect(fs.existsSync('assets/image/dir1/test_file_2.png')).toEqual(true);
                expect(fs.existsSync('assets/audio/test.mp3')).toEqual(true);
                done();
            });
    });

    it('should generate a correct manifest', (done) => {
        importer.run()
            .then(() => {
                expect(fs.existsSync(MANIFEST_PATH)).toEqual(true);

                const manifest = fs.readFileSync(MANIFEST_PATH, 'utf-8');
                const json = JSON.parse(manifest);

                expect(json).toEqual({
                    assetRoot: 'assets',
                    totalSize: 54,
                    assets: {
                        image: {
                            a_test_image_1: {
                                file: 'a_test_image_1.jpg',
                                size: 18
                            },
                            dir1_test_file_2: {
                                file: 'dir1/test_file_2.png',
                                size: 23
                            }
                        },
                        audio: {
                            test: {
                                file: 'test.mp3',
                                size: 13
                            }
                        }
                    }
                })

                done();
            });
    });

    it('should read existing manifest if one is present', (done) => {
        fs.writeFileSync(MANIFEST_PATH, JSON.stringify({
            assetRoot: 'assets',
            totalSize: 34,
            assets: {
                image: {
                    existingImage: {
                        file: 'test.png',
                        size: 13
                    }
                }
            }
        }));

        importer.run()
            .then(() => {
                const manifest = fs.readFileSync(MANIFEST_PATH, 'utf-8');
                const json = JSON.parse(manifest);

                expect(json.assets.image.existingImage.file).toEqual('test.png');

                done();
            });
    });

    it('should add additional properties to known file types', (done) => {
        fs.mkdirSync('source/spritesheet');
        fs.writeFileSync('source/spritesheet/player.png', 'spritesheet data here');

        importer.run()
            .then(() => {
                const manifest = fs.readFileSync(MANIFEST_PATH, 'utf-8');
                const json = JSON.parse(manifest);

                expect(json.assets.spritesheet).toEqual({
                    player: {
                        file: 'player.png',
                        size: 21,
                        frameWidth: 0,
                        frameHeight: 0
                    }
                });

                done();
            });
    });

    it('should support multiple audio filetypes', (done) => {
        fs.writeFileSync('source/audio/test.ogg', 'ogg data');

        importer.run()
            .then(() => {
                const manifest = fs.readFileSync(MANIFEST_PATH, 'utf-8');
                const json = JSON.parse(manifest);

                expect(json.assets.audio).toEqual({
                    test: {
                        file: ['test.mp3', 'test.ogg'],
                        size: 13
                    }
                });

                done();
            });
    });

    it('should warn when detecting files in the source root', (done) => {
        fs.writeFileSync('source/dummy.txt', 'some text content');

        const spy = jest.spyOn(global.console, 'warn').mockImplementation();

        importer.run()
            .then(() => {
                expect(spy).toHaveBeenCalledWith(`dummy.txt in root source folder, unable to determine type for manifest`);

                done();
            });
    });

    it('should skip dot files', (done) => {
        fs.writeFileSync('source/audio/.gitkeep', '');

        importer.run()
            .then(() => {
                expect(fs.existsSync('assets/audio/.gitkeep')).toEqual(false);

                done();
            });
    });
});

describe('config', () => {
    const config = {
        sourceDir: 'my-source',
        destDir: 'my-dist',
        manifestPath: 'my-dist/manifest.json',
        deleteOriginal: false
    };

    beforeEach(() => {
        mockFS({
            '.pipelinerc': JSON.stringify(config),
            'my-source': {
                'image': {
                    'test.jpg': 'image content'
                }
            }
        });
    });

    afterEach(() => {
        mockFS.restore();
    });

    it('should use config file values set from RC file', (done) => {
        importer.run()
            .then(() => {
                expect(fs.existsSync('my-dist/image/test.jpg')).toEqual(true);
                expect(fs.existsSync('my-dist/manifest.json')).toEqual(true);
                done();
            });
    });

    describe('deleteOriginal', () => {
        it('should keep the source file when false', (done) => {
            importer.run()
                .then(() => {
                    expect(fs.existsSync('my-source/image/test.jpg')).toEqual(true);
                    done();
                });
        });

        it('should delete the source file when true', (done) => {
            config.deleteOriginal = true;

            mockFS({
                '.pipelinerc': JSON.stringify(config),
                'my-source': {
                    'image': {
                        'test.jpg': 'image content'
                    }
                }
            });

            importer.run()
                .then(() => {
                    expect(fs.existsSync('my-source/image/test.jpg')).toEqual(false);
                    done();
                });
        });
    });
});