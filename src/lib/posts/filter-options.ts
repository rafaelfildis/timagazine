import { asc, eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { postTags, posts, tags, users } from "@/lib/db/schema";
import { isPublished } from "./queries";

export type FilterOptions = {
  tags: { slug: string; name: string }[];
  authors: { id: string; name: string }[];
};

/** Só o que tem matéria visível ao público: não oferece filtro que sempre dá zero. */
export async function getFilterOptions(db: Db): Promise<FilterOptions> {
  const [tagRows, authorRows] = await Promise.all([
    db
      .selectDistinct({ slug: tags.slug, name: tags.name })
      .from(tags)
      .innerJoin(postTags, eq(postTags.tagId, tags.id))
      .innerJoin(posts, eq(posts.id, postTags.postId))
      .where(isPublished)
      .orderBy(asc(tags.name)),
    db
      .selectDistinct({ id: users.id, name: users.name })
      .from(users)
      .innerJoin(posts, eq(posts.authorId, users.id))
      .where(isPublished)
      .orderBy(asc(users.name)),
  ]);
  return { tags: tagRows, authors: authorRows };
}
