import cp from 'child_process';
import path from 'path';
import fs from 'fs';
import _ from 'lodash';

import log from 'packages/helpers/universal/log';

let resolvedPackages = [];

function printBar(color = 'white', withLineBreak = true) {
  const lineBreak = withLineBreak ? '\n' : '';

  log[color](`-------------------------------------------${lineBreak}`).info();
}

function printPackageStdout(stdout) {
  if (_.isEmpty(stdout)) log.white('This package has not provided logs.').info();
}

function printCurrentPackage(item) {
  log.yellow('\nPackage: ').bold.white(`${item}\n`).info();
}

function printStart(all, task) {
  let message = 'on packages modified since the last commit.\n';

  if (all) message = 'on all packages.\n';

  log.bold.white('\nRunning ').yellow(`yarn ${task} `).white(message);
  printBar('white', false);
}

function printCommandError(error) {
  log.error(error.stdout.toString());
}

function runTasks(task, reject) {
  return item => {
    const execCommand = `(cd ${process.cwd()}/packages/${item} && yarn ${task})`;
    const execOpts = {
      maxBuffer: 1024 * 2000
    };

    let packageJSON = null;
    let fileNotFound = false;

    try {
      packageJSON = require(`${process.cwd()}/packages/${item}/package.json`);
    } catch (error) {
      fileNotFound = true;
    }

    if (fileNotFound || !packageJSON.scripts || !packageJSON.scripts[task]) return null;

    printCurrentPackage(item);

    try {
      const stdout = cp.execSync(execCommand, execOpts);

      return printPackageStdout(stdout);
    } catch (error) {
      printCommandError(error);

      return reject(error);
    }
  };
}

function filterFile(file) {
  return fs.statSync(path.join(path.join(process.cwd(), './packages'), file)).isDirectory();
}

/**
 * Run the specified command on each resolved packages.
 *
 * @param {String} task
 * @param {Boolean} all
 * @returns {Promise}
 */
function generic({task, all}) {
  return new Promise((resolve, reject) => {
    const packagesDirPath = path.join(process.cwd(), './packages');
    const manifestFilePath = path.join(process.cwd(), './packages-manifest.json');

    resolvedPackages = all ? fs.readdirSync(packagesDirPath).filter(filterFile) : require(manifestFilePath);

    printStart(all, task);

    resolvedPackages.forEach(runTasks(task, reject));

    return resolve();
  });
}

export default generic;
