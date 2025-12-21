/**
 * Content Model command - Create new content model in a workspace
 */

import { configureApp, LocalRepositoryFactory } from '@porta-cms/core';
import type { CreateContentModelInput } from '@porta-cms/core';
import chalk from 'chalk';
import ora from 'ora';
import { join } from 'path';

export interface CreateContentModelOptions {
  name: string;
  type: 'list' | 'object';
  workspace?: string;
  dir?: string;
  slug?: string;
  description?: string;
}

/**
 * Create new content model in a specified workspace
 */
export async function createContentModelCommand(options: CreateContentModelOptions) {
  const baseDir = options.dir || './porta-data';
  const modelType = options.type;
  const label = options.name;

  // Generate slug from name if not provided
  const rawSlug = options.slug || options.name.toLowerCase().replace(/\s+/g, '-');

  const spinner = ora('Creating content model...').start();

  try {
    // Configure application with local file-based repositories
    const app = configureApp({
      repositoryFactory: new LocalRepositoryFactory({
        baseDir: join(process.cwd(), baseDir),
        prettyPrint: true,
        autoCreateDirectories: true,
      }),
    });

    spinner.text = `Creating content model: ${rawSlug}`;

    // Prepare input - the execute method will validate and parse using InputSchema
    const input: CreateContentModelInput = {
      workspaceSlug: options.workspace || 'default',
      slug: rawSlug,
      label,
      modelType,
      description: options.description,
    } as CreateContentModelInput;

    // Execute create content model use case (validation happens inside)
    const result = await app.contentModel.create.execute(input);

    spinner.succeed(chalk.green('Content model created successfully!'));

    console.log();
    console.log(chalk.bold('Content Model Details:'));
    console.log(chalk.gray('  Workspace:'), options.workspace || 'default');
    console.log(chalk.gray('  Slug:'), result.contentModel.slug);
    console.log(chalk.gray('  Label:'), result.contentModel.label);
    console.log(chalk.gray('  Type:'), result.contentModel.modelType);
    if (result.contentModel.description) {
      console.log(chalk.gray('  Description:'), result.contentModel.description);
    }
    console.log(chalk.gray('  Active:'), result.contentModel.isActive);
    console.log();
  } catch (error) {
    spinner.fail(chalk.red('Failed to create content model'));

    if (error instanceof Error) {
      console.error(chalk.red('Error:'), error.message);
    } else {
      console.error(chalk.red('Unknown error occurred'));
    }

    process.exit(1);
  }
}
