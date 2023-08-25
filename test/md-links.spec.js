const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { mdlink, getLinksFromMarkdownContent, convertToAbsolutePath,validateLink,getDirectoryFiles } = require('../mdlink');
jest.mock('axios');

const filePath = 'test/files';

const stats = fs.statSync(filePath);
//console.log(stats.isDirectory());

jest.spyOn(fs, 'statSync').mockImplementation((filePath) => {
  //console.log(filePath);
  if (fs.existsSync(filePath)) {
    const fileInfo = {
      isDirectory: () => fs.lstatSync(filePath).isDirectory(),
      isFile: () => fs.lstatSync(filePath).isFile(),
    };
    // console.log('isDirectory:', fileInfo.isDirectory());
    // console.log('isFile:', fileInfo.isFile());
    return {
      isDirectory: () => fs.lstatSync(filePath).isDirectory(),
      isFile: () => fs.lstatSync(filePath).isFile(),
    };
  } else {
    throw new Error(`File not found: ${filePath}`);
  }
  
});



// jest.spyOn(path, 'extname').mockImplementation((filePath) => {
//   if (filePath.endsWith('.md')) {
//     return '.md';
//   } else if (filePath.endsWith('.txt')) {
//     return '.txt';
//   } else {
//     return '';
//   }
// });

 
describe('mdlink function', () => {
  it('should process a single markdown file without validation', (done) => {
    const filePath = 'test/files/leer.md'; // Update the path accordingly
    const options = { validate: false };

    const customFunctions = {
      fs: {
        statSync: () => ({ isFile: () => true, isDirectory: () => false }), // Mock for file
      },
      path: path,
    };

    mdlink(filePath, options, customFunctions).then(result => {
      expect(result.total).toBe(3); // Adjust expected values
      expect(result.unique).toBe(3); // Adjust expected values
      done();
    }).catch(error => {
      done(error);
    });
  });

  it('should process a single markdown file with validation', (done) => {
    const filePath = path.join('test/files/leer.md'); // Update the path accordingly
    const options = { validate: true };

    const mockValidatedLink = {
      href: 'https://curriculum.laboratoria.la/es/topics/javascript/04-arrays',
      text: 'Arreglos',
      status: 200,
      ok: 'ok',
    };
    const mockValidateLink = jest.fn(() => Promise.resolve(mockValidatedLink));

    mdlink(filePath, options, { validateLink: mockValidateLink }).then(result => {
      expect(result.total).toBe(3); // Adjust expected values
      expect(result.unique).toBe(3); // Adjust expected values
      expect(result.links[0].status).toBe(200); // Adjust expected values
      done();
    }).catch(error => {
      done(error);
    });
  });

  it('should process a single markdown file with validation and handle link validation errors', (done) => {
    const filePath = path.join(__dirname, 'files', 'leer.md');
    const options = { validate: true };

    const mockInvalidLink = {
      href: 'https://invalid-link.com',
      text: 'Invalid Link',
    };
    const mockValidateLink = jest.fn(() => Promise.reject(new Error('Validation Error')));

    mdlink(filePath, options, { validateLink: mockValidateLink })
      .then(result => {
        expect(result.total).toBe(3);
        expect(result.links[0].ok).toBe('fail');
        done();
      })
      .catch(error => {
        done(error);
      });
  });

  it('should handle processing a non-markdown file', (done) => {
    const filePath = path.join(__dirname, 'files', 'contenido.txt');
    const options = { validate: false };

    mdlink(filePath, options)
      .then(result => {
        expect(result.total).toBe(0);
        done(0);
      })
      .catch(error => {
        done(error);
      });
  });

  it('should handle processing a non-existent file', (done) => {
    const filePath = path.join(__dirname, 'files', 'non-existent.md');
    const options = { validate: false };

    mdlink(filePath, options)
      .then(result => {
        expect(result.total).toBe(0);
        done();
      })
      .catch(error => {
        done(error);
      });
  });

  // Add more tests as needed
});



