export default function DataTable({ columns, data, onRowClick }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((col, i) => (
              <th key={i} className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr key={ri} onClick={() => onRowClick?.(row)}
              className={`border-b border-gray-50 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-gray-50/80' : ''}`}>
              {columns.map((col, ci) => (
                <td key={ci} className="px-3 py-2.5 text-sm">{col.render ? col.render(row) : row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && <div className="py-12 text-center text-sm text-gray-400">No data found</div>}
    </div>
  );
}
