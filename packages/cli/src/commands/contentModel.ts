/**
 * Content Model commands - Create, list, and validate content models in a workspace
 */

import { configureApp, LocalRepositoryFactory } from '@porta-cms/core';
import type { CreateContentModelInput, ValidateContentModelsInput, ListContentModelsInput } from '@porta-cms/core';
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

// ========================================
// Validate Content Models Command
// ========================================

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

// ========================================
// List Content Models Command
// ========================================

export interface ListContentModelsOptions {
  workspace?: string;
  dir?: string;
}

/**
 * List all content models in a workspace
 */
export async function listContentModelsCommand(options: ListContentModelsOptions) {
  const baseDir = options.dir || './porta-data';

  const spinner = ora('Loading content models...').start();

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
    const input: ListContentModelsInput = {
      workspaceSlug: options.workspace || 'default',
    } as ListContentModelsInput;

    // Execute list content models use case
    const result = await app.contentModel.list.execute(input);

    spinner.succeed(chalk.green(`Found ${result.totalCount} content model(s)`));

    console.log();
    console.log(chalk.bold('Content Models Summary:'));
    console.log(chalk.gray('  Workspace:'), result.workspaceSlug);
    console.log(chalk.gray('  Total:'), result.totalCount);
    console.log(chalk.gray('  List models:'), result.listCount);
    console.log(chalk.gray('  Object models:'), result.objectCount);
    console.log();

    if (result.totalCount > 0) {
      console.log(chalk.bold('Models:'));

      // Group by type
      const listModels = result.contentModels.filter(m => m.modelType === 'list');
      const objectModels = result.contentModels.filter(m => m.modelType === 'object');

      if (listModels.length > 0) {
        console.log();
        console.log(chalk.bold.cyan('  List Models:'));
        listModels.forEach(model => {
          console.log(
            chalk.cyan('    •'),
            chalk.bold(model.slug),
            chalk.gray(`- ${model.label}`)
          );
          if (model.description) {
            console.log(chalk.gray(`      ${model.description}`));
          }
          console.log(
            chalk.gray(`      Status: ${model.isActive ? 'Active' : 'Inactive'}`)
          );
        });
      }

      if (objectModels.length > 0) {
        console.log();
        console.log(chalk.bold.magenta('  Object Models:'));
        objectModels.forEach(model => {
          console.log(
            chalk.magenta('    •'),
            chalk.bold(model.slug),
            chalk.gray(`- ${model.label}`)
          );
          if (model.description) {
            console.log(chalk.gray(`      ${model.description}`));
          }
          console.log(
            chalk.gray(`      Status: ${model.isActive ? 'Active' : 'Inactive'}`)
          );
        });
      }

      console.log();
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to list content models'));

    if (error instanceof Error) {
      console.error(chalk.red('Error:'), error.message);
    } else {
      console.error(chalk.red('Unknown error occurred'));
    }

    process.exit(1);
  }
}
