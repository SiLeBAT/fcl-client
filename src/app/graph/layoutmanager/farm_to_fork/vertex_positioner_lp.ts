import * as _ from 'lodash';
import {Graph, Vertex, Edge} from './data_structures';
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
      */
      //const solver = new Solver();
      //const result = solver.Solve(model);
      /*const lpModel: LPModel = new LPModel();
      lpModel.setObjective('max', {'brit': 20000, 'yank': 30000});
      lpModel.addConstraint(44, {'brit': 1, 'yank': 1});
      lpModel.addConstraint(512, {'brit': 8, 'yank': 16});
      lpModel.addConstraint(300000, {'brit': 5000, 'yank': 9000});*/
      const lpModel: LPModel = this.constructLPModel(layers);
      
      const lpResult: LPResult = lpSolve(lpModel);
      //console.clear();
      lpModel.printObjective();
      lpModel.printConstraints(lpResult);
      
      const nLayers: number = layers.length;
      const layerDistance: number = width/(1.0 + (nLayers-1));
      //const vertexDistance: number = height*0.9/Math.max(...(layers.map(layer => {return layer.length})));
      const bottomMargin = 0.0; //height*0.05;
      const rightMargin = 0.0; //layerDistance/2;
      const maxSize: number = lpResult.vars.get('maxSize');
      const scale: number = height/maxSize;

      let x: number = rightMargin;
      for(let layer of layers) {
        let y: number = bottomMargin;
        for(let vertex of layer) {
          const solverValue: number = lpResult.vars.get('P' + vertex.index.toString());
          vertex.y = (isNaN(solverValue)?Math.random()*maxSize:solverValue*scale);
          vertex.x = x;
          //y+= vertexDistance;
        }
        x-=layerDistance;
      }
    }
    
    constructLPModel(layers: Vertex[][]): LPModel {
      const lpModel = new LPModel();
      
      lpModel.setObjective('min', {});
      this.addNeighbourRankLinkConstraints(lpModel, layers);
      this.addPositionConstraints(lpModel, layers);
      this.addSlopeConstraints(lpModel, layers);

      return lpModel;
    }
    
    addPositionConstraints(lpModel: LPModel, layers: Vertex[][]) {
      for(let layer of layers) if(layer.length>0) {
        let constraint: Object = {};
        constraint['P' + layer[0].index.toString()] = -1; //pos>=0 // Min position boundary of layer
        lpModel.addConstraint('MinPosL' + layer[0].layerIndex.toString(), 0,constraint);
        
        // add miniDistances between neighbours
        for(let iV: number = 1, nV: number = layer.length; iV<nV; iV++) {
          const vertex: Vertex = layer[iV];
          const vertexPrecessor: Vertex = layer[iV-1];
          const minDistance: number = this.getMinVertexDistance(vertexPrecessor, vertex);
          constraint = {};
          constraint['P'+ vertex.index.toString()] = -1;
          constraint['P' + vertexPrecessor.index.toString()] = 1;
          lpModel.addConstraint('VerDis' + vertexPrecessor.index.toString() + '_' + vertex.index.toString(), -minDistance, constraint);
        }
        // link maxSize with position of last element 
        lpModel.addConstraint('MaxPosL' + layer[0].layerIndex.toString(), 0, {"maxSize": -1, ['P' + layer[layer.length-1].index.toString()]: 1});
      }
      lpModel.setObjectiveCoefficient('maxSize',1);
    }
    
    addSlopeConstraints(lpModel: LPModel, layers: Vertex[][]) {
      const DS_PENALTY: number = 10;
      for(const layer of layers) for(const vertex of layer) {
        if(!vertex.isVirtual || vertex.inEdges[0].source.isVirtual) continue;
        
        const nonVirtualSource = vertex.inEdges[0].source;
        const [nonVirtualTarget,spanTarget] = this.getNonVirtualTarget(vertex);
        const layerSpan: number = 1 + spanTarget;
        
        let edge: Edge = vertex.inEdges[0];
        while(edge) {
          let constraint: Object = {};
          constraint['P'+nonVirtualSource.index.toString()] = 1.0/layerSpan;
          constraint['P'+nonVirtualTarget.index.toString()] = -1.0/layerSpan;
          if(edge.source===nonVirtualSource)  constraint['P'+edge.source.index.toString()] = constraint['P'+edge.source.index.toString()] - 1;
          else constraint['P'+edge.source.index.toString()] = -1;
          
          if(edge.target===nonVirtualTarget)  constraint['P'+edge.target.index.toString()] = constraint['P'+edge.target.index.toString()] + 1;
          else constraint['P'+edge.target.index.toString()] = 1;
          constraint['DS' + nonVirtualSource.index.toString() + '_' + nonVirtualTarget.index.toString()] = -1;
          lpModel.addConstraint('Slope' + edge.source.index.toString() + '>' + edge.target.index.toString() + '_DS' + nonVirtualSource.index.toString() + '_' + nonVirtualTarget.index.toString() + '>=local-global', 0, constraint);
          
          this.multiplyConstraintWithMinusOne(constraint);
          constraint['DS' + nonVirtualSource.index.toString() + '_' + nonVirtualTarget.index.toString()] = -1;
          lpModel.addConstraint('Slope' + edge.source.index.toString() + '>' + edge.target.index.toString() + '_DS'+ nonVirtualSource.index.toString() + '_' + nonVirtualTarget.index.toString() + '>=global-local', 0, constraint);

          if(!edge.target.isVirtual) edge = null;
          else edge = edge.target.outEdges[0];
        }
        let constraint: Object = {};
        lpModel.addConstraint('DS' + nonVirtualSource.index.toString() + '_' + nonVirtualTarget.index.toString() + ' DS>=Source-target', 0, {['DS' + nonVirtualSource.index.toString() + '_' + nonVirtualTarget.index.toString()]: -1, ['P'+nonVirtualSource.index.toString()]: -1, ['P'+nonVirtualTarget.index.toString()]: 1});
        lpModel.addConstraint('DS' + nonVirtualSource.index.toString() + '_' + nonVirtualTarget.index.toString() + ' DS>=Target-Source', 0, {['DS' + nonVirtualSource.index.toString() + '_' + nonVirtualTarget.index.toString()]: -1, ['P'+nonVirtualSource.index.toString()]: 1, ['P'+nonVirtualTarget.index.toString()]: -1});
        lpModel.setObjectiveCoefficient('DS' + nonVirtualSource.index.toString() + '_' + nonVirtualTarget.index.toString(), DS_PENALTY);
      }
    }
    
    multiplyConstraintWithMinusOne(constraint: Object) {
      for(let key of Object.getOwnPropertyNames(constraint)) constraint[key] = -constraint[key];
    }
    
    addNeighbourRankLinkConstraints(lpModel: LPModel, layers: Vertex[][]) {
      const VERTEX_DISTANCE_PENALTY: number = 1;
      
      for(let layer of layers) for(const vertex of layer) {
        if(vertex.isVirtual) continue;

        let totalWeight: number = 0.0;
        let constraint: Object = {}; 
        // d_vertex >= p_vertex - sum_n_(p_n*w_n)
        for(let edge of vertex.inEdges) {
          let source: Vertex = edge.source;
          let span: number = 1;
          if(source.isVirtual) [source, span] = this.getNonVirtualSource(source);
          
          constraint['P'+source.index.toString()] = -edge.weight;
          totalWeight+= edge.weight;
        }
        
        for(let edge of vertex.outEdges) {
          let target: Vertex = edge.target;
          let span: number = 1;
          if(target.isVirtual) [target, span] = this.getNonVirtualTarget(target);
          constraint['P'+target.index.toString()] = -edge.weight;
          totalWeight+= edge.weight;
        }
        for(let key of Object.getOwnPropertyNames(constraint)) {
          const oldValue: number = constraint[key];
          constraint[key] = constraint[key]/totalWeight;
          const newValue: number = constraint[key];
        }
        constraint['P'+vertex.index.toString()] = 1;
        constraint['D'+vertex.index.toString()] = -1;
        lpModel.addConstraint('InterLayPosLink' + vertex.index.toString() + 'D>=P-wSoN', 0, constraint);
        for(let key of Object.getOwnPropertyNames(constraint)) constraint[key] = -constraint[key];
        constraint['D'+vertex.index.toString()] = -1;
        lpModel.addConstraint('InterLayPosLink' + vertex.index.toString() + 'D>=wSoN-P', 0, constraint);
        
        lpModel.setObjectiveCoefficient('D'+vertex.index.toString(), totalWeight);
      }
    }
    
    getNonVirtualTarget(vertex: Vertex): [Vertex, number] {
      let result: Vertex = vertex.outEdges[0].target;
      let span: number = 2;
      while(result.isVirtual) {
        result = result.outEdges[0].target;
        span++;
      } 
      return [result, span];
    }
    
    getNonVirtualSource(vertex: Vertex): [Vertex, number] {
      let result: Vertex = vertex.inEdges[0].source;
      let span: number = 2;
      while(result.isVirtual) {
        result = result.inEdges[0].source;
        span++;
      } 
      return [result, span];
    }
    
    getMinVertexDistance(vertexA: Vertex, vertexB: Vertex): number {
      const MIN_SIBLING_DIST: number = 1;
      const MIN_NONSIBLING_DIST: number = 4;
      const MIN_NODE_TO_EDGE_DIST: number = 2;
      const MIN_EDGE_TO_EDGE_DIST: number = 1;
      
      if(vertexB.isVirtual) {
        if(vertexA.isVirtual) return MIN_EDGE_TO_EDGE_DIST;
        else return MIN_NODE_TO_EDGE_DIST;
      } else {
        if(vertexA.isVirtual) return MIN_NODE_TO_EDGE_DIST;
        if(this.shareVerticesAParent(vertexA, vertexB)) return MIN_SIBLING_DIST;
        return MIN_NONSIBLING_DIST;
      }
    }
    
    shareVerticesAParent(vertexA: Vertex, vertexB: Vertex): boolean {
      return _.intersection(vertexA.inEdges.map(e => e.source.index), vertexB.inEdges.map(e => e.source.index)).length>0;
    }
  }