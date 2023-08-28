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
    //const testDir = path.resolve(__dirname, 'test', 'files')
    //console.log('testDir',testDir);
    const testDir = 'C:\\DEV008-md-links\\test\\files'; // O path.resolve(__dirname, 'test', 'files')
    console.log('testDir1', testDir);
    const expectedFilePaths = [
      'C:\\DEV008-md-links\\test\\files\\leer.md',
      'C:\\DEV008-md-links\\test\\files\\leer2.md',
      'C:\\DEV008-md-links\\test\\files\\vacio.md',
      'C:\\DEV008-md-links\\test\\files\\broken-link.md',
    ];
    const result = getDirectoryFiles(testDir);
    console.log('result', result);
    console.log('expectedFilePaths', expectedFilePaths);
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