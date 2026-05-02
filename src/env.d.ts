/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare" />

type D1Database = import('@cloudflare/workers-types').D1Database

interface CloudflareEnv {
  void_blog_posts: D1Database
}

declare namespace App {
  interface Locals {
    cloudflare: {
      env: CloudflareEnv
      ctx: ExecutionContext
    }
  }
}
