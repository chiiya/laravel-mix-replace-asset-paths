<br />
<div align="center">
  <p align="center">
    <a href="https://opensource.org/licenses/MIT" target="_blank"><img src="https://img.shields.io/badge/license-MIT-green.svg"></a>
    <a href="https://www.npmjs.com/package/laravel-mix-replace-asset-paths" target="_blank"><img src="https://img.shields.io/npm/v/laravel-mix-replace-asset-paths.svg"></a>
    <a href="https://prettier.io" target="_blank"><img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat"></a>
  </p>

  <strong>
    <h2 align="center">Laravel Mix Replace Asset Paths</h2>
  </strong>

  <p align="center">
    Laravel Mix plugin for replacing asset paths with their versioned equivalent from the manifest. 
    Useful for static HTML sites outside of a Laravel context.
  </p>

  <p align="center">
    <strong>
    <a href="#installation">installation</a>
      &nbsp; &middot; &nbsp;
      <a href="#usage">usage</a>
      &nbsp; &middot; &nbsp;
      <a href="#options">options</a>
      &nbsp; &middot; &nbsp;
      <a href="#example">example</a>
    </strong>
  </p>
</div>
<br />

## Installation

<pre>npm install <a href="https://www.npmjs.com/package/laravel-mix-replace-asset-paths">laravel-mix-replace-asset-paths</a></pre>

## Usage

```js
mix.then(async stats => {
  const laravelMixReplaceAssetPaths = require('laravel-mix-replace-asset-paths');
  await laravelMixReplaceAssetPaths({
    publicPath: 'dist',
    stats,
  });
});
```

## Options

Configure the plugin by passing an options object as the first argument.

| Option           | Default                                             | Details                                                                                                                                                                                                                                                                             |
| ---------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stats`          | `undefined`                                         | Webpack stats containing information for all compiled assets. **When the stats object is passed, only compiled assets will be scanned for files to replace.** If no stats are passed, all files in the `publicPath` folder matching the `whitelist` pattern are scanned.            |
| `publicPath`     | `dist`                                              | Public path where the compiled assets (and the `mix-manifest.json`) are located.                                                                                                                                                                                                    |
| `whitelist`      | `['*.html']`                                        | Whitelist of files for which the asset paths should be replaced.                                                                                                                                                                                                                    |
| `pattern`        | `/(\/?(?:css\|js\|images)\/[^"']+)/g`               | Regular expression for matching assets to replace. Should contain exactly one capturing group for the asset path. It defaults to a very permissive expression matching all css, js and image files. It's recommended to use a more restricting expression. See [example](#example). |
| `manifest`       | `mix-manifest.json` inside the `publicPath` folder. | Contents of your `mix-manifest.json` file.                                                                                                                                                                                                                                          |
| `replaceOptions` | `{}`                                                | Custom options for the [replace-in-file](https://www.npmjs.com/package/replace-in-file) package.                                                                                                                                                                                    |

## Example

The following example makes use of the `laravel-mix-twig-to-html` and
`laravel-mix-make-file-hash` plugins to create a simple static site setup with
Laravel Mix using Twig:

```js
const mix = require('laravel-mix');

const config = {
  srcPath: 'src',
  distPath: 'dist',
  deployPath: null,
};

const source = {
  images: path.resolve(config.srcPath, 'images'),
  scripts: path.resolve(config.srcPath, 'js'),
  styles: path.resolve(config.srcPath, 'css'),
  templates: path.resolve(config.srcPath, 'templates'),
};

/**
 * 📝 Templates
 * Compile Twig files to static HTML
 */
require('laravel-mix-twig-to-html');
mix.twigToHtml({
  files: [
    {
      template: path.resolve(__dirname, source.templates, '**/*.{twig,html}'),
      inject: false,
    },
  ],
  fileBase: source.templates,
  twigOptions: {
    filters: {
      asset(value) {
        return mix.inProduction() ? `{{ mix(${value}) }}` : value;
      },
    },
  },
});

/**
 * 📣 Versioning
 * Add file hashes to all assets for cache-busting
 * Converts the query-based versioning of laravel-mix to filename-based versioning:
 * main.css?id=abcd1234 => main.abcd1234.css
 */
if (mix.inProduction()) {
  mix.version();
  // Run after mix finishes
  mix.then(async stats => {
    const laravelMixMakeFileHash = require('laravel-mix-make-file-hash');
    const laravelMixReplaceAssetPaths = require('laravel-mix-replace-asset-paths');
    const manifest = await laravelMixMakeFileHash({
      publicPath: config.distPath,
      manifestFilePath: path.join(config.distPath, 'mix-manifest.json'),
      fileTypesBlacklist: ['html'],
    });
    await laravelMixReplaceAssetPaths({
      pattern: /{{ mix\(([^}]+)\) }}/g,
      stats,
    });
  });
}
```

```twig
<link rel="stylesheet" href="{{ 'css/main.css' | asset }}">
```

In development mode this will compile to:

```html
<link rel="stylesheet" href="css/main.css" />
```

In production mode, it will compile to:

```html
<link rel="stylesheet" href="css/main.abcd1234.css" />
```
