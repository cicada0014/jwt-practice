import { Model } from './model';
import { injectable, inject } from "inversify";
import { controller, httpGet, httpPut, httpDelete } from 'inversify-express-utils';

import { NextFunction, Request, Response, Router } from "express";
@injectable()
@controller('/hello')
export class ExampleController {

    constructor( @inject(Model.name) private model: Model) {

    }

    @httpGet('/world')
    public helloWorld(req: Request, res: Response, next: NextFunction) {
        res.send(this.model.value + 'world!')
    }

}

