import React from 'react';

function UpgradeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Contact Limit Reached</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          You’ve hit your monthly contact exchange limit on your current plan.
        </p>
        <p className="mt-1 text-gray-700 dark:text-gray-400">
          Upgrade your plan to get more exchanges and premium features.
        </p>

        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700"
          >
            Not Now
          </button>
          <a
            href="/upgrade"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-semibold shadow hover:from-yellow-500 hover:to-yellow-700"
          >
            Upgrade Plan
          </a>
        </div>
      </div>
    </div>
  );
}

export default UpgradeModal;