'use strict';

/*global cytoscape*/

var register = function(cytoscape) {

    var defaults = {
        fit: true
    };

    function ForceDirectedLayout(options) {
        var opts = this.options = {};

        for (let i in defaults) {
            opts[i] = defaults[i];
        }

        for (let i in options) {
            opts[i] = options[i];
        }
    }

    ForceDirectedLayout.prototype.run = function() {
        var options = this.options;
        var cy = options.cy;
        var width = cy.width();
        var height = cy.height();
        var graph = new Graph();
        var vertices = new Map();

        cy.nodes().forEach(function(node) {
            var v = new Vertex(Math.random() * width, Math.random() * height);

            vertices.set(node.id(), v);
            graph.insertVertex(v);
        });

        cy.edges().forEach(function(edge) {
            graph.insertEdge(vertices.get(edge.source().id()), vertices.get(edge.target().id()));
        });

        var layoutManager = new ForceDirectedVertexLayout(width, height, 100);

        layoutManager.layout(graph);

        cy.nodes().layoutPositions(this, options, function(i, node) {
            var vertex = vertices.get(node.id());

            return {
                x: vertex.x,
                y: vertex.y
            };
        });

        if (options.fit) {
            cy.fit();
        }

        return this;
    };

    cytoscape('layout', 'forcedirected', ForceDirectedLayout);
};

register(cytoscape);

function insertVertex(vertex) {
    this.vertices.push(vertex);
    this.vertexCount++;
}

function insertEdge(vertex1, vertex2) {
    var e1 = new Edge(vertex2);
    var e2 = new Edge(vertex1);

    vertex1.edges.push(e1);
    vertex2.reverseEdges.push(e2);

    return e1;
}

function removeEdge(vertex1, vertex2) {
    for (var i = vertex1.edges.length - 1; i >= 0; i--) {
        if (vertex1.edges[i].endVertex == vertex2) {
            vertex1.edges.splice(i, 1);
            break;
        }
    }

    for (var i = vertex2.reverseEdges.length - 1; i >= 0; i--) {
        if (vertex2.reverseEdges[i].endVertex == vertex1) {
            vertex2.reverseEdges.splice(i, 1);
            break;
        }
    }
}

function removeVertex(vertex) {
    for (var i = vertex.edges.length - 1; i >= 0; i--) {
        this.removeEdge(vertex, vertex.edges[i].endVertex);
    }

    for (var i = vertex.reverseEdges.length - 1; i >= 0; i--) {
        this.removeEdge(vertex.reverseEdges[i].endVertex, vertex);
    }

    for (var i = this.vertices.length - 1; i >= 0; i--) {
        if (this.vertices[i] == vertex) {
            this.vertices.splice(i, 1);
            break;
        }
    }

    this.vertexCount--;
}

function Graph() {
    /* Fields. */
    this.vertices = new Array();
    this.vertexCount = 0;

    /* Graph methods. */
    this.insertVertex = insertVertex;
    this.removeVertex = removeVertex;
    this.insertEdge = insertEdge;
    this.removeEdge = removeEdge;
}

function Vertex(x, y) {
    this.edges = new Array();
    this.reverseEdges = new Array();
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0;
    this.level = -1;
    this.numberOfParents = 0;
    this.hidden = false;
    this.fixed = false;
}

function Edge(endVertex) {
    this.endVertex = endVertex;
    this.hidden = false;
}

Graph.prototype.normalize = function(width, height, preserveAspect) {
    for (let i8 in this.vertices) {
        let v = this.vertices[i8];
        v.oldX = v.x;
        v.oldY = v.y;
    }
    var mnx = 10;
    var mxx = width - 100;
    var mny = 10;
    var mxy = height - 50;
    if (preserveAspect == null)
        preserveAspect = true;

    var minx = Number.MAX_VALUE;
    var miny = Number.MAX_VALUE;
    var maxx = Number.MIN_VALUE;
    var maxy = Number.MIN_VALUE;

    for (let i7 in this.vertices) {
        let v = this.vertices[i7];
        if (v.x < minx)
            minx = v.x;
        if (v.y < miny)
            miny = v.y;
        if (v.x > maxx)
            maxx = v.x;
        if (v.y > maxy)
            maxy = v.y;
    }
    var dx = mnx - minx;
    var dy = mny - miny;
    var kx = (mxx - mnx) / (maxx - minx);
    var ky = (mxy - mny) / (maxy - miny);

    if (preserveAspect) {
        kx = Math.min(kx, ky);
        ky = Math.min(kx, ky);
    }

    for (var i8 in this.vertices) {
        var v = this.vertices[i8];
        v.x += dx;
        v.x *= kx;
        v.y += dy;
        v.y *= ky;
    }
};

function ForceDirectedVertexLayout(width, height, iterations) {
    this.width = width;
    this.height = height;
    this.iterations = iterations;
}

ForceDirectedVertexLayout.prototype.__identifyComponents = function(graph) {
    var componentCenters = new Array();
    var components = new Array();

    // Depth first search
    function dfs(vertex) {
        var stack = new Array();
        var component = new Array();
        var centerVertex = new Vertex("component_center", -1, -1);
        centerVertex.hidden = true;
        componentCenters.push(centerVertex);
        components.push(component);

        function visitVertex(v) {
            component.push(v);
            v.__dfsVisited = true;

            for (var i in v.edges) {
                var e = v.edges[i];
                if (!e.hidden)
                    stack.push(e.endVertex);
            }

            for (var i in v.reverseEdges) {
                if (!v.reverseEdges[i].hidden)
                    stack.push(v.reverseEdges[i].endVertex);
            }
        }

        visitVertex(vertex);
        while (stack.length > 0) {
            var u = stack.pop();

            if (!u.__dfsVisited && !u.hidden) {
                visitVertex(u);
            }
        }
    }

    // Clear DFS visited flag
    for (var i in graph.vertices) {
        let v = graph.vertices[i];
        v.__dfsVisited = false;
    }

    // Iterate through all vertices starting DFS from each vertex
    // that hasn't been visited yet.
    for (var k in graph.vertices) {
        let v = graph.vertices[k];
        if (!v.__dfsVisited && !v.hidden)
            dfs(v);
    }

    // Interconnect all center vertices
    if (componentCenters.length > 1) {
        for (var i in componentCenters) {
            graph.insertVertex(componentCenters[i]);
        }
        for (var i in components) {
            for (var j in components[i]) {
                // Connect visited vertex to "central" component vertex
                var edge = graph.insertEdge("", 1, components[i][j], componentCenters[i]);
                edge.hidden = true;
            }
        }

        for (var i in componentCenters) {
            for (var j in componentCenters) {
                if (i != j) {
                    var e = graph.insertEdge("", 3, componentCenters[i], componentCenters[j]);
                    e.hidden = true;
                }
            }
        }

        return componentCenters;
    }

    return null;
};

ForceDirectedVertexLayout.prototype.layout = function(graph) {
    this.graph = graph;
    var area = this.width * this.height;
    var k = Math.sqrt(area / graph.vertexCount);

    var t = this.width / 10; // Temperature.
    var dt = t / (this.iterations + 1);

    var eps = 20; // Minimum vertex distance.
    var A = 1.5; // Fine tune attraction.
    var R = 0.5; // Fine tune repulsion.

    // Attractive and repulsive forces
    function Fa(z) {
        return A * z * z / k;
    }

    function Fr(z) {
        return R * k * k / z;
    }

    // Initiate component identification and virtual vertex creation
    // to prevent disconnected graph components from drifting too far apart
    var centers = this.__identifyComponents(graph);

    // Run through some iterations
    for (var q = 0; q < this.iterations; q++) {

        /* Calculate repulsive forces. */
        for (var i1 in graph.vertices) {
            let v = graph.vertices[i1];

            v.dx = 0;
            v.dy = 0;
            // Do not move fixed vertices
            if (!v.fixed) {
                for (var i2 in graph.vertices) {
                    let u = graph.vertices[i2];
                    if (v != u && !u.fixed) {
                        /* Difference vector between the two vertices. */
                        let difx = v.x - u.x;
                        let dify = v.y - u.y;

                        /* Length of the dif vector. */
                        let d = Math.max(eps, Math.sqrt(difx * difx + dify * dify));
                        let force = Fr(d);
                        v.dx = v.dx + (difx / d) * force;
                        v.dy = v.dy + (dify / d) * force;
                    }
                }
            }
        }

        /* Calculate attractive forces. */
        for (var i3 in graph.vertices) {
            let v = graph.vertices[i3];

            // Do not move fixed vertices
            if (!v.fixed) {
                for (var i4 in v.edges) {
                    let e = v.edges[i4];
                    let u = e.endVertex;
                    let difx = v.x - u.x;
                    let dify = v.y - u.y;
                    let d = Math.max(eps, Math.sqrt(difx * difx + dify * dify));
                    let force = Fa(d);

                    v.dx = v.dx - (difx / d) * force;
                    v.dy = v.dy - (dify / d) * force;

                    u.dx = u.dx + (difx / d) * force;
                    u.dy = u.dy + (dify / d) * force;
                }
            }
        }

        /* Limit the maximum displacement to the temperature t
            and prevent from being displaced outside frame.     */
        for (var i5 in graph.vertices) {
            var v = graph.vertices[i5];
            if (!v.fixed) {
                /* Length of the displacement vector. */
                var d = Math.max(eps, Math.sqrt(v.dx * v.dx + v.dy * v.dy));

                /* Limit to the temperature t. */
                v.x = v.x + (v.dx / d) * Math.min(d, t);
                v.y = v.y + (v.dy / d) * Math.min(d, t);

                v.x = Math.round(v.x);
                v.y = Math.round(v.y);
            }
        }

        /* Cool. */
        t -= dt;
    }

    // Remove virtual center vertices
    if (centers) {
        for (var i in centers) {
            graph.removeVertex(centers[i]);
        }
    }
};
