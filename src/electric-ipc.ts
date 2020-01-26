import { ipcMain, ipcRenderer } from 'electron';

export class ElectricIPC {
  private readonly _propertyNamesToIgnore: string[] = [
    'constructor',
    'addPropertyNameToIgnore',
    'setupMainListener',
    'setupRendererListener',
  ];
  private _prototype: any;

  protected constructor(...propertyNamesToIgnore: string[]) {
    this._propertyNamesToIgnore.push(...propertyNamesToIgnore);

    this._prototype = Object.getPrototypeOf(this);
    const funcNameRegex = /function (.{1,})\(/;
    const results = funcNameRegex.exec(this.constructor.toString());
    this._prototype.name = results && results.length > 1 ? results[1] : '';
    const propertyNames = Object.getOwnPropertyNames(this._prototype);

    for (const propertyName of propertyNames) {
      if (this._propertyNamesToIgnore.includes(propertyName)) {
        continue;
      }
      const property = this._prototype[propertyName];
      if (typeof property !== 'function') {
        continue;
      }
      const name = this._prototype.name + '.' + propertyName;
      if (process && process.type !== 'renderer') {
        this.setupMainListener(name, (...args: any[]) => this[propertyName](...args));
      } else {
        this._prototype[propertyName] = (args: any[]) => ipcRenderer.invoke(name, args);
      }
    }
  }

  private setupMainListener(key: string, cb: (...args: any[]) => Promise<void | any>): void {
    ipcMain.handle(key, async (_event, args) => {
      let data: void | any;
      try {
        data = await cb(args);
      } catch (e) {}
      return data;
    });
  }
}
