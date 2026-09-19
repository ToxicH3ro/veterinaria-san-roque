export default function Table({
  columns = [],
  data = [],
  emptyMessage = "No hay registros.",
  renderActions,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-sm font-bold text-[#112250]"
              >
                {column.label}
              </th>
            ))}

            {renderActions && (
              <th className="px-4 py-3 text-sm font-bold text-[#112250]">
                Acciones
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={
                  columns.length + (renderActions ? 1 : 0)
                }
                className="px-4 py-8 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={item.id || index}
                className="border-b border-gray-100 hover:bg-gray-50 transition"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-3 text-sm text-gray-700"
                  >
                    {column.render
                      ? column.render(item)
                      : item[column.key]}
                  </td>
                ))}

                {renderActions && (
                  <td className="px-4 py-3">
                    {renderActions(item)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}