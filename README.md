# ElectricIPC

ElectricIPC is an extension to the Electron framework. It extends the Electron IPC solution and enables easy shareable classes.

## Usage

### Create a service which extends `ElectricIPC`

```typescript
export class SampleIPCService extends ElectricIPC {
    // Sample private declarations
    private identifier: number;

    // Make sure to declare window as optional
    public constructor(window?: BrowserWindow) {
        // Here you can add methods
        // you don't want to share
        // with the renderer.
        super(window, 'init'/*, 'and', 'more', 'methods'*/)
    }

    public init(min: number, max: number): void {
        this.identifier = Math.floor(Math.random() * (max - min + 1) + min);
    }

    public getIdentifier(): number {
        return this.identifier;
    }
}
```

### Create an instance of the service in the main process

```typescript
app.on('ready', () => {
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });
    new SampleIPCService(window).init(1, 100);
}));
```

### Create an instance of the service in the renderer process and use methods

```typescript
const service = new SampleIPCService();
console.log(service.getIdentifier());
```

## Promises

This library also supports Promises. Just write a function in your service and return a `Promise<T>`.
