const mdLinks = require('./mdlink');

// Obtener el argumento pasado al ejecutar el script (debe ser el nombre y ruta del archivo)
const [,, filePath] = process.argv;

if (!filePath) {
  console.error('Debes proporcionar la ruta del archivo Markdown como argumento.');
} else {
  mdLinks(filePath)
    .then((links) => {
      console.log('Enlaces encontrados:', links);
    })
    .catch((error) => {
      console.error('Error:', error.message);
    });
}
