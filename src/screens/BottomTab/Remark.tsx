import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Remark: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>Remark</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Remark;
