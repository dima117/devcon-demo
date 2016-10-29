modules.define(
    'todo',
    ['i-bem__dom', 'dom', 'BEMHTML', 'strings__escape', 'jquery'],
    function(provide, BEMDOM, dom, BEMHTML, escape, $) {

provide(BEMDOM.decl(this.name, {

    onSetMod : {
        'js' : {
            'inited' : function() {
                this._add = this.findBlockOn('add', 'button');
                this._text = this.findBlockOn('text', 'input');
                this._list = this.findBlockInside('todo-list');

                this._add.on('click', function () {
                  this._addItem();
                }, this);
            }
        },
    },

    _addItem: function () {
      var _this = this;
      var text = _this._text.getVal();
      var xhr = $.ajax({
        url: 'http://todo.ecm7.ru/Home/Add',
        method: 'GET',
        data: { text: text }
      });

      xhr.success(function (id) {
        BEMDOM.append(
          _this._list.domElem,
          BEMHTML.apply({
            block: 'todo-item',
            js: { id: id },
            content: escape.html(text)
          })
        );
        _this._text.setVal('');
      });
    }
}));

});
