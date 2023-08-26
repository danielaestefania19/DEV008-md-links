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
    const visitedLinks = new Set(); // Usaremos un conjunto para evitar repeticiones

    mdlink(filePath, parsedOptions)
      .then((result) => {
        if (parsedOptions.validate) {
          result.links.forEach((link) => {
            visitedLinks.add(link.href); // Agregar el enlace al conjunto
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
        if (directoryFiles) { // Verificar si directoryFiles está definido
          const linkPromises = directoryFiles.map((file) =>
            mdlink(file, parsedOptions)
          );
      
          Promise.all(linkPromises)
            .then((results) => {
              const visitedLinks = new Set(); // Conjunto para evitar duplicación
              results.forEach((result) => {
                result.links.forEach((link) => {
                  if (!visitedLinks.has(link.href) && link.ok === 'ok') {
                    console.log(link);
                    visitedLinks.add(link.href); // Agregar el enlace al conjunto
                  }
                });
              });
            })
            .catch((error) => {
              console.error('Error:', error.message);
            });
        }
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
