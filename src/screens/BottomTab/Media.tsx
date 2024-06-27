import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/types';

type MediaProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Media'>;
};


const Media = () => {
  return (
    <View>
      <Text>Media</Text>
    </View>
  )
}

export default Media

const styles = StyleSheet.create({})