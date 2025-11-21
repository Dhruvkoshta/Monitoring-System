import { CONFIG } from 'src/config-global';

import { RoomsView } from 'src/sections/rooms/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Rooms - ${CONFIG.appName}`}</title>

      <RoomsView />
    </>
  );
}
