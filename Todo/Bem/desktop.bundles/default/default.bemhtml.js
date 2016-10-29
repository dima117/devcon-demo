var BEMHTML;

(function(global) {
    function buildBemXjst(__bem_xjst_libs__) {
        var exports = {};

        /// -------------------------------------
/// --------- BEM-XJST Runtime Start ----
/// -------------------------------------
var BEMHTML = function(module, exports) {
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.bemhtml = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var inherits = require('inherits');
var Match = require('../bemxjst/match').Match;
var BemxjstEntity = require('../bemxjst/entity').Entity;

/**
 * @class Entity
 * @param {BEMXJST} bemxjst
 * @param {String} block
 * @param {String} elem
 * @param {Array} templates
 */
function Entity(bemxjst) {
  this.bemxjst = bemxjst;

  this.jsClass = null;

  // "Fast modes"
  this.tag = new Match(this, 'tag');
  this.attrs = new Match(this, 'attrs');
  this.mix = new Match(this, 'mix');
  this.js = new Match(this, 'js');
  this.mods = new Match(this, 'mods');
  this.elemMods = new Match(this, 'elemMods');
  this.bem = new Match(this, 'bem');
  this.cls = new Match(this, 'cls');

  BemxjstEntity.apply(this, arguments);
}

inherits(Entity, BemxjstEntity);
exports.Entity = Entity;

Entity.prototype.init = function init(block, elem) {
  this.block = block;
  this.elem = elem;

  // Class for jsParams
  this.jsClass = this.bemxjst.classBuilder.build(this.block, this.elem);
};

var keys = {
  tag: true,
  content: true,
  attrs: true,
  mix: true,
  js: true,
  mods: true,
  elemMods: true,
  cls: true,
  bem: true
};

Entity.prototype._initRest = function _initRest(key) {
  if (key === 'default') {
    this.rest[key] = this.def;
  } else if (keys[key]) {
    this.rest[key] = this[key];
  } else {
    if (!this.rest.hasOwnProperty(key))
      this.rest[key] = new Match(this, key);
  }
};

Entity.prototype.defaultBody = function defaultBody(context) {
  var mods = this.mods.exec(context);
  context.mods = mods;

  var elemMods;
  if (context.ctx.elem) {
    elemMods = this.elemMods.exec(context);
    context.elemMods = elemMods;
  }

  // Notice: other modes must be after context.mods/context.elemMods changes

  var tag = this.tag.exec(context);
  var content = this.content.exec(context);
  var attrs = this.attrs.exec(context);
  var mix = this.mix.exec(context);
  var js = this.js.exec(context);
  var bem = this.bem.exec(context);
  var cls = this.cls.exec(context);

  return this.bemxjst.render(context,
                             this,
                             tag,
                             js,
                             bem,
                             cls,
                             mix,
                             attrs,
                             content,
                             mods,
                             elemMods);
};

},{"../bemxjst/entity":5,"../bemxjst/match":8,"inherits":11}],2:[function(require,module,exports){
var inherits = require('inherits');
var utils = require('../bemxjst/utils');
var Entity = require('./entity').Entity;
var BEMXJST = require('../bemxjst');

function BEMHTML(options) {
  BEMXJST.apply(this, arguments);

  var xhtml = typeof options.xhtml === 'undefined' ? false : options.xhtml;
  this._shortTagCloser = xhtml ? '/>' : '>';

  this._elemJsInstances = options.elemJsInstances;
  this._omitOptionalEndTags = options.omitOptionalEndTags;
}

inherits(BEMHTML, BEMXJST);
module.exports = BEMHTML;

BEMHTML.prototype.Entity = Entity;

BEMHTML.prototype.runMany = function runMany(arr) {
  var out = '';
  var context = this.context;
  var prevPos = context.position;
  var prevNotNewList = context._notNewList;

  if (prevNotNewList) {
    context._listLength += arr.length - 1;
  } else {
    context.position = 0;
    context._listLength = arr.length;
  }
  context._notNewList = true;

  if (this.canFlush) {
    for (var i = 0; i < arr.length; i++)
      out += context._flush(this._run(arr[i]));
  } else {
    for (var i = 0; i < arr.length; i++)
      out += this._run(arr[i]);
  }

  if (!prevNotNewList)
    context.position = prevPos;

  return out;
};

BEMHTML.prototype.render = function render(context,
                                           entity,
                                           tag,
                                           js,
                                           bem,
                                           cls,
                                           mix,
                                           attrs,
                                           content,
                                           mods,
                                           elemMods) {
  var ctx = context.ctx;

  if (tag === undefined)
    tag = 'div';

  if (!tag)
    return this.renderNoTag(content);

  var out = '<' + tag;

  if (js === true)
    js = {};

  var jsParams;
  if (js) {
    jsParams = {};
    jsParams[entity.jsClass] = js;
  }

  var isBEM = bem;
  if (isBEM === undefined) {
    if (ctx.bem === undefined)
      isBEM = entity.block || entity.elem;
    else
      isBEM = ctx.bem;
  }
  isBEM = !!isBEM;

  if (cls === undefined)
    cls = ctx.cls;

  var addJSInitClass = jsParams && (
    this._elemJsInstances ?
      (entity.block || entity.elem) :
      (entity.block && !entity.elem)
  );

  if (!isBEM && !cls) {
    return this.renderClose(out, context, tag, attrs, isBEM, ctx, content);
  }

  out += ' class="';
  if (isBEM) {
    out += entity.jsClass;
    out += this.buildModsClasses(entity.block, entity.elem,
                                 entity.elem ? elemMods : mods);

    if (mix) {
      var m = this.renderMix(entity, mix, jsParams, addJSInitClass);
      out += m.out;
      jsParams = m.jsParams;
      addJSInitClass = m.addJSInitClass;
    }

    if (cls)
      out += ' ' + (typeof cls === 'string' ?
                    utils.attrEscape(cls).trim() : cls);
  } else {
    if (cls)
      out += cls.trim ? utils.attrEscape(cls).trim() : cls;
  }

  if (addJSInitClass)
    out += ' i-bem"';
  else
    out += '"';

  if (isBEM && jsParams)
    out += ' data-bem=\'' + utils.jsAttrEscape(JSON.stringify(jsParams)) + '\'';

  return this.renderClose(out, context, tag, attrs, isBEM, ctx, content);
};

var OPTIONAL_END_TAGS = {
  // html4 https://html.spec.whatwg.org/multipage/syntax.html#optional-tags
  html: 1, head: 1, body: 1, p: 1, ul: 1, ol: 1, li: 1, dt: 1, dd: 1,
  colgroup: 1, thead: 1, tbody: 1, tfoot: 1, tr: 1, th: 1, td: 1, option: 1,

  // html5 https://www.w3.org/TR/html5/syntax.html#optional-tags
  /* dl — Neither tag is omissible */ rb: 1, rt: 1, rtc: 1, rp: 1, optgroup: 1
};

BEMHTML.prototype.renderClose = function renderClose(prefix,
                                                     context,
                                                     tag,
                                                     attrs,
                                                     isBEM,
                                                     ctx,
                                                     content) {
  var out = prefix;

  out += this.renderAttrs(attrs);

  if (utils.isShortTag(tag)) {
    out += this._shortTagCloser;
    if (this.canFlush)
      out = context._flush(out);
  } else {
    out += '>';
    if (this.canFlush)
      out = context._flush(out);

    // TODO(indutny): skip apply next flags
    if (content || content === 0)
      out += this.renderContent(content, isBEM);

    if (!this._omitOptionalEndTags || !OPTIONAL_END_TAGS.hasOwnProperty(tag))
      out += '</' + tag + '>';
  }

  if (this.canFlush)
    out = context._flush(out);
  return out;
};
BEMHTML.prototype.renderAttrs = function renderAttrs(attrs) {
  var out = '';

  // NOTE: maybe we need to make an array for quicker serialization
  if (utils.isObj(attrs)) {

    /* jshint forin : false */
    for (var name in attrs) {
      var attr = attrs[name];
      if (attr === undefined || attr === false || attr === null)
        continue;

      if (attr === true)
        out += ' ' + name;
      else
        out += ' ' + name + '="' +
          utils.attrEscape(utils.isSimple(attr) ?
                           attr :
                           this.context.reapply(attr)) +
                           '"';
    }
  }

  return out;
};

BEMHTML.prototype.renderMix = function renderMix(entity,
                                                 mix,
                                                 jsParams,
                                                 addJSInitClass) {
  var visited = {};
  var context = this.context;
  var js = jsParams;
  var addInit = addJSInitClass;

  visited[entity.jsClass] = true;

  // Transform mix to the single-item array if it's not array
  if (!Array.isArray(mix))
    mix = [ mix ];

  var classBuilder = this.classBuilder;

  var out = '';
  for (var i = 0; i < mix.length; i++) {
    var item = mix[i];
    if (!item)
      continue;
    if (typeof item === 'string')
      item = { block: item, elem: undefined };

    var hasItem = false;

    if (item.elem) {
      hasItem = item.elem !== entity.elem && item.elem !== context.elem ||
        item.block && item.block !== entity.block;
    } else if (item.block) {
      hasItem = !(item.block === entity.block && item.mods) ||
        item.mods && entity.elem;
    }

    var block = item.block || item._block || context.block;
    var elem = item.elem || item._elem || context.elem;
    var key = classBuilder.build(block, elem);

    var classElem = item.elem ||
                    item._elem ||
                    (item.block ? undefined : context.elem);
    if (hasItem)
      out += ' ' + classBuilder.build(block, classElem);

    out += this.buildModsClasses(block, classElem,
      (item.elem || !item.block && (item._elem || context.elem)) ?
        item.elemMods : item.mods);

    if (item.js) {
      if (!js)
        js = {};

      js[classBuilder.build(block, item.elem)] =
          item.js === true ? {} : item.js;
      if (!addInit)
        addInit = block && !item.elem;
    }

    // Process nested mixes
    if (!hasItem || visited[key])
      continue;

    visited[key] = true;
    var nestedEntity = this.entities[key];
    if (!nestedEntity)
      continue;

    var oldBlock = context.block;
    var oldElem = context.elem;
    var nestedMix = nestedEntity.mix.exec(context);
    context.elem = oldElem;
    context.block = oldBlock;

    if (!nestedMix)
      continue;

    for (var j = 0; j < nestedMix.length; j++) {
      var nestedItem = nestedMix[j];
      if (!nestedItem) continue;

      if (!nestedItem.block &&
          !nestedItem.elem ||
          !visited[classBuilder.build(nestedItem.block, nestedItem.elem)]) {
        if (nestedItem.block) continue;

        nestedItem._block = block;
        nestedItem._elem = elem;
        mix = mix.slice(0, i + 1).concat(
          nestedItem,
          mix.slice(i + 1)
        );
      }
    }
  }

  return {
    out: out,
    jsParams: js,
    addJSInitClass: addInit
  };
};

BEMHTML.prototype.buildModsClasses = function buildModsClasses(block,
                                                               elem,
                                                               mods) {
  if (!mods)
    return '';

  var res = '';

  var modName;

  /*jshint -W089 */
  for (modName in mods) {
    if (!mods.hasOwnProperty(modName) || modName === '')
      continue;

    var modVal = mods[modName];
    if (!modVal && modVal !== 0) continue;
    if (typeof modVal !== 'boolean')
      modVal += '';

    var builder = this.classBuilder;
    res += ' ' + (elem ?
                  builder.buildElemClass(block, elem, modName, modVal) :
                  builder.buildBlockClass(block, modName, modVal));
  }

  return res;
};

BEMHTML.prototype.renderNoTag = function renderNoTag(content) {
  // TODO(indutny): skip apply next flags
  if (content || content === 0)
    return this._run(content);
  return '';
};

},{"../bemxjst":7,"../bemxjst/utils":10,"./entity":1,"inherits":11}],3:[function(require,module,exports){
function ClassBuilder(options) {
  this.modDelim = options.mod || '_';
  this.elemDelim = options.elem || '__';
}
exports.ClassBuilder = ClassBuilder;

ClassBuilder.prototype.build = function build(block, elem) {
  if (!elem)
    return block;
  else
    return block + this.elemDelim + elem;
};

ClassBuilder.prototype.buildModPostfix = function buildModPostfix(modName,
                                                                  modVal) {
  var res = this.modDelim + modName;
  if (modVal !== true) res += this.modDelim + modVal;
  return res;
};

ClassBuilder.prototype.buildBlockClass = function buildBlockClass(name,
                                                                  modName,
                                                                  modVal) {
  var res = name;
  if (modVal) res += this.buildModPostfix(modName, modVal);
  return res;
};

ClassBuilder.prototype.buildElemClass = function buildElemClass(block,
                                                                name,
                                                                modName,
                                                                modVal) {
  var res = this.buildBlockClass(block) + this.elemDelim + name;
  if (modVal) res += this.buildModPostfix(modName, modVal);
  return res;
};

ClassBuilder.prototype.split = function split(key) {
  return key.split(this.elemDelim, 2);
};

},{}],4:[function(require,module,exports){
var utils = require('./utils');

function Context(bemxjst) {
  this._bemxjst = bemxjst;

  this.ctx = null;
  this.block = '';

  // Save current block until the next BEM entity
  this._currBlock = '';

  this.elem = null;
  this.mods = {};
  this.elemMods = {};

  this.position = 0;
  this._listLength = 0;
  this._notNewList = false;

  // (miripiruni) this will be changed in next major release
  this.escapeContent = bemxjst.options.escapeContent !== false;

  // Used in `OnceMatch` check to detect context change
  this._onceRef = {};
}
exports.Context = Context;

Context.prototype._flush = null;

Context.prototype.isSimple = utils.isSimple;

Context.prototype.isShortTag = utils.isShortTag;
Context.prototype.extend = utils.extend;
Context.prototype.identify = utils.identify;

Context.prototype.xmlEscape = utils.xmlEscape;
Context.prototype.attrEscape = utils.attrEscape;
Context.prototype.jsAttrEscape = utils.jsAttrEscape;

Context.prototype.isFirst = function isFirst() {
  return this.position === 1;
};

Context.prototype.isLast = function isLast() {
  return this.position === this._listLength;
};

Context.prototype.generateId = function generateId() {
  return utils.identify(this.ctx);
};

Context.prototype.reapply = function reapply(ctx) {
  return this._bemxjst.run(ctx);
};

},{"./utils":10}],5:[function(require,module,exports){
var utils = require('./utils');
var Match = require('./match').Match;
var tree = require('./tree');
var Template = tree.Template;
var PropertyMatch = tree.PropertyMatch;
var CompilerOptions = tree.CompilerOptions;

function Entity(bemxjst, block, elem, templates) {
  this.bemxjst = bemxjst;

  this.block = null;
  this.elem = null;

  // Compiler options via `xjstOptions()`
  this.options = {};

  // `true` if entity has just a default renderer for `def()` mode
  this.canFlush = true;

  // "Fast modes"
  this.def = new Match(this);
  this.content = new Match(this, 'content');

  // "Slow modes"
  this.rest = {};

  // Initialize
  this.init(block, elem);
  this.initModes(templates);
}
exports.Entity = Entity;

Entity.prototype.init = function init(block, elem) {
  this.block = block;
  this.elem = elem;
};

function contentMode() {
  return this.ctx.content;
}

Entity.prototype.initModes = function initModes(templates) {
  /* jshint maxdepth : false */
  for (var i = 0; i < templates.length; i++) {
    var template = templates[i];

    for (var j = template.predicates.length - 1; j >= 0; j--) {
      var pred = template.predicates[j];
      if (!(pred instanceof PropertyMatch))
        continue;

      if (pred.key !== '_mode')
        continue;

      template.predicates.splice(j, 1);
      this._initRest(pred.value);

      // All templates should go there anyway
      this.rest[pred.value].push(template);
      break;
    }

    if (j === -1)
      this.def.push(template);

    // Merge compiler options
    for (var j = template.predicates.length - 1; j >= 0; j--) {
      var pred = template.predicates[j];
      if (!(pred instanceof CompilerOptions))
        continue;

      this.options = utils.extend(this.options, pred.options);
    }
  }
};

Entity.prototype.prepend = function prepend(other) {
  // Prepend to the slow modes, fast modes are in this hashmap too anyway
  var keys = Object.keys(this.rest);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!other.rest[key])
      continue;

    this.rest[key].prepend(other.rest[key]);
  }

  // Add new slow modes
  keys = Object.keys(other.rest);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (this.rest[key])
      continue;

    this._initRest(key);
    this.rest[key].prepend(other.rest[key]);
  }
};

// NOTE: This could be potentially compiled into inlined invokations
Entity.prototype.run = function run(context) {
  if (this.def.count !== 0)
    return this.def.exec(context);

  return this.defaultBody(context);
};

Entity.prototype.setDefaults = function setDefaults() {
  // Default .content() template for applyNext()
  if (this.content.count !== 0)
    this.content.push(new Template([], contentMode));

  // .def() default
  if (this.def.count !== 0) {
    this.canFlush = this.options.flush || false;
    var self = this;
    this.def.push(new Template([], function defaultBodyProxy() {
      return self.defaultBody(this);
    }));
  }
};

},{"./match":8,"./tree":9,"./utils":10}],6:[function(require,module,exports){
function BEMXJSTError(msg, func) {
  this.name = 'BEMXJSTError';
  this.message = msg;

  if (Error.captureStackTrace)
    Error.captureStackTrace(this, func || this.constructor);
  else
    this.stack = (new Error()).stack;
}

BEMXJSTError.prototype = Object.create(Error.prototype);
BEMXJSTError.prototype.constructor = BEMXJSTError;

exports.BEMXJSTError = BEMXJSTError;

},{}],7:[function(require,module,exports){
var inherits = require('inherits');

var Tree = require('./tree').Tree;
var PropertyMatch = require('./tree').PropertyMatch;
var AddMatch = require('./tree').AddMatch;
var Context = require('./context').Context;
var ClassBuilder = require('./class-builder').ClassBuilder;
var utils = require('./utils');

function BEMXJST(options) {
  this.options = options || {};

  this.entities = null;
  this.defaultEnt = null;

  // Current tree
  this.tree = null;

  // Current match
  this.match = null;

  // Create new Context constructor for overriding prototype
  this.contextConstructor = function ContextChild(bemxjst) {
    Context.call(this, bemxjst);
  };
  inherits(this.contextConstructor, Context);
  this.context = null;

  this.classBuilder = new ClassBuilder(this.options.naming || {});

  // Execution depth, used to invalidate `applyNext` bitfields
  this.depth = 0;

  // Do not call `_flush` on overridden `def()` mode
  this.canFlush = false;

  // oninit templates
  this.oninit = null;

  // Initialize default entity (no block/elem match)
  this.defaultEnt = new this.Entity(this, '', '', []);
  this.defaultElemEnt = new this.Entity(this, '', '', []);
}
module.exports = BEMXJST;

BEMXJST.prototype.locals = Tree.methods
    .concat('local', 'applyCtx', 'applyNext', 'apply');

BEMXJST.prototype.compile = function compile(code) {
  var self = this;

  function applyCtx() {
    return self._run(self.context.ctx);
  }

  function applyCtxWrap(ctx, changes) {
    // Fast case
    if (!changes)
      return self.local({ ctx: ctx }, applyCtx);

    return self.local(changes, function() {
      return self.local({ ctx: ctx }, applyCtx);
    });
  }

  function apply(mode, changes) {
    return self.applyMode(mode, changes);
  }

  function localWrap(changes) {
    return function localBody(body) {
      return self.local(changes, body);
    };
  }

  var tree = new Tree({
    refs: {
      applyCtx: applyCtxWrap,
      local: localWrap,
      apply: apply
    }
  });

  // Yeah, let people pass functions to us!
  var templates = this.recompileInput(code);

  var out = tree.build(templates, [
    localWrap,
    applyCtxWrap,
    function applyNextWrap(changes) {
      if (changes)
        return self.local(changes, applyNextWrap);
      return self.applyNext();
    },
    apply
  ]);

  // Concatenate templates with existing ones
  // TODO(indutny): it should be possible to incrementally add templates
  if (this.tree) {
    out = {
      templates: out.templates.concat(this.tree.templates),
      oninit: this.tree.oninit.concat(out.oninit)
    };
  }
  this.tree = out;

  // Group block+elem entities into a hashmap
  var ent = this.groupEntities(out.templates);

  // Transform entities from arrays to Entity instances
  ent = this.transformEntities(ent);

  this.entities = ent;
  this.oninit = out.oninit;
};

BEMXJST.prototype.recompileInput = function recompileInput(code) {
  var args = BEMXJST.prototype.locals;
  // Reuse function if it already has right arguments
  if (typeof code === 'function' && code.length === args.length)
    return code;

  var out = code.toString();

  // Strip the function
  out = out.replace(/^function[^{]+{|}$/g, '');

  // And recompile it with right arguments
  out = new Function(args.join(', '), out);

  return out;
};

BEMXJST.prototype.groupEntities = function groupEntities(tree) {
  var res = {};
  for (var i = 0; i < tree.length; i++) {
    // Make sure to change only the copy, the original is cached in `this.tree`
    var template = tree[i].clone();
    var block = null;
    var elem;

    elem = undefined;
    for (var j = 0; j < template.predicates.length; j++) {
      var pred = template.predicates[j];
      if (!(pred instanceof PropertyMatch) &&
        !(pred instanceof AddMatch))
        continue;

      if (pred.key === 'block')
        block = pred.value;
      else if (pred.key === 'elem')
        elem = pred.value;
      else
        continue;

      // Remove predicate, we won't much against it
      template.predicates.splice(j, 1);
      j--;
    }

    if (block === null) {
      var msg = 'block(…) subpredicate is not found.\n' +
      '    See template with subpredicates:\n     * ';

      for (var j = 0; j < template.predicates.length; j++) {
        var pred = template.predicates[j];

        if (j !== 0)
          msg += '\n     * ';

        if (pred.key === '_mode') {
          msg += pred.value + '()';
        } else {
          if (Array.isArray(pred.key)) {
            msg += pred.key[0].replace('mods', 'mod')
              .replace('elemMods', 'elemMod') +
              '(\'' + pred.key[1] + '\', \'' + pred.value + '\')';
          } else if (!pred.value || !pred.key) {
            msg += 'match(…)';
          } else {
            msg += pred.key + '(\'' + pred.value + '\')';
          }
        }
      }

      msg += '\n    And template body: \n    (' +
        (typeof template.body === 'function' ?
          template.body :
          JSON.stringify(template.body)) + ')';

      if (typeof BEMXJSTError === 'undefined') {
        BEMXJSTError = require('./error').BEMXJSTError;
      }

      throw new BEMXJSTError(msg);
    }

    var key = this.classBuilder.build(block, elem);

    if (!res[key])
      res[key] = [];
    res[key].push(template);
  }
  return res;
};

BEMXJST.prototype.transformEntities = function transformEntities(entities) {
  var wildcardElems = [];

  var keys = Object.keys(entities);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];

    // TODO(indutny): pass this values over
    var parts = this.classBuilder.split(key);
    var block = parts[0];
    var elem = parts[1];

    if (elem === '*')
      wildcardElems.push(block);

    entities[key] = new this.Entity(
      this, block, elem, entities[key]);
  }

  // Merge wildcard block templates
  if (entities.hasOwnProperty('*')) {
    var wildcard = entities['*'];
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key === '*')
        continue;

      entities[key].prepend(wildcard);
    }
    this.defaultEnt.prepend(wildcard);
    this.defaultElemEnt.prepend(wildcard);
  }

  // Merge wildcard elem templates
  for (var i = 0; i < wildcardElems.length; i++) {
    var block = wildcardElems[i];
    var wildcardKey = this.classBuilder.build(block, '*');
    var wildcard = entities[wildcardKey];
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key === wildcardKey)
        continue;

      var entity = entities[key];
      if (entity.block !== block)
        continue;

      if (entity.elem === undefined)
        continue;

      entities[key].prepend(wildcard);
    }
    this.defaultElemEnt.prepend(wildcard);
  }

  // Set default templates after merging with wildcard
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    entities[key].setDefaults();
    this.defaultEnt.setDefaults();
    this.defaultElemEnt.setDefaults();
  }

  return entities;
};

BEMXJST.prototype._run = function _run(context) {
  var res;
  if (context === undefined || context === '' || context === null)
    res = this.runEmpty();
  else if (Array.isArray(context))
    res = this.runMany(context);
  else if (
    typeof context.html === 'string' &&
    !context.tag &&
    typeof context.block === 'undefined' &&
    typeof context.elem === 'undefined' &&
    typeof context.cls === 'undefined' &&
    typeof context.attrs === 'undefined'
  )
    res = this.runUnescaped(context.html);
  else if (utils.isSimple(context))
    res = this.runSimple(context);
  else
    res = this.runOne(context);
  return res;
};

BEMXJST.prototype.run = function run(json) {
  var match = this.match;
  var context = this.context;

  this.match = null;
  this.context = new this.contextConstructor(this);
  this.canFlush = this.context._flush !== null;
  this.depth = 0;
  var res = this._run(json);

  if (this.canFlush)
    res = this.context._flush(res);

  this.match = match;
  this.context = context;

  return res;
};


BEMXJST.prototype.runEmpty = function runEmpty() {
  this.context._listLength--;
  return '';
};

BEMXJST.prototype.runUnescaped = function runUnescaped(context) {
  this.context._listLength--;
  return '' + context;
};

BEMXJST.prototype.runSimple = function runSimple(simple) {
  this.context._listLength--;
  var res = '';
  if (simple && simple !== true || simple === 0) {
    res += typeof simple === 'string' && this.context.escapeContent ?
      utils.xmlEscape(simple) :
      simple;
  }

  return res;
};

BEMXJST.prototype.runOne = function runOne(json) {
  var context = this.context;

  var oldCtx = context.ctx;
  var oldBlock = context.block;
  var oldCurrBlock = context._currBlock;
  var oldElem = context.elem;
  var oldMods = context.mods;
  var oldElemMods = context.elemMods;

  if (json.block || json.elem)
    context._currBlock = '';
  else
    context._currBlock = context.block;

  context.ctx = json;
  if (json.block) {
    context.block = json.block;

    if (json.mods)
      context.mods = json.mods;
    else if (json.block !== oldBlock || !json.elem)
      context.mods = {};
  } else {
    if (!json.elem)
      context.block = '';
    else if (oldCurrBlock)
      context.block = oldCurrBlock;
  }

  context.elem = json.elem;
  if (json.elemMods)
    context.elemMods = json.elemMods;
  else
    context.elemMods = {};

  var block = context.block || '';
  var elem = context.elem;

  // Control list position
  if (block || elem)
    context.position++;
  else
    context._listLength--;

  // To invalidate `applyNext` flags
  this.depth++;

  var key = this.classBuilder.build(block, elem);

  var restoreFlush = false;
  var ent = this.entities[key];
  if (ent) {
    if (this.canFlush && !ent.canFlush) {
      // Entity does not support flushing, do not flush anything nested
      restoreFlush = true;
      this.canFlush = false;
    }
  } else {
    // No entity - use default one
    ent = this.defaultEnt;
    if (elem !== undefined)
      ent = this.defaultElemEnt;
    ent.init(block, elem);
  }

  var res = this.options.production === true ?
    this.tryRun(context, ent) :
    ent.run(context);

  context.ctx = oldCtx;
  context.block = oldBlock;
  context.elem = oldElem;
  context.mods = oldMods;
  context.elemMods = oldElemMods;
  context._currBlock = oldCurrBlock;
  this.depth--;
  if (restoreFlush)
    this.canFlush = true;

  return res;
};

BEMXJST.prototype.tryRun = function tryRun(context, ent) {
  try {
    return ent.run(context);
  } catch (e) {
    console.error('BEMXJST ERROR: cannot render ' +
      [
        'block ' + context.block,
        'elem ' + context.elem,
        'mods ' + JSON.stringify(context.mods),
        'elemMods ' + JSON.stringify(context.elemMods)
      ].join(', '), e);
    return '';
  }
};

BEMXJST.prototype.renderContent = function renderContent(content, isBEM) {
  var context = this.context;
  var oldPos = context.position;
  var oldListLength = context._listLength;
  var oldNotNewList = context._notNewList;

  context._notNewList = false;
  if (isBEM) {
    context.position = 0;
    context._listLength = 1;
  }

  var res = this._run(content);

  context.position = oldPos;
  context._listLength = oldListLength;
  context._notNewList = oldNotNewList;

  return res;
};

BEMXJST.prototype.local = function local(changes, body) {
  var keys = Object.keys(changes);
  var restore = [];
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var parts = key.split('.');

    var value = this.context;
    for (var j = 0; j < parts.length - 1; j++)
      value = value[parts[j]];

    restore.push({
      parts: parts,
      value: value[parts[j]]
    });
    value[parts[j]] = changes[key];
  }

  var res = body.call(this.context);

  for (var i = 0; i < restore.length; i++) {
    var parts = restore[i].parts;
    var value = this.context;
    for (var j = 0; j < parts.length - 1; j++)
      value = value[parts[j]];

    value[parts[j]] = restore[i].value;
  }

  return res;
};

BEMXJST.prototype.applyNext = function applyNext() {
  return this.match.exec(this.context);
};

BEMXJST.prototype.applyMode = function applyMode(mode, changes) {
  var match = this.match.entity.rest[mode];
  if (!match) {
    if (mode === 'mods')
      return this.context.mods;

    if (mode === 'elemMods')
      return this.context.elemMods;

    return this.context.ctx[mode];
  }

  if (!changes)
    return match.exec(this.context);

  var self = this;

  // Allocate function this way, to prevent allocation at the top of the
  // `applyMode`
  var fn = function localBody() {
    return match.exec(self.context);
  };
  return this.local(changes, fn);
};

BEMXJST.prototype.exportApply = function exportApply(exports) {
  var self = this;
  exports.apply = function apply(context) {
    return self.run(context);
  };

  // Add templates at run time
  exports.compile = function compile(templates) {
    return self.compile(templates);
  };

  var sharedContext = {};

  exports.BEMContext = this.contextConstructor;
  sharedContext.BEMContext = exports.BEMContext;

  for (var i = 0; i < this.oninit.length; i++) {
    var oninit = this.oninit[i];

    oninit(exports, sharedContext);
  }
};

},{"./class-builder":3,"./context":4,"./error":6,"./tree":9,"./utils":10,"inherits":11}],8:[function(require,module,exports){
var tree = require('./tree');
var PropertyMatch = tree.PropertyMatch;
var AddMatch = tree.AddMatch;
var WrapMatch = tree.WrapMatch;
var CustomMatch = tree.CustomMatch;

function MatchProperty(template, pred) {
  this.template = template;
  this.key = pred.key;
  this.value = pred.value;
}

MatchProperty.prototype.exec = function exec(context) {
  return context[this.key] === this.value;
};

function MatchNested(template, pred) {
  this.template = template;
  this.keys = pred.key;
  this.value = pred.value;
}

MatchNested.prototype.exec = function exec(context) {
  var val = context;

  for (var i = 0; i < this.keys.length - 1; i++) {
    val = val[this.keys[i]];
    if (!val)
      return false;
  }

  val = val[this.keys[i]];

  if (this.value === true)
    return val !== undefined && val !== '' && val !== false && val !== null;

  return String(val) === this.value;
};

function MatchCustom(template, pred) {
  this.template = template;
  this.body = pred.body;
}

MatchCustom.prototype.exec = function exec(context) {
  return this.body.call(context, context, context.ctx);
};

function MatchWrap(template) {
  this.template = template;
  this.wrap = null;
}

MatchWrap.prototype.exec = function exec(context) {
  var res = this.wrap !== context.ctx;
  this.wrap = context.ctx;
  return res;
};

function AddWrap(template, pred) {
  this.template = template;
  this.key = pred.key;
  this.value = pred.value;
}

AddWrap.prototype.exec = function exec(context) {
  return context[this.key] === this.value;
};

function MatchTemplate(mode, template) {
  this.mode = mode;
  this.predicates = new Array(template.predicates.length);
  this.body = template.body;

  var postpone = [];

  for (var i = 0, j = 0; i < this.predicates.length; i++, j++) {
    var pred = template.predicates[i];
    if (pred instanceof PropertyMatch) {
      if (Array.isArray(pred.key))
        this.predicates[j] = new MatchNested(this, pred);
      else
        this.predicates[j] = new MatchProperty(this, pred);
    } else if (pred instanceof AddMatch) {
      this.predicates[j] = new AddWrap(this, pred);
    } else if (pred instanceof CustomMatch) {
      this.predicates[j] = new MatchCustom(this, pred);

      // Push MatchWrap later, they should not be executed first.
      // Otherwise they will set flag too early, and body might not be executed
    } else if (pred instanceof WrapMatch) {
      j--;
      postpone.push(new MatchWrap(this));
    } else {
      // Skip
      j--;
    }
  }

  // Insert late predicates
  for (var i = 0; i < postpone.length; i++, j++)
    this.predicates[j] = postpone[i];

  if (this.predicates.length !== j)
    this.predicates.length = j;
}
exports.MatchTemplate = MatchTemplate;

function Match(entity, modeName) {
  this.entity = entity;
  this.modeName = modeName;
  this.bemxjst = this.entity.bemxjst;
  this.templates = [];

  // applyNext mask
  this.mask = [ 0 ];

  // We are going to create copies of mask for nested `applyNext()`
  this.maskSize = 0;
  this.maskOffset = 0;

  this.count = 0;
  this.depth = -1;

  this.thrownError = null;
}
exports.Match = Match;

Match.prototype.clone = function clone(entity) {
  var res = new Match(entity, this.modeName);

  res.templates = this.templates.slice();
  res.mask = this.mask.slice();
  res.maskSize = this.maskSize;
  res.count = this.count;

  return res;
};

Match.prototype.prepend = function prepend(other) {
  this.templates = other.templates.concat(this.templates);
  this.count += other.count;

  while (Math.ceil(this.count / 31) > this.mask.length)
    this.mask.push(0);

  this.maskSize = this.mask.length;
};

Match.prototype.push = function push(template) {
  this.templates.push(new MatchTemplate(this, template));
  this.count++;

  if (Math.ceil(this.count / 31) > this.mask.length)
    this.mask.push(0);

  this.maskSize = this.mask.length;
};

Match.prototype.tryCatch = function tryCatch(fn, ctx) {
  try {
    return fn.call(ctx, ctx, ctx.ctx);
  } catch (e) {
    this.thrownError = e;
  }
};

Match.prototype.exec = function exec(context) {
  var save = this.checkDepth();

  var template;
  var bitIndex = this.maskOffset;
  var mask = this.mask[bitIndex];
  var bit = 1;
  for (var i = 0; i < this.count; i++) {
    if ((mask & bit) === 0) {
      template = this.templates[i];
      for (var j = 0; j < template.predicates.length; j++) {
        var pred = template.predicates[j];

        /* jshint maxdepth : false */
        if (!pred.exec(context))
          break;
      }

      // All predicates matched!
      if (j === template.predicates.length)
        break;
    }

    if (bit === 0x40000000) {
      bitIndex++;
      mask = this.mask[bitIndex];
      bit = 1;
    } else {
      bit <<= 1;
    }
  }

  if (i === this.count) {
    if (this.modeName === 'mods')
      return context.mods;

    if (this.modeName === 'elemMods')
      return context.elemMods;

    return context.ctx[this.modeName];
  }

  var oldMask = mask;
  var oldMatch = this.bemxjst.match;
  this.mask[bitIndex] |= bit;
  this.bemxjst.match = this;

  this.thrownError = null;

  var out;
  if (typeof template.body === 'function')
    out = this.tryCatch(template.body, context);
  else
    out = template.body;

  this.mask[bitIndex] = oldMask;
  this.bemxjst.match = oldMatch;
  this.restoreDepth(save);

  var e = this.thrownError;
  if (e !== null) {
    this.thrownError = null;
    throw e;
  }

  return out;
};

Match.prototype.checkDepth = function checkDepth() {
  if (this.depth === -1) {
    this.depth = this.bemxjst.depth;
    return -1;
  }

  if (this.bemxjst.depth === this.depth)
    return this.depth;

  var depth = this.depth;
  this.depth = this.bemxjst.depth;

  this.maskOffset += this.maskSize;

  while (this.mask.length < this.maskOffset + this.maskSize)
    this.mask.push(0);

  return depth;
};

Match.prototype.restoreDepth = function restoreDepth(depth) {
  if (depth !== -1 && depth !== this.depth)
    this.maskOffset -= this.maskSize;
  this.depth = depth;
};

},{"./tree":9}],9:[function(require,module,exports){
var assert = require('minimalistic-assert');
var inherits = require('inherits');
var utils = require('./utils');

function Template(predicates, body) {
  this.predicates = predicates;

  this.body = body;
}
exports.Template = Template;

Template.prototype.wrap = function wrap() {
  var body = this.body;
  for (var i = 0; i < this.predicates.length; i++) {
    var pred = this.predicates[i];
    body = pred.wrapBody(body);
  }
  this.body = body;
};

Template.prototype.clone = function clone() {
  return new Template(this.predicates.slice(), this.body);
};

function MatchBase() {
}
exports.MatchBase = MatchBase;

MatchBase.prototype.wrapBody = function wrapBody(body) {
  return body;
};

function Item(tree, children) {
  this.conditions = [];
  this.children = [];

  for (var i = children.length - 1; i >= 0; i--) {
    var arg = children[i];
    if (arg instanceof MatchBase)
      this.conditions.push(arg);
    else if (arg === tree.boundBody)
      this.children[i] = tree.queue.pop();
    else
      this.children[i] = arg;
  }
}

function WrapMatch(refs) {
  MatchBase.call(this);

  this.refs = refs;
}
inherits(WrapMatch, MatchBase);
exports.WrapMatch = WrapMatch;

WrapMatch.prototype.wrapBody = function wrapBody(body) {
  var applyCtx = this.refs.applyCtx;

  if (typeof body !== 'function') {
    return function inlineAdaptor() {
      return applyCtx(body);
    };
  }

  return function wrapAdaptor() {
    return applyCtx(body.call(this, this, this.ctx));
  };
};

function ReplaceMatch(refs) {
  MatchBase.call(this);

  this.refs = refs;
}
inherits(ReplaceMatch, MatchBase);
exports.ReplaceMatch = ReplaceMatch;

ReplaceMatch.prototype.wrapBody = function wrapBody(body) {
  var applyCtx = this.refs.applyCtx;

  if (typeof body !== 'function') {
    return function inlineAdaptor() {
      return applyCtx(body);
    };
  }

  return function replaceAdaptor() {
    return applyCtx(body.call(this, this, this.ctx));
  };
};

function ExtendMatch(refs) {
  MatchBase.call(this);

  this.refs = refs;
}
inherits(ExtendMatch, MatchBase);
exports.ExtendMatch = ExtendMatch;

ExtendMatch.prototype.wrapBody = function wrapBody(body) {
  var refs = this.refs;
  var applyCtx = refs.applyCtx;
  var local = refs.local;

  if (typeof body !== 'function') {
    return function inlineAdaptor() {
      var changes = {};

      var keys = Object.keys(body);
      for (var i = 0; i < keys.length; i++)
        changes['ctx.' + keys[i]] = body[keys[i]];

      return local(changes)(function preApplyCtx() {
        return applyCtx(this.ctx);
      });
    };
  }

  return function localAdaptor() {
    var changes = {};

    var obj = body.call(this);
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++)
      changes['ctx.' + keys[i]] = obj[keys[i]];

    return local(changes)(function preApplyCtx() {
      return applyCtx(this.ctx);
    });
  };
};

function AddMatch(mode, refs) {
  MatchBase.call(this);

  this.mode = mode;
  this.refs = refs;
}
inherits(AddMatch, MatchBase);
exports.AddMatch = AddMatch;

AddMatch.prototype.wrapBody = function wrapBody(body) {
  return this[this.mode + 'WrapBody'](body);
};

AddMatch.prototype.appendContentWrapBody =
  function appendContentWrapBody(body) {
  var refs = this.refs;
  var applyCtx = refs.applyCtx;
  var apply = refs.apply;

  if (typeof body !== 'function') {
    return function inlineAppendContentAddAdaptor() {
      return [ apply('content') , body ];
    };
  }

  return function appendContentAddAdaptor() {
    return [ apply('content'), applyCtx(body.call(this, this, this.ctx)) ];
  };
};

AddMatch.prototype.prependContentWrapBody =
  function prependContentWrapBody(body) {
  var refs = this.refs;
  var applyCtx = refs.applyCtx;
  var apply = refs.apply;

  if (typeof body !== 'function') {
    return function inlinePrependContentAddAdaptor() {
      return [ body, apply('content') ];
    };
  }

  return function prependContentAddAdaptor() {
    return [ applyCtx(body.call(this, this, this.ctx)), apply('content') ];
  };
};

AddMatch.prototype.mixWrapBody = function mixWrapBody(body) {
  var apply = this.refs.apply;

  if (typeof body !== 'function') {
    return function inlineAddMixAdaptor() {
      var ret = apply('mix');
      if (!Array.isArray(ret)) ret = [ ret ];
      return ret.concat(body);
    };
  }

  return function addMixAdaptor() {
    var ret = apply('mix');
    if (!Array.isArray(ret)) ret = [ ret ];
    return ret.concat(body.call(this, this, this.ctx));
  };
};

AddMatch.prototype.attrsWrapBody = function attrsWrapBody(body) {
  var apply = this.refs.apply;

  if (typeof body !== 'function') {
    return function inlineAddAttrsAdaptor() {
      return utils.extend(apply('attrs') || {}, body);
    };
  }

  return function addAttrsAdaptor() {
    return utils.extend(apply('attrs') || {}, body.call(this, this, this.ctx));
  };
};

AddMatch.prototype.jsWrapBody = function jsWrapBody(body) {
  var apply = this.refs.apply;

  if (typeof body !== 'function') {
    return function inlineAddJsAdaptor() {
      return utils.extend(apply('js') || {}, body);
    };
  }

  return function addJsAdaptor() {
    return utils.extend(apply('js') || {}, body.call(this, this, this.ctx));
  };
};

AddMatch.prototype.modsWrapBody = function modsWrapBody(body) {
  var apply = this.refs.apply;

  if (typeof body !== 'function') {
    return function inlineAddModsAdaptor() {
      this.mods = utils.extend(apply('mods'), body);
      return this.mods;
    };
  }

  return function addModsAdaptor() {
    this.mods = utils.extend(apply('mods'), body.call(this, this, this.ctx));
    return this.mods;
  };
};

AddMatch.prototype.elemModsWrapBody = function elemModsWrapBody(body) {
  var apply = this.refs.apply;

  if (typeof body !== 'function') {
    return function inlineAddElemModsAdaptor() {
      this.elemMods = utils.extend(apply('elemMods'), body);
      return this.elemMods;
    };
  }

  return function addElemModsAdaptor() {
    this.elemMods = utils.extend(apply('elemMods'),
                             body.call(this, this, this.ctx));
    return this.elemMods;
  };
};

function CompilerOptions(options) {
  MatchBase.call(this);
  this.options = options;
}
inherits(CompilerOptions, MatchBase);
exports.CompilerOptions = CompilerOptions;

function PropertyMatch(key, value) {
  MatchBase.call(this);

  this.key = key;
  this.value = value;
}
inherits(PropertyMatch, MatchBase);
exports.PropertyMatch = PropertyMatch;

function CustomMatch(body) {
  MatchBase.call(this);

  this.body = body;
}
inherits(CustomMatch, MatchBase);
exports.CustomMatch = CustomMatch;

function Tree(options) {
  this.options = options;
  this.refs = this.options.refs;

  this.boundBody = this.body.bind(this);

  var methods = this.methods('body');
  for (var i = 0; i < methods.length; i++) {
    var method = methods[i];
    // NOTE: method.name is empty because of .bind()
    this.boundBody[Tree.methods[i]] = method;
  }

  this.queue = [];
  this.templates = [];
  this.initializers = [];
}
exports.Tree = Tree;

Tree.methods = [
  // Subpredicates:
  'match', 'block', 'elem', 'mod', 'elemMod',
  // Runtime related:
  'oninit', 'xjstOptions',
  // Output generators:
  'wrap', 'replace', 'extend', 'mode', 'def',
  'content', 'appendContent', 'prependContent',
  'attrs', 'addAttrs', 'js', 'addJs', 'mix', 'addMix',
  'mods', 'addMods', 'addElemMods', 'elemMods',
  'tag', 'cls', 'bem'
];

Tree.prototype.build = function build(templates, apply) {
  var methods = this.methods('global').concat(apply);
  methods[0] = this.match.bind(this);

  templates.apply({}, methods);

  return {
    templates: this.templates.slice().reverse(),
    oninit: this.initializers
  };
};

function methodFactory(self, kind, name) {
  var method = self[name];
  var boundBody = self.boundBody;

  if (kind !== 'body') {
    if (name === 'replace' || name === 'extend' || name === 'wrap') {
      return function wrapExtended() {
        return method.apply(self, arguments);
      };
    }

    return function wrapNotBody() {
      method.apply(self, arguments);
      return boundBody;
    };
  }

  return function wrapBody() {
    var res = method.apply(self, arguments);

    // Insert body into last item
    var child = self.queue.pop();
    var last = self.queue[self.queue.length - 1];
    last.conditions = last.conditions.concat(child.conditions);
    last.children = last.children.concat(child.children);

    if (name === 'replace' || name === 'extend' || name === 'wrap')
      return res;
    return boundBody;
  };
}

Tree.prototype.methods = function methods(kind) {
  var out = new Array(Tree.methods.length);

  for (var i = 0; i < out.length; i++) {
    var name = Tree.methods[i];
    out[i] = methodFactory(this, kind, name);
  }

  return out;
};

// Called after all matches
Tree.prototype.flush = function flush(conditions, item) {
  var subcond;

  if (item.conditions)
    subcond = conditions.concat(item.conditions);
  else
    subcond = item.conditions;

  for (var i = 0; i < item.children.length; i++) {
    var arg = item.children[i];

    // Go deeper
    if (arg instanceof Item) {
      this.flush(subcond, item.children[i]);

    // Body
    } else {
      var template = new Template(conditions, arg);
      template.wrap();
      this.templates.push(template);
    }
  }
};

Tree.prototype.body = function body() {
  var children = new Array(arguments.length);
  for (var i = 0; i < arguments.length; i++)
    children[i] = arguments[i];

  var child = new Item(this, children);
  this.queue[this.queue.length - 1].children.push(child);

  if (this.queue.length === 1)
    this.flush([], this.queue.shift());

  return this.boundBody;
};

Tree.prototype.match = function match() {
  var children = new Array(arguments.length);
  for (var i = 0; i < arguments.length; i++) {
    var arg = arguments[i];
    if (typeof arg === 'function')
      arg = new CustomMatch(arg);
    assert(arg instanceof MatchBase, 'Wrong .match() argument');
    children[i] = arg;
  }

  this.queue.push(new Item(this, children));

  return this.boundBody;
};

Tree.prototype.applyMode = function applyMode(args, mode) {
  if (args.length) {
    throw new Error('Predicate should not have arguments but ' +
      JSON.stringify(args) + ' passed');
  }

  return this.mode(mode);
};

Tree.prototype.wrap = function wrap() {
  return this.def.apply(this, arguments).match(new WrapMatch(this.refs));
};

Tree.prototype.xjstOptions = function xjstOptions(options) {
  this.queue.push(new Item(this, [
    new CompilerOptions(options)
  ]));
  return this.boundBody;
};

Tree.prototype.block = function block(name) {
  return this.match(new PropertyMatch('block', name));
};

Tree.prototype.elem = function elem(name) {
  return this.match(new PropertyMatch('elem', name));
};

Tree.prototype.mode = function mode(name) {
  return this.match(new PropertyMatch('_mode', name));
};

Tree.prototype.mod = function mod(name, value) {
  return this.match(new PropertyMatch([ 'mods', name ],
                                  value === undefined ? true : String(value)));
};

Tree.prototype.mods = function mods() {
  return this.applyMode(arguments, 'mods');
};

Tree.prototype.addMods = function addMods() {
  return this.mods.apply(this, arguments)
    .match(new AddMatch('mods', this.refs));
};

Tree.prototype.elemMod = function elemMod(name, value) {
  return this.match(new PropertyMatch([ 'elemMods', name ],
                                  value === undefined ?  true : String(value)));
};

Tree.prototype.elemMods = function elemMods() {
  return this.applyMode(arguments, 'elemMods');
};

Tree.prototype.addElemMods = function addElemMods() {
  return this.elemMods.apply(this, arguments)
    .match(new AddMatch('elemMods', this.refs));
};

Tree.prototype.def = function def() {
  return this.applyMode(arguments, 'default');
};

Tree.prototype.tag = function tag() {
  return this.applyMode(arguments, 'tag');
};

Tree.prototype.attrs = function attrs() {
  return this.applyMode(arguments, 'attrs');
};

Tree.prototype.addAttrs = function addAttrs() {
  return this.attrs.apply(this, arguments)
    .match(new AddMatch('attrs', this.refs));
};

Tree.prototype.cls = function cls() {
  return this.applyMode(arguments, 'cls');
};

Tree.prototype.js = function js() {
  return this.applyMode(arguments, 'js');
};

Tree.prototype.addJs = function addAttrs() {
  return this.js.apply(this, arguments).match(new AddMatch('js', this.refs));
};

Tree.prototype.bem = function bem() {
  return this.applyMode(arguments, 'bem');
};

Tree.prototype.addMix = function addMix() {
  return this.mix.apply(this, arguments).match(new AddMatch('mix', this.refs));
};

Tree.prototype.mix = function mix() {
  return this.applyMode(arguments, 'mix');
};

Tree.prototype.content = function content() {
  return this.applyMode(arguments, 'content');
};

Tree.prototype.appendContent = function appendContent() {
  return this.content.apply(this, arguments)
    .match(new AddMatch('appendContent', this.refs));
};


Tree.prototype.prependContent = function prependContent() {
  return this.content.apply(this, arguments)
    .match(new AddMatch('prependContent', this.refs));
};

Tree.prototype.replace = function replace() {
  return this.def.apply(this, arguments).match(new ReplaceMatch(this.refs));
};

Tree.prototype.extend = function extend() {
  return this.def.apply(this, arguments).match(new ExtendMatch(this.refs));
};

Tree.prototype.oninit = function oninit(fn) {
  this.initializers.push(fn);
};

},{"./utils":10,"inherits":11,"minimalistic-assert":12}],10:[function(require,module,exports){
var amp = '&amp;';
var lt = '&lt;';
var gt = '&gt;';
var quot = '&quot;';
var singleQuot = '&#39;';

var matchXmlRegExp = /[&<>]/;

exports.xmlEscape = function(string) {
  var str = '' + string;
  var match = matchXmlRegExp.exec(str);

  if (!match)
    return str;

  var escape;
  var html = '';
  var index = 0;
  var lastIndex = 0;

  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 38: // &
        escape = amp;
        break;
      case 60: // <
        escape = lt;
        break;
      case 62: // >
        escape = gt;
        break;
      default:
        continue;
    }

    if (lastIndex !== index)
      html += str.substring(lastIndex, index);

    lastIndex = index + 1;
    html += escape;
  }

  return lastIndex !== index ?
    html + str.substring(lastIndex, index) :
    html;
};

var matchAttrRegExp = /["&]/;

exports.attrEscape = function(string) {
  var str = '' + string;
  var match = matchAttrRegExp.exec(str);

  if (!match)
    return str;

  var escape;
  var html = '';
  var index = 0;
  var lastIndex = 0;

  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34: // "
        escape = quot;
        break;
      case 38: // &
        escape = amp;
        break;
      default:
        continue;
    }

    if (lastIndex !== index)
      html += str.substring(lastIndex, index);

    lastIndex = index + 1;
    html += escape;
  }

  return lastIndex !== index ?
    html + str.substring(lastIndex, index) :
    html;
};

var matchJsAttrRegExp = /['&]/;

exports.jsAttrEscape = function(string) {
  var str = '' + string;
  var match = matchJsAttrRegExp.exec(str);

  if (!match)
    return str;

  var escape;
  var html = '';
  var index = 0;
  var lastIndex = 0;

  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 38: // &
        escape = amp;
        break;
      case 39: // '
        escape = singleQuot;
        break;
      default:
        continue;
    }

    if (lastIndex !== index)
      html += str.substring(lastIndex, index);

    lastIndex = index + 1;
    html += escape;
  }

  return lastIndex !== index ?
    html + str.substring(lastIndex, index) :
    html;
};

exports.extend = function extend(o1, o2) {
  if (!o1 || !o2)
    return o1 || o2;

  var res = {};
  var n;

  for (n in o1)
    if (o1.hasOwnProperty(n))
      res[n] = o1[n];
  for (n in o2)
    if (o2.hasOwnProperty(n))
      res[n] = o2[n];
  return res;
};

var SHORT_TAGS = { // hash for quick check if tag short
  area: 1, base: 1, br: 1, col: 1, command: 1, embed: 1, hr: 1, img: 1,
  input: 1, keygen: 1, link: 1, meta: 1, param: 1, source: 1, wbr: 1
};

exports.isShortTag = function isShortTag(t) {
  return SHORT_TAGS.hasOwnProperty(t);
};

exports.isSimple = function isSimple(obj) {
  if (!obj || obj === true) return true;
  if (!obj.block &&
      !obj.elem &&
      !obj.tag &&
      !obj.cls &&
      !obj.attrs &&
      obj.hasOwnProperty('html') &&
      isSimple(obj.html))
    return true;
  return typeof obj === 'string' || typeof obj === 'number';
};

exports.isObj = function isObj(val) {
  return val && typeof val === 'object' && !Array.isArray(val) &&
    val !== null;
};

var uniqCount = 0;
var uniqId = +new Date();
var uniqExpando = '__' + uniqId;
var uniqPrefix = 'uniq' + uniqId;

function getUniq() {
  return uniqPrefix + (++uniqCount);
}
exports.getUniq = getUniq;

exports.identify = function identify(obj, onlyGet) {
  if (!obj)
    return getUniq();
  if (onlyGet || obj[uniqExpando])
    return obj[uniqExpando];

  var u = getUniq();
  obj[uniqExpando] = u;
  return u;
};

exports.fnToString = function fnToString(code) {
  // It is fine to compile without templates at first
  if (!code)
    return '';

  if (typeof code === 'function') {
    // Examples:
    //   function () { … }
    //   function name() { … }
    //   function (a, b) { … }
    //   function name(a, b) { … }
    var regularFunction = /^function\s*[^{]+{|}$/g;

    // Examples:
    //   () => { … }
    //   (a, b) => { … }
    //   _ => { … }
    var arrowFunction = /^(_|\(\w|[^=>]+\))\s=>\s{|}$/g;

    code = code.toString();
    code = code.replace(
      code.indexOf('function') === 0 ? regularFunction : arrowFunction,
    '');
  }

  return code;
};

},{}],11:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],12:[function(require,module,exports){
module.exports = assert;

function assert(val, msg) {
  if (!val)
    throw new Error(msg || 'Assertion failed');
}

assert.equal = function assertEqual(l, r, msg) {
  if (l != r)
    throw new Error(msg || ('Assertion failed: ' + l + ' != ' + r));
};

},{}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYmVtaHRtbC9lbnRpdHkuanMiLCJsaWIvYmVtaHRtbC9pbmRleC5qcyIsImxpYi9iZW14anN0L2NsYXNzLWJ1aWxkZXIuanMiLCJsaWIvYmVteGpzdC9jb250ZXh0LmpzIiwibGliL2JlbXhqc3QvZW50aXR5LmpzIiwibGliL2JlbXhqc3QvZXJyb3IuanMiLCJsaWIvYmVteGpzdC9pbmRleC5qcyIsImxpYi9iZW14anN0L21hdGNoLmpzIiwibGliL2JlbXhqc3QvdHJlZS5qcyIsImxpYi9iZW14anN0L3V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvbWluaW1hbGlzdGljLWFzc2VydC9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdGlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ROQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xudmFyIE1hdGNoID0gcmVxdWlyZSgnLi4vYmVteGpzdC9tYXRjaCcpLk1hdGNoO1xudmFyIEJlbXhqc3RFbnRpdHkgPSByZXF1aXJlKCcuLi9iZW14anN0L2VudGl0eScpLkVudGl0eTtcblxuLyoqXG4gKiBAY2xhc3MgRW50aXR5XG4gKiBAcGFyYW0ge0JFTVhKU1R9IGJlbXhqc3RcbiAqIEBwYXJhbSB7U3RyaW5nfSBibG9ja1xuICogQHBhcmFtIHtTdHJpbmd9IGVsZW1cbiAqIEBwYXJhbSB7QXJyYXl9IHRlbXBsYXRlc1xuICovXG5mdW5jdGlvbiBFbnRpdHkoYmVteGpzdCkge1xuICB0aGlzLmJlbXhqc3QgPSBiZW14anN0O1xuXG4gIHRoaXMuanNDbGFzcyA9IG51bGw7XG5cbiAgLy8gXCJGYXN0IG1vZGVzXCJcbiAgdGhpcy50YWcgPSBuZXcgTWF0Y2godGhpcywgJ3RhZycpO1xuICB0aGlzLmF0dHJzID0gbmV3IE1hdGNoKHRoaXMsICdhdHRycycpO1xuICB0aGlzLm1peCA9IG5ldyBNYXRjaCh0aGlzLCAnbWl4Jyk7XG4gIHRoaXMuanMgPSBuZXcgTWF0Y2godGhpcywgJ2pzJyk7XG4gIHRoaXMubW9kcyA9IG5ldyBNYXRjaCh0aGlzLCAnbW9kcycpO1xuICB0aGlzLmVsZW1Nb2RzID0gbmV3IE1hdGNoKHRoaXMsICdlbGVtTW9kcycpO1xuICB0aGlzLmJlbSA9IG5ldyBNYXRjaCh0aGlzLCAnYmVtJyk7XG4gIHRoaXMuY2xzID0gbmV3IE1hdGNoKHRoaXMsICdjbHMnKTtcblxuICBCZW14anN0RW50aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG5cbmluaGVyaXRzKEVudGl0eSwgQmVteGpzdEVudGl0eSk7XG5leHBvcnRzLkVudGl0eSA9IEVudGl0eTtcblxuRW50aXR5LnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gaW5pdChibG9jaywgZWxlbSkge1xuICB0aGlzLmJsb2NrID0gYmxvY2s7XG4gIHRoaXMuZWxlbSA9IGVsZW07XG5cbiAgLy8gQ2xhc3MgZm9yIGpzUGFyYW1zXG4gIHRoaXMuanNDbGFzcyA9IHRoaXMuYmVteGpzdC5jbGFzc0J1aWxkZXIuYnVpbGQodGhpcy5ibG9jaywgdGhpcy5lbGVtKTtcbn07XG5cbnZhciBrZXlzID0ge1xuICB0YWc6IHRydWUsXG4gIGNvbnRlbnQ6IHRydWUsXG4gIGF0dHJzOiB0cnVlLFxuICBtaXg6IHRydWUsXG4gIGpzOiB0cnVlLFxuICBtb2RzOiB0cnVlLFxuICBlbGVtTW9kczogdHJ1ZSxcbiAgY2xzOiB0cnVlLFxuICBiZW06IHRydWVcbn07XG5cbkVudGl0eS5wcm90b3R5cGUuX2luaXRSZXN0ID0gZnVuY3Rpb24gX2luaXRSZXN0KGtleSkge1xuICBpZiAoa2V5ID09PSAnZGVmYXVsdCcpIHtcbiAgICB0aGlzLnJlc3Rba2V5XSA9IHRoaXMuZGVmO1xuICB9IGVsc2UgaWYgKGtleXNba2V5XSkge1xuICAgIHRoaXMucmVzdFtrZXldID0gdGhpc1trZXldO1xuICB9IGVsc2Uge1xuICAgIGlmICghdGhpcy5yZXN0Lmhhc093blByb3BlcnR5KGtleSkpXG4gICAgICB0aGlzLnJlc3Rba2V5XSA9IG5ldyBNYXRjaCh0aGlzLCBrZXkpO1xuICB9XG59O1xuXG5FbnRpdHkucHJvdG90eXBlLmRlZmF1bHRCb2R5ID0gZnVuY3Rpb24gZGVmYXVsdEJvZHkoY29udGV4dCkge1xuICB2YXIgbW9kcyA9IHRoaXMubW9kcy5leGVjKGNvbnRleHQpO1xuICBjb250ZXh0Lm1vZHMgPSBtb2RzO1xuXG4gIHZhciBlbGVtTW9kcztcbiAgaWYgKGNvbnRleHQuY3R4LmVsZW0pIHtcbiAgICBlbGVtTW9kcyA9IHRoaXMuZWxlbU1vZHMuZXhlYyhjb250ZXh0KTtcbiAgICBjb250ZXh0LmVsZW1Nb2RzID0gZWxlbU1vZHM7XG4gIH1cblxuICAvLyBOb3RpY2U6IG90aGVyIG1vZGVzIG11c3QgYmUgYWZ0ZXIgY29udGV4dC5tb2RzL2NvbnRleHQuZWxlbU1vZHMgY2hhbmdlc1xuXG4gIHZhciB0YWcgPSB0aGlzLnRhZy5leGVjKGNvbnRleHQpO1xuICB2YXIgY29udGVudCA9IHRoaXMuY29udGVudC5leGVjKGNvbnRleHQpO1xuICB2YXIgYXR0cnMgPSB0aGlzLmF0dHJzLmV4ZWMoY29udGV4dCk7XG4gIHZhciBtaXggPSB0aGlzLm1peC5leGVjKGNvbnRleHQpO1xuICB2YXIganMgPSB0aGlzLmpzLmV4ZWMoY29udGV4dCk7XG4gIHZhciBiZW0gPSB0aGlzLmJlbS5leGVjKGNvbnRleHQpO1xuICB2YXIgY2xzID0gdGhpcy5jbHMuZXhlYyhjb250ZXh0KTtcblxuICByZXR1cm4gdGhpcy5iZW14anN0LnJlbmRlcihjb250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiZW0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNscyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWl4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRycyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbU1vZHMpO1xufTtcbiIsInZhciBpbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi9iZW14anN0L3V0aWxzJyk7XG52YXIgRW50aXR5ID0gcmVxdWlyZSgnLi9lbnRpdHknKS5FbnRpdHk7XG52YXIgQkVNWEpTVCA9IHJlcXVpcmUoJy4uL2JlbXhqc3QnKTtcblxuZnVuY3Rpb24gQkVNSFRNTChvcHRpb25zKSB7XG4gIEJFTVhKU1QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICB2YXIgeGh0bWwgPSB0eXBlb2Ygb3B0aW9ucy54aHRtbCA9PT0gJ3VuZGVmaW5lZCcgPyBmYWxzZSA6IG9wdGlvbnMueGh0bWw7XG4gIHRoaXMuX3Nob3J0VGFnQ2xvc2VyID0geGh0bWwgPyAnLz4nIDogJz4nO1xuXG4gIHRoaXMuX2VsZW1Kc0luc3RhbmNlcyA9IG9wdGlvbnMuZWxlbUpzSW5zdGFuY2VzO1xuICB0aGlzLl9vbWl0T3B0aW9uYWxFbmRUYWdzID0gb3B0aW9ucy5vbWl0T3B0aW9uYWxFbmRUYWdzO1xufVxuXG5pbmhlcml0cyhCRU1IVE1MLCBCRU1YSlNUKTtcbm1vZHVsZS5leHBvcnRzID0gQkVNSFRNTDtcblxuQkVNSFRNTC5wcm90b3R5cGUuRW50aXR5ID0gRW50aXR5O1xuXG5CRU1IVE1MLnByb3RvdHlwZS5ydW5NYW55ID0gZnVuY3Rpb24gcnVuTWFueShhcnIpIHtcbiAgdmFyIG91dCA9ICcnO1xuICB2YXIgY29udGV4dCA9IHRoaXMuY29udGV4dDtcbiAgdmFyIHByZXZQb3MgPSBjb250ZXh0LnBvc2l0aW9uO1xuICB2YXIgcHJldk5vdE5ld0xpc3QgPSBjb250ZXh0Ll9ub3ROZXdMaXN0O1xuXG4gIGlmIChwcmV2Tm90TmV3TGlzdCkge1xuICAgIGNvbnRleHQuX2xpc3RMZW5ndGggKz0gYXJyLmxlbmd0aCAtIDE7XG4gIH0gZWxzZSB7XG4gICAgY29udGV4dC5wb3NpdGlvbiA9IDA7XG4gICAgY29udGV4dC5fbGlzdExlbmd0aCA9IGFyci5sZW5ndGg7XG4gIH1cbiAgY29udGV4dC5fbm90TmV3TGlzdCA9IHRydWU7XG5cbiAgaWYgKHRoaXMuY2FuRmx1c2gpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKylcbiAgICAgIG91dCArPSBjb250ZXh0Ll9mbHVzaCh0aGlzLl9ydW4oYXJyW2ldKSk7XG4gIH0gZWxzZSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspXG4gICAgICBvdXQgKz0gdGhpcy5fcnVuKGFycltpXSk7XG4gIH1cblxuICBpZiAoIXByZXZOb3ROZXdMaXN0KVxuICAgIGNvbnRleHQucG9zaXRpb24gPSBwcmV2UG9zO1xuXG4gIHJldHVybiBvdXQ7XG59O1xuXG5CRU1IVE1MLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoY29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRpdHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJlbSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWl4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtTW9kcykge1xuICB2YXIgY3R4ID0gY29udGV4dC5jdHg7XG5cbiAgaWYgKHRhZyA9PT0gdW5kZWZpbmVkKVxuICAgIHRhZyA9ICdkaXYnO1xuXG4gIGlmICghdGFnKVxuICAgIHJldHVybiB0aGlzLnJlbmRlck5vVGFnKGNvbnRlbnQpO1xuXG4gIHZhciBvdXQgPSAnPCcgKyB0YWc7XG5cbiAgaWYgKGpzID09PSB0cnVlKVxuICAgIGpzID0ge307XG5cbiAgdmFyIGpzUGFyYW1zO1xuICBpZiAoanMpIHtcbiAgICBqc1BhcmFtcyA9IHt9O1xuICAgIGpzUGFyYW1zW2VudGl0eS5qc0NsYXNzXSA9IGpzO1xuICB9XG5cbiAgdmFyIGlzQkVNID0gYmVtO1xuICBpZiAoaXNCRU0gPT09IHVuZGVmaW5lZCkge1xuICAgIGlmIChjdHguYmVtID09PSB1bmRlZmluZWQpXG4gICAgICBpc0JFTSA9IGVudGl0eS5ibG9jayB8fCBlbnRpdHkuZWxlbTtcbiAgICBlbHNlXG4gICAgICBpc0JFTSA9IGN0eC5iZW07XG4gIH1cbiAgaXNCRU0gPSAhIWlzQkVNO1xuXG4gIGlmIChjbHMgPT09IHVuZGVmaW5lZClcbiAgICBjbHMgPSBjdHguY2xzO1xuXG4gIHZhciBhZGRKU0luaXRDbGFzcyA9IGpzUGFyYW1zICYmIChcbiAgICB0aGlzLl9lbGVtSnNJbnN0YW5jZXMgP1xuICAgICAgKGVudGl0eS5ibG9jayB8fCBlbnRpdHkuZWxlbSkgOlxuICAgICAgKGVudGl0eS5ibG9jayAmJiAhZW50aXR5LmVsZW0pXG4gICk7XG5cbiAgaWYgKCFpc0JFTSAmJiAhY2xzKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyQ2xvc2Uob3V0LCBjb250ZXh0LCB0YWcsIGF0dHJzLCBpc0JFTSwgY3R4LCBjb250ZW50KTtcbiAgfVxuXG4gIG91dCArPSAnIGNsYXNzPVwiJztcbiAgaWYgKGlzQkVNKSB7XG4gICAgb3V0ICs9IGVudGl0eS5qc0NsYXNzO1xuICAgIG91dCArPSB0aGlzLmJ1aWxkTW9kc0NsYXNzZXMoZW50aXR5LmJsb2NrLCBlbnRpdHkuZWxlbSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudGl0eS5lbGVtID8gZWxlbU1vZHMgOiBtb2RzKTtcblxuICAgIGlmIChtaXgpIHtcbiAgICAgIHZhciBtID0gdGhpcy5yZW5kZXJNaXgoZW50aXR5LCBtaXgsIGpzUGFyYW1zLCBhZGRKU0luaXRDbGFzcyk7XG4gICAgICBvdXQgKz0gbS5vdXQ7XG4gICAgICBqc1BhcmFtcyA9IG0uanNQYXJhbXM7XG4gICAgICBhZGRKU0luaXRDbGFzcyA9IG0uYWRkSlNJbml0Q2xhc3M7XG4gICAgfVxuXG4gICAgaWYgKGNscylcbiAgICAgIG91dCArPSAnICcgKyAodHlwZW9mIGNscyA9PT0gJ3N0cmluZycgP1xuICAgICAgICAgICAgICAgICAgICB1dGlscy5hdHRyRXNjYXBlKGNscykudHJpbSgpIDogY2xzKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoY2xzKVxuICAgICAgb3V0ICs9IGNscy50cmltID8gdXRpbHMuYXR0ckVzY2FwZShjbHMpLnRyaW0oKSA6IGNscztcbiAgfVxuXG4gIGlmIChhZGRKU0luaXRDbGFzcylcbiAgICBvdXQgKz0gJyBpLWJlbVwiJztcbiAgZWxzZVxuICAgIG91dCArPSAnXCInO1xuXG4gIGlmIChpc0JFTSAmJiBqc1BhcmFtcylcbiAgICBvdXQgKz0gJyBkYXRhLWJlbT1cXCcnICsgdXRpbHMuanNBdHRyRXNjYXBlKEpTT04uc3RyaW5naWZ5KGpzUGFyYW1zKSkgKyAnXFwnJztcblxuICByZXR1cm4gdGhpcy5yZW5kZXJDbG9zZShvdXQsIGNvbnRleHQsIHRhZywgYXR0cnMsIGlzQkVNLCBjdHgsIGNvbnRlbnQpO1xufTtcblxudmFyIE9QVElPTkFMX0VORF9UQUdTID0ge1xuICAvLyBodG1sNCBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9zeW50YXguaHRtbCNvcHRpb25hbC10YWdzXG4gIGh0bWw6IDEsIGhlYWQ6IDEsIGJvZHk6IDEsIHA6IDEsIHVsOiAxLCBvbDogMSwgbGk6IDEsIGR0OiAxLCBkZDogMSxcbiAgY29sZ3JvdXA6IDEsIHRoZWFkOiAxLCB0Ym9keTogMSwgdGZvb3Q6IDEsIHRyOiAxLCB0aDogMSwgdGQ6IDEsIG9wdGlvbjogMSxcblxuICAvLyBodG1sNSBodHRwczovL3d3dy53My5vcmcvVFIvaHRtbDUvc3ludGF4Lmh0bWwjb3B0aW9uYWwtdGFnc1xuICAvKiBkbCDigJQgTmVpdGhlciB0YWcgaXMgb21pc3NpYmxlICovIHJiOiAxLCBydDogMSwgcnRjOiAxLCBycDogMSwgb3B0Z3JvdXA6IDFcbn07XG5cbkJFTUhUTUwucHJvdG90eXBlLnJlbmRlckNsb3NlID0gZnVuY3Rpb24gcmVuZGVyQ2xvc2UocHJlZml4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0JFTSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50KSB7XG4gIHZhciBvdXQgPSBwcmVmaXg7XG5cbiAgb3V0ICs9IHRoaXMucmVuZGVyQXR0cnMoYXR0cnMpO1xuXG4gIGlmICh1dGlscy5pc1Nob3J0VGFnKHRhZykpIHtcbiAgICBvdXQgKz0gdGhpcy5fc2hvcnRUYWdDbG9zZXI7XG4gICAgaWYgKHRoaXMuY2FuRmx1c2gpXG4gICAgICBvdXQgPSBjb250ZXh0Ll9mbHVzaChvdXQpO1xuICB9IGVsc2Uge1xuICAgIG91dCArPSAnPic7XG4gICAgaWYgKHRoaXMuY2FuRmx1c2gpXG4gICAgICBvdXQgPSBjb250ZXh0Ll9mbHVzaChvdXQpO1xuXG4gICAgLy8gVE9ETyhpbmR1dG55KTogc2tpcCBhcHBseSBuZXh0IGZsYWdzXG4gICAgaWYgKGNvbnRlbnQgfHwgY29udGVudCA9PT0gMClcbiAgICAgIG91dCArPSB0aGlzLnJlbmRlckNvbnRlbnQoY29udGVudCwgaXNCRU0pO1xuXG4gICAgaWYgKCF0aGlzLl9vbWl0T3B0aW9uYWxFbmRUYWdzIHx8ICFPUFRJT05BTF9FTkRfVEFHUy5oYXNPd25Qcm9wZXJ0eSh0YWcpKVxuICAgICAgb3V0ICs9ICc8LycgKyB0YWcgKyAnPic7XG4gIH1cblxuICBpZiAodGhpcy5jYW5GbHVzaClcbiAgICBvdXQgPSBjb250ZXh0Ll9mbHVzaChvdXQpO1xuICByZXR1cm4gb3V0O1xufTtcbkJFTUhUTUwucHJvdG90eXBlLnJlbmRlckF0dHJzID0gZnVuY3Rpb24gcmVuZGVyQXR0cnMoYXR0cnMpIHtcbiAgdmFyIG91dCA9ICcnO1xuXG4gIC8vIE5PVEU6IG1heWJlIHdlIG5lZWQgdG8gbWFrZSBhbiBhcnJheSBmb3IgcXVpY2tlciBzZXJpYWxpemF0aW9uXG4gIGlmICh1dGlscy5pc09iaihhdHRycykpIHtcblxuICAgIC8qIGpzaGludCBmb3JpbiA6IGZhbHNlICovXG4gICAgZm9yICh2YXIgbmFtZSBpbiBhdHRycykge1xuICAgICAgdmFyIGF0dHIgPSBhdHRyc1tuYW1lXTtcbiAgICAgIGlmIChhdHRyID09PSB1bmRlZmluZWQgfHwgYXR0ciA9PT0gZmFsc2UgfHwgYXR0ciA9PT0gbnVsbClcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIGlmIChhdHRyID09PSB0cnVlKVxuICAgICAgICBvdXQgKz0gJyAnICsgbmFtZTtcbiAgICAgIGVsc2VcbiAgICAgICAgb3V0ICs9ICcgJyArIG5hbWUgKyAnPVwiJyArXG4gICAgICAgICAgdXRpbHMuYXR0ckVzY2FwZSh1dGlscy5pc1NpbXBsZShhdHRyKSA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5yZWFwcGx5KGF0dHIpKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAnXCInO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvdXQ7XG59O1xuXG5CRU1IVE1MLnByb3RvdHlwZS5yZW5kZXJNaXggPSBmdW5jdGlvbiByZW5kZXJNaXgoZW50aXR5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1peCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc1BhcmFtcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRKU0luaXRDbGFzcykge1xuICB2YXIgdmlzaXRlZCA9IHt9O1xuICB2YXIgY29udGV4dCA9IHRoaXMuY29udGV4dDtcbiAgdmFyIGpzID0ganNQYXJhbXM7XG4gIHZhciBhZGRJbml0ID0gYWRkSlNJbml0Q2xhc3M7XG5cbiAgdmlzaXRlZFtlbnRpdHkuanNDbGFzc10gPSB0cnVlO1xuXG4gIC8vIFRyYW5zZm9ybSBtaXggdG8gdGhlIHNpbmdsZS1pdGVtIGFycmF5IGlmIGl0J3Mgbm90IGFycmF5XG4gIGlmICghQXJyYXkuaXNBcnJheShtaXgpKVxuICAgIG1peCA9IFsgbWl4IF07XG5cbiAgdmFyIGNsYXNzQnVpbGRlciA9IHRoaXMuY2xhc3NCdWlsZGVyO1xuXG4gIHZhciBvdXQgPSAnJztcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBtaXgubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaXRlbSA9IG1peFtpXTtcbiAgICBpZiAoIWl0ZW0pXG4gICAgICBjb250aW51ZTtcbiAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdzdHJpbmcnKVxuICAgICAgaXRlbSA9IHsgYmxvY2s6IGl0ZW0sIGVsZW06IHVuZGVmaW5lZCB9O1xuXG4gICAgdmFyIGhhc0l0ZW0gPSBmYWxzZTtcblxuICAgIGlmIChpdGVtLmVsZW0pIHtcbiAgICAgIGhhc0l0ZW0gPSBpdGVtLmVsZW0gIT09IGVudGl0eS5lbGVtICYmIGl0ZW0uZWxlbSAhPT0gY29udGV4dC5lbGVtIHx8XG4gICAgICAgIGl0ZW0uYmxvY2sgJiYgaXRlbS5ibG9jayAhPT0gZW50aXR5LmJsb2NrO1xuICAgIH0gZWxzZSBpZiAoaXRlbS5ibG9jaykge1xuICAgICAgaGFzSXRlbSA9ICEoaXRlbS5ibG9jayA9PT0gZW50aXR5LmJsb2NrICYmIGl0ZW0ubW9kcykgfHxcbiAgICAgICAgaXRlbS5tb2RzICYmIGVudGl0eS5lbGVtO1xuICAgIH1cblxuICAgIHZhciBibG9jayA9IGl0ZW0uYmxvY2sgfHwgaXRlbS5fYmxvY2sgfHwgY29udGV4dC5ibG9jaztcbiAgICB2YXIgZWxlbSA9IGl0ZW0uZWxlbSB8fCBpdGVtLl9lbGVtIHx8IGNvbnRleHQuZWxlbTtcbiAgICB2YXIga2V5ID0gY2xhc3NCdWlsZGVyLmJ1aWxkKGJsb2NrLCBlbGVtKTtcblxuICAgIHZhciBjbGFzc0VsZW0gPSBpdGVtLmVsZW0gfHxcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5fZWxlbSB8fFxuICAgICAgICAgICAgICAgICAgICAoaXRlbS5ibG9jayA/IHVuZGVmaW5lZCA6IGNvbnRleHQuZWxlbSk7XG4gICAgaWYgKGhhc0l0ZW0pXG4gICAgICBvdXQgKz0gJyAnICsgY2xhc3NCdWlsZGVyLmJ1aWxkKGJsb2NrLCBjbGFzc0VsZW0pO1xuXG4gICAgb3V0ICs9IHRoaXMuYnVpbGRNb2RzQ2xhc3NlcyhibG9jaywgY2xhc3NFbGVtLFxuICAgICAgKGl0ZW0uZWxlbSB8fCAhaXRlbS5ibG9jayAmJiAoaXRlbS5fZWxlbSB8fCBjb250ZXh0LmVsZW0pKSA/XG4gICAgICAgIGl0ZW0uZWxlbU1vZHMgOiBpdGVtLm1vZHMpO1xuXG4gICAgaWYgKGl0ZW0uanMpIHtcbiAgICAgIGlmICghanMpXG4gICAgICAgIGpzID0ge307XG5cbiAgICAgIGpzW2NsYXNzQnVpbGRlci5idWlsZChibG9jaywgaXRlbS5lbGVtKV0gPVxuICAgICAgICAgIGl0ZW0uanMgPT09IHRydWUgPyB7fSA6IGl0ZW0uanM7XG4gICAgICBpZiAoIWFkZEluaXQpXG4gICAgICAgIGFkZEluaXQgPSBibG9jayAmJiAhaXRlbS5lbGVtO1xuICAgIH1cblxuICAgIC8vIFByb2Nlc3MgbmVzdGVkIG1peGVzXG4gICAgaWYgKCFoYXNJdGVtIHx8IHZpc2l0ZWRba2V5XSlcbiAgICAgIGNvbnRpbnVlO1xuXG4gICAgdmlzaXRlZFtrZXldID0gdHJ1ZTtcbiAgICB2YXIgbmVzdGVkRW50aXR5ID0gdGhpcy5lbnRpdGllc1trZXldO1xuICAgIGlmICghbmVzdGVkRW50aXR5KVxuICAgICAgY29udGludWU7XG5cbiAgICB2YXIgb2xkQmxvY2sgPSBjb250ZXh0LmJsb2NrO1xuICAgIHZhciBvbGRFbGVtID0gY29udGV4dC5lbGVtO1xuICAgIHZhciBuZXN0ZWRNaXggPSBuZXN0ZWRFbnRpdHkubWl4LmV4ZWMoY29udGV4dCk7XG4gICAgY29udGV4dC5lbGVtID0gb2xkRWxlbTtcbiAgICBjb250ZXh0LmJsb2NrID0gb2xkQmxvY2s7XG5cbiAgICBpZiAoIW5lc3RlZE1peClcbiAgICAgIGNvbnRpbnVlO1xuXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBuZXN0ZWRNaXgubGVuZ3RoOyBqKyspIHtcbiAgICAgIHZhciBuZXN0ZWRJdGVtID0gbmVzdGVkTWl4W2pdO1xuICAgICAgaWYgKCFuZXN0ZWRJdGVtKSBjb250aW51ZTtcblxuICAgICAgaWYgKCFuZXN0ZWRJdGVtLmJsb2NrICYmXG4gICAgICAgICAgIW5lc3RlZEl0ZW0uZWxlbSB8fFxuICAgICAgICAgICF2aXNpdGVkW2NsYXNzQnVpbGRlci5idWlsZChuZXN0ZWRJdGVtLmJsb2NrLCBuZXN0ZWRJdGVtLmVsZW0pXSkge1xuICAgICAgICBpZiAobmVzdGVkSXRlbS5ibG9jaykgY29udGludWU7XG5cbiAgICAgICAgbmVzdGVkSXRlbS5fYmxvY2sgPSBibG9jaztcbiAgICAgICAgbmVzdGVkSXRlbS5fZWxlbSA9IGVsZW07XG4gICAgICAgIG1peCA9IG1peC5zbGljZSgwLCBpICsgMSkuY29uY2F0KFxuICAgICAgICAgIG5lc3RlZEl0ZW0sXG4gICAgICAgICAgbWl4LnNsaWNlKGkgKyAxKVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgb3V0OiBvdXQsXG4gICAganNQYXJhbXM6IGpzLFxuICAgIGFkZEpTSW5pdENsYXNzOiBhZGRJbml0XG4gIH07XG59O1xuXG5CRU1IVE1MLnByb3RvdHlwZS5idWlsZE1vZHNDbGFzc2VzID0gZnVuY3Rpb24gYnVpbGRNb2RzQ2xhc3NlcyhibG9jayxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RzKSB7XG4gIGlmICghbW9kcylcbiAgICByZXR1cm4gJyc7XG5cbiAgdmFyIHJlcyA9ICcnO1xuXG4gIHZhciBtb2ROYW1lO1xuXG4gIC8qanNoaW50IC1XMDg5ICovXG4gIGZvciAobW9kTmFtZSBpbiBtb2RzKSB7XG4gICAgaWYgKCFtb2RzLmhhc093blByb3BlcnR5KG1vZE5hbWUpIHx8IG1vZE5hbWUgPT09ICcnKVxuICAgICAgY29udGludWU7XG5cbiAgICB2YXIgbW9kVmFsID0gbW9kc1ttb2ROYW1lXTtcbiAgICBpZiAoIW1vZFZhbCAmJiBtb2RWYWwgIT09IDApIGNvbnRpbnVlO1xuICAgIGlmICh0eXBlb2YgbW9kVmFsICE9PSAnYm9vbGVhbicpXG4gICAgICBtb2RWYWwgKz0gJyc7XG5cbiAgICB2YXIgYnVpbGRlciA9IHRoaXMuY2xhc3NCdWlsZGVyO1xuICAgIHJlcyArPSAnICcgKyAoZWxlbSA/XG4gICAgICAgICAgICAgICAgICBidWlsZGVyLmJ1aWxkRWxlbUNsYXNzKGJsb2NrLCBlbGVtLCBtb2ROYW1lLCBtb2RWYWwpIDpcbiAgICAgICAgICAgICAgICAgIGJ1aWxkZXIuYnVpbGRCbG9ja0NsYXNzKGJsb2NrLCBtb2ROYW1lLCBtb2RWYWwpKTtcbiAgfVxuXG4gIHJldHVybiByZXM7XG59O1xuXG5CRU1IVE1MLnByb3RvdHlwZS5yZW5kZXJOb1RhZyA9IGZ1bmN0aW9uIHJlbmRlck5vVGFnKGNvbnRlbnQpIHtcbiAgLy8gVE9ETyhpbmR1dG55KTogc2tpcCBhcHBseSBuZXh0IGZsYWdzXG4gIGlmIChjb250ZW50IHx8IGNvbnRlbnQgPT09IDApXG4gICAgcmV0dXJuIHRoaXMuX3J1bihjb250ZW50KTtcbiAgcmV0dXJuICcnO1xufTtcbiIsImZ1bmN0aW9uIENsYXNzQnVpbGRlcihvcHRpb25zKSB7XG4gIHRoaXMubW9kRGVsaW0gPSBvcHRpb25zLm1vZCB8fCAnXyc7XG4gIHRoaXMuZWxlbURlbGltID0gb3B0aW9ucy5lbGVtIHx8ICdfXyc7XG59XG5leHBvcnRzLkNsYXNzQnVpbGRlciA9IENsYXNzQnVpbGRlcjtcblxuQ2xhc3NCdWlsZGVyLnByb3RvdHlwZS5idWlsZCA9IGZ1bmN0aW9uIGJ1aWxkKGJsb2NrLCBlbGVtKSB7XG4gIGlmICghZWxlbSlcbiAgICByZXR1cm4gYmxvY2s7XG4gIGVsc2VcbiAgICByZXR1cm4gYmxvY2sgKyB0aGlzLmVsZW1EZWxpbSArIGVsZW07XG59O1xuXG5DbGFzc0J1aWxkZXIucHJvdG90eXBlLmJ1aWxkTW9kUG9zdGZpeCA9IGZ1bmN0aW9uIGJ1aWxkTW9kUG9zdGZpeChtb2ROYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kVmFsKSB7XG4gIHZhciByZXMgPSB0aGlzLm1vZERlbGltICsgbW9kTmFtZTtcbiAgaWYgKG1vZFZhbCAhPT0gdHJ1ZSkgcmVzICs9IHRoaXMubW9kRGVsaW0gKyBtb2RWYWw7XG4gIHJldHVybiByZXM7XG59O1xuXG5DbGFzc0J1aWxkZXIucHJvdG90eXBlLmJ1aWxkQmxvY2tDbGFzcyA9IGZ1bmN0aW9uIGJ1aWxkQmxvY2tDbGFzcyhuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZFZhbCkge1xuICB2YXIgcmVzID0gbmFtZTtcbiAgaWYgKG1vZFZhbCkgcmVzICs9IHRoaXMuYnVpbGRNb2RQb3N0Zml4KG1vZE5hbWUsIG1vZFZhbCk7XG4gIHJldHVybiByZXM7XG59O1xuXG5DbGFzc0J1aWxkZXIucHJvdG90eXBlLmJ1aWxkRWxlbUNsYXNzID0gZnVuY3Rpb24gYnVpbGRFbGVtQ2xhc3MoYmxvY2ssXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2ROYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZFZhbCkge1xuICB2YXIgcmVzID0gdGhpcy5idWlsZEJsb2NrQ2xhc3MoYmxvY2spICsgdGhpcy5lbGVtRGVsaW0gKyBuYW1lO1xuICBpZiAobW9kVmFsKSByZXMgKz0gdGhpcy5idWlsZE1vZFBvc3RmaXgobW9kTmFtZSwgbW9kVmFsKTtcbiAgcmV0dXJuIHJlcztcbn07XG5cbkNsYXNzQnVpbGRlci5wcm90b3R5cGUuc3BsaXQgPSBmdW5jdGlvbiBzcGxpdChrZXkpIHtcbiAgcmV0dXJuIGtleS5zcGxpdCh0aGlzLmVsZW1EZWxpbSwgMik7XG59O1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG5mdW5jdGlvbiBDb250ZXh0KGJlbXhqc3QpIHtcbiAgdGhpcy5fYmVteGpzdCA9IGJlbXhqc3Q7XG5cbiAgdGhpcy5jdHggPSBudWxsO1xuICB0aGlzLmJsb2NrID0gJyc7XG5cbiAgLy8gU2F2ZSBjdXJyZW50IGJsb2NrIHVudGlsIHRoZSBuZXh0IEJFTSBlbnRpdHlcbiAgdGhpcy5fY3VyckJsb2NrID0gJyc7XG5cbiAgdGhpcy5lbGVtID0gbnVsbDtcbiAgdGhpcy5tb2RzID0ge307XG4gIHRoaXMuZWxlbU1vZHMgPSB7fTtcblxuICB0aGlzLnBvc2l0aW9uID0gMDtcbiAgdGhpcy5fbGlzdExlbmd0aCA9IDA7XG4gIHRoaXMuX25vdE5ld0xpc3QgPSBmYWxzZTtcblxuICAvLyAobWlyaXBpcnVuaSkgdGhpcyB3aWxsIGJlIGNoYW5nZWQgaW4gbmV4dCBtYWpvciByZWxlYXNlXG4gIHRoaXMuZXNjYXBlQ29udGVudCA9IGJlbXhqc3Qub3B0aW9ucy5lc2NhcGVDb250ZW50ICE9PSBmYWxzZTtcblxuICAvLyBVc2VkIGluIGBPbmNlTWF0Y2hgIGNoZWNrIHRvIGRldGVjdCBjb250ZXh0IGNoYW5nZVxuICB0aGlzLl9vbmNlUmVmID0ge307XG59XG5leHBvcnRzLkNvbnRleHQgPSBDb250ZXh0O1xuXG5Db250ZXh0LnByb3RvdHlwZS5fZmx1c2ggPSBudWxsO1xuXG5Db250ZXh0LnByb3RvdHlwZS5pc1NpbXBsZSA9IHV0aWxzLmlzU2ltcGxlO1xuXG5Db250ZXh0LnByb3RvdHlwZS5pc1Nob3J0VGFnID0gdXRpbHMuaXNTaG9ydFRhZztcbkNvbnRleHQucHJvdG90eXBlLmV4dGVuZCA9IHV0aWxzLmV4dGVuZDtcbkNvbnRleHQucHJvdG90eXBlLmlkZW50aWZ5ID0gdXRpbHMuaWRlbnRpZnk7XG5cbkNvbnRleHQucHJvdG90eXBlLnhtbEVzY2FwZSA9IHV0aWxzLnhtbEVzY2FwZTtcbkNvbnRleHQucHJvdG90eXBlLmF0dHJFc2NhcGUgPSB1dGlscy5hdHRyRXNjYXBlO1xuQ29udGV4dC5wcm90b3R5cGUuanNBdHRyRXNjYXBlID0gdXRpbHMuanNBdHRyRXNjYXBlO1xuXG5Db250ZXh0LnByb3RvdHlwZS5pc0ZpcnN0ID0gZnVuY3Rpb24gaXNGaXJzdCgpIHtcbiAgcmV0dXJuIHRoaXMucG9zaXRpb24gPT09IDE7XG59O1xuXG5Db250ZXh0LnByb3RvdHlwZS5pc0xhc3QgPSBmdW5jdGlvbiBpc0xhc3QoKSB7XG4gIHJldHVybiB0aGlzLnBvc2l0aW9uID09PSB0aGlzLl9saXN0TGVuZ3RoO1xufTtcblxuQ29udGV4dC5wcm90b3R5cGUuZ2VuZXJhdGVJZCA9IGZ1bmN0aW9uIGdlbmVyYXRlSWQoKSB7XG4gIHJldHVybiB1dGlscy5pZGVudGlmeSh0aGlzLmN0eCk7XG59O1xuXG5Db250ZXh0LnByb3RvdHlwZS5yZWFwcGx5ID0gZnVuY3Rpb24gcmVhcHBseShjdHgpIHtcbiAgcmV0dXJuIHRoaXMuX2JlbXhqc3QucnVuKGN0eCk7XG59O1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIE1hdGNoID0gcmVxdWlyZSgnLi9tYXRjaCcpLk1hdGNoO1xudmFyIHRyZWUgPSByZXF1aXJlKCcuL3RyZWUnKTtcbnZhciBUZW1wbGF0ZSA9IHRyZWUuVGVtcGxhdGU7XG52YXIgUHJvcGVydHlNYXRjaCA9IHRyZWUuUHJvcGVydHlNYXRjaDtcbnZhciBDb21waWxlck9wdGlvbnMgPSB0cmVlLkNvbXBpbGVyT3B0aW9ucztcblxuZnVuY3Rpb24gRW50aXR5KGJlbXhqc3QsIGJsb2NrLCBlbGVtLCB0ZW1wbGF0ZXMpIHtcbiAgdGhpcy5iZW14anN0ID0gYmVteGpzdDtcblxuICB0aGlzLmJsb2NrID0gbnVsbDtcbiAgdGhpcy5lbGVtID0gbnVsbDtcblxuICAvLyBDb21waWxlciBvcHRpb25zIHZpYSBgeGpzdE9wdGlvbnMoKWBcbiAgdGhpcy5vcHRpb25zID0ge307XG5cbiAgLy8gYHRydWVgIGlmIGVudGl0eSBoYXMganVzdCBhIGRlZmF1bHQgcmVuZGVyZXIgZm9yIGBkZWYoKWAgbW9kZVxuICB0aGlzLmNhbkZsdXNoID0gdHJ1ZTtcblxuICAvLyBcIkZhc3QgbW9kZXNcIlxuICB0aGlzLmRlZiA9IG5ldyBNYXRjaCh0aGlzKTtcbiAgdGhpcy5jb250ZW50ID0gbmV3IE1hdGNoKHRoaXMsICdjb250ZW50Jyk7XG5cbiAgLy8gXCJTbG93IG1vZGVzXCJcbiAgdGhpcy5yZXN0ID0ge307XG5cbiAgLy8gSW5pdGlhbGl6ZVxuICB0aGlzLmluaXQoYmxvY2ssIGVsZW0pO1xuICB0aGlzLmluaXRNb2Rlcyh0ZW1wbGF0ZXMpO1xufVxuZXhwb3J0cy5FbnRpdHkgPSBFbnRpdHk7XG5cbkVudGl0eS5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uIGluaXQoYmxvY2ssIGVsZW0pIHtcbiAgdGhpcy5ibG9jayA9IGJsb2NrO1xuICB0aGlzLmVsZW0gPSBlbGVtO1xufTtcblxuZnVuY3Rpb24gY29udGVudE1vZGUoKSB7XG4gIHJldHVybiB0aGlzLmN0eC5jb250ZW50O1xufVxuXG5FbnRpdHkucHJvdG90eXBlLmluaXRNb2RlcyA9IGZ1bmN0aW9uIGluaXRNb2Rlcyh0ZW1wbGF0ZXMpIHtcbiAgLyoganNoaW50IG1heGRlcHRoIDogZmFsc2UgKi9cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0ZW1wbGF0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgdGVtcGxhdGUgPSB0ZW1wbGF0ZXNbaV07XG5cbiAgICBmb3IgKHZhciBqID0gdGVtcGxhdGUucHJlZGljYXRlcy5sZW5ndGggLSAxOyBqID49IDA7IGotLSkge1xuICAgICAgdmFyIHByZWQgPSB0ZW1wbGF0ZS5wcmVkaWNhdGVzW2pdO1xuICAgICAgaWYgKCEocHJlZCBpbnN0YW5jZW9mIFByb3BlcnR5TWF0Y2gpKVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgaWYgKHByZWQua2V5ICE9PSAnX21vZGUnKVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgdGVtcGxhdGUucHJlZGljYXRlcy5zcGxpY2UoaiwgMSk7XG4gICAgICB0aGlzLl9pbml0UmVzdChwcmVkLnZhbHVlKTtcblxuICAgICAgLy8gQWxsIHRlbXBsYXRlcyBzaG91bGQgZ28gdGhlcmUgYW55d2F5XG4gICAgICB0aGlzLnJlc3RbcHJlZC52YWx1ZV0ucHVzaCh0ZW1wbGF0ZSk7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoaiA9PT0gLTEpXG4gICAgICB0aGlzLmRlZi5wdXNoKHRlbXBsYXRlKTtcblxuICAgIC8vIE1lcmdlIGNvbXBpbGVyIG9wdGlvbnNcbiAgICBmb3IgKHZhciBqID0gdGVtcGxhdGUucHJlZGljYXRlcy5sZW5ndGggLSAxOyBqID49IDA7IGotLSkge1xuICAgICAgdmFyIHByZWQgPSB0ZW1wbGF0ZS5wcmVkaWNhdGVzW2pdO1xuICAgICAgaWYgKCEocHJlZCBpbnN0YW5jZW9mIENvbXBpbGVyT3B0aW9ucykpXG4gICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICB0aGlzLm9wdGlvbnMgPSB1dGlscy5leHRlbmQodGhpcy5vcHRpb25zLCBwcmVkLm9wdGlvbnMpO1xuICAgIH1cbiAgfVxufTtcblxuRW50aXR5LnByb3RvdHlwZS5wcmVwZW5kID0gZnVuY3Rpb24gcHJlcGVuZChvdGhlcikge1xuICAvLyBQcmVwZW5kIHRvIHRoZSBzbG93IG1vZGVzLCBmYXN0IG1vZGVzIGFyZSBpbiB0aGlzIGhhc2htYXAgdG9vIGFueXdheVxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHRoaXMucmVzdCk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgIGlmICghb3RoZXIucmVzdFtrZXldKVxuICAgICAgY29udGludWU7XG5cbiAgICB0aGlzLnJlc3Rba2V5XS5wcmVwZW5kKG90aGVyLnJlc3Rba2V5XSk7XG4gIH1cblxuICAvLyBBZGQgbmV3IHNsb3cgbW9kZXNcbiAga2V5cyA9IE9iamVjdC5rZXlzKG90aGVyLnJlc3QpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICBpZiAodGhpcy5yZXN0W2tleV0pXG4gICAgICBjb250aW51ZTtcblxuICAgIHRoaXMuX2luaXRSZXN0KGtleSk7XG4gICAgdGhpcy5yZXN0W2tleV0ucHJlcGVuZChvdGhlci5yZXN0W2tleV0pO1xuICB9XG59O1xuXG4vLyBOT1RFOiBUaGlzIGNvdWxkIGJlIHBvdGVudGlhbGx5IGNvbXBpbGVkIGludG8gaW5saW5lZCBpbnZva2F0aW9uc1xuRW50aXR5LnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiBydW4oY29udGV4dCkge1xuICBpZiAodGhpcy5kZWYuY291bnQgIT09IDApXG4gICAgcmV0dXJuIHRoaXMuZGVmLmV4ZWMoY29udGV4dCk7XG5cbiAgcmV0dXJuIHRoaXMuZGVmYXVsdEJvZHkoY29udGV4dCk7XG59O1xuXG5FbnRpdHkucHJvdG90eXBlLnNldERlZmF1bHRzID0gZnVuY3Rpb24gc2V0RGVmYXVsdHMoKSB7XG4gIC8vIERlZmF1bHQgLmNvbnRlbnQoKSB0ZW1wbGF0ZSBmb3IgYXBwbHlOZXh0KClcbiAgaWYgKHRoaXMuY29udGVudC5jb3VudCAhPT0gMClcbiAgICB0aGlzLmNvbnRlbnQucHVzaChuZXcgVGVtcGxhdGUoW10sIGNvbnRlbnRNb2RlKSk7XG5cbiAgLy8gLmRlZigpIGRlZmF1bHRcbiAgaWYgKHRoaXMuZGVmLmNvdW50ICE9PSAwKSB7XG4gICAgdGhpcy5jYW5GbHVzaCA9IHRoaXMub3B0aW9ucy5mbHVzaCB8fCBmYWxzZTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5kZWYucHVzaChuZXcgVGVtcGxhdGUoW10sIGZ1bmN0aW9uIGRlZmF1bHRCb2R5UHJveHkoKSB7XG4gICAgICByZXR1cm4gc2VsZi5kZWZhdWx0Qm9keSh0aGlzKTtcbiAgICB9KSk7XG4gIH1cbn07XG4iLCJmdW5jdGlvbiBCRU1YSlNURXJyb3IobXNnLCBmdW5jKSB7XG4gIHRoaXMubmFtZSA9ICdCRU1YSlNURXJyb3InO1xuICB0aGlzLm1lc3NhZ2UgPSBtc2c7XG5cbiAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKVxuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIGZ1bmMgfHwgdGhpcy5jb25zdHJ1Y3Rvcik7XG4gIGVsc2VcbiAgICB0aGlzLnN0YWNrID0gKG5ldyBFcnJvcigpKS5zdGFjaztcbn1cblxuQkVNWEpTVEVycm9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlKTtcbkJFTVhKU1RFcnJvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBCRU1YSlNURXJyb3I7XG5cbmV4cG9ydHMuQkVNWEpTVEVycm9yID0gQkVNWEpTVEVycm9yO1xuIiwidmFyIGluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxudmFyIFRyZWUgPSByZXF1aXJlKCcuL3RyZWUnKS5UcmVlO1xudmFyIFByb3BlcnR5TWF0Y2ggPSByZXF1aXJlKCcuL3RyZWUnKS5Qcm9wZXJ0eU1hdGNoO1xudmFyIEFkZE1hdGNoID0gcmVxdWlyZSgnLi90cmVlJykuQWRkTWF0Y2g7XG52YXIgQ29udGV4dCA9IHJlcXVpcmUoJy4vY29udGV4dCcpLkNvbnRleHQ7XG52YXIgQ2xhc3NCdWlsZGVyID0gcmVxdWlyZSgnLi9jbGFzcy1idWlsZGVyJykuQ2xhc3NCdWlsZGVyO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG5mdW5jdGlvbiBCRU1YSlNUKG9wdGlvbnMpIHtcbiAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICB0aGlzLmVudGl0aWVzID0gbnVsbDtcbiAgdGhpcy5kZWZhdWx0RW50ID0gbnVsbDtcblxuICAvLyBDdXJyZW50IHRyZWVcbiAgdGhpcy50cmVlID0gbnVsbDtcblxuICAvLyBDdXJyZW50IG1hdGNoXG4gIHRoaXMubWF0Y2ggPSBudWxsO1xuXG4gIC8vIENyZWF0ZSBuZXcgQ29udGV4dCBjb25zdHJ1Y3RvciBmb3Igb3ZlcnJpZGluZyBwcm90b3R5cGVcbiAgdGhpcy5jb250ZXh0Q29uc3RydWN0b3IgPSBmdW5jdGlvbiBDb250ZXh0Q2hpbGQoYmVteGpzdCkge1xuICAgIENvbnRleHQuY2FsbCh0aGlzLCBiZW14anN0KTtcbiAgfTtcbiAgaW5oZXJpdHModGhpcy5jb250ZXh0Q29uc3RydWN0b3IsIENvbnRleHQpO1xuICB0aGlzLmNvbnRleHQgPSBudWxsO1xuXG4gIHRoaXMuY2xhc3NCdWlsZGVyID0gbmV3IENsYXNzQnVpbGRlcih0aGlzLm9wdGlvbnMubmFtaW5nIHx8IHt9KTtcblxuICAvLyBFeGVjdXRpb24gZGVwdGgsIHVzZWQgdG8gaW52YWxpZGF0ZSBgYXBwbHlOZXh0YCBiaXRmaWVsZHNcbiAgdGhpcy5kZXB0aCA9IDA7XG5cbiAgLy8gRG8gbm90IGNhbGwgYF9mbHVzaGAgb24gb3ZlcnJpZGRlbiBgZGVmKClgIG1vZGVcbiAgdGhpcy5jYW5GbHVzaCA9IGZhbHNlO1xuXG4gIC8vIG9uaW5pdCB0ZW1wbGF0ZXNcbiAgdGhpcy5vbmluaXQgPSBudWxsO1xuXG4gIC8vIEluaXRpYWxpemUgZGVmYXVsdCBlbnRpdHkgKG5vIGJsb2NrL2VsZW0gbWF0Y2gpXG4gIHRoaXMuZGVmYXVsdEVudCA9IG5ldyB0aGlzLkVudGl0eSh0aGlzLCAnJywgJycsIFtdKTtcbiAgdGhpcy5kZWZhdWx0RWxlbUVudCA9IG5ldyB0aGlzLkVudGl0eSh0aGlzLCAnJywgJycsIFtdKTtcbn1cbm1vZHVsZS5leHBvcnRzID0gQkVNWEpTVDtcblxuQkVNWEpTVC5wcm90b3R5cGUubG9jYWxzID0gVHJlZS5tZXRob2RzXG4gICAgLmNvbmNhdCgnbG9jYWwnLCAnYXBwbHlDdHgnLCAnYXBwbHlOZXh0JywgJ2FwcGx5Jyk7XG5cbkJFTVhKU1QucHJvdG90eXBlLmNvbXBpbGUgPSBmdW5jdGlvbiBjb21waWxlKGNvZGUpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIGZ1bmN0aW9uIGFwcGx5Q3R4KCkge1xuICAgIHJldHVybiBzZWxmLl9ydW4oc2VsZi5jb250ZXh0LmN0eCk7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBseUN0eFdyYXAoY3R4LCBjaGFuZ2VzKSB7XG4gICAgLy8gRmFzdCBjYXNlXG4gICAgaWYgKCFjaGFuZ2VzKVxuICAgICAgcmV0dXJuIHNlbGYubG9jYWwoeyBjdHg6IGN0eCB9LCBhcHBseUN0eCk7XG5cbiAgICByZXR1cm4gc2VsZi5sb2NhbChjaGFuZ2VzLCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBzZWxmLmxvY2FsKHsgY3R4OiBjdHggfSwgYXBwbHlDdHgpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwbHkobW9kZSwgY2hhbmdlcykge1xuICAgIHJldHVybiBzZWxmLmFwcGx5TW9kZShtb2RlLCBjaGFuZ2VzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxvY2FsV3JhcChjaGFuZ2VzKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGxvY2FsQm9keShib2R5KSB7XG4gICAgICByZXR1cm4gc2VsZi5sb2NhbChjaGFuZ2VzLCBib2R5KTtcbiAgICB9O1xuICB9XG5cbiAgdmFyIHRyZWUgPSBuZXcgVHJlZSh7XG4gICAgcmVmczoge1xuICAgICAgYXBwbHlDdHg6IGFwcGx5Q3R4V3JhcCxcbiAgICAgIGxvY2FsOiBsb2NhbFdyYXAsXG4gICAgICBhcHBseTogYXBwbHlcbiAgICB9XG4gIH0pO1xuXG4gIC8vIFllYWgsIGxldCBwZW9wbGUgcGFzcyBmdW5jdGlvbnMgdG8gdXMhXG4gIHZhciB0ZW1wbGF0ZXMgPSB0aGlzLnJlY29tcGlsZUlucHV0KGNvZGUpO1xuXG4gIHZhciBvdXQgPSB0cmVlLmJ1aWxkKHRlbXBsYXRlcywgW1xuICAgIGxvY2FsV3JhcCxcbiAgICBhcHBseUN0eFdyYXAsXG4gICAgZnVuY3Rpb24gYXBwbHlOZXh0V3JhcChjaGFuZ2VzKSB7XG4gICAgICBpZiAoY2hhbmdlcylcbiAgICAgICAgcmV0dXJuIHNlbGYubG9jYWwoY2hhbmdlcywgYXBwbHlOZXh0V3JhcCk7XG4gICAgICByZXR1cm4gc2VsZi5hcHBseU5leHQoKTtcbiAgICB9LFxuICAgIGFwcGx5XG4gIF0pO1xuXG4gIC8vIENvbmNhdGVuYXRlIHRlbXBsYXRlcyB3aXRoIGV4aXN0aW5nIG9uZXNcbiAgLy8gVE9ETyhpbmR1dG55KTogaXQgc2hvdWxkIGJlIHBvc3NpYmxlIHRvIGluY3JlbWVudGFsbHkgYWRkIHRlbXBsYXRlc1xuICBpZiAodGhpcy50cmVlKSB7XG4gICAgb3V0ID0ge1xuICAgICAgdGVtcGxhdGVzOiBvdXQudGVtcGxhdGVzLmNvbmNhdCh0aGlzLnRyZWUudGVtcGxhdGVzKSxcbiAgICAgIG9uaW5pdDogdGhpcy50cmVlLm9uaW5pdC5jb25jYXQob3V0Lm9uaW5pdClcbiAgICB9O1xuICB9XG4gIHRoaXMudHJlZSA9IG91dDtcblxuICAvLyBHcm91cCBibG9jaytlbGVtIGVudGl0aWVzIGludG8gYSBoYXNobWFwXG4gIHZhciBlbnQgPSB0aGlzLmdyb3VwRW50aXRpZXMob3V0LnRlbXBsYXRlcyk7XG5cbiAgLy8gVHJhbnNmb3JtIGVudGl0aWVzIGZyb20gYXJyYXlzIHRvIEVudGl0eSBpbnN0YW5jZXNcbiAgZW50ID0gdGhpcy50cmFuc2Zvcm1FbnRpdGllcyhlbnQpO1xuXG4gIHRoaXMuZW50aXRpZXMgPSBlbnQ7XG4gIHRoaXMub25pbml0ID0gb3V0Lm9uaW5pdDtcbn07XG5cbkJFTVhKU1QucHJvdG90eXBlLnJlY29tcGlsZUlucHV0ID0gZnVuY3Rpb24gcmVjb21waWxlSW5wdXQoY29kZSkge1xuICB2YXIgYXJncyA9IEJFTVhKU1QucHJvdG90eXBlLmxvY2FscztcbiAgLy8gUmV1c2UgZnVuY3Rpb24gaWYgaXQgYWxyZWFkeSBoYXMgcmlnaHQgYXJndW1lbnRzXG4gIGlmICh0eXBlb2YgY29kZSA9PT0gJ2Z1bmN0aW9uJyAmJiBjb2RlLmxlbmd0aCA9PT0gYXJncy5sZW5ndGgpXG4gICAgcmV0dXJuIGNvZGU7XG5cbiAgdmFyIG91dCA9IGNvZGUudG9TdHJpbmcoKTtcblxuICAvLyBTdHJpcCB0aGUgZnVuY3Rpb25cbiAgb3V0ID0gb3V0LnJlcGxhY2UoL15mdW5jdGlvbltee10re3x9JC9nLCAnJyk7XG5cbiAgLy8gQW5kIHJlY29tcGlsZSBpdCB3aXRoIHJpZ2h0IGFyZ3VtZW50c1xuICBvdXQgPSBuZXcgRnVuY3Rpb24oYXJncy5qb2luKCcsICcpLCBvdXQpO1xuXG4gIHJldHVybiBvdXQ7XG59O1xuXG5CRU1YSlNULnByb3RvdHlwZS5ncm91cEVudGl0aWVzID0gZnVuY3Rpb24gZ3JvdXBFbnRpdGllcyh0cmVlKSB7XG4gIHZhciByZXMgPSB7fTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0cmVlLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gTWFrZSBzdXJlIHRvIGNoYW5nZSBvbmx5IHRoZSBjb3B5LCB0aGUgb3JpZ2luYWwgaXMgY2FjaGVkIGluIGB0aGlzLnRyZWVgXG4gICAgdmFyIHRlbXBsYXRlID0gdHJlZVtpXS5jbG9uZSgpO1xuICAgIHZhciBibG9jayA9IG51bGw7XG4gICAgdmFyIGVsZW07XG5cbiAgICBlbGVtID0gdW5kZWZpbmVkO1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGVtcGxhdGUucHJlZGljYXRlcy5sZW5ndGg7IGorKykge1xuICAgICAgdmFyIHByZWQgPSB0ZW1wbGF0ZS5wcmVkaWNhdGVzW2pdO1xuICAgICAgaWYgKCEocHJlZCBpbnN0YW5jZW9mIFByb3BlcnR5TWF0Y2gpICYmXG4gICAgICAgICEocHJlZCBpbnN0YW5jZW9mIEFkZE1hdGNoKSlcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIGlmIChwcmVkLmtleSA9PT0gJ2Jsb2NrJylcbiAgICAgICAgYmxvY2sgPSBwcmVkLnZhbHVlO1xuICAgICAgZWxzZSBpZiAocHJlZC5rZXkgPT09ICdlbGVtJylcbiAgICAgICAgZWxlbSA9IHByZWQudmFsdWU7XG4gICAgICBlbHNlXG4gICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAvLyBSZW1vdmUgcHJlZGljYXRlLCB3ZSB3b24ndCBtdWNoIGFnYWluc3QgaXRcbiAgICAgIHRlbXBsYXRlLnByZWRpY2F0ZXMuc3BsaWNlKGosIDEpO1xuICAgICAgai0tO1xuICAgIH1cblxuICAgIGlmIChibG9jayA9PT0gbnVsbCkge1xuICAgICAgdmFyIG1zZyA9ICdibG9jayjigKYpIHN1YnByZWRpY2F0ZSBpcyBub3QgZm91bmQuXFxuJyArXG4gICAgICAnICAgIFNlZSB0ZW1wbGF0ZSB3aXRoIHN1YnByZWRpY2F0ZXM6XFxuICAgICAqICc7XG5cbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGVtcGxhdGUucHJlZGljYXRlcy5sZW5ndGg7IGorKykge1xuICAgICAgICB2YXIgcHJlZCA9IHRlbXBsYXRlLnByZWRpY2F0ZXNbal07XG5cbiAgICAgICAgaWYgKGogIT09IDApXG4gICAgICAgICAgbXNnICs9ICdcXG4gICAgICogJztcblxuICAgICAgICBpZiAocHJlZC5rZXkgPT09ICdfbW9kZScpIHtcbiAgICAgICAgICBtc2cgKz0gcHJlZC52YWx1ZSArICcoKSc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocHJlZC5rZXkpKSB7XG4gICAgICAgICAgICBtc2cgKz0gcHJlZC5rZXlbMF0ucmVwbGFjZSgnbW9kcycsICdtb2QnKVxuICAgICAgICAgICAgICAucmVwbGFjZSgnZWxlbU1vZHMnLCAnZWxlbU1vZCcpICtcbiAgICAgICAgICAgICAgJyhcXCcnICsgcHJlZC5rZXlbMV0gKyAnXFwnLCBcXCcnICsgcHJlZC52YWx1ZSArICdcXCcpJztcbiAgICAgICAgICB9IGVsc2UgaWYgKCFwcmVkLnZhbHVlIHx8ICFwcmVkLmtleSkge1xuICAgICAgICAgICAgbXNnICs9ICdtYXRjaCjigKYpJztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbXNnICs9IHByZWQua2V5ICsgJyhcXCcnICsgcHJlZC52YWx1ZSArICdcXCcpJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbXNnICs9ICdcXG4gICAgQW5kIHRlbXBsYXRlIGJvZHk6IFxcbiAgICAoJyArXG4gICAgICAgICh0eXBlb2YgdGVtcGxhdGUuYm9keSA9PT0gJ2Z1bmN0aW9uJyA/XG4gICAgICAgICAgdGVtcGxhdGUuYm9keSA6XG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkodGVtcGxhdGUuYm9keSkpICsgJyknO1xuXG4gICAgICBpZiAodHlwZW9mIEJFTVhKU1RFcnJvciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgQkVNWEpTVEVycm9yID0gcmVxdWlyZSgnLi9lcnJvcicpLkJFTVhKU1RFcnJvcjtcbiAgICAgIH1cblxuICAgICAgdGhyb3cgbmV3IEJFTVhKU1RFcnJvcihtc2cpO1xuICAgIH1cblxuICAgIHZhciBrZXkgPSB0aGlzLmNsYXNzQnVpbGRlci5idWlsZChibG9jaywgZWxlbSk7XG5cbiAgICBpZiAoIXJlc1trZXldKVxuICAgICAgcmVzW2tleV0gPSBbXTtcbiAgICByZXNba2V5XS5wdXNoKHRlbXBsYXRlKTtcbiAgfVxuICByZXR1cm4gcmVzO1xufTtcblxuQkVNWEpTVC5wcm90b3R5cGUudHJhbnNmb3JtRW50aXRpZXMgPSBmdW5jdGlvbiB0cmFuc2Zvcm1FbnRpdGllcyhlbnRpdGllcykge1xuICB2YXIgd2lsZGNhcmRFbGVtcyA9IFtdO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoZW50aXRpZXMpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIga2V5ID0ga2V5c1tpXTtcblxuICAgIC8vIFRPRE8oaW5kdXRueSk6IHBhc3MgdGhpcyB2YWx1ZXMgb3ZlclxuICAgIHZhciBwYXJ0cyA9IHRoaXMuY2xhc3NCdWlsZGVyLnNwbGl0KGtleSk7XG4gICAgdmFyIGJsb2NrID0gcGFydHNbMF07XG4gICAgdmFyIGVsZW0gPSBwYXJ0c1sxXTtcblxuICAgIGlmIChlbGVtID09PSAnKicpXG4gICAgICB3aWxkY2FyZEVsZW1zLnB1c2goYmxvY2spO1xuXG4gICAgZW50aXRpZXNba2V5XSA9IG5ldyB0aGlzLkVudGl0eShcbiAgICAgIHRoaXMsIGJsb2NrLCBlbGVtLCBlbnRpdGllc1trZXldKTtcbiAgfVxuXG4gIC8vIE1lcmdlIHdpbGRjYXJkIGJsb2NrIHRlbXBsYXRlc1xuICBpZiAoZW50aXRpZXMuaGFzT3duUHJvcGVydHkoJyonKSkge1xuICAgIHZhciB3aWxkY2FyZCA9IGVudGl0aWVzWycqJ107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICAgIGlmIChrZXkgPT09ICcqJylcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIGVudGl0aWVzW2tleV0ucHJlcGVuZCh3aWxkY2FyZCk7XG4gICAgfVxuICAgIHRoaXMuZGVmYXVsdEVudC5wcmVwZW5kKHdpbGRjYXJkKTtcbiAgICB0aGlzLmRlZmF1bHRFbGVtRW50LnByZXBlbmQod2lsZGNhcmQpO1xuICB9XG5cbiAgLy8gTWVyZ2Ugd2lsZGNhcmQgZWxlbSB0ZW1wbGF0ZXNcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB3aWxkY2FyZEVsZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGJsb2NrID0gd2lsZGNhcmRFbGVtc1tpXTtcbiAgICB2YXIgd2lsZGNhcmRLZXkgPSB0aGlzLmNsYXNzQnVpbGRlci5idWlsZChibG9jaywgJyonKTtcbiAgICB2YXIgd2lsZGNhcmQgPSBlbnRpdGllc1t3aWxkY2FyZEtleV07XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICAgIGlmIChrZXkgPT09IHdpbGRjYXJkS2V5KVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgdmFyIGVudGl0eSA9IGVudGl0aWVzW2tleV07XG4gICAgICBpZiAoZW50aXR5LmJsb2NrICE9PSBibG9jaylcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIGlmIChlbnRpdHkuZWxlbSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgZW50aXRpZXNba2V5XS5wcmVwZW5kKHdpbGRjYXJkKTtcbiAgICB9XG4gICAgdGhpcy5kZWZhdWx0RWxlbUVudC5wcmVwZW5kKHdpbGRjYXJkKTtcbiAgfVxuXG4gIC8vIFNldCBkZWZhdWx0IHRlbXBsYXRlcyBhZnRlciBtZXJnaW5nIHdpdGggd2lsZGNhcmRcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgZW50aXRpZXNba2V5XS5zZXREZWZhdWx0cygpO1xuICAgIHRoaXMuZGVmYXVsdEVudC5zZXREZWZhdWx0cygpO1xuICAgIHRoaXMuZGVmYXVsdEVsZW1FbnQuc2V0RGVmYXVsdHMoKTtcbiAgfVxuXG4gIHJldHVybiBlbnRpdGllcztcbn07XG5cbkJFTVhKU1QucHJvdG90eXBlLl9ydW4gPSBmdW5jdGlvbiBfcnVuKGNvbnRleHQpIHtcbiAgdmFyIHJlcztcbiAgaWYgKGNvbnRleHQgPT09IHVuZGVmaW5lZCB8fCBjb250ZXh0ID09PSAnJyB8fCBjb250ZXh0ID09PSBudWxsKVxuICAgIHJlcyA9IHRoaXMucnVuRW1wdHkoKTtcbiAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShjb250ZXh0KSlcbiAgICByZXMgPSB0aGlzLnJ1bk1hbnkoY29udGV4dCk7XG4gIGVsc2UgaWYgKFxuICAgIHR5cGVvZiBjb250ZXh0Lmh0bWwgPT09ICdzdHJpbmcnICYmXG4gICAgIWNvbnRleHQudGFnICYmXG4gICAgdHlwZW9mIGNvbnRleHQuYmxvY2sgPT09ICd1bmRlZmluZWQnICYmXG4gICAgdHlwZW9mIGNvbnRleHQuZWxlbSA9PT0gJ3VuZGVmaW5lZCcgJiZcbiAgICB0eXBlb2YgY29udGV4dC5jbHMgPT09ICd1bmRlZmluZWQnICYmXG4gICAgdHlwZW9mIGNvbnRleHQuYXR0cnMgPT09ICd1bmRlZmluZWQnXG4gIClcbiAgICByZXMgPSB0aGlzLnJ1blVuZXNjYXBlZChjb250ZXh0Lmh0bWwpO1xuICBlbHNlIGlmICh1dGlscy5pc1NpbXBsZShjb250ZXh0KSlcbiAgICByZXMgPSB0aGlzLnJ1blNpbXBsZShjb250ZXh0KTtcbiAgZWxzZVxuICAgIHJlcyA9IHRoaXMucnVuT25lKGNvbnRleHQpO1xuICByZXR1cm4gcmVzO1xufTtcblxuQkVNWEpTVC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gcnVuKGpzb24pIHtcbiAgdmFyIG1hdGNoID0gdGhpcy5tYXRjaDtcbiAgdmFyIGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG5cbiAgdGhpcy5tYXRjaCA9IG51bGw7XG4gIHRoaXMuY29udGV4dCA9IG5ldyB0aGlzLmNvbnRleHRDb25zdHJ1Y3Rvcih0aGlzKTtcbiAgdGhpcy5jYW5GbHVzaCA9IHRoaXMuY29udGV4dC5fZmx1c2ggIT09IG51bGw7XG4gIHRoaXMuZGVwdGggPSAwO1xuICB2YXIgcmVzID0gdGhpcy5fcnVuKGpzb24pO1xuXG4gIGlmICh0aGlzLmNhbkZsdXNoKVxuICAgIHJlcyA9IHRoaXMuY29udGV4dC5fZmx1c2gocmVzKTtcblxuICB0aGlzLm1hdGNoID0gbWF0Y2g7XG4gIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG5cbiAgcmV0dXJuIHJlcztcbn07XG5cblxuQkVNWEpTVC5wcm90b3R5cGUucnVuRW1wdHkgPSBmdW5jdGlvbiBydW5FbXB0eSgpIHtcbiAgdGhpcy5jb250ZXh0Ll9saXN0TGVuZ3RoLS07XG4gIHJldHVybiAnJztcbn07XG5cbkJFTVhKU1QucHJvdG90eXBlLnJ1blVuZXNjYXBlZCA9IGZ1bmN0aW9uIHJ1blVuZXNjYXBlZChjb250ZXh0KSB7XG4gIHRoaXMuY29udGV4dC5fbGlzdExlbmd0aC0tO1xuICByZXR1cm4gJycgKyBjb250ZXh0O1xufTtcblxuQkVNWEpTVC5wcm90b3R5cGUucnVuU2ltcGxlID0gZnVuY3Rpb24gcnVuU2ltcGxlKHNpbXBsZSkge1xuICB0aGlzLmNvbnRleHQuX2xpc3RMZW5ndGgtLTtcbiAgdmFyIHJlcyA9ICcnO1xuICBpZiAoc2ltcGxlICYmIHNpbXBsZSAhPT0gdHJ1ZSB8fCBzaW1wbGUgPT09IDApIHtcbiAgICByZXMgKz0gdHlwZW9mIHNpbXBsZSA9PT0gJ3N0cmluZycgJiYgdGhpcy5jb250ZXh0LmVzY2FwZUNvbnRlbnQgP1xuICAgICAgdXRpbHMueG1sRXNjYXBlKHNpbXBsZSkgOlxuICAgICAgc2ltcGxlO1xuICB9XG5cbiAgcmV0dXJuIHJlcztcbn07XG5cbkJFTVhKU1QucHJvdG90eXBlLnJ1bk9uZSA9IGZ1bmN0aW9uIHJ1bk9uZShqc29uKSB7XG4gIHZhciBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuXG4gIHZhciBvbGRDdHggPSBjb250ZXh0LmN0eDtcbiAgdmFyIG9sZEJsb2NrID0gY29udGV4dC5ibG9jaztcbiAgdmFyIG9sZEN1cnJCbG9jayA9IGNvbnRleHQuX2N1cnJCbG9jaztcbiAgdmFyIG9sZEVsZW0gPSBjb250ZXh0LmVsZW07XG4gIHZhciBvbGRNb2RzID0gY29udGV4dC5tb2RzO1xuICB2YXIgb2xkRWxlbU1vZHMgPSBjb250ZXh0LmVsZW1Nb2RzO1xuXG4gIGlmIChqc29uLmJsb2NrIHx8IGpzb24uZWxlbSlcbiAgICBjb250ZXh0Ll9jdXJyQmxvY2sgPSAnJztcbiAgZWxzZVxuICAgIGNvbnRleHQuX2N1cnJCbG9jayA9IGNvbnRleHQuYmxvY2s7XG5cbiAgY29udGV4dC5jdHggPSBqc29uO1xuICBpZiAoanNvbi5ibG9jaykge1xuICAgIGNvbnRleHQuYmxvY2sgPSBqc29uLmJsb2NrO1xuXG4gICAgaWYgKGpzb24ubW9kcylcbiAgICAgIGNvbnRleHQubW9kcyA9IGpzb24ubW9kcztcbiAgICBlbHNlIGlmIChqc29uLmJsb2NrICE9PSBvbGRCbG9jayB8fCAhanNvbi5lbGVtKVxuICAgICAgY29udGV4dC5tb2RzID0ge307XG4gIH0gZWxzZSB7XG4gICAgaWYgKCFqc29uLmVsZW0pXG4gICAgICBjb250ZXh0LmJsb2NrID0gJyc7XG4gICAgZWxzZSBpZiAob2xkQ3VyckJsb2NrKVxuICAgICAgY29udGV4dC5ibG9jayA9IG9sZEN1cnJCbG9jaztcbiAgfVxuXG4gIGNvbnRleHQuZWxlbSA9IGpzb24uZWxlbTtcbiAgaWYgKGpzb24uZWxlbU1vZHMpXG4gICAgY29udGV4dC5lbGVtTW9kcyA9IGpzb24uZWxlbU1vZHM7XG4gIGVsc2VcbiAgICBjb250ZXh0LmVsZW1Nb2RzID0ge307XG5cbiAgdmFyIGJsb2NrID0gY29udGV4dC5ibG9jayB8fCAnJztcbiAgdmFyIGVsZW0gPSBjb250ZXh0LmVsZW07XG5cbiAgLy8gQ29udHJvbCBsaXN0IHBvc2l0aW9uXG4gIGlmIChibG9jayB8fCBlbGVtKVxuICAgIGNvbnRleHQucG9zaXRpb24rKztcbiAgZWxzZVxuICAgIGNvbnRleHQuX2xpc3RMZW5ndGgtLTtcblxuICAvLyBUbyBpbnZhbGlkYXRlIGBhcHBseU5leHRgIGZsYWdzXG4gIHRoaXMuZGVwdGgrKztcblxuICB2YXIga2V5ID0gdGhpcy5jbGFzc0J1aWxkZXIuYnVpbGQoYmxvY2ssIGVsZW0pO1xuXG4gIHZhciByZXN0b3JlRmx1c2ggPSBmYWxzZTtcbiAgdmFyIGVudCA9IHRoaXMuZW50aXRpZXNba2V5XTtcbiAgaWYgKGVudCkge1xuICAgIGlmICh0aGlzLmNhbkZsdXNoICYmICFlbnQuY2FuRmx1c2gpIHtcbiAgICAgIC8vIEVudGl0eSBkb2VzIG5vdCBzdXBwb3J0IGZsdXNoaW5nLCBkbyBub3QgZmx1c2ggYW55dGhpbmcgbmVzdGVkXG4gICAgICByZXN0b3JlRmx1c2ggPSB0cnVlO1xuICAgICAgdGhpcy5jYW5GbHVzaCA9IGZhbHNlO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBObyBlbnRpdHkgLSB1c2UgZGVmYXVsdCBvbmVcbiAgICBlbnQgPSB0aGlzLmRlZmF1bHRFbnQ7XG4gICAgaWYgKGVsZW0gIT09IHVuZGVmaW5lZClcbiAgICAgIGVudCA9IHRoaXMuZGVmYXVsdEVsZW1FbnQ7XG4gICAgZW50LmluaXQoYmxvY2ssIGVsZW0pO1xuICB9XG5cbiAgdmFyIHJlcyA9IHRoaXMub3B0aW9ucy5wcm9kdWN0aW9uID09PSB0cnVlID9cbiAgICB0aGlzLnRyeVJ1bihjb250ZXh0LCBlbnQpIDpcbiAgICBlbnQucnVuKGNvbnRleHQpO1xuXG4gIGNvbnRleHQuY3R4ID0gb2xkQ3R4O1xuICBjb250ZXh0LmJsb2NrID0gb2xkQmxvY2s7XG4gIGNvbnRleHQuZWxlbSA9IG9sZEVsZW07XG4gIGNvbnRleHQubW9kcyA9IG9sZE1vZHM7XG4gIGNvbnRleHQuZWxlbU1vZHMgPSBvbGRFbGVtTW9kcztcbiAgY29udGV4dC5fY3VyckJsb2NrID0gb2xkQ3VyckJsb2NrO1xuICB0aGlzLmRlcHRoLS07XG4gIGlmIChyZXN0b3JlRmx1c2gpXG4gICAgdGhpcy5jYW5GbHVzaCA9IHRydWU7XG5cbiAgcmV0dXJuIHJlcztcbn07XG5cbkJFTVhKU1QucHJvdG90eXBlLnRyeVJ1biA9IGZ1bmN0aW9uIHRyeVJ1bihjb250ZXh0LCBlbnQpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZW50LnJ1bihjb250ZXh0KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0JFTVhKU1QgRVJST1I6IGNhbm5vdCByZW5kZXIgJyArXG4gICAgICBbXG4gICAgICAgICdibG9jayAnICsgY29udGV4dC5ibG9jayxcbiAgICAgICAgJ2VsZW0gJyArIGNvbnRleHQuZWxlbSxcbiAgICAgICAgJ21vZHMgJyArIEpTT04uc3RyaW5naWZ5KGNvbnRleHQubW9kcyksXG4gICAgICAgICdlbGVtTW9kcyAnICsgSlNPTi5zdHJpbmdpZnkoY29udGV4dC5lbGVtTW9kcylcbiAgICAgIF0uam9pbignLCAnKSwgZSk7XG4gICAgcmV0dXJuICcnO1xuICB9XG59O1xuXG5CRU1YSlNULnByb3RvdHlwZS5yZW5kZXJDb250ZW50ID0gZnVuY3Rpb24gcmVuZGVyQ29udGVudChjb250ZW50LCBpc0JFTSkge1xuICB2YXIgY29udGV4dCA9IHRoaXMuY29udGV4dDtcbiAgdmFyIG9sZFBvcyA9IGNvbnRleHQucG9zaXRpb247XG4gIHZhciBvbGRMaXN0TGVuZ3RoID0gY29udGV4dC5fbGlzdExlbmd0aDtcbiAgdmFyIG9sZE5vdE5ld0xpc3QgPSBjb250ZXh0Ll9ub3ROZXdMaXN0O1xuXG4gIGNvbnRleHQuX25vdE5ld0xpc3QgPSBmYWxzZTtcbiAgaWYgKGlzQkVNKSB7XG4gICAgY29udGV4dC5wb3NpdGlvbiA9IDA7XG4gICAgY29udGV4dC5fbGlzdExlbmd0aCA9IDE7XG4gIH1cblxuICB2YXIgcmVzID0gdGhpcy5fcnVuKGNvbnRlbnQpO1xuXG4gIGNvbnRleHQucG9zaXRpb24gPSBvbGRQb3M7XG4gIGNvbnRleHQuX2xpc3RMZW5ndGggPSBvbGRMaXN0TGVuZ3RoO1xuICBjb250ZXh0Ll9ub3ROZXdMaXN0ID0gb2xkTm90TmV3TGlzdDtcblxuICByZXR1cm4gcmVzO1xufTtcblxuQkVNWEpTVC5wcm90b3R5cGUubG9jYWwgPSBmdW5jdGlvbiBsb2NhbChjaGFuZ2VzLCBib2R5KSB7XG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoY2hhbmdlcyk7XG4gIHZhciByZXN0b3JlID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgIHZhciBwYXJ0cyA9IGtleS5zcGxpdCgnLicpO1xuXG4gICAgdmFyIHZhbHVlID0gdGhpcy5jb250ZXh0O1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgcGFydHMubGVuZ3RoIC0gMTsgaisrKVxuICAgICAgdmFsdWUgPSB2YWx1ZVtwYXJ0c1tqXV07XG5cbiAgICByZXN0b3JlLnB1c2goe1xuICAgICAgcGFydHM6IHBhcnRzLFxuICAgICAgdmFsdWU6IHZhbHVlW3BhcnRzW2pdXVxuICAgIH0pO1xuICAgIHZhbHVlW3BhcnRzW2pdXSA9IGNoYW5nZXNba2V5XTtcbiAgfVxuXG4gIHZhciByZXMgPSBib2R5LmNhbGwodGhpcy5jb250ZXh0KTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3RvcmUubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgcGFydHMgPSByZXN0b3JlW2ldLnBhcnRzO1xuICAgIHZhciB2YWx1ZSA9IHRoaXMuY29udGV4dDtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IHBhcnRzLmxlbmd0aCAtIDE7IGorKylcbiAgICAgIHZhbHVlID0gdmFsdWVbcGFydHNbal1dO1xuXG4gICAgdmFsdWVbcGFydHNbal1dID0gcmVzdG9yZVtpXS52YWx1ZTtcbiAgfVxuXG4gIHJldHVybiByZXM7XG59O1xuXG5CRU1YSlNULnByb3RvdHlwZS5hcHBseU5leHQgPSBmdW5jdGlvbiBhcHBseU5leHQoKSB7XG4gIHJldHVybiB0aGlzLm1hdGNoLmV4ZWModGhpcy5jb250ZXh0KTtcbn07XG5cbkJFTVhKU1QucHJvdG90eXBlLmFwcGx5TW9kZSA9IGZ1bmN0aW9uIGFwcGx5TW9kZShtb2RlLCBjaGFuZ2VzKSB7XG4gIHZhciBtYXRjaCA9IHRoaXMubWF0Y2guZW50aXR5LnJlc3RbbW9kZV07XG4gIGlmICghbWF0Y2gpIHtcbiAgICBpZiAobW9kZSA9PT0gJ21vZHMnKVxuICAgICAgcmV0dXJuIHRoaXMuY29udGV4dC5tb2RzO1xuXG4gICAgaWYgKG1vZGUgPT09ICdlbGVtTW9kcycpXG4gICAgICByZXR1cm4gdGhpcy5jb250ZXh0LmVsZW1Nb2RzO1xuXG4gICAgcmV0dXJuIHRoaXMuY29udGV4dC5jdHhbbW9kZV07XG4gIH1cblxuICBpZiAoIWNoYW5nZXMpXG4gICAgcmV0dXJuIG1hdGNoLmV4ZWModGhpcy5jb250ZXh0KTtcblxuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgLy8gQWxsb2NhdGUgZnVuY3Rpb24gdGhpcyB3YXksIHRvIHByZXZlbnQgYWxsb2NhdGlvbiBhdCB0aGUgdG9wIG9mIHRoZVxuICAvLyBgYXBwbHlNb2RlYFxuICB2YXIgZm4gPSBmdW5jdGlvbiBsb2NhbEJvZHkoKSB7XG4gICAgcmV0dXJuIG1hdGNoLmV4ZWMoc2VsZi5jb250ZXh0KTtcbiAgfTtcbiAgcmV0dXJuIHRoaXMubG9jYWwoY2hhbmdlcywgZm4pO1xufTtcblxuQkVNWEpTVC5wcm90b3R5cGUuZXhwb3J0QXBwbHkgPSBmdW5jdGlvbiBleHBvcnRBcHBseShleHBvcnRzKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgZXhwb3J0cy5hcHBseSA9IGZ1bmN0aW9uIGFwcGx5KGNvbnRleHQpIHtcbiAgICByZXR1cm4gc2VsZi5ydW4oY29udGV4dCk7XG4gIH07XG5cbiAgLy8gQWRkIHRlbXBsYXRlcyBhdCBydW4gdGltZVxuICBleHBvcnRzLmNvbXBpbGUgPSBmdW5jdGlvbiBjb21waWxlKHRlbXBsYXRlcykge1xuICAgIHJldHVybiBzZWxmLmNvbXBpbGUodGVtcGxhdGVzKTtcbiAgfTtcblxuICB2YXIgc2hhcmVkQ29udGV4dCA9IHt9O1xuXG4gIGV4cG9ydHMuQkVNQ29udGV4dCA9IHRoaXMuY29udGV4dENvbnN0cnVjdG9yO1xuICBzaGFyZWRDb250ZXh0LkJFTUNvbnRleHQgPSBleHBvcnRzLkJFTUNvbnRleHQ7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm9uaW5pdC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBvbmluaXQgPSB0aGlzLm9uaW5pdFtpXTtcblxuICAgIG9uaW5pdChleHBvcnRzLCBzaGFyZWRDb250ZXh0KTtcbiAgfVxufTtcbiIsInZhciB0cmVlID0gcmVxdWlyZSgnLi90cmVlJyk7XG52YXIgUHJvcGVydHlNYXRjaCA9IHRyZWUuUHJvcGVydHlNYXRjaDtcbnZhciBBZGRNYXRjaCA9IHRyZWUuQWRkTWF0Y2g7XG52YXIgV3JhcE1hdGNoID0gdHJlZS5XcmFwTWF0Y2g7XG52YXIgQ3VzdG9tTWF0Y2ggPSB0cmVlLkN1c3RvbU1hdGNoO1xuXG5mdW5jdGlvbiBNYXRjaFByb3BlcnR5KHRlbXBsYXRlLCBwcmVkKSB7XG4gIHRoaXMudGVtcGxhdGUgPSB0ZW1wbGF0ZTtcbiAgdGhpcy5rZXkgPSBwcmVkLmtleTtcbiAgdGhpcy52YWx1ZSA9IHByZWQudmFsdWU7XG59XG5cbk1hdGNoUHJvcGVydHkucHJvdG90eXBlLmV4ZWMgPSBmdW5jdGlvbiBleGVjKGNvbnRleHQpIHtcbiAgcmV0dXJuIGNvbnRleHRbdGhpcy5rZXldID09PSB0aGlzLnZhbHVlO1xufTtcblxuZnVuY3Rpb24gTWF0Y2hOZXN0ZWQodGVtcGxhdGUsIHByZWQpIHtcbiAgdGhpcy50ZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICB0aGlzLmtleXMgPSBwcmVkLmtleTtcbiAgdGhpcy52YWx1ZSA9IHByZWQudmFsdWU7XG59XG5cbk1hdGNoTmVzdGVkLnByb3RvdHlwZS5leGVjID0gZnVuY3Rpb24gZXhlYyhjb250ZXh0KSB7XG4gIHZhciB2YWwgPSBjb250ZXh0O1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5rZXlzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgIHZhbCA9IHZhbFt0aGlzLmtleXNbaV1dO1xuICAgIGlmICghdmFsKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgdmFsID0gdmFsW3RoaXMua2V5c1tpXV07XG5cbiAgaWYgKHRoaXMudmFsdWUgPT09IHRydWUpXG4gICAgcmV0dXJuIHZhbCAhPT0gdW5kZWZpbmVkICYmIHZhbCAhPT0gJycgJiYgdmFsICE9PSBmYWxzZSAmJiB2YWwgIT09IG51bGw7XG5cbiAgcmV0dXJuIFN0cmluZyh2YWwpID09PSB0aGlzLnZhbHVlO1xufTtcblxuZnVuY3Rpb24gTWF0Y2hDdXN0b20odGVtcGxhdGUsIHByZWQpIHtcbiAgdGhpcy50ZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICB0aGlzLmJvZHkgPSBwcmVkLmJvZHk7XG59XG5cbk1hdGNoQ3VzdG9tLnByb3RvdHlwZS5leGVjID0gZnVuY3Rpb24gZXhlYyhjb250ZXh0KSB7XG4gIHJldHVybiB0aGlzLmJvZHkuY2FsbChjb250ZXh0LCBjb250ZXh0LCBjb250ZXh0LmN0eCk7XG59O1xuXG5mdW5jdGlvbiBNYXRjaFdyYXAodGVtcGxhdGUpIHtcbiAgdGhpcy50ZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICB0aGlzLndyYXAgPSBudWxsO1xufVxuXG5NYXRjaFdyYXAucHJvdG90eXBlLmV4ZWMgPSBmdW5jdGlvbiBleGVjKGNvbnRleHQpIHtcbiAgdmFyIHJlcyA9IHRoaXMud3JhcCAhPT0gY29udGV4dC5jdHg7XG4gIHRoaXMud3JhcCA9IGNvbnRleHQuY3R4O1xuICByZXR1cm4gcmVzO1xufTtcblxuZnVuY3Rpb24gQWRkV3JhcCh0ZW1wbGF0ZSwgcHJlZCkge1xuICB0aGlzLnRlbXBsYXRlID0gdGVtcGxhdGU7XG4gIHRoaXMua2V5ID0gcHJlZC5rZXk7XG4gIHRoaXMudmFsdWUgPSBwcmVkLnZhbHVlO1xufVxuXG5BZGRXcmFwLnByb3RvdHlwZS5leGVjID0gZnVuY3Rpb24gZXhlYyhjb250ZXh0KSB7XG4gIHJldHVybiBjb250ZXh0W3RoaXMua2V5XSA9PT0gdGhpcy52YWx1ZTtcbn07XG5cbmZ1bmN0aW9uIE1hdGNoVGVtcGxhdGUobW9kZSwgdGVtcGxhdGUpIHtcbiAgdGhpcy5tb2RlID0gbW9kZTtcbiAgdGhpcy5wcmVkaWNhdGVzID0gbmV3IEFycmF5KHRlbXBsYXRlLnByZWRpY2F0ZXMubGVuZ3RoKTtcbiAgdGhpcy5ib2R5ID0gdGVtcGxhdGUuYm9keTtcblxuICB2YXIgcG9zdHBvbmUgPSBbXTtcblxuICBmb3IgKHZhciBpID0gMCwgaiA9IDA7IGkgPCB0aGlzLnByZWRpY2F0ZXMubGVuZ3RoOyBpKyssIGorKykge1xuICAgIHZhciBwcmVkID0gdGVtcGxhdGUucHJlZGljYXRlc1tpXTtcbiAgICBpZiAocHJlZCBpbnN0YW5jZW9mIFByb3BlcnR5TWF0Y2gpIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHByZWQua2V5KSlcbiAgICAgICAgdGhpcy5wcmVkaWNhdGVzW2pdID0gbmV3IE1hdGNoTmVzdGVkKHRoaXMsIHByZWQpO1xuICAgICAgZWxzZVxuICAgICAgICB0aGlzLnByZWRpY2F0ZXNbal0gPSBuZXcgTWF0Y2hQcm9wZXJ0eSh0aGlzLCBwcmVkKTtcbiAgICB9IGVsc2UgaWYgKHByZWQgaW5zdGFuY2VvZiBBZGRNYXRjaCkge1xuICAgICAgdGhpcy5wcmVkaWNhdGVzW2pdID0gbmV3IEFkZFdyYXAodGhpcywgcHJlZCk7XG4gICAgfSBlbHNlIGlmIChwcmVkIGluc3RhbmNlb2YgQ3VzdG9tTWF0Y2gpIHtcbiAgICAgIHRoaXMucHJlZGljYXRlc1tqXSA9IG5ldyBNYXRjaEN1c3RvbSh0aGlzLCBwcmVkKTtcblxuICAgICAgLy8gUHVzaCBNYXRjaFdyYXAgbGF0ZXIsIHRoZXkgc2hvdWxkIG5vdCBiZSBleGVjdXRlZCBmaXJzdC5cbiAgICAgIC8vIE90aGVyd2lzZSB0aGV5IHdpbGwgc2V0IGZsYWcgdG9vIGVhcmx5LCBhbmQgYm9keSBtaWdodCBub3QgYmUgZXhlY3V0ZWRcbiAgICB9IGVsc2UgaWYgKHByZWQgaW5zdGFuY2VvZiBXcmFwTWF0Y2gpIHtcbiAgICAgIGotLTtcbiAgICAgIHBvc3Rwb25lLnB1c2gobmV3IE1hdGNoV3JhcCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFNraXBcbiAgICAgIGotLTtcbiAgICB9XG4gIH1cblxuICAvLyBJbnNlcnQgbGF0ZSBwcmVkaWNhdGVzXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcG9zdHBvbmUubGVuZ3RoOyBpKyssIGorKylcbiAgICB0aGlzLnByZWRpY2F0ZXNbal0gPSBwb3N0cG9uZVtpXTtcblxuICBpZiAodGhpcy5wcmVkaWNhdGVzLmxlbmd0aCAhPT0gailcbiAgICB0aGlzLnByZWRpY2F0ZXMubGVuZ3RoID0gajtcbn1cbmV4cG9ydHMuTWF0Y2hUZW1wbGF0ZSA9IE1hdGNoVGVtcGxhdGU7XG5cbmZ1bmN0aW9uIE1hdGNoKGVudGl0eSwgbW9kZU5hbWUpIHtcbiAgdGhpcy5lbnRpdHkgPSBlbnRpdHk7XG4gIHRoaXMubW9kZU5hbWUgPSBtb2RlTmFtZTtcbiAgdGhpcy5iZW14anN0ID0gdGhpcy5lbnRpdHkuYmVteGpzdDtcbiAgdGhpcy50ZW1wbGF0ZXMgPSBbXTtcblxuICAvLyBhcHBseU5leHQgbWFza1xuICB0aGlzLm1hc2sgPSBbIDAgXTtcblxuICAvLyBXZSBhcmUgZ29pbmcgdG8gY3JlYXRlIGNvcGllcyBvZiBtYXNrIGZvciBuZXN0ZWQgYGFwcGx5TmV4dCgpYFxuICB0aGlzLm1hc2tTaXplID0gMDtcbiAgdGhpcy5tYXNrT2Zmc2V0ID0gMDtcblxuICB0aGlzLmNvdW50ID0gMDtcbiAgdGhpcy5kZXB0aCA9IC0xO1xuXG4gIHRoaXMudGhyb3duRXJyb3IgPSBudWxsO1xufVxuZXhwb3J0cy5NYXRjaCA9IE1hdGNoO1xuXG5NYXRjaC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiBjbG9uZShlbnRpdHkpIHtcbiAgdmFyIHJlcyA9IG5ldyBNYXRjaChlbnRpdHksIHRoaXMubW9kZU5hbWUpO1xuXG4gIHJlcy50ZW1wbGF0ZXMgPSB0aGlzLnRlbXBsYXRlcy5zbGljZSgpO1xuICByZXMubWFzayA9IHRoaXMubWFzay5zbGljZSgpO1xuICByZXMubWFza1NpemUgPSB0aGlzLm1hc2tTaXplO1xuICByZXMuY291bnQgPSB0aGlzLmNvdW50O1xuXG4gIHJldHVybiByZXM7XG59O1xuXG5NYXRjaC5wcm90b3R5cGUucHJlcGVuZCA9IGZ1bmN0aW9uIHByZXBlbmQob3RoZXIpIHtcbiAgdGhpcy50ZW1wbGF0ZXMgPSBvdGhlci50ZW1wbGF0ZXMuY29uY2F0KHRoaXMudGVtcGxhdGVzKTtcbiAgdGhpcy5jb3VudCArPSBvdGhlci5jb3VudDtcblxuICB3aGlsZSAoTWF0aC5jZWlsKHRoaXMuY291bnQgLyAzMSkgPiB0aGlzLm1hc2subGVuZ3RoKVxuICAgIHRoaXMubWFzay5wdXNoKDApO1xuXG4gIHRoaXMubWFza1NpemUgPSB0aGlzLm1hc2subGVuZ3RoO1xufTtcblxuTWF0Y2gucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiBwdXNoKHRlbXBsYXRlKSB7XG4gIHRoaXMudGVtcGxhdGVzLnB1c2gobmV3IE1hdGNoVGVtcGxhdGUodGhpcywgdGVtcGxhdGUpKTtcbiAgdGhpcy5jb3VudCsrO1xuXG4gIGlmIChNYXRoLmNlaWwodGhpcy5jb3VudCAvIDMxKSA+IHRoaXMubWFzay5sZW5ndGgpXG4gICAgdGhpcy5tYXNrLnB1c2goMCk7XG5cbiAgdGhpcy5tYXNrU2l6ZSA9IHRoaXMubWFzay5sZW5ndGg7XG59O1xuXG5NYXRjaC5wcm90b3R5cGUudHJ5Q2F0Y2ggPSBmdW5jdGlvbiB0cnlDYXRjaChmbiwgY3R4KSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGZuLmNhbGwoY3R4LCBjdHgsIGN0eC5jdHgpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhpcy50aHJvd25FcnJvciA9IGU7XG4gIH1cbn07XG5cbk1hdGNoLnByb3RvdHlwZS5leGVjID0gZnVuY3Rpb24gZXhlYyhjb250ZXh0KSB7XG4gIHZhciBzYXZlID0gdGhpcy5jaGVja0RlcHRoKCk7XG5cbiAgdmFyIHRlbXBsYXRlO1xuICB2YXIgYml0SW5kZXggPSB0aGlzLm1hc2tPZmZzZXQ7XG4gIHZhciBtYXNrID0gdGhpcy5tYXNrW2JpdEluZGV4XTtcbiAgdmFyIGJpdCA9IDE7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jb3VudDsgaSsrKSB7XG4gICAgaWYgKChtYXNrICYgYml0KSA9PT0gMCkge1xuICAgICAgdGVtcGxhdGUgPSB0aGlzLnRlbXBsYXRlc1tpXTtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGVtcGxhdGUucHJlZGljYXRlcy5sZW5ndGg7IGorKykge1xuICAgICAgICB2YXIgcHJlZCA9IHRlbXBsYXRlLnByZWRpY2F0ZXNbal07XG5cbiAgICAgICAgLyoganNoaW50IG1heGRlcHRoIDogZmFsc2UgKi9cbiAgICAgICAgaWYgKCFwcmVkLmV4ZWMoY29udGV4dCkpXG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIEFsbCBwcmVkaWNhdGVzIG1hdGNoZWQhXG4gICAgICBpZiAoaiA9PT0gdGVtcGxhdGUucHJlZGljYXRlcy5sZW5ndGgpXG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChiaXQgPT09IDB4NDAwMDAwMDApIHtcbiAgICAgIGJpdEluZGV4Kys7XG4gICAgICBtYXNrID0gdGhpcy5tYXNrW2JpdEluZGV4XTtcbiAgICAgIGJpdCA9IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJpdCA8PD0gMTtcbiAgICB9XG4gIH1cblxuICBpZiAoaSA9PT0gdGhpcy5jb3VudCkge1xuICAgIGlmICh0aGlzLm1vZGVOYW1lID09PSAnbW9kcycpXG4gICAgICByZXR1cm4gY29udGV4dC5tb2RzO1xuXG4gICAgaWYgKHRoaXMubW9kZU5hbWUgPT09ICdlbGVtTW9kcycpXG4gICAgICByZXR1cm4gY29udGV4dC5lbGVtTW9kcztcblxuICAgIHJldHVybiBjb250ZXh0LmN0eFt0aGlzLm1vZGVOYW1lXTtcbiAgfVxuXG4gIHZhciBvbGRNYXNrID0gbWFzaztcbiAgdmFyIG9sZE1hdGNoID0gdGhpcy5iZW14anN0Lm1hdGNoO1xuICB0aGlzLm1hc2tbYml0SW5kZXhdIHw9IGJpdDtcbiAgdGhpcy5iZW14anN0Lm1hdGNoID0gdGhpcztcblxuICB0aGlzLnRocm93bkVycm9yID0gbnVsbDtcblxuICB2YXIgb3V0O1xuICBpZiAodHlwZW9mIHRlbXBsYXRlLmJvZHkgPT09ICdmdW5jdGlvbicpXG4gICAgb3V0ID0gdGhpcy50cnlDYXRjaCh0ZW1wbGF0ZS5ib2R5LCBjb250ZXh0KTtcbiAgZWxzZVxuICAgIG91dCA9IHRlbXBsYXRlLmJvZHk7XG5cbiAgdGhpcy5tYXNrW2JpdEluZGV4XSA9IG9sZE1hc2s7XG4gIHRoaXMuYmVteGpzdC5tYXRjaCA9IG9sZE1hdGNoO1xuICB0aGlzLnJlc3RvcmVEZXB0aChzYXZlKTtcblxuICB2YXIgZSA9IHRoaXMudGhyb3duRXJyb3I7XG4gIGlmIChlICE9PSBudWxsKSB7XG4gICAgdGhpcy50aHJvd25FcnJvciA9IG51bGw7XG4gICAgdGhyb3cgZTtcbiAgfVxuXG4gIHJldHVybiBvdXQ7XG59O1xuXG5NYXRjaC5wcm90b3R5cGUuY2hlY2tEZXB0aCA9IGZ1bmN0aW9uIGNoZWNrRGVwdGgoKSB7XG4gIGlmICh0aGlzLmRlcHRoID09PSAtMSkge1xuICAgIHRoaXMuZGVwdGggPSB0aGlzLmJlbXhqc3QuZGVwdGg7XG4gICAgcmV0dXJuIC0xO1xuICB9XG5cbiAgaWYgKHRoaXMuYmVteGpzdC5kZXB0aCA9PT0gdGhpcy5kZXB0aClcbiAgICByZXR1cm4gdGhpcy5kZXB0aDtcblxuICB2YXIgZGVwdGggPSB0aGlzLmRlcHRoO1xuICB0aGlzLmRlcHRoID0gdGhpcy5iZW14anN0LmRlcHRoO1xuXG4gIHRoaXMubWFza09mZnNldCArPSB0aGlzLm1hc2tTaXplO1xuXG4gIHdoaWxlICh0aGlzLm1hc2subGVuZ3RoIDwgdGhpcy5tYXNrT2Zmc2V0ICsgdGhpcy5tYXNrU2l6ZSlcbiAgICB0aGlzLm1hc2sucHVzaCgwKTtcblxuICByZXR1cm4gZGVwdGg7XG59O1xuXG5NYXRjaC5wcm90b3R5cGUucmVzdG9yZURlcHRoID0gZnVuY3Rpb24gcmVzdG9yZURlcHRoKGRlcHRoKSB7XG4gIGlmIChkZXB0aCAhPT0gLTEgJiYgZGVwdGggIT09IHRoaXMuZGVwdGgpXG4gICAgdGhpcy5tYXNrT2Zmc2V0IC09IHRoaXMubWFza1NpemU7XG4gIHRoaXMuZGVwdGggPSBkZXB0aDtcbn07XG4iLCJ2YXIgYXNzZXJ0ID0gcmVxdWlyZSgnbWluaW1hbGlzdGljLWFzc2VydCcpO1xudmFyIGluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcblxuZnVuY3Rpb24gVGVtcGxhdGUocHJlZGljYXRlcywgYm9keSkge1xuICB0aGlzLnByZWRpY2F0ZXMgPSBwcmVkaWNhdGVzO1xuXG4gIHRoaXMuYm9keSA9IGJvZHk7XG59XG5leHBvcnRzLlRlbXBsYXRlID0gVGVtcGxhdGU7XG5cblRlbXBsYXRlLnByb3RvdHlwZS53cmFwID0gZnVuY3Rpb24gd3JhcCgpIHtcbiAgdmFyIGJvZHkgPSB0aGlzLmJvZHk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wcmVkaWNhdGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHByZWQgPSB0aGlzLnByZWRpY2F0ZXNbaV07XG4gICAgYm9keSA9IHByZWQud3JhcEJvZHkoYm9keSk7XG4gIH1cbiAgdGhpcy5ib2R5ID0gYm9keTtcbn07XG5cblRlbXBsYXRlLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lKCkge1xuICByZXR1cm4gbmV3IFRlbXBsYXRlKHRoaXMucHJlZGljYXRlcy5zbGljZSgpLCB0aGlzLmJvZHkpO1xufTtcblxuZnVuY3Rpb24gTWF0Y2hCYXNlKCkge1xufVxuZXhwb3J0cy5NYXRjaEJhc2UgPSBNYXRjaEJhc2U7XG5cbk1hdGNoQmFzZS5wcm90b3R5cGUud3JhcEJvZHkgPSBmdW5jdGlvbiB3cmFwQm9keShib2R5KSB7XG4gIHJldHVybiBib2R5O1xufTtcblxuZnVuY3Rpb24gSXRlbSh0cmVlLCBjaGlsZHJlbikge1xuICB0aGlzLmNvbmRpdGlvbnMgPSBbXTtcbiAgdGhpcy5jaGlsZHJlbiA9IFtdO1xuXG4gIGZvciAodmFyIGkgPSBjaGlsZHJlbi5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHZhciBhcmcgPSBjaGlsZHJlbltpXTtcbiAgICBpZiAoYXJnIGluc3RhbmNlb2YgTWF0Y2hCYXNlKVxuICAgICAgdGhpcy5jb25kaXRpb25zLnB1c2goYXJnKTtcbiAgICBlbHNlIGlmIChhcmcgPT09IHRyZWUuYm91bmRCb2R5KVxuICAgICAgdGhpcy5jaGlsZHJlbltpXSA9IHRyZWUucXVldWUucG9wKCk7XG4gICAgZWxzZVxuICAgICAgdGhpcy5jaGlsZHJlbltpXSA9IGFyZztcbiAgfVxufVxuXG5mdW5jdGlvbiBXcmFwTWF0Y2gocmVmcykge1xuICBNYXRjaEJhc2UuY2FsbCh0aGlzKTtcblxuICB0aGlzLnJlZnMgPSByZWZzO1xufVxuaW5oZXJpdHMoV3JhcE1hdGNoLCBNYXRjaEJhc2UpO1xuZXhwb3J0cy5XcmFwTWF0Y2ggPSBXcmFwTWF0Y2g7XG5cbldyYXBNYXRjaC5wcm90b3R5cGUud3JhcEJvZHkgPSBmdW5jdGlvbiB3cmFwQm9keShib2R5KSB7XG4gIHZhciBhcHBseUN0eCA9IHRoaXMucmVmcy5hcHBseUN0eDtcblxuICBpZiAodHlwZW9mIGJvZHkgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gaW5saW5lQWRhcHRvcigpIHtcbiAgICAgIHJldHVybiBhcHBseUN0eChib2R5KTtcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBBZGFwdG9yKCkge1xuICAgIHJldHVybiBhcHBseUN0eChib2R5LmNhbGwodGhpcywgdGhpcywgdGhpcy5jdHgpKTtcbiAgfTtcbn07XG5cbmZ1bmN0aW9uIFJlcGxhY2VNYXRjaChyZWZzKSB7XG4gIE1hdGNoQmFzZS5jYWxsKHRoaXMpO1xuXG4gIHRoaXMucmVmcyA9IHJlZnM7XG59XG5pbmhlcml0cyhSZXBsYWNlTWF0Y2gsIE1hdGNoQmFzZSk7XG5leHBvcnRzLlJlcGxhY2VNYXRjaCA9IFJlcGxhY2VNYXRjaDtcblxuUmVwbGFjZU1hdGNoLnByb3RvdHlwZS53cmFwQm9keSA9IGZ1bmN0aW9uIHdyYXBCb2R5KGJvZHkpIHtcbiAgdmFyIGFwcGx5Q3R4ID0gdGhpcy5yZWZzLmFwcGx5Q3R4O1xuXG4gIGlmICh0eXBlb2YgYm9keSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmdW5jdGlvbiBpbmxpbmVBZGFwdG9yKCkge1xuICAgICAgcmV0dXJuIGFwcGx5Q3R4KGJvZHkpO1xuICAgIH07XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gcmVwbGFjZUFkYXB0b3IoKSB7XG4gICAgcmV0dXJuIGFwcGx5Q3R4KGJvZHkuY2FsbCh0aGlzLCB0aGlzLCB0aGlzLmN0eCkpO1xuICB9O1xufTtcblxuZnVuY3Rpb24gRXh0ZW5kTWF0Y2gocmVmcykge1xuICBNYXRjaEJhc2UuY2FsbCh0aGlzKTtcblxuICB0aGlzLnJlZnMgPSByZWZzO1xufVxuaW5oZXJpdHMoRXh0ZW5kTWF0Y2gsIE1hdGNoQmFzZSk7XG5leHBvcnRzLkV4dGVuZE1hdGNoID0gRXh0ZW5kTWF0Y2g7XG5cbkV4dGVuZE1hdGNoLnByb3RvdHlwZS53cmFwQm9keSA9IGZ1bmN0aW9uIHdyYXBCb2R5KGJvZHkpIHtcbiAgdmFyIHJlZnMgPSB0aGlzLnJlZnM7XG4gIHZhciBhcHBseUN0eCA9IHJlZnMuYXBwbHlDdHg7XG4gIHZhciBsb2NhbCA9IHJlZnMubG9jYWw7XG5cbiAgaWYgKHR5cGVvZiBib2R5ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGlubGluZUFkYXB0b3IoKSB7XG4gICAgICB2YXIgY2hhbmdlcyA9IHt9O1xuXG4gICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGJvZHkpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKVxuICAgICAgICBjaGFuZ2VzWydjdHguJyArIGtleXNbaV1dID0gYm9keVtrZXlzW2ldXTtcblxuICAgICAgcmV0dXJuIGxvY2FsKGNoYW5nZXMpKGZ1bmN0aW9uIHByZUFwcGx5Q3R4KCkge1xuICAgICAgICByZXR1cm4gYXBwbHlDdHgodGhpcy5jdHgpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiBsb2NhbEFkYXB0b3IoKSB7XG4gICAgdmFyIGNoYW5nZXMgPSB7fTtcblxuICAgIHZhciBvYmogPSBib2R5LmNhbGwodGhpcyk7XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmopO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKylcbiAgICAgIGNoYW5nZXNbJ2N0eC4nICsga2V5c1tpXV0gPSBvYmpba2V5c1tpXV07XG5cbiAgICByZXR1cm4gbG9jYWwoY2hhbmdlcykoZnVuY3Rpb24gcHJlQXBwbHlDdHgoKSB7XG4gICAgICByZXR1cm4gYXBwbHlDdHgodGhpcy5jdHgpO1xuICAgIH0pO1xuICB9O1xufTtcblxuZnVuY3Rpb24gQWRkTWF0Y2gobW9kZSwgcmVmcykge1xuICBNYXRjaEJhc2UuY2FsbCh0aGlzKTtcblxuICB0aGlzLm1vZGUgPSBtb2RlO1xuICB0aGlzLnJlZnMgPSByZWZzO1xufVxuaW5oZXJpdHMoQWRkTWF0Y2gsIE1hdGNoQmFzZSk7XG5leHBvcnRzLkFkZE1hdGNoID0gQWRkTWF0Y2g7XG5cbkFkZE1hdGNoLnByb3RvdHlwZS53cmFwQm9keSA9IGZ1bmN0aW9uIHdyYXBCb2R5KGJvZHkpIHtcbiAgcmV0dXJuIHRoaXNbdGhpcy5tb2RlICsgJ1dyYXBCb2R5J10oYm9keSk7XG59O1xuXG5BZGRNYXRjaC5wcm90b3R5cGUuYXBwZW5kQ29udGVudFdyYXBCb2R5ID1cbiAgZnVuY3Rpb24gYXBwZW5kQ29udGVudFdyYXBCb2R5KGJvZHkpIHtcbiAgdmFyIHJlZnMgPSB0aGlzLnJlZnM7XG4gIHZhciBhcHBseUN0eCA9IHJlZnMuYXBwbHlDdHg7XG4gIHZhciBhcHBseSA9IHJlZnMuYXBwbHk7XG5cbiAgaWYgKHR5cGVvZiBib2R5ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGlubGluZUFwcGVuZENvbnRlbnRBZGRBZGFwdG9yKCkge1xuICAgICAgcmV0dXJuIFsgYXBwbHkoJ2NvbnRlbnQnKSAsIGJvZHkgXTtcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGFwcGVuZENvbnRlbnRBZGRBZGFwdG9yKCkge1xuICAgIHJldHVybiBbIGFwcGx5KCdjb250ZW50JyksIGFwcGx5Q3R4KGJvZHkuY2FsbCh0aGlzLCB0aGlzLCB0aGlzLmN0eCkpIF07XG4gIH07XG59O1xuXG5BZGRNYXRjaC5wcm90b3R5cGUucHJlcGVuZENvbnRlbnRXcmFwQm9keSA9XG4gIGZ1bmN0aW9uIHByZXBlbmRDb250ZW50V3JhcEJvZHkoYm9keSkge1xuICB2YXIgcmVmcyA9IHRoaXMucmVmcztcbiAgdmFyIGFwcGx5Q3R4ID0gcmVmcy5hcHBseUN0eDtcbiAgdmFyIGFwcGx5ID0gcmVmcy5hcHBseTtcblxuICBpZiAodHlwZW9mIGJvZHkgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gaW5saW5lUHJlcGVuZENvbnRlbnRBZGRBZGFwdG9yKCkge1xuICAgICAgcmV0dXJuIFsgYm9keSwgYXBwbHkoJ2NvbnRlbnQnKSBdO1xuICAgIH07XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gcHJlcGVuZENvbnRlbnRBZGRBZGFwdG9yKCkge1xuICAgIHJldHVybiBbIGFwcGx5Q3R4KGJvZHkuY2FsbCh0aGlzLCB0aGlzLCB0aGlzLmN0eCkpLCBhcHBseSgnY29udGVudCcpIF07XG4gIH07XG59O1xuXG5BZGRNYXRjaC5wcm90b3R5cGUubWl4V3JhcEJvZHkgPSBmdW5jdGlvbiBtaXhXcmFwQm9keShib2R5KSB7XG4gIHZhciBhcHBseSA9IHRoaXMucmVmcy5hcHBseTtcblxuICBpZiAodHlwZW9mIGJvZHkgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gaW5saW5lQWRkTWl4QWRhcHRvcigpIHtcbiAgICAgIHZhciByZXQgPSBhcHBseSgnbWl4Jyk7XG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkocmV0KSkgcmV0ID0gWyByZXQgXTtcbiAgICAgIHJldHVybiByZXQuY29uY2F0KGJvZHkpO1xuICAgIH07XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gYWRkTWl4QWRhcHRvcigpIHtcbiAgICB2YXIgcmV0ID0gYXBwbHkoJ21peCcpO1xuICAgIGlmICghQXJyYXkuaXNBcnJheShyZXQpKSByZXQgPSBbIHJldCBdO1xuICAgIHJldHVybiByZXQuY29uY2F0KGJvZHkuY2FsbCh0aGlzLCB0aGlzLCB0aGlzLmN0eCkpO1xuICB9O1xufTtcblxuQWRkTWF0Y2gucHJvdG90eXBlLmF0dHJzV3JhcEJvZHkgPSBmdW5jdGlvbiBhdHRyc1dyYXBCb2R5KGJvZHkpIHtcbiAgdmFyIGFwcGx5ID0gdGhpcy5yZWZzLmFwcGx5O1xuXG4gIGlmICh0eXBlb2YgYm9keSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmdW5jdGlvbiBpbmxpbmVBZGRBdHRyc0FkYXB0b3IoKSB7XG4gICAgICByZXR1cm4gdXRpbHMuZXh0ZW5kKGFwcGx5KCdhdHRycycpIHx8IHt9LCBib2R5KTtcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGFkZEF0dHJzQWRhcHRvcigpIHtcbiAgICByZXR1cm4gdXRpbHMuZXh0ZW5kKGFwcGx5KCdhdHRycycpIHx8IHt9LCBib2R5LmNhbGwodGhpcywgdGhpcywgdGhpcy5jdHgpKTtcbiAgfTtcbn07XG5cbkFkZE1hdGNoLnByb3RvdHlwZS5qc1dyYXBCb2R5ID0gZnVuY3Rpb24ganNXcmFwQm9keShib2R5KSB7XG4gIHZhciBhcHBseSA9IHRoaXMucmVmcy5hcHBseTtcblxuICBpZiAodHlwZW9mIGJvZHkgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gaW5saW5lQWRkSnNBZGFwdG9yKCkge1xuICAgICAgcmV0dXJuIHV0aWxzLmV4dGVuZChhcHBseSgnanMnKSB8fCB7fSwgYm9keSk7XG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiBhZGRKc0FkYXB0b3IoKSB7XG4gICAgcmV0dXJuIHV0aWxzLmV4dGVuZChhcHBseSgnanMnKSB8fCB7fSwgYm9keS5jYWxsKHRoaXMsIHRoaXMsIHRoaXMuY3R4KSk7XG4gIH07XG59O1xuXG5BZGRNYXRjaC5wcm90b3R5cGUubW9kc1dyYXBCb2R5ID0gZnVuY3Rpb24gbW9kc1dyYXBCb2R5KGJvZHkpIHtcbiAgdmFyIGFwcGx5ID0gdGhpcy5yZWZzLmFwcGx5O1xuXG4gIGlmICh0eXBlb2YgYm9keSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmdW5jdGlvbiBpbmxpbmVBZGRNb2RzQWRhcHRvcigpIHtcbiAgICAgIHRoaXMubW9kcyA9IHV0aWxzLmV4dGVuZChhcHBseSgnbW9kcycpLCBib2R5KTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHM7XG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiBhZGRNb2RzQWRhcHRvcigpIHtcbiAgICB0aGlzLm1vZHMgPSB1dGlscy5leHRlbmQoYXBwbHkoJ21vZHMnKSwgYm9keS5jYWxsKHRoaXMsIHRoaXMsIHRoaXMuY3R4KSk7XG4gICAgcmV0dXJuIHRoaXMubW9kcztcbiAgfTtcbn07XG5cbkFkZE1hdGNoLnByb3RvdHlwZS5lbGVtTW9kc1dyYXBCb2R5ID0gZnVuY3Rpb24gZWxlbU1vZHNXcmFwQm9keShib2R5KSB7XG4gIHZhciBhcHBseSA9IHRoaXMucmVmcy5hcHBseTtcblxuICBpZiAodHlwZW9mIGJvZHkgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gaW5saW5lQWRkRWxlbU1vZHNBZGFwdG9yKCkge1xuICAgICAgdGhpcy5lbGVtTW9kcyA9IHV0aWxzLmV4dGVuZChhcHBseSgnZWxlbU1vZHMnKSwgYm9keSk7XG4gICAgICByZXR1cm4gdGhpcy5lbGVtTW9kcztcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGFkZEVsZW1Nb2RzQWRhcHRvcigpIHtcbiAgICB0aGlzLmVsZW1Nb2RzID0gdXRpbHMuZXh0ZW5kKGFwcGx5KCdlbGVtTW9kcycpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib2R5LmNhbGwodGhpcywgdGhpcywgdGhpcy5jdHgpKTtcbiAgICByZXR1cm4gdGhpcy5lbGVtTW9kcztcbiAgfTtcbn07XG5cbmZ1bmN0aW9uIENvbXBpbGVyT3B0aW9ucyhvcHRpb25zKSB7XG4gIE1hdGNoQmFzZS5jYWxsKHRoaXMpO1xuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xufVxuaW5oZXJpdHMoQ29tcGlsZXJPcHRpb25zLCBNYXRjaEJhc2UpO1xuZXhwb3J0cy5Db21waWxlck9wdGlvbnMgPSBDb21waWxlck9wdGlvbnM7XG5cbmZ1bmN0aW9uIFByb3BlcnR5TWF0Y2goa2V5LCB2YWx1ZSkge1xuICBNYXRjaEJhc2UuY2FsbCh0aGlzKTtcblxuICB0aGlzLmtleSA9IGtleTtcbiAgdGhpcy52YWx1ZSA9IHZhbHVlO1xufVxuaW5oZXJpdHMoUHJvcGVydHlNYXRjaCwgTWF0Y2hCYXNlKTtcbmV4cG9ydHMuUHJvcGVydHlNYXRjaCA9IFByb3BlcnR5TWF0Y2g7XG5cbmZ1bmN0aW9uIEN1c3RvbU1hdGNoKGJvZHkpIHtcbiAgTWF0Y2hCYXNlLmNhbGwodGhpcyk7XG5cbiAgdGhpcy5ib2R5ID0gYm9keTtcbn1cbmluaGVyaXRzKEN1c3RvbU1hdGNoLCBNYXRjaEJhc2UpO1xuZXhwb3J0cy5DdXN0b21NYXRjaCA9IEN1c3RvbU1hdGNoO1xuXG5mdW5jdGlvbiBUcmVlKG9wdGlvbnMpIHtcbiAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgdGhpcy5yZWZzID0gdGhpcy5vcHRpb25zLnJlZnM7XG5cbiAgdGhpcy5ib3VuZEJvZHkgPSB0aGlzLmJvZHkuYmluZCh0aGlzKTtcblxuICB2YXIgbWV0aG9kcyA9IHRoaXMubWV0aG9kcygnYm9keScpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG1ldGhvZHMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgbWV0aG9kID0gbWV0aG9kc1tpXTtcbiAgICAvLyBOT1RFOiBtZXRob2QubmFtZSBpcyBlbXB0eSBiZWNhdXNlIG9mIC5iaW5kKClcbiAgICB0aGlzLmJvdW5kQm9keVtUcmVlLm1ldGhvZHNbaV1dID0gbWV0aG9kO1xuICB9XG5cbiAgdGhpcy5xdWV1ZSA9IFtdO1xuICB0aGlzLnRlbXBsYXRlcyA9IFtdO1xuICB0aGlzLmluaXRpYWxpemVycyA9IFtdO1xufVxuZXhwb3J0cy5UcmVlID0gVHJlZTtcblxuVHJlZS5tZXRob2RzID0gW1xuICAvLyBTdWJwcmVkaWNhdGVzOlxuICAnbWF0Y2gnLCAnYmxvY2snLCAnZWxlbScsICdtb2QnLCAnZWxlbU1vZCcsXG4gIC8vIFJ1bnRpbWUgcmVsYXRlZDpcbiAgJ29uaW5pdCcsICd4anN0T3B0aW9ucycsXG4gIC8vIE91dHB1dCBnZW5lcmF0b3JzOlxuICAnd3JhcCcsICdyZXBsYWNlJywgJ2V4dGVuZCcsICdtb2RlJywgJ2RlZicsXG4gICdjb250ZW50JywgJ2FwcGVuZENvbnRlbnQnLCAncHJlcGVuZENvbnRlbnQnLFxuICAnYXR0cnMnLCAnYWRkQXR0cnMnLCAnanMnLCAnYWRkSnMnLCAnbWl4JywgJ2FkZE1peCcsXG4gICdtb2RzJywgJ2FkZE1vZHMnLCAnYWRkRWxlbU1vZHMnLCAnZWxlbU1vZHMnLFxuICAndGFnJywgJ2NscycsICdiZW0nXG5dO1xuXG5UcmVlLnByb3RvdHlwZS5idWlsZCA9IGZ1bmN0aW9uIGJ1aWxkKHRlbXBsYXRlcywgYXBwbHkpIHtcbiAgdmFyIG1ldGhvZHMgPSB0aGlzLm1ldGhvZHMoJ2dsb2JhbCcpLmNvbmNhdChhcHBseSk7XG4gIG1ldGhvZHNbMF0gPSB0aGlzLm1hdGNoLmJpbmQodGhpcyk7XG5cbiAgdGVtcGxhdGVzLmFwcGx5KHt9LCBtZXRob2RzKTtcblxuICByZXR1cm4ge1xuICAgIHRlbXBsYXRlczogdGhpcy50ZW1wbGF0ZXMuc2xpY2UoKS5yZXZlcnNlKCksXG4gICAgb25pbml0OiB0aGlzLmluaXRpYWxpemVyc1xuICB9O1xufTtcblxuZnVuY3Rpb24gbWV0aG9kRmFjdG9yeShzZWxmLCBraW5kLCBuYW1lKSB7XG4gIHZhciBtZXRob2QgPSBzZWxmW25hbWVdO1xuICB2YXIgYm91bmRCb2R5ID0gc2VsZi5ib3VuZEJvZHk7XG5cbiAgaWYgKGtpbmQgIT09ICdib2R5Jykge1xuICAgIGlmIChuYW1lID09PSAncmVwbGFjZScgfHwgbmFtZSA9PT0gJ2V4dGVuZCcgfHwgbmFtZSA9PT0gJ3dyYXAnKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gd3JhcEV4dGVuZGVkKCkge1xuICAgICAgICByZXR1cm4gbWV0aG9kLmFwcGx5KHNlbGYsIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiB3cmFwTm90Qm9keSgpIHtcbiAgICAgIG1ldGhvZC5hcHBseShzZWxmLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIGJvdW5kQm9keTtcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBCb2R5KCkge1xuICAgIHZhciByZXMgPSBtZXRob2QuYXBwbHkoc2VsZiwgYXJndW1lbnRzKTtcblxuICAgIC8vIEluc2VydCBib2R5IGludG8gbGFzdCBpdGVtXG4gICAgdmFyIGNoaWxkID0gc2VsZi5xdWV1ZS5wb3AoKTtcbiAgICB2YXIgbGFzdCA9IHNlbGYucXVldWVbc2VsZi5xdWV1ZS5sZW5ndGggLSAxXTtcbiAgICBsYXN0LmNvbmRpdGlvbnMgPSBsYXN0LmNvbmRpdGlvbnMuY29uY2F0KGNoaWxkLmNvbmRpdGlvbnMpO1xuICAgIGxhc3QuY2hpbGRyZW4gPSBsYXN0LmNoaWxkcmVuLmNvbmNhdChjaGlsZC5jaGlsZHJlbik7XG5cbiAgICBpZiAobmFtZSA9PT0gJ3JlcGxhY2UnIHx8IG5hbWUgPT09ICdleHRlbmQnIHx8IG5hbWUgPT09ICd3cmFwJylcbiAgICAgIHJldHVybiByZXM7XG4gICAgcmV0dXJuIGJvdW5kQm9keTtcbiAgfTtcbn1cblxuVHJlZS5wcm90b3R5cGUubWV0aG9kcyA9IGZ1bmN0aW9uIG1ldGhvZHMoa2luZCkge1xuICB2YXIgb3V0ID0gbmV3IEFycmF5KFRyZWUubWV0aG9kcy5sZW5ndGgpO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgb3V0Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIG5hbWUgPSBUcmVlLm1ldGhvZHNbaV07XG4gICAgb3V0W2ldID0gbWV0aG9kRmFjdG9yeSh0aGlzLCBraW5kLCBuYW1lKTtcbiAgfVxuXG4gIHJldHVybiBvdXQ7XG59O1xuXG4vLyBDYWxsZWQgYWZ0ZXIgYWxsIG1hdGNoZXNcblRyZWUucHJvdG90eXBlLmZsdXNoID0gZnVuY3Rpb24gZmx1c2goY29uZGl0aW9ucywgaXRlbSkge1xuICB2YXIgc3ViY29uZDtcblxuICBpZiAoaXRlbS5jb25kaXRpb25zKVxuICAgIHN1YmNvbmQgPSBjb25kaXRpb25zLmNvbmNhdChpdGVtLmNvbmRpdGlvbnMpO1xuICBlbHNlXG4gICAgc3ViY29uZCA9IGl0ZW0uY29uZGl0aW9ucztcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGl0ZW0uY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgYXJnID0gaXRlbS5jaGlsZHJlbltpXTtcblxuICAgIC8vIEdvIGRlZXBlclxuICAgIGlmIChhcmcgaW5zdGFuY2VvZiBJdGVtKSB7XG4gICAgICB0aGlzLmZsdXNoKHN1YmNvbmQsIGl0ZW0uY2hpbGRyZW5baV0pO1xuXG4gICAgLy8gQm9keVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgdGVtcGxhdGUgPSBuZXcgVGVtcGxhdGUoY29uZGl0aW9ucywgYXJnKTtcbiAgICAgIHRlbXBsYXRlLndyYXAoKTtcbiAgICAgIHRoaXMudGVtcGxhdGVzLnB1c2godGVtcGxhdGUpO1xuICAgIH1cbiAgfVxufTtcblxuVHJlZS5wcm90b3R5cGUuYm9keSA9IGZ1bmN0aW9uIGJvZHkoKSB7XG4gIHZhciBjaGlsZHJlbiA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspXG4gICAgY2hpbGRyZW5baV0gPSBhcmd1bWVudHNbaV07XG5cbiAgdmFyIGNoaWxkID0gbmV3IEl0ZW0odGhpcywgY2hpbGRyZW4pO1xuICB0aGlzLnF1ZXVlW3RoaXMucXVldWUubGVuZ3RoIC0gMV0uY2hpbGRyZW4ucHVzaChjaGlsZCk7XG5cbiAgaWYgKHRoaXMucXVldWUubGVuZ3RoID09PSAxKVxuICAgIHRoaXMuZmx1c2goW10sIHRoaXMucXVldWUuc2hpZnQoKSk7XG5cbiAgcmV0dXJuIHRoaXMuYm91bmRCb2R5O1xufTtcblxuVHJlZS5wcm90b3R5cGUubWF0Y2ggPSBmdW5jdGlvbiBtYXRjaCgpIHtcbiAgdmFyIGNoaWxkcmVuID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGgpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBhcmcgPSBhcmd1bWVudHNbaV07XG4gICAgaWYgKHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbicpXG4gICAgICBhcmcgPSBuZXcgQ3VzdG9tTWF0Y2goYXJnKTtcbiAgICBhc3NlcnQoYXJnIGluc3RhbmNlb2YgTWF0Y2hCYXNlLCAnV3JvbmcgLm1hdGNoKCkgYXJndW1lbnQnKTtcbiAgICBjaGlsZHJlbltpXSA9IGFyZztcbiAgfVxuXG4gIHRoaXMucXVldWUucHVzaChuZXcgSXRlbSh0aGlzLCBjaGlsZHJlbikpO1xuXG4gIHJldHVybiB0aGlzLmJvdW5kQm9keTtcbn07XG5cblRyZWUucHJvdG90eXBlLmFwcGx5TW9kZSA9IGZ1bmN0aW9uIGFwcGx5TW9kZShhcmdzLCBtb2RlKSB7XG4gIGlmIChhcmdzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBFcnJvcignUHJlZGljYXRlIHNob3VsZCBub3QgaGF2ZSBhcmd1bWVudHMgYnV0ICcgK1xuICAgICAgSlNPTi5zdHJpbmdpZnkoYXJncykgKyAnIHBhc3NlZCcpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXMubW9kZShtb2RlKTtcbn07XG5cblRyZWUucHJvdG90eXBlLndyYXAgPSBmdW5jdGlvbiB3cmFwKCkge1xuICByZXR1cm4gdGhpcy5kZWYuYXBwbHkodGhpcywgYXJndW1lbnRzKS5tYXRjaChuZXcgV3JhcE1hdGNoKHRoaXMucmVmcykpO1xufTtcblxuVHJlZS5wcm90b3R5cGUueGpzdE9wdGlvbnMgPSBmdW5jdGlvbiB4anN0T3B0aW9ucyhvcHRpb25zKSB7XG4gIHRoaXMucXVldWUucHVzaChuZXcgSXRlbSh0aGlzLCBbXG4gICAgbmV3IENvbXBpbGVyT3B0aW9ucyhvcHRpb25zKVxuICBdKSk7XG4gIHJldHVybiB0aGlzLmJvdW5kQm9keTtcbn07XG5cblRyZWUucHJvdG90eXBlLmJsb2NrID0gZnVuY3Rpb24gYmxvY2sobmFtZSkge1xuICByZXR1cm4gdGhpcy5tYXRjaChuZXcgUHJvcGVydHlNYXRjaCgnYmxvY2snLCBuYW1lKSk7XG59O1xuXG5UcmVlLnByb3RvdHlwZS5lbGVtID0gZnVuY3Rpb24gZWxlbShuYW1lKSB7XG4gIHJldHVybiB0aGlzLm1hdGNoKG5ldyBQcm9wZXJ0eU1hdGNoKCdlbGVtJywgbmFtZSkpO1xufTtcblxuVHJlZS5wcm90b3R5cGUubW9kZSA9IGZ1bmN0aW9uIG1vZGUobmFtZSkge1xuICByZXR1cm4gdGhpcy5tYXRjaChuZXcgUHJvcGVydHlNYXRjaCgnX21vZGUnLCBuYW1lKSk7XG59O1xuXG5UcmVlLnByb3RvdHlwZS5tb2QgPSBmdW5jdGlvbiBtb2QobmFtZSwgdmFsdWUpIHtcbiAgcmV0dXJuIHRoaXMubWF0Y2gobmV3IFByb3BlcnR5TWF0Y2goWyAnbW9kcycsIG5hbWUgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IFN0cmluZyh2YWx1ZSkpKTtcbn07XG5cblRyZWUucHJvdG90eXBlLm1vZHMgPSBmdW5jdGlvbiBtb2RzKCkge1xuICByZXR1cm4gdGhpcy5hcHBseU1vZGUoYXJndW1lbnRzLCAnbW9kcycpO1xufTtcblxuVHJlZS5wcm90b3R5cGUuYWRkTW9kcyA9IGZ1bmN0aW9uIGFkZE1vZHMoKSB7XG4gIHJldHVybiB0aGlzLm1vZHMuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgIC5tYXRjaChuZXcgQWRkTWF0Y2goJ21vZHMnLCB0aGlzLnJlZnMpKTtcbn07XG5cblRyZWUucHJvdG90eXBlLmVsZW1Nb2QgPSBmdW5jdGlvbiBlbGVtTW9kKG5hbWUsIHZhbHVlKSB7XG4gIHJldHVybiB0aGlzLm1hdGNoKG5ldyBQcm9wZXJ0eU1hdGNoKFsgJ2VsZW1Nb2RzJywgbmFtZSBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID09PSB1bmRlZmluZWQgPyAgdHJ1ZSA6IFN0cmluZyh2YWx1ZSkpKTtcbn07XG5cblRyZWUucHJvdG90eXBlLmVsZW1Nb2RzID0gZnVuY3Rpb24gZWxlbU1vZHMoKSB7XG4gIHJldHVybiB0aGlzLmFwcGx5TW9kZShhcmd1bWVudHMsICdlbGVtTW9kcycpO1xufTtcblxuVHJlZS5wcm90b3R5cGUuYWRkRWxlbU1vZHMgPSBmdW5jdGlvbiBhZGRFbGVtTW9kcygpIHtcbiAgcmV0dXJuIHRoaXMuZWxlbU1vZHMuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgIC5tYXRjaChuZXcgQWRkTWF0Y2goJ2VsZW1Nb2RzJywgdGhpcy5yZWZzKSk7XG59O1xuXG5UcmVlLnByb3RvdHlwZS5kZWYgPSBmdW5jdGlvbiBkZWYoKSB7XG4gIHJldHVybiB0aGlzLmFwcGx5TW9kZShhcmd1bWVudHMsICdkZWZhdWx0Jyk7XG59O1xuXG5UcmVlLnByb3RvdHlwZS50YWcgPSBmdW5jdGlvbiB0YWcoKSB7XG4gIHJldHVybiB0aGlzLmFwcGx5TW9kZShhcmd1bWVudHMsICd0YWcnKTtcbn07XG5cblRyZWUucHJvdG90eXBlLmF0dHJzID0gZnVuY3Rpb24gYXR0cnMoKSB7XG4gIHJldHVybiB0aGlzLmFwcGx5TW9kZShhcmd1bWVudHMsICdhdHRycycpO1xufTtcblxuVHJlZS5wcm90b3R5cGUuYWRkQXR0cnMgPSBmdW5jdGlvbiBhZGRBdHRycygpIHtcbiAgcmV0dXJuIHRoaXMuYXR0cnMuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgIC5tYXRjaChuZXcgQWRkTWF0Y2goJ2F0dHJzJywgdGhpcy5yZWZzKSk7XG59O1xuXG5UcmVlLnByb3RvdHlwZS5jbHMgPSBmdW5jdGlvbiBjbHMoKSB7XG4gIHJldHVybiB0aGlzLmFwcGx5TW9kZShhcmd1bWVudHMsICdjbHMnKTtcbn07XG5cblRyZWUucHJvdG90eXBlLmpzID0gZnVuY3Rpb24ganMoKSB7XG4gIHJldHVybiB0aGlzLmFwcGx5TW9kZShhcmd1bWVudHMsICdqcycpO1xufTtcblxuVHJlZS5wcm90b3R5cGUuYWRkSnMgPSBmdW5jdGlvbiBhZGRBdHRycygpIHtcbiAgcmV0dXJuIHRoaXMuanMuYXBwbHkodGhpcywgYXJndW1lbnRzKS5tYXRjaChuZXcgQWRkTWF0Y2goJ2pzJywgdGhpcy5yZWZzKSk7XG59O1xuXG5UcmVlLnByb3RvdHlwZS5iZW0gPSBmdW5jdGlvbiBiZW0oKSB7XG4gIHJldHVybiB0aGlzLmFwcGx5TW9kZShhcmd1bWVudHMsICdiZW0nKTtcbn07XG5cblRyZWUucHJvdG90eXBlLmFkZE1peCA9IGZ1bmN0aW9uIGFkZE1peCgpIHtcbiAgcmV0dXJuIHRoaXMubWl4LmFwcGx5KHRoaXMsIGFyZ3VtZW50cykubWF0Y2gobmV3IEFkZE1hdGNoKCdtaXgnLCB0aGlzLnJlZnMpKTtcbn07XG5cblRyZWUucHJvdG90eXBlLm1peCA9IGZ1bmN0aW9uIG1peCgpIHtcbiAgcmV0dXJuIHRoaXMuYXBwbHlNb2RlKGFyZ3VtZW50cywgJ21peCcpO1xufTtcblxuVHJlZS5wcm90b3R5cGUuY29udGVudCA9IGZ1bmN0aW9uIGNvbnRlbnQoKSB7XG4gIHJldHVybiB0aGlzLmFwcGx5TW9kZShhcmd1bWVudHMsICdjb250ZW50Jyk7XG59O1xuXG5UcmVlLnByb3RvdHlwZS5hcHBlbmRDb250ZW50ID0gZnVuY3Rpb24gYXBwZW5kQ29udGVudCgpIHtcbiAgcmV0dXJuIHRoaXMuY29udGVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgLm1hdGNoKG5ldyBBZGRNYXRjaCgnYXBwZW5kQ29udGVudCcsIHRoaXMucmVmcykpO1xufTtcblxuXG5UcmVlLnByb3RvdHlwZS5wcmVwZW5kQ29udGVudCA9IGZ1bmN0aW9uIHByZXBlbmRDb250ZW50KCkge1xuICByZXR1cm4gdGhpcy5jb250ZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAubWF0Y2gobmV3IEFkZE1hdGNoKCdwcmVwZW5kQ29udGVudCcsIHRoaXMucmVmcykpO1xufTtcblxuVHJlZS5wcm90b3R5cGUucmVwbGFjZSA9IGZ1bmN0aW9uIHJlcGxhY2UoKSB7XG4gIHJldHVybiB0aGlzLmRlZi5hcHBseSh0aGlzLCBhcmd1bWVudHMpLm1hdGNoKG5ldyBSZXBsYWNlTWF0Y2godGhpcy5yZWZzKSk7XG59O1xuXG5UcmVlLnByb3RvdHlwZS5leHRlbmQgPSBmdW5jdGlvbiBleHRlbmQoKSB7XG4gIHJldHVybiB0aGlzLmRlZi5hcHBseSh0aGlzLCBhcmd1bWVudHMpLm1hdGNoKG5ldyBFeHRlbmRNYXRjaCh0aGlzLnJlZnMpKTtcbn07XG5cblRyZWUucHJvdG90eXBlLm9uaW5pdCA9IGZ1bmN0aW9uIG9uaW5pdChmbikge1xuICB0aGlzLmluaXRpYWxpemVycy5wdXNoKGZuKTtcbn07XG4iLCJ2YXIgYW1wID0gJyZhbXA7JztcbnZhciBsdCA9ICcmbHQ7JztcbnZhciBndCA9ICcmZ3Q7JztcbnZhciBxdW90ID0gJyZxdW90Oyc7XG52YXIgc2luZ2xlUXVvdCA9ICcmIzM5Oyc7XG5cbnZhciBtYXRjaFhtbFJlZ0V4cCA9IC9bJjw+XS87XG5cbmV4cG9ydHMueG1sRXNjYXBlID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gIHZhciBzdHIgPSAnJyArIHN0cmluZztcbiAgdmFyIG1hdGNoID0gbWF0Y2hYbWxSZWdFeHAuZXhlYyhzdHIpO1xuXG4gIGlmICghbWF0Y2gpXG4gICAgcmV0dXJuIHN0cjtcblxuICB2YXIgZXNjYXBlO1xuICB2YXIgaHRtbCA9ICcnO1xuICB2YXIgaW5kZXggPSAwO1xuICB2YXIgbGFzdEluZGV4ID0gMDtcblxuICBmb3IgKGluZGV4ID0gbWF0Y2guaW5kZXg7IGluZGV4IDwgc3RyLmxlbmd0aDsgaW5kZXgrKykge1xuICAgIHN3aXRjaCAoc3RyLmNoYXJDb2RlQXQoaW5kZXgpKSB7XG4gICAgICBjYXNlIDM4OiAvLyAmXG4gICAgICAgIGVzY2FwZSA9IGFtcDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDYwOiAvLyA8XG4gICAgICAgIGVzY2FwZSA9IGx0O1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNjI6IC8vID5cbiAgICAgICAgZXNjYXBlID0gZ3Q7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxhc3RJbmRleCAhPT0gaW5kZXgpXG4gICAgICBodG1sICs9IHN0ci5zdWJzdHJpbmcobGFzdEluZGV4LCBpbmRleCk7XG5cbiAgICBsYXN0SW5kZXggPSBpbmRleCArIDE7XG4gICAgaHRtbCArPSBlc2NhcGU7XG4gIH1cblxuICByZXR1cm4gbGFzdEluZGV4ICE9PSBpbmRleCA/XG4gICAgaHRtbCArIHN0ci5zdWJzdHJpbmcobGFzdEluZGV4LCBpbmRleCkgOlxuICAgIGh0bWw7XG59O1xuXG52YXIgbWF0Y2hBdHRyUmVnRXhwID0gL1tcIiZdLztcblxuZXhwb3J0cy5hdHRyRXNjYXBlID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gIHZhciBzdHIgPSAnJyArIHN0cmluZztcbiAgdmFyIG1hdGNoID0gbWF0Y2hBdHRyUmVnRXhwLmV4ZWMoc3RyKTtcblxuICBpZiAoIW1hdGNoKVxuICAgIHJldHVybiBzdHI7XG5cbiAgdmFyIGVzY2FwZTtcbiAgdmFyIGh0bWwgPSAnJztcbiAgdmFyIGluZGV4ID0gMDtcbiAgdmFyIGxhc3RJbmRleCA9IDA7XG5cbiAgZm9yIChpbmRleCA9IG1hdGNoLmluZGV4OyBpbmRleCA8IHN0ci5sZW5ndGg7IGluZGV4KyspIHtcbiAgICBzd2l0Y2ggKHN0ci5jaGFyQ29kZUF0KGluZGV4KSkge1xuICAgICAgY2FzZSAzNDogLy8gXCJcbiAgICAgICAgZXNjYXBlID0gcXVvdDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM4OiAvLyAmXG4gICAgICAgIGVzY2FwZSA9IGFtcDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGFzdEluZGV4ICE9PSBpbmRleClcbiAgICAgIGh0bWwgKz0gc3RyLnN1YnN0cmluZyhsYXN0SW5kZXgsIGluZGV4KTtcblxuICAgIGxhc3RJbmRleCA9IGluZGV4ICsgMTtcbiAgICBodG1sICs9IGVzY2FwZTtcbiAgfVxuXG4gIHJldHVybiBsYXN0SW5kZXggIT09IGluZGV4ID9cbiAgICBodG1sICsgc3RyLnN1YnN0cmluZyhsYXN0SW5kZXgsIGluZGV4KSA6XG4gICAgaHRtbDtcbn07XG5cbnZhciBtYXRjaEpzQXR0clJlZ0V4cCA9IC9bJyZdLztcblxuZXhwb3J0cy5qc0F0dHJFc2NhcGUgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgdmFyIHN0ciA9ICcnICsgc3RyaW5nO1xuICB2YXIgbWF0Y2ggPSBtYXRjaEpzQXR0clJlZ0V4cC5leGVjKHN0cik7XG5cbiAgaWYgKCFtYXRjaClcbiAgICByZXR1cm4gc3RyO1xuXG4gIHZhciBlc2NhcGU7XG4gIHZhciBodG1sID0gJyc7XG4gIHZhciBpbmRleCA9IDA7XG4gIHZhciBsYXN0SW5kZXggPSAwO1xuXG4gIGZvciAoaW5kZXggPSBtYXRjaC5pbmRleDsgaW5kZXggPCBzdHIubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgc3dpdGNoIChzdHIuY2hhckNvZGVBdChpbmRleCkpIHtcbiAgICAgIGNhc2UgMzg6IC8vICZcbiAgICAgICAgZXNjYXBlID0gYW1wO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzk6IC8vICdcbiAgICAgICAgZXNjYXBlID0gc2luZ2xlUXVvdDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGFzdEluZGV4ICE9PSBpbmRleClcbiAgICAgIGh0bWwgKz0gc3RyLnN1YnN0cmluZyhsYXN0SW5kZXgsIGluZGV4KTtcblxuICAgIGxhc3RJbmRleCA9IGluZGV4ICsgMTtcbiAgICBodG1sICs9IGVzY2FwZTtcbiAgfVxuXG4gIHJldHVybiBsYXN0SW5kZXggIT09IGluZGV4ID9cbiAgICBodG1sICsgc3RyLnN1YnN0cmluZyhsYXN0SW5kZXgsIGluZGV4KSA6XG4gICAgaHRtbDtcbn07XG5cbmV4cG9ydHMuZXh0ZW5kID0gZnVuY3Rpb24gZXh0ZW5kKG8xLCBvMikge1xuICBpZiAoIW8xIHx8ICFvMilcbiAgICByZXR1cm4gbzEgfHwgbzI7XG5cbiAgdmFyIHJlcyA9IHt9O1xuICB2YXIgbjtcblxuICBmb3IgKG4gaW4gbzEpXG4gICAgaWYgKG8xLmhhc093blByb3BlcnR5KG4pKVxuICAgICAgcmVzW25dID0gbzFbbl07XG4gIGZvciAobiBpbiBvMilcbiAgICBpZiAobzIuaGFzT3duUHJvcGVydHkobikpXG4gICAgICByZXNbbl0gPSBvMltuXTtcbiAgcmV0dXJuIHJlcztcbn07XG5cbnZhciBTSE9SVF9UQUdTID0geyAvLyBoYXNoIGZvciBxdWljayBjaGVjayBpZiB0YWcgc2hvcnRcbiAgYXJlYTogMSwgYmFzZTogMSwgYnI6IDEsIGNvbDogMSwgY29tbWFuZDogMSwgZW1iZWQ6IDEsIGhyOiAxLCBpbWc6IDEsXG4gIGlucHV0OiAxLCBrZXlnZW46IDEsIGxpbms6IDEsIG1ldGE6IDEsIHBhcmFtOiAxLCBzb3VyY2U6IDEsIHdicjogMVxufTtcblxuZXhwb3J0cy5pc1Nob3J0VGFnID0gZnVuY3Rpb24gaXNTaG9ydFRhZyh0KSB7XG4gIHJldHVybiBTSE9SVF9UQUdTLmhhc093blByb3BlcnR5KHQpO1xufTtcblxuZXhwb3J0cy5pc1NpbXBsZSA9IGZ1bmN0aW9uIGlzU2ltcGxlKG9iaikge1xuICBpZiAoIW9iaiB8fCBvYmogPT09IHRydWUpIHJldHVybiB0cnVlO1xuICBpZiAoIW9iai5ibG9jayAmJlxuICAgICAgIW9iai5lbGVtICYmXG4gICAgICAhb2JqLnRhZyAmJlxuICAgICAgIW9iai5jbHMgJiZcbiAgICAgICFvYmouYXR0cnMgJiZcbiAgICAgIG9iai5oYXNPd25Qcm9wZXJ0eSgnaHRtbCcpICYmXG4gICAgICBpc1NpbXBsZShvYmouaHRtbCkpXG4gICAgcmV0dXJuIHRydWU7XG4gIHJldHVybiB0eXBlb2Ygb2JqID09PSAnc3RyaW5nJyB8fCB0eXBlb2Ygb2JqID09PSAnbnVtYmVyJztcbn07XG5cbmV4cG9ydHMuaXNPYmogPSBmdW5jdGlvbiBpc09iaih2YWwpIHtcbiAgcmV0dXJuIHZhbCAmJiB0eXBlb2YgdmFsID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheSh2YWwpICYmXG4gICAgdmFsICE9PSBudWxsO1xufTtcblxudmFyIHVuaXFDb3VudCA9IDA7XG52YXIgdW5pcUlkID0gK25ldyBEYXRlKCk7XG52YXIgdW5pcUV4cGFuZG8gPSAnX18nICsgdW5pcUlkO1xudmFyIHVuaXFQcmVmaXggPSAndW5pcScgKyB1bmlxSWQ7XG5cbmZ1bmN0aW9uIGdldFVuaXEoKSB7XG4gIHJldHVybiB1bmlxUHJlZml4ICsgKCsrdW5pcUNvdW50KTtcbn1cbmV4cG9ydHMuZ2V0VW5pcSA9IGdldFVuaXE7XG5cbmV4cG9ydHMuaWRlbnRpZnkgPSBmdW5jdGlvbiBpZGVudGlmeShvYmosIG9ubHlHZXQpIHtcbiAgaWYgKCFvYmopXG4gICAgcmV0dXJuIGdldFVuaXEoKTtcbiAgaWYgKG9ubHlHZXQgfHwgb2JqW3VuaXFFeHBhbmRvXSlcbiAgICByZXR1cm4gb2JqW3VuaXFFeHBhbmRvXTtcblxuICB2YXIgdSA9IGdldFVuaXEoKTtcbiAgb2JqW3VuaXFFeHBhbmRvXSA9IHU7XG4gIHJldHVybiB1O1xufTtcblxuZXhwb3J0cy5mblRvU3RyaW5nID0gZnVuY3Rpb24gZm5Ub1N0cmluZyhjb2RlKSB7XG4gIC8vIEl0IGlzIGZpbmUgdG8gY29tcGlsZSB3aXRob3V0IHRlbXBsYXRlcyBhdCBmaXJzdFxuICBpZiAoIWNvZGUpXG4gICAgcmV0dXJuICcnO1xuXG4gIGlmICh0eXBlb2YgY29kZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vIEV4YW1wbGVzOlxuICAgIC8vICAgZnVuY3Rpb24gKCkgeyDigKYgfVxuICAgIC8vICAgZnVuY3Rpb24gbmFtZSgpIHsg4oCmIH1cbiAgICAvLyAgIGZ1bmN0aW9uIChhLCBiKSB7IOKApiB9XG4gICAgLy8gICBmdW5jdGlvbiBuYW1lKGEsIGIpIHsg4oCmIH1cbiAgICB2YXIgcmVndWxhckZ1bmN0aW9uID0gL15mdW5jdGlvblxccypbXntdK3t8fSQvZztcblxuICAgIC8vIEV4YW1wbGVzOlxuICAgIC8vICAgKCkgPT4geyDigKYgfVxuICAgIC8vICAgKGEsIGIpID0+IHsg4oCmIH1cbiAgICAvLyAgIF8gPT4geyDigKYgfVxuICAgIHZhciBhcnJvd0Z1bmN0aW9uID0gL14oX3xcXChcXHd8W149Pl0rXFwpKVxccz0+XFxze3x9JC9nO1xuXG4gICAgY29kZSA9IGNvZGUudG9TdHJpbmcoKTtcbiAgICBjb2RlID0gY29kZS5yZXBsYWNlKFxuICAgICAgY29kZS5pbmRleE9mKCdmdW5jdGlvbicpID09PSAwID8gcmVndWxhckZ1bmN0aW9uIDogYXJyb3dGdW5jdGlvbixcbiAgICAnJyk7XG4gIH1cblxuICByZXR1cm4gY29kZTtcbn07XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gYXNzZXJ0O1xuXG5mdW5jdGlvbiBhc3NlcnQodmFsLCBtc2cpIHtcbiAgaWYgKCF2YWwpXG4gICAgdGhyb3cgbmV3IEVycm9yKG1zZyB8fCAnQXNzZXJ0aW9uIGZhaWxlZCcpO1xufVxuXG5hc3NlcnQuZXF1YWwgPSBmdW5jdGlvbiBhc3NlcnRFcXVhbChsLCByLCBtc2cpIHtcbiAgaWYgKGwgIT0gcilcbiAgICB0aHJvdyBuZXcgRXJyb3IobXNnIHx8ICgnQXNzZXJ0aW9uIGZhaWxlZDogJyArIGwgKyAnICE9ICcgKyByKSk7XG59O1xuIl19
;
  return module.exports ||
      exports.BEMHTML;
}({}, {});
/// -------------------------------------
/// --------- BEM-XJST Runtime End ------
/// -------------------------------------

var api = new BEMHTML({});
/// -------------------------------------
/// ------ BEM-XJST User-code Start -----
/// -------------------------------------
api.compile(function(match, block, elem, mod, elemMod, oninit, xjstOptions, wrap, replace, extend, mode, def, content, appendContent, prependContent, attrs, addAttrs, js, addJs, mix, addMix, mods, addMods, addElemMods, elemMods, tag, cls, bem, local, applyCtx, applyNext, apply) {
/* begin: C:\projects\devcon-demo\Todo\Bem\desktop.blocks\todo-list\todo-list.bemhtml.js */
﻿block('todo-list')(
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
/* end: C:\projects\devcon-demo\Todo\Bem\desktop.blocks\todo-list\todo-list.bemhtml.js */
oninit(function(exports, context) {
    var BEMContext = exports.BEMContext || context.BEMContext;
    // Provides third-party libraries from different modular systems
    BEMContext.prototype.require = function(lib) {
       return __bem_xjst_libs__[lib];
    };
});;
});
api.exportApply(exports);
/// -------------------------------------
/// ------ BEM-XJST User-code End -------
/// -------------------------------------


        return exports;
    };

    

    var defineAsGlobal = true;

    // Provide with CommonJS
    if (typeof module === 'object' && typeof module.exports === 'object') {
        exports['BEMHTML'] = buildBemXjst({
    
}
);
        defineAsGlobal = false;
    }

    // Provide to YModules
    if (typeof modules === 'object') {
        modules.define(
            'BEMHTML',
            [],
            function(
                provide
                
                ) {
                    provide(buildBemXjst({
    
}
));
                }
            );

        defineAsGlobal = false;
    }

    // Provide to global scope
    if (defineAsGlobal) {
        BEMHTML = buildBemXjst({
    
}
);
        global['BEMHTML'] = BEMHTML;
    }
})(typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : this);
