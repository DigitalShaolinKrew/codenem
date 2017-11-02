/* eslint-disable */
window.raf = (function(){
  return  window.requestAnimationFrame || 
    window.webkitRequestAnimationFrame || 
    window.mozRequestAnimationFrame    || 
    window.oRequestAnimationFrame      || 
    window.msRequestAnimationFrame     || 
    function( callback, element){
    window.setTimeout(callback, 1000 / 60);
  };
})();

const events = {
  on: ( element, event, callback, capture ) => {
    !element.addEventListener && ( event = 'on' + event );
    ( element.addEventListener || element.attachEvent ).call( element, event, callback, capture );
    return callback;
  },

  off: ( element, event, callback, capture ) => {
    !element.removeEventListener && ( event = 'on' + event );
    ( element.removeEventListener || element.detachEvent ).call( element, event, callback, capture );
    return callback;
  }
};

const select = {
  one: (selector, parent) => {
    parent || (parent = document);
    return parent.querySelector(selector);
  },

  all: (selector, parent)  =>{
    parent || (parent = document);
    var selection = parent.querySelectorAll(selector);
    return  Array.prototype.slice.call(selection);
  }
}

window.dom = {
  events,
  select
};
/* eslint-enable */
