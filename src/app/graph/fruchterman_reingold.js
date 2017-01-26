'use strict';

/*global cytoscape*/

cytoscape('layout', 'fruchterman', FruchtermanLayout);

function FruchtermanLayout(options) {
    let defaults = {
        fit: true
    };

    for (let key of Object.keys(defaults)) {
        if (options.hasOwnProperty(key)) {
            this.options[key] = options[key];
        } else {
            this.options[key] = defaults[key];
        }
    }
}

FruchtermanLayout.prototype.run = function () {
    let options = this.options;
    let cy = options.cy;
    let width = cy.width();
    let height = cy.height();
    let graph = new Graph();
    let vertices = new Map();

    cy.nodes().forEach(function (node) {
        let v = new Vertex(Math.random() * width, Math.random() * height);

        vertices.set(node.id(), v);
        graph.insertVertex(v);
    });

    cy.edges().forEach(function (edge) {
        graph.insertEdge(vertices.get(edge.source().id()), vertices.get(edge.target().id()));
    });

    let layoutManager = new ForceDirectedVertexLayout(width, height, 100);

    layoutManager.layout(graph);

    cy.nodes().layoutPositions(this, options, function (i, node) {
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

Graph.prototype.insertEdge = function (vertex1, vertex2) {
    let e1 = new Edge(vertex2);
    let e2 = new Edge(vertex1);

    vertex1.edges.push(e1);
    vertex2.reverseEdges.push(e2);

    return e1;
};

Graph.prototype.removeEdge = function (vertex1, vertex2) {
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

Graph.prototype.insertVertex = function (vertex) {
    this.vertices.push(vertex);
    this.vertexCount++;
};

Graph.prototype.removeVertex = function (vertex) {
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
    this.fixed = false;
}

function Edge(endVertex) {
    this.endVertex = endVertex;
}

function ForceDirectedVertexLayout(width, height, iterations) {
    this.width = width;
    this.height = height;
    this.iterations = iterations;
}

ForceDirectedVertexLayout.prototype.identifyComponents = function (graph) {
    let componentCenters = [];
    let components = [];

    // Depth first search
    function dfs(vertex) {
        let stack = [];
        let component = [];

        componentCenters.push(new Vertex(-1, -1));
        components.push(component);

        function visitVertex(v) {
            component.push(v);
            v.__dfsVisited = true;

            for (let e of v.edges) {
                stack.push(e.endVertex);
            }

            for (let e of v.reverseEdges) {
                stack.push(e.endVertex);
            }
        }

        visitVertex(vertex);
        while (stack.length > 0) {
            let u = stack.pop();

            if (!u.__dfsVisited) {
                visitVertex(u);
            }
        }
    }

    // Clear DFS visited flag
    for (let v of graph.vertices) {
        v.__dfsVisited = false;
    }

    // Iterate through all vertices starting DFS from each vertex
    // that hasn't been visited yet.
    for (let v of graph.vertices) {
        if (!v.__dfsVisited)
            dfs(v);
    }

    // Interconnect all center vertices
    if (componentCenters.length > 1) {
        for (let c of componentCenters) {
            graph.insertVertex(c);
        }
        for (let i in components) {
            for (let v of components[i]) {
                // Connect visited vertex to "central" component vertex
                graph.insertEdge(v, componentCenters[i]);
            }
        }

        for (let c1 of componentCenters) {
            for (let c2 of componentCenters) {
                if (c1 !== c2) {
                    graph.insertEdge(c1, c2);
                }
            }
        }
    }
};

ForceDirectedVertexLayout.prototype.layout = function (graph) {
    let area = this.width * this.height;
    let k = Math.sqrt(area / graph.vertexCount);

    let t = this.width / 10; // Temperature.
    let dt = t / (this.iterations + 1);

    let eps = 20; // Minimum vertex distance.
    let A = 1.5; // Fine tune attraction.
    let R = 0.5; // Fine tune repulsion.

    // Initiate component identification and virtual vertex creation
    // to prevent disconnected graph components from drifting too far apart
    this.identifyComponents(graph);

    // Run through some iterations
    for (let q = 0; q < this.iterations; q++) {

        /* Calculate repulsive forces. */
        for (let v of graph.vertices) {
            v.dx = 0;
            v.dy = 0;
            // Do not move fixed vertices
            if (!v.fixed) {
                for (let u of graph.vertices) {
                    if (v != u && !u.fixed) {
                        /* Difference vector between the two vertices. */
                        let difx = v.x - u.x;
                        let dify = v.y - u.y;

                        /* Length of the dif vector. */
                        let d = Math.max(eps, Math.sqrt(difx * difx + dify * dify));
                        let force = R * k * k / d;
                        v.dx = v.dx + (difx / d) * force;
                        v.dy = v.dy + (dify / d) * force;
                    }
                }
            }
        }

        /* Calculate attractive forces. */
        for (let v of graph.vertices) {
            // Do not move fixed vertices
            if (!v.fixed) {
                for (let e of v.edges) {
                    let u = e.endVertex;
                    let difx = v.x - u.x;
                    let dify = v.y - u.y;
                    let d = Math.max(eps, Math.sqrt(difx * difx + dify * dify));
                    let force = A * d * d / k;

                    v.dx = v.dx - (difx / d) * force;
                    v.dy = v.dy - (dify / d) * force;

                    u.dx = u.dx + (difx / d) * force;
                    u.dy = u.dy + (dify / d) * force;
                }
            }
        }

        /* Limit the maximum displacement to the temperature t
         and prevent from being displaced outside frame.     */
        for (let v of graph.vertices) {
            if (!v.fixed) {
                /* Length of the displacement vector. */
                let d = Math.max(eps, Math.sqrt(v.dx * v.dx + v.dy * v.dy));

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
};
