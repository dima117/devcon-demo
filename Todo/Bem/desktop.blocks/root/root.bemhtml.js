block('root')(
    replace()(function () {
      var title = 'DevCon – ToDo';
      return {
        block: 'page',
        title: title,
        styles: [{ elem: 'css', url: 'default.min.css' }],
        scripts: [{ elem: 'js', url: 'default.min.js' }],
        content: [
          {
            tag: 'h1',
            content: title
          },
          {
            block: 'todo',
            items: this.ctx.items
          }
        ]
      };
    })
);
