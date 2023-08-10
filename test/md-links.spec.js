const { getLinksFromMarkdownContent, convertToAbsolutePath,validateLink } = require('../mdlink');
const axios = require('axios');
const path = require('path');


// Mockear Axios
jest.mock('axios');

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
    const relativePath = 'test/files/contenido.txt';
    const expectedAbsolutePath = path.resolve(process.cwd(), relativePath);

    const absolutePath = convertToAbsolutePath(relativePath);

    expect(absolutePath).toEqual(expectedAbsolutePath);
  });

  test('should keep absolute path unchanged', () => {
    const absolutePath = 'C:/Users/danie/OneDrive/Escritorio/Laboratoria/DEV008-md-links/test/files/contenido.txt';

    const result = convertToAbsolutePath(absolutePath);

    expect(result).toEqual(absolutePath);
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