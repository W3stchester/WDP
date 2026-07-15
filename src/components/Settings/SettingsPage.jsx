import React, { useRef, useState } from 'react';
import db from '../../db';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { IoCloudDownloadOutline, IoCloudUploadOutline, IoTrashOutline, IoInformationCircleOutline } from "react-icons/io5";
import ConfirmModal from '../Common/ConfirmModal';

const VERSION = '۱.۴.۶';

// Module-level Toggle (prevents remount on parent re-render, preserving animation).
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0 ${
        checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-zinc-700'
      }`}
      aria-pressed={checked}
    >
      <div
        className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm"
        style={{
          right: '2px',
          transition: 'transform 0.2s ease-out',
          transform: checked ? 'translateX(0)' : 'translateX(-20px)',
        }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { dark, setDark } = useTheme();
  const { editPast, setEditPast } = useSettings();
  const fileInputRef = useRef(null);

  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'info', title: '', message: '', action: null });

  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });

  // Export all plans to JSON file.
  const handleExport = async () => {
    try {
      const data = await db.dailyPlans.toArray();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().getTime()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setModalConfig({
        isOpen: true,
        type: 'info',
        title: 'خطا',
        message: 'خروجی‌گیری با خطا مواجه شد. لطفاً دوباره تلاش کنید.',
        action: closeModal,
      });
    }
  };

  // Confirm import dialog.
  const triggerImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setModalConfig({
      isOpen: true,
      type: 'info',
      title: 'وارد کردن داده‌ها',
      message: 'داده‌های فایل انتخابی به برنامه‌های فعلی اضافه می‌شوند. ادامه می‌دهید؟',
      action: () => processImport(file)
    });
    // Reset input so same file can be re-selected.
    e.target.value = '';
  };

  const processImport = (file) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (!Array.isArray(json)) throw new Error('Invalid format');
        await db.dailyPlans.bulkPut(json);
        window.location.reload();
      } catch (err) {
        setModalConfig({
          isOpen: true,
          type: 'info',
          title: 'فایل نامعتبر',
          message: 'فایل انتخابی یک نسخه پشتیبان معتبر نیست.',
          action: closeModal,
        });
      }
    };
    reader.readAsText(file);
    closeModal();
  };

  // Confirm reset dialog.
  const triggerReset = () => {
    setModalConfig({
      isOpen: true,
      type: 'danger',
      title: 'پاک‌سازی همه اطلاعات',
      message: 'تمام برنامه‌ها و مرورهای ثبت‌شده برای همیشه حذف خواهند شد. این عمل قابل بازگشت نیست. آیا مطمئنید؟',
      action: async () => {
        await db.dailyPlans.clear();
        window.location.reload();
      }
    });
  };

  return (
    <div className="p-4 md:p-0 space-y-3">
      <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-4 px-1">تنظیمات</h2>

      {/* Theme & edit settings */}
      <div className="space-y-2">
        <div className="surface-card p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-zinc-200">تم تاریک</span>
          <Toggle checked={dark} onChange={setDark} />
        </div>

        <div className="surface-card p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-zinc-200">اجازه ویرایش تاریخ‌های گذشته</span>
          <Toggle checked={editPast} onChange={setEditPast} />
        </div>
      </div>

      {/* Data management */}
      <div className="surface-card p-2 divide-y divide-gray-100 dark:divide-zinc-800">
        <button onClick={handleExport} className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors text-sm">
          <IoCloudDownloadOutline size={18} className="text-gray-500 dark:text-zinc-400" />
          خروجی نسخه پشتیبان
        </button>

        <button onClick={() => fileInputRef.current.click()} className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors text-sm">
          <IoCloudUploadOutline size={18} className="text-gray-500 dark:text-zinc-400" />
          وارد کردن نسخه پشتیبان
          <input type="file" ref={fileInputRef} onChange={triggerImport} accept=".json" className="hidden" />
        </button>

        <button onClick={triggerReset} className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors text-sm">
          <IoTrashOutline size={18} />
          پاک‌سازی همه اطلاعات
        </button>
      </div>

      {/* About */}
      <div className="surface-card p-4 flex items-center gap-3">
        <IoInformationCircleOutline size={20} className="text-gray-400 dark:text-zinc-500 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-sm text-gray-700 dark:text-zinc-200">
            توسعه‌دهنده: <a className="text-blue-600 dark:text-blue-400 hover:underline" href="https://Westchester.ir" target='_blank' rel="noreferrer">Westchester</a>
          </div>
          <div className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">نسخه {VERSION} — نسخه آفلاین</div>
        </div>
      </div>

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.action}
        onCancel={closeModal}
      />
    </div>
  );
}
