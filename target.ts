export type EventHandlerName = `on${string}`;

export enum TargetType {
  EventHandler = "event-handler",
  Attribute = "attribute",
  CharacterData = "character-data",
  Node = "node",
  Children = "children",
}

export interface EventHandlerTarget {
  name: EventHandlerName;
  handler: unknown;
}

export interface AttributeTarget {
  name: string;
  value: string;
}

export interface ChildData {
  node: Node;
  pos: number;
}
