export function FruchtermanLayout(options) {
    this.options = options;
}

class Graph {
    vertices: Vertex[] = [];
    edges: { vertex1: Vertex; vertex2: Vertex }[] = [];

    insertVertex(vertex: Vertex) {
        this.vertices.push(vertex);
    }

    insertEdge(vertex1: Vertex, vertex2: Vertex) {
        if (!vertex1.connections.has(vertex2)) {
            vertex1.connections.add(vertex2);
            vertex2.connections.add(vertex1);
            this.edges.push({ vertex1: vertex1, vertex2: vertex2 });
        }
    }
}

class Vertex {
    x: number;
    y: number;
    fixed: boolean;
    connections: Set<Vertex> = new Set();

    dx: number;
    dy: number;
    visited: boolean;

    constructor(x: number, y: number, fixed: boolean) {
        this.x = x;
        this.y = y;
        this.fixed = fixed;
    }
}

class ForceDirectedVertexLayout {
    private graph: Graph;

    constructor(graph: Graph) {
        this.graph = graph;
    }

    layout(width: number, height: number, iterations: number) {
        // Initiate component identification and virtual vertex creation
        // to prevent disconnected graph components from drifting too far apart
        this.connectComponents();

        const area = width * height;
        const k = Math.sqrt(area / this.graph.vertices.length);

        let t = width / 10; // Temperature.
        const dt = t / (iterations + 1);

        const eps = 20; // Minimum vertex distance.
        const A = 1.5; // Fine tune attraction.
        const R = 0.5; // Fine tune repulsion.

        // Run through some iterations
        for (let q = 0; q < iterations; q++) {
            for (const v of this.graph.vertices) {
                v.dx = 0;
                v.dy = 0;
            }

            const n = this.graph.vertices.length;

            /* Calculate repulsive forces. */
            for (let i1 = 0; i1 < n - 1; i1++) {
                for (let i2 = i1 + 1; i2 < n; i2++) {
                    const u = this.graph.vertices[i1];
                    const v = this.graph.vertices[i2];

                    if (!u.fixed || !v.fixed) {
                        /* Difference vector between the two vertices. */
                        const difx = v.x - u.x;
                        const dify = v.y - u.y;
                        /* Length of the dif vector. */
                        const d = Math.max(
                            eps,
                            Math.sqrt(difx * difx + dify * dify),
                        );
                        const force = (R * k * k) / d;

                        u.dx = u.dx - (difx / d) * force;
                        u.dy = u.dy - (dify / d) * force;

                        v.dx = v.dx + (difx / d) * force;
                        v.dy = v.dy + (dify / d) * force;
                    }
                }
            }

            /* Calculate attractive forces. */
            for (const c of this.graph.edges) {
                const u = c.vertex1;
                const v = c.vertex2;

                if (!u.fixed || !v.fixed) {
                    /* Difference vector between the two vertices. */
                    const difx = v.x - u.x;
                    const dify = v.y - u.y;
                    /* Length of the dif vector. */
                    const d = Math.max(
                        eps,
                        Math.sqrt(difx * difx + dify * dify),
                    );
                    const force = (A * d * d) / k;

                    u.dx = u.dx + (difx / d) * force;
                    u.dy = u.dy + (dify / d) * force;

                    v.dx = v.dx - (difx / d) * force;
                    v.dy = v.dy - (dify / d) * force;
                }
            }

            /* Limit the maximum displacement to the temperature t
       and prevent from being displaced outside frame.     */
            for (const v of this.graph.vertices) {
                if (!v.fixed) {
                    /* Length of the displacement vector. */
                    const d = Math.max(
                        eps,
                        Math.sqrt(v.dx * v.dx + v.dy * v.dy),
                    );

                    /* Limit to the temperature t. */
                    v.x = Math.round(v.x + (v.dx / d) * Math.min(d, t));
                    v.y = Math.round(v.y + (v.dy / d) * Math.min(d, t));
                }
            }

            /* Cool. */
            t -= dt;
        }
    }

    private connectComponents() {
        const components: Vertex[][] = [];

        // Clear DFS visited flag
        for (const v of this.graph.vertices) {
            v.visited = false;
        }

        // Iterate through all vertices starting DFS from each vertex
        // that hasn't been visited yet.
        for (const v of this.graph.vertices) {
            if (!v.visited) {
                const component: Vertex[] = [];
                const stack: Vertex[] = [v];

                while (stack.length > 0) {
                    const u = stack.pop()!;

                    component.push(u);
                    u.visited = true;
                    u.connections.forEach((e) => {
                        if (!e.visited) {
                            stack.push(e);
                        }
                    });
                }

                components.push(component);
            }
        }

        // Interconnect all center vertices
        if (components.length > 1) {
            const componentCenters: Vertex[] = [];

            for (const component of components) {
                const center = new Vertex(-1, -1, false);

                this.graph.insertVertex(center);

                for (const otherCenter of componentCenters) {
                    this.graph.insertEdge(center, otherCenter);
                }

                componentCenters.push(center);

                for (const v of component) {
                    this.graph.insertEdge(v, center);
                }
            }
        }
    }
}

class FruchtermanLayoutClass {
    private static DEFAULTS = {
        fit: true,
    };

    private layout: any;
    private options: any;

    constructor(layout: any) {
        this.layout = layout;
        this.options = {};

        for (const key of Object.keys(layout.options)) {
            this.options[key] = layout.options[key];
        }

        for (const key of Object.keys(FruchtermanLayoutClass.DEFAULTS)) {
            if (!Object.prototype.hasOwnProperty.call(this.options, key)) {
                this.options[key] = FruchtermanLayoutClass.DEFAULTS[key];
            }
        }
    }

    run() {
        const cy = this.options.cy;
        const width: number = cy.width();
        const height: number = cy.height();
        const graph = new Graph();
        const vertices: Map<string, Vertex> = new Map();
        const elementIds: Set<string> = new Set();

        this.options.eles.each((e) => elementIds.add(e.id()));

        cy.nodes().forEach((node) => {
            let v: Vertex;

            if (elementIds.has(node.id())) {
                v = new Vertex(
                    Math.random() * width,
                    Math.random() * height,
                    false,
                );
            } else {
                v = new Vertex(node.position().x, node.position().y, true);
            }

            vertices.set(node.id(), v);
            graph.insertVertex(v);
        });

        cy.edges().forEach((edge) => {
            graph.insertEdge(
                vertices.get(edge.source().id())!,
                vertices.get(edge.target().id())!,
            );
        });

        const layoutManager = new ForceDirectedVertexLayout(graph);

        layoutManager.layout(width, height, 100);

        cy.nodes().layoutPositions(this.layout, this.options, (node) => {
            const vertex = vertices.get(node.id())!;

            return {
                x: vertex.x,
                y: vertex.y,
            };
        });

        if (this.options.fit) {
            cy.fit();
        }
    }
}

FruchtermanLayout.prototype.run = function () {
    new FruchtermanLayoutClass(this).run();
};
