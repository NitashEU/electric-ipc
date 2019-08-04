import { BrowserWindow, ipcMain, ipcRenderer } from 'electron';
import * as uuid from 'uuid';

export class ElectricIPC {
  private readonly _propertyNamesToIgnore: string[] = [
    'constructor',
    'addPropertyNameToIgnore',
    'setupMainListener',
    'setupRendererListener',
  ];
  private _prototype: any;

  protected constructor(private _window?: BrowserWindow, ...propertyNamesToIgnore: string[]) {
    this._propertyNamesToIgnore.push(...propertyNamesToIgnore);

    this._prototype = Object.getPrototypeOf(this);
    const propertyNames = Object.getOwnPropertyNames(this._prototype);

    for (const propertyName of propertyNames) {
      if (this._propertyNamesToIgnore.includes(propertyName)) {
        continue;
      }
      const property = this._prototype[propertyName];
      if (typeof property !== 'function') {
        continue;
      }
      if (_window) {
        this.setupMainListener(propertyName, (...args: any[]) => this[propertyName](...args));
      } else {
        this._prototype[propertyName] = (args: any[]) => this.setupRendererListener(propertyName, args);
      }
    }
  }

  private setupMainListener(key: string, cb: (...args: any[]) => Promise<void | any>): void {
    const idLessTopic = this._prototype.name + '.' + key;

    ipcMain.on(idLessTopic, async (_event: unknown, id: string, args: any[]) => {
      let data: void | any;

      try {
        data = await cb(...args);
      } catch (e) {}

      this._window.webContents.send(idLessTopic + id, data);
    });
  }

  private setupRendererListener(key: string, ...args: any[]): Promise<any | void> {
    return new Promise<any | void>((resolve, reject) => {
      try {
        const id = uuid.v4();
        const idLessTopic = this._prototype.name + '.' + key;
        const listener = (_event: unknown, value: any) => {
          ipcRenderer.removeListener(idLessTopic + id, listener);
          return resolve(value);
        };
        ipcRenderer.on(idLessTopic + id, listener);
        ipcRenderer.send(idLessTopic, id, args);
      } catch (err) {
        reject(err);
      }
    });
  }
}
