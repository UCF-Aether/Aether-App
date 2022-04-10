import { ResponsiveLine, Serie } from "@nivo/line";
import { useCallback } from "react";
import { LayerData, LayerResult, LayerType, useLayers } from "../hooks/layers";
import { Panel } from "./panels/Panel";
import { Error } from "./Error";
import { Skeleton } from "@mui/material";

export interface LayerSerie extends Serie {
  data: LayerData[];
}

export interface LayersLineProps {
  layers: LayerType[];
  deviceId?: number;
  title: string;
}

const FetchingContent = () => (
  <Skeleton animation="wave" variant="rectangular" width="100%" height="30%" sx={{ my: 2 }} />
);

const toSerie = (layerQueries: {[key: string]: LayerResult }) =>
  Object.entries(layerQueries).map(([layer, result]) => ({ id: layer, data: result.data.map(d => ({ x: d.timestamp, y: d.val })) }));

export function LayersLine(props: LayersLineProps) {
  const { layers, title, deviceId } = props;
  const layerQueries = useLayers(layers, { deviceId });

  const anyLoading = (layers: LayerType[]) =>
      layers.reduce<Boolean>((prev, next) => prev || layerQueries[next].isLoading, false);

  const anyError = (layers: LayerType[]) =>
      layers.reduce<Boolean>((prev, next) => prev || layerQueries[next].isError, false);

  if (anyError(layers)) return <Error/>;
  if (anyLoading(layers)) return <FetchingContent />;

  let max = Object.values(layerQueries)
    .reduce<number>((prev, next) => Math.max(prev, ...next.domain), 0);

  max = Math.max(max, ...Object.values(layerQueries).flatMap(l => l.data!).map(d => d.val));

  return (
    <Panel title={props.title} contentSx={{ height: 400 }}>
      <ResponsiveLine
        data={toSerie(layerQueries)}
        margin={{ top: 50, right: 40, bottom: 60, left: 60 }}
        xScale={{ type: "time", format: "native" }}
        curve="linear"
        yScale={{
          type: "linear",
          min: 0,
          max: max * 1.1,
          stacked: false,
          reverse: false,
        }}
        yFormat=" >-.2f"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          format: "%m/%d",
          tickValues: "every 1 day",
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: "time",
          legendOffset: 45,
          legendPosition: "middle",
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legendOffset: -40,
          legendPosition: "middle",
        }}
        colors={{ scheme: "nivo" }}
        pointSize={5}
        pointColor={{ theme: "background" }}
        pointBorderWidth={2}
        pointBorderColor={{ from: "serieColor" }}
        pointLabelYOffset={-12}
        useMesh={true}
      />
    </Panel>
  );
}
