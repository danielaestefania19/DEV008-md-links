const fs = require("fs");
const path = require("path");
const axios = require("axios");
const {
  getDirectoryFiles,
} = require("../mdlink");

describe('getDirectoryFiles', () => {
    it('debería retornar un array vacío cuando se le pasa un directorio vacío', () => {
      const emptyDir = path.join(__dirname, 'vacio2'); // Cambia la ruta según sea necesario
      console.log('emptyDir',emptyDir);
      const result = getDirectoryFiles(emptyDir);
      console.log('result vacio ',result)
      expect(result).toEqual([]);
    });

    it('debería retornar un array de rutas de archivos en un directorio', () => {
        const testDir = path.join(__dirname, 'files'); // Ruta completa del directorio de pruebas
        console.log('testDirP1: ',testDir);
        const expectedFilePaths = [
          'leer.md',
          'leer2.md',
          'vacio.md',
          'broken-link.md',
        ].map((filePath) => path.normalize(filePath)); // Normaliza las rutas para manejar diferencias de formato
        const result = getDirectoryFiles(testDir);
        // Normaliza las rutas absolutas en result a rutas relativas
        const resultRelative = result.map((filePath) => path.relative(testDir, filePath));
        // Ordena ambas matrices de rutas antes de compararlas
        resultRelative.sort();
        expectedFilePaths.sort();
        console.log('resultRelativeP1: ',resultRelative);
        console.log('expectedFilePathsP1: ',expectedFilePaths);
        expect(resultRelative).toEqual(expectedFilePaths);
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