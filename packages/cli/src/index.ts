#!/usr/bin/env node
import { Command } from 'commander';
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

// Example command (keeping for reference)
program
  .command('hello')
  .description('Say hello')
  .argument('[name]', 'name to greet', 'World')
  .action((name: string) => {
    console.log(chalk.green(`Hello, ${name}!`));
  });

program.parse();
