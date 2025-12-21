/**
 * Validate Content Models command - Validate all content models in a workspace
 */

import { configureApp, LocalRepositoryFactory } from '@porta-cms/core';
import type { ValidateContentModelsInput } from '@porta-cms/core';
import chalk from 'chalk';
import ora from 'ora';
import { join } from 'path';

export interface ValidateContentModelsOptions {
  workspace?: string;
  dir?: string;
}

/**
 * Validate all content models in a workspace
 */
export async function validateContentModelsCommand(options: ValidateContentModelsOptions) {
  const baseDir = options.dir || './porta-data';

  const spinner = ora('Validating content models...').start();

  try {
    // Configure application with local file-based repositories
    const app = configureApp({
      repositoryFactory: new LocalRepositoryFactory({
        baseDir: join(process.cwd(), baseDir),
        prettyPrint: true,
        autoCreateDirectories: true,
      }),
    });

    // Prepare input
    const input: ValidateContentModelsInput = {
      workspaceSlug: options.workspace || 'default',
    } as ValidateContentModelsInput;

    // Execute validate content models use case
    const result = await app.contentModel.validate.execute(input);

    if (result.invalidModels === 0) {
      spinner.succeed(chalk.green('All content models are valid!'));
    } else {
      spinner.warn(chalk.yellow(`Found ${result.invalidModels} invalid content model(s)`));
    }

    console.log();
    console.log(chalk.bold('Validation Summary:'));
    console.log(chalk.gray('  Workspace:'), result.workspaceSlug);
    console.log(chalk.gray('  Total models:'), result.totalModels);
    console.log(chalk.green('  Valid:'), result.validModels);
    if (result.invalidModels > 0) {
      console.log(chalk.red('  Invalid:'), result.invalidModels);
    }
    console.log();

    // Display detailed results for invalid models
    const invalidResults = result.results.filter(r => !r.isValid);
    if (invalidResults.length > 0) {
      console.log(chalk.bold.red('Invalid Models:'));
      invalidResults.forEach(model => {
        console.log();
        console.log(chalk.red('  ✗'), chalk.bold(model.slug), chalk.gray(`(${model.modelType})`));
        model.errors.forEach(error => {
          console.log(chalk.gray('    -'), error);
        });
      });
      console.log();
    }

    // Display valid models if requested or if there are any
    if (result.validModels > 0) {
      console.log(chalk.bold.green('Valid Models:'));
      result.results
        .filter(r => r.isValid)
        .forEach(model => {
          console.log(chalk.green('  ✓'), model.slug, chalk.gray(`(${model.modelType})`));
        });
      console.log();
    }

    // Exit with error code if any invalid models found
    if (result.invalidModels > 0) {
      process.exit(1);
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to validate content models'));

    if (error instanceof Error) {
      console.error(chalk.red('Error:'), error.message);
    } else {
      console.error(chalk.red('Unknown error occurred'));
    }

    process.exit(1);
  }
}
