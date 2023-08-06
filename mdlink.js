const fs = require('fs');
const path = require('path');

function getLinksFromMarkdownContent(markdownContent) {
  // Expresión regular para encontrar los enlaces en el contenido del archivo Markdown
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  const links = [];

  let match;
  while ((match = linkRegex.exec(markdownContent))) {
    const [, text, url] = match;
    links.push({ href: url, text, });
  }

  return links;
}

function convertToAbsolutePath(file) {
  if (!path.isAbsolute(file)) {
    return path.resolve(process.cwd(), file);
  }
  return file;
}

module.exports = (file) => {
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
      const links = getLinksFromMarkdownContent(markdownContent);

       // Agregar la ruta absoluta del archivo a cada objeto de enlace
       const linksWithAbsolutePath = links.map((link) => ({
        ...link,
        file: absoluteFilePath,
      }));

      resolve(linksWithAbsolutePath);
    } catch (error) {
      reject(error);
    }
  });
};

