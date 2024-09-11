/******************      Util      **************/

/** Common interfaces for Utils */
declare namespace Util {
  /** Common handler for addListener of EventSource */
  interface EventHandler {
    (sender: any, state: any);
  }
}

/**
 * The mxEventObject is a wrapper for all properties of a single event.  Additionally, it also offers functions
 * to consume the event and check if it was consumed as follows:
 */
declare class mxEventObject {
  constructor(name: string);

  /** Holds the name. */
  name: string;

  /** Holds the properties as an associative array. */
  properties: any;

  /** Returns name */
  getName: () => string;

  /** Returns the property for the given key. */
  getProperty: (key: string) => any;
}

/**
 * A wrapper class for an associative array with object keys.  Note: This implementation uses <mxObjectIdentitiy> to
 * turn object keys into strings.
 */
declare class mxDictionary {
  /** Stores the (key, value) pairs in this dictionary. */
  map: any;

  /**
   * Returns the value for the given key.
   * @param key
   */
  get: (key: any) => any;

  /**
   * Stores the value under the given key and returns the previous value for that key.
   * @param key
   * @param value
   */
  put: (key: any, value: any) => any;

  /** Returns all keys as an array. */
  getKeys: () => string[];
  /** Returns all values as an array. */
  getValues: () => string[];
}

/**
 * Base class for objects that dispatch named events.  To create a subclass that inherits from mxEventSource, the following code is used.
 */
declare class mxEventSource {
  /**
   * Binds the specified function to the given event name.  If no event name is given, then the listener
   * is registered for all events.
   * The parameters of the listener are the sender and an mxEventObject.
   */
  addListener(name: any, func: Util.EventHandler);
}

/**
 * Encapsulates the URL, width and height of an image.
 */
declare class mxImage {
  /** Encapsulates the URL, width and height of an image. */
  constructor(src: string, width: number, height: number);
}

/**
 * Cross-browser DOM event support
 */
declare class mxEvent {
  static ADD: any;
  static REMOVE: any;
}

declare class mxMouseEvent {
  consumed;
  evt;
  graphX;
  graphY;
  state;
  getEvent();
  getSource();
  isSource(shape);
  getX();
  getY();
  getGraphX();
  getGraphY();
  getState();
  getCell();
  isPopupTrigger();
  isConsumed();
  consume(preventDefault);
}

declare class mxPoint {
  /** Constructs a new point for the optional x and y coordinates.  If no coordinates are given, then the default values for x and y are used. */
  constructor(x: number, y: number);

  x: number;
  y: number;

  /**
   * Returns true if the given object equals this point.
   * @param obj
   */
  equals(obj: any): boolean;

  clone();
}

declare class mxRectangle extends mxPoint {
  /**
   * Constructs a new rectangle for the optional parameters (default 0).
   * @param x
   * @param y
   * @param width
   * @param height
   */
  constructor(x?: number, y?: number, width?: number, height?: number);

  width: number;
  height: number;

  /**
   * Sets this rectangle to the specified values
   * @param x
   * @param y
   * @param width
   * @param height
   */
  setRect(x: number, y: number, width: number, height: number): void;

  /**
   * Returns the x-coordinate of the center point.
   */
  getCenterX(): number;

  /**
   * Returns the y-coordinate of the center point.
   */
  getCenterY(): number;

  /**
   * Adds the given rectangle to this rectangle.
   * @param rect
   */
  add(rect: {x: number; y: number; width: number; height: number}): void;

  /**
   * Changes this rectangle to where it overlaps with the given rectangle.
   * @param rect
   */
  intersect(rect: {x: number; y: number; width: number; height: number}): void;

  /**
   * Grows the rectangle by the given amount, that is, this method subtracts the given amount
   * from the x- and y-coordinates and adds twice the amount to the width and height.
   * @param amount
   */
  grow(amount: number): void;

  /**
   * Returns the top, left corner as a new mxPoint.
   */
  getPoint(): mxPoint;

  /**
   * Rotates this rectangle by 90 degree around its center point.
   */
  rotate90(): void;

  /**
   * Returns true if the given object equals this rectangle.
   * @param obj
   */
  equals(obj: any): boolean;

  /**
   * Returns a new mxRectangle which is a copy of the given rectangle.
   * @param rect
   */
  static fromRectangle(rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): mxRectangle;
}

/******************      Util end      **************/
