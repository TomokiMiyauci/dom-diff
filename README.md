# dom-diff

The real DOM diffing.

## Install

deno.land:

```ts
import * as mod from "https://deno.land/x/dom_diff/mod.ts";
```

npm:

```bash
npm i @miyauci/dom-diff
```

## Usage

Performs markup and event listener diff detection and application, which is
often done in virtual-dom.

```ts
import {
  Differ,
  EventListenerReconciler,
  MarkupReconciler,
  setupEventListeners,
} from "https://deno.land/x/dom_diff/mod.ts";

const getEventListeners = setupEventListeners();

declare const oldNode: Node;
declare const newNode: Node;
const differ = new Differ(
  new MarkupReconciler(),
  new EventListenerReconciler(getEventListeners),
);

differ.apply(oldNode, newNode);
```

The `oldNode` is updated by calculating the difference from the `newNode`.

> **Note** Normally, event listeners cannot be referenced, so `addEventListener`
> and `removeEventListener` are replaced to proxies by `setupEventListeners`.

### Reconciler

Reconciler is a structure that encapsulates difference detection and difference
application. This allows modularization of difference application.

For example, to perform event handler difference detection, use the
`EventHandlerReconciler`.

```ts
import { EventHandlerReconciler } from "https://deno.land/x/dom_diff/mod.ts";

const reconciler = new EventHandlerReconciler();
```

Various [reconciler](docs/reconciler.md) are provided.

### Built-in behavior

The built-in behavior abstracts the difference detection for `children`.

It compares each node type and detects movements, additions, deletions, and
substitutions.

For example, the following DOM:

<table>
<tr>
<td> Old </td> <td> New </td>
</tr>
<tr>
<td>

```html
<div>
  <div></div>
  <span></span>
  text1
</div>
```

</td>
<td>

```html
<div>
  text2
  <div id="0">text3</div>
  <input />
</div>
```

</td>
</tr>
</table>

The following is the result of differential application:

```ts
import { Differ } from "https://deno.land/x/dom_diff/mod.ts";

declare const oldNode: Node;
declare const newNode: Node;

new Differ().apply(oldNode, newNode);
```

<table>
<tr>
<td> Patched Old </td> <td> New </td>
</tr>
<tr>
<td>

```html
<div>
  text1
  <div></div>
  <input />
</div>
```

</td>
<td>

```html
<div>
  text2
  <div id="0">text3</div>
  <input />
</div>
```

</td>
</tr>
</table>

This result is a good representation of the default behavior.

The built-in behavior is concerned with the ordering of the Nodes.

First, each node is converted to a comparable value. This is called
[keying](#keying).

Then, it detects differences in the order of the keys.

All [reconciler](#reconciler) are executed after this.

This abstraction allows [reconciler](#reconciler) to focus only on top-level
difference detection.

### Keying

By default, `nodeName` is used as the key.

This can be changed as follows:

```ts
import { Differ } from "https://deno.land/x/dom_diff/mod.ts";

declare const oldNode: Node;
declare const newNode: Node;

new Differ().apply(oldNode, newNode, {
  keying: (node) => {
    if (node instanceof Element && node.hasAttribute("data-key")) {
      return node.getAttribute("data-key")!;
    }

    return node.nodeName;
  },
});
```

In this example, the `data-key` attribute is used as the key.

See [keying](docs/keying.md) for details.

## API

See [deno doc](https://deno.land/x/dom_diff?doc) for all APIs.

## Contributing

See [contributing](CONTRIBUTING.md).

## License

[MIT](LICENSE) © 2023 Tomoki Miyauchi
