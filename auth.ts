import { Model } from './model';
import { injectable, inject } from "inversify";
import * as passport from 'passport';
import * as passportFacebook from 'passport-facebook';
import * as express from 'express';
import { NextFunction, Request, Response, Router } from "express";
import * as JWT from 'jsonwebtoken';
import * as path from 'path';
@injectable()
export class Auth {
    private successRedirect: string;
    private failurRedirect: string;
    constructor( @inject(Model.name) private model: Model) {
    };


    generateJWT(userFacebookProfileId: string) {
        return new Promise((resolve, reject) => {
            JWT.sign(
                {
                    id: userFacebookProfileId
                },
                new Buffer('아무거나 쓰세요', 'base64').toString(),
                {
                    expiresIn: 60 * 60 * 24
                },
                (err, token) => {
                    if (err) reject(err)
                    resolve(token)
                })
        })
    }


    init(authProvider: string, app: express.Application) {
        if (authProvider === 'facebook') {
            let options: passportFacebook.IStrategyOption;
            options = {
                // clientID: <string>process.env.FACEBOOK_ID,
                // clientSecret: <string>process.env.FACEBOOK_SECRET,
                // callbackURL: <string>process.env.FACEBOOK_CALLBACK_URL,
            }
            let strategy: passport.Strategy = new passportFacebook.Strategy(options, (accessToken, refreshToken, profile, done) => {
                // 여기서의 user.id 는 페이스북에서 제공하는 account id 이다. 
                this.model.getAuthWithFaceBook(profile.id)
                    .then((result: any) => {
                        if (result.length === 1) {
                            let user: any = profile;
                            console.log(((result[0]).name) + "connected ! ");
                            this.generateJWT(profile.id)
                                .then((token) => {
                                    user.token = token
                                    return done(null, user);
                                })

                        } else if (result.length < 1) {
                            console.log("로그인상 문제가 있음 조건에 맞는 유저가 없음");
                            return done("해당 되는 유저를 찾을 수 없음 , 관리자에게 문의 요망! ", null);
                        } else {
                            console.log("유저중복! ")
                            return done("유저가 중복되었음 , 관리자에게 문의 요망! ", null);
                        }
                    })
                    .catch(err => console.log(err));
                // done을 안해주면 다음 단계로 넘어가질 못한다. 
            });
            passport.use(strategy);
        };
        // passport가 세션에 passport의 이름으로 저장하는 값을 의미한다. user id만 저장.
        passport.serializeUser((user: any, done) => {
            done(null, authProvider + " : " + user.id);
        });
        // //passport가 세션에서 가져온 값을 첫번째 매개변수에 전달한다. 
        passport.deserializeUser((id, done) => {
            done(null, id);
        });
        app.use(passport.initialize());
        // app.use(passport.session());
        // passport.authenticate를 통해 facebook oauth에 요청한다.
        // (로그인이 안되어있다면 로그인페이지를 보여주며, 로그인 결과를 지정된 callback url로 redirect한다)
        app.get('/auth/facebook', passport.authenticate(authProvider, { session: false }));
        app.get(
            '/auth/facebook/callback',
            passport.authenticate(authProvider, {
                failureRedirect: '/'
            }),
            (req: any, res, next) => {
                // passport
                let token = req.user.token
                // res.setHeader('Set-Cookie', `token=${token};Max-Age=21474836;Path=/;Secure;HttpOnly`)
                res.setHeader('Set-Cookie', `token=${token};Max-Age=21474836;Path=/;HttpOnly`)
                res.send("토큰이 잘 생성되었음")
            }
        );

        app.use((req: any, res, next) => {
            const token = req.cookies.token
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'not logged in'
                })
            }
            new Promise((resolve, reject) => {
                JWT.verify(token, new Buffer('아무거나 쓰세요', 'base64').toString(), (err: any, decoded: string) => {
                    if (err) reject(err)
                    resolve(decoded)
                })
            })
                .then((decoded) => {
                    req.decoded = decoded
                    next();
                })
                .catch((err) => {
                    res.status(401).send(err)

                })
        })
    };
};
