const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { mdlink, getLinksFromMarkdownContent, convertToAbsolutePath, validateLink, getDirectoryFiles } = require('../mdlink');
jest.mock('axios');
jest.mock('path');
jest.mock('fs');


describe('mdlink function', () => {
  beforeEach(() => {
    // Mockear la respuesta de fs.statSync para devolver un directorio
    fs.statSync.mockReturnValue({ isDirectory: jest.fn().mockReturnValue(true) });

    // Mockear fs.readFileSync para devolver el contenido del markdown
    fs.readFileSync.mockReturnValue('Your markdown content here');

    // Espiar en getLinksFromMarkdownContent para devolver un enlace
    const markdownContent = 'https://curriculum.laboratoria.la/es/topics/javascript/04-arrays'
    jest.spyOn(getLinksFromMarkdownContent, markdownContent).mockReturnValue([
      { href: 'https://curriculum.laboratoria.la/es/topics/javascript/04-arrays', text: 'Arreglos' },
    ]);

    // Mockear axios.get para devolver una respuesta exitosa
    axios.get.mockResolvedValue({ status: 200 });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should process markdown files in a directory', () => {
    // Mockear la respuesta de path.isAbsolute y path.resolve
    path.isAbsolute.mockReturnValue(true);
    path.resolve.mockReturnValue('C:/Users/danie/OneDrive/Escritorio/Laboratoria/DEV008-md-links/test/files');


    // Mockear la respuesta de fs.readdirSync
    const mockDirectoryFiles = [
      'C:/Users/danie/OneDrive/Escritorio/Laboratoria/DEV008-md-links/test/files/leer.md',
      'C:/Users/danie/OneDrive/Escritorio/Laboratoria/DEV008-md-links/test/files/leer2.md'
    ];
    fs.readdirSync.mockReturnValue(mockDirectoryFiles);

    // Mockear la respuesta de path.extname
    path.extname.mockReturnValue('.md');

    // Llamada a la función mdlink
    const result = mdlink('C:/Users/danie/OneDrive/Escritorio/Laboratoria/DEV008-md-links/test/files', {});

    // Comprobar los resultados esperados
    expect(result.total).toBe(2);
    expect(result.unique).toBe(1);
    expect(result.links).toEqual([
      { href: 'https://curriculum.laboratoria.la/es/topics/javascript/04-arrays', text: 'Arreglos', file: 'C:/Users/danie/OneDrive/Escritorio/Laboratoria/DEV008-md-links/test/files/leer.md' },
      { href: 'https://curriculum.laboratoria.la/es/topics/javascript', text: 'Arreglos2', file: 'C:/Users/danie/OneDrive/Escritorio/Laboratoria/DEV008-md-links/test/files/leer2.md' },
    ]);

    // Verificar llamadas a funciones espiadas
    expect(fs.readFileSync).toHaveBeenCalledTimes(2);
    expect(getLinksFromMarkdownContent.getLinksFromMarkdownContent).toHaveBeenCalledTimes(2);
  });

  // Otras pruebas...

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
    mockReaddirSync
      .mockReturnValueOnce(['file1.txt', 'subdirectory'])
      .mockReturnValueOnce(['file2.txt'])
      .mockReturnValueOnce([]);

    // Mockear la respuesta de fs.statSync
    mockStatSync
      .mockReturnValueOnce({ isFile: jest.fn().mockReturnValue(true) })
      .mockReturnValueOnce({ isDirectory: jest.fn().mockReturnValue(true) })
      .mockReturnValueOnce({ isFile: jest.fn().mockReturnValue(true) });

    // Llamada a la función getDirectoryFiles
    const result = getDirectoryFiles('/path/to/directory');

    // Ajusta esto según las rutas reales esperadas
    expect(result).toEqual(['/path/to/directory/file1.txt', '/path/to/directory/subdirectory/file2.txt']);
  });
});
