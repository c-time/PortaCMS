import { z } from 'zod';
import { UUIDSchema, generateUUID } from '../workspace/entities.js';

// Updated with UUID-based architecture
export const PageContentViewStructureSchema = z.object({
  id: UUIDSchema,
  pageContentViewId: UUIDSchema,
  name: z.string()
    .min(1, { message: "View structure name is required" })
    .max(100, { message: "View structure name must not exceed 100 characters" }),
  slug: z.string()
    .min(1, { message: "Slug is required" })
    .regex(/^[a-z0-9\-_/]+$/, { message: "Invalid slug format" }),
  outputPath: z.string().min(1, { message: "Output path is required" }),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const WebsiteStructureSchema = z.object({
  id: UUIDSchema,
  workspaceId: UUIDSchema,
  name: z.string()
    .min(1, { message: "Website structure name is required" })
    .max(100, { message: "Website structure name must not exceed 100 characters" }),
  domain: z.string()
    .url({ message: "Invalid domain URL format" })
    .optional(),
  baseUrl: z.string()
    .default('/'),
  pageContentViews: z.array(PageContentViewStructureSchema).default([]),
  globalSettings: z.record(z.string(), z.unknown()).default({}),
  seoSettings: z.object({
    defaultTitle: z.string().optional(),
    defaultDescription: z.string().optional(),
    defaultKeywords: z.array(z.string()).default([]),
    ogImage: z.string().url().optional(),
  }).default({ defaultKeywords: [] }),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const WebsiteSchema = z.object({
  id: UUIDSchema,
  projectId: UUIDSchema,
  name: z.string()
    .min(1, { message: "Website name is required" })
    .max(100, { message: "Website name must not exceed 100 characters" }),
  description: z.string()
    .max(500, { message: "Description must not exceed 500 characters" })
    .optional(),
  structure: WebsiteStructureSchema,
  deploymentSettings: z.record(z.string(), z.unknown()).default({}),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PageContentViewStructure = z.infer<typeof PageContentViewStructureSchema>;
export type WebsiteStructure = z.infer<typeof WebsiteStructureSchema>;
export type Website = z.infer<typeof WebsiteSchema>;

// UUID-based helper functions
export function createWebsite(projectId: string, name: string): Website {
  const now = new Date();
  return {
    id: generateUUID(),
    projectId,
    name,
    structure: {
      id: generateUUID(),
      workspaceId: generateUUID(), // This should be provided from actual workspace
      name: `${name} Structure`,
      baseUrl: '/',
      pageContentViews: [],
      globalSettings: {},
      seoSettings: { defaultKeywords: [] },
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    deploymentSettings: {},
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}


// {"/hoge/aaaa.json": { mapper: "Mapper.js", listViews: ["ViewParent", "ViewChild"] }}


/* 

{
  title : "Page",
  multipliable: true,
  mapper : {
    input : {
      iterator : "articles",
      context : { title : "{Article Title} | AAA Company" }
    },
    output: { fileName: "/articles/{articles.id}.json"}
  }
}

{
  title : "Page",
  multipliable: true,
  mapper : {
    input : {
      iterator : "articles",
      singleItemContents : ["SiteConfig", "CompanyPageConfig"],
      views: ["company.CompanyListView", "articles.ArticleDetailView", "categories.default"],
      context : { 
        title : "part of title" ,
        val1 : "aaa" ,
        val2 : "aaa" ,
      }
    },
    script : "article-page-mapper.js",
    output: { fileName: "/articles/{articles.id}.json"}
  }
}

{
  title : "Page",
  multipliable: false,
  mapper : {
    input : {
      singleItemContents : ["SiteConfig", "CompanyPageConfig"],
      context : { title : "Our History | AAA Company" }
    },
    output: { fileName: "/articles/{articles.id}.json"}
  }
}

*/