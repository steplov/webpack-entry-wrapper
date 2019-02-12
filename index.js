const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ejs = require('ejs');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
const MultiEntryPlugin = require('webpack/lib/MultiEntryPlugin');
const VirtualModulePlugin = require('virtual-module-webpack-plugin');

class WebpackEntryWrapper {
  constructor(options = {}) {
    assert(options.template, 'Entry wrapper template is missing.');

    if (options.include) {
      assert(options.include instanceof RegExp, 'Include should be a RegExp');
    }

    this.compiler = null;
    this.templatePath = options.template;
    this.template = '';
    this.include = options.include;
    this.entries = [];
  }

  apply(compiler) {
    this.compiler = compiler;
    compiler.hooks.entryOption.tap('WebpackEntryWrapper', (context, entry) => {
      this.loadTemplate(context);

      if (typeof entry === 'string' || Array.isArray(entry)) {
        this.createEntryWrapper(entry, 'main');
      } else {
        Object.keys(entry).forEach((name) => {
          this.createEntryWrapper(entry[name], name);
        });
      }
    });

    compiler.hooks.thisCompilation.tap('WebpackEntryWrapper', () => {
      this.entries.forEach(({ item, name }) => {
        this.createEntryPoint(item, name);
      });
    });
  }

  loadTemplate(context) {
    const templatePath = path.isAbsolute(this.templatePath)
      ? this.templatePath
      : path.resolve(context, this.templatePath);

    assert(fs.existsSync(templatePath), `${templatePath} template is not found.`);

    this.template = fs.readFileSync(templatePath, { encoding: 'utf-8' });
  }

  createEntryWrapper(item, name) {
    if (Array.isArray(item)) {
      this.entries.push({
        name,
        item: item.map(i => this.registerVirtualWrapper(i))
      });
    } else {
      this.entries.push({
        name,
        item: this.registerVirtualWrapper(item)
      });
    }
  }

  registerVirtualWrapper(entry) {
    if (this.include && !this.include.test(entry)) {
      return entry;
    }

    const { dir, name, base } = path.parse(entry);
    const wrapper = `${dir}/${name}.wrapper.js`;

    new VirtualModulePlugin({
      moduleName: wrapper,
      contents: ejs.render(this.template, { entry: `./${base}` })
    }).apply(this.compiler);

    return wrapper;
  }

  createEntryPoint(item, name) {
    if (Array.isArray(item)) {
      new MultiEntryPlugin(this.compiler.context, item, name).apply(this.compiler);
    } else {
      new SingleEntryPlugin(this.compiler.context, item, name).apply(this.compiler);
    }
  }
}

module.exports = WebpackEntryWrapper;
