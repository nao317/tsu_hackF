"use client";
import { propsToDataAttrs } from "@/lib/utilities";
import "@/components/material-layer/material-layer.css";

/** LKMatProps is an object of any of the given types. Each material type has different unique props. */
type LkMatProps = LkMatProps_Glass | LkMatProps_Flat;

type LkMatProps_Glass = {
  thickness?: "thick" | "normal" | "thin"; // Thickness of the glass material. Thicker material blurs more.
  tint?: LkColor; // Optional tint color for the glass material.
  tintOpacity?: number; // Optional opacity for the tint color. Defaults to 0.5.
  light?: boolean; // Optional. If true, adds a secondary layer for luminance effects.
  lightExpression?: string; //Optional. The value to pass to the light's background css property. Should be a gradient.
};

type LkMatProps_Flat = {
  bgColor?: LkColorWithOnToken;
  textColor?: LkColor;
};

type LkMaterialType = "flat" | "glass" | "debug";

interface LkMaterialLayerProps extends React.HTMLAttributes<HTMLDivElement> {
  zIndex?: number; // Optional z-index for the material layer. Different use cases might need it to be at different z-indexes.
  type?: LkMaterialType;
  materialProps?: LkMatProps; // Optional material-specific properties
}

export default function MaterialLayer({
  zIndex = 0,
  type,
  materialProps,
}: LkMaterialLayerProps) {
  const lkMatProps = propsToDataAttrs(materialProps || {}, `${type}`);
  const glassProps = materialProps as LkMatProps_Glass | undefined;
  const flatProps = materialProps as LkMatProps_Flat | undefined;

  /**Commented out, was likely used for debugging */

  // switch (material) {
  //   case "glass":
  //     break;
  //   case "debug":
  //     break;
  // }

  return (
    <>
      <div
        data-lk-component="material-layer"
        data-lk-material-type={type}
        style={{ zIndex: zIndex }}
        {...lkMatProps}
      >
        {type === "glass" && (
          <div>
            <div
              data-lk-material-sublayer="texture"
              style={{
                backdropFilter: `blur(var(--blur-${glassProps?.thickness || "normal"}))`,
              }}
            >
              {glassProps?.tint && (
                <div
                  data-lk-material-sublayer="tint"
                  style={{
                    opacity: glassProps?.tintOpacity ?? 0.2,
                    backgroundColor: `var(--lk-${glassProps?.tint || "transparent"})`,
                  }}
                >
                  {glassProps?.light && (
                    <div
                      data-lk-material-sublayer="light"
                      style={{
                        background: glassProps?.lightExpression || "none",
                      }}
                    ></div>
                  )}
                </div>
              )}
            </div>
            <div
              data-lk-material-sublayer="base-glass-fill"
              style={{
                backgroundColor: "var(--lk-surface)",
                opacity: getGlassFillOpacity(glassProps?.thickness || "normal"),
              }}
            ></div>
          </div>
        )}

        {type === "flat" && (
          <div>
            <div
              data-lk-material-sublayer="bgColor"
              style={{
                backgroundColor: getBgColor(flatProps?.bgColor),
              }}
            ></div>
          </div>
        )}
      </div>
    </>
  );
}

function getGlassFillOpacity(thickness: "thick" | "normal" | "thin") {
  switch (thickness) {
    case "thick":
      return 0.8;
    case "normal":
      return 0.6;
    case "thin":
      return 0.4;
    default:
      return 0.6;
  }
}

function getBgColor(token: LkColorWithOnToken | undefined) {
  if (token) {
    return `var(--lk-${token})`;
  } else {
    return `var(--lk-surface)`;
  }
}
