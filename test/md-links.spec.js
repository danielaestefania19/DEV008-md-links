const fs = require("fs");
const path = require("path");
const axios = require("axios");
const {
  mdlink,
  getLinksFromMarkdownContent,
  convertToAbsolutePath,
  validateLink,
  getDirectoryFiles,
} = require("../mdlink");

jest.mock("axios");
jest.mock("fs");
jest.mock("path");

describe("mdlink function", () => {
  let originalMdlink;
  beforeEach(() => {
    originalMdlink = require('../mdlink').mdlink;
    // Mocks específicos para cada prueba
    fs.statSync.mockReturnValue({
      isFile: () => true,
      isDirectory: () => false,
    });
    path.extname.mockReturnValue(".md");
  });
  afterEach(() => {
    require('../mdlink').mdlink = originalMdlink;
  });

  // Prueba para verificar si la función mdlink se está ejecutando sin errores
  it("should run without errors", () => {
    expect(() => {
      mdlink("test/file.md", {});
    }).not.toThrow();
  });

  // Prueba para verificar si la función mdlink resuelve un resultado esperado
  it("should resolve with expected result", () => {
    const expected = {
      total: 0,
      unique: 0,
      links: [],
    };

    return mdlink("test/files/leer.md", {}).then((result) => {
      expect(result).toEqual(expected);
    });
  });

  test("should process a single markdown file with validation", () => {
    const filePath = "test/files/leer.md";
    const options = { validate: true };

    // Lee el contenido real del archivo
    const markdownContent = fs.readFileSync(filePath, "utf8");
    const links = getLinksFromMarkdownContent(markdownContent);

    // Mockea axios.get para simular respuestas de validación
    axios.get.mockImplementation((link) => {
      const foundLink = links.find((l) => l.href === link);
      if (foundLink) {
        return Promise.resolve({ status: 200 });
      } else {
        return Promise.reject({ response: { status: 404 } });
      }
    });

    // Ejecuta la función mdlink con la función de validación simulada
    return mdlink(filePath, options).then((result) => {
      // Realiza las aserciones pertinentes sobre 'result'
      expect(result.total).toBe(links.length);
      expect(result.unique).toBe(new Set(links.map((link) => link.href)).size);
      expect(result.links.every((link) => link.ok === "ok")).toBe(true); // Asegura que la validación haya ocurrido
    });
  });

  it("should reject with error for invalid file format", () => {
    const filePath = "test/files/vacio/contenido.txt"; // Cambia la ruta al archivo .txt no válido
    const options = {};

    return mdlink(filePath, options).catch((error) => {
      expect(error.message).toContain(
        "El archivo proporcionado no es un archivo Markdown (.md)."
      );
    });
  });

  it("should reject with error for non-existent file", () => {
    const filePath = "test/files/nonexistent.md"; // Cambia la ruta a un archivo que no existe
    const options = {};

    return mdlink(filePath, options).catch((error) => {
      expect(error.message).toContain("File not found");
    });
  });

  it("should not include non-Markdown files in directory results", () => {
    const directoryPath = "test/vacio"; // Cambia la ruta al directorio que contiene archivos no Markdown
    const options = {};

    return mdlink(directoryPath, options).then((result) => {
      // Verifica que los archivos no Markdown no estén incluidos en los resultados
      const nonMarkdownFiles = result.links.filter(
        (link) => !link.file.endsWith(".md")
      );
      expect(nonMarkdownFiles.length).toBe(0);
    });
  });

  it("should handle single markdown file and not validate links", () => {
    const options = { validate: false };
    return mdlink("test/file/leer.md", options).then((result) => {
      expect(result.total).toBe(0); // Update with the actual number of links
      expect(result.unique).toBe(0); // Update with the actual number of unique links
      expect(result.links.length).toBe(0); // Update with the actual number of links
    });
  });

  it("should reject with error for invalid file format", () => {
    const options = { validate: false };
    return mdlink("test/file.txt", options).catch((error) => {
      expect(error.message).toBe(
        "El archivo proporcionado no es un archivo Markdown (.md)."
      );
    });
  });

  it("should reject with error for non-existent file", () => {
    const options = { validate: false };
    return mdlink("test/nonexistent.md", options).catch((error) => {
      expect(error.message).toBe("No se encontró el archivo o directorio.");
    });
  });

  it('should handle directory processing without validation', () => {
    const testDir = 'test/files'; // Ruta al directorio de prueba
    const options = { validate: false };

    return mdlink(testDir, options).then((result) => {
      // Realiza las aserciones pertinentes sobre 'result'
      expect(result.total).toBe(0); // Cantidad total de enlaces
      expect(result.unique).toBe(0); // Cantidad total de enlaces únicos
    });
  });
  it("should process a single markdown file without validation", () => {
    const filePath = "test/files/leer.md";
    const options = { validate: false };

    return mdlink(filePath, options).then((result) => {
      expect(result.total).toBe(0); // Update with the actual number of links
      expect(result.unique).toBe(0); // Update with the actual number of unique links
      expect(result.links.length).toBe(0); // Update with the actual number of links
    });
  });

  it("should reject with error for non-existent file or directory", () => {
    const pathNotExist = "nonexistent.md"; // Update with the path of a non-existent file or directory
    const options = {};

    return mdlink(pathNotExist, options).catch((error) => {
      expect(error.message).toContain("No se encontró el archivo o directorio.");
    });
  });
  

});


describe("getLinksFromMarkdownContent", () => {
  it("should extract links from markdown content", () => {
    const markdownContent =
      "[Link 1](https://example.com) [Link 2](https://google.com)";
    const links = getLinksFromMarkdownContent(markdownContent);
    expect(links.length).toBe(2);
    expect(links[0].href).toBe("https://example.com");
    expect(links[0].text).toBe("Link 1");
    expect(links[1].href).toBe("https://google.com");
    expect(links[1].text).toBe("Link 2");
  });

  it("should handle no links in markdown content", () => {
    const markdownContent = "No links here.";
    const links = getLinksFromMarkdownContent(markdownContent);
    expect(links.length).toBe(0);
  });
});

describe("convertToAbsolutePath", () => {
  test("should convert relative path to absolute path", () => {
    const relativePath = "test/files/leer.md";
    const expectedAbsolutePath = path.resolve(relativePath);
    const absolutePath = convertToAbsolutePath(relativePath);
    expect(absolutePath).toEqual(expectedAbsolutePath);
  });
  test("should keep absolute path unchanged", () => {
    const relativePath = "test/files/leer.md";
    const expectedAbsolutePath = path.resolve(relativePath);
    const result = convertToAbsolutePath(expectedAbsolutePath);
    expect(result).toEqual(expectedAbsolutePath);
  });
});

describe("validateLink", () => {
  test("should validate link with successful response", () => {
    const link = { href: "https://example.com", text: "Example" };
    const response = { status: 200 };
    axios.get.mockResolvedValue(response);
    return validateLink(link).then((result) => {
      expect(result).toEqual({ ...link, status: 200, ok: "ok" });
    });
  });
  test("should validate link with error response", () => {
    const link = { href: "https://example.com", text: "Example" };
    const error = { response: { status: 404 } };
    axios.get.mockRejectedValue(error);
    return validateLink(link).then((result) => {
      expect(result).toEqual({ ...link, status: 404, ok: "fail" });
    });
  });
  test("should validate link with unknown error", () => {
    const link = { href: "https://example.com", text: "Example" };
    const error = { message: "Some error occurred" };
    axios.get.mockRejectedValue(error);
    return validateLink(link).then((result) => {
      expect(result).toEqual({ ...link, status: "Unknown", ok: "fail" });
    });
  });
});

describe('getDirectoryFiles', () => {
  it('debería retornar un array vacío cuando se le pasa un directorio vacío', () => {
    const emptyDir = path.join(__dirname, 'vacio'); // Cambia la ruta según sea necesario
    console.log('emptyDir',emptyDir);
    const result = getDirectoryFiles(emptyDir);
    expect(result).toEqual([]);
  });

  it('debería retornar un array de rutas de archivos en un directorio', () => {
    //const testDir = path.join(__dirname, 'test', 'files');
    const testDir = 'C:\\Users\\danie\\OneDrive\\Escritorio\\Laboratoria\\DEV008-md-links\\test\\files';
    console.log('testDir1', testDir)
    const expectedFilePaths = [
      path.normalize('C:\\Users\\danie\\OneDrive\\Escritorio\\Laboratoria\\DEV008-md-links\\test\\files\\broken-link.md'),
      path.normalize('C:\\Users\\danie\\OneDrive\\Escritorio\\Laboratoria\\DEV008-md-links\\test\\files\\leer.md'),
      path.normalize('C:\\Users\\danie\\OneDrive\\Escritorio\\Laboratoria\\DEV008-md-links\\test\\files\\leer2.md'),
      path.normalize('C:\\Users\\danie\\OneDrive\\Escritorio\\Laboratoria\\DEV008-md-links\\test\\files\\vacio.md'),
    ];
    const result = getDirectoryFiles(testDir);
    console.log('result', result)
    expect(result).toEqual(expectedFilePaths);
  });
  

  it('debería retornar un array vacío si se le pasa una ruta que no existe', () => {
    const nonExistentPath = path.join(__dirname, 'test', 'no-existe'); // Cambia la ruta según sea necesario
    console.log('nonExistentPath',nonExistentPath);
    const result = getDirectoryFiles(nonExistentPath);
    expect(result).toEqual([]);
  });
 
  it('debería manejar directorio vacío', () => {
    const testDir = 'test/vacio2'; // Ruta relativa al directorio de pruebas
    console.log('testDir2',testDir);
    const result = getDirectoryFiles(testDir);
    expect(result).toEqual([]);
  });
  it('should handle nested subdirectories', () => {
    const nestedDir = path.join(__dirname, 'test', 'files', 'vacio'); // Cambia la ruta según sea necesario
    console.log('nestedDir',nestedDir);
    const expectedFilePaths = [
      path.join(nestedDir, 'contenido.txt'),
      path.join(nestedDir, 'vacio'),
    ];
    const result = getDirectoryFiles(nestedDir);
    expect(result).toEqual(expectedFilePaths);
  });
});

