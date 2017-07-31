import { injectable } from "inversify";
@injectable()
export class Model {
    public value: string;
    constructor() {
        this.value = "hello";
    }


    getAuthWithFaceBook(profileId: string) {
        return new Promise((resolve, reject) => {
            resolve([{ name: 'joy' }])
        })
    }

}
