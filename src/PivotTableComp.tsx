import {
  UICompBuilder,
  NameConfig,
  NumberControl,
  Section,
  withDefault,
  withExposingConfigs,
  withMethodExposing,
  eventHandlerControl,
  styleControl,
  toJSONArray,
  toJSONObjectArray,
  jsonControl,
  AutoHeightControl,
  EditorContext,
} from "lowcoder-sdk";
import { useResizeDetector } from "react-resize-detector";

import styles from "./styles.module.css";

import { i18nObjs, trans } from "./i18n/comps";

// import exampleData from "./example"

import PivotTableUI from 'react-pivottable/PivotTableUI';
import 'react-pivottable/pivottable.css';
import TableRenderers from 'react-pivottable/TableRenderers';
import Plot from 'react-plotly.js';
import createPlotlyRenderers from 'react-pivottable/PlotlyRenderers';

const PlotlyRenderers = createPlotlyRenderers(Plot);

import { useState, useEffect } from "react";


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
    data: jsonControl(toJSONArray, i18nObjs),
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
  useEffect(() => {
    setPivotState({
      data: props.data
    })
  }, [props.data]);

  const [plotlyOptions, setPlotlyOptions] = useState({
    width: 450
  });
  
  useEffect(() => {
    setPlotlyOptions({
      width: dimensions.width - 300,
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
    }}>
      <div style={{
        ...(  props.autoHeight ?
            {} : {
                  maxWidth: `${dimensions.width}px`,
                  maxHeight: `${dimensions.height}px`,
                  minHeight: `450px`,
                  overflow: `auto`,
                })}}>
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
      </div>
    </div>
  );
})
.setPropertyViewFn((children: any) => {
  return (
    <>
      <Section name="Basic">
        {children.data.propertyView({ label: "Data" })}
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
