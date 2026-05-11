import {
  GaugeContainer,
  useGaugeState,
} from '@mui/x-charts/Gauge';
import { arc as d3Arc } from '@mui/x-charts-vendor/d3-shape';

import React from 'react';

function GaugeGradientArc() {
  const {
    startAngle,
    endAngle,
    outerRadius,
    innerRadius,
    cornerRadius,
    cx,
    cy,
  } = useGaugeState();

  return (
    <>
      <defs>
        <linearGradient id="throttle-gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="100%" stopColor="#1e40af" />
        </linearGradient>
      </defs>
      <path
        transform={`translate(${cx}, ${cy})`}
        d={d3Arc().cornerRadius(cornerRadius)({
          startAngle,
          endAngle,
          innerRadius,
          outerRadius,
        })}
        fill="url(#throttle-gauge-gradient)"
      />
    </>
  );
}

function GaugePointer() {
  const { valueAngle, outerRadius, cx, cy } = useGaugeState();

  if (valueAngle === null) {
    // No value to display
    return null;
  }

  const target = {
    x: cx + outerRadius * Math.sin(valueAngle),
    y: cy - outerRadius * Math.cos(valueAngle),
  };
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="red" />
      <path
        d={`M ${cx} ${cy} L ${target.x} ${target.y}`}
        stroke="red"
        strokeWidth={3}
      />
    </g>
  );
}

export default function CompositionExample({ value = 30 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h3 style={{ margin: '0', fontSize: '16px', fontWeight: '600' }}>Throttle</h3>
      <GaugeContainer
        width={170}
        height={100}
        startAngle={-110}
        endAngle={110}
        value={value}
        valueMin={0}
        valueMax={100}
      >
        <GaugeGradientArc />
        <GaugePointer />
      </GaugeContainer>
    </div>
  );
}