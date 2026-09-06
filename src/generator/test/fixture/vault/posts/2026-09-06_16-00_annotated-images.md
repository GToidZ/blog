---
written-on: 2026-09-06 16:00 UTC+7:00
title: Annotated Images
tags: [images, annotation]
---

# Annotated Images

The `^(x, y): text` syntax after an image line places a dashed-circle annotation on the image. Hover to raise it and reveal a tooltip.

![A sample image with two annotations](https://picsum.photos/seed/dossari-annotated/800/450)
^(400, 220): Image annotation description
^(740, 400): Example of bottom-right annotation

Annotation lines not directly after an image stay plain text:

Text content
^(100, 100): This is ignored and shown as plain content text
