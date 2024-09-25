
// fork from [react-markdown](https://github.com/remarkjs/react-markdown')
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { urlAttributes } from 'html-url-attributes'
import { Fragment, jsx } from 'vue/jsx-runtime'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import type { Options } from 'remark-rehype'
import { type PluggableList, unified } from 'unified'
import { BuildVisitor, visit } from 'unist-util-visit'
import { VFile } from 'vfile'
import { Component, defineComponent, h, PropType, render, shallowRef } from 'vue'
import { Element, Parents, Root } from 'hast'
import { Root as MdastRoot } from 'mdast'
export const Markdown = defineComponent({

    props: {
        allowedElements: {
            type: Array as PropType<string[]>,
            required: false
        },
        allowElement: {
            type: Function as PropType<(element: Readonly<Element>, index: number, parent: Readonly<Parents> | undefined) => boolean | null | undefined>
        },
        components: {
            type: Object as PropType<Record<string, Component>>,
            required: false
        },
        disallowedElements: {
            type: Array as PropType<string[]>,
            required: false
        },
        rehypePlugins: {
            type: Array as PropType<PluggableList>,
            required: false,
            default: []
        },
        remarkPlugins: {
            type: Array as PropType<PluggableList>,
            required: false,
            default: []
        },
        remarkRehypeOptions: {
            type: Object as PropType<Options>,
            default: {}
        },
        skipHtml: {
            type: Boolean
        },
        unwrapDisallowed: {
            type: Boolean
        },
        urlTransform: {
            type: Function as PropType<(url: string, key: string, node: Readonly<Element>) => string | null | undefined>,
            default: defaultUrlTransform
        }
    },
    setup(props, ctx) {

        const el = shallowRef()
        const { urlTransform, unwrapDisallowed, skipHtml, rehypePlugins, remarkPlugins, disallowedElements, components, allowElement, allowedElements } = props
        const remarkRehypeOptions = { ...props.remarkRehypeOptions, allowDangerousHtml: true, fragment: true }
        const processor = unified()
            .use(remarkParse)
            .use(remarkPlugins)
            .use(remarkRehype, remarkRehypeOptions)
            .use(rehypePlugins)

        const file = new VFile()

        const transform: BuildVisitor<Root> = (node, index, parent) => {
            if (node.type === 'raw' && parent && typeof index === 'number') {
                if (skipHtml) {
                    parent.children.splice(index, 1)
                } else {
                    parent.children[index] = { type: 'text', value: node.value }
                }

                return index
            }

            if (node.type === 'element') {
                let key

                for (key in urlAttributes) {
                    if (
                        Object.hasOwn(urlAttributes, key) &&
                        Object.hasOwn(node.properties, key)
                    ) {
                        const value = node.properties[key]
                        const test = urlAttributes[key]
                        if (test === null || test.includes(node.tagName)) {
                            node.properties[key] = urlTransform(String(value || ''), key, node)
                        }
                    }
                }
            }

            if (node.type === 'element') {
                let remove = allowedElements
                    ? !allowedElements.includes(node.tagName)
                    : disallowedElements
                        ? disallowedElements.includes(node.tagName)
                        : false

                if (!remove && allowElement && typeof index === 'number') {
                    remove = !allowElement(node, index, parent)
                }

                if (remove && parent && typeof index === 'number') {
                    if (unwrapDisallowed && node.children) {
                        parent.children.splice(index, 1, ...node.children)
                    } else {
                        parent.children.splice(index, 1)
                    }

                    return index
                }
            }
        }

        let curTree: MdastRoot// processor.run is asynchronous; make sure to render the latest vnode 

        return () => {
            const children = (ctx.slots.default?.() || []).filter((item) => {
                return item.shapeFlag === 1 << 3
            }).reduce((p, c) => {
                return p + c.children
            }, '')

            file.value = children

            const mdastTree = processor.parse(file)
            curTree = mdastTree
            processor.run(mdastTree, file).then((hastTree) => {
                if (curTree !== mdastTree) return
                visit(hastTree, transform)

                render(toJsxRuntime(hastTree, {
                    Fragment,
                    //@ts-expect-error function component
                    components,
                    ignoreInvalidStyle: true,
                    jsx,
                    jsxs: jsx,
                    passKeys: true,
                    passNode: true
                }), el.value)

            })



            return h('div', { ref: el, ...ctx.attrs })
        }

    }
})

const safeProtocol = /^(https?|ircs?|mailto|xmpp)$/i


export function defaultUrlTransform(value: string): string {
    // Same as:
    // <https://github.com/micromark/micromark/blob/929275e/packages/micromark-util-sanitize-uri/dev/index.js#L34>
    // But without the `encode` part.
    const colon = value.indexOf(':')
    const questionMark = value.indexOf('?')
    const numberSign = value.indexOf('#')
    const slash = value.indexOf('/')

    if (
        // If there is no protocol, it’s relative.
        colon < 0 ||
        // If the first colon is after a `?`, `#`, or `/`, it’s not a protocol.
        (slash > -1 && colon > slash) ||
        (questionMark > -1 && colon > questionMark) ||
        (numberSign > -1 && colon > numberSign) ||
        // It is a protocol, it should be allowed.
        safeProtocol.test(value.slice(0, colon))
    ) {
        return value
    }

    return ''
}