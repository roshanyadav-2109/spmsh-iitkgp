import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

/**
 * Announcement bodies are markdown written by reception. They are rendered on
 * the server and sanitised before they reach a page.
 *
 * `remarkRehype` is called without `allowDangerousHtml`, so raw HTML in the
 * source is dropped at the parse stage and never reaches the sanitiser at all.
 * The sanitiser is then a second, independent barrier over the generated tree.
 */
const schema = {
  ...defaultSchema,
  tagNames: [
    "p",
    "br",
    "strong",
    "em",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre",
    "a",
    "h2",
    "h3",
    "h4",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "hr",
  ],
  attributes: {
    a: ["href", "title"],
    th: ["scope"],
  },
  protocols: {
    href: ["http", "https", "mailto", "tel"],
  },
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSanitize, schema)
  .use(rehypeStringify);

export async function renderMarkdown(source: string): Promise<string> {
  const file = await processor.process(source);
  return String(file);
}

/** First paragraph, flattened, for list pages and meta descriptions. */
export function excerpt(source: string, limit = 180): string {
  const text = source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, text.lastIndexOf(" ", limit))}…`;
}
