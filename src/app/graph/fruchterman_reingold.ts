export function FruchtermanLayout(options) {
  this.options = options;
}

FruchtermanLayout.prototype.run = function () {
  new FruchtermanLayoutClass(this).run();
};

class FruchtermanLayoutClass {

  private static DEFAULTS = {
    fit: true
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
      if (!this.options.hasOwnProperty(key)) {
        this.options[key] = FruchtermanLayoutClass.DEFAULTS[key];
      }
    }
  }

  run() {
    const cy = this.options.cy;
    const width = cy.width();
    const height = cy.height();
    const graph = new Graph();
    const vertices = new Map();

    cy.nodes().forEach(function (node) {
      const v = new Vertex(Math.random() * width, Math.random() * height);

      vertices.set(node.id(), v);
      graph.insertVertex(v);
    });

    cy.edges().forEach(function (edge) {
      Graph.insertEdge(vertices.get(edge.source().id()), vertices.get(edge.target().id()));
    });

    const layoutManager = new ForceDirectedVertexLayout(width, height, 100);

    layoutManager.layout(graph);

    cy.nodes().layoutPositions(this.layout, this.options, function (i, node) {
      const vertex = vertices.get(node.id());

      return {
        x: vertex.x,
        y: vertex.y
      };
    });

    if (this.options.fit) {
      cy.fit();
    }
  }
}

class Graph {
  vertices: Vertex[] = [];

  static insertEdge(vertex1: Vertex, vertex2: Vertex) {
    const e1 = new Edge(vertex2);
    const e2 = new Edge(vertex1);

    vertex1.edges.push(e1);
    vertex2.reverseEdges.push(e2);

    return e1;
  }

  insertVertex(vertex: Vertex) {
    this.vertices.push(vertex);
  }
}

class Vertex {
  edges: Edge[] = [];
  reverseEdges: Edge[] = [];
  x: number;
  y: number;
  dx = 0;
  dy = 0;
  fixed = false;
  visited: boolean;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

class Edge {
  endVertex: Vertex;

  constructor(endVertex: Vertex) {
    this.endVertex = endVertex;
  }
}


class ForceDirectedVertexLayout {

  width: number;
  height: number;
  iterations: number;

  constructor(width: number, height: number, iterations: number) {
    this.width = width;
    this.height = height;
    this.iterations = iterations;
  }

  identifyComponents(graph: Graph) {
    const components = [];

    // Depth first search
    function dfs(vertex: Vertex) {
      const stack: Vertex[] = [];
      const component: Vertex[] = [];

      components.push(component);

      function visitVertex(v: Vertex) {
        component.push(v);
        v.visited = true;

        for (const e of v.edges) {
          stack.push(e.endVertex);
        }

        for (const e of v.reverseEdges) {
          stack.push(e.endVertex);
        }
      }

      visitVertex(vertex);
      while (stack.length > 0) {
        const u = stack.pop();

        if (!u.visited) {
          visitVertex(u);
        }
      }
    }

    // Clear DFS visited flag
    for (const v of graph.vertices) {
      v.visited = false;
    }

    // Iterate through all vertices starting DFS from each vertex
    // that hasn't been visited yet.
    for (const v of graph.vertices) {
      if (!v.visited) {
        dfs(v);
      }
    }

    // Interconnect all center vertices
    if (components.length > 1) {
      const componentCenters = [];

      for (const component of components) {
        const center = new Vertex(-1, -1);

        graph.insertVertex(center);

        for (const otherCenter of componentCenters) {
          Graph.insertEdge(center, otherCenter);
        }

        componentCenters.push(center);

        for (const v of component) {
          Graph.insertEdge(v, center);
        }
      }
    }
  }

  layout(graph: Graph) {
    const area = this.width * this.height;
    const k = Math.sqrt(area / graph.vertices.length);

    let t = this.width / 10; // Temperature.
    const dt = t / (this.iterations + 1);

    const eps = 20; // Minimum vertex distance.
    const A = 1.5; // Fine tune attraction.
    const R = 0.5; // Fine tune repulsion.

    // Initiate component identification and virtual vertex creation
    // to prevent disconnected graph components from drifting too far apart
    this.identifyComponents(graph);

    // Run through some iterations
    for (let q = 0; q < this.iterations; q++) {

      /* Calculate repulsive forces. */
      for (const v of graph.vertices) {
        v.dx = 0;
        v.dy = 0;
        // Do not move fixed vertices
        if (!v.fixed) {
          for (const u of graph.vertices) {
            if (v !== u && !u.fixed) {
              /* Difference vector between the two vertices. */
              const difx = v.x - u.x;
              const dify = v.y - u.y;

              /* Length of the dif vector. */
              const d = Math.max(eps, Math.sqrt(difx * difx + dify * dify));
              const force = R * k * k / d;
              v.dx = v.dx + (difx / d) * force;
              v.dy = v.dy + (dify / d) * force;
            }
          }
        }
      }

      /* Calculate attractive forces. */
      for (const v of graph.vertices) {
        // Do not move fixed vertices
        if (!v.fixed) {
          for (const e of v.edges) {
            const u = e.endVertex;
            const difx = v.x - u.x;
            const dify = v.y - u.y;
            const d = Math.max(eps, Math.sqrt(difx * difx + dify * dify));
            const force = A * d * d / k;

            v.dx = v.dx - (difx / d) * force;
            v.dy = v.dy - (dify / d) * force;

            u.dx = u.dx + (difx / d) * force;
            u.dy = u.dy + (dify / d) * force;
          }
        }
      }

      /* Limit the maximum displacement to the temperature t
       and prevent from being displaced outside frame.     */
      for (const v of graph.vertices) {
        if (!v.fixed) {
          /* Length of the displacement vector. */
          const d = Math.max(eps, Math.sqrt(v.dx * v.dx + v.dy * v.dy));

          /* Limit to the temperature t. */
          v.x = Math.round(v.x + (v.dx / d) * Math.min(d, t));
          v.y = Math.round(v.y + (v.dy / d) * Math.min(d, t));
        }
      }

      /* Cool. */
      t -= dt;
    }
  }
}
