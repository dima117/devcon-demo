modules.define(
    'todo-item',
    ['i-bem__dom', 'control', 'jquery', 'dom'],
    function(provide, BEMDOM, Control, $, dom) {

provide(BEMDOM.decl({ block: this.name, baseBlock: Control }, {

    onSetMod : {
        'js' : {
            'inited' : function() {
                this._trigger = this.findBlockOn('trigger', 'checkbox');
                this._delete = this.findBlockOn('delete', 'button');

                this._trigger.on('change', function (_, state) {
                  this._toggleItem(this.params.id, state);
                }, this);

                this._delete.on('click', function() {
                  this._deleteItem(this.params.id);
                }, this);
            }
        },
    },

    _toggleItem: function (id, state) {
      var _this = this;
      var xhr = $.ajax({
        url: 'http://todo.ecm7.ru/Home/SetState/' + id,
        method: 'GET',
        data: { done: state }
      });

      xhr.success(function () {
        _this.setMod('done', state);
      });
    },

    _deleteItem: function(id) {
      var _this = this;
      var xhr = $.ajax({
        url: 'http://todo.ecm7.ru/Home/Delete/' + id,
        method: 'GET'
      });

      xhr.success(function () {
        BEMDOM.destruct(_this.domElem);
      });
    }

}));

});
