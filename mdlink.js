const fs = require('fs');
const path = require('path');
const axios = require('axios');

//Funcion para obtener los links en un array
function getLinksFromMarkdownContent(markdownContent) {
  // Expresión regular para encontrar los enlaces en el contenido del archivo Markdown
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  const links = [];
  let match;
  while ((match = linkRegex.exec(markdownContent))) {
    const [, text, url] = match;
    links.push({ href: url, text });
  }
  return links;
}

// Funcion para convertir la ruta relativa a absoluta
function convertToAbsolutePath(file) {
  if (!path.isAbsolute(file)) {
    return path.resolve(file);
  }
  return file;
}

//Función valida un enlace al realizar una solicitud HTTP
function validateLink(link) {
  return axios
    .get(link.href)
    .then((response) => ({
      ...link,
      status: response.status,
      ok: 'ok',
    }))
    .catch((error) => ({
      ...link,
      status: error.response ? error.response.status : 'Unknown',
      ok: 'fail',
    }));
}


function processPathRecursive(targetPath, options) {
  const stats = fs.statSync(targetPath);

  if (stats.isDirectory()) {
    // Si la ruta es un directorio, obtiene la lista de elementos en el directorio
    const items = fs.readdirSync(targetPath);
    const promises = [];

    items.forEach(item => {
      const itemPath = path.join(targetPath, item);
      // Por cada elemento en el directorio, realiza un proceso recursivo
      promises.push(processPathRecursive(itemPath, options));
    });

    // Espera a que todas las promesas de procesos recursivos se resuelvan
    return Promise.all(promises).then(results => [].concat(...results));
  } else if (stats.isFile() && path.extname(targetPath) === '.md') {
    // Si es un archivo con extensión .md, llama a la función mdlink para procesarlo
    return mdlink(targetPath, options);
  }

  // Si no es ni directorio ni archivo .md, resuelve con un array vacío
  return Promise.resolve([]);
}



function mdlink(file, options) {
  return new Promise((resolve, reject) => {
    try {
      // Convierte la ruta relativa del archivo a una ruta absoluta
      const absoluteFilePath = convertToAbsolutePath(file);
      console.log('Ruta absoluta:', absoluteFilePath);

      // Obtiene información sobre el archivo o directorio en la ruta proporcionada
      const stats = fs.statSync(absoluteFilePath);

      if (stats.isDirectory()) {
        // Si es un directorio, procesa los archivos recursivamente en el directorio
        processPathRecursive(absoluteFilePath, options)
          .then(links => {
            resolve(links); // Resuelve la promesa con los enlaces encontrados
          })
          .catch(error => {
            reject(error); // Rechaza la promesa si hay un error durante el procesamiento
          });
      } else if (stats.isFile() && path.extname(absoluteFilePath) === '.md') {
        // Si es un archivo con extensión .md (Markdown), lee su contenido
        const markdownContent = fs.readFileSync(absoluteFilePath, 'utf8');
        const links = getLinksFromMarkdownContent(markdownContent);

        if (options.validate) {
          // Si se pasa la opción --validate, valida los enlaces haciendo solicitudes HTTP
          const linkPromises = links.map(link =>
            validateLink(link).then(validatedLink => ({
              ...validatedLink,
              file: absoluteFilePath,
            }))
          );

          Promise.all(linkPromises)
            .then(validatedLinks => {
              const result = {
                total: validatedLinks.length,
                unique: new Set(validatedLinks.map(link => link.href)).size,
                links: validatedLinks,
              };

              if (options.stats) {
                result.broken = validatedLinks.filter(link => link.ok === 'fail').length;
              }

              resolve(result); // Resuelve la promesa con los enlaces validados y estadísticas
            })
            .catch(error => reject(error));
        } else {
          // Si no se pasa la opción --validate, devuelve los enlaces encontrados
          const result = {
            total: links.length,
            unique: new Set(links.map(link => link.href)).size,
            links: links.map(link => ({
              ...link,
              file: absoluteFilePath,
            })),
          };

          resolve(result); // Resuelve la promesa con los enlaces y estadísticas
        }
      } else {
        // Si no es ni un directorio ni un archivo .md, resuelve la promesa con un array vacío
        resolve([]);
      }
    } catch (error) {
      reject(error); // Rechaza la promesa si hay un error durante el procesamiento
    }
  });
}


module.exports = {
  mdlink,
  getLinksFromMarkdownContent,
  convertToAbsolutePath,
  validateLink,
};



