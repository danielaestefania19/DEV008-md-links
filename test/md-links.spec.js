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
      // Prueba para verificar si la función mdlink se está ejecutando sin errores
      it('should run without errors', () => {
        expect(() => {
          mdlink('test/file.md', {});
        }).not.toThrow();
      });

      // Prueba para verificar si la función mdlink resuelve un resultado esperado
  it('should resolve with expected result', () => {
    const expected = {
      total: 0,
      unique: 0,
      links: [],
    };

    return mdlink('test/file/leer.md', {}).then(result => {
      expect(result).toEqual(expected);
    });
  });

  test('should process a single markdown file with validation', () => {
    const filePath = 'test/files/leer.md';
    const options = { validate: true };

      // Lee el contenido real del archivo
      const markdownContent = fs.readFileSync(filePath, 'utf8');
      const links = getLinksFromMarkdownContent(markdownContent);
  
      // Mockea axios.get para simular respuestas de validación
      axios.get.mockImplementation(link => {
        const foundLink = links.find(l => l.href === link);
        if (foundLink) {
          return Promise.resolve({ status: 200 });
        } else {
          return Promise.reject({ response: { status: 404 } });
        }
      });
  
      // Ejecuta la función mdlink con la función de validación simulada
    return mdlink(filePath, options).then(result => {
      // Realiza las aserciones pertinentes sobre 'result'
      expect(result.total).toBe(links.length);
      expect(result.unique).toBe(new Set(links.map(link => link.href)).size);
       expect(result.links.every(link => link.ok === 'ok')).toBe(true);  // Asegura que la validación haya ocurrido
    });
});

it('should reject with error for invalid file format', () => {
  const filePath = 'test/files/contenido.txt'; // Cambia la ruta al archivo .txt no válido
  const options = {};

  return mdlink(filePath, options).catch(error => {
    expect(error.message).toContain('El archivo proporcionado no es un archivo Markdown (.md).');
  });
});

it('should reject with error for non-existent file', () => {
  const filePath = 'test/files/nonexistent.md'; // Cambia la ruta a un archivo que no existe
  const options = {};

  return mdlink(filePath, options).catch(error => {
    expect(error.message).toContain('File not found');
  });
});

it('should not include non-Markdown files in directory results', () => {
  const directoryPath = 'test/vacio'; // Cambia la ruta al directorio que contiene archivos no Markdown
  const options = {};

  return mdlink(directoryPath, options).then(result => {
    // Verifica que los archivos no Markdown no estén incluidos en los resultados
    const nonMarkdownFiles = result.links.filter(link => !link.file.endsWith('.md'));
    expect(nonMarkdownFiles.length).toBe(0);
  });
});
it('should handle directory with markdown files and validate links', () => {
  const options = { validate: true };
  return mdlink('test/file', options).then(result => {
    expect(result.total).toBe(0); // Update with the actual number of links
    expect(result.unique).toBe(0); // Update with the actual number of unique links
    expect(result.links.length).toBe(0); // Update with the actual number of links
    expect(result.broken).toBe(0); // Update with the actual number of broken links
  });
});

it('should handle single markdown file and not validate links', () => {
  const options = { validate: false };
  return mdlink('test/file/leer.md', options).then(result => {
    expect(result.total).toBe(0); // Update with the actual number of links
    expect(result.unique).toBe(0); // Update with the actual number of unique links
    expect(result.links.length).toBe(0); // Update with the actual number of links
  });
});

it('should handle single markdown file and validate links', () => {
  const options = { validate: true };
  return mdlink('test/file/leer.md', options).then(result => {
    expect(result.total).toBe(0); // Update with the actual number of links
    expect(result.unique).toBe(0); // Update with the actual number of unique links
    expect(result.links.length).toBe(0); // Update with the actual number of links
    expect(result.broken).toBe(0); // Update with the actual number of broken links
  });
});

it('should reject with error for invalid file format', () => {
  const options = { validate: false };
  return mdlink('test/file.txt', options).catch(error => {
    expect(error.message).toBe('El archivo proporcionado no es un archivo Markdown (.md).');
  });
});

it('should reject with error for non-existent file', () => {
  const options = { validate: false };
  return mdlink('test/nonexistent.md', options).catch(error => {
    expect(error.message).toBe('No se encontró el archivo o directorio.');
  });
});
it('should process directory and return links without validation', () => {
  const options = {
    validate: false,
  };
  const expected = {
    total: 3,
    unique: 3,
    links: [
      {
        href: 'https://example.com/link1',
        text: 'Link 1',
        file: 'path/to/file1.md',
      },
      {
        href: 'https://example.com/link2',
        text: 'Link 2',
        file: 'path/to/file2.md',
      },
      {
        href: 'https://example.com/link3',
        text: 'Link 3',
        file: 'path/to/file3.md',
      },
    ],
  };

  return mdlink('test/files', options).then(result => {
    expect(result).toEqual(expected);
  });
});


it('should process directory and return links with validation', () => {
  const options = {
    validate: true,
  };
  const expected = {
    total: 6,
    unique: 6,
    links: [
      {
        href: 'https://curriculum.laboratoria.la/es/topics/javascript',
        text: 'Arreglos2',
        status: 200,
        ok: 'ok',
        file: 'C:\\Users\\danie\\OneDrive\\Escritorio\\Laboratoria\\DEV008-md-links\\test\\files\\leer2.md'
      },
      {
        href: 'https://developer.mozilla.org/es/docs/Web/JavaScript/Reference',
        text: 'Array2 - MDN',
        status: 200,
        ok: 'ok',
        file: 'C:\\Users\\danie\\OneDrive\\Escritorio\\Laboratoria\\DEV008-md-links\\test\\files\\leer2.md'
      },
      {
        href: 'https://curriculum.laboratoria.la/es/topics/javascript/04-arrays',
        text: 'Arreglos',
        status: 200,
        ok: 'ok',
        file: 'C:\\Users\\danie\\OneDrive\\Escritorio\\Laboratoria\\DEV008-md-links\\test\\files\\leer.md'
      },
      {
        href: 'https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Array/',
        text: 'Array - MDN',
        status: 200,
        ok: 'ok',
        file: 'C:\\Users\\danie\\OneDrive\\Escritorio\\Laboratoria\\DEV008-md-links\\test\\files\\leer.md'
      },
      {
        href: 'https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Array/sort',
        text: 'Array.prototype.sort() - MDN',
        status: 200,
        ok: 'ok',
        file: 'C:\\Users\\danie\\OneDrive\\Escritorio\\Laboratoria\\DEV008-md-links\\test\\files\\leer.md'
      }
    ],
    broken: 4, // Cambia esto según la cantidad de enlaces rotos esperados
  };

  return mdlink('test/files', options).then(result => {
    expect(result).toEqual(expected);
  });
});

test('should process a markdown file without validation', () => {
  const options = { validate: false };
  const filePath = 'test/files/leer.md';
  const expected = {
    total: 3,
    unique: 3,
    links: [
      { href: 'https://curriculum.laboratoria.la/es/topics/javascript/04-arrays', text: 'Arreglos', file: filePath },
      { href: 'https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Array/', text: 'Array - MDN', file: filePath },
      { href: 'https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Array/sort', text: 'Array.prototype.sort() - MDN', file: filePath },
    ],
  };

  return mdlink(filePath, options).then(result => {
    expect(result).toEqual(expected);
  });
});


});


 
 
describe('getLinksFromMarkdownContent', () => {
  it('should extract links from markdown content', () => {
    const markdownContent = '[Link 1](https://example.com) [Link 2](https://google.com)';
    const links = getLinksFromMarkdownContent(markdownContent);
    expect(links.length).toBe(2);
    expect(links[0].href).toBe('https://example.com');
    expect(links[0].text).toBe('Link 1');
    expect(links[1].href).toBe('https://google.com');
    expect(links[1].text).toBe('Link 2');
  });

  it('should handle no links in markdown content', () => {
    const markdownContent = 'No links here.';
    const links = getLinksFromMarkdownContent(markdownContent);
    expect(links.length).toBe(0);
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
  