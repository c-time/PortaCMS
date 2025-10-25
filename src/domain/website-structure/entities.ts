import {z} from "zod"


const PageSchema = z.object({
  path: z.string()
});

const WebisteStructureSchema = z.object({

  pages: z.array(PageSchema),

});


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