const fs = require('fs');
const mockFS = require('mock-fs');
const importer = require('./importer');

// console.log('');

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

    it('should generate manifest entries for known asset types', (done) => {
        importer.run()
            .then(() => {
                expect(fs.existsSync(MANIFEST_PATH)).toEqual(true);

                const manifest = fs.readFileSync(MANIFEST_PATH);
                const json = JSON.parse(manifest);

                expect(json).toEqual({
                    image: {
                        a_test_image_1: {
                            size: 18
                        },
                        dir1_test_file_2: {
                            size: 23
                        }
                    },
                    audio: {
                        test: {
                            size: 13
                        }
                    }
                })

                done();
            });
    });

    it('should read existing manifest if one is present', (done) => {
        fs.writeFileSync(MANIFEST_PATH, '{"field": "property"}');

        importer.run()
            .then(() => {
                const manifest = fs.readFileSync(MANIFEST_PATH);
                const json = JSON.parse(manifest);

                expect(json.field).toEqual('property');

                done();
            });
    });

    it('should add additional properties to known file types', (done) => {
        fs.mkdirSync('source/spritesheet');
        fs.writeFileSync('source/spritesheet/player.png', 'spritesheet data here');

        importer.run()
            .then(() => {
                const manifest = fs.readFileSync(MANIFEST_PATH);
                const json = JSON.parse(manifest);

                expect(json.spritesheet).toEqual({
                    player: {
                        size: 21,
                        frameWidth: 0,
                        frameHeight: 0
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
});
