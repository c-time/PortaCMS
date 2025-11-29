/**
 * Init command - Initialize a new PortaCMS project
 */

import { configureApp, LocalRepositoryFactory } from '@porta-cms/core';
import chalk from 'chalk';
import ora from 'ora';
import { join } from 'path';

export interface InitOptions {
  dir?: string;
  workspace?: string;
}

/**
 * Initialize a new PortaCMS project
 */
export async function initCommand(options: InitOptions = {}) {
  const baseDir = options.dir || './porta-data';
  const workspaceSlug = options.workspace || 'default';

  const spinner = ora('Initializing PortaCMS project...').start();

  try {
    // Configure application with local file-based repositories
    const app = configureApp({
      repositoryFactory: new LocalRepositoryFactory({
        baseDir: join(process.cwd(), baseDir),
        prettyPrint: true,
        autoCreateDirectories: true,
      }),
    });

    spinner.text = `Creating workspace: ${workspaceSlug}`;

    // Create default workspace
    const result = await app.workspace.create.execute({
      slug: workspaceSlug as any,
    });

    spinner.succeed(chalk.green('PortaCMS project initialized successfully!'));

    console.log();
    console.log(chalk.bold('Project Details:'));
    console.log(chalk.gray('  Data directory:'), baseDir);
    console.log(chalk.gray('  Workspace:'), result.workspace.slug);
    console.log();
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.gray('  1. Configure your content models'));
    console.log(chalk.gray('  2. Start creating content'));
    console.log();
  } catch (error) {
    spinner.fail(chalk.red('Failed to initialize project'));

    if (error instanceof Error) {
      console.error(chalk.red('Error:'), error.message);
    } else {
      console.error(chalk.red('Unknown error occurred'));
    }

    process.exit(1);
  }
}
