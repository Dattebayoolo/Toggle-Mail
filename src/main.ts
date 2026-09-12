// Toggle Mail – Application Entry Point (TypeScript)

import { uiController } from './ui-controller';

// Boot after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => uiController.init());
} else {
  uiController.init();
}
