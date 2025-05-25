// Browser-compatible logger
const MAX_LOG_ENTRIES = 1000; // Maximum number of log entries to keep

const logError = (error: any) => {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.stack || error.message : String(error);
  const logEntry = `[${timestamp}] ${errorMessage}`;

  // Log to console
  console.error(logEntry);

  // Store in localStorage
  try {
    const existingLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
    existingLogs.unshift(logEntry); // Add new entry at the beginning
    
    // Keep only the most recent entries
    if (existingLogs.length > MAX_LOG_ENTRIES) {
      existingLogs.length = MAX_LOG_ENTRIES;
    }
    
    localStorage.setItem('errorLogs', JSON.stringify(existingLogs));
  } catch (e) {
    console.error('Failed to store error log:', e);
  }
};

export const logger = {
  error: logError,
  getLogs: () => {
    try {
      return JSON.parse(localStorage.getItem('errorLogs') || '[]');
    } catch (e) {
      console.error('Failed to retrieve error logs:', e);
      return [];
    }
  },
  clearLogs: () => {
    try {
      localStorage.removeItem('errorLogs');
    } catch (e) {
      console.error('Failed to clear error logs:', e);
    }
  }
}; 