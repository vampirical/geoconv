#!/usr/bin/env node

const arcGis = require('terraformer-arcgis-parser');
const getStdin = require('get-stdin');
const pjson = require('./package.json');
const program = require('commander');
const terraformer = require('terraformer');
const wkt = require('terraformer-wkt-parser');

const supportedFormats = ['arcgis', 'geojson', 'wkt'];
const supportedFormatIndex = new Set(supportedFormats);

const autoFormat = 'auto';

program
  .version(pjson.version)
  .description('Convert between different geometry formats. Supported formats: ' + supportedFormats.join(', '))
  .option('-i, --input-format [format]', 'Input format.', autoFormat)
  .arguments('<output-format>')
  .parse(process.argv);

(async () => {
  const stdinString = await getStdin();
  let stdinJsonParsed = null;

  const requestedInputFormat = (program.inputFormat + '').toLowerCase();
  const outputFormat = program.args[0].toLowerCase();

  if (!supportedFormatIndex.has(requestedInputFormat) && requestedInputFormat !== autoFormat) {
  	console.error('Invalid input format "' + requestedInputFormat + '".');
  }
  if (!supportedFormatIndex.has(outputFormat)) {
  	console.error('Invalid output format "' + outputFormat + '".');
  }

  let inputFormat = requestedInputFormat;
  if (inputFormat === autoFormat) {
    const firstChar = stdinString[0];
    const isJson = (firstChar === '{' || firstChar === '[');
    if (isJson) {
      stdinJsonParsed = JSON.parse(stdinString);
      if (typeof stdinJsonParsed.spatialReference === 'undefined') {
        inputFormat = 'geojson';
      } else {
        inputFormat = 'arcgis';
      }
    } else {
      inputFormat = 'wkt';
    }
  }
  
  let primative = null;
  switch (inputFormat) {
    case 'wkt':
      primative = wkt.parse(stdinString);
      break;
    
    case 'geojson':
      stdinJsonParsed = stdinJsonParsed || JSON.parse(stdinString);
      primative = terraformer.Primitive(stdinJsonParsed);
      break;

    case 'arcgis':
      stdinJsonParsed = stdinJsonParsed || JSON.parse(stdinString);
      primative = arcGis.parse(stdinJsonParsed);
      break;

    default:
      console.error('Unknown input format "' + inputFormat + '"');
      process.exit(1);
      break;
  }

  let output = null;
  switch (outputFormat) {
    case 'wkt':
      output = wkt.convert(primative);
      break;
    
    case 'geojson':
      output = JSON.stringify(primative);
      break;

    case 'arcgis':
      output = JSON.stringify(arcGis.convert(primative));
      break;

    default:
      console.error('Unknown output format "' + outputFormat + '"');
      process.exit(2);
      break;
  }

  process.stdout.write(output);
})();
