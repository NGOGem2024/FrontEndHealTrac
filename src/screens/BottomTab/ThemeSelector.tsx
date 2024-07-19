import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Text,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "../ThemeContext";
import { themeColors } from "../Theme";

const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const renderItem = ({ item }: { item: keyof typeof themeColors }) => (
    <TouchableOpacity
      style={[
        styles.colorCircle,
        { backgroundColor: themeColors[item].primary },
      ]}
      onPress={() => {
        setTheme(item);
        setModalVisible(false);
      }}
    />
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="color-palette-outline" size={24} color="#fff" />
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Theme</Text>
            <FlatList
              data={Object.keys(themeColors) as Array<keyof typeof themeColors>}
              renderItem={renderItem}
              keyExtractor={(item) => item}
              numColumns={3}
              contentContainerStyle={styles.flatList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 23,
    // Adjust this value based on your header's top padding
  },
  iconButton: {
    padding: 8,
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#fff",
    marginHorizontal: 5,
    marginVertical: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: 300,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  flatList: {
    justifyContent: "center",
  },
});

export default ThemeSelector;
