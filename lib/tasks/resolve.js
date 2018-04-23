import cp from 'child_process';
import fs from 'fs';
import path from 'path';

import { packages } from '../config/Base';
import Log from '../helpers/Log';

function logAndResolveTask(solvedPackages, promiseResolve, hasPackages = false) {
  if (hasPackages) {
    Log.info('\nThe following package(s) have been modified since the last commit:\n');
    solvedPackages.forEach(solvedPackage => Log.info(`- ${solvedPackage}`));
  } else {
    Log.info('There is no modified package since the last commit');
  }

  Log.info('\n');
  fs.writeFileSync(
    path.join(process.cwd(), './packages-manifest.json'),
    JSON.stringify(solvedPackages),
  );

  return promiseResolve();
}

function resolvePackage(stdout, resolvedPackages) {
  return (item) => {
    if (stdout.includes(`diff --git a/packages/${item}`)) return resolvedPackages.push(item);

    return item;
  };
}

function pushResolvedPackage(resolvedPackages) {
  return (singlePackage) => {
    if (resolvedPackages.indexOf(singlePackage) === -1) return resolvedPackages.push(singlePackage);

    return singlePackage;
  };
}

function resolveForcedPackages(matches, regex, resolvedPackages) {
  const mutableRegex = regex;
  const forcedPackages = matches[1].split(',');

  if (matches.index === mutableRegex.lastIndex) mutableRegex.lastIndex += 1;

  return forcedPackages.forEach(pushResolvedPackage(resolvedPackages));
}

function gitLogExecCallback(resolvedPackages, promiseResolve) {
  return (logError, logStdout) => {
    if (logStdout.includes('--force-packages')) {
      let matches = [];

      const regex = /--force-packages=([0-9a-z-,]+)/gmi;

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

export default function () {
  return new Promise(promiseResolve =>
    cp.exec('git diff HEAD^ HEAD', gitDiffExecCallback(promiseResolve)));
}
