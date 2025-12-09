interface StatsCardProps {
  title: string
  value: string | number
  icon: string
  color?: 'green' | 'red' | 'blue' | 'gray'
  trend?: {
    value: string
    positive: boolean
  }
}

export default function StatsCard({ title, value, icon, color = 'gray', trend }: StatsCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <p className={`text-sm mt-2 flex items-center ${trend.positive ? 'text-mypay-green' : 'text-red-500'}`}>
                <span className="mr-1">{trend.positive ? '↑' : '↓'}</span>
                {trend.value}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-mypay-green/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl">{icon}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

