import { Platform, ScrollView, ScrollViewProps } from "react-native";

// react-native-keyboard-controller opsiyonel — yüklü değilse ScrollView'a düş
let KeyboardAwareScrollView: any = null;
try {
  KeyboardAwareScrollView = require("react-native-keyboard-controller").KeyboardAwareScrollView;
} catch {}

type Props = ScrollViewProps;

export function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = "handled",
  ...props
}: Props) {
  if (Platform.OS === "web" || !KeyboardAwareScrollView) {
    return (
      <ScrollView keyboardShouldPersistTaps={keyboardShouldPersistTaps} {...props}>
        {children}
      </ScrollView>
    );
  }
  return (
    <KeyboardAwareScrollView
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      {...props}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
