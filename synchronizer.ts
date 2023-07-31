import { AttributeTarget, ChildData, EventHandlerTarget } from "./target.ts";
import { replaceWith } from "./utils.ts";

export interface Sync<T> {
  add?: (node: Node, target: T) => void;
  delete?: (node: Node, target: T) => void;
  substitute?: (node: Node, to: T, from: T) => void;
  move?: (node: Node, to: number, from: number) => void;
}

export const eventHandlerSync: Sync<EventHandlerTarget> = {
  add: (node, target) => {
    Reflect.set(node, target.name, target.handler);
  },
  delete: (node, target) => {
    Reflect.set(node, target.name, null);
  },
  substitute: (node, target) => {
    Reflect.set(node, target.name, target.handler);
  },
};

export const attributeSync = {
  add: upsertAttribute,
  delete: (node: Node, target: AttributeTarget) => {
    if (node instanceof Element) {
      node.removeAttribute(target.name);
      return;
    }

    throw new Error("target node is not element");
  },
  substitute: upsertAttribute,
};

function upsertAttribute(node: Node, target: AttributeTarget): void {
  if (node instanceof Element) {
    node.setAttribute(target.name, target.value);
    return;
  }

  throw new Error("target node is not element");
}

export const characterDataSync = {
  substitute: (node: Node, data: { from: string; to: string }) => {
    if (node instanceof CharacterData) {
      node.data = data.to;
      return;
    }
  },
};

export const nodeSync = {
  substitute: (target: Node, data: { to: Node }) => {
    replaceWith(data.to, target);
  },
};

export const childSync = {
  add: (node: Node, data: ChildData) => {
    const toPos = node.childNodes[data.pos];

    node.insertBefore(data.node, toPos ?? null);
  },
  delete: (node: Node, data: ChildData) => {
    node.childNodes[data.pos].remove();
  },
  move(parent: Node, { from, to }: { from: number; to: number }) {
    const sourceNode = parent.childNodes[from];
    const targetNode = parent.childNodes[to];
    const isLeft2Right = from < to;

    if (isLeft2Right) {
      parent.insertBefore(sourceNode, targetNode.nextSibling);
      return;
    }

    parent.insertBefore(sourceNode, targetNode);
  },
  substitute(node: Node, data: { from: ChildData; to: ChildData }) {
  },
};
