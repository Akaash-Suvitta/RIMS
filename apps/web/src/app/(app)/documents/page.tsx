'use client';

import { useRef, useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { uploadDocument } from '../../../services/documents.service';

export default function DocumentsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await uploadDocument(file, {});
      setSuccessMessage('Document uploaded successfully');
    } catch {
      setErrorMessage('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset the input so the same file can be re-uploaded if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'DM Serif Display, serif', color: '#E8F0F8' }}>
          Documents
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#7A9BBD' }}>
          Upload and manage regulatory documents
        </p>
      </div>

      {/* Upload card */}
      <Card>
        <div className="flex flex-col items-center justify-center py-10 gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(0, 194, 168, 0.1)' }}
          >
            <Upload className="h-7 w-7" style={{ color: '#00C2A8' }} />
          </div>
          <div className="text-center">
            <p className="font-medium" style={{ color: '#E8F0F8' }}>Upload a document</p>
            <p className="mt-1 text-sm" style={{ color: '#7A9BBD' }}>
              Supported formats: PDF, DOCX, XLSX, PNG, JPG
            </p>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            onChange={handleFileChange}
          />

          <Button
            variant="primary"
            size="md"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Spinner size="sm" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Choose File
              </>
            )}
          </Button>

          {/* Feedback messages */}
          {successMessage && (
            <p className="text-sm font-medium" style={{ color: '#10B981' }}>
              {successMessage}
            </p>
          )}
          {errorMessage && (
            <p className="text-sm font-medium" style={{ color: '#F43F5E' }}>
              {errorMessage}
            </p>
          )}
        </div>
      </Card>

      {/* Document list placeholder */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: 'rgba(17, 34, 56, 0.5)',
          border: '1px solid rgba(56, 189, 248, 0.08)',
        }}
      >
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 flex-shrink-0" style={{ color: '#4A6A8A' }} />
          <p className="text-sm" style={{ color: '#7A9BBD' }}>
            Document list will display all uploaded files here.
          </p>
        </div>
      </div>
    </div>
  );
}
