#!/usr/bin/env node

const { mdlink } = require('./mdlink');
const fs = require('fs');
const path = require('path');

const [, , filePath, ...options] = process.argv;

const parsedOptions = {
  validate: options.includes('--validate'),
  stats: options.includes('--stats'),
};

if (!filePath) {
  console.error('Debes proporcionar la ruta del archivo o directorio Markdown como argumento.');
} else {
  const absoluteFilePath = path.resolve(filePath);
  const stats = fs.statSync(absoluteFilePath);

  if (stats.isDirectory()) {
    mdlink(absoluteFilePath, parsedOptions)
      .then((result) => {
        if (parsedOptions.stats) {
          if (parsedOptions.validate) {
            console.log(`Total: ${result.total}`);
            console.log(`Unique: ${result.unique}`);
            console.log(`Broken: ${result.broken}`);
          } else {
            console.log(`Total: ${result.total}`);
            console.log(`Unique: ${result.unique}`);
          }
        } else {
          result.links.forEach((link) => {
            console.log(`Link: ${link.text}\nURL: ${link.href}\nFile: ${link.file}`);
            if (parsedOptions.validate) {
              console.log(`Status: ${link.ok} (${link.status})`);
            }
            console.log('---');
          });
        }
      })
      .catch((error) => {
        console.error('Error:', error.message);
      });
  } else {
    mdlink(absoluteFilePath, parsedOptions)
      .then((result) => {
        if (parsedOptions.stats) {
          if (parsedOptions.validate) {
            console.log(`Total: ${result.total}`);
            console.log(`Unique: ${result.unique}`);
            console.log(`Broken: ${result.broken}`);
          } else {
            console.log(`Total: ${result.total}`);
            console.log(`Unique: ${result.unique}`);
          }
        } else {
          result.links.forEach((link) => {
            console.log(`Link: ${link.text}\nURL: ${link.href}\nFile: ${link.file}`);
            if (parsedOptions.validate) {
              console.log(`Status: ${link.ok} (${link.status})`);
            }
            console.log('---');
          });
        }
      })
      .catch((error) => {
        console.error('Error:', error.message);
      });
  }
}
