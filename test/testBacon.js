var should = require('should');
var sinon = require('sinon');
/*global describe:true*/
/*global it:true*/
/*global before:true*/
/*global after:true*/
/*global sinon:true*/

/*jshint esnext: true */

var Bacon = function() {};

Bacon.prototype.moar = function() {
	console.log('CONSOLELOG:returning moar bacon');
	return 'moar bacon';
};

Bacon.prototype.stub = function() {
	console.log('CONSOLELOG:returning bacon'); // Note log should be surpressed due to stub
	return 'bacon';
};

describe('Test Bacon', function() {
	describe('moar()', function() {

		it('should return moar bacon', function() {
			var b = new Bacon();
			b.moar().should.equal('moar bacon');
		});
	});

	describe('stub()', function() {
		before(function () {
        	sinon.stub(Bacon.prototype,"stub").withArgs().returns("stubbed bacon");
    	});
		
		it('should return stubbed bacon', function() {
			var b = new Bacon();
			b.stub().should.equal("stubbed bacon");
		});

		after(function () { Bacon.prototype.stub.restore(); });

	});

});