"use client";

// Fix for React DOM removeChild/insertBefore crash caused by Google Translate or browser translation extensions.
// Google Translate wraps text nodes in <font> tags. When React attempts to unmount or reconcile
// those text nodes, parentNode.removeChild(child) fails because child.parentNode is now the <font> tag
// or has been removed from its original React parent, throwing:
// "NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node."
// or "Cannot read properties of null (reading 'removeChild')"
if (typeof window !== "undefined" && typeof Node !== "undefined" && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child && child.parentNode !== this) {
      if (child.parentNode) {
        return child.parentNode.removeChild(child);
      }
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (referenceNode.parentNode) {
        return referenceNode.parentNode.insertBefore(newNode, referenceNode);
      }
      return this.appendChild(newNode);
    }
    return originalInsertBefore.apply(this, arguments);
  };
}

export default function GoogleTranslateDomGuard() {
  return null;
}
