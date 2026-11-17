"use client";

// Google Translate must keep working, but it must not break React.
//
// Google Translate replaces a text node with:
//   <font style="...">translated text</font>
// React still believes the original text node is a direct child of the element,
// so its removeChild / insertBefore / replaceChild calls target the wrong
// parent. The old version of this file patched those methods for EVERY node,
// which made React crash even when translation was off ("Cannot read
// properties of null (reading 'removeChild')").
//
// The patch below only steps in for the exact Google Translate <font> wrapper
// case. Every other DOM operation uses the native implementation, so React's
// bookkeeping stays intact and normal navigation keeps working.

if (
  typeof window !== "undefined" &&
  typeof Node !== "undefined" &&
  Node.prototype &&
  !Node.prototype.__gtReactGuardInstalled
) {
  const getTranslateWrapper = (child, expectedParent) => {
    if (!child || !expectedParent || child.parentNode === expectedParent) {
      return null;
    }

    const actualParent = child.parentNode;
    if (
      actualParent &&
      actualParent.nodeType === 1 &&
      actualParent.nodeName === "FONT" &&
      actualParent.parentNode === expectedParent
    ) {
      return actualParent;
    }

    return null;
  };

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    const wrapper = getTranslateWrapper(child, this);
    if (wrapper) return originalRemoveChild.call(this, wrapper);
    return originalRemoveChild.call(this, child);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    const wrapper = getTranslateWrapper(referenceNode, this);
    if (wrapper) return originalInsertBefore.call(this, newNode, wrapper);
    return originalInsertBefore.call(this, newNode, referenceNode);
  };

  const originalReplaceChild = Node.prototype.replaceChild;
  Node.prototype.replaceChild = function (newChild, oldChild) {
    const wrapper = getTranslateWrapper(oldChild, this);
    if (wrapper) return originalReplaceChild.call(this, newChild, wrapper);
    return originalReplaceChild.call(this, newChild, oldChild);
  };

  Node.prototype.__gtReactGuardInstalled = true;
}

export default function GoogleTranslateDomGuard() {
  return null;
}
