import {Cy} from '../graph.model';
import {Position} from '../../data.model';
import * as Hammer from 'hammerjs';

const DOM_EVENT_WHEEL = 'wheel';

const HAMMER_EVENT_PINCH_START = 'pinchstart';
const HAMMER_EVENT_PINCH_IN = 'pinchin';
const HAMMER_EVENT_PINCH_OUT = 'pinchout';
const HAMMER_EVENT_PINCH_END = 'pinchend';
const HAMMER_EVENT_PINCH_CANCEL = 'pinchcancel';

export function addCustomZoomAdapter(
  cy: Cy,
  getCurrentZoom: () => number,
  zoomTo: (zoom: number, zPos: Position) => void
): void {
  const container = cy.container();
  if (container) {
    const canvasElement = container.children.item(0)?.children.item(0);
    if (!canvasElement || !(canvasElement instanceof HTMLCanvasElement)) {
      throw new Error('Cannot add Zoom adapter, canvas element not found.');
    }

    const hammer = new Hammer.Manager(canvasElement, {
      recognizers: [[Hammer.Pinch]],
    });
    let pinchCenter: Position;
    let pinchScale: number;

    hammer.on(HAMMER_EVENT_PINCH_START, e => {
      cy.userPanningEnabled(false);

      const cyRect = container.getBoundingClientRect();

      pinchCenter = {
        x: e.center.x - cyRect.left,
        y: e.center.y - cyRect.top,
      };
      pinchScale = e.scale;
    });
    hammer.on([HAMMER_EVENT_PINCH_IN, HAMMER_EVENT_PINCH_OUT].join(' '), e => {
      zoomTo((getCurrentZoom() * e.scale) / pinchScale, {
        x: pinchCenter.x,
        y: pinchCenter.y,
      });
      pinchScale = e.scale;
    });
    hammer.on(
      [HAMMER_EVENT_PINCH_END, HAMMER_EVENT_PINCH_CANCEL].join(' '),
      () => {
        cy.userPanningEnabled(true);
      }
    );

    const wheelListener = (e: WheelEvent) => {
      zoomTo(
        getCurrentZoom() *
          Math.pow(10, e.deltaMode === 1 ? e.deltaY / -25 : e.deltaY / -250),
        {
          x: e.offsetX,
          y: e.offsetY,
        }
      );
    };

    canvasElement.addEventListener(DOM_EVENT_WHEEL, wheelListener, false);
  }
}
