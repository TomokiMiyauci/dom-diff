// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import { AttributeTarget, ChildData, EventHandlerTarget } from "./target.ts";
import { replaceWith } from "./utils.ts";
import { CharacterDataLike, ElementLike } from "./types.ts";

export const eventHandlerSync = {
  add: (node: Node, target: EventHandlerTarget): void => {
    Reflect.set(node, target.name, target.handler);
  },
  delete: (node: Node, target: EventHandlerTarget): void => {
    Reflect.set(node, target.name, null);
  },
  substitute: (node: Node, { to }: { to: EventHandlerTarget }): void => {
    Reflect.set(node, to.name, to.handler);
  },
};

export const attributeSync = {
  add(node: Node | ElementLike, data: AttributeTarget) {
    if ("setAttribute" in node) {
      node.setAttribute(data.name, data.value);
      return;
    }

    throw new Error("target node is not element");
  },
  delete: (node: Node | ElementLike, target: AttributeTarget) => {
    if ("removeAttribute" in node) {
      node.removeAttribute(target.name);
      return;
    }

    throw new Error("target node is not element");
  },
  substitute(node: Node | ElementLike, data: { to: AttributeTarget }) {
    if ("setAttribute" in node) {
      node.setAttribute(data.to.name, data.to.value);
      return;
    }

    throw new Error("target node is not element");
  },
};

export const characterDataSync = {
  substitute: (
    node: Node | CharacterDataLike,
    data: { from: string; to: string },
  ) => {
    if ("data" in node) {
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
    const child = node.childNodes[data.pos];

    if (!child) throw new Error("fail to remove target node");

    child.remove();
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
};
