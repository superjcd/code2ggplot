
import * as GG from "@/ggplot/type";
import { GeomLayer } from "@/ggplot/type";
import { ObservablePlotOptions, MarkerOptions } from "./type";
import * as Plot from "@observablehq/plot";
import { isColor, isNumeric } from "@/lib/utils";
import * as d3 from "d3";
import { html } from "htl";

export function ggplotToObservablePlotOptions(
  ggplot: GG.Ggplot,
  data: Array<Record<string, unknown>>,
  width?: number,
  height?: number,
  theme?: "dark" | "light",
): ObservablePlotOptions {
  data = data.map((row) => {
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, String(value)]),
    );
  });

  data = data.map(d3.autoType);
  const columns: Array<string> = Object.keys(data[0]);

  const config: ObservablePlotOptions = {
    inset: 5,
    height: height ?? 500,
    width: width ?? 1000,
    x: { nice: true },
    y: { nice: true, tickFormat: formatTick },
    color: { legend: true },
    symbol: { legend: true },
    fx: { label: null },
    fy: { label: null },
    facet: { data }, // label: null
    grid: true,
    nice: true,
    marks: [],
    marginBottom: 50,
    marginLeft: 50,
    theme: theme ?? "light",
    style: {},
  };

  let indexCol: string = "";
  if (data[0]) {
    const firstRow = data[0];
    indexCol = Object.keys(firstRow)[0];
  }

  // facets
  let isFlipCoord: boolean = false;

  let facetWrapToGrid = false;
  let facetGridKeys: Array<string> = [];

  let fx: string | ((any) => number) | undefined = ggplot.facetLayer
    ? ggplot.facetLayer.fx
    : undefined;
  let fy: string | ((any) => number) | undefined = ggplot.facetLayer
    ? ggplot.facetLayer.fy
    : undefined;

  if (
    ggplot.facetLayer?.facetType === "facet_wrap" &&
    ggplot.facetLayer?.fx &&
    ggplot.facetLayer?.ncol
  ) {
    facetWrapToGrid = true;

    const n = Number(ggplot.facetLayer.ncol);
    const keys = Array.from(
      d3.union(data.map((d) => d[ggplot.facetLayer?.fx as string])),
    );
    facetGridKeys = keys as Array<string>;
    const keysMap = new Map(keys.map((key, i) => [key, i]));

    if (!keysMap) {
      throw new Error("cant generate facet grid keys");
    }
    

    fx = (key) =>  keysMap.get(key) % n;
    fy = (key) => Math.floor(keysMap.get(key) / n);

    config.facet!.x = (d) => (fx as (any) => number)(d[ggplot.facetLayer?.fx as string]);
    config.facet!.y = (d) => (fy as (any) => number)(d[ggplot.facetLayer?.fx as string]);
  } else {
    config.facet!.x = fx;
    config.facet!.y = fy;
  }

  // plot options
  let interactive = true;
  let style = {};

  if (ggplot.plotOptions) {
    for (const option of ggplot.plotOptions) {
      switch (option.optionType) {
        case "labs":
          config["title"] = option.optionDetails.title
            ? buildHtmlLabelElement("title", option.optionDetails.title)
            : null;
          config["subtitle"] = option.optionDetails.subtitle
            ? buildHtmlLabelElement("subtitle", option.optionDetails.subtitle)
            : null;
          config["caption"] = option.optionDetails.caption
            ? buildHtmlLabelElement("caption", option.optionDetails.caption)
            : null;

          if (option.optionDetails.x) {
            config.x!["label"] = option.optionDetails.x;
          }
          if (option.optionDetails.y) {
            config.y!["label"] = option.optionDetails.y;
          }
          if (option.optionDetails.color || option.optionDetails.fill) {
            config.color!["label"] =
              option.optionDetails.color || option.optionDetails.fill;
          }
          break;
        case "scale_x_log10":
          config.x!["type"] = "log";
          break;
        case "scale_y_log10":
          config.y!["type"] = "log";
          break;
        case "scale_x_reverse":
          config.x!["reverse"] = true;
          break;
        case "scale_y_reverse":
          config.y!["reverse"] = true;
          break;
        case "xlim":
          if (
            isNumeric(option.optionDetails.min) &&
            isNumeric(option.optionDetails.max)
          ) {
            config.x!["domain"] = [
              Number(option.optionDetails.min),
              Number(option.optionDetails.max),
            ];
          }
          break;
        case "ylim":
          if (
            isNumeric(option.optionDetails.min) &&
            isNumeric(option.optionDetails.max)
          ) {
            config.y!["domain"] = [
              Number(option.optionDetails.min),
              Number(option.optionDetails.max),
            ];
          }
          break;
        case "coord_flip":
          isFlipCoord = true;
          break;
        case "layout":
          if (!option.optionDetails) break;
          if (isNumeric(option.optionDetails.marginLeft)) {
            config["marginLeft"] = Number(option.optionDetails.marginLeft);
          }
          if (isNumeric(option.optionDetails.marginRight)) {
            config["marginRight"] = Number(option.optionDetails.marginRight);
          }
          if (isNumeric(option.optionDetails.marginTop)) {
            config["marginTop"] = Number(option.optionDetails.marginTop);
          }
          if (isNumeric(option.optionDetails.marginBottom)) {
            config["marginBottom"] = Number(option.optionDetails.marginBottom);
          }
          if (isNumeric(option.optionDetails.inset)) {
            config["inset"] = Number(option.optionDetails.inset);
          }
          if (isNumeric(option.optionDetails.insetLeft)) {
            config["insetLeft"] = Number(option.optionDetails.insetLeft);
          }
          if (isNumeric(option.optionDetails.insetRight)) {
            config["insetRight"] = Number(option.optionDetails.insetRight);
          }
          if (isNumeric(option.optionDetails.insetTop)) {
            config["insetTop"] = Number(option.optionDetails.insetTop);
          }
          if (isNumeric(option.optionDetails.insetBottom)) {
            config["insetBottom"] = Number(option.optionDetails.insetBottom);
          }
          if (isNumeric(option.optionDetails.margin)) {
            config["margin"] = Number(option.optionDetails.margin);
          }
          if (isNumeric(option.optionDetails.height)) {
            config["height"] = Number(option.optionDetails.height);
          }
          if (isNumeric(option.optionDetails.width)) {
            config["width"] = Number(option.optionDetails.width);
          }
          if (option.optionDetails.showGrid) {
            config["grid"] =
              option.optionDetails.showGrid === "false" ? false : true;
          }
          if (option.optionDetails.showXGrid) {
            config.x!.grid =
              option.optionDetails.showXGrid === "false" ? false : true;
          }
          if (option.optionDetails.showYGrid) {
            config.y!.grid =
              option.optionDetails.showYGrid === "false" ? false : true;
          }
          if (option.optionDetails.showXAxis) {
            if (option.optionDetails.showXAxis === "false") {
              config.x!.axis = null;
            }
          }
          if (option.optionDetails.showYAxis) {
            if (option.optionDetails.showYAxis === "false") {
              config.y!.axis = null;
            }
          }
          if (option.optionDetails.showAxis) {
            if (option.optionDetails.showAxis === "false") {
              config.axis = null;
            }
          }
          if (option.optionDetails.showFrame) {
            if (option.optionDetails.showFrame === "true") {
              config.marks!.push(Plot.frame());
            }
          }
          if (
            option.optionDetails.dualYAxis &&
            option.optionDetails.dualYAxis === "true"
          ) {
            config.dualYAxis = true;
            config.y!.axis = "left";
          }
          if (
            "xAxisPosition" in option.optionDetails &&
            !("xAxisTickRotate" in option.optionDetails)
          ) {
            config.x!.axis =
              option.optionDetails.xAxisPosition === "top" ? "top" : "bottom";
          }
          if (option.optionDetails.yAxisPosition) {
            config.y!.axis =
              option.optionDetails.yAxisPosition === "right" ? "right" : "left";
          }
          if (
            "xAxisTickRotate" in option.optionDetails &&
            isNumeric(option.optionDetails.xAxisTickRotate)
          ) {
            if (hasJitter(ggplot.geomLayers)) {
              config.fx!["tickRotate"] = parseInt(
                option.optionDetails.xAxisTickRotate as string,
              );
            } else {
              // option.optionDetails.xAxisPosition
              config.marks?.push(
                Plot.axisX({
                  anchor:
                    option.optionDetails.xAxisPosition === "top"
                      ? "top"
                      : "bottom",
                  tickRotate: parseInt(option.optionDetails.xAxisTickRotate as string),
                }),
              );
            }
          }
          if (option.optionDetails.showTips) {
            if (option.optionDetails.showTips === "false") {
              interactive = false;
            }
          }
          if (option.optionDetails.showLegend) {
            if (option.optionDetails.showLegend === "false") {
              config.color!["legend"] = false;
              config.color!["legend"] = false;
            }
          }
          if (
            option.optionDetails.xFacetPadding &&
            isNumeric(option.optionDetails.xFacetPadding)
          ) {
            if (parseFloat(option.optionDetails.xFacetPadding) > 1) {
              throw new Error("xFacetPadding should be beteen 0 and 1");
            }
            config.fx!["padding"] = parseFloat(
              option.optionDetails.xFacetPadding,
            );
          }
          if (
            option.optionDetails.yFacetPadding &&
            isNumeric(option.optionDetails.yFacetPadding)
          ) {
            if (parseFloat(option.optionDetails.xFacetPadding!) > 1) {
              throw new Error("yFacetPadding should be beteen 0 and 1");
            }
            config.fy!["padding"] = parseFloat(
              option.optionDetails.yFacetPadding,
            );
          }
          break;
        case "theme":
          if (option.optionDetails.palette) {
            config.color!["scheme"] = option.optionDetails.palette;
          }
          style = option.optionDetails as Partial<CSSStyleDeclaration>;
      }
    }
  }

  // geom layers
  if (!ggplot.geomLayers) {
    throw new Error("No geom layers found");
  }
  for (const [index, layer] of ggplot.geomLayers.entries()) {
    const ggplotLayerAes = layer.aes || {};
    const geomOptions = layer.geomOptions || {};
    const markOptions = getMarkOptions(
      data,
      layer.geomType,
      ggplotLayerAes,
      geomOptions,
      ggplot.plotAes || {},
      interactive,
      indexCol,
      columns,
    );

    switch (layer.geomType) {
      case "geom_auto":
        config.marks!.push(
          Plot.auto(data, {
            ...markOptions,
          }),
        );
        break;
      case "geom_area":
        if ("group_x_stats" in  geomOptions) {
          config.marks!.push(
            Plot.areaY(
              data,
              // @ts-expect-error: expect error
              Plot.groupX(
                { y: geomOptions.group_x_stats! },
                {
                  ...markOptions,
                },
              ),
            ),
          );
        } else {
          config.marks!.push(
            // @ts-expect-error: expect error
            Plot.areaY(data, {
              ...markOptions,
            }),
          );
        }
        break;
      case "geom_col":
        if (isFlipCoord) {
          if ("group_y_stats"  in geomOptions) {
            config.marks!.push(
              Plot.barX(
                data,
                // @ts-expect-error: expect error
                Plot.group(
                  { x: geomOptions.group_y_stats },
                  {
                    ...markOptions,
                    sort: "order_by" in geomOptions
                      ? { y: geomOptions.order_by }
                      : null,
                  },
                ),
              ),
            );
          } else {
            config.marks!.push(
              // @ts-expect-error: expect error
              Plot.barX(data, {
                ...markOptions,
                sort:  "order_by" in geomOptions ? { y: geomOptions.order_by } : null,
              }),
            );
          }
        } else {
          if ("group_x_stats" in geomOptions) {
            config.marks!.push(
              Plot.barY(
                data,
                  // @ts-expect-error: expect error
                Plot.group(
                  { y: geomOptions.group_x_stats },
                  {
                    ...markOptions,
                    sort: "order_by" in geomOptions
                      ? { x: geomOptions.order_by }
                      : null,
                  },
                ),
              ),
            );
          } else {
            config.marks!.push(
              //@ts-expect-error: expect error
              Plot.barY(data, {
                ...markOptions,
                sort: "order_by" in  geomOptions ? { x: geomOptions.order_by } : null,
              }),
            );
          }
        }

        break;
      case "geom_box":
        if (isFlipCoord) {
          config.marks!.push(
            //@ts-expect-error: expect error
            Plot.boxX(data, {
              ...markOptions,
            }),
          );
        } else {
          config.marks!.push(
            //@ts-expect-error: expect error
            Plot.boxY(data, {
              ...markOptions,
            }),
          );
        }
        break;
      case "geom_errorbar":
        if (isFlipCoord) {
          config.marks!.push(
            Plot.ruleY(data, {
              ...markOptions,
            }),
          );
        } else {
          config.marks!.push(
            Plot.ruleX(data, {
              ...markOptions,
            }),
          );
        }
        break;
      // TODO
      case "geom_bin2d":
        config.marks!.push(
          Plot.rect(
            data,
            Plot.bin(
              { fill: "count" }, // stat: count, meam, max
              {
                x: markOptions.x,
                y: markOptions.y,
                thresholds: 100,
              },
            ),
          ),
        );
        break;
      case "geom_smooth":
        config.marks!.push(
          Plot.linearRegressionY(data, {
            ...markOptions,
          }),
        );
        break;
      case "geom_line":
        // To reduce  complexity， support only geom as second Y-axis
        if (
          config.dualYAxis &&
          ggplot.geomLayers.length >= 2 &&
          index === ggplot.geomLayers.length - 1
        ) {

          if (!ggplot.geomLayers[0].aes.y || ggplot.plotAes!.y) {
            throw new Error("no y found in the first geom")
          }
          const v1 = (d) => d[(ggplot.geomLayers![0].aes.y || ggplot.plotAes!.y) as string];

          if (!markOptions.y) {
            throw new Error("no y found in geom_line")
          }
          const v2 = (d) => d[markOptions.y as string];
          const y2 = d3.scaleLinear(d3.extent(data, v2), [0, d3.max(data, v1)]);

          config.marks!.push(
            Plot.axisY(y2.ticks(), {
              anchor: "right",
              label: markOptions.y,
              y: y2,
              tickFormat: formatTick,
            }),
            Plot.lineY(data, {
              ...markOptions,
              ...Plot.mapY((D) => D.map(y2), { x: markOptions.x, y: v2 }),
            }),
          );
        } else {
          if ("window_size" in geomOptions) {
            config.marks!.push(
              Plot.lineY(
                data,
                Plot.windowY(
                  {
                    k: geomOptions.window_size as number,
                    reduce: (geomOptions.window_reduce ??
                      "mean") as Plot.WindowReducerName,
                  },
                  { ...markOptions },
                ),
              ),
            );
          } else {
            config.marks!.push(
              Plot.lineY(data, {
                ...markOptions,
              }),
            );
          }
        }
        break;
      case "geom_text":
        if (isStacked(ggplot.geomLayers)) {
          if (isFlipCoord) {
            config.marks!.push(
              Plot.text(
                data,
                // @ts-expect-error: expect error
                Plot.stackX({ ...markOptions, ...geomOptions, inset: 0.5 }),
              ),
            );
          } else {
            config.marks!.push(
              Plot.text(
                data,
                // @ts-expect-error: expect error
                Plot.stackY({ ...markOptions, ...geomOptions, inset: 0.5 }),
              ),
            );
          }
        } else {
          config.marks!.push(
            Plot.text(data, {
              ...markOptions,
              ...geomOptions,
            }),
          );
        }
        break;
      case "geom_hline":
        if (! ("yintercept" in geomOptions)) {
          throw new Error("yintercept is required for geom_hline");
        }
        config.marks!.push(
          Plot.ruleY([Number(geomOptions.yintercept) ?? 0], {
            stroke: markOptions.stroke,
            opacity: markOptions.opacity,
          }),
        );
        break;
      case "geom_vline":
        if (! ("xintercept" in geomOptions)) {
          throw new Error("xintercept is required for geom_vline");
        }
        config.marks!.push(
          Plot.ruleX([Number(geomOptions.xintercept) ?? 0], {
            stroke: markOptions.stroke,
            opacity: markOptions.opacity,
          }),
        );
        break;
      case "geom_point":
        if (isFlipCoord) {
          config.marks!.push(
            Plot.dotX(data, {
              ...markOptions,
            }),
          );
        } else {
          config.marks!.push(
            Plot.dotY(data, {
              ...markOptions,
            }),
          );
        }
        break;
      case "geom_jitter":
        if (fx || fy) {
          throw new Error("geom_jitter not support facet function");
        }
        if (isFlipCoord) {
          config.marks!.push(
            Plot.dot(
              data,
              Plot.dodgeY("middle", {
                x: markOptions.x,
                fy: markOptions.y,
                stroke: markOptions.color ?? null,
                fill: markOptions.fill,
                r: markOptions.r,
                tip: markOptions.tip,
                channels: markOptions.channels,
              }),
            ),
          );
        } else {
          config.marks!.push(
            Plot.dot(data, {
              ...Plot.dodgeX("middle", {
                fx: markOptions.x,
                y: markOptions.y,
                stroke: markOptions.color,
                fill: markOptions.fill,
                r: markOptions.r,
                tip: markOptions.tip,
                channels: markOptions.channels,
              }),
            }),
          );
        }
        break;
      case "geom_image":
        config.marks!.push(
          Plot.image(data, {
            ...markOptions,
            src: ggplotLayerAes.src,
            r: markOptions.r ? Number(markOptions.r) / 3 : 20,
          }),
        );
        break;
      case "geom_shiftx":
        if ( !("shift" in geomOptions)) {
          throw new Error("geom_shiftx requires shift option");
        }
        config.marks!.push(
          Plot.differenceY(data, {
            positiveFill: "#ef4444",
            negativeFill: "#3b82f6",
            ...Plot.shiftX(geomOptions.shift as Plot.Interval, {
              ...markOptions,
            }),
          }),
        );
        break;
      case "annotate":
        // text
        if (!("type" in geomOptions) || geomOptions.type === "text") {
          if (!("label" in geomOptions)) {
            throw new Error("label is required for annotate");
          }
          if (!geomOptions.x ||  !geomOptions.y) {
            throw new Error("x and y are required for text annotate");
          }
          config.marks!.push(
            Plot.text([geomOptions.label], {
              ...geomOptions,
              x: tryParseAnnotationLoc(geomOptions.x!),
              y: tryParseAnnotationLoc(geomOptions.y!),
              dx: markOptions.dx,
              dy: markOptions.dy,
            }),
          );
        }
        if (geomOptions.type === "arrow") {
          if (!geomOptions.xmin || !geomOptions.xmax || !geomOptions.ymin || !geomOptions.ymax) {
            throw new Error("xmin, xmax, ymin, ymax required for arrow annotation");
          }
          config.marks!.push(
            Plot.arrow(data, {
              x1: tryParseAnnotationLoc(geomOptions.xmin),
              x2: tryParseAnnotationLoc(geomOptions.xmax),
              y1: tryParseAnnotationLoc(geomOptions.ymin),
              y2: tryParseAnnotationLoc(geomOptions.ymax),
              bend: geomOptions.bend === "true" ? true : false,
              strokeWidth: markOptions.strokeWidth
                ? markOptions.strokeWidth
                : 2.5,
            }),
          );
        }
        if (geomOptions.type === "rect") {
          if (!geomOptions.xmin || !geomOptions.xmax || !geomOptions.ymin || !geomOptions.ymax) {
            throw new Error("xmin, xmax, ymin, ymax required for rect annotation");
          }
          config.marks!.push(
            Plot.rect(data, {
              x1: tryParseAnnotationLoc(geomOptions.xmin),
              x2: tryParseAnnotationLoc(geomOptions.xmax),
              y1: tryParseAnnotationLoc(geomOptions.ymin),
              y2: tryParseAnnotationLoc(geomOptions.ymax),
              fill: geomOptions.fill,
              fillOpacity: markOptions.opacity,
              opacity: markOptions.opacity,
              strokeWidth: markOptions.strokeWidth
                ? markOptions.strokeWidth
                : 2.5,
            }),
          );
        }

        break;
      case "geom_ribbon":
        config.marks!.push(
          // @ts-expect-error: expect error
          Plot.areaY(data, {
            ...markOptions,
          }),
        );
        break;
      case "geom_link":
        config.marks!.push(
          Plot.arrow(data, {
            ...markOptions,
            x1: markOptions.x1 ?? 1,
            x2: markOptions.x2 ?? 1,
            y1: markOptions.y1 ?? 1,
            y2: markOptions.y2 ?? 1,
            bend: ("bend" in  geomOptions) && geomOptions.bend === "true" ? true : false,
            strokeWidth: markOptions.strokeWidth
              ? markOptions.strokeWidth
              : 2.5,
          }),
        );
        break;
      case "geom_tree":
        if (!layer.aes.path) {
          throw new Error("geom_tree requires a path column");
        }
        const delimiter = "delimiter" in  geomOptions? geomOptions.delimiter : "/";
        config.marks!.push(
          Plot.tree(data, {
            path: layer.aes.path,
            delimiter: delimiter,
            fill: (d) => (!d ? 0 : d[markOptions.fill]),
          }),
        );
        break;
      case "geom_cell":
        if ("group_stats" in geomOptions) {
          config.marks!.push(
            Plot.cell(
              data,
              // @ts-expect-error: expect error
              Plot.group(
                { fill: geomOptions.group_stats },
                {
                  ...markOptions,
                  inset: 0.5,
                },
              ),
            ),
          );
        } else {
          config.marks!.push(
            // @ts-expect-error: expect error
            Plot.cell(data, {
              ...markOptions,
              inset: 0.5,
            }),
          );
        }
        break;
    }
  }

  // add facet grid labels
  if (facetWrapToGrid) {
    config.marks!.push(
      Plot.text(facetGridKeys, {
        fx,
        fy,
        frameAnchor: "top-left",
        fontWeight: "bold",
        dx: 6,
        dy: 6,
      }),
    );
  }

  // default styles
  config.style = resetStyleByTheme(theme) as Partial<CSSStyleDeclaration>; 

  if (style) {
    config.style = { ...config.style, ...style };
  }
  return config;
}

export function resetStyleByTheme(theme: "dark" | "light" | undefined) : Partial<CSSStyleDeclaration>{
  if (!theme) return {};
  return {
    fontFamily: "sans-serif",
    fontSize: "14px",
    border: "1px solid #333",
    backgroundColor: theme === "dark" ? "#333" : "#fff",
    color: theme === "dark" ? "#fff" : "#333",
  };
}

function getMarkOptions(
  data: any[],
  geomType: GG.GeomType,
  layerAes: GG.GeomAes,
  geomOptions: GG.GeomOptions,
  ggplotAes: GG.PlotAes,
  interactive: boolean,
  indexCol: string,
  dataColumns: Array<string>,
): MarkerOptions {
  const markOptions = {} as MarkerOptions;
  if (layerAes.size || ("size" in geomOptions ) || ggplotAes.size) {
    if (("size" in geomOptions ) && isNumeric(geomOptions?.size)) {
      if (["geom_point", "geom_image", "geom_jitter"].includes(geomType)) {
        markOptions.r = Number(geomOptions?.size) * 3;
      } else {
        markOptions.strokeWidth = Number(geomOptions?.size);
      }
    } else {
      if (!dataColumns.includes(layerAes.size as string ?? ggplotAes.size as string)) {
        throw new Error("`size` should either be a number or a column name");
      }
      markOptions.r = layerAes.size ?? ggplotAes.size;
    }
  }
  if (layerAes.color || ("color" in geomOptions)  || ggplotAes.color) {
    if (("color" in geomOptions)  && isColor(geomOptions.color!)) {
      markOptions.stroke = geomOptions?.color;
    } else {
      markOptions.stroke = layerAes.color || ggplotAes.color;
    }
    if (geomType === "geom_auto" && ("color" in geomOptions) && geomOptions.color === "count") {
      markOptions.color = "count";
    }
  }
  if (layerAes.fill || "fill" in geomOptions || ggplotAes.fill) {
    if (( "fill" in geomOptions) && isColor(geomOptions.fill!)) {
      markOptions.fill = geomOptions?.fill;
    } else {
      if (!dataColumns.includes(layerAes.fill ?? ggplotAes.fill as string)) {
        throw new Error(
          "`fill` should either be a valid color or a column name",
        );
      }
      markOptions.fill = layerAes.fill ?? ggplotAes.fill;
    }
  }
  if (layerAes.shape || ggplotAes.shape) {
    if (!dataColumns.includes(layerAes.shape ?? ggplotAes.shape as string)) {
      throw new Error("`shape` should be a column name");
    }
    markOptions.symbol = layerAes.shape || ggplotAes.shape;
  }
  if (layerAes.x || ggplotAes.x) {
    if (!dataColumns.includes(layerAes.x ?? ggplotAes.x as string)) {
      throw new Error(
        `${layerAes.x || ggplotAes.x} not found in the data, can't use it as x-axis`,
      );
    }
    markOptions.x = layerAes.x || ggplotAes.x;
  }
  if (layerAes.y || ggplotAes.y) {
    if (!dataColumns.includes(layerAes.y ?? ggplotAes.y as string)) {
      throw new Error(
        `${layerAes.y || ggplotAes.y} not found in the data, can't use it as y-axis`,
      );
    }
    markOptions.y = layerAes.y || ggplotAes.y;
  }
  if (layerAes.ymin) {
    if (!dataColumns.includes(layerAes.ymin)) {
      throw new Error(`${layerAes.ymin} not found in the data`);
    }
    markOptions.y1 = layerAes.ymin;
  }
  if (layerAes.ymax) {
    if (!dataColumns.includes(layerAes.ymax as string)) {
      throw new Error(`${layerAes.ymax} not found in the data`);
    }
    markOptions.y2 = layerAes.ymax;
  }
  if (layerAes.xmin) {
    if (!dataColumns.includes(layerAes.xmin)) {
      throw new Error(`${layerAes.xmin} not found in the data`);
    }
    markOptions.x1 = layerAes.xmin;
  }
  if (layerAes.xmax) {
    if (!dataColumns.includes(layerAes.xmax)) {
      throw new Error(`${layerAes.xmax} not found in the data`);
    }
    markOptions.x2 = layerAes.xmax;
  }

  if ("alpha"  in geomOptions) {
    if (["geom_line", "geom_link"].includes(geomType)) {
      try {
        markOptions.strokeOpacity = Number(geomOptions.alpha);
      } catch {
        markOptions.strokeOpacity = 1;
      }
    } else {
      try {
        markOptions.opacity = Number(geomOptions.alpha);
      } catch {
        markOptions.opacity = 1;
      }
    }
  }
  if (layerAes.label) {
    if (!dataColumns.includes(layerAes.label)) {
      throw new Error(`${layerAes.label} not found in the data`);
    }
    markOptions.text = layerAes.label;
  }

  if ("nudge_x" in geomOptions) {
    try {
      markOptions.dx = Number(geomOptions?.nudge_x);
    } catch {
      markOptions.dx = 0;
    }
  }
  if ("nudge_y" in geomOptions) {
    try {
      markOptions.dy = -Number(geomOptions?.nudge_y);
    } catch {
      markOptions.dy = 0;
    }
  }

  if ("offset" in geomOptions) {
    if (["normalize", "wiggle", "center"].includes(geomOptions.offset as string)) {
      markOptions.offset = geomOptions.offset;
    } else {
      throw new Error(
        "`offset` should be one of `normalize`, `wiggle`, `center`",
      );
    }
  }

  if (interactive) {
    markOptions.tip = true;
    markOptions.channels = { [indexCol]: indexCol };
  }

  markOptions.filter = getFilter({
    data,
    dataColumns,
    sample_ratio: "sample_ratio" in geomOptions? geomOptions.sample_ratio : undefined,
    filter_by:  "filter_by" in geomOptions?  geomOptions.filter_by : undefined,
  });

  return markOptions;
}

const formatTick = (d: any): string => {
  if (!isNumeric(d)) {
    return d;
  }

  const absValue = Math.abs(d);
  let formattedValue: string;

  if (absValue >= 1_000_000_000) {
    formattedValue = `${(absValue / 1_000_000_000).toFixed(1)}b`;
  } else if (absValue >= 1_000_000) {
    formattedValue = `${(absValue / 1_000_000).toFixed(1)}m`;
  } else if (absValue >= 1_000) {
    formattedValue = `${(absValue / 1_000).toFixed(1)}k`;
  } else {
    formattedValue = `${absValue}`;
  }
  return d < 0 ? `-${formattedValue}` : formattedValue;
};

function tryParseAnnotationLoc(value: string): Date | number | string {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateRegex.test(value)) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  const num = Number(value);
  if (!isNaN(num)) {
    return num;
  }

  return value;
}

interface filterOptions {
  data: Array<Record<string, unknown>>;
  dataColumns: Array<string>;
  sample_ratio?: number | undefined;
  filter_by?: string | undefined;
}

function getFilter({
  data,
  dataColumns,
  sample_ratio,
  filter_by,
}: filterOptions) {
  if (filter_by) {
    if (!dataColumns.includes(filter_by)) {
      throw new Error(`${filter_by} is not a column in the data`);
    }
    return filter_by;
  }
  if (sample_ratio && isNumeric(sample_ratio)) {
    return sampleRatioFilter(data, sample_ratio);
  }
  return null;
}

function sampleRatioFilter(
  data: Array<any>,
  ratio: number,
  seed: number = 1024,
) {
  if (ratio <= 0 || ratio > 1) {
    throw new Error(
      "Invalid sample ratio. sample ratio must be between 0 and 1",
    );
  }
  const sampleSize = Math.floor(data.length * ratio);
  const randomIndices = new Set<number>();

  // Linear Congruential Generator (LCG) parameters
  const m = 0x80000000; // 2**31
  const a = 1103515245;
  const c = 12345;

  let state = seed;

  function random() {
    state = (a * state + c) % m;
    return state / m;
  }

  while (randomIndices.size < sampleSize) {
    const randomIndex = Math.floor(random() * data.length);
    randomIndices.add(randomIndex);
  }

  return (d: unknown, i: number) => randomIndices.has(i);
}

function buildHtmlLabelElement(
  type: "title" | "subtitle" | "caption",
  text: string,
): string {
  if (type === "title") {
    return html`<h3 style=${{ fontFamily: "NotoSansSC" }}>${text}</h3>`;
  }
  if (type === "subtitle") {
    return html`<p style=${{ color: "slategray", fontFamily: "NotoSansSC" }}>
      ${text}
    </p>`;
  }
  if (type === "caption") {
    return html`<p
      style=${{
        fontSize: "10px",
        color: "slategray",
        textAlign: "center",
        whiteSpace: "pre-wrap",
        overflowWrap: "break-word",
        maxWidth: "100%",
        fontFamily: "NotoSansSC",
      }}
    >
      ${text}
    </p>`;
  }
  return text;
}
function isStacked(geomLayers: GeomLayer[] | undefined): boolean {
  if (!geomLayers) return false;
  for (const layer of geomLayers) {
    if (["geom_area", "geom_col"].includes(layer.geomType) && layer.aes.fill) {
      return true;
    }
  }
  return false;
}

function hasJitter(geomLayers: GeomLayer[] | undefined): boolean {
  if (!geomLayers) return false;
  for (const layer of geomLayers) {
    if (layer.geomType === "geom_jitter") {
      return true;
    }
  }
  return false;
}
