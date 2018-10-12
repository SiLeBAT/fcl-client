import {Graph, Vertex} from './data_structures';
import {BusinessTypeRanker} from './business_type_ranker';
//import {Solver} from 'javascript-lp-solver';
import {lpSolve, LPModel, LPResult} from './lp_solver';

export function positionVertices(layers: Vertex[][], width: number, height: number) {
  let vertexPositioner: VertexPositionerLP = new VertexPositionerLP();
  vertexPositioner.positionVertices(layers, height, width);
}

class VertexPositionerLP {
  
  constructor() {}
  
  positionVertices(layers: Vertex[][], width: number, height: number) {
    
    /*const model = {
      "optimize" : "objective",
      "opType": "max"
    }*/
    
    /*const model = {
      "optimize": "profit",
      "opType": "max",
      "constraints": {
        "wood": {"max": 300},
        "labor": {"max": 110},
        "storage": {"max": 400}
      },
      "variables": {
        "table": {"wood": 30, "labor": 5, "profit": 1200, "table": 1, "storage": 30},
        "dresser": {"wood": 20, "labor": 10, "profit": 1600, "dresser": 1, "storage": 50}
      },
      "ints": {"table": 1, "dresser": 1}
    }*/
    const model = {
      "optimize": "capacity",
      "opType": "max",
      "constraints": {
          "plane": {"max": 44},
          "person": {"max": 512},
          "cost": {"max": 300000}
      },
      "variables": {
          "brit": {
              "capacity": 20000,
              "plane": 1,
              "person": 8,
              "cost": 5000
          },
          "yank": {
              "capacity": 30000,
              "plane": 1,
              "person": 16,
              "cost": 9000
          }
        }};

    //const solver = new Solver();
    //const result = solver.Solve(model);
    const lpModel: LPModel = new LPModel();
    lpModel.setObjective('max', {'brit': 20000, 'yank': 30000});
    lpModel.addConstraint(44, {'brit': 1, 'yank': 1});
    lpModel.addConstraint(512, {'brit': 8, 'yank': 16});
    lpModel.addConstraint(300000, {'brit': 5000, 'yank': 9000});
  
    const lpResult: LPResult = lpSolve(lpModel);
    
    const nLayers: number = layers.length;
    const layerDistance: number = width/nLayers;
    const vertexDistance: number = height*0.9/Math.max(...(layers.map(layer => {return layer.length})));
    const bottomMargin = height*0.05;
    const rightMargin = layerDistance/2;
    
    let x: number = rightMargin;
    for(let layer of layers) {
      let y: number = bottomMargin;
      for(let vertex of layer) {
        vertex.y = y;
        vertex.x = x;
        y+= vertexDistance;
      }
      x-=layerDistance;
    }
  }

  constructLPModel(layers: Vertex[][], height: number) {
    const MIN_SIBLING_DIST: number = 1;
    const MIN_NONSIBLING_DIST: number = 4;
    const MIN_NODE_TO_EDGE_DIST: number = 2;
    const MIN_EDGE_TO_EDGE_DIST: number = 1;

    //const lpModel = new lpModel();

  }
}