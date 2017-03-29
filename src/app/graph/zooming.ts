export function Zooming() {
  return new ZoomingClass(this);
}

declare const $: any;
declare const Hammer: any;

class ZoomingClass {

  private static ZOOM_FACTOR = 1.05;
  private static ZOOM_DELAY = 45;

  private cy: any;
  private container: HTMLElement;

  private zoomDiv: HTMLElement;
  private zoomIn: HTMLElement;
  private zoomOut: HTMLElement;
  private reset: HTMLElement;
  private slider: HTMLElement;
  private sliderBackground: HTMLElement;
  private sliderHandle: HTMLElement;
  private noZoomTick: HTMLElement;

  private static createElement(id: string) {
    const div = document.createElement('div');

    div.id = id;

    return div;
  }

  private static createIconElement(id: string, icon: string): HTMLElement {
    const div = document.createElement('div');
    const i = document.createElement('i');

    i.className = 'material-icons';
    i.innerText = icon;

    div.id = id;
    div.appendChild(i);

    return div;
  }

  constructor(cy: any) {
    this.cy = cy;
    this.container = cy.container();

    const $win = $(window);
    let sliding = false;

    this.zoomDiv = ZoomingClass.createElement('cy-zoom');
    this.zoomIn = ZoomingClass.createIconElement('cy-zoom-in', 'add');
    this.zoomOut = ZoomingClass.createIconElement('cy-zoom-out', 'remove');
    this.reset = ZoomingClass.createIconElement('cy-zoom-reset', 'zoom_out_map');
    this.slider = ZoomingClass.createElement('cy-zoom-slider');
    this.sliderBackground = ZoomingClass.createElement('cy-zoom-slider-background');
    this.sliderHandle = ZoomingClass.createElement('cy-zoom-slider-handle');
    this.noZoomTick = ZoomingClass.createElement('cy-zoom-no-zoom-tick');

    this.slider.appendChild(this.sliderBackground);
    this.slider.appendChild(this.sliderHandle);
    this.slider.appendChild(this.noZoomTick);

    this.zoomDiv.appendChild(this.reset);
    this.zoomDiv.appendChild(this.zoomIn);
    this.zoomDiv.appendChild(this.zoomOut);
    this.zoomDiv.appendChild(this.slider);

    this.container.appendChild(this.zoomDiv);

    let zooming = false;

    const sliderPadding = 2;

    const setSliderFromMouse = (evt, handleOffset) => {
      if (handleOffset === undefined) {
        handleOffset = 0;
      }

      const min = sliderPadding;
      const max = $(this.slider).height() - $(this.sliderHandle).height() - 2 * sliderPadding;
      let top = evt.pageY - $(this.slider).offset().top - handleOffset;

      // constrain to slider bounds
      if (top < min) {
        top = min;
      }
      if (top > max) {
        top = max;
      }

      const percent = 1 - (top - min) / ( max - min );

      // move the handle
      $(this.sliderHandle).css('top', top);

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

      this.zoomTo(z);
    };

    let sliderMdownHandler;
    $(this.sliderHandle).bind('mousedown', sliderMdownHandler = (mdEvt) => {
      const handleOffset = mdEvt.target === $(this.sliderHandle)[0] ? mdEvt.offsetY : 0;
      sliding = true;
      zooming = true;
      $(this.sliderHandle).addClass('active');

      let lastMove = 0;
      $win.bind('mousemove', (mmEvt) => {
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
      $win.bind('mouseup', () => {
        sliding = false;

        $(this.sliderHandle).removeClass('active');
        zooming = false;
      });

      return false;
    });

    $(this.slider).bind('mousedown', (e) => {
      if (e.target !== $(this.sliderHandle)[0]) {
        sliderMdownHandler(e);
        setSliderFromMouse(e, undefined);
      }
    });

    const positionSliderFromZoom = () => {
      const z = cy.zoom();
      const zmin = cy.minZoom();
      const zmax = cy.maxZoom();

      // assume (zoom = zmax ^ p) where p ranges on (x, 1) with x negative
      const x = Math.log(zmin) / Math.log(zmax);
      const p = Math.log(z) / Math.log(zmax);
      const percent = 1 - (p - x) / (1 - x); // the 1- bit at the front b/c up is in the -ve y direction

      const min = sliderPadding;
      const max = $(this.slider).height() - $(this.sliderHandle).height() - 2 * sliderPadding;
      let top = percent * ( max - min );

      // constrain to slider bounds
      if (top < min) {
        top = min;
      }
      if (top > max) {
        top = max;
      }

      // move the handle
      $(this.sliderHandle).css('top', top);
    };

    positionSliderFromZoom();

    cy.on('zoom', () => {
      if (!sliding) {
        positionSliderFromZoom();
      }
    });


    const z = 1;
    const zmin = cy.minZoom();
    const zmax = cy.maxZoom();

    // assume (zoom = zmax ^ p) where p ranges on (x, 1) with x negative
    const x = Math.log(zmin) / Math.log(zmax);
    const p = Math.log(z) / Math.log(zmax);
    const percent = 1 - (p - x) / (1 - x); // the 1- bit at the front b/c up is in the -ve y direction

    if (percent > 1 || percent < 0) {
      $(this.noZoomTick).hide();
      return;
    }

    const min = sliderPadding;
    const max = $(this.slider).height() - $(this.sliderHandle).height() - 2 * sliderPadding;
    let top = percent * ( max - min );

    // constrain to slider bounds
    if (top < min) {
      top = min;
    }
    if (top > max) {
      top = max;
    }

    $(this.noZoomTick).css('top', top);


    let zoomInterval;

    this.zoomIn.onmousedown = e => e.stopPropagation();
    this.zoomOut.onmousedown = e => e.stopPropagation();
    this.reset.onmousedown = e => e.stopPropagation();

    new Hammer(this.zoomIn).on('press tap', e => {
      const zoomFunction = () => this.zoomTo(cy.zoom() * ZoomingClass.ZOOM_FACTOR);

      zoomFunction();

      if (e.type === 'press') {
        zooming = true;
        zoomInterval = setInterval(zoomFunction, ZoomingClass.ZOOM_DELAY);
      }
    });

    new Hammer(this.zoomIn).on('pressup panend', () => {
      clearInterval(zoomInterval);
      zooming = false;
    });

    new Hammer(this.zoomOut).on('press tap', e => {
      const zoomFunction = () => this.zoomTo(cy.zoom() / ZoomingClass.ZOOM_FACTOR);

      zoomFunction();

      if (e.type === 'press') {
        zooming = true;
        zoomInterval = setInterval(zoomFunction, ZoomingClass.ZOOM_DELAY);
      }
    });

    new Hammer(this.zoomOut).on('pressup panend', () => {
      clearInterval(zoomInterval);
      zooming = false;
    });

    new Hammer(this.reset).on('press tap', () => {
      if (cy.elements().size() === 0) {
        cy.reset();
      } else {
        cy.fit();
      }
    });
  }

  private zoomTo(newZoom: number) {
    newZoom = Math.min(Math.max(newZoom, this.cy.minZoom()), this.cy.maxZoom());

    if (newZoom !== this.cy.zoom()) {
      this.cy.zoom({
        level: newZoom,
        renderedPosition: {x: this.container.offsetWidth / 2, y: this.container.offsetHeight / 2}
      });
    }
  }
}
