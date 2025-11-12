import { h } from 'preact';
import { availableTools } from '../services/tools';
import type { Tool } from '../services/interfaces';

interface ToolManagerProps {
  enabledTools: Set<string>;
  toggleTool: (toolName: string) => void;
  showToolManager: boolean;
  setShowToolManager: (show: boolean) => void;
}

export function ToolManager({
  enabledTools,
  toggleTool,
  showToolManager,
  setShowToolManager
}: ToolManagerProps) {
  return (
    <div className="tool-manager">
      <button
        className="tool-manager-toggle"
        onClick={() => setShowToolManager(!showToolManager)}
      >
        {showToolManager ? '▼' : '▶'} Tools ({enabledTools.size}/{availableTools.length})
      </button>

      {showToolManager && (
        <div className="tool-manager-content">
          <h5>Available Tools</h5>
          {availableTools.map((tool: Tool) => (
            <div key={tool.function.name} className="tool-item">
              <label className="tool-label">
                <input
                  type="checkbox"
                  checked={enabledTools.has(tool.function.name)}
                  onChange={() => toggleTool(tool.function.name)}
                />
                <div className="tool-info">
                  <strong>{tool.function.name}</strong>
                  <p>{tool.function.description}</p>
                </div>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}