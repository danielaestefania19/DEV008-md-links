#!/usr/bin/env node

const { mdlink } = require('./mdlink');

const [, , filePath, ...options] = process.argv;

const parsedOptions = {
  validate: options.includes('--validate'),
  stats: options.includes('--stats'),
};

if (!filePath) {
  console.error('Debes proporcionar la ruta del archivo Markdown como argumento.');
} else {
    mdlink(filePath, parsedOptions)
    .then((result) => {
      if (parsedOptions.stats) {
        console.log(`Total: ${result.total}`);
        console.log(`Unique: ${result.unique}`);
        if (parsedOptions.validate) {
          console.log(`Broken: ${result.broken}`);
        }
      } else {
        result.links.forEach((link) => {
          const truncatedText = link.text.length > 50 ? `${link.text.slice(0, 47)}...` : link.text;
          console.log(`Link: ${truncatedText}\nURL: ${link.href}\nFile: ${link.file}`);
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