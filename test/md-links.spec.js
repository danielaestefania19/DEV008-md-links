const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { mdlink, getLinksFromMarkdownContent, convertToAbsolutePath,validateLink,getDirectoryFiles } = require('../mdlink');
jest.mock('axios');

jest.spyOn(fs, 'statSync').mockImplementation((filePath) => {
  if (fs.existsSync(filePath)) {
    return {
      isDirectory: () => fs.lstatSync(filePath).isDirectory(),
      isFile: () => fs.lstatSync(filePath).isFile(),
    };
  } else {
    throw new Error(`File not found: ${filePath}`);
  }
});


jest.spyOn(path, 'extname').mockImplementation((filePath) => {
  if (filePath.endsWith('.md')) {
    return '.md';
  } else if (filePath.endsWith('.txt')) {
    return '.txt';
  } else {
    return '';
  }
});

 
describe('mdlink function', () => {
  it('should process a single markdown file without validation', (done) => {
    const filePath = 'test\files\leer.md'; // Update the path accordingly
    const options = { validate: false };

    const customFunctions = {
      fs: {
        statSync: () => ({ isFile: () => true, isDirectory: () => false }), // Mock for file
      },
      path: path,
    };

    mdlink(filePath, options, customFunctions).then(result => {
      expect(result.total).toBe(0); // Adjust expected values
      expect(result.unique).toBe(0); // Adjust expected values
      done();
    }).catch(error => {
      done(error);
    });
  });

  it('should process a single markdown file with validation', (done) => {
    const filePath = path.join('test\files\leer.md'); // Update the path accordingly
    const options = { validate: true };

    const mockValidatedLink = {
      href: 'https://example.com',
      text: 'Example',
      status: 200,
      ok: 'ok',
    };
    const mockValidateLink = jest.fn(() => Promise.resolve(mockValidatedLink));

    mdlink(filePath, options, { validateLink: mockValidateLink }).then(result => {
      expect(result.total).toBe(0); // Adjust expected values
      expect(result.unique).toBe(0); // Adjust expected values
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
        done();
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



describe('getLinksFromMarkdownContent', () => {
  test('should extract links from markdown content', () => {
    const markdownContent = '[GitHub](https://github.com)';
    const expectedLinks = [{ href: 'https://github.com', text: 'GitHub' }];
    const axiosResponse = { status: 200 };
    // Mockear la llamada a axios.get con un valor de respuesta simulado
    axios.get.mockResolvedValue(axiosResponse);
    const links = getLinksFromMarkdownContent(markdownContent);
    expect(links).toEqual(expectedLinks);
  });
  test('should handle no links in markdown content', () => {
    const markdownContent = 'This is some plain text.';
    const links = getLinksFromMarkdownContent(markdownContent);
    expect(links).toEqual([]);
  });
});
describe('convertToAbsolutePath', () => {
  test('should convert relative path to absolute path', () => {
    const relativePath = 'test/files/leer.md';
    const expectedAbsolutePath = path.resolve(relativePath);
    const absolutePath = convertToAbsolutePath(relativePath);
    expect(absolutePath).toEqual(expectedAbsolutePath);
  });
  test('should keep absolute path unchanged', () => {
    const relativePath = 'test/files/leer.md';
    const expectedAbsolutePath = path.resolve(relativePath);
    const result = convertToAbsolutePath(expectedAbsolutePath);
    expect(result).toEqual(expectedAbsolutePath);
  });
});
describe('validateLink', () => {
  test('should validate link with successful response', () => {
    const link = { href: 'https://example.com', text: 'Example' };
    const response = { status: 200 };
    axios.get.mockResolvedValue(response);
    return validateLink(link).then(result => {
      expect(result).toEqual({ ...link, status: 200, ok: 'ok' });
    });
  });
  test('should validate link with error response', () => {
    const link = { href: 'https://example.com', text: 'Example' };
    const error = { response: { status: 404 } };
    axios.get.mockRejectedValue(error);
    return validateLink(link).then(result => {
      expect(result).toEqual({ ...link, status: 404, ok: 'fail' });
    });
  });
  test('should validate link with unknown error', () => {
    const link = { href: 'https://example.com', text: 'Example' };
    const error = { message: 'Some error occurred' };
    axios.get.mockRejectedValue(error);
    return validateLink(link).then(result => {
      expect(result).toEqual({ ...link, status: 'Unknown', ok: 'fail' });
    });
  });
});


jest.mock('fs');

describe('getDirectoryFiles', () => {
  const mockReaddirSync = jest.fn();
  const mockStatSync = jest.fn();

  // Simulación de las funciones del módulo fs
  jest.spyOn(require('fs'), 'readdirSync').mockImplementation(mockReaddirSync);
  jest.spyOn(require('fs'), 'statSync').mockImplementation(mockStatSync);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return an empty array when given an empty directory', () => {
    mockReaddirSync.mockReturnValueOnce([]);
    
    const result = getDirectoryFiles('/path/to/empty/directory');

    expect(result).toEqual([]);
  });

  it('should return an array of file paths', () => {
    // Configura los mocks para simular la estructura de archivos y directorios
    mockReaddirSync.mockReturnValueOnce(['file1.txt', 'subdirectory']);
    mockStatSync
      .mockReturnValueOnce({ isFile: () => true })
      .mockReturnValueOnce({ isDirectory: () => true });

    // Define las respuestas de los mocks para los subdirectorios
    mockReaddirSync
      .mockReturnValueOnce(['file2.txt'])
      .mockReturnValueOnce([]);

    const result = getDirectoryFiles('/path/to/directory');

    // Ajusta esto según las rutas reales esperadas
    expect(result).toEqual(['/path/to/directory/file1.txt', '/path/to/directory/subdirectory/file2.txt']);
  });
});