import React, { useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Navigate to your main screen after 3 seconds
      navigation.replace("TabScreen");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image source={require("../assets/medaxlogo.png")} style={styles.logo} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 400,
    height: 200,
  },
});

export default SplashScreen;
