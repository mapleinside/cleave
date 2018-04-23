import commander from 'commander';
import run from '@nicolascava/felfire-run';

import resolve from './lib/tasks/resolve';
import generic from './lib/tasks/generic';
import { version } from './package.json';

const commands = ['resolve', 'install', 'extract'];
const task = commands.indexOf(process.argv[2]) === -1 ? process.argv[2] : null;

async function handleResolveCommand() {
  return run(resolve);
}

async function handleGenericCommand(options) {
  const { all } = options;

  return run(generic, { task, all });
}

function handleMissingCommand() {
  throw new Error('Unknown Cleave task. See all available commands in the documentation: ' +
    'https://github.com/nicolascava/cleave');
}

commander.version(version);

commander
  .command('resolve')
  .action(handleResolveCommand);

if (task) {
  commander
    .command(task)
    .option('--all', '(optional) run Cleave command within each repository package')
    .action(handleGenericCommand);
}

commander
  .command('*')
  .action(handleMissingCommand);

commander.parse(process.argv);
