const fs = require('fs');
const mockFS = require('mock-fs');
const importer = require('./importer');

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
                    'A Test image-1.jpg': 'image-content',
                    'dir1': {
                        'test-file-2.png': 'image-content'
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

    it('should move files to the correct location', (done) => {
        importer.run()
            .then(() => {
                expect(fs.existsSync('assets/image/a_test_image_1.jpg')).toEqual(true);
                expect(fs.existsSync('assets/image/dir1/test_file_2.png')).toEqual(true);
                expect(fs.existsSync('assets/audio/test.mp3')).toEqual(true);
                done();
            });
    });

    xit('should generate manifest entries for known asset types', (done) => {
        importer.run()
            .then(() => {
                expect(fs.existsSync('assets/manifest.json')).toEqual(true);
                done();
            });
    })
});

