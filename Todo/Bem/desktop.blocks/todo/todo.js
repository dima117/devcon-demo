modules.define(
    'todo',
    ['i-bem__dom', 'dom'],
    function(provide, BEMDOM, dom) {

provide(BEMDOM.decl(this.name, {

    onSetMod : {
        'js' : {
            'inited' : function() {
                console.log('hi there');
            }
        },
    }
}));

});
