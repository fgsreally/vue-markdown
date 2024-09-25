export function plugin<Fn extends (...args: any) => any>(
    plugin: Fn,
    ...parameters: Parameters<Fn>
) {
    return [plugin, ...parameters]

}