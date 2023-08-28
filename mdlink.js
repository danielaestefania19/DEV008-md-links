const path = require("path");
const fs = require("fs");
const axios = require("axios");

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
    .then((response) => {
      // console.log(
      //   `Request to ${link.href} successful. Status code: ${response.status}`
      // );
      return {
        ...link,
        status: response.status,
        ok: "ok",
      };
    })
    .catch((error) => {
      // console.error(`Error making request to ${link.href}:`, error.message);
      return {
        ...link,
        status: error.response ? error.response.status : "Unknown",
        ok: "fail",
      };
    });
}

/* function getDirectoryFiles(targetPath, rutas = []) {
  const items = fs.readdirSync(targetPath);

  items.forEach(item => {
    const itemPath = path.join(targetPath, item);
    const stats = fs.statSync(itemPath);

    if (stats.isFile()) {
      rutas.push(itemPath);
    } else if (stats.isDirectory()) {
      const tempRoutes = getDirectoryFiles(itemPath, rutas); // Llamada recursiva con itemPath
      rutas = [...rutas, ...tempRoutes]; // Concatena las rutas devueltas por la llamada recursiva
    }
  });
  console.log('rutas', rutas);
  return rutas; // Devuelve las rutas actualizadas en cada nivel de recursión
} */

function getDirectoryFiles(targetPath) {
  const items = fs.readdirSync(targetPath);
  if (!Array.isArray(items)) {
    return []; // Si no es un arreglo válido, regresa un arreglo vacío
  }

  let rutas = []; // Almacena las rutas para este nivel

  items.forEach((item) => {
    const itemPath = path.join(targetPath, item);
    const stats = fs.statSync(itemPath);

    if (stats.isFile()) {
      rutas.push(itemPath);
    } else if (stats.isDirectory()) {
      const tempRoutes = getDirectoryFiles(itemPath); // Llamada recursiva con itemPath
      rutas = [...rutas, ...tempRoutes]; // Concatena las rutas devueltas por la llamada recursiva
    }
  });
  return rutas; // Devuelve las rutas actualizadas en cada nivel de recursión
}

function mdlink(file, options) {
  return new Promise((resolve, reject) => {
    try {
      const absoluteFilePath = convertToAbsolutePath(file);
      const stats = fs.statSync(absoluteFilePath);

      if (stats.isDirectory()) {
        const directoryFiles = getDirectoryFiles(absoluteFilePath);

        const promiseArray = directoryFiles.map((markdownFilePath) =>
          mdlink(markdownFilePath, options)
        );

        Promise.all(promiseArray)
          .then((results) => {
            const allLinks = [];
            const brokenLinks = [];

            for (const result of results) {
              if (options.validate) {
                brokenLinks.push(...(result.brokenLinks || []));
              }
              allLinks.push(...(result.links || []));
            }

            const finalResult = {
              total: allLinks.length,
              unique: new Set(allLinks.map((link) => link.href)).size,
              links: allLinks,
            };

            if (options.validate) {
              finalResult.broken = brokenLinks.length;
              finalResult.brokenLinks = brokenLinks;
            }

            resolve(finalResult);
          })
          .catch((error) => {
            reject(error);
          });
      } else if (stats.isFile() && path.extname(absoluteFilePath) === ".md") {
        // Lee el contenido del archivo .md
        const markdownContent = fs.readFileSync(absoluteFilePath, "utf8");
        // Obtiene los enlaces del contenido
        const links = getLinksFromMarkdownContent(markdownContent);

        if (options.validate) {
          // Realiza la validación de los enlaces
          const linkPromises = links.map((link) =>
            validateLink(link).then((validatedLink) => ({
              ...validatedLink,
              file: absoluteFilePath,
            }))
          );

          // Resuelve todas las promesas de validación
          Promise.all(linkPromises)
            .then((validatedLinks) => {
              // Construye el resultado con los enlaces validados
              const result = {
                total: validatedLinks.length,
                unique: new Set(validatedLinks.map((link) => link.href)).size,
                links: validatedLinks,
                brokenLinks: validatedLinks.filter((link) => link.ok === "fail"),
              };

              resolve(result);
            })
            .catch((error) => reject(error));
        } else {
          // Construye el resultado con los enlaces no validados
          const result = {
            total: links.length,
            unique: new Set(links.map((link) => link.href)).size,
            links: links.map((link) => ({
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
