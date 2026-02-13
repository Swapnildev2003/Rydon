
// Orange-themed DetailCard component
import React from "react";
export const DetailCard = ({ icon, title, value, status, progress }) => (
  <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
    <div className="flex items-center gap-2 mb-1">
      <div className={`p-1 rounded-lg ${
        status === 'good' ? 'bg-orange-100 text-orange-600' :
        status === 'warning' ? 'bg-amber-100 text-amber-600' :
        'bg-orange-100 text-orange-600'
      }`}>
        {icon}
      </div>
      <span className="text-sm font-medium text-orange-700">{title}</span>
    </div>
    <p className="font-semibold text-lg text-orange-800">{value}</p>
    {progress && (
      <div className="relative h-1.5 bg-orange-100 rounded-full mt-2">
        <div 
          className={`absolute top-0 left-0 h-full rounded-full ${
            progress > 70 ? 'bg-orange-500' :
            progress > 30 ? 'bg-amber-400' :
            'bg-red-400'
          }`} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    )}
  </div>
);
