#!/usr/bin/env node

const path = require('path');
const _ = require('lodash');
const babelRC = require('../../../package.json').babel;
const localBabelRC = _.cloneDeep(babelRC);
const moduleResolverConfig = {
  root: [
    path.resolve(__dirname, '../../../node_modules'),
    path.resolve(__dirname, '../../..')
  ]
};

localBabelRC.plugins.push(['module-resolver', moduleResolverConfig]);

require('babel-register')(localBabelRC);
require('..');
