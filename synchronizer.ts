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
  add: (node, data): void => {
    Reflect.set(node, data.name, data.handler);
  },
  delete: (node, data): void => {
    Reflect.set(node, data.name, null);
  },
  substitute: (node, to): void => {
    Reflect.set(node, to.name, to.handler);
  },
};

export const attributeSync: EditSync<AttributeTarget, Node | ElementLike> = {
  add(node, data): void {
    if ("setAttribute" in node) {
      node.setAttribute(data.name, data.value);
      return;
    }

    throw new Error("target node should be element");
  },
  delete: (node, data): void => {
    if ("removeAttribute" in node) {
      node.removeAttribute(data.name);
      return;
    }

    throw new Error("target node should be element");
  },
  substitute(node, data): void {
    if ("setAttribute" in node) {
      node.setAttribute(data.name, data.value);
      return;
    }

    throw new Error("target node should be element");
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
    delete: (parent, data): void => {
      const target = parent.childNodes[data.pos];

      if (!target) throw new Error("target node does not exist");

      target.remove();
    },
    move(parent, to, from): void {
      const sourceNode = parent.childNodes[from];

      if (!sourceNode) throw new Error("source node does not exist");

      const targetNode = parent.childNodes[to];
      const isLeft2Right = from < to;

      if (isLeft2Right) {
        if (!targetNode) throw new Error("target node does not exist");

        parent.insertBefore(sourceNode, targetNode.nextSibling);

        return;
      }

      parent.insertBefore(sourceNode, targetNode ?? null);
    },
  };
