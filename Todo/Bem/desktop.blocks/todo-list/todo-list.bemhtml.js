block('todo-list')(
    content()(function () {
        return [
            {
                elem: 'title',
                content: 'Hello, BEM!'
            },
            {
                elem: 'body',
                content: JSON.stringify(this.ctx.items)
            }
        ];
    }),

    elem('title').tag()('h1'),

    elem('body').tag()('p')
);