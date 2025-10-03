const multerMock = () => {
  const middleware = (req, res, next) => next();
  middleware.single = () => middleware;
  middleware.fields = () => middleware;
  middleware.array = () => middleware;
  middleware.any = () => middleware;
  middleware.none = () => middleware;
  return middleware;
};
multerMock.memoryStorage = () => ({});
module.exports = multerMock;
