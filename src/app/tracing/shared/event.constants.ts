export const EVENT_TYPES = {
    scroll: "scroll",
    keydown: "keydown",
    keyup: "keyup",
    click: "click",
    wheel: "wheel",
    mousedown: "mousedown",
    touchstart: "touchstart",
} as const satisfies Partial<{ [key in keyof HTMLElementEventMap]: key }>;
