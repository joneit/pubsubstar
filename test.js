'use strict';

var should = require('should');
var pubsubstar = require('.');

describe('require("pubsubstar")', function() {
    it('is an object', function() {
        pubsubstar.should.be.an.Object();
    });
    describe('.subscribe', function() {
        var called = 0;
        it('is a function', function() {
            pubsubstar.should.have.a.property('subscribe').which.is.a.Function();
        });
        it('takes 2 parameters', function() {
            pubsubstar.subscribe.length.should.equal(2);
        });
        it('throws a TypeError when called with 1st parameter of wrong type', function() {
            should.throws(function() { pubsubstar.subscribe(3, function() {}); }, TypeError);
        });
        it('throws a TypeError when called with 2nd parameter of wrong type', function() {
            should.throws(function() { pubsubstar.subscribe('a', 3); }, TypeError);
        });
        it('does not throw a TypeError when called with both parameters of the expected types', function() {
            should.doesNotThrow(function() { pubsubstar.subscribe('a', function() {}) }, TypeError);
        });
    });
    describe('.publish', function() {
        it('is a function', function() {
            pubsubstar.should.have.a.property('publish').which.is.a.Function();
        });
        it('takes up to 2 parameters', function() {
            pubsubstar.publish.length.should.equal(2);
        });
        it('throws a TypeError when called with 1st parameter of wrong type', function() {
            should.throws(function() { pubsubstar.publish(3); }, TypeError);
        });
        it('does not throw a TypeError when called with 1st parameter of type string', function() {
            should.doesNotThrow(function() { pubsubstar.publish('a') }, TypeError);
        });
        it('does not throw a TypeError when called with 1st parameter of type RegExp', function() {
            should.doesNotThrow(function() { pubsubstar.publish(/a/) }, TypeError);
        });
        it('does not call a subscriber previously subscribed to different topic, returning empty array', function() {
            var called = 0;
            function spy() { called++; }
            pubsubstar.subscribe('b', spy);
            pubsubstar.publish('c').should.be.Array().and.have.length(0);
            called.should.equal(0);
        });
        it('calls a subscriber previously subscribed to same topic, returning 1-element array', function() {
            var called = 0;
            function spy() { called++; }
            pubsubstar.subscribe('c', spy);
            pubsubstar.publish('c').should.be.Array().and.have.length(1);
            called.should.equal(1);
        });
        it('calls subscriber with message', function() {
            var calledWith;
            var MESSAGE = 'yada';
            function spy(message) { calledWith = MESSAGE; }
            pubsubstar.subscribe('d', spy);
            pubsubstar.publish('d', MESSAGE);
            calledWith.should.be.equal(MESSAGE);
        });
        it('returns subscriber\'s return value in first elemnt of array', function() {
            var VALUE = 'yada';
            function spy() { return VALUE; }
            pubsubstar.subscribe('e', spy);
            pubsubstar.publish('e')[0].should.be.equal(VALUE);
        });
        it('called with 2 subscribers, calls both', function() {
            var n = 0;
            pubsubstar.subscribe('f', function() { n += 10; });
            pubsubstar.subscribe('f', function() { n += 1; });
            pubsubstar.publish('f');
            n.should.equal(11);
        });
        it('called with 2 subscribers, yields exactly those results', function() {
            pubsubstar.subscribe('g', function() { return 17; });
            pubsubstar.subscribe('g', function() { return 53; });
            var result = pubsubstar.publish('g');
            result.should.be.Array().and.have.length(2);
            result.indexOf(17).should.be.aboveOrEqual(0);
            result.indexOf(53).should.be.aboveOrEqual(0);
        });
        it('called with topics === "*" and 3 subscribers of varied topics, calls all three', function() {
            var n = 0;
            pubsubstar.subscribe('abe', function(m) { n += m * 100; });
            pubsubstar.subscribe('ape', function(m) { n += m * 10; });
            pubsubstar.subscribe('babe', function(m) { n += m * 1; });
            pubsubstar.publish('*', 3);
            n.should.equal(333);
        });
        it('called with topics === "a*e" and 3 subscribers of varied topics and 1 match, calls just that one', function() {
            var n = 0;
            pubsubstar.subscribe('abey', function(m) { n += m * 100; });
            pubsubstar.subscribe('ape', function(m) { n += m * 10; });
            pubsubstar.subscribe('babe', function(m) { n += m * 1; });
            pubsubstar.publish('a*e', 3);
            n.should.equal(30);
        });
        it('called with topics === "a*" and 3 subscribers of varied topics and 2 matches, calls just those 2', function() {
            var n = 0;
            pubsubstar.subscribe('abe', function(m) { n += m * 100; });
            pubsubstar.subscribe('ape', function(m) { n += m * 10; });
            pubsubstar.subscribe('babe', function(m) { n += m * 1; });
            pubsubstar.publish('a*', 3);
            n.should.equal(330);
        });
        it('called with topics === /a.e/ and 4 subscribers of varied topics and 3 matches, calls just those 3', function() {
            var n = 0;
            pubsubstar.subscribe('abe', function(m) { n += m * 100; });
            pubsubstar.subscribe('ape', function(m) { n += m * 10; });
            pubsubstar.subscribe('bike', function(m) { n += m * 1; });
            pubsubstar.subscribe('babe', function(m) { n += m * 1000; });
            pubsubstar.publish(/a.e/, 3);
            n.should.equal(3330);
        });
        it('called with "a\\\\*b" (escaped asterisk) and 3 subscribers of varied topics, calls the exact match only', function() {
            var n = 0;
            pubsubstar.subscribe('az', function(m) { n += m * 100; });
            pubsubstar.subscribe('amz', function(m) { n += m * 10; });
            pubsubstar.subscribe('a*z', function(m) { n += m * 1; });
            pubsubstar.publish('a\\*z', 3);
            n.should.equal(3);
        });
        it('with async subscribers (return promises)', function() {
            function spy1(message) { return new Promise(function(resolve) { setTimeout(function() { resolve(17); }, 500); }); }
            function spy2(message) { return new Promise(function(resolve) { setTimeout(function() { resolve(34); }, 1000); }); }
            pubsubstar.subscribe('h', spy1);
            pubsubstar.subscribe('h', spy2);
            return Promise.all(pubsubstar.publish('h')).should.eventually.containEql(17).and.containEql(34);
        });
    });
    describe('.unsubscribe', function() {
        it('is a function', function() {
            pubsubstar.should.have.a.property('unsubscribe').which.is.a.Function();
        });
        it('takes 2 parameters', function() {
            pubsubstar.unsubscribe.length.should.equal(2);
        });
        it('throws a TypeError when called with 1st parameter of wrong type', function() {
            should.throws(function() { pubsubstar.publish(3); }, TypeError);
        });
        it('does not throw a TypeError when called with 1st parameter of type string', function() {
            should.doesNotThrow(function() { pubsubstar.publish('a') }, TypeError);
        });
        it('does not throw a TypeError when called with 1st parameter of type RegExp', function() {
            should.doesNotThrow(function() { pubsubstar.publish(/a/) }, TypeError);
        });
        it('unsubscribes specific subscriber previously subscribed to same topic', function() {
            var called = 0;
            function spy() { called++; }
            pubsubstar.subscribe('a', spy);
            pubsubstar.publish('a');
            called.should.equal(1);
            called = 0;
            pubsubstar.unsubscribe('a', spy);
            pubsubstar.publish('a');
            called.should.equal(0);
        });
        it('does not unsbuscribe other subscriber previously subscribed to same topic', function() {
            var called1 = 0, called2 = 0;
            function spy1() { called1++; }
            function spy2() { called2++; }
            pubsubstar.subscribe('b', spy1);
            pubsubstar.subscribe('b', spy2);
            pubsubstar.publish('b');
            called1.should.equal(1);
            called2.should.equal(1);
            called1 = called2 = 0;
            pubsubstar.unsubscribe('b', spy1);
            pubsubstar.publish('b');
            called1.should.equal(0);
            called2.should.equal(1);
        });
        it('unsubscribe sans 2nd param unsubscribes all subscribers previously subscribed to same topic', function() {
            var called1 = 0, called2 = 0;
            function spy1() { called1++; }
            function spy2() { called2++; }
            pubsubstar.subscribe('c', spy1);
            pubsubstar.subscribe('c', spy2);
            pubsubstar.publish('c');
            called1.should.equal(1);
            called2.should.equal(1);
        });
        it('unsubscribe sans 2nd param does not unsubscribe subscriber previously subscribed to different topic', function() {
            var called1 = 0;
            function spy1() { called1++; }
            pubsubstar.subscribe('d', spy1);
            pubsubstar.unsubscribe('c');
            pubsubstar.publish('d');
            called1.should.equal(1);
        });
        it('unsubscribe("*", specific) unsubscribes specific subscribers previously subscribed to various topics', function() {
            var called = 0;
            function spy() { called++; }
            pubsubstar.subscribe('e', spy);
            pubsubstar.subscribe('f', spy);
            pubsubstar.unsubscribe('*', spy);
            pubsubstar.publish('e');
            pubsubstar.publish('f');
            called.should.equal(0);
        });
        it('unsubscribe("*", specific) does not unsubscribe subscribers previously subscribed to various topics with different specificities', function() {
            var called1 = 0, called2 = 0;
            function spy1() { called1++; }
            function spy2() { called2++; }
            pubsubstar.subscribe('g', spy1);
            pubsubstar.subscribe('g', spy2);
            pubsubstar.subscribe('h', spy1);
            pubsubstar.subscribe('h', spy2);
            pubsubstar.unsubscribe('*', spy1);
            pubsubstar.publish('g');
            pubsubstar.publish('h');
            called1.should.equal(0);
            called2.should.equal(2);
        });
        it('unsubscribe("*") unsubscribes all subscribers previously subscribed to various topics', function() {
            var called1 = 0, called2 = 0, called3 = 0;
            function spy1() { called1++; }
            function spy2() { called2++; }
            function spy3() { called3++; }
            pubsubstar.subscribe('i', spy1);
            pubsubstar.subscribe('i', spy2);
            pubsubstar.subscribe('j', spy3);
            pubsubstar.unsubscribe('*');
            pubsubstar.publish('i');
            pubsubstar.publish('j');
            called1.should.equal(0);
            called2.should.equal(0);
            called3.should.equal(0);
        });
    });
});