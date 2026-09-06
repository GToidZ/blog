<%*
const stamp = tp.date.now("YYYY-MM-DD_HH-mm");
const title = await tp.system.prompt("Post title") ?? tp.file.title.replace(/_/g, " ");
const slug = title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "untitled";
if (!/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}_/.test(tp.file.title)) {
  await tp.file.rename(`${stamp}_${slug}`);
}
-%>
---
written-on: <% tp.date.now("YYYY-MM-DD HH:mm [UTC]Z") %>
title: <% title %>
tags: []
---

<% tp.file.cursor(1) %>
