#!/usr/bin/env node
import { Command, Option } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';

const program = new Command();

program
  .name('porta')
  .description('CLI tool for PortaCMS')
  .version('1.0.0');

// Init command - Initialize a new PortaCMS project
program
  .command('init')
  .description('Initialize a new PortaCMS project')
  .option('-d, --dir <directory>', 'data directory', './porta-data')
  .option('-w, --workspace <slug>', 'initial workspace slug', 'default')
  .action(async (options) => {
    await initCommand(options);
  });


// Create content model command
program
  .command('content-model:create')
  .description('Create a new content model')
  .requiredOption('-n, --name <name>', 'content model name')
  .addOption(
    new Option('-t, --type <type>', 'content model type')
      .choices(['list', 'object'])
      .default('list')
      .makeOptionMandatory()
  )
  .option('-w, --workspace <slug>', 'workspace slug', 'default')
  .action(async (options) => {
    console.log(chalk.cyan('Creating content model...'));
    console.log(chalk.gray('  Name:'), options.name);
    console.log(chalk.gray('  Type:'), options.type);
    console.log(chalk.gray('  Workspace:'), options.workspace);
    // TODO: Implement content model creation using core package
  });

// Example command (keeping for reference)
program
  .command('hello')
  .description('Say hello')
  .argument('[name]', 'name to greet', 'World')
  .action((name: string) => {
    console.log(chalk.green(`Hello, ${name}!`));
  });

program.parse();
