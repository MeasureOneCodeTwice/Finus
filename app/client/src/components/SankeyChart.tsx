import {
  ResponsiveContainer,
  Sankey,
  Tooltip,
  useChartWidth,
  Layer,
  Rectangle,
  type SankeyNodeProps,
} from "recharts";

const TEXT_OFFSET = 6;

interface SankeyData {
  nodes: Array<{ name: string }>; //names of nodes
  links: Array<{
    //links between nodes - source and target are indices of the nodes in the nodes array, value is the weight of the link
    source: number;
    target: number;
    value: number;
  }>;
}

interface SankeyChartProps {
  data: SankeyData;
}

export function SankeyChart({ data }: SankeyChartProps) {
  return (
    <ResponsiveContainer width="100%" aspect={2}>
      <Sankey
        data={data}
        node={CustomNode}
        link={{ stroke: "#9ca3af", strokeOpacity: 0.5 }}
        nodePadding={20}
        nodeWidth={15}
        linkCurvature={1}
        margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
        align="justify"
        sort={true}
      />
      <Tooltip />
    </ResponsiveContainer>
  );
}

function CustomNode({ x, y, width, height, index, payload }: SankeyNodeProps) {
  const containerWidth = useChartWidth();
  if (containerWidth == null) {
    return null; // return null if used outside a chart context
  }
  //console.log("width of container:", containerWidth)
  //console.log("x:", x, "width of node:", width);
  const isOut = x + width + TEXT_OFFSET > containerWidth - TEXT_OFFSET * 3;
  return (
    <Layer key={`CustomNode${index}`}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#00f615"
        fillOpacity="1"
      />
      <text
        textAnchor={isOut ? "end" : "start"}
        x={isOut ? x - TEXT_OFFSET : x + width + TEXT_OFFSET}
        y={y + height / 2}
        fontSize="14"
        fill="#ffffff"
      >
        {payload.name}
      </text>
      <text
        textAnchor={isOut ? "end" : "start"}
        x={isOut ? x - TEXT_OFFSET : x + width + TEXT_OFFSET}
        y={y + height / 2 + 13}
        fontSize="12"
        fill="#ffffff"
        strokeOpacity="0.5"
      >
        {`$${payload.value}`}
      </text>
    </Layer>
  );
}

export default SankeyChart;
