import * as Solver from 'javascript-lp-solver';

export function lpSolve(model: LPModel): LPResult {
  //var solver = require("javascript-lp-solver");
  const tmp = Solver;
  /*for(let prop of Solver) {
    console.log(prop);
  }*/
  let result: any = tmp.Solve(model.getModel());
  //const result: any = solver.solve(model);
  //const result = null;
  return new LPResult(result, model);
}

export class LPModel {
  private variables: String[];
  private model: any = {'variables': {}, 'constraints': {}, 'optimize': 'objective'};
  private constraintCount: number = 0;

  constructor() {}
  
  addConstraint(b: number, constraint: Object) {
    const constId = (++this.constraintCount).toString();
    this.model['constraints'][constId] = {'max': b};
    for (const varName of Object.getOwnPropertyNames(constraint)) {
      if(!this.model['variables'].hasOwnProperty(varName)) this.model['variables'][varName] = {};
      this.model['variables'][varName][constId] = constraint[varName];
    }
  }
  setObjective(opType: String, objective: Object) {
    //this.model['optimize'] = 'objective';
    this.model['opType'] = opType;
    for (const varName of Object.getOwnPropertyNames(objective)) {
      if(!this.model['variables'].hasOwnProperty(varName)) this.model['variables'][varName] = {};
      this.model['variables'][varName]['objective'] = objective[varName];
    }
  }
  getModel(): any {
    return this.model;
  }

  getVariableNames(): String[] {
   return  Object.getOwnPropertyNames(this.model['variables']);
  }
}

export class LPResult {
  feasible: boolean;
  bounded: boolean;
  objective: number;
  vars: Map<String, number>;
  constructor(result: any, lpModel: LPModel) {
    this.feasible = result['feasible'];
    this.bounded = result['bounded'];
    this.objective = result['result'];
    this.vars = new Map();
    for(const varName of lpModel.getVariableNames()) {
      this.vars.set(varName, result[varName.toString()]);
    }
  }
}