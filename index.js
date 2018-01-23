/**
 * pubsubstar v1.0.2
 * https://github.com/joneit/pubsubstar.git
 * Created by joneit on 8/13/17.
 */

/**
 * @module
 * @name pubsubstar
 * @desc Each calling context has its own distinct subscription namespace.
 *
 * 1. This object can serve as a global subscription context:
 * ```js
 * pubsubstar.subscribe(...);
 * ```
 * 2. Mix this object into your own object for a local subscription context:
 * ```js
 * Object.assign(myObj, pubsubstar);
 * myObj.subscribe(...);
 * ```
 * 3. Call each method with `.call` to specify a precise subscription context:
 * ```js
 * pubsubstar.subscribe.call(myObj, ...);
 * ```
 */


'use strict';


module.exports = {

    /**
     * @name subscribe
     * @memberOf module:pubsubstar
     * @summary Binds `subscriber` to `topic`.
     * @desc Multiple subscribers may be bound in consecutive calls.
     * All bound subscribers will be called when {@link module:pubsubstar#publish} is called with the same topic string.
     * @param {string} topic - Topic to subscribe `subscriber` to.
     * @param {function} subscriber
     */
    subscribe: function (topic, subscriber) {
        if (typeof topic !== 'string') {
            throw new TypeError('Expected topic to be a string.');
        }

        if (typeof subscriber !== 'function') {
            throw new TypeError('Expected subscriber to be a function.');
        }

        /**
         * @name subscriptions
         * @memberOf module:pubsubstar
         * @private
         * @type {Object}
         * @summary Subscriptions namespace
         * @desc Hash of subscribers by topic.
         * There are distinct "namespaces" for each context.
         * Created on the context when needed.
         */
        if (!this._pubsub) {
            Object.defineProperty(this, '_pubsub', {
                enumerable: false, // so Object.assign won't mix it into a local context
                value: Object.create(null)
            });
        }

        var namespace = this._pubsub,
            subscribers = namespace[topic] || (namespace[topic] = []),
            subscriberNotFound = subscribers.indexOf(subscriber) < 0;

        if (subscriberNotFound) {
            subscribers.push(subscriber);
        }
    },

    /**
     * Unsubscribe `subscriber` (or all subscribers) from `topic` (or from all topics).
     * @param {string|RegExp} topic - Topic to unsubscribe `subscriber` from.
     * To match multiple topics, include `*` wildcard(s) or specify a `RegExp`.
     * It is recommended that your regex patterns begin with `^` and end with `$` to match whole topic strings.
     * @param {function} [subscriber] - If not given, unsubscribes all subscribers from all specified `topics`.
     */
    unsubscribe: function (topics, subscriber) {
        forEachTopic.call(this, topics, function (subscribers, topic, subscriptions) {
            if (subscriber) {
                var subscriberIndex = subscribers.indexOf(subscriber),
                    subscriberFound = subscriberIndex >= 0;

                if (subscriberFound) {
                    subscribers.splice(subscriberIndex, 1); // remove subscriber from each topic wherein found
                }
            } else {
                delete subscriptions[topic]; // unsubscribe all subscribers from each topic
            }
        });
    },

    /**
     * Publishes `message` to the given `topic`, invoking any subscribers bound to `topic` by {@link DataSourceBase#subscribe}.
     *
     * ### Results
     * @example
     * dataModel.publish('set-sorts', sorts); // results discarded
     * @example <caption>Synchronous subscribers returning values</caption>
     * var results = dataModel.publish('get-sorts'); // array of results from all subscribers
     * @example <caption>Asynchronous subscribers (return promises)</caption>
     * Promise.all(publish('get-sorts')).then(function(resultsArray) { ... });
     * @param {string|RegExp} topic - Topic to publish to.
     * To match multiple topics, include `*` wildcard(s) or specify a `RegExp`.
     * @param {*} [message]
     * @returns {Array} Results of calls to all bound subscribers.
     *
     * ### About returned results
     *
     * Any topic can return useful information but in practice only certain topics do so.
     * These are typically named starting with `get-`.
     *
     * Results are always returned in an array, one result from each subscriber.
     * The length of the returned array represents the number of subscribers called.
     * Typically there will be a single subscriber, in which case `publish` will return a single-element array.
     * When there are multiple subscribers, the array will hold multiple results.
     * Although an array, the order of the results should be considered undefined;
     * if you need to know which of several subscribers generated a particular
     * result, the subscriber should put identifying information in the result.
     *
     * ### Asynchronous subscribers
     * If your subscribers are asynch, a very useful pattern is to have them return promises. `publish` will then return
     * an array of promises, which in turn can be used to determine when all the subscribers have responded by calling
     * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all Promise.all}.
     * For example, to wait for all the subscribers to complete and obtain the final results array:
     * ```js
     * Promise.all(publish(topic, data))
     *     .catch(function(reason) {
     *         // If you get here it means at least one of the subscribers failed,
     *         // having called `reject` or having thrown an error.
     *     })
     *     .then(function(resultsArray) {
     *         // If you get here it means all the promises succeeded, all having called `resolve` with some value.
     *         // The results (i.e., all the resolve values) are in the parameter which is an array.
     *     });
     * ```
     * Caveat: Only call Promise.all on the results when the subscribers return promises.
     * Although these would typically be async subscribers, they can include synchronous subscribers as well so long as
     * they too return promises, although in those cases they would be pre-resolved promises (see
     * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve Promise.resolve()}).
     * This pattern accommodates a mixture of sync and async subscribers all subscribed to the same topic.
     */
    publish: function(topics, message) {
        var results = [];

        forEachTopic.call(this, topics, function(subscribers, topic, subscriptions) {
            for (var i = 0; i < subscribers.length; ++i) {
                results.push(subscribers[i].call(this, message));
            }
        });

        return results;
    }

};


// `mixin` offers alternative method names
Object.defineProperty(module.exports, 'mixin', {
    enumerable: false, // so not itself mixed in
    value: {
        on: module.exports.subscribe,
        off: module.exports.unsubscribe,
        trigger: module.exports.publish
    }
});


function forEachTopic(topics, fn) {
    var namespace = this._pubsub;

    if (!namespace) {
        return;
    }

    // make sure `topics` is a regex
    if (!(topics instanceof RegExp)) {
        if (typeof topics !== 'string') {
            throw new TypeError('Expected topic to be a string (with optional "*" wildcards) or a regex.');
        }
        topics = new RegExp('^' + topics.replace(/([^\\])\*+/g, '$1.*').replace(/^\*/, '.*') + '$');
    }

    for (var topic in namespace) {
        if (topics.test(topic) && namespace[topic]) {
            fn.call(this, namespace[topic], topic, namespace);
        }
    }
}
