import * as Plot from "@observablehq/plot";

export interface ObservablePlotOptions extends Plot.PlotOptions {
  provider?: "Observable";
  dualYAxis?: boolean;
  theme?: "dark" | "light";
}


export interface MarkerOptions {
    r?: number | string;
    strokeWidth?: number;
    stroke?: string;
    color?:string;
    fill?: string;
    symbol?: string;
    x?: string;
    y?: string;
    y1?: string;
    y2?: string;
    x1?: string;
    x2?: string;
    strokeOpacity?: number;
    opacity?: number;
    dx?: number;
    dy?: number;
    offset?: string;
    tip?: boolean;
    channels?: { [key: string]: string };
    filter?: any;
    text?: string;
  }
  