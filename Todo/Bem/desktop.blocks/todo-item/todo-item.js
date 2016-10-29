modules.define(
    'todo-item',
    ['i-bem__dom', 'control', 'jquery', 'dom'],
    function(provide, BEMDOM, Control, $, dom) {

provide(BEMDOM.decl({ block: this.name, baseBlock: Control }, {

    onSetMod : {
        'js' : {
            'inited' : function() {
                var trigger = this.findBlockInside('checkbox');

                trigger.on('change', function () {
                  this.toggleMod('done');
                }, this);
            }
        },
    }

}));

});
