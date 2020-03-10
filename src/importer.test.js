const assert = require('assert').strict;
const importer = require('./importer');

assert.deepEqual(importer.renameFile('Test FILE  1.jpg'), 'test_file_1.jpg');