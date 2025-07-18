export const EVENT_TYPES = {
    scroll: "scroll",
    keydown: "keydown",
    click: "click",
    wheel: "wheel",
} as const satisfies Partial<{ [key in keyof HTMLElementEventMap]: key }>;
