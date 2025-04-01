// import { CSSProperties } from "react";

export interface Ggplot {
  plotData?: string;
  plotAes?: PlotAes;
  geomLayers?: GeomLayer[];
  facetLayer?: FacetLayer;
  plotOptions?: PlotOption[];
}

export interface PlotAes {
  x?: string;
  y?: string;
  color?: string;
  fill?: string;
  shape?: string;
  size?: string;
  src?: string;
  alpha?: number;
}

export interface GeomLayer {
  geomType: GeomType;
  aes: GeomAes;
  geomOptions: GeomOptions;
}

export interface GeomAes {
  x?: string;
  y?: string;
  color?: string;
  fill?: string;
  shape?: string;
  size?: string;
  src?: string;
  alpha?: string;
  label?: string;
  ymin?: string;
  ymax?: string;
  xmin?: string;
  xmax?: string;
  path?: string;
}

export type GeomType =
  | "geom_area"
  | "geom_col"
  | "geom_box"
  | "geom_ribbon"
  | "geom_bin2d"
  | "geom_hex"
  | "geom_smooth"
  | "geom_line"
  | "geom_rect"
  | "geom_text"
  | "geom_hline"
  | "geom_vline"
  | "geom_image"
  | "geom_point"
  | "geom_auto"
  | "geom_jitter"
  | "geom_shiftx"
  | "geom_cell"
  | "geom_link"
  | "geom_errorbar"
  | "geom_tree"
  | "annotate";

export type GeomOptions =
  | InterceptGeomOptions
  | ShiftGeomOptions
  | AreaGeomoptions
  | AnnotationGeomOptions
  | LineGeomOptions
  | ColGeomOptions
  | TreeGeomOptions;

interface GeneralGeomOptions {
  color?: string;
  fill?: string;
  shape?: string;
  size?: string;
  alpha?: number;
  nudge_x?: number;
  nudge_y?: number;
  sample_ratio?: number;
  filter_by?: string;
}

interface LineGeomOptions extends GeneralGeomOptions {
  window_size?: number;
  window_reduce?: GroupStats;
}

interface ColGeomOptions extends GeneralGeomOptions {
  order_by?: "x" | "y";
}

interface TreeGeomOptions extends GeneralGeomOptions {
  delimiter?: string;
}

export interface InterceptGeomOptions {
  xintercept?: number;
  yintercept?: number;
}

export interface ShiftGeomOptions extends GeneralGeomOptions {
  shift?: string;
}

export interface AreaGeomoptions extends GeneralGeomOptions {
  offset?: string;
  group_stats?: GroupStats;
  group_x_stats?: GroupStats;
  group_y_stats?: GroupStats;
}

type AnnotationGeomOptions =
  | TextAnnotationGeomOptions
  | ArrowAnnotationGeomOptions
  | RectAnnotationGeomOptions;

interface TextAnnotationGeomOptions {
  type?: "text";
  x?: string;
  y?: string;
  label?: string;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  fontColor?: string;
  textAnchor?: "start" | "middle" | "end";
}

interface ArrowAnnotationGeomOptions {
  type: "arrow";
  ymin?: string;
  ymax?: string;
  xmin?: string;
  xmax?: string;
  bend?: string;
}

export interface RectAnnotationGeomOptions {
  type: "rect";
  fill?: string;
  xmin?: string;
  xmax?: string;
  ymin?: string;
  ymax?: string;
}

export interface FacetLayer {
  facetType: "facet_grid" | "facet_wrap";
  fx?: string;
  fy?: string;
  ncol?: number;
}

export type PlotOptionType =
  | "labs"
  | "xlim"
  | "ylim"
  | "scale_x_log10"
  | "scale_y_log10"
  | "scale_x_reverse"
  | "scale_y_reverse"
  | "coord_flip"
  | "layout"
  | "theme";

export type PlotOption =
  | { optionType: "labs"; optionDetails: LabsOption }
  | { optionType: "xlim" | "ylim"; optionDetails: LimitOption }
  | { optionType: "layout"; optionDetails: LayoutOption }
  | { optionType: "theme"; optionDetails: ThemeOption }
  | {
      optionType:
        | "scale_x_log10"
        | "scale_y_log10"
        | "scale_x_reverse"
        | "scale_y_reverse"
        | "coord_flip";
      optionDetails: null;
    };

export type OptionDetails = {
  [key: string]: string;
};

export interface LabsOption {
  title?: string;
  subtitle?: string;
  caption?: string;
  x?: string;
  y?: string;
  color?: string;
  fill?: string;
}

export interface LimitOption {
  min?: number;
  max?: number;
}

export interface LayoutOption {
  width?: number;
  height?: number;
  margin?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  marginBottom?: number;
  inset?: number;
  insetLeft?: number;
  insetRight?: number;
  insetTop?: number;
  insetBottom?: number;
  showGrid?: "true" | "false";
  showXGrid?: "true" | "false";
  showYGrid?: "true" | "false";
  showFrame?: "true" | "false";
  showAxis?: "true" | "false";
  showXAxis?: "true" | "false";
  showYAxis?: "true" | "false";
  dualYAxis?: "true" | "false";
  xAxisPosition?: "bottom" | "top";
  xAxisTickRotate?: string;
  yAxisPosition?: "left" | "right";
  showTips?: "true" | "false";
  showLegend?: "true" | "false";
  xFacetPadding?: string;
  yFacetPadding?: string;
}

// reference: https://observablehq.com/plot/transforms/group
type GroupStats =
  | "first"
  | "last"
  | "count"
  | "sum"
  | "proportion"
  | "proportion-facet"
  | "min"
  | "max"
  | "mean"
  | "median"
  | "mode"
  | "variance";

export interface ThemeOption extends Partial<CSSStyleDeclaration> {
  palette?:
    | SequentialSingleHueScheme
    | SequentialMultiHueScheme
    | SequentialCyclicScheme
    | CategoryScheme;
}

type SequentialSingleHueScheme =
  | "Blues"
  | "Greens"
  | "Greys"
  | "Oranges"
  | "Purples"
  | "Reds";

type SequentialMultiHueScheme =
  | "BuGn"
  | "BuPu"
  | "GnBu"
  | "OrRd"
  | "PuBuGn"
  | "PuBu"
  | "PuRd"
  | "RdPu"
  | "YlGnBu"
  | "YlOrRd"
  | "YlGn"
  | "YlOrBr"
  | "Turbo"
  | "Viridis"
  | "Magma"
  | "Inferno"
  | "Plasma"
  | "Cividis"
  | "Cubehelix"
  | "Warm"
  | "Cool";

type SequentialCyclicScheme = "Rainbow" | "Sinebow";

type CategoryScheme =
  | "Accent"
  | "Dark2"
  | "Paired"
  | "Pastel1"
  | "Pastel2"
  | "Set1"
  | "Set2"
  | "Set3"
  | "Category10"
  | "Tableau10";
