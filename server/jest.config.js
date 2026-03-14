/** @type {import('jest').Config} */
module.exports = {
  // Allow modules required by files outside server/ (e.g. @custom/) to resolve from server/node_modules
  modulePaths: ['<rootDir>/node_modules'],
};
