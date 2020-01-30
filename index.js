const fs = require('fs-extra');
const path = require('path');
const replace = require('replace-in-file');
const multimatch = require('multimatch');
const globby = require('globby');

/**
 * Resolve user options with sensible defaults.
 *
 * @param {*} options
 */
const resolveOptions = async options => {
  const config = {
    publicPath: 'dist',
    whitelist: ['*.html'],
    pattern: /(\/?(?:css|js|images)\/[^"']+)/g,
    ...options,
  };
  if (!config.manifest) {
    try {
      const content = await fs.readFile(
        path.join(config.publicPath, 'mix-manifest.json'),
        'utf8'
      );
      config.manifest = JSON.parse(content);
    } catch (error) {
      console.error(error);
    }
  }
  return config;
};

/**
 * Get a list of files, either from the webpack stats or from all matching
 * files inside the publicPath directory.
 *
 * @param {*} config
 */
const getFilePaths = async config => {
  if (config.stats) {
    return multimatch(
      Object.keys(config.stats.compilation.assets),
      config.whitelist
    );
  } else {
    return await globby(config.whitelist, {
      cwd: config.publicPath,
      onlyFiles: true,
    });
  }
};

/**
 * Replace all asset paths in HTML files with the versioned file name.
 *
 * @param {object} options
 */
const replaceAssetPaths = async options => {
  const config = await resolveOptions(options);

  if (!config.manifest) {
    return console.error(
      `Error: 'replace-asset-paths' needs the manifest contents!\n`
    );
  }

  const files = getFilePaths(config);
  const replaceOptions = {
    files: files.map(file => path.join(config.publicPath, file)),
    from: config.pattern,
    to: (string, match) => {
      const normalized = match.replace(/^\/?/, '/');
      if (config.manifest[normalized] === undefined) {
        console.error = `No entry in manifest.json for: ${normalized}`;
        return match;
      }
      return match.startsWith('/')
        ? config.manifest[normalized]
        : config.manifest[normalized].replace(/^\/?/, '');
    },
  };
  return replace(Object.assign(replaceOptions, config.replaceOptions || {}));
};

module.exports = replaceAssetPaths;
