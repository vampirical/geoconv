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
  function errorWithHelp(message, code) {
    console.error(message);
    console.log(program.helpInformation());
    process.exit(code || 1);
  }

  const stdinString = await getStdin();
  let stdinJsonParsed = null;

  if (program.args.length < 1) {
    errorWithHelp('Argument "output-format" is required.', 1);
  }

  const requestedInputFormat = (program.inputFormat + '').toLowerCase();
  const outputFormat = program.args[0].toLowerCase();

  if (!supportedFormatIndex.has(requestedInputFormat) && requestedInputFormat !== autoFormat) {
    errorWithHelp('Invalid input format "' + requestedInputFormat + '".', 2);
  }
  if (!supportedFormatIndex.has(outputFormat)) {
    errorWithHelp('Invalid output format "' + outputFormat + '".', 3);
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
  }

  process.stdout.write(output);
})();
