import { h } from 'preact';

interface VectorVisualizationProps {
  vector: number[];
}

function VectorVisualization({ vector }: VectorVisualizationProps) {
  if (!vector || vector.length === 0) return <span>No vector data</span>;

  // Normalize values to 0-1 range for color mapping
  const min = Math.min(...vector);
  const max = Math.max(...vector);
  const range = max - min || 1; // Avoid division by zero

  return (
    <div className="vector-visualization">
      {vector.map((value, index) => {
        // Normalize to 0-1
        const normalized = (value - min) / range;
        // Map to hue: 240 (blue) to 0 (red)
        const hue = 240 - (normalized * 240);
        const color = `hsl(${hue}, 70%, 50%)`;

        return (
          <div
            key={index}
            className="vector-dot"
            style={{ backgroundColor: color }}
            title={`Index ${index}: ${value.toFixed(4)}`}
          />
        );
      })}
    </div>
  );
}

export default VectorVisualization;