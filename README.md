# webpack-entry-wrapper
[![CircleCI](https://circleci.com/gh/steplov/webpack-entry-wrapper.svg?style=svg)](https://circleci.com/gh/steplov/webpack-entry-wrapper)

Wrap entry points with any code

## Description
This plugin is useful when you need to wrap entry point with custom code, which should be executed
before original entry point.
Plugin provides path to an original entry point so you need to import it manually in your wrapper.

E.g. you need to set public path in runtime but don't want to have this logic in entry point.

## Install
```
npm i -D webpack-entry-wrapper
```

## Usage

```
const WebpackEntryWrapper = require('webpack-entry-wrapper');

module.exports = {
  entry: './main',
  plugins: [
    new WebpackEntryWrapper({
      include: /main.js/,
      template: 'data/template.ejs'
    })
  ]
}
```

## Options

|Name|Type|Default|Description|
|:---:|:---:|:---:|:---|
|`include`|`{RegExp}`|null|included entries, By default plugin applies to all entry points|
|`template` (required)|`string`|undefined|Path to a wrapper template|

## Template variables

|Variable|Description|
|:---:|:---|
|`entry`|relative path to entry point|
