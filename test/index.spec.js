const { mdlink } = require('../mdlink');
const { main } = require('../index');

jest.mock('../mdlink', () => ({
  mdlink: jest.fn(),
}));

describe('index', () => {
  it('should call mdlink with correct arguments', () => {
    mdlink.mockResolvedValue('Test result');
    process.argv = ['', '', 'test.md', '--validate'];

    main();

    expect(mdlink).toHaveBeenCalledWith('test.md', { validate: true });
  });
  // Add more test cases
});
