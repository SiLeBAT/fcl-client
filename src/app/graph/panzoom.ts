export function Panzoom() {
  return new PanzoomClass(this);
}

declare const $: any;

class PanzoomClass {

  constructor(self: any) {
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

      // icon class names
      sliderHandleIcon: 'fa fa-minus',
      zoomInIcon: 'fa fa-plus',
      zoomOutIcon: 'fa fa-minus',
      resetIcon: 'fa fa-expand'
    };

    const $container = $(self.container());
    const winbdgs = [];
    const $win = $(window);

    const windowBind = function (evt, fn) {
      winbdgs.push({evt: evt, fn: fn});

      $win.bind(evt, fn);
    };

    const windowUnbind = function (evt, fn) {
      for (let i = 0; i < winbdgs.length; i++) {
        const l = winbdgs[i];

        if (l.evt === evt && l.fn === fn) {
          winbdgs.splice(i, 1);
          break;
        }
      }

      $win.unbind(evt, fn);
    };

    const cybdgs = [];
    const cy = self;

    const cyOn = function (evt, fn) {
      cybdgs.push({evt: evt, fn: fn});

      cy.on(evt, fn);
    };

    const $panzoom = $('<div class="cy-panzoom"></div>');
    $container.prepend($panzoom);

    $panzoom.css('position', 'absolute'); // must be absolute regardless of stylesheet

    $panzoom.data('winbdgs', winbdgs);
    $panzoom.data('cybdgs', cybdgs);

    if (options.zoomOnly) {
      $panzoom.addClass('cy-panzoom-zoom-only');
    }

    // add base html elements
    /////////////////////////

    const $zoomIn =
      $('<div class="cy-panzoom-zoom-in cy-panzoom-zoom-button"><span class="icon ' + options.zoomInIcon + '"></span></div>');
    $panzoom.append($zoomIn);

    const $zoomOut =
      $('<div class="cy-panzoom-zoom-out cy-panzoom-zoom-button"><span class="icon ' + options.zoomOutIcon + '"></span></div>');
    $panzoom.append($zoomOut);

    const $reset =
      $('<div class="cy-panzoom-reset cy-panzoom-zoom-button"><span class="icon ' + options.resetIcon + '"></span></div>');
    $panzoom.append($reset);

    const $slider = $('<div class="cy-panzoom-slider"></div>');
    $panzoom.append($slider);

    $slider.append('<div class="cy-panzoom-slider-background"></div>');

    const $sliderHandle = $('<div class="cy-panzoom-slider-handle"><span class="icon ' + options.sliderHandleIcon + '"></span></div>');
    $slider.append($sliderHandle);

    const $noZoomTick = $('<div class="cy-panzoom-no-zoom-tick"></div>');
    $slider.append($noZoomTick);

    const $panner = $('<div class="cy-panzoom-panner"></div>');
    $panzoom.append($panner);

    const $pHandle = $('<div class="cy-panzoom-panner-handle"></div>');
    $panner.append($pHandle);

    const $pUp = $('<div class="cy-panzoom-pan-up cy-panzoom-pan-button"></div>');
    const $pDown = $('<div class="cy-panzoom-pan-down cy-panzoom-pan-button"></div>');
    const $pLeft = $('<div class="cy-panzoom-pan-left cy-panzoom-pan-button"></div>');
    const $pRight = $('<div class="cy-panzoom-pan-right cy-panzoom-pan-button"></div>');
    $panner.append($pUp).append($pDown).append($pLeft).append($pRight);

    const $pIndicator = $('<div class="cy-panzoom-pan-indicator"></div>');
    $panner.append($pIndicator);

    // functions for calculating panning
    ////////////////////////////////////

    function handle2pan(e) {
      let v = {
        x: e.originalEvent.pageX - $panner.offset().left - $panner.width() / 2,
        y: e.originalEvent.pageY - $panner.offset().top - $panner.height() / 2
      };

      const r = options.panDragAreaSize;
      const d = Math.sqrt(v.x * v.x + v.y * v.y);
      let percent = Math.min(d / r, 1);

      if (d < options.panInactiveArea) {
        return {
          x: NaN,
          y: NaN
        };
      }

      v = {
        x: v.x / d,
        y: v.y / d
      };

      percent = Math.max(options.panMinPercentSpeed, percent);

      return {
        x: -1 * v.x * (percent * options.panDistance),
        y: -1 * v.y * (percent * options.panDistance)
      };
    }

    let panInterval;

    const handler = function (e) {
      e.stopPropagation(); // don't trigger dragging of panzoom
      e.preventDefault(); // don't cause text selection
      clearInterval(panInterval);

      const pan = handle2pan(e);

      if (isNaN(pan.x) || isNaN(pan.y)) {
        $pIndicator.hide();
        return;
      }

      positionIndicator(pan);
      panInterval = setInterval(function () {
        $container.cytoscape('get').panBy(pan);
      }, options.panSpeed);
    };

    function donePanning() {
      clearInterval(panInterval);
      windowUnbind('mousemove', handler);

      $pIndicator.hide();
    }

    function positionIndicator(pan) {
      const v = pan;
      const d = Math.sqrt(v.x * v.x + v.y * v.y);
      const vnorm = {
        x: -1 * v.x / d,
        y: -1 * v.y / d
      };

      const w = $panner.width();
      const h = $panner.height();
      const percent = d / options.panDistance;
      const opacity = Math.max(options.panIndicatorMinOpacity, percent);
      const color = 255 - Math.round(opacity * 255);

      $pIndicator.show().css({
        left: w / 2 * vnorm.x + w / 2,
        top: h / 2 * vnorm.y + h / 2,
        background: 'rgb(' + color + ', ' + color + ', ' + color + ')'
      });
    }

    let zx, zy;
    let zooming = false;

    function calculateZoomCenterPoint() {
      zx = $container.width() / 2;
      zy = $container.height() / 2;
    }

    function startZooming() {
      zooming = true;

      calculateZoomCenterPoint();
    }


    function endZooming() {
      zooming = false;
    }

    function zoomTo(level) {
      const cy2 = $container.cytoscape('get');

      if (!zooming) { // for non-continuous zooming (e.g. click slider at pt)
        calculateZoomCenterPoint();
      }

      cy2.zoom({
        level: level,
        renderedPosition: {x: zx, y: zy}
      });
    }

    $pHandle.bind('mousedown', function (e) {
      // handle click of icon
      handler(e);

      // update on mousemove
      windowBind('mousemove', handler);
    });

    $pHandle.bind('mouseup', function () {
      donePanning();
    });

    windowBind('mouseup blur', function () {
      donePanning();
    });


    // set up slider behaviour
    //////////////////////////

    $slider.bind('mousedown', function () {
      return false; // so we don't pan close to the slider handle
    });

    let sliding = false;
    const sliderPadding = 2;

    function setSliderFromMouse(evt, handleOffset) {
      if (handleOffset === undefined) {
        handleOffset = 0;
      }

      const padding = sliderPadding;
      const min = padding;
      const max = $slider.height() - $sliderHandle.height() - 2 * padding;
      let top = evt.pageY - $slider.offset().top - handleOffset;

      // constrain to slider bounds
      if (top < min) {
        top = min;
      }
      if (top > max) {
        top = max;
      }

      const percent = 1 - (top - min) / ( max - min );

      // move the handle
      $sliderHandle.css('top', top);

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
    $sliderHandle.bind('mousedown', sliderMdownHandler = function (mdEvt) {
      const handleOffset = mdEvt.target === $sliderHandle[0] ? mdEvt.offsetY : 0;
      sliding = true;

      startZooming();
      $sliderHandle.addClass('active');

      let lastMove = 0;
      windowBind('mousemove', sliderMmoveHandler = function (mmEvt) {
        const now = +new Date;

        // throttle the zooms every 10 ms so we don't call zoom too often and cause lag
        if (now > lastMove + 10) {
          lastMove = now;
        } else {
          return false;
        }

        setSliderFromMouse(mmEvt, handleOffset);

        return false;
      });

      // unbind when
      windowBind('mouseup', function () {
        windowUnbind('mousemove', sliderMmoveHandler);
        sliding = false;

        $sliderHandle.removeClass('active');
        endZooming();
      });

      return false;
    });

    $slider.bind('mousedown', function (e) {
      if (e.target !== $sliderHandle[0]) {
        sliderMdownHandler(e);
        setSliderFromMouse(e, undefined);
      }
    });

    function positionSliderFromZoom() {
      const cy2 = $container.cytoscape('get');
      const z = cy2.zoom();
      const zmin = options.minZoom;
      const zmax = options.maxZoom;

      // assume (zoom = zmax ^ p) where p ranges on (x, 1) with x negative
      const x = Math.log(zmin) / Math.log(zmax);
      const p = Math.log(z) / Math.log(zmax);
      const percent = 1 - (p - x) / (1 - x); // the 1- bit at the front b/c up is in the -ve y direction

      const min = sliderPadding;
      const max = $slider.height() - $sliderHandle.height() - 2 * sliderPadding;
      let top = percent * ( max - min );

      // constrain to slider bounds
      if (top < min) {
        top = min;
      }
      if (top > max) {
        top = max;
      }

      // move the handle
      $sliderHandle.css('top', top);
    }

    positionSliderFromZoom();

    cyOn('zoom', function () {
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
        $noZoomTick.hide();
        return;
      }

      const min = sliderPadding;
      const max = $slider.height() - $sliderHandle.height() - 2 * sliderPadding;
      let top = percent * ( max - min );

      // constrain to slider bounds
      if (top < min) {
        top = min;
      }
      if (top > max) {
        top = max;
      }

      $noZoomTick.css('top', top);
    })();

    // set up zoom in/out buttons
    /////////////////////////////

    function bindButton($button, factor) {
      let zoomInterval;

      $button.bind('mousedown', function (e) {
        e.preventDefault();
        e.stopPropagation();

        if (e.button !== 0) {
          return;
        }

        const cy2 = $container.cytoscape('get');
        const doZoom = function () {
          const zoom = cy2.zoom();
          let lvl = cy2.zoom() * factor;

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

      windowBind('mouseup blur', function () {
        clearInterval(zoomInterval);
        endZooming();
      });
    }

    bindButton($zoomIn, (1 + options.zoomFactor));
    bindButton($zoomOut, (1 - options.zoomFactor));

    $reset.bind('mousedown', function (e) {
      if (e.button !== 0) {
        return;
      }

      const cy2 = $container.cytoscape('get');
      const elesToFit = options.fitSelector ? cy2.elements(options.fitSelector) : cy2.elements();

      if (elesToFit.size() === 0) {
        cy2.reset();
      } else {
        cy2.fit(elesToFit, options.fitPadding);
      }

      return false;
    });
  }
}
