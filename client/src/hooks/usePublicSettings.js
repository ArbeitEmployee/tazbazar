import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  loadPublicSettings,
  selectPublicSettings,
  selectPublicSettingsState,
} from "../store/publicSettingsSlice";
import { getDefaultPublicSettings } from "../utils/publicSettings";

// AppBootstrap (mounted once in the root layout) is the single owner of the
// initial settings fetch. If every component dispatched it from its own
// effect, StrictMode/first mount fired the same request many times and could
// update Redux while the Navbar/Footer were still hydrating, which produced
// the <span> -> <img> hydration mismatch.
export const usePublicSettings = ({ force = false } = {}) => {
  const dispatch = useDispatch();
  const settings = useSelector(selectPublicSettings);
  const state = useSelector(selectPublicSettingsState);
  const defaultSettings = useMemo(() => getDefaultPublicSettings(), []);

  // Streamed Suspense boundaries (Navbar/Footer) can hydrate after the root
  // AppBootstrap effect has already loaded real settings. Returning the same
  // defaults during hydration keeps server and client markup identical.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (force) {
      dispatch(loadPublicSettings({ force: true }));
    }
  }, [dispatch, force]);

  return {
    settings: mounted ? settings : defaultSettings,
    status: state.status,
    error: state.error,
    loaded: state.loaded,
    reload: () => dispatch(loadPublicSettings({ force: true })),
  };
};

export default usePublicSettings;
