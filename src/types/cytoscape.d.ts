// Type declarations for Cytoscape and extensions

declare module 'cytoscape-cola' {
  import cytoscape from 'cytoscape';
  const cola: cytoscape.Ext;
  export = cola;
}

// Extend cytoscape layout options for cola
declare namespace cytoscape {
  interface LayoutOptions {
    nodeSpacing?: number;
    edgeLength?: number;
    randomize?: boolean;
    convergenceThreshold?: number;
  }
}
