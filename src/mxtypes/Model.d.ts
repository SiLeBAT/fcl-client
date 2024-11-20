/******************      Model         **************/

declare class mxGeometry extends mxRectangle {
    /**
     * Constructs a new object to describe the size and location of a vertex or the control points of an edge.
     * @param x
     * @param y
     * @param width
     * @param height
     */
    constructor(x: number, y: number, width: number, height: number);

    /**
     * Global switch to translate the points in translate. Default is true.
     */
    TRANSLATE_CONTROL_POINTS: boolean;

    /**
     * Stores alternate values for x, y, width and height in a rectangle. Default is null.
     */
    alternateBounds: { x: number; y: number; width: number; height: number };

    /**
     * Defines the source mxPoint of the edge.  This is used if the corresponding edge does not have a source vertex.
     * Otherwise it is ignored.  Default is null.
     */
    sourcePoint: mxPoint;

    /**
     * Defines the target mxPoint of the edge.  This is used if the corresponding edge does not have a target vertex.
     * Otherwise it is ignored.  Default is null.
     */
    targetPoint: mxPoint;

    /**
     * Array of mxPoints which specifies the control points along the edge.  These points
     * are the intermediate points on the edge, for the endpoints use targetPoint and sourcePoint
     * or set the terminals of the edge to a non-null value.  Default is null.
     */
    points: mxPoint[];

    /**
     * For edges, this holds the offset (in pixels) from the position defined by <x> and <y> on the edge.
     * For relative geometries (for vertices), this defines the absolute offset from the point defined by
     * the relative coordinates.  For absolute geometries (for vertices), this defines the offset for the
     * label.  Default is null.
     */
    offset;

    /**
     * Specifies if the coordinates in the geometry are to be interpreted as relative coordinates.
     * For edges, this is used to define the location of the edge label relative to the edge as
     * rendered on the display.  For vertices, this specifies the relative location inside the bounds
     * of the parent cell. If this is false, then the coordinates are relative to the origin of the
     * parent cell or, for edges, the edge label position is relative to the center of the edge as
     * rendered on screen. Default is false.
     */
    relative: boolean;

    /**
     * Swaps the x, y, width and height with the values stored in alternateBounds and puts the previous
     * values into alternateBounds as a rectangle.  This operation is carried-out in-place, that is,
     * using the existing geometry instance.  If this operation is called during a graph model transactional
     * change, then the geometry should be cloned before calling this method and setting the geometry of
     * the cell using mxGraphModel.setGeometry.
     */
    swap(): void;

    /**
     * Returns the mxPoint representing the source or target point of this edge.  This is only used if the
     * edge has no source or target vertex.
     * @param isSource Boolean that specifies if the source or target point should be returned.
     */
    getTerminalPoint(isSource: boolean): mxPoint;

    /**
     * Sets the sourcePoint or targetPoint to the given mxPoint and returns the new point.
     * @param point Point to be used as the new source or target point.
     * @param isSource Boolean that specifies if the source or target point should be set.
     */
    setTerminalPoint(point: mxPoint, isSource: boolean): void;

    /**
     * Rotates the geometry by the given angle around the given center.  That is, <x> and <y>
     * of the geometry, the sourcePoint, targetPoint and all points are translated by the given
     * amount.  <x> and <y> are only translated if relative is false.
     * @param angle Number that specifies the rotation angle in degrees.
     * @param cx mxPoint that specifies the center of the rotation.
     */
    rotate(angle: number, cx: mxPoint): void;

    /**
     * Translates the geometry by the specified amount.  That is, <x> and <y> of the geometry,
     * the sourcePoint, targetPoint and all points are translated by the given amount.
     * <x> and <y> are only translated if relative is false.  If TRANSLATE_CONTROL_POINTS is false,
     * then points are not modified by this function.
     * @param dx Number that specifies the x-coordinate of the translation.
     * @param dy Number that specifies the y-coordinate of the translation.
     */
    translate(dx: number, dy: number): void;

    /**
     * Scales the geometry by the given amount.  That is, <x> and <y> of the geometry, the sourcePoint,
     * targetPoint and all points are scaled by the given amount.  <x>, <y>, <width> and <height> are
     * only scaled if relative is false.  If <fixedAspect> is true, then the smaller value is used to
     * scale the width and the height.
     * @param sx Number that specifies the horizontal scale factor.
     * @param sy Number that specifies the vertical scale factor.
     * @param fixedAspect Optional boolean to keep the aspect ratio fixed.
     */
    scale(sx: number, sy: number, fixedAspect?: boolean): void;

    /**
     * Returns true if the given object equals this geometry.
     * @param obj
     */
    equals(obj: any): boolean;
}

declare class mxCell {
    id: any;
    value;
    geometry: mxGeometry;
    style;
    vertex;
    edge;
    connectable;
    visible;
    collapsed;
    parent;
    source;
    target;
    children;
    edges;
    mxTransient;
    getId();
    setId(id);
    getValue();
    setValue(value);
    valueChanged(newValue);
    getGeometry(): mxGeometry;
    setGeometry(geometry: mxGeometry);
    getStyle();
    setStyle(style);
    isVertex();
    setVertex(vertex);
    isEdge();
    setEdge(edge);
    isConnectable();
    setConnectable(connectable);
    isVisible();
    setVisible(visible);
    isCollapsed();
    setCollapsed(collapsed);
    getParent();
    setParent(parent);
    getTerminal(source);
    setTerminal(terminal, isSource);
    getChildCount();
    getIndex(child);
    getChildAt(index);
    insert(child, index);
    remove(index);
    removeFromParent();
    getEdgeCount();
    getEdgeIndex(edge);
    getEdgeAt(index);
    insertEdge(edge, isOutgoing);
    removeEdge(edge, isOutgoing);
    removeFromTerminal(isSource);
    getAttribute(name, defaultValue);
    setAttribute(name, value);

    /**
     * Returns a clone of the cell.  Uses cloneValue to clone the user object.  All fields in mxTransient are ignored during the cloning.
     */
    clone(): mxCell;

    cloneValue();
}
/******************      Model end     **************/
