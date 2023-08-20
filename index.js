const { mdlink } = require('./mdlink');

const [, , filePath, ...options] = process.argv;

const parsedOptions = {
  validate: options.includes('--validate'),
};

if (!filePath) {
  console.error('Debes proporcionar la ruta del archivo Markdown como argumento.');
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




