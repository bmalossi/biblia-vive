const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('c:/Users/sorai/Desktop/Bruno/Projetos/Biblia/biblia-vive-leitura-main/src/data/book-contexts.json');
let content = fs.readFileSync(targetFile, 'utf8');

const replacements = {
    '1SA': 'sa1',
    '2SA': 'sa2',
    '1KI': 'kg1',
    '2KI': 'kg2',
    '1CH': 'ch1',
    '2CH': 'ch2',
    'SNG': 'sol',
    'EZK': 'eze',
    'JOL': 'joe',
    'NAM': 'nah',
    'ZEC': 'zac',
    'MRK': 'mar',
    'JHN': 'joh',
    '1CO': 'co1',
    '2CO': 'co2',
    'PHP': 'phi',
    '1TH': 'th1',
    '2TH': 'th2',
    '1TI': 'ti1',
    '2TI': 'ti2',
    'PHM': 'plm',
    'JAS': 'jam',
    '1PE': 'pe1',
    '2PE': 'pe2',
    '1JN': 'jo1',
    '2JN': 'jo2',
    '3JN': 'jo3',
    'JUD': 'jde'
};

const obj = JSON.parse(content);
const newObj = {};

for (const [key, value] of Object.entries(obj)) {
    if (replacements[key]) {
        const newLowId = replacements[key];
        const newUpperId = newLowId.toUpperCase();
        value.id = newLowId;
        newObj[newUpperId] = value;
    } else {
        newObj[key] = value;
    }
}

fs.writeFileSync(targetFile, JSON.stringify(newObj, null, 2), 'utf8');
console.log('Done mapping book contexts.');
