import * as ggplot from "./type";
import { parser, treeToJSObject } from "./languageParser";
import { removeQuotesFromEdges } from "@/lib/utils";

export default function toGgplot(content: string): ggplot.Ggplot {
  const tree = parser.parse(content);
  const ast = treeToJSObject(tree.cursor());
  const ggplotObj = ast.children.find((x) => x.type === "Ggplot");
  const plotData = parsePlotData(ggplotObj, content);
  const plotAes = parsePlotAes(ggplotObj, content);

  const geomLayerList = ast.children.filter((x) => x.type === "GeomLayer");
  const geomLayers = parseGeomLayers(geomLayerList, content);

  const facetLayerObj = ast.children.find((x) => x.type === "FacetLayer");
  const facetLayer = parseFacetLayer(facetLayerObj, content);

  const plotOptionList = ast.children.filter((x) => x.type === "PlotOption");
  const plotOptions = parsePlotOptions(plotOptionList, content);
  return {
    plotData,
    plotAes,
    geomLayers,
    facetLayer,
    plotOptions,
  };
}

function parsePlotData(ggplotObj: any, src: string): string | undefined {
  const dataIdentifier = ggplotObj.children.find(
    (x) => x.type === "DataIdentifier",
  );

  if (dataIdentifier) {
    return src.slice(dataIdentifier.from, dataIdentifier.to);
  }
  return undefined;
}

function parsePlotAes(ggplotObj: any, src: string): ggplot.PlotAes | undefined {
  const aesMapping = ggplotObj.children.find((x) => x.type === "AesMapping");
  if (aesMapping) {
    return parsAesMapping(aesMapping, src) as ggplot.PlotAes;
  }
  return undefined;
}

function parseGeomLayers(
  geomLayers: any[],
  src: string,
): ggplot.GeomLayer[] | undefined {
  const layers = [] as ggplot.GeomLayer[];
  if (geomLayers) {
    for (const layer of geomLayers) {
      const geomType = layer.children.find((x) => x.type === "GeomType");
      const geomAesObj = layer.children.find((x) => x.type === "AesMapping");
      const geomOptionList = layer.children.filter((x) => x.type === "Option"); // TODO: fix alpha:0.5
      const geomAes = parsAesMapping(geomAesObj, src);
      const geomOptions = parseGeomOptions(geomOptionList, src);
      layers.push({
        geomType: src.slice(geomType.from, geomType.to) as ggplot.GeomType,
        aes: geomAes as ggplot.GeomAes,
        geomOptions,
      });
    }

    return layers;
  }

  return undefined;
}

function parsAesMapping(
  aesMapping: any,
  src: string,
): ggplot.PlotAes | ggplot.GeomAes | undefined {
  const result = {} as ggplot.PlotAes | ggplot.GeomAes;
  if (aesMapping) {
    const aesPairList = aesMapping.children.find(
      (x) => x.type === "AesPairList",
    );
    if (aesPairList) {
      for (const aesPair of aesPairList.children) {
        const aseKey = src.slice(
          aesPair.children[0].from,
          aesPair.children[0].to,
        );
        const aesValue = src.slice(
          aesPair.children[1].from,
          aesPair.children[1].to,
        );
        result[aseKey] = aesValue;
      }
    }
    return result;
  }
  return undefined;
}

function parseGeomOptions(optionList: any[], src: string) {
  const result = {} as ggplot.GeomOptions;
  if (optionList) {
    for (const option of optionList) {
      const optionType = option.children[0];
      const optionValue = option.children[1];
      result[src.slice(optionType.from, optionType.to)] = removeQuotesFromEdges(
        src.slice(optionValue.from, optionValue.to),
      );
    }
  }

  return result;
}

function parseFacetLayer(
  layerObj: any,
  src: string,
): ggplot.FacetLayer | undefined {
  const result = {} as ggplot.FacetLayer;

  if (layerObj) {
    const facetTypeObj = layerObj.children.find((x) => x.type === "FacetType");
    if (
      ["facet_wrap", "facet_grid"].includes(
        src.slice(facetTypeObj.from, facetTypeObj.to),
      )
    ) {
      // @ts-expect-error: expect error
      result.facetType = src.slice(facetTypeObj.from, facetTypeObj.to);
    }

    const facetExpressionObj = layerObj.children.find(
      (x) => x.type === "FacetExpression",
    );

    if (facetExpressionObj) {
      const formula = facetExpressionObj.children.find(
        (x) => x.type === "FacetFormula",
      );
      if (formula) {
        const expression: string = src.slice(formula.from, formula.to);
        const tildaIndex = expression.indexOf("~");
        const left = expression.slice(0, tildaIndex);
        if (left && left != ".") {
          result.fx = left;
        }
        const right = expression.slice(tildaIndex + 1);
        if (right && right != ".") {
          result.fy = right;
        }
      }
      const facetOptions = facetExpressionObj.children.filter(
        (x) => x.type === "Option",
      );

      if (facetOptions) {
        for (const option of facetOptions) {
          const optionType = option.children[0];
          const optionValue = option.children[1];
          result[src.slice(optionType.from, optionType.to)] =
            removeQuotesFromEdges(src.slice(optionValue.from, optionValue.to));
        }
      }
    }
    return result;
  }
  return undefined;
}

function parsePlotOptions(
  optionList: any[],
  src: string,
): ggplot.PlotOption[] | undefined {
  const options = [] as ggplot.PlotOption[];

  if (optionList) {
    for (const option of optionList) {
      const optionTypeObj = option.children.find(
        (x) => x.type === "PlotOptionType",
      );
      const optionType = src.slice(optionTypeObj.from, optionTypeObj.to);
      const optionPairList = option.children.find(
        (x) => x.type === "PlotOptionPairList",
      );
      if (
        optionType === "labs" ||
        optionType === "layout" ||
        optionType === "theme"
      ) {
        const optionDetails = parseOptionDetails(optionPairList?.children, src);
        options.push({
          optionType: optionType,
          optionDetails: optionDetails as ggplot.OptionDetails,
        });
      } else if (optionType === "xlim" || optionType === "ylim") {
        const optionDetails = parseLimitOption(optionPairList.children, src);
        options.push({
          optionType: optionType,
          optionDetails: optionDetails,
        });
      } else if (
        optionType === "scale_x_log10" ||
        optionType === "scale_y_log10" ||
        optionType === "scale_x_reverse" ||
        optionType === "scale_y_reverse"
      ) {
        options.push({
          optionType: optionType,
          optionDetails: null,
        });
      } else if (optionType === "coord_flip") {
        options.push({
          optionType: optionType,
          optionDetails: null,
        });
      }
    }

    return options;
  }

  return undefined;
}

function parseOptionDetails(
  optionPairList: any,
  src: string,
): ggplot.OptionDetails | undefined {
  const result = {} as ggplot.OptionDetails;
  if (optionPairList) {
    for (const pair of optionPairList) {
      const optionKey = src.slice(pair.children[0].from, pair.children[0].to);
      const optionValue = src.slice(pair.children[1].from, pair.children[1].to);
      result[optionKey] = removeQuotesFromEdges(optionValue);
    }
    return result;
  }
  return undefined;
}

function parseLimitOption(
  optionPairList: any,
  src: string,
): ggplot.LimitOption {
  const result: ggplot.LimitOption = {};

  if (optionPairList.length !== 2) {
    return result;
  }
  
  const minStr = src.slice(optionPairList[0].from, optionPairList[0].to);
  const maxStr = src.slice(optionPairList[1].from, optionPairList[1].to);

  const min = parseFloat(minStr);
  const max = parseFloat(maxStr);
  
  return {
    min: isNaN(min) ? undefined : min,
    max: isNaN(max) ? undefined : max,
  };
}
