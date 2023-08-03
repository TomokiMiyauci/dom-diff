export interface EventInfo extends NormalizedAddEventListenerOptions {
  type: string;
  listener: EventListenerOrEventListenerObject;
}

export type NormalizedAddEventListenerOptions = Required<
  Omit<AddEventListenerOptions, "signal">
>;
