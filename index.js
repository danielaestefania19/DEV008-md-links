const { mdlink, getDirectoryFiles } = require('./mdlink');
const path = require('path');
const fs = require('fs'); // Agrega esta línea para importar el módulo fs

const [, , filePath, ...options] = process.argv;

const parsedOptions = {
  validate: options.includes('--validate'),
};

if (!filePath) {
  console.error('Debes proporcionar la ruta del archivo Markdown como argumento.');
} else {
  const absoluteFilePath = path.resolve(filePath);
  const stats = fs.statSync(absoluteFilePath);

  if (stats.isDirectory()) {
    mdlink(filePath, parsedOptions)
      .then((result) => {
        if (parsedOptions.validate) {
          result.links.forEach((link) => {
            console.log(link);
          });
        } else {
          const simplifiedLinks = result.links.map((link) => ({
            href: link.href,
            text: link.text,
            file: link.file,
          }));
          console.log(simplifiedLinks);
        }
      })
      .catch((error) => {
        console.error('Error:', error.message);
      });

    if (parsedOptions.validate) {
      const directoryFiles = getDirectoryFiles(absoluteFilePath);
      console.log('Archivos en la carpeta:', directoryFiles);
    }
  } else {
    mdlink(filePath, parsedOptions)
      .then((result) => {
        if (parsedOptions.validate) {
          result.links.forEach((link) => {
            console.log(link);
          });
        } else {
          const simplifiedLinks = result.links.map((link) => ({
            href: link.href,
            text: link.text,
            file: link.file,
          }));
          console.log(simplifiedLinks);
        }
      })
      .catch((error) => {
        console.error('Error:', error.message);
      });
  }
}
