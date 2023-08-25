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
  const items = fs.readdirSync(targetPath);
  const rutas = [];

  const processItem = (index) => {
    if (index >= items.length) {
      return rutas;
    }

    const item = items[index];
    const itemPath = path.join(targetPath, item);
    const stats = fs.statSync(itemPath);

    if (stats.isFile()) {
      console.log('Estoy aqui soy isFile', stats.isFile());
      rutas.push(itemPath);
      return processItem(index + 1);
    } else if (stats.isDirectory()) {
      console.log('Estoy aqui soy isDirectory ', stats.isDirectory);
      const tempRoutes = getDirectoryFiles(itemPath); // Llamada recursiva con itemPath
      rutas.push(...tempRoutes);
      return processItem(index + 1);
    }
  };

  processItem(0);
  return rutas;
}



function mdlink(file, options, customFunctions = {}) {
  const { fs: customFs = fs, path: customPath = path } = customFunctions;
  
  return new Promise((resolve, reject) => {
    try {
      // Convierte la ruta relativa a absoluta
      const absoluteFilePath = convertToAbsolutePath(file);
      //console.log('Absolute File Path:', absoluteFilePath);
            
      // Obtiene las estadísticas del archivo o directorio
      const stats = customFs.statSync(absoluteFilePath);
      //console.log('Stats:', stats);
      //console.log('Estoy aqui soy yo', stats.isDirectory);
      if (stats.isDirectory()) {
        const directoryFiles = getDirectoryFiles(absoluteFilePath); // Cambio: No usar Promesa aquí
        const mdDirectoryFiles = directoryFiles.filter(file => path.extname(file) === '.md');
        const allLinks = [];

        const processFile = (index) => {
          if (index >= mdDirectoryFiles.length) {
            const result = {
              total: allLinks.length,
              unique: new Set(allLinks.map(link => link.href)).size,
              links: allLinks,
            };

            if (options.stats) {
              // Calcular los enlaces rotos
              result.broken = allLinks.filter(link => link.ok === 'fail').length;
            }
            resolve(result);
            return;
          }

          const markdownFilePath = mdDirectoryFiles[index];
          const markdownContent = fs.readFileSync(markdownFilePath, 'utf8');
          const links = getLinksFromMarkdownContent(markdownContent);

          const linksWithFilePath = links.map(link => ({
            href: link.href,
            text: link.text,
            file: markdownFilePath,
          }));

          allLinks.push(...linksWithFilePath);

          processFile(index + 1);
        };

        processFile(0);
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
                // Calcula los enlaces rotos independientemente de options.stats
                
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



