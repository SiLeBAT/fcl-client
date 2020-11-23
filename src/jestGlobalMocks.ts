import 'jest-canvas-mock';

// @ts-ignore
global['CSS'] = null;

const mock = () => {
    let storage = {};
    return {
        // @ts-ignore
        getItem: key => key in storage ? storage[key] : null,
        // @ts-ignore
        setItem: (key, value) => storage[key] = value || '',
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
    value: () => {
        return {
            display: 'none',
            appearance: ['-webkit-appearance']
        };
    }
});
/**
 * ISSUE: https://github.com/angular/material2/issues/7101
 * Workaround for JSDOM missing transform property
 */
Object.defineProperty(document.body.style, 'transform', {
    value: () => {
        return {
            enumerable: true,
            configurable: true
        };
    }
});
