module.exports = function loader(source) {
  return `export default ${JSON.stringify(source)}`;
};
