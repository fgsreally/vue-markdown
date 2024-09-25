<script setup lang="ts">
import { Markdown,plugin } from '../../src'
import { ref } from 'vue'
import content from './test.md?raw'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
// import rehypeMathjax from 'rehype-mathjax/browser'
// import rehypeStringify from 'rehype-stringify'
import rehypeRaw from 'rehype-raw';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import Video from './Video.vue'
import rehypeMermaid from 'rehype-mermaid'

const value = ref(content)
const components = {
  video: Video
}
// const plugins = [remarkParse, rehypeKatex, rehypeStringify, remarkMath, remarkRehype, rehypeRaw, remarkBreaks, remarkGfm]
</script>

<template>
  <Markdown class="vp-doc" :remarkPlugins="[remarkGfm, remarkBreaks, remarkMath]"
    :rehypePlugins="[rehypeRaw, rehypeMermaid, plugin(rehypeKatex, { output: 'mathml' })]" :components="components">
    {{ value }}
  </Markdown>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>