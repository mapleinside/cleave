import cp from 'child_process';
import fs from 'fs-extra';
import path from 'path';

import {packages} from 'packages/cleave/utils/config';
import log from 'packages/helpers/universal/log';

function logAndResolveTask(solvedPackages, promiseResolve, hasPackages = false) {
  if (hasPackages) {
    log.yellow('\nThe following package(s) have been modified since the last commit:\n').info();
    solvedPackages.forEach(solvedPackage => log.white('- ').bold(solvedPackage).info());
  } else {
    log.yellow('There is no modified package since the last commit.').info();
  }

  log.info('\n');
  fs.writeFileSync(path.join(process.cwd(), './packages-manifest.json'), JSON.stringify(solvedPackages));

  return promiseResolve();
}

function resolvePackage(stdout, resolvedPackages) {
  return item => {
    if (stdout.includes(`diff --git a/packages/${item}`)) return resolvedPackages.push(item);

    return item;
  };
}

function pushResolvedPackage(resolvedPackages) {
  return singlePackage => {
    if (resolvedPackages.indexOf(singlePackage) === -1) return resolvedPackages.push(singlePackage);

    return singlePackage;
  };
}

function resolveForcedPackages(matches, regex, resolvedPackages) {
  const mutableRegex = regex;
  const forcedPackages = matches[1].split(',');

  if (matches.index === mutableRegex.lastIndex) mutableRegex.lastIndex++;

  return forcedPackages.forEach(pushResolvedPackage(resolvedPackages));
}

function gitLogExecCallback(resolvedPackages, promiseResolve) {
  return (logError, logStdout) => {
    if (logStdout.includes('--force-packages')) {
      let matches = [];

      const regex = /\-\-force\-packages\=([0-9a-z-,]+)/gmi;

      // eslint-disable-next-line no-cond-assign
      while (matches = regex.exec(logStdout)) {
        resolveForcedPackages(matches, regex, resolvedPackages);
      }
    }

    return logAndResolveTask(resolvedPackages, promiseResolve, resolvedPackages.length > 0);
  };
}

function gitDiffExecCallback(promiseResolve) {
  return (error, stdout) => {
    const resolvedPackages = [];

    packages.forEach(resolvePackage(stdout, resolvedPackages));

    return cp.exec('git log -1 --pretty=%B', gitLogExecCallback(resolvedPackages, promiseResolve));
  };
}

function resolve() {
  return new Promise(promiseResolve => cp.exec('git diff HEAD^ HEAD', gitDiffExecCallback(promiseResolve)));
}

export default resolve;
