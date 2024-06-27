import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { View, Text } from 'react-native';
import { RootStackParamList } from '../../types/types';

type ReportProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Report'>;
};

const Report = () => {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Report</Text>
    </View>
  );
}

export default Report;
