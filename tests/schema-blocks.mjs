// Reads a jig's schema.md into { shared, envelope, modules: { key: skeleton } }.
// The page carries the same text in <script type="text/plain" id="skel-…"> blocks; the drift test holds them equal.
export function parseSchemaDoc(text) {
    const markdown = text.replace(/\r\n/g, '\n');
    const blockAfter = (heading) => {
        const at = markdown.indexOf(heading);
        if (at < 0) throw new Error(`schema.md has no heading "${heading}"`);
        const open = markdown.indexOf('```\n', at);
        const close = markdown.indexOf('\n```', open + 4);
        return markdown.slice(open + 4, close);
    };
    const modules = {};
    for (const match of markdown.matchAll(/^### \S+ `(\w+)`/gm)) {
        modules[match[1]] = blockAfter(match[0]);
    }
    return { shared: blockAfter('## Shared types'), envelope: blockAfter('## Envelope'), modules };
}

export function parsePageBlocks(page) {
    const blocks = {};
    for (const match of page.matchAll(/<script type="text\/plain" id="skel-(\w+)">\n([\s\S]*?)\n<\/script>/g)) {
        blocks[match[1]] = match[2];
    }
    return blocks;
}
