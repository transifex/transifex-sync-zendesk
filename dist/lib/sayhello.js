'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sayHello = sayHello;
function sayHello() {
  var currentUser = this.currentUser().name();
  this.switchTo('hello', {
    username: currentUser
  });
};
