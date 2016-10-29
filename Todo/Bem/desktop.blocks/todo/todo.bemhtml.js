block('todo')(

  tag()('main'),

  js()(true),

  content()(function () {
    return {
      elem: 'list',
      content: this.ctx.items.map(function (item) {
        return {
          elem: 'item',
          js: { id: item.Id },
          elemMods: { done: item.Done },
          content: item.Text
        };
      })
    }
  }),

  elem('list').tag()('ul'),
  elem('item').tag()('li')
);
