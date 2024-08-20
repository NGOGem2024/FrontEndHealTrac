import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  ImageBackgroundBase,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../types/types"; // Update with the correct path
import {
  MaterialIcons,
  AntDesign,
  Octicons,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { LinearGradient } from "expo-linear-gradient";
import { Title } from "react-native-paper";
import TherapyTable from "../UpdateTherapy"; // Update with the correct pat
import { useSession } from "../../context/SessionContext";

type PatientScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "Patient">;
  route: { params: { patientId: string; preloadedData?: any } };
};
const PatientScreen: React.FC<PatientScreenProps> = ({ navigation, route }) => {
  const { session, refreshAllTokens } = useSession();
  const { patientId } = route.params;
  const [patientData, setPatientData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [therapyHistoryVisible, setTherapyHistoryVisible] =
    useState<boolean>(false);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!session || patientData) return;
      try {
        setIsLoading(true);
        await refreshAllTokens();
        const response = await fetch(
          `https://healtrackapp-production.up.railway.app/patient/${patientId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + session.tokens.idToken,
            },
          }
        );
        const data = await response.json();
        setPatientData(data.patientData);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId, session, patientData]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#119FB3" />
      </View>
    );
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.main}>
        <Image
          source={require("../../assets/bac2.jpg")}
          resizeMode="cover"
          style={styles.backcover}
        ></Image>
        {/* <LinearGradient
        colors={["#d4dfed", "#3c8ce7"]}
        style={{ height: "15%" }}
        /> */}
        <View
          style={{
            paddingLeft: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          {patientData ? (
            <>
              <Image
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 140 / 2,
                  marginTop: 10,
                  borderWidth: 3,
                  borderColor: "white",
                }}
                source={require("../../assets/profile3.jpg")}
              />

              <Title
                style={{ fontSize: 23, color: "white", fontWeight: "bold" }}
              >
                {patientData.patient_first_name} {patientData.patient_last_name}
              </Title>

              <View style={styles.content}>
                <MaterialIcons name="email" size={20} color="white" />
                <Text style={styles.mytext}> {patientData.patient_email}</Text>
              </View>

              <View style={styles.content}>
                <MaterialIcons name="call" size={20} color="white" />
                <Text style={styles.mytext}> {patientData.patient_phone}</Text>
              </View>

              <View style={styles.content}>
                <AntDesign name="idcard" size={20} color="white" />
                <Text style={styles.mytext}> {patientData.patient_id}</Text>
              </View>

              <View style={styles.content}>
                <MaterialIcons name="location-on" size={20} color="white" />
                <Text style={styles.mytext}>
                  {" "}
                  {patientData.patient_address1}
                </Text>
              </View>
            </>
          ) : (
            <Text>Loading...</Text>
          )}
        </View>

        <ScrollView style={styles.botscrview}>
          <Text style={styles.headlist}>Account Overview</Text>
          <View style={styles.container}>
            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() =>
                navigation.navigate("UpdatePatient", {
                  patientId: patientId,
                })
              }
              disabled={!patientData}
            >
              <View style={styles.iconleft}>
                <MaterialCommunityIcons
                  name="square-edit-outline"
                  size={30}
                  color="#65b6e7"
                  style={styles.iconlist}
                />
                <Text style={styles.link}>Update Patient</Text>
              </View>
              <Octicons name="chevron-right" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() =>
                navigation.navigate("UpdateTherapy", {
                  patientId: patientData?.patient_id,
                })
              }
              disabled={!patientData}
            >
              <View style={styles.iconleft}>
                <Ionicons
                  name="medical"
                  size={30}
                  color="#55b55b"
                  style={[styles.iconlist, styles.therapyicon]}
                />
                <Text style={styles.link}>Therapy Session</Text>
              </View>
              <Octicons name="chevron-right" size={24} color="black" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() =>
                navigation.navigate("CreateTherapy", {
                  patientId: patientData?.patient_id,
                })
              }
              disabled={!patientData}
            >
              <View style={styles.iconleft}>
                <MaterialCommunityIcons
                  name="file"
                  size={30}
                  color="#6e54ef"
                  style={[styles.iconlist, styles.reportsicon]}
                />
                <Text style={styles.link}>Create Therapy</Text>
              </View>
              <Octicons name="chevron-right" size={24} color="black" />
            </TouchableOpacity>

            {/* <TouchableOpacity style={styles.linkContainer}>
              <View style={styles.iconleft}>
                <MaterialCommunityIcons
                  name="chat"
                  size={30}
                  color="#e86e2f"
                  style={[styles.iconlist, styles.remarksicon]}
                />
                <Text style={styles.link}>Remarks</Text>
              </View>
              <Octicons name="chevron-right" size={24} color="black" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkContainer}>
              <View style={styles.iconleft}>
                <MaterialIcons
                  name="perm-media"
                  size={30}
                  color="#c4298e"
                  style={[styles.iconlist, styles.mediaicon]}
                />
                <Text style={styles.link}>Media</Text>
              </View>
              <Octicons name="chevron-right" size={24} color="black" />
            </TouchableOpacity> */}
          </View>
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  content: {
    flexDirection: "row",
    margin: 3,
  },
  mytext: {
    fontSize: 14,

    color: "white",
    fontWeight: "bold",
  },

  botscrview: {
    display: "flex",
    backgroundColor: "white",
    width: "100%",
    borderTopLeftRadius: 40,
    marginTop: 20,
    borderTopRightRadius: 40,
    paddingTop: 20,
  },
  container: {
    display: "flex",
    padding: 20,
    rowGap: 1,
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    flexDirection: "column",
    margin: 10,
    marginTop: 0,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
  },
  link: {
    fontSize: 16,
    marginLeft: 15,
    color: "black",
    rowGap: 5,
    fontWeight: "bold",
    // elevation:20,
  },
  linkContainer: {
    paddingHorizontal: 10,
    display: "flex",
    // color: "#d3eaf2",
    borderRadius: 10,
    marginHorizontal: 20,
    marginLeft: -15,
    height: 60,
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    flexDirection: "row",
  },
  content1: {
    margin: 5,
    fontSize: 10,
    marginBottom: -15,
  },
  iconleft: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  iconlist: {
    padding: 7,
    borderRadius: 15,
    backgroundColor: "#d6e6f2",
  },
  headlist: {
    fontSize: 16,
    fontWeight: "bold",
    margin: 20,
    marginBottom: 0,
  },
  therapyicon: {
    backgroundColor: "#d3edda",
  },
  reportsicon: {
    backgroundColor: "#dddaf2",
  },
  remarksicon: {
    backgroundColor: "#ebe0dc",
  },
  mediaicon: {
    backgroundColor: "#eaddeb",
  },
  backcover: {
    position: "absolute",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: "#119FB3",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 5,
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
  },
});

export default PatientScreen;
