import { useCallback, useRef, useState, useEffect } from 'react';
import { GoogleAdMob } from '@apps-in-toss/web-framework';

const DEFAULT_AD_GROUP_ID = 'ait.v2.live.d247867a61d14ac9';

interface InterstitialAdCallback {
  onDismiss?: () => void;
}

export function useInterstitialAd(adGroupId: string = DEFAULT_AD_GROUP_ID) {
  const [loading, setLoading] = useState(true);
  const [adSupported, setAdSupported] = useState(true);
  const dismissCallbackRef = useRef<(() => void) | undefined>();

  useEffect(() => {
    let isAdUnsupported = false;
    try {
      isAdUnsupported = GoogleAdMob?.loadAppsInTossAdMob?.isSupported?.() === false;
    } catch {
      isAdUnsupported = true;
    }

    if (isAdUnsupported) {
      setAdSupported(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    const cleanup = GoogleAdMob.loadAppsInTossAdMob({
      options: { adGroupId },
      onEvent: (event: any) => {
        if (event.type === 'loaded') {
          setLoading(false);
        }
      },
      onError: () => {
        setLoading(false);
      },
    });

    return cleanup;
  }, [adGroupId]);

  const showInterstitialAd = useCallback(({ onDismiss }: InterstitialAdCallback) => {
    let isAdUnsupported = false;
    try {
      isAdUnsupported = GoogleAdMob?.showAppsInTossAdMob?.isSupported?.() === false;
    } catch {
      isAdUnsupported = true;
    }

    if (!adSupported || isAdUnsupported) {
      onDismiss?.();
      return;
    }

    if (loading) {
      onDismiss?.();
      return;
    }

    dismissCallbackRef.current = onDismiss;

    GoogleAdMob.showAppsInTossAdMob({
      options: { adGroupId },
      onEvent: (event: any) => {
        switch (event.type) {
          case 'requested':
            setLoading(true);
            break;
          case 'dismissed':
            dismissCallbackRef.current?.();
            dismissCallbackRef.current = undefined;
            reloadAd();
            break;
          case 'failedToShow':
            dismissCallbackRef.current?.();
            dismissCallbackRef.current = undefined;
            break;
        }
      },
      onError: () => {
        dismissCallbackRef.current?.();
        dismissCallbackRef.current = undefined;
      },
    });
  }, [loading, adSupported, adGroupId]);

  const reloadAd = useCallback(() => {
    if (!adSupported) return;
    setLoading(true);

    GoogleAdMob.loadAppsInTossAdMob({
      options: { adGroupId },
      onEvent: (event: any) => {
        if (event.type === 'loaded') {
          setLoading(false);
        }
      },
      onError: () => {
        setLoading(false);
      },
    });
  }, [adSupported, adGroupId]);

  return { loading, adSupported, showInterstitialAd };
}
