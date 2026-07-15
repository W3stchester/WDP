import React from 'react';
import { MdConstruction } from 'react-icons/md';

export default function GeneralPlanning() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
      <div className="mb-3 flex justify-center">
        <MdConstruction size={40} className="text-gray-400" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">این بخش در حال توسعه است</p>
    </div>
  );
}
