/// <reference types="react" />

declare module "*.svg?raw" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare namespace React {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "md-filled-button": any;
      "md-filled-tonal-button": any;
      "md-linear-progress": any;
      "md-switch": any;
    }
  }
}
