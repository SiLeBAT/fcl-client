export function Zooming() {
  return new ZoomingClass(this);
}

declare const $: any;

class ZoomingClass {

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
    const options = {
      zoomFactor: 0.05, // zoom factor per zoom tick
      zoomDelay: 45, // how many ms between zoom ticks
      minZoom: 0.1, // min zoom level
      maxZoom: 10, // max zoom level
      fitPadding: 50, // padding when fitting
      panSpeed: 10, // how many ms in between pan ticks
      panDistance: 10, // max pan distance per tick
      panDragAreaSize: 75, // the length of the pan drag box in which the vector for panning is calculated
      // (bigger = finer control of pan speed and direction)
      panMinPercentSpeed: 0.25, // the slowest speed we can pan by (as a percent of panSpeed)
      panInactiveArea: 8, // radius of inactive area in pan drag box
      panIndicatorMinOpacity: 0.5, // min opacity of pan indicator (the draggable nib); scales from this to 1.0
      zoomOnly: false, // a minimal version of the ui only with zooming (useful on systems with bad mousewheel resolution)
      fitSelector: undefined, // selector of elements to fit
      fitAnimationDuration: 1000, // duration of animation on fit
    };

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

    let zx, zy;
    let zooming = false;

    function calculateZoomCenterPoint() {
      zx = container.offsetWidth / 2;
      zy = container.offsetHeight / 2;
    }

    function startZooming() {
      zooming = true;

      calculateZoomCenterPoint();
    }


    function endZooming() {
      zooming = false;
    }

    function zoomTo(level) {
      if (!zooming) { // for non-continuous zooming (e.g. click slider at pt)
        calculateZoomCenterPoint();
      }

      cy.zoom({
        level: level,
        renderedPosition: {x: zx, y: zy}
      });
    }

    $(slider).bind('mousedown', function () {
      return false; // so we don't pan close to the slider handle
    });

    const sliderPadding = 2;

    function setSliderFromMouse(evt, handleOffset) {
      if (handleOffset === undefined) {
        handleOffset = 0;
      }

      const padding = sliderPadding;
      const min = padding;
      const max = $(slider).height() - $(sliderHandle).height() - 2 * padding;
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

      const zmin = options.minZoom;
      const zmax = options.maxZoom;

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

    let sliderMdownHandler, sliderMmoveHandler;
    $(sliderHandle).bind('mousedown', sliderMdownHandler = function (mdEvt) {
      const handleOffset = mdEvt.target === $(sliderHandle)[0] ? mdEvt.offsetY : 0;
      sliding = true;

      startZooming();
      $(sliderHandle).addClass('active');

      let lastMove = 0;
      $win.bind('mousemove', sliderMmoveHandler = function (mmEvt) {
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
        endZooming();
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
      const zmin = options.minZoom;
      const zmax = options.maxZoom;

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
      const zmin = options.minZoom;
      const zmax = options.maxZoom;

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

    function bindButton($button, factor) {
      let zoomInterval;

      $button.bind('mousedown', function (e) {
        e.preventDefault();
        e.stopPropagation();

        if (e.button !== 0) {
          return;
        }

        const doZoom = function () {
          const zoom = cy.zoom();
          let lvl = cy.zoom() * factor;

          if (lvl < options.minZoom) {
            lvl = options.minZoom;
          }

          if (lvl > options.maxZoom) {
            lvl = options.maxZoom;
          }

          if ((lvl === options.maxZoom && zoom === options.maxZoom) ||
            (lvl === options.minZoom && zoom === options.minZoom)
          ) {
            return;
          }

          zoomTo(lvl);
        };

        startZooming();
        doZoom();
        zoomInterval = setInterval(doZoom, options.zoomDelay);

        return false;
      });

      $win.bind('mouseup blur', function () {
        clearInterval(zoomInterval);
        endZooming();
      });
    }

    bindButton($(zoomIn), (1 + options.zoomFactor));
    bindButton($(zoomOut), (1 - options.zoomFactor));

    $(reset).bind('mousedown', function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (e.button === 0) {
        if (cy.elements().size() === 0) {
          cy.reset();
        } else {
          cy.fit();
        }
      }
    });
  }
}
