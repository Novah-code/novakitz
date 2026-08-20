'use client';

import { installApiBase } from '../lib/apiBase';

// Run on module load rather than in an effect: a component further down the
// tree can fire a fetch before any effect of ours would have run.
installApiBase();

export default function CapacitorBridge() {
  return null;
}
