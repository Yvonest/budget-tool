import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  open: boolean;
  defaultName: string;
  onCancel: () => void;
  onConfirm: (name: string) => void;
}

export function SavePlanModal({ open, defaultName, onCancel, onConfirm }: Props) {
  const [name, setName] = useState(defaultName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [open, defaultName]);

  const submit = () => {
    onConfirm(name.trim() || defaultName);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="paper-card p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-handwrite text-lg font-bold mb-2">儲存目前規劃</h3>
            <p className="font-round text-xs opacity-70 mb-3">
              幫這份規劃取個名字，之後隨時可以重新命名。
            </p>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
                if (e.key === 'Escape') onCancel();
              }}
              placeholder="例如 加薪前、搬家後"
              className="w-full font-round text-sm px-3 py-2 rounded border border-dashed border-main-text/40 focus:border-main-text focus:border-solid outline-none bg-white/60"
            />
            <div className="flex gap-3 justify-end mt-5">
              <button
                onClick={onCancel}
                className="font-round text-sm px-4 py-2 opacity-70 hover:opacity-100 transition-opacity"
              >
                取消
              </button>
              <button
                onClick={submit}
                className="font-round text-sm font-bold px-4 py-2 rounded bg-main-text text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#6B4423' }}
              >
                儲存
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
