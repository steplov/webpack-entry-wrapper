import path from 'path';
// @ts-ignore
import webpack from 'webpack-4';
import WebpackEntryWrapper from '../index';

jest.mock('webpack/lib/SingleEntryPlugin', () => require('webpack-4/lib/SingleEntryPlugin'), { virtual: true });

const getConfig = (entry: string | Record<string, any>, include?: RegExp): Record<string, any> => ({
  context: path.resolve(__dirname, './data'),
  entry,
  mode: 'development',
  output: {
    path: path.resolve(__dirname, '../.tmp'),
    filename: '[name].js',
    publicPath: '/'
  },
  plugins: [
    new (webpack as any).optimize.LimitChunkCountPlugin({
      maxChunks: 1
    }),

    new WebpackEntryWrapper({
      include,
      template: path.resolve(__dirname, 'data/template.js')
    })
  ]
});

const runWebpack = async (options: Record<string, any>) => new Promise((resolve, reject) => {
  webpack(options, (err: any, stats: any) => {
    if (err || stats.hasErrors()) {
      reject(err);
    }

    resolve(stats);
  });
});

test('should wrap main entry point', async () => {
  const stats = await runWebpack(getConfig('./A')) as any;

  const entryWrapperPath = path.resolve(__dirname, 'data/A.wrapper.js');
  const entryPath = path.resolve(__dirname, 'data/A.js');

  expect(stats.compilation._modules.has(entryWrapperPath)).toBe(true);
  expect(stats.compilation._modules.has(entryPath)).toBe(true);
  expect(stats.compilation._modules.get(entryWrapperPath)._source._value).toBe('const entry = require(\'./A\');\n\nconst relativePath = \'aa/bb/test\';\nconst tsPath = `./src/${relativePath}.ts`;\nconsole.log(entry);\n');
});

test('should wrap single entry point', async () => {
  const stats = await runWebpack(getConfig({
    A: './A'
  })) as any;
  const entryWrapperPath = path.resolve(__dirname, 'data/A.wrapper.js');
  const entryPath = path.resolve(__dirname, 'data/A.js');

  expect(stats.compilation._modules.has(entryWrapperPath)).toBe(true);
  expect(stats.compilation._modules.has(entryPath)).toBe(true);
  expect(stats.compilation._modules.get(entryWrapperPath)._source._value).toBe('const entry = require(\'./A\');\n\nconst relativePath = \'aa/bb/test\';\nconst tsPath = `./src/${relativePath}.ts`;\nconsole.log(entry);\n');
});


test('should wrap array entry point', async () => {
  const stats = await runWebpack(getConfig({
    arr: ['./A', './B']
  })) as any;

  const entryWrapperAPath = path.resolve(__dirname, 'data/A.wrapper.js');
  const entryWrapperBPath = path.resolve(__dirname, 'data/B.wrapper.js');
  const aPath = path.resolve(__dirname, 'data/A.js');
  const bPath = path.resolve(__dirname, 'data/B.js');

  expect(stats.compilation._modules.has(entryWrapperAPath)).toBe(true);
  expect(stats.compilation._modules.has(entryWrapperBPath)).toBe(true);
  expect(stats.compilation._modules.has(aPath)).toBe(true);
  expect(stats.compilation._modules.has(bPath)).toBe(true);
  expect(stats.compilation._modules.get(entryWrapperAPath)._source._value).toBe('const entry = require(\'./A\');\n\nconst relativePath = \'aa/bb/test\';\nconst tsPath = `./src/${relativePath}.ts`;\nconsole.log(entry);\n');
  expect(stats.compilation._modules.get(entryWrapperBPath)._source._value).toBe('const entry = require(\'./B\');\n\nconst relativePath = \'aa/bb/test\';\nconst tsPath = `./src/${relativePath}.ts`;\nconsole.log(entry);\n');
});

test('should apply entry point wrapper only to selected entries', async () => {
  const stats = await runWebpack(getConfig({
    arr: ['./A', './B']
  }, /data\/A.js/)) as any;

  const entryWrapperBPath = path.resolve(__dirname, 'data/B.wrapper.js');

  expect(stats.compilation._modules.has(entryWrapperBPath)).toBe(false);
});
