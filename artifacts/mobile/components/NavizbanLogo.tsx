import React from "react";
import { Platform, View, Image } from "react-native";
import { LOGO_SVG } from "@/constants/logo-svg";

const ASPECT = 2426 / 435;

interface NavizbanLogoProps {
  height?: number;
}

export function NavizbanLogo({ height = 22 }: NavizbanLogoProps) {
  const width = Math.round(ASPECT * height);

  if (Platform.OS === "web") {
    // Web'de SVG'yi direkt HTML olarak render et (react-native-svg uyumsuzluğu nedeniyle)
    return (
      <View
        style={{
          width,
          height,
          filter: "drop-shadow(0 0 6px rgba(16,79,165,0.55))",
          overflow: "hidden",
        } as any}
      >
        <div
          style={{ width: "100%", height: "100%" }}
          dangerouslySetInnerHTML={{
            __html: LOGO_SVG.replace("<svg ", '<svg width="100%" height="100%" '),
          }}
        />
      </View>
    );
  }

  // Native'de base64 data URI ile SVG render et
  return (
    <View
      style={{
        width,
        height,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Image
        source={{
          uri: "data:image/svg+xml;base64," + btoa(
            LOGO_SVG.replace("<svg ", `<svg width="${width}" height="${height}" `)
          ),
        }}
        style={{ width, height }}
        resizeMode="contain"
      />
    </View>
  );
}
