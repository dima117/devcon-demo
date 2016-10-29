block('todo-list')(

  tag()('ul'),

  content()(function () {
    return this.ctx.items.map(function (item) {
      return {
        block: 'todo-item',
        js: { id: item.Id },
        mods: { done: item.Done },
        content: item.Text
      };
    })
  })
)
