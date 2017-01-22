'use strict';

/*global cytoscape*/

cytoscape('layout', 'fruchterman', FruchtermanLayout);

function FruchtermanLayout(options) {
    let defaults = {
        fit: true
    };

    for (let i in defaults) {
        this.options[i] = defaults[i];
    }

    for (let i in options) {
        this.options[i] = options[i];
    }
}

FruchtermanLayout.prototype.run = function() {
    let options = this.options;
    let cy = options.cy;
    let width = cy.width();
    let height = cy.height();
    let graph = new Graph();
    let vertices = new Map();

    cy.nodes().forEach(function(node) {
        let v = new Vertex(Math.random() * width, Math.random() * height);

        vertices.set(node.id(), v);
        graph.insertVertex(v);
    });

    cy.edges().forEach(function(edge) {
        graph.insertEdge(vertices.get(edge.source().id()), vertices.get(edge.target().id()));
    });

    let layoutManager = new ForceDirectedVertexLayout(width, height, 100);

    layoutManager.layout(graph);

    cy.nodes().layoutPositions(this, options, function(i, node) {
        let vertex = vertices.get(node.id());

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

function Graph() {
    this.vertices = [];
    this.vertexCount = 0;
}

Graph.prototype.insertEdge = function(vertex1, vertex2) {
    var e1 = new Edge(vertex2);
    var e2 = new Edge(vertex1);

    vertex1.edges.push(e1);
    vertex2.reverseEdges.push(e2);

    return e1;
};

Graph.prototype.removeEdge = function(vertex1, vertex2) {
    for (let i = vertex1.edges.length - 1; i >= 0; i--) {
        if (vertex1.edges[i].endVertex == vertex2) {
            vertex1.edges.splice(i, 1);
            break;
        }
    }

    for (let i = vertex2.reverseEdges.length - 1; i >= 0; i--) {
        if (vertex2.reverseEdges[i].endVertex == vertex1) {
            vertex2.reverseEdges.splice(i, 1);
            break;
        }
    }
};

Graph.prototype.insertVertex = function(vertex) {
    this.vertices.push(vertex);
    this.vertexCount++;
};

Graph.prototype.removeVertex = function(vertex) {
    for (let i = vertex.edges.length - 1; i >= 0; i--) {
        this.removeEdge(vertex, vertex.edges[i].endVertex);
    }

    for (let i = vertex.reverseEdges.length - 1; i >= 0; i--) {
        this.removeEdge(vertex.reverseEdges[i].endVertex, vertex);
    }

    for (let i = this.vertices.length - 1; i >= 0; i--) {
        if (this.vertices[i] == vertex) {
            this.vertices.splice(i, 1);
            break;
        }
    }

    this.vertexCount--;
};

function Vertex(x, y) {
    this.edges = [];
    this.reverseEdges = [];
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0;
    this.hidden = false;
    this.fixed = false;
}

function Edge(endVertex) {
    this.endVertex = endVertex;
    this.hidden = false;
}

function ForceDirectedVertexLayout(width, height, iterations) {
    this.width = width;
    this.height = height;
    this.iterations = iterations;
}

ForceDirectedVertexLayout.prototype.identifyComponents = function(graph) {
    var componentCenters = [];
    var components = [];

    // Depth first search
    function dfs(vertex) {
        var stack = [];
        var component = [];
        var centerVertex = new Vertex("component_center", -1, -1);
        centerVertex.hidden = true;
        componentCenters.push(centerVertex);
        components.push(component);

        function visitVertex(v) {
            component.push(v);
            v.__dfsVisited = true;

            for (let i in v.edges) {
                let e = v.edges[i];
                if (!e.hidden)
                    stack.push(e.endVertex);
            }

            for (let i in v.reverseEdges) {
                if (!v.reverseEdges[i].hidden)
                    stack.push(v.reverseEdges[i].endVertex);
            }
        }

        visitVertex(vertex);
        while (stack.length > 0) {
            let u = stack.pop();

            if (!u.__dfsVisited && !u.hidden) {
                visitVertex(u);
            }
        }
    }

    // Clear DFS visited flag
    for (let i in graph.vertices) {
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
        for (let i in componentCenters) {
            graph.insertVertex(componentCenters[i]);
        }
        for (let i in components) {
            for (let j in components[i]) {
                // Connect visited vertex to "central" component vertex
                let edge = graph.insertEdge("", 1, components[i][j], componentCenters[i]);
                edge.hidden = true;
            }
        }

        for (let i in componentCenters) {
            for (let j in componentCenters) {
                if (i != j) {
                    let e = graph.insertEdge("", 3, componentCenters[i], componentCenters[j]);
                    e.hidden = true;
                }
            }
        }

        return componentCenters;
    }

    return null;
};

ForceDirectedVertexLayout.prototype.layout = function(graph) {
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
    var centers = this.identifyComponents(graph);

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
