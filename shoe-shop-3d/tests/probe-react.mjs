import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';

class Element {}
class HTMLElement extends Element {}
class HTMLIFrameElement extends HTMLElement {}
class HTMLInputElement extends HTMLElement {}

globalThis.Element = Element;
globalThis.HTMLElement = HTMLElement;
globalThis.HTMLIFrameElement = HTMLIFrameElement;
globalThis.HTMLInputElement = HTMLInputElement;

const doc = {
  nodeType: 9,
  createElement: (tag) => {
    const el = Object.create(HTMLElement.prototype);
    Object.assign(el, {
      tagName: tag.toUpperCase(),
      nodeType: 1,
      style: {},
      setAttribute: () => {},
      removeAttribute: () => {},
      appendChild: () => {},
      removeChild: () => {},
      insertBefore: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      ownerDocument: doc,
    });
    return el;
  },
  createComment: () => ({ nodeType: 8 }),
  createTextNode: () => ({ nodeType: 3 }),
  addEventListener: () => {},
  removeEventListener: () => {},
  defaultView: globalThis,
};
globalThis.document = doc;
globalThis.window = globalThis;

let mounted = false;
let unmounted = false;

function TestComponent() {
  useEffect(() => {
    mounted = true;
    return () => {
      unmounted = true;
    };
  }, []);
  return React.createElement('div', null, 'Hello');
}

const rootEl = doc.createElement('div');
const root = createRoot(rootEl);
root.render(React.createElement(TestComponent));

setTimeout(() => {
  console.log('Mounted:', mounted);
  root.unmount();
  setTimeout(() => {
    console.log('Unmounted:', unmounted);
  }, 20);
}, 20);
