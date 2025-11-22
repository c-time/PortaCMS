#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .name('porta')
  .description('CLI tool for PortaCMS')
  .version('1.0.0');

// Example command
program
  .command('hello')
  .description('Say hello')
  .argument('[name]', 'name to greet', 'World')
  .action((name: string) => {
    console.log(chalk.green(`Hello, ${name}!`));
  });

program.parse();
