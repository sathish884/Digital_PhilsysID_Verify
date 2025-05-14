declare module '@tensorflow-models/facemesh' {
    const facemesh: {
      load: (config?: any) => Promise<any>;
    };
    export = facemesh;
  }