const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { mdlink, getLinksFromMarkdownContent, convertToAbsolutePath,validateLink,getDirectoryFiles } = require('../mdlink');

jest.mock('axios');
jest.mock('fs');
jest.mock('path');

// Configuración de los mocks para fs.statSync
const mockStats = {
  isFile: () => false,
  isDirectory: () => false,
};

jest.spyOn(fs, 'statSync').mockImplementation((filePath) => {
  if (fs.existsSync(filePath)) {
    return mockStats;
  } else {
    throw new Error(`File not found: ${filePath}`);
  }
});

// Configuración de los mocks para path.extname
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
  beforeEach(() => {
    // Mocks específicos para cada prueba
    fs.statSync.mockReturnValue({ isFile: () => true, isDirectory: () => false });
    path.extname.mockReturnValue('.md');
  });

  afterEach(() => {
    // Limpia los mocks después de cada prueba
    jest.restoreAllMocks();
  });

  test('should process a single markdown file without validation', (done) => {
    // Define los argumentos de entrada para la función mdlink
    const filePath = 'test\files\leer.md'; 
    const options = { validate: false };

    // Ejecuta la función mdlink
    mdlink(filePath, options)
      .then(result => {
        // Realiza las aserciones pertinentes sobre 'result'
        expect(result.total).toBe(0); 
        expect(result.unique).toBe(0); 
        done();
      })
      .catch(error => {
        done(error);
      });
  });

  test('should process a single markdown file with validation', (done) => {
    // Simula la función de validación de enlaces
    const mockValidatedLink = { href: 'https://example.com', text: 'Example' };
    const mockValidateLink = jest.fn(() => Promise.resolve({ ...mockValidatedLink, status: 200, ok: 'ok' }));
    const customFunctions = { validateLink: mockValidateLink };

    // Ejecuta la función mdlink
    mdlink('test\files\leer.md', { validate: true }, customFunctions)
      .then(result => {
        // Realiza las aserciones pertinentes sobre 'result' y la función de validación
        expect(result.total).toBe(0); 
        expect(result.unique).toBe(0); 
        expect(mockValidateLink).toHaveBeenCalledTimes(0); 
        done();
      })
      .catch(error => {
        done(error);
      });
  });

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
  // const mockReaddirSync = jest.fn();
  // const mockStatSync = jest.fn();
  // Simulación de las funciones del módulo fs
  //jest.spyOn(require('fs'), 'readdirSync').mockImplementation(mockReaddirSync);
  // jest.spyOn(require('fs'), 'statSync').mockImplementation(mockStatSync);
  // afterEach(() => {
  //   jest.clearAllMocks();
  // });
  it('should return an empty array when given an empty directory', () => {
    const files = [];
    // mockReaddirSync.mockReturnValueOnce([]);
    const ruta = convertToAbsolutePath('C:\\Users\\danie\\OneDrive\\Escritorio\\Laboratoria\\DEV008-md-links\\test\\files\\leer.md');
    expect(ruta).toEqual([]);
    const result = getDirectoryFiles('C:\\Users\\danie\\OneDrive\\Escritorio\\Laboratoria\\DEV008-md-links\\test\\files');
    expect(result).toEqual(files);
  });
  it('should return an array of file paths', () => {
    // Configura los mocks para simular la estructura de archivos y directorios
    // mockReaddirSync.mockReturnValueOnce(['file1.txt', 'subdirectory']);
    // mockStatSync
    //   .mockReturnValueOnce({ isFile: () => true })
    //   .mockReturnValueOnce({ isDirectory: () => true });
    // // Define las respuestas de los mocks para los subdirectorios
    // mockReaddirSync//
    //C:\Users\danie\OneDrive\Escritorio\Laboratoria\DEV008-md-links\test\files
    //C:\Users\danie\OneDrive\Escritorio\Laboratoria\DEV008-md-links\test\files
    //   .mockReturnValueOnce(['file2.txt'])
    //   .mockReturnValueOnce([]);
    //const result = getDirectoryFiles('/path/to/directory');
    // Ajusta esto según las rutas reales esperadas
   // expect(result).toEqual(['/path/to/directory/file1.txt', '/path/to/directory/subdirectory/file2.txt']);
  });
});