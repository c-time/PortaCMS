import {z} from "zod"

// Context schema for dynamic values in page configuration
const ContextSchema = z.record(z.string(), z.string());

// Mapper input configuration
const MapperInputSchema = z.object({
  // Iterator for multipliable pages (e.g., "articles", "products")
  iterator: z.string().optional(),

  // Single item content references (e.g., "SiteConfig", "CompanyPageConfig")
  singleItemContents: z.array(z.string()).optional(),

  // View references (e.g., "company.CompanyListView", "articles.ArticleDetailView")
  views: z.array(z.string()).optional(),

  // Context variables for template interpolation
  context: ContextSchema.optional(),
});

// Mapper output configuration
const MapperOutputSchema = z.object({
  // Output file name pattern (can include variables like "/articles/{articles.id}.json")
  fileName: z.string(),
});

// Mapper configuration for page generation
const MapperSchema = z.object({
  input: MapperInputSchema,

  // Optional custom script for mapping logic
  script: z.string().optional(),

  output: MapperOutputSchema,
});

// Page configuration schema
const PageSchema = z.object({
  // Human-readable page title
  title: z.string(),

  // Whether this page can generate multiple instances (e.g., one per article)
  multipliable: z.boolean(),

  // Mapper configuration for content and output
  mapper: MapperSchema,

  // Output path (for simple cases or generated pages)
  path: z.string().optional(),
});

// Website structure schema
const WebsiteStructureSchema = z.object({
  pages: z.array(PageSchema),
});

// Type exports for TypeScript
export type Context = z.infer<typeof ContextSchema>;
export type MapperInput = z.infer<typeof MapperInputSchema>;
export type MapperOutput = z.infer<typeof MapperOutputSchema>;
export type Mapper = z.infer<typeof MapperSchema>;
export type Page = z.infer<typeof PageSchema>;
export type WebsiteStructure = z.infer<typeof WebsiteStructureSchema>;

// Schema exports for validation
export {
  ContextSchema,
  MapperInputSchema,
  MapperOutputSchema,
  MapperSchema,
  PageSchema,
  WebsiteStructureSchema,
};


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