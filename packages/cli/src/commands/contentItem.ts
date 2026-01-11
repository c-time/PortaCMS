/**
 * Content Item commands - Create, list, and validate content items in a content model
 */

import { configureApp, LocalRepositoryFactory } from '@porta-cms/core';
import type { CreateContentItemInput, ValidateContentItemsInput, ListContentItemsInput } from '@porta-cms/core';
import chalk from 'chalk';
import ora from 'ora';
import { join } from 'path';

// ========================================
// Create Content Item Command
// ========================================

export interface CreateContentItemOptions {
  contentModel: string;
  name: string;
  workspace?: string;
  dir?: string;
  slug?: string;
  generateSample?: boolean;
}

/**
 * Create new content item in a specified content model
 */
export async function createContentItemCommand(options: CreateContentItemOptions) {
  const baseDir = options.dir || './porta-data';
  const contentModelSlug = options.contentModel;

  // Generate slug from name if not provided
  const rawSlug = options.slug || options.name.toLowerCase().replace(/\s+/g, '-');

  const spinner = ora('Creating content item...').start();

  try {
    // Configure application with local file-based repositories
    const app = configureApp({
      repositoryFactory: new LocalRepositoryFactory({
        baseDir: join(process.cwd(), baseDir),
        prettyPrint: true,
        autoCreateDirectories: true,
      }),
    });

    spinner.text = `Creating content item: ${rawSlug}`;

    // Prepare input - the execute method will validate and parse using InputSchema
    const input: CreateContentItemInput = {
      workspaceSlug: options.workspace || 'default',
      contentModelSlug,
      slug: rawSlug,
      generateSampleData: options.generateSample !== false, // Default to true
    } as CreateContentItemInput;

    // Execute create content item use case (validation happens inside)
    const result = await app.contentItem.create.execute(input);

    spinner.succeed(chalk.green('Content item created successfully!'));

    console.log();
    console.log(chalk.bold('Content Item Details:'));
    console.log(chalk.gray('  Workspace:'), options.workspace || 'default');
    console.log(chalk.gray('  Content Model:'), contentModelSlug);
    console.log(chalk.gray('  ID:'), result.contentItem.id);
    console.log(chalk.gray('  Slug:'), result.contentItem.slug);
    console.log(chalk.gray('  Status:'), result.contentItem.status);
    console.log(chalk.gray('  Fields:'), result.contentItem.fields.length);
    console.log(chalk.gray('  Version:'), result.contentItem.version);
    console.log(chalk.gray('  Created:'), result.contentItem.createdAt.toISOString());
    console.log();
  } catch (error) {
    spinner.fail(chalk.red('Failed to create content item'));

    if (error instanceof Error) {
      console.error(chalk.red('Error:'), error.message);
    } else {
      console.error(chalk.red('Unknown error occurred'));
    }

    process.exit(1);
  }
}

// ========================================
// List Content Items Command
// ========================================

export interface ListContentItemsOptions {
  contentModel: string;
  workspace?: string;
  dir?: string;
  status?: 'draft' | 'published' | 'archived';
  limit?: string;
}

/**
 * List all content items for a content model
 */
export async function listContentItemsCommand(options: ListContentItemsOptions) {
  const baseDir = options.dir || './porta-data';
  const contentModelSlug = options.contentModel;

  const spinner = ora('Loading content items...').start();

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
    const input: ListContentItemsInput = {
      workspaceSlug: options.workspace || 'default',
      contentModelSlug,
      status: options.status,
      limit: options.limit ? parseInt(options.limit, 10) : undefined,
    } as ListContentItemsInput;

    // Execute list content items use case
    const result = await app.contentItem.list.execute(input);

    spinner.succeed(chalk.green(`Found ${result.totalCount} content item(s)`));

    console.log();
    console.log(chalk.bold('Content Items Summary:'));
    console.log(chalk.gray('  Workspace:'), result.workspaceSlug);
    console.log(chalk.gray('  Content Model:'), result.contentModelSlug);
    console.log(chalk.gray('  Total:'), result.totalCount);
    console.log(chalk.gray('  Draft:'), result.draftCount);
    console.log(chalk.gray('  Published:'), result.publishedCount);
    console.log(chalk.gray('  Archived:'), result.archivedCount);
    console.log();

    if (result.contentItems.length > 0) {
      console.log(chalk.bold('Items:'));
      console.log();

      // Group by status
      const draftItems = result.contentItems.filter(i => i.status === 'draft');
      const publishedItems = result.contentItems.filter(i => i.status === 'published');
      const archivedItems = result.contentItems.filter(i => i.status === 'archived');

      if (draftItems.length > 0) {
        console.log(chalk.bold.yellow('  Draft:'));
        draftItems.forEach(item => {
          console.log(
            chalk.yellow('    •'),
            chalk.bold(item.slug),
            chalk.gray(`(${item.fieldCount} fields, v${item.version})`)
          );
          console.log(
            chalk.gray(`      ID: ${item.id}`)
          );
          console.log(
            chalk.gray(`      Updated: ${item.updatedAt.toISOString()}`)
          );
        });
        console.log();
      }

      if (publishedItems.length > 0) {
        console.log(chalk.bold.green('  Published:'));
        publishedItems.forEach(item => {
          console.log(
            chalk.green('    •'),
            chalk.bold(item.slug),
            chalk.gray(`(${item.fieldCount} fields, v${item.version})`)
          );
          console.log(
            chalk.gray(`      ID: ${item.id}`)
          );
          console.log(
            chalk.gray(`      Updated: ${item.updatedAt.toISOString()}`)
          );
        });
        console.log();
      }

      if (archivedItems.length > 0) {
        console.log(chalk.bold.gray('  Archived:'));
        archivedItems.forEach(item => {
          console.log(
            chalk.gray('    •'),
            chalk.bold(item.slug),
            chalk.gray(`(${item.fieldCount} fields, v${item.version})`)
          );
          console.log(
            chalk.gray(`      ID: ${item.id}`)
          );
          console.log(
            chalk.gray(`      Updated: ${item.updatedAt.toISOString()}`)
          );
        });
        console.log();
      }
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to list content items'));

    if (error instanceof Error) {
      console.error(chalk.red('Error:'), error.message);
    } else {
      console.error(chalk.red('Unknown error occurred'));
    }

    process.exit(1);
  }
}

// ========================================
// Validate Content Items Command
// ========================================

export interface ValidateContentItemsOptions {
  contentModel: string;
  workspace?: string;
  dir?: string;
}

/**
 * Validate all content items in a content model
 */
export async function validateContentItemsCommand(options: ValidateContentItemsOptions) {
  const baseDir = options.dir || './porta-data';
  const contentModelSlug = options.contentModel;

  const spinner = ora('Validating content items...').start();

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
    const input: ValidateContentItemsInput = {
      workspaceSlug: options.workspace || 'default',
      contentModelSlug,
    } as ValidateContentItemsInput;

    // Execute validate content items use case
    const result = await app.contentItem.validate.execute(input);

    if (result.invalidItems === 0) {
      spinner.succeed(chalk.green('All content items are valid!'));
    } else {
      spinner.warn(chalk.yellow(`Found ${result.invalidItems} invalid content item(s)`));
    }

    console.log();
    console.log(chalk.bold('Validation Summary:'));
    console.log(chalk.gray('  Workspace:'), result.workspaceSlug);
    console.log(chalk.gray('  Content Model:'), result.contentModelSlug);
    console.log(chalk.gray('  Total items:'), result.totalItems);
    console.log(chalk.green('  Valid:'), result.validItems);
    if (result.invalidItems > 0) {
      console.log(chalk.red('  Invalid:'), result.invalidItems);
    }
    console.log();

    // Display detailed results for invalid items
    const invalidResults = result.results.filter(r => !r.isValid);
    if (invalidResults.length > 0) {
      console.log(chalk.bold.red('Invalid Items:'));
      invalidResults.forEach(item => {
        console.log();
        console.log(chalk.red('  ✗'), chalk.bold(item.slug), chalk.gray(`(${item.id})`));
        item.errors.forEach(error => {
          console.log(chalk.gray('    -'), error);
        });
      });
      console.log();
    }

    // Display valid items if requested or if there are any
    if (result.validItems > 0) {
      console.log(chalk.bold.green('Valid Items:'));
      result.results
        .filter(r => r.isValid)
        .forEach(item => {
          console.log(chalk.green('  ✓'), item.slug, chalk.gray(`(${item.id})`));
        });
      console.log();
    }

    // Exit with error code if any invalid items found
    if (result.invalidItems > 0) {
      process.exit(1);
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to validate content items'));

    if (error instanceof Error) {
      console.error(chalk.red('Error:'), error.message);
    } else {
      console.error(chalk.red('Unknown error occurred'));
    }

    process.exit(1);
  }
}
