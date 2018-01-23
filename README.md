Short and simple pup sub module

### Features
* wildcards event string specs
* async subscribers (see `publish` comment)

### Syopsis

* `subscribe(topic, subscriber)`
   * Listen for message in sent to `topic`; upon receipt execute `subscriber` with message
* `unsubscribe(topics, subscriber)`
   * Stop listening for messages sent to `topics` bound to `subscriber`; or
   * Stop listening for messages sent to `topics` bound to any subscriber (`!subscriber`)
   * Stop listening for messages sent to all `topics` bound to any subscribers (`topic === '*' && !subscriber`)
* `publish(topics, message)`
   * Send `message` to `topics`

#### `topics` parameter
May be:
* A string
   * Affects matching subscription, if any.
* A string containing `*` as wildcard(s)
   * Affects all matching _subscriptions_ (subscribed topic strings).
   * Thus `'*'` matches all topics, `'A*y'` matches topics `Any` and `Aunty`, _etc._
   * To match actual occurances of `*` in topic string, escape with `\*`.
      * Don't forget to escape the backslash in JavaScript string literals!
      * Thus `'abc\\*xyz'` matches topic string `abc*xyz` _only._
* A `RegExp`
   * Affects all matching subscriptions.
   * Surround with `^` and `$` to match to whole topic strings.

### Examples

```javascript
var pubsubstar = require('pubsubstar');
pubsubstar.subscribe('test', function(arg) { console.log('test(' + arg + ')'); return 7; });
var results = pubsubstar.publish('test', 3); // logs: "test(3)"
console.log(results) // logs: "[7]"
```

Mix in to your own objects:
```javascript
var myObject = {...};
Object.assign(myObject, require('pubsubstar'));
myObject.subscribe(...);
myObject.publish(...);

var MyClass = function() {}
Object.assign(MyClass.prototype, require('pubsubstar'));
var myInstance = new MyClass();
myInstance.subscribe(...);
myInstance.publish(...);
```

Arbitrary context:
```javascript
var api = {...};
pubsubstar.subscribe.call(api, ...);
pubsubstar.publish.call(api, ...);
```
