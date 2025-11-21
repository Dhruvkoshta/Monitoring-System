// types/serial.d.ts

interface SerialPort extends EventTarget {
  onconnect: ((this: SerialPort, ev: Event) => any) | null;
  ondisconnect: ((this: SerialPort, ev: Event) => any) | null;
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;
  open(options: SerialOptions): Promise<void>;
  close(): Promise<void>;
  [Symbol.asyncIterator](): AsyncIterableIterator<SerialPort>;
}

interface SerialOptions {
  baudRate: number;
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd';
  bufferSize?: number;
  flowControl?: 'none' | 'hardware';
}

interface Serial extends EventTarget {
  onconnect: ((this: Serial, ev: Event) => any) | null;
  ondisconnect: ((this: Serial, ev: Event) => any) | null;
  getPorts(): Promise<SerialPort[]>;
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
  [Symbol.asyncIterator](): AsyncIterableIterator<SerialPort>;
}

interface SerialPortRequestOptions {
  filters?: SerialPortFilter[];
}

interface SerialPortFilter {
  usbVendorId?: number;
  usbProductId?: number;
}

interface Navigator {
  serial: Serial;
}
