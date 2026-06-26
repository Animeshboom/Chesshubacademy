'use client';

import { useEffect } from 'react';
import { initTelemetry } from '@/utils/telemetry';

export default function TelemetryInitializer() {
  useEffect(() => {
    initTelemetry();
  }, []);

  return null;
}
