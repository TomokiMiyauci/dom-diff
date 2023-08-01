// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import { AttributeTarget, ChildData, EventHandlerTarget } from "./target.ts";
import { replaceWith } from "./utils.ts";
import { CharacterDataLike, ElementLike } from "./types.ts";

export interface AddSync<T, N = Node> {
  add: (node: N, data: T) => void;
}

export interface DeleteSync<T, N = Node> {
  delete: (node: N, data: T) => void;
}

export interface SubstituteSync<T, N = Node> {
  substitute: (node: N, to: T, from: T) => void;
}

export interface MoveSync<N = Node> {
  move: (node: N, to: number, from: number) => void;
}

export interface EditSync<T, N = Node>
  extends AddSync<T, N>, DeleteSync<T, N>, SubstituteSync<T, N> {}

export const eventHandlerSync: EditSync<EventHandlerTarget> = {
  add: (node, target): void => {
    Reflect.set(node, target.name, target.handler);
  },
  delete: (node, target): void => {
    Reflect.set(node, target.name, null);
  },
  substitute: (node, to): void => {
    Reflect.set(node, to.name, to.handler);
  },
};

export const attributeSync: EditSync<AttributeTarget, Node | ElementLike> = {
  add(node, data) {
    if ("setAttribute" in node) {
      node.setAttribute(data.name, data.value);
      return;
    }

    throw new Error("target node is not element");
  },
  delete: (node, target) => {
    if ("removeAttribute" in node) {
      node.removeAttribute(target.name);
      return;
    }

    throw new Error("target node is not element");
  },
  substitute(node, to) {
    if ("setAttribute" in node) {
      node.setAttribute(to.name, to.value);
      return;
    }

    throw new Error("target node is not element");
  },
};

export const characterDataSync: SubstituteSync<
  string,
  Node | CharacterDataLike
> = {
  substitute: (node, to) => {
    if ("data" in node) {
      node.data = to;
      return;
    }
  },
};

export const nodeSync: SubstituteSync<Node> = {
  substitute: (target, to) => {
    replaceWith(to, target);
  },
};

export const childrenSync:
  & AddSync<ChildData>
  & DeleteSync<ChildData>
  & MoveSync = {
    add: (node, data): void => {
      const toPos = node.childNodes[data.pos];

      node.insertBefore(data.node, toPos ?? null);
    },
    delete: (node, data): void => {
      const child = node.childNodes[data.pos];

      if (!child) throw new Error("fail to remove target node");

      child.remove();
    },
    move(parent, to, from): void {
      const sourceNode = parent.childNodes[from];
      const targetNode = parent.childNodes[to];
      const isLeft2Right = from < to;

      if (isLeft2Right) {
        parent.insertBefore(sourceNode, targetNode.nextSibling);
        return;
      }

      parent.insertBefore(sourceNode, targetNode);
    },
  };
