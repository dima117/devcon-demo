block('root')(
    replace()(function () {
        var title = 'DevCon – ToDo',
            basePath = this.ctx.bundleBasePath || '';

      return {
        block: 'page',
        title: title,
        styles: [{ elem: 'css', url: basePath + 'default.min.css' }],
        scripts: [{ elem: 'js', url: basePath + 'default.min.js' }],
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
