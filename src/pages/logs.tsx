import { CONFIG } from 'src/config-global';

import { LogsView } from 'src/sections/logs';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Logs - ${CONFIG.appName}`}</title>
      <meta name="description" content="View and analyze all sensor readings and events" />
      <meta name="keywords" content="logs,sensor,monitoring,events,alerts" />

      <LogsView />
    </>
  );
}
