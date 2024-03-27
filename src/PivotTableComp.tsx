import {
  Dropdown,
  UICompBuilder,
  NameConfig,
  NumberControl,
  Section,
  withDefault,
  withExposingConfigs,
  withMethodExposing,
  dropdownControl,
  eventHandlerControl,
  styleControl,
  toJSONArray,
  toJSONObjectArray,
  BoolControl,
  jsonControl,
  AutoHeightControl,
  EditorContext,
} from "lowcoder-sdk";

import { isEmpty } from 'lodash';

import { useResizeDetector } from "react-resize-detector";

import styles from "./styles.module.css";

import { i18nObjs, trans } from "./i18n/comps";

import { RendererNameOptions, AggregatorNameOptions } from "./Constants";

import { useState, useEffect } from "react";

import Plotly from "react-plotly.js";

import {
  PivotTableUI,
  PivotTable,
  createPlotlyRenderers,
  TableRenderers,
} from "@imc-trading/react-pivottable";

import "@imc-trading/react-pivottable/pivottable.css";

const PlotlyRenderers = createPlotlyRenderers(Plotly); // or createPlotlyRenderers(window.Plotly)


export const CompStyles = [
  {	
    name: "margin",	
    label: trans("style.margin"),
    margin: "margin",	
  },
  {	
    name: "padding",	
    label: trans("style.padding"),
    padding: "padding",	
  },
  {	
    name: "textSize",
    label: trans("style.textSize"),
    textSize: "textSize",	
  },
  {	
    name: "backgroundColor",
    label: trans("style.backgroundColor"),
    backgroundColor: "backgroundColor",	
  },
  {	
    name: "border",
    label: trans("style.border"),
    border: "border",	
  },
  {
    name : "radius",
    label : trans("style.borderRadius"),
    radius : "radius",
  },
  {
    name : "borderWidth",
    label : trans("style.borderWidth"),
    borderWidth : "borderWidth",
  }
] as const;

let PivotTableCompBase = (function () {

  const childrenMap = {
    styles: styleControl(CompStyles),
    autoHeight: withDefault(AutoHeightControl, "auto"),
    data: jsonControl(toJSONArray, i18nObjs.defaultData),
    rendererName: dropdownControl(RendererNameOptions, 'Table'),
    aggregatorName: dropdownControl(AggregatorNameOptions, 'Count'),
    cols: jsonControl(toJSONArray, []),
    rows: jsonControl(toJSONArray, []),
    vals: jsonControl(toJSONArray, []),
    hiddenAttributes: jsonControl(toJSONArray, []),
    hiddenFromAggregators: jsonControl(toJSONArray, []),
    hiddenFromDragDrop: jsonControl(toJSONArray, []),
    readOnly: withDefault(BoolControl, false),
    onEvent: eventHandlerControl([
      {
        label: "onChange",
        value: "change",
        description: "Triggers when pivot data changes",
      },
    ] as const),
  };
  
  return new UICompBuilder(childrenMap, (props: {
    onEvent: any;
    styles: { backgroundColor: any; border: any; radius: any; borderWidth: any; margin: any; padding: any; textSize: any; };
    data: any[] | null | undefined;
    rendererName: any;
    aggregatorName: any;
    cols: any;
    rows: any;
    vals: any;
    hiddenAttributes: any;
    hiddenFromAggregators: any;
    hiddenFromDragDrop: any;
    readOnly: any;
    autoHeight: boolean;
  }) => {


  // Max dimensions of container enclosing the PivotTable
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  // Restrict pivot container if external container changes
  const { width, height, ref: conRef } = useResizeDetector({onResize: () =>{
    const container = conRef.current;
    if(!container || !width || !height) return;

    // If props set to autoheight, only change width
    if(props.autoHeight) {
      setDimensions({
        width,
        height: dimensions.height, // leave as is
      });
      return;
    }

    setDimensions({
      width,
      height,
    });
  }});

  const [pivotState, setPivotState] = useState({});
  const [plotlyOptions, setPlotlyOptions] = useState({
    width: 450
  });

  useEffect(() => {
    setPivotState({
      data: props.data,
      rendererName: pivotState.rendererName || props.rendererName,
      aggregatorName: pivotState.aggregatorName || props.aggregatorName,
      cols: isEmpty(pivotState.cols) ? props.cols :  pivotState.cols,
      rows: isEmpty(pivotState.rows) ? props.rows :  pivotState.rows,
      vals: isEmpty(pivotState.vals) ? props.vals :  pivotState.vals,
      hiddenAttributes: isEmpty(pivotState.hiddenAttributes) ? props.hiddenAttributes :  pivotState.hiddenAttributes,
      hiddenFromAggregators: isEmpty(pivotState.hiddenFromAggregators) ? props.hiddenFromAggregators :  pivotState.hiddenFromAggregators,
      hiddenFromDragDrop: isEmpty(pivotState.hiddenFromDragDrop) ? props.hiddenFromDragDrop :  pivotState.hiddenFromDragDrop,
    });
  }, [props.data]);

  useEffect(() => {
    setPivotState({
      ...pivotState,
      rendererName: props.rendererName,
      aggregatorName: props.aggregatorName,
      cols: props.cols,
      rows: props.rows,
      vals: props.vals,
      hiddenAttributes: props.hiddenAttributes,
      hiddenFromAggregators: props.hiddenFromAggregators,
      hiddenFromDragDrop: props.hiddenFromDragDrop,
    })
  }, [
    props.rendererName,
    props.aggregatorName,
    props.cols,
    props.rows,
    props.vals,
    props.hiddenAttributes,
    props.hiddenFromAggregators,
    props.hiddenFromDragDrop,
  ]);
  
  useEffect(() => {
    let outWidth = dimensions.width;
    if (conRef.current) {
      let outputElements = conRef.current.getElementsByClassName('pvtRenderers');
      if (!isEmpty(outputElements)) {
        outWidth -= outputElements[0].clientWidth;
      }
      outputElements = conRef.current.getElementsByClassName('pvtVals');
      if (!isEmpty(outputElements)) {
        outWidth -= outputElements[0].clientWidth;
      }
    }
    setPlotlyOptions({
      width: outWidth,
    })
  }, [dimensions])

  return (
    <div ref={conRef} className={styles.wrapper} style={{
      height: `100%`,
      width: `100%`,
      backgroundColor: `${props.styles.backgroundColor}`,
      borderColor: `${props.styles.border}`,
      borderRadius: `${props.styles.radius}`,
      borderWidth: `${props.styles.borderWidth}`,
      margin: `${props.styles.margin}`,
      padding: `${props.styles.padding}`,
      fontSize: `${props.styles.textSize}`,
      justifyContent: 'flex-start',
    }}>
      <div style={{
        maxWidth: `${dimensions.width}px`,
        overflow: `auto`,
        ...(  props.autoHeight ?
            {} : {
                  maxHeight: `${dimensions.height}px`,
                })}}
        className={styles.pvtWrapper}>
      { props.readOnly ? 
        <PivotTable
            data={props.data}
            onChange={s => {
              setPivotState(s);
              props.onEvent("change");
            }}
            renderers={Object.assign({}, TableRenderers, PlotlyRenderers)}
            plotlyOptions={plotlyOptions}
            {...pivotState}
        />
      :
        <PivotTableUI
            data={props.data}
            onChange={s => {
              setPivotState(s);
              props.onEvent("change");
            }}
            renderers={Object.assign({}, TableRenderers, PlotlyRenderers)}
            plotlyOptions={plotlyOptions}
            {...pivotState}
        />
      }
      </div>
    </div>
  );
})
.setPropertyViewFn((children: any) => {
  return (
    <>
      <Section name="Basic">
        {children.data.propertyView({ label: "Data" })}
        <Dropdown
          value={children.rendererName.getView()}
          options={RendererNameOptions}
          label="Renderer"
          onChange={(value) => {
            children.rendererName.dispatchChangeValueAction(value);
          }}
        />
        <Dropdown
          value={children.aggregatorName.getView()}
          options={AggregatorNameOptions}
          label="Aggregator"
          onChange={(value) => {
            children.aggregatorName.dispatchChangeValueAction(value);
          }}
        />
        {children.cols.propertyView({ label: "Columns" })}
        {children.rows.propertyView({ label: "Rows" })}
        {children.vals.propertyView({ label: "Values" })}
        {children.hiddenAttributes.propertyView({ label: "Hidden attributes" })}
        {children.hiddenFromAggregators.propertyView({ label: "Hidden from aggregators" })}
        {children.hiddenFromDragDrop.propertyView({ label: "Hidden from drag & drop" })}
        {children.readOnly.propertyView({ label: "Read only" })}
      </Section>
      <Section name="Interaction">
        {children.onEvent.propertyView()}
      </Section>
      <Section name="Styles">
        {children.autoHeight.getPropertyView()}
        {children.styles.getPropertyView()}
      </Section>
    </>
  );
})
.build();
})();

PivotTableCompBase = class extends PivotTableCompBase {
  autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};

// PivotTableCompBase = withMethodExposing(PivotTableCompBase, [
//   {
//     method: {
//       name: "setPoint",
//       description: trans("methods.setPoint"),
//       params: [{
//         name: "data",
//         type: "JSON",
//         description: "JSON value"
//       }],
//     },
//     execute: (comp: any, values: any[]) => {
//       const point = values[0] as Point;
//       if(typeof point !== 'object') {
//         return Promise.reject(trans("methods.invalidInput"))
//       }
//       if(!point.id) {
//         return Promise.reject(trans("methods.requiredField", { field: 'ID' }));
//       }
//       if(!point.x) {
//         return Promise.reject(trans("methods.requiredField", { field: 'X position' }));
//       }
//       const data = comp.children.data.getView(); 
//       const newData = [
//         ...data,
//         point,
//       ];
//       comp.children.data.dispatchChangeValueAction(JSON.stringify(newData, null, 2));
//     }
//   },
// ]);

export default withExposingConfigs(PivotTableCompBase, [
  new NameConfig("data", trans("component.data")),
]);
