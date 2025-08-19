export function parseSteps(raw) {
  const lines = raw.split(/\n+/).filter(Boolean);

  const steps = [];
  let buffer = [];

  for (const line of lines) {
    if (/^step\s*\d+/i.test(line)) {
      if (buffer.length) {
        steps.push({ text: buffer.join(' ').trim() });
        buffer = [];
      }
    } else {
      buffer.push(line.trim());
    }
  }

  if (buffer.length) {
    steps.push({ text: buffer.join(' ').trim() });
  }

  return steps;
}
