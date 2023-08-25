// const { mdlink } = require('../mdlink');
// const fs = require('fs');
// const path = require('path');

// // Mockear mdlink para evitar llamadas reales a las funciones
// jest.mock('../mdlink');

// describe('index.js', () => {
//   beforeEach(() => {
//     jest.spyOn(console, 'log').mockImplementation(() => {});
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should process a file and log simplified links', async () => {
//     process.argv = ['node', 'index.js', 'leer.md'];

//     jest.spyOn(fs, 'readFileSync').mockReturnValue('[Google](https://www.google.com)');

//     // Configurar el mock de mdlink para que devuelva un resultado esperado
//     mdlink.mockResolvedValue({
//       total: 1,
//       unique: 1,
//       links: [
//         {
//           href: 'https://www.google.com',
//           text: 'Google',
//           file: './files/leer.md', // Cambiar la ruta a la que corresponda
//         },
//       ],
//     });

//     // Importar el archivo index después de configurar los mocks
//     require('../index');

//     // Verificar que mdlink fue llamado con los argumentos correctos
//     expect(mdlink).toHaveBeenCalledWith('example.md', {});

//     // Verificar que se ha llamado a console.log con el resultado esperado
//     expect(console.log).toHaveBeenCalledWith([
//       {
//         href: 'https://www.google.com',
//         text: 'Google',
//         file: './files/leer.md', // Cambiar la ruta a la que corresponda
//       },
//     ]);
//   });

//   // ... Puedes agregar más pruebas para index.js ...
// });



