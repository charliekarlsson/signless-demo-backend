import React from 'react';

const createStep = (index) => ({
  id: `custom-${Date.now()}-${index}`,
  title: 'Name this step',
  description: 'Describe what happens during this part of the checkout.'
});

const FlowEditor = ({ flow, onChange }) => {
  const updateSteps = (nextSteps) => {
    onChange({ ...flow, steps: nextSteps });
  };

  const handleStepFieldChange = (index, key, value) => {
    const nextSteps = flow.steps.map((step, idx) => (idx === index ? { ...step, [key]: value } : step));
    updateSteps(nextSteps);
  };

  const moveStep = (index, direction) => {
    const nextSteps = [...flow.steps];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= nextSteps.length) return;
    const [step] = nextSteps.splice(index, 1);
    nextSteps.splice(targetIndex, 0, step);
    updateSteps(nextSteps);
  };

  const removeStep = (index) => {
    if (flow.steps.length <= 2) return;
    const nextSteps = flow.steps.filter((_, idx) => idx !== index);
    updateSteps(nextSteps);
  };

  const addStep = () => {
    const nextSteps = [...flow.steps, createStep(flow.steps.length + 1)];
    updateSteps(nextSteps);
  };

  const updateFlowOption = (key, value) => {
    onChange({ ...flow, [key]: value });
  };

  return (
    <div className="config-section">
      <div className="section-header">
        <h2>Flow timeline</h2>
        <p>Describe each step users see. The builder will generate matching UI cards and backend comments.</p>
      </div>

      <div className="flow-steps">
        {flow.steps.map((step, index) => (
          <article className="flow-step-card" key={step.id}>
            <header>
              <div>
                <span className="step-index">Step {index + 1}</span>
              </div>
              <div className="flow-controls">
                <button
                  type="button"
                  className="icon"
                  onClick={() => moveStep(index, -1)}
                  disabled={index === 0}
                  aria-label="Move step up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="icon"
                  onClick={() => moveStep(index, 1)}
                  disabled={index === flow.steps.length - 1}
                  aria-label="Move step down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="icon danger"
                  onClick={() => removeStep(index)}
                  disabled={flow.steps.length <= 2}
                  aria-label="Remove step"
                >
                  ✕
                </button>
              </div>
            </header>
            <label>
              <span className="field-label">Step headline</span>
              <input
                type="text"
                value={step.title}
                onChange={(event) => handleStepFieldChange(index, 'title', event.target.value)}
              />
            </label>
            <label>
              <span className="field-label">Step description</span>
              <textarea
                rows={3}
                value={step.description}
                onChange={(event) => handleStepFieldChange(index, 'description', event.target.value)}
              />
            </label>
          </article>
        ))}
      </div>

      <div className="flow-actions">
        <button type="button" onClick={addStep}>
          Add another step
        </button>
      </div>

      <div className="flow-options">
        <label className="field toggle">
          <div>
            <span className="field-label">Show countdown timer</span>
            <span className="field-helper">Display a timer to encourage faster confirmations.</span>
          </div>
          <div className="switch">
            <input
              type="checkbox"
              checked={flow.showTimer}
              onChange={(event) => updateFlowOption('showTimer', event.target.checked)}
            />
            <span className="switch-slider" />
          </div>
        </label>
        <label className="field">
          <span className="field-label">Timer seconds</span>
          <input
            type="number"
            min={30}
            step={15}
            value={flow.timerSeconds}
            onChange={(event) =>
              updateFlowOption(
                'timerSeconds',
                event.target.value === '' ? '' : Number(event.target.value)
              )
            }
          />
        </label>
        <label className="field toggle">
          <div>
            <span className="field-label">Include receipt summary</span>
            <span className="field-helper">Show after verification to recap the proof-of-payment.</span>
          </div>
          <div className="switch">
            <input
              type="checkbox"
              checked={flow.includeReceipt}
              onChange={(event) => updateFlowOption('includeReceipt', event.target.checked)}
            />
            <span className="switch-slider" />
          </div>
        </label>
        <label className="field toggle">
          <div>
            <span className="field-label">Show progress bar</span>
          </div>
          <div className="switch">
            <input
              type="checkbox"
              checked={flow.showProgressBar}
              onChange={(event) => updateFlowOption('showProgressBar', event.target.checked)}
            />
            <span className="switch-slider" />
          </div>
        </label>
      </div>
    </div>
  );
};

export default FlowEditor;
