import React from 'react';

const formatTokenAmount = (value, currency = 'USDC') => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return `0 ${currency}`;
  return `${numeric.toFixed(6)} ${currency}`;
};

const PreviewPanel = ({ config, minorUnits, dirty }) => {
  const receiver = config.product.receiver || '';
  const shortReceiver = receiver.length > 10 ? `${receiver.slice(0, 4)}…${receiver.slice(-4)}` : receiver || 'Set receiver';
  const currency = config.product.currency ?? 'USDC';

  return (
    <section className="preview-panel">
    <header className="preview-header">
      <div>
        <span className="preview-tag">Live preview</span>
        <h2>{config.project.name}</h2>
        <p>{config.project.tagline}</p>
      </div>
      {dirty && <span className="preview-pill">Unsaved changes</span>}
    </header>

    <div className={`checkout-preview ${config.ui.layout}`} data-theme={config.ui.theme}>
      <div className="preview-body">
        <div className="invoice-card">
          <div className="invoice-header">
            <span className="invoice-label">Invoice memo</span>
            <code>{config.product.invoiceMemo}</code>
          </div>
          <div className="invoice-amount">
            <strong>{formatTokenAmount(config.product.amount, currency)}</strong>
            <span>{minorUnits.toLocaleString()} base units</span>
          </div>
          <div className="invoice-meta">
            <span>Receiver</span>
            <code>{shortReceiver}</code>
          </div>
          {config.product.collectEmail && (
            <div className="invoice-meta">
              <span>Collecting</span>
              <code>Email address</code>
            </div>
          )}
          {config.product.collectDiscord && (
            <div className="invoice-meta">
              <span>Collecting</span>
              <code>Discord handle</code>
            </div>
          )}
          <button type="button" className="cta-button">Begin checkout</button>
        </div>

        <aside className="preview-sidebar">
          <h3>{config.ui.waitingHeadline}</h3>
          <p>{config.ui.waitingCopy}</p>
          {config.flow.showTimer && (
            <div className="timer-pill">
              ⏱ {config.flow.timerSeconds} seconds window
            </div>
          )}
          <ul className="flow-preview">
            {config.flow.steps.map((step, index) => (
              <li key={step.id}>
                <span className="step-index">{index + 1}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ul>
          {config.ui.showSupportCard && (
            <div className="support-card">
              <span>Need help?</span>
              <a href={`mailto:${config.project.supportEmail}`}>{config.project.supportEmail}</a>
            </div>
          )}
        </aside>
      </div>

      <footer className="preview-footer">
        <div>
          <strong>{config.ui.successHeadline}</strong>
          <p>{config.ui.successCopy}</p>
        </div>
        <div className="pill-row">
          <span className="pill">Deliverable: {config.product.deliverableType}</span>
          <span className="pill">Currency: {currency}</span>
          {config.flow.includeReceipt && <span className="pill">Receipt emailed</span>}
          {config.ui.allowRetry && <span className="pill">Retry enabled</span>}
        </div>
      </footer>
    </div>
    </section>
  );
};

export default PreviewPanel;
