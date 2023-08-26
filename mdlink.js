const path = require('path');
const fs = require('fs');
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


function getDirectoryFiles(targetPath) {
  console.log(targetPath);
  const items = fs.readdirSync(targetPath);
  console.log(items);
  const rutas = [];

  items.forEach(item => {
    const itemPath = path.join(targetPath, item);
    const stats = fs.statSync(itemPath);

    if (stats.isFile()) {
      rutas.push(itemPath);
    } else if (stats.isDirectory()) {
      const tempRoutes = getDirectoryFiles(itemPath); // Llamada recursiva con itemPath
      rutas.push(...tempRoutes);
    }
  });

  return rutas;
}


function mdlink(file, options) {
  return new Promise((resolve, reject) => {
    try {
      // Convierte la ruta relativa a absoluta
      const absoluteFilePath = convertToAbsolutePath(file);

      // Obtiene las estadísticas del archivo o directorio
      const stats = fs.statSync(absoluteFilePath);

      if (stats.isDirectory()) {
        // Obtiene todas las rutas de archivos .md en el directorio
        const directoryFiles = getDirectoryFiles(absoluteFilePath);
        // Filtra para obtener solo los archivos .md
        const mdDirectoryFiles = directoryFiles.filter(file => path.extname(file) === '.md');
        // Arreglo para almacenar todos los enlaces
        const allLinks = [];

        // Recorre cada archivo .md en el directorio
        for (let i = 0; i < mdDirectoryFiles.length; i++) {

          const markdownFilePath = mdDirectoryFiles[i];
          // Lee el contenido del archivo
          const markdownContent = fs.readFileSync(mdDirectoryFiles[i], 'utf8');
          // Obtiene los enlaces del contenido
          const links = getLinksFromMarkdownContent(markdownContent);

          // Realiza la validación de los enlaces si se solicita
          if (options.validate) {
            links.forEach(link => {
              validateLink(link)
                .then(validatedLink => {
                  if (validatedLink.ok === 'fail') {
                    brokenLinks.push({
                      ...validatedLink,
                      file: markdownFilePath,
                    });
                  }
                })
                .catch(error => reject(error));
            });
          }


          const linksWithFilePath = links.map(link => ({
            href: link.href,
            text: link.text,
            file: markdownFilePath, // Aquí asigna la ruta absoluta al archivo
          }));

          // Agrega los enlaces al arreglo general
          allLinks.push(...linksWithFilePath);
        }

        // Construye el resultado con los enlaces recopilados
        const result = {
          total: allLinks.length,
          unique: new Set(allLinks.map(link => link.href)).size,
          links: allLinks,
        };

        let brokenLinks = []; 

        if (options.stats && options.validate) {
          result.broken = brokenLinks.length;
        }

        // Resuelve la promesa con el resultado
        resolve(result);
      } else if (stats.isFile() && path.extname(absoluteFilePath) === '.md') {
        // Lee el contenido del archivo .md
        const markdownContent = fs.readFileSync(absoluteFilePath, 'utf8');
        // Obtiene los enlaces del contenido
        const links = getLinksFromMarkdownContent(markdownContent);

        if (options.validate) {
          // Realiza la validación de los enlaces
          const linkPromises = links.map(link =>
            validateLink(link).then(validatedLink => ({
              ...validatedLink,
              file: absoluteFilePath,
            }))
          );

          // Resuelve todas las promesas de validación
          Promise.all(linkPromises)
            .then(validatedLinks => {
              // Construye el resultado con los enlaces validados
              const result = {
                total: validatedLinks.length,
                unique: new Set(validatedLinks.map(link => link.href)).size,
                links: validatedLinks,
              };

              // Si se solicitan estadísticas, calcula los enlaces rotos
              if (options.stats) {
                result.broken = validatedLinks.filter(link => link.ok === 'fail').length;
              }

              // Resuelve la promesa con el resultado
              resolve(result);
            })
            .catch(error => reject(error));
        } else {
          // Construye el resultado con los enlaces no validados
          const result = {
            total: links.length,
            unique: new Set(links.map(link => link.href)).size,
            links: links.map(link => ({
              ...link,
              file: absoluteFilePath,
            })),
          };

          resolve(result);
        }

      } else {
        resolve([]);
      }
      
    } catch (error) {
      reject(error);
    }
  });
}






module.exports = {
  mdlink,
  getLinksFromMarkdownContent,
  convertToAbsolutePath,
  validateLink,
  getDirectoryFiles,
};



