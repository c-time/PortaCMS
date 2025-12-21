#!/usr/bin/env node
import { Command, Option } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { createContentModelCommand, validateContentModelsCommand, listContentModelsCommand } from './commands/contentModel.js';

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


// List content models command
program
  .command('content-model:list')
  .description('List all content models')
  .option('-w, --workspace <slug>', 'workspace slug', 'default')
  .option('-d, --dir <directory>', 'data directory', './porta-data')
  .action(async (options) => {
    await listContentModelsCommand(options);
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
  .option('-d, --dir <directory>', 'data directory', './porta-data')
  .option('-s, --slug <slug>', 'custom slug (auto-generated from name if not provided)')
  .option('--description <description>', 'content model description')
  .action(async (options) => {
    await createContentModelCommand(options);
  });

// Validate content model command
program
  .command('content-model:validate')
  .description('Validate all existing content models')
  .option('-w, --workspace <slug>', 'workspace slug', 'default')
  .option('-d, --dir <directory>', 'data directory', './porta-data')
  .action(async (options) => {
    await validateContentModelsCommand(options);
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
