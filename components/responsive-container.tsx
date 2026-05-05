import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

const DEFAULT_MAX_WIDTH = 720;

type Props = ViewProps & {
  maxWidth?: number;
  style?: ViewStyle | ViewStyle[];
};

export function ResponsiveContainer({
  maxWidth = DEFAULT_MAX_WIDTH,
  style,
  children,
  ...rest
}: Props) {
  return (
    <View style={[styles.container, { maxWidth }, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
});
