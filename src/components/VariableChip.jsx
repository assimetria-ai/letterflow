/**
 * VariableChip - Renders a dynamic variable tag inline in the editor.
 * Used as a node view for TipTap (future enhancement).
 * Currently, variables are rendered as plain text {{VAR_NAME}} in the editor.
 */
const VariableChip = ({ variable, onClick }) => {
  return (
    <span
      onClick={onClick}
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono cursor-pointer transition-colors bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100"
      title={`Dynamic variable: ${variable.label || variable.key}`}
    >
      <span className="mr-1 text-sky-400">{'{'}</span>
      {variable.label || variable.key.replace(/[{}]/g, '')}
      <span className="ml-1 text-sky-400">{'}'}</span>
    </span>
  );
};

export default VariableChip;
