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
    return path.resolve(process.cwd(), file);
  }
  return file;
}

//Función valida un enlace al realizar una solicitud HTTP
function validateLink(link) {
  return axios.get(link.href)
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

module.exports = (file, options) => {
  return new Promise((resolve, reject) => {
    try {
      // Verificar si el archivo es de tipo .md
      if (path.extname(file) !== '.md') {
        throw new Error('El archivo proporcionado no tiene extensión .md');
      }

      // Convertir la ruta relativa a absoluta antes de analizar el archivo
      const absoluteFilePath = convertToAbsolutePath(file);
      console.log('Ruta absoluta:', absoluteFilePath);

      // Verificar si el archivo existe
      if (!fs.existsSync(absoluteFilePath)) {
        throw new Error('El archivo proporcionado no existe.');
      }

      // Leer el contenido del archivo Markdown
      const markdownContent = fs.readFileSync(absoluteFilePath, 'utf8');

      // Extraer los enlaces del contenido del archivo Markdown
      let links = getLinksFromMarkdownContent(markdownContent);

      if (options && options.validate) {
        // Realizar validación para cada enlace
        const linkPromises = links.map((link) => validateLink(link).then((validatedLink) => ({
          ...validatedLink,
          file: absoluteFilePath,
        })));
        Promise.all(linkPromises)
          .then((validatedLinks) => resolve(validatedLinks))
          .catch((error) => reject(error));
      } else {
        // Agregar la ruta absoluta del archivo a cada objeto de enlace
        links = links.map((link) => ({
          ...link,
          file: absoluteFilePath,
        }));
        resolve(links);
      }
    } catch (error) {
      reject(error);
    }
  });
};


module.exports = { getLinksFromMarkdownContent, convertToAbsolutePath, validateLink };
