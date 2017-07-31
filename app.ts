import 'reflect-metadata';
import { Auth } from './auth';
import { Model } from './model'
import { ExampleController } from './controller';
import { Container } from 'inversify';
import { interfaces, InversifyExpressServer, TYPE } from 'inversify-express-utils';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
export class Server {
    private app: express.Application;
    private PORT: any = process.env.PORT || 3000;
    private server: InversifyExpressServer;
    private container: Container;
    constructor() {
        this.container = new Container();
        this.container.bind(TYPE.Controller).to(ExampleController)
        this.container.bind(Model.name).to(Model)
        this.container.bind(Auth.name).to(Auth)
        this.server = new InversifyExpressServer(this.container);
        this.server.setConfig((app) => {
            // 서버 세팅을 해준다 미들웨어나 라우터를 지정해준다 
            app.use(bodyParser.urlencoded({ extended: true }));
            app.use(bodyParser.json());
            app.use(cookieParser());
            this.container.get<Auth>((Auth.name)).init('facebook', app);
            app.use('/check', (req: any, res, next) => {
                res.send(req.decoded)
            });
        })
        this.app = this.server.build();
        this.app.listen(this.PORT, () => {
            console.log(`Listening at http://localhost:${this.PORT}/`);
        });
    }
    public static bootstrap(): Server { return new Server() }
}
// 서버시작
Server.bootstrap();