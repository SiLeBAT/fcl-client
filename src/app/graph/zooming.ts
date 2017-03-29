export function Zooming() {
  return new ZoomingClass(this);
}

declare const $: any;
declare const Hammer: any;

class ZoomingClass {

  private static ZOOM_FACTOR = 1.05;
  private static ZOOM_DELAY = 45;

  private static createElement(id: string) {
    const div = document.createElement('div');

    div.id = id;

    return div;
  }

  private static createIconButton(id: string, icon: string): HTMLElement {
    const div = document.createElement('div');
    const i = document.createElement('i');

    i.className = 'material-icons';
    i.innerText = icon;

    div.id = id;
    div.appendChild(i);

    return div;
  }

  constructor(cy: any) {
    const container: HTMLElement = cy.container();
    const $win = $(window);
    let sliding = false;

    const zoomDiv = document.createElement('div');

    zoomDiv.id = 'cy-zoom';
    container.appendChild(zoomDiv);

    const zoomIn = ZoomingClass.createIconButton('cy-zoom-in', 'add');
    zoomDiv.appendChild(zoomIn);

    const zoomOut = ZoomingClass.createIconButton('cy-zoom-out', 'remove');
    zoomDiv.appendChild(zoomOut);

    const reset = ZoomingClass.createIconButton('cy-zoom-reset', 'zoom_out_map');
    zoomDiv.appendChild(reset);

    const slider = ZoomingClass.createElement('cy-zoom-slider');
    zoomDiv.appendChild(slider);

    const sliderBackground = ZoomingClass.createElement('cy-zoom-slider-background');
    slider.appendChild(sliderBackground);

    const sliderHandle = ZoomingClass.createElement('cy-zoom-slider-handle');
    slider.appendChild(sliderHandle);

    const noZoomTick = ZoomingClass.createElement('cy-zoom-no-zoom-tick');
    slider.appendChild(noZoomTick);

    let zooming = false;

    function zoomTo(newZoom: number) {
      newZoom = Math.min(Math.max(newZoom, cy.minZoom()), cy.maxZoom());

      if (newZoom !== cy.zoom()) {
        cy.zoom({
          level: newZoom,
          renderedPosition: {x: container.offsetWidth / 2, y: container.offsetHeight / 2}
        });
      }
    }

    $(slider).bind('mousedown', function () {
      return false; // so we don't pan close to the slider handle
    });

    const sliderPadding = 2;

    function setSliderFromMouse(evt, handleOffset) {
      if (handleOffset === undefined) {
        handleOffset = 0;
      }

      const min = sliderPadding;
      const max = $(slider).height() - $(sliderHandle).height() - 2 * sliderPadding;
      let top = evt.pageY - $(slider).offset().top - handleOffset;

      // constrain to slider bounds
      if (top < min) {
        top = min;
      }
      if (top > max) {
        top = max;
      }

      const percent = 1 - (top - min) / ( max - min );

      // move the handle
      $(sliderHandle).css('top', top);

      const zmin = cy.minZoom();
      const zmax = cy.maxZoom();

      // assume (zoom = zmax ^ p) where p ranges on (x, 1) with x negative
      const x = Math.log(zmin) / Math.log(zmax);
      const p = (1 - x) * percent + x;

      // change the zoom level
      let z = Math.pow(zmax, p);

      // bound the zoom value in case of floating pt rounding error
      if (z < zmin) {
        z = zmin;
      } else if (z > zmax) {
        z = zmax;
      }

      zoomTo(z);
    }

    let sliderMdownHandler;
    $(sliderHandle).bind('mousedown', sliderMdownHandler = function (mdEvt) {
      const handleOffset = mdEvt.target === $(sliderHandle)[0] ? mdEvt.offsetY : 0;
      sliding = true;
      zooming = true;
      $(sliderHandle).addClass('active');

      let lastMove = 0;
      $win.bind('mousemove', function (mmEvt) {
        if (sliding) {
          const now = +new Date;

          // throttle the zooms every 10 ms so we don't call zoom too often and cause lag
          if (now > lastMove + 10) {
            lastMove = now;
          } else {
            return false;
          }

          setSliderFromMouse(mmEvt, handleOffset);

          return false;
        }
      });

      // unbind when
      $win.bind('mouseup', function () {
        sliding = false;

        $(sliderHandle).removeClass('active');
        zooming = false;
      });

      return false;
    });

    $(slider).bind('mousedown', function (e) {
      if (e.target !== $(sliderHandle)[0]) {
        sliderMdownHandler(e);
        setSliderFromMouse(e, undefined);
      }
    });

    function positionSliderFromZoom() {
      const z = cy.zoom();
      const zmin = cy.minZoom();
      const zmax = cy.maxZoom();

      // assume (zoom = zmax ^ p) where p ranges on (x, 1) with x negative
      const x = Math.log(zmin) / Math.log(zmax);
      const p = Math.log(z) / Math.log(zmax);
      const percent = 1 - (p - x) / (1 - x); // the 1- bit at the front b/c up is in the -ve y direction

      const min = sliderPadding;
      const max = $(slider).height() - $(sliderHandle).height() - 2 * sliderPadding;
      let top = percent * ( max - min );

      // constrain to slider bounds
      if (top < min) {
        top = min;
      }
      if (top > max) {
        top = max;
      }

      // move the handle
      $(sliderHandle).css('top', top);
    }

    positionSliderFromZoom();

    cy.on('zoom', function () {
      if (!sliding) {
        positionSliderFromZoom();
      }
    });

    // set the position of the zoom=1 tick
    (function () {
      const z = 1;
      const zmin = cy.minZoom();
      const zmax = cy.maxZoom();

      // assume (zoom = zmax ^ p) where p ranges on (x, 1) with x negative
      const x = Math.log(zmin) / Math.log(zmax);
      const p = Math.log(z) / Math.log(zmax);
      const percent = 1 - (p - x) / (1 - x); // the 1- bit at the front b/c up is in the -ve y direction

      if (percent > 1 || percent < 0) {
        $(noZoomTick).hide();
        return;
      }

      const min = sliderPadding;
      const max = $(slider).height() - $(sliderHandle).height() - 2 * sliderPadding;
      let top = percent * ( max - min );

      // constrain to slider bounds
      if (top < min) {
        top = min;
      }
      if (top > max) {
        top = max;
      }

      $(noZoomTick).css('top', top);
    })();

    let zoomInterval;

    zoomIn.onmousedown = e => e.stopPropagation();
    zoomOut.onmousedown = e => e.stopPropagation();
    reset.onmousedown = e => e.stopPropagation();

    new Hammer(zoomIn).on('press tap', e => {
      const zoomFunction = () => zoomTo(cy.zoom() * ZoomingClass.ZOOM_FACTOR);

      zoomFunction();

      if (e.type === 'press') {
        zooming = true;
        zoomInterval = setInterval(zoomFunction, ZoomingClass.ZOOM_DELAY);
      }
    });

    new Hammer(zoomIn).on('pressup panend', () => {
      clearInterval(zoomInterval);
      zooming = false;
    });

    new Hammer(zoomOut).on('press tap', e => {
      const zoomFunction = () => zoomTo(cy.zoom() / ZoomingClass.ZOOM_FACTOR);

      zoomFunction();

      if (e.type === 'press') {
        zooming = true;
        zoomInterval = setInterval(zoomFunction, ZoomingClass.ZOOM_DELAY);
      }
    });

    new Hammer(zoomOut).on('pressup panend', () => {
      clearInterval(zoomInterval);
      zooming = false;
    });

    new Hammer(reset).on('press tap', () => {
      if (cy.elements().size() === 0) {
        cy.reset();
      } else {
        cy.fit();
      }
    });
  }
}
