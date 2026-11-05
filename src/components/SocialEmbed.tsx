"use client";

import Script from "next/script";
import type { SocialPost } from "@/lib/press";

/**
 * A post embedded exactly as the network renders it. X posts use X's own
 * embed script on a standard blockquote; LinkedIn posts use LinkedIn's embed
 * frame. Before the script loads, the blockquote is a plain link to the post,
 * so nothing breaks if the network is blocked.
 */
export function SocialEmbed({ post }: { post: SocialPost }) {
  if (post.platform === "linkedin") {
    return (
      <iframe
        src={`https://www.linkedin.com/embed/feed/update/${post.urn}`}
        title={`LinkedIn post by ${post.author}`}
        loading="lazy"
        className="h-[620px] w-full rounded-lg border border-line bg-white"
        allowFullScreen
      />
    );
  }

  return (
    <>
      <blockquote className="twitter-tweet" data-dnt="true">
        <a href={post.url}>View the post by {post.author} on X</a>
      </blockquote>
      <Script src="https://platform.twitter.com/widgets.js" strategy="lazyOnload" />
    </>
  );
}
