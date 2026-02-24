import React from "react"
import { cn } from "~lib/utils"

interface TablePreviewProps {
    data: {
        title?: string
        headers: string[]
        rows: Array<string[] | Record<string, any>>
    }
}

export function TablePreview({ data }: TablePreviewProps) {
    if (!data || !data.headers || !data.rows) return null

    const { title, headers, rows } = data

    return (
        <div className="sprout-mt-3 sprout-bg-white sprout-rounded-lg sprout-border sprout-border-mushroom-200 sprout-shadow-sm sprout-overflow-hidden sprout-w-full">
            {title && (
                <div className="sprout-px-4 sprout-py-3 sprout-border-b sprout-border-mushroom-100 sprout-bg-mushroom-50">
                    <h4 className="sprout-text-xs sprout-font-semibold sprout-text-mushroom-900">
                        {title}
                    </h4>
                </div>
            )}

            <div className="sprout-overflow-x-auto">
                <table className="sprout-w-full sprout-text-left sprout-text-xs">
                    <thead className="sprout-bg-mushroom-50 sprout-text-mushroom-600">
                        <tr>
                            {headers.map((header, i) => (
                                <th key={i} className="sprout-px-4 sprout-py-2 sprout-font-medium sprout-whitespace-nowrap">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="sprout-divide-y sprout-divide-mushroom-100">
                        {rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="sprout-hover:bg-mushroom-50/50 sprout-transition-colors">
                                {headers.map((header, colIndex) => {
                                    // Handle both array rows and object rows
                                    let cellValue
                                    if (Array.isArray(row)) {
                                        cellValue = row[colIndex]
                                    } else {
                                        // Try to find key matching header (case-insensitive) or just use header as key
                                        const key = Object.keys(row).find(k => k.toLowerCase() === header.toLowerCase()) || header
                                        cellValue = row[key]
                                    }

                                    return (
                                        <td key={colIndex} className="sprout-px-4 sprout-py-2.5 sprout-text-gray-700 sprout-whitespace-nowrap">
                                            {String(cellValue ?? "")}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
