import 'jest-canvas-mock';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global['CSS'] = null;

const mock = () => {
    let storage = {};
    return {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        getItem: key => key in storage ? storage[key] : null,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        setItem: (key, value) => storage[key] = value || '',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        removeItem: key => delete storage[key],
        clear: () => storage = {}
    };
};

Object.defineProperty(window, 'localStorage', { value: mock() });
Object.defineProperty(window, 'sessionStorage', { value: mock() });
Object.defineProperty(document, 'doctype', {
    value: '<!DOCTYPE html>'
});
Object.defineProperty(window, 'getComputedStyle', {
    value: () => ({
        display: 'none',
        appearance: ['-webkit-appearance']
    })
});
/**
 * ISSUE: https://github.com/angular/material2/issues/7101
 * Workaround for JSDOM missing transform property
 */
Object.defineProperty(document.body.style, 'transform', {
    value: () => ({
        enumerable: true,
        configurable: true
    })
});
