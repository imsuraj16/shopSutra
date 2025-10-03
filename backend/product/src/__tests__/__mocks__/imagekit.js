module.exports = jest.fn().mockImplementation(() => ({
  upload: jest.fn(async ({ fileName }) => ({
    url: `https://fakecdn.com/${fileName}`,
    fileId: 'abc123'
  }))
}));
