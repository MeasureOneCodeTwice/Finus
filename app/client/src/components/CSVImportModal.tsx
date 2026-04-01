import { useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import CsvUpload from "./csvread/CsvUpload";
// import type { AuthSession } from "@/types/authTypes";
import type { Transaction } from "@/types/Transaction";

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTransactions: Transaction[]) => void;
  accountId: number;
}

function CSVImportModal({
  isOpen,
  onClose,
  onSuccess,
  accountId,
}: CSVImportModalProps) {
  const [importComplete, setImportComplete] = useState(false);

  if (!isOpen) return null;

  const handleImported = (newTransactions: Transaction[]) => {
    onSuccess(newTransactions);
    setImportComplete(true);
  };

  const handleClose = () => {
    setImportComplete(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-black/95 border border-green-500/30 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.2)] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-green-500/20">
          <h2 className="text-xl font-bold text-green-400">
            Import Transactions from CSV
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <AiOutlineClose size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {importComplete ? (
            <div className="text-center py-8">
              <div className="text-green-400 text-lg mb-4">
                ✓ Import Complete!
              </div>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-green-400"
              >
                Close
              </button>
            </div>
          ) : (
            <CsvUpload accountId={accountId} onImported={handleImported} />
          )}
        </div>
      </div>
    </div>
  );
}

export default CSVImportModal;
