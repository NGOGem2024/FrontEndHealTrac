import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import axios from "axios";
import {
  Ionicons,
  MaterialIcons,
  Entypo,
  FontAwesome,
  FontAwesome5,
  FontAwesome6,
  AntDesign,
} from "@expo/vector-icons";
import { BsClockHistory } from "react-icons/bs";
import DateTimePicker from "@react-native-community/datetimepicker";

type UpdatePatientProps = {
  navigation: StackNavigationProp<RootStackParamList, "UpdatePatient">;
  route: { params: { patientId: string } };
};

const UpdatePatient: React.FC<UpdatePatientProps> = ({ navigation, route }) => {
  const { patientId } = route.params;

  const [patientData, setPatientData] = useState({
    patient_first_name: "",
    patient_last_name: "",
    patient_email: "",
    patient_phone: "",
    patient_gender: "",
    patient_address1: "",
    patient_address2: "",
    patient_age: "",
    patient_bloodGroup: "",
    patient_symptoms: "",
    patient_diagnosis: "",
    patient_therapy_type: "",
    therepy_duration: "",
  });

  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [duration, setDuration] = useState("");

  useEffect(() => {
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDuration(`${diffDays} days`);
    }
  }, [startDate, endDate]);

  const onChangeStartDate = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onChangeEndDate = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const showStartDatepicker = () => {
    setShowStartDatePicker(true);
  };

  const showEndDatepicker = () => {
    setShowEndDatePicker(true);
  };

  const handlePatientUpdate = async () => {
    try {
      console.log(patientId);
      console.log(patientData);
      const response = await axios.post(
        `https://healtrackapp-production.up.railway.app/patient/update/${patientId}`,
        patientData
      );
      console.log("Response:", response.data);
      // Handle successful registration, e.g., show a success message
      Alert.alert("Success", "Patient registered successfully");
      navigation.navigate("UpdatePatient");
    } catch (error) {
      console.error("Error registering patient:", error);
      // Handle error, e.g., show an error message
      Alert.alert("Error", "Failed to register patient");
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView>
        <View style={styles.container}>
          <Text style={styles.title}>Update Patient</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person" size={24} color="black" />
            <TextInput
              style={styles.input}
              value={patientData.patient_first_name}
              onChangeText={(text) =>
                setPatientData({ ...patientData, patient_first_name: text })
              }
              placeholder="First Name"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="person" size={24} color="black" />
            <TextInput
              style={styles.input}
              value={patientData.patient_last_name}
              onChangeText={(text) =>
                setPatientData({ ...patientData, patient_last_name: text })
              }
              placeholder="Last Name"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={24} color="black" />
            <TextInput
              style={styles.input}
              value={patientData.patient_email}
              onChangeText={(text) =>
                setPatientData({ ...patientData, patient_email: text })
              }
              placeholder="Email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="call" size={24} color="black" />
            <TextInput
              style={styles.input}
              value={patientData.patient_phone}
              onChangeText={(text) =>
                setPatientData({ ...patientData, patient_phone: text })
              }
              keyboardType="numeric"
              placeholder="Contact No"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="person" size={24} color="black" />
            <TextInput
              style={styles.input}
              value={patientData.patient_gender}
              onChangeText={(text) =>
                setPatientData({ ...patientData, patient_gender: text })
              }
              placeholder="Gender"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="bloodtype" size={24} color="black" />
            <TextInput
              style={styles.input}
              value={patientData.patient_bloodGroup}
              onChangeText={(text) =>
                setPatientData({ ...patientData, patient_bloodGroup: text })
              }
              placeholder="Blood Group"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="numbers" size={24} color="black" />
            <TextInput
              style={styles.input}
              value={patientData.patient_age}
              onChangeText={(text) =>
                setPatientData({ ...patientData, patient_age: text })
              }
              keyboardType="numeric"
              placeholder="Age"
            />
          </View>

          <View style={styles.inputContainer}>
            <Entypo name="address" size={24} color="black" />
            <TextInput
              style={styles.input}
              value={patientData.patient_address1}
              onChangeText={(text) =>
                setPatientData({ ...patientData, patient_address1: text })
              }
              placeholder="Address"
            />
          </View>
          {/* 
          <View style={styles.inputContainer}>
            <Entypo name="address" size={24} color="black" />
            <TextInput
              style={styles.input}
              value={patientData.patient_address2}
              onChangeText={(text) =>
                setPatientData({ ...patientData, patient_address2: text })
              }
              placeholder="Address"
            />
          </View> */}

          <View style={styles.inputContainer}>
            <Ionicons name="id-card" size={24} color="black" />
            <TextInput
              style={styles.input}
              value={patientData.patient_symptoms}
              onChangeText={(text) =>
                setPatientData({ ...patientData, patient_symptoms: text })
              }
              placeholder="Symptom Details"
            />
          </View>

          <View style={styles.inputContainer}>
            <FontAwesome5 name="diagnoses" size={24} color="black" />
            <TextInput
              style={styles.input}
              value={patientData.patient_diagnosis}
              onChangeText={(text) =>
                setPatientData({ ...patientData, patient_diagnosis: text })
              }
              placeholder="Diagnosis Details"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="id-card" size={24} color="black" />
            <TextInput
              style={styles.input}
              value={patientData.patient_therapy_type}
              onChangeText={(text) =>
                setPatientData({ ...patientData, patient_therapy_type: text })
              }
              placeholder="Therapy Type"
            />
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateBlock}>
              {/* <Text style={styles.date}>Start Date</Text> */}
              <View style={styles.dateContainer}>
                <TextInput
                  style={styles.input}
                  value={startDate?.toLocaleDateString()}
                  editable={false}
                />
                <TouchableOpacity onPress={showStartDatepicker}>
                  <FontAwesome name="calendar" size={24} color="black" />
                </TouchableOpacity>
              </View>
              {showStartDatePicker && (
                <DateTimePicker
                  testID="dateTimePickerStart"
                  value={startDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={onChangeStartDate}
                />
              )}
            </View>

            <View style={styles.dateBlock}>
              {/* <Text style={styles.date}>End Date</Text> */}
              <View style={styles.dateContainer1}>
                <TextInput
                  style={styles.input}
                  value={endDate?.toLocaleDateString()}
                  editable={false}
                />
                <TouchableOpacity onPress={showEndDatepicker}>
                  <FontAwesome name="calendar" size={24} color="black" />
                </TouchableOpacity>
              </View>
              {showEndDatePicker && (
                <DateTimePicker
                  testID="dateTimePickerEnd"
                  value={endDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={onChangeEndDate}
                />
              )}
            </View>
          </View>
          <View style={styles.input_dur}>
            <AntDesign name="clockcircle" size={24} color="black" />
            <Text style={styles.durationValue}>{duration}</Text>

            <TextInput
              style={styles.input}
              value={patientData.therepy_duration}
              onChangeText={(text) =>
                setPatientData({ ...patientData, therepy_duration: text })
              }
              editable={false}
            />
          </View>

          <View style={styles.btn}>
            <Button
              color="#2a7fba"
              title="Save"
              onPress={handlePatientUpdate}
            />
          </View>
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    backgroundColor: "#fff", // Set background color here
    marginTop: 10,
    marginLeft: -15,
    height: "100%",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  durationValue: {
    fontSize: 16,
    marginLeft: 20,
  },
  durationContainer: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  date: {
    marginTop: 15,
    marginLeft: 25,
    fontSize: 14,
    fontWeight: "bold",
  },
  formContainer: {
    flex: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#fff", // Set background color here
  },

  inputContainer: {
    flexDirection: "row",
    marginVertical: 0,
    width: "90%",
    backgroundColor: "#d3eaf2",
    paddingHorizontal: 10,
    paddingVertical: 5,
    elevation: 1,
    borderRadius: 10,
    marginTop: 13,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: "black",
    alignItems: "center",
  },
  input_dur: {
    flexDirection: "row",
    marginVertical: 0,
    width: "50%",
    backgroundColor: "#d3eaf2",
    paddingHorizontal: 10,
    paddingVertical: 5,
    elevation: 1,
    borderRadius: 10,
    marginTop: 13,
    maxWidth: "50%",
    justifyContent: "space-evenly",
    textAlign: "center",
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    width: "85%",
  },
  dateBlock: {
    flex: 1,
    // alignItems: 'center',
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    borderWidth: 1,
    // borderColor: "#2a7fba",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderColor: "#fff",
    gap: 5,
    width: "100%",
    backgroundColor: "#d3eaf2",
    marginHorizontal: -7,
    marginBottom: -10,
  },
  dateContainer1: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderColor: "#fff",
    marginHorizontal: 8,
    gap: 5,
    width: "100%",
    marginBottom: -10,
    backgroundColor: "#d3eaf2",
  },
  title: {
    marginTop: 30,
    fontSize: 30,
    marginBottom: 10,
    color: "#2a7fba",
    textAlign: "center",
  },
  btn: {
    marginTop: 20,
    backgroundColor: "#2a7fba",
    color: "white",
    width: "50%",
    height: 40,
  },
});

export default UpdatePatient;
