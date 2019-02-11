const path = require('path');
const webpack = require('webpack');
const WebpackEntryWrapper = require('../index');


const getConfig = (entry, include) => ({
  context: path.resolve(__dirname, './data'),
  entry,
  mode: 'development',
  output: {
    path: path.resolve(__dirname, '../.tmp'),
    filename: '[name].js',
    publicPath: '/'
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1
    }),

    new WebpackEntryWrapper({
      include,
      template: path.resolve(__dirname, 'data/template.ejs')
    })
  ]
});

const runWebpack = async options => new Promise((resolve, reject) => {
  webpack(options, (err, stats) => {
    if (err || stats.hasErrors()) {
      reject(err);
    }

    resolve(stats);
  });
});

test('should wrap main entry point', async () => {
  const stats = await runWebpack(getConfig('./A'));

  const entryWrapperPath = path.resolve(__dirname, 'data/A.wrapper.js');
  const entryPath = path.resolve(__dirname, 'data/A.js');

  expect(stats.compilation._modules.has(entryWrapperPath)).toBe(true);
  expect(stats.compilation._modules.has(entryPath)).toBe(true);
  expect(stats.compilation._modules.get(entryWrapperPath)._source._value).toBe('const entry = require(\'./A\');\n\nconsole.log(entry);\n');
});

test('should wrap single entry point', async () => {
  const stats = await runWebpack(getConfig({
    A: './A'
  }));
  const entryWrapperPath = path.resolve(__dirname, 'data/A.wrapper.js');
  const entryPath = path.resolve(__dirname, 'data/A.js');

  expect(stats.compilation._modules.has(entryWrapperPath)).toBe(true);
  expect(stats.compilation._modules.has(entryPath)).toBe(true);
  expect(stats.compilation._modules.get(entryWrapperPath)._source._value).toBe('const entry = require(\'./A\');\n\nconsole.log(entry);\n');
});


test('should wrap array entry point', async () => {
  const stats = await runWebpack(getConfig({
    arr: ['./A', './B']
  }));

  const entryWrapperAPath = path.resolve(__dirname, 'data/A.wrapper.js');
  const entryWrapperBPath = path.resolve(__dirname, 'data/B.wrapper.js');
  const aPath = path.resolve(__dirname, 'data/A.js');
  const bPath = path.resolve(__dirname, 'data/B.js');

  expect(stats.compilation._modules.has(entryWrapperAPath)).toBe(true);
  expect(stats.compilation._modules.has(entryWrapperBPath)).toBe(true);
  expect(stats.compilation._modules.has(aPath)).toBe(true);
  expect(stats.compilation._modules.has(bPath)).toBe(true);
  expect(stats.compilation._modules.get(entryWrapperAPath)._source._value).toBe('const entry = require(\'./A\');\n\nconsole.log(entry);\n');
  expect(stats.compilation._modules.get(entryWrapperBPath)._source._value).toBe('const entry = require(\'./B\');\n\nconsole.log(entry);\n');
});

test('should apply entry point wrapper only to selected entries', async () => {
  const stats = await runWebpack(getConfig({
    arr: ['./A', './B']
  }, /data\/A.js/));

  const entryWrapperBPath = path.resolve(__dirname, 'data/B.wrapper.js');

  expect(stats.compilation._modules.has(entryWrapperBPath)).toBe(false);
});
