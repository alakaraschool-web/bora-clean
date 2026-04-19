import { useState } from 'react';
import { Button } from './Button';
import { X, Check } from 'lucide-react';

export const BulkStudentPreviewModal = ({ 
  isOpen, 
  onClose, 
  students, 
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  students: any[]; 
  onSave: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col shadow-xl">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">Preview Bulk Upload ({students.length} students)</h2>
          <button onClick={onClose}><X /></button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-2">Name</th>
                <th className="p-2">Adm</th>
                <th className="p-2">Class</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.adm}</td>
                  <td className="p-2">{s.class}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} className="gap-2"><Check className="w-4 h-4"/> Confirm Save</Button>
        </div>
      </div>
    </div>
  );
};
