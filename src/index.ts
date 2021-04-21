import fs from 'fs'
import path from 'path'
import assert from 'assert'
import VirtualModulesPlugin from 'webpack-virtual-modules'
// @ts-ignore
import SingleEntryPlugin from 'webpack/lib/SingleEntryPlugin'
import { resolveTemplate } from './templateEngine'

export interface WebpackEntryWrapperOptions {
  template: string
  include?: RegExp
}

export default class WebpackEntryWrapper {
  private compiler: any;

  private template: string;

  private entries: any[]

  // private createEntry: CreateEntry

  private readonly templatePath: string;

  private readonly include?: RegExp;

  private readonly virtualModules: VirtualModulesPlugin;

  constructor(options: WebpackEntryWrapperOptions) {
    if (options.include) {
      assert(options.include instanceof RegExp, 'Include should be a RegExp');
    }

    this.virtualModules = new VirtualModulesPlugin();
    this.compiler = null;
    this.templatePath = options.template;
    this.template = '';
    this.include = options.include;
    this.entries = [];
  }

  apply(compiler: any): void {
    this.compiler = compiler;
    this.virtualModules.apply(this.compiler)
    compiler.hooks.entryOption.tap('WebpackEntryWrapper', (context: any, entry: any) => {
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

  private loadTemplate(context: any): void {
    const templatePath = path.isAbsolute(this.templatePath)
      ? this.templatePath
      : path.resolve(context, this.templatePath);

    assert(fs.existsSync(templatePath), `${templatePath} template is not found.`);

    this.template = fs.readFileSync(templatePath, { encoding: 'utf-8' });
  }

  private createEntryWrapper(item: any, name: string): void {
    const isWebpack4 = this.compiler.webpack
      ? false
      : typeof this.compiler.resolvers !== 'undefined';

    const entries = isWebpack4 ? item : item.import;

    if (Array.isArray(entries)) {
      this.entries.push({
        name,
        item: entries.map((i: any) => this.registerVirtualWrapper(i))
      });
    } else {
      this.entries.push({
        name,
        item: this.registerVirtualWrapper(entries)
      });
    }
  }

  private registerVirtualWrapper(entry: any): string {
    if (this.include && !this.include.test(entry)) {
      return entry;
    }

    const { dir, name, base } = path.parse(entry);
    const wrapper = `${dir}/${name}.wrapper.js`;
    const contents = resolveTemplate(this.template, { entry: `./${base}` })

    this.virtualModules.writeModule(wrapper, contents);

    return wrapper;
  }

  private createEntryPoint(item: any, name: string): void {
    if (Array.isArray(item)) {
      item.forEach(i => {
        new SingleEntryPlugin(this.compiler.context, i, name).apply(this.compiler);
      })
    } else {
      new SingleEntryPlugin(this.compiler.context, item, name).apply(this.compiler);
    }
  }
}

