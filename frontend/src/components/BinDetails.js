import React from 'react';
import { AlertTriangle, Database, X } from 'lucide-react';

const DetailRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3">
    <span className="text-sm text-grey">{label}</span>
    <span className="text-sm font-medium text-dark-blue text-right break-all">{value ?? '-'}</span>
  </div>
);

const BinDetails = ({ bin, onClose }) => {
  if (!bin) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-steel-blue text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6" />
            <h2 className="text-xl font-bold">{bin.device_id}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {(bin.gas_alert || bin.fall_detected || bin.fill_percentage >= 70) && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Condition alert from database fields</span>
              </div>
            </div>
          )}

          <div className="bg-light-grey rounded-lg p-4">
            <DetailRow label="Mongo ID" value={bin.id} />
            <DetailRow label="Device ID" value={bin.device_id} />
            <DetailRow label="Distance" value={bin.distance} />
            <DetailRow label="Fill Percentage" value={`${bin.fill_percentage}%`} />
            <DetailRow label="Fill Status" value={bin.fill_status} />
            <DetailRow label="Gas" value={bin.gas} />
            <DetailRow label="Gas Alert" value={bin.gas_alert ? 'true' : 'false'} />
            <DetailRow label="Angle X" value={bin.angleX} />
            <DetailRow label="Angle Y" value={bin.angleY} />
            <DetailRow label="Fall Detected" value={bin.fall_detected ? 'true' : 'false'} />
            <DetailRow label="Timestamp" value={bin.timestamp} />
            <DetailRow label="Topic" value={bin.topic} />
            <DetailRow
              label="Received At"
              value={bin.received_at ? new Date(bin.received_at).toLocaleString() : '-'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BinDetails;
