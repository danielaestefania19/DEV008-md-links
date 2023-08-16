const { mdlink } = require('./mdlink');

const [,, filePath, validateOption] = process.argv;

const options = {
  validate: validateOption === '--validate',
};

if (!filePath) {
  console.error('Debes proporcionar la ruta del archivo Markdown como argumento.');
} else {
  mdlink(filePath, options)
    .then((links) => {
      console.log('Enlaces encontrados:', links);
    })
    .catch((error) => {
      console.error('Error:', error.message);
    });
}
