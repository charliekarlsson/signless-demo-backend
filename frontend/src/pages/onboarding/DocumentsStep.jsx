import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useOutletContext } from 'react-router-dom';
import { useCreateDocument, useDeleteDocument } from '../../hooks/useOnboarding.js';

const documentSchema = z.object({
  type: z.string().min(2).max(64),
  storageKey: z.string().min(8),
  checksum: z.string().max(128).optional(),
});

const DocumentsStep = () => {
  const { onboarding } = useOutletContext();
  const documents = onboarding.documents ?? [];
  const [status, setStatus] = useState(null);

  const form = useForm({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      type: documents.length === 0 ? 'kyc-id' : '',
      storageKey: '',
      checksum: '',
    },
  });

  useEffect(() => {
    if (documents.length === 0) {
      form.reset({ type: 'kyc-id', storageKey: '', checksum: '' });
    }
  }, [documents, form]);

  const createDocument = useCreateDocument({
    onSuccess: () => {
      setStatus({ type: 'success', message: 'Document recorded.' });
      form.reset({ type: '', storageKey: '', checksum: '' });
    },
    onError: (err) => {
      setStatus({ type: 'error', message: err.data?.error ?? 'Could not save document.' });
    },
  });

  const deleteDocument = useDeleteDocument({
    onSuccess: () => {
      setStatus({ type: 'success', message: 'Document removed.' });
    },
    onError: (err) => {
      setStatus({ type: 'error', message: err.data?.error ?? 'Unable to remove document.' });
    },
  });

  const handleSubmit = (values) => {
    setStatus(null);
    createDocument.mutate(values);
  };

  const sortedDocuments = useMemo(
    () => documents.slice().sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)),
    [documents],
  );

  return (
    <div className="onboarding-panel">
      <header className="onboarding-panel-header">
        <div>
          <p className="eyebrow">Step 4</p>
          <h1>Upload documents</h1>
        </div>
        <div className="step-badge">4 / 5</div>
      </header>
      <p className="onboarding-lede">
        Upload supporting materials for your business: director IDs, proof of address, formation docs, or tax certificates. Store the files in your preferred bucket and paste the storage key below.
      </p>

      <form className="onboarding-form" onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="type">Document type</label>
            <input id="type" placeholder="kyc-id" {...form.register('type')} />
            {form.formState.errors.type && <span className="field-error">{form.formState.errors.type.message}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="storageKey">Storage key or URL</label>
            <input id="storageKey" placeholder="r2://signless/merchants/abc/kyc.pdf" {...form.register('storageKey')} />
            {form.formState.errors.storageKey && <span className="field-error">{form.formState.errors.storageKey.message}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="checksum">Checksum (optional)</label>
            <input id="checksum" placeholder="SHA256" {...form.register('checksum')} />
          </div>
        </div>

        {status && <p className={`panel-status ${status.type}`}>{status.message}</p>}

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={createDocument.isPending}>
            {createDocument.isPending ? 'Saving…' : 'Save document'}
          </button>
        </div>
      </form>

      <section className="onboarding-documents">
        <h2>Submitted documents</h2>
        {sortedDocuments.length === 0 ? (
          <p className="onboarding-hint">Upload at least one document to continue.</p>
        ) : (
          <ul>
            {sortedDocuments.map((doc) => (
              <li key={doc.id}>
                <div>
                  <strong>{doc.type}</strong>
                  <p>{doc.storageKey}</p>
                  <small>
                    Status: {doc.status} · Uploaded {new Date(doc.uploadedAt).toLocaleString()}
                  </small>
                </div>
                <button
                  type="button"
                  className="danger"
                  onClick={() => deleteDocument.mutate(doc.id)}
                  disabled={deleteDocument.isPending}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default DocumentsStep;
