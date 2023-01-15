import * as path from "path";
import * as fs from "fs";
import {app} from "electron";
class Store {
    public addUserPath: string = app.getPath('userData')

    public data: any = {}
    constructor() {
        // Renderer process has to get `app` module via `remote`, whereas the main process can get it directly
        // app.getPath('userData') will return a string of the user's app data directory path.
        const userDataPath = path;
        // We'll use the `configName` property to set the file name and path.join to bring it all together as a string

    }

    // This will just return the property on the `data` object
    public get(key:string) {
        if (!this.data[key]) {
            let filename = this.addUserPath + '\\' + 'accounts_' + key + '.json';
            if (fs.existsSync(filename)) {
                this.data[key] = parseDataFile(filename, {})
            } else {
                this.data[key] = [];
                fs.writeFileSync(filename, JSON.stringify(this.data[key]))
            }
        }
        return this.data[key] || [];
    }

    // ...and this will set it
    public set(key:string, val:any) {
        let filename = this.addUserPath + '\\' + 'accounts_' + key + '.json';
        if (key.includes('undefined')) return
        this.data[key] = val;

        fs.writeFileSync(filename, JSON.stringify(this.data[key]));
    }

}

function parseDataFile(filePath:string, defaults:any) {
    // We'll try/catch it in case the file doesn't exist yet, which will be the case on the first application run.
    // `fs.readFileSync` will return a JSON string which we then parse into a Javascript object
    try {
        return JSON.parse(fs.readFileSync(filePath).toString());
    } catch(error) {
        return defaults;
    }
}

// expose the class
export default new Store();