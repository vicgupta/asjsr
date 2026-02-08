"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CmsPageType, Json } from "@/types/database";

export async function createCmsPage(data: {
  slug: string;
  title: string;
  pageType: CmsPageType;
  contentJson: Json;
  contentHtml: string;
  published: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", user.id)
    .single();

  if (!profile?.roles?.includes("editor")) {
    return { error: "Not authorized" };
  }

  const { data: page, error } = await supabase
    .from("cms_pages")
    .insert({
      slug: data.slug,
      title: data.title,
      page_type: data.pageType,
      content_json: data.contentJson,
      content_html: data.contentHtml,
      published: data.published,
      author_id: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/editor/cms");
  revalidatePath(`/${data.slug}`);
  return { id: page.id };
}

export async function updateCmsPage(
  pageId: string,
  data: {
    slug?: string;
    title?: string;
    pageType?: CmsPageType;
    contentJson?: Json;
    contentHtml?: string;
    published?: boolean;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const updateData: any = {};
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.pageType !== undefined) updateData.page_type = data.pageType;
  if (data.contentJson !== undefined) updateData.content_json = data.contentJson;
  if (data.contentHtml !== undefined) updateData.content_html = data.contentHtml;
  if (data.published !== undefined) updateData.published = data.published;

  const { error } = await supabase
    .from("cms_pages")
    .update(updateData)
    .eq("id", pageId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/editor/cms");
  if (data.slug) revalidatePath(`/${data.slug}`);
  return { success: true };
}

export async function deleteCmsPage(pageId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("cms_pages")
    .delete()
    .eq("id", pageId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/editor/cms");
  return { success: true };
}
