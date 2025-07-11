export const EVENT_TYPES = {
    scroll: "scroll",
    keydown: "keydown",
    click: "click",
} as const satisfies Partial<{ [key in keyof HTMLElementEventMap]: key }>;
