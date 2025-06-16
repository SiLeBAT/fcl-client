export function isElementVisible(element: HTMLElement): boolean {
    const clientRect = element.getBoundingClientRect();
    return clientRect.height > 0 && clientRect.width > 0;
}
