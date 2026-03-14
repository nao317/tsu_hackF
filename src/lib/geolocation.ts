export type GpsPosition = {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
};

export type GeolocationErrorCode =
  | "UNSUPPORTED"
  | "PERMISSION_DENIED"
  | "POSITION_UNAVAILABLE"
  | "TIMEOUT"
  | "UNKNOWN";

export class GeolocationError extends Error {
  constructor(
    public readonly code: GeolocationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "GeolocationError";
  }
}

const toGeolocationError = (
  error: GeolocationPositionError,
): GeolocationError => {
  switch (error.code) {
    case 1:
      return new GeolocationError(
        "PERMISSION_DENIED",
        "位置情報の利用が許可されていません。",
      );
    case 2:
      return new GeolocationError(
        "POSITION_UNAVAILABLE",
        "位置情報を取得できませんでした。",
      );
    case 3:
      return new GeolocationError(
        "TIMEOUT",
        "位置情報の取得がタイムアウトしました。",
      );
    default:
      return new GeolocationError(
        "UNKNOWN",
        "位置情報の取得中に不明なエラーが発生しました。",
      );
  }
};

export const getCurrentGpsPosition = (
  options: PositionOptions = {},
): Promise<GpsPosition> => {
  if (typeof window === "undefined") {
    return Promise.reject(
      new GeolocationError(
        "UNSUPPORTED",
        "Geolocation APIはブラウザ環境でのみ利用できます。",
      ),
    );
  }

  if (!("geolocation" in navigator)) {
    return Promise.reject(
      new GeolocationError(
        "UNSUPPORTED",
        "このブラウザはGeolocation APIに対応していません。",
      ),
    );
  }

  const mergedOptions: PositionOptions = {
    enableHighAccuracy: options.enableHighAccuracy ?? true,
    timeout: options.timeout ?? 10000,
    maximumAge: options.maximumAge ?? 0,
  };

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        reject(toGeolocationError(error));
      },
      mergedOptions,
    );
  });
};
