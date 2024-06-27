import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/types';
import { GestureHandlerRootView, ScrollView } from "react-native-gesture-handler";


type TherapyHistoryProps = {
  navigation: StackNavigationProp<RootStackParamList, 'TherapyHistory'>;
};

const TherapyHistory: React.FC<TherapyHistoryProps> = ({ navigation }) => {
  const [Therapy_Transaction_Id, setTherapy_Transaction_Id] = useState('');
  const [Patient_Id, setPatient_Id] = useState('');
  const [Therapy_Id, setTherapy_Id] = useState('');
  const [Therapy_Type, setTherapy_Type] = useState('');
  const [Therapy_Date, setTherapy_Date] = useState('');
  const [TherapyStart_Time, setTherapyStart_Time] = useState('');
  const [TherapyEnd_Time, setTherapyEnd_Time] = useState('');
  const [Therapy_Duration, setTherapy_Duration] = useState('');
  const [Remark, setRemark] = useState('');
  const [LifeSwitch_Conversation_Link, setLifeSwitch_Conversation_Link] = useState('');
  const [LifeSwitch_Contact_Link, setLifeSwitch_Contact_Link] = useState('');


  const handleUpdatePatient = () => {
    if (Therapy_Transaction_Id.trim() === "" || Patient_Id.trim() === "" || Therapy_Duration.trim() === "") {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    // Perform logic to add patient
    // For example, you can make an API call here to add the patient
    // After adding the patient, you can navigate to another screen or perform any necessary actions
    Alert.alert("Success", "Therapy Details Fill successfully");
  };
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView>
        <View style={styles.container}>
          <Text style={styles.title}>Therapy History</Text>
          <View style={styles.inputContainer}>
            <Text style={[styles.label,]}>Therapy_Transaction_Id:</Text>
            <TextInput
              style={styles.input}
              value={Therapy_Transaction_Id}
              onChangeText={setTherapy_Transaction_Id}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.label,]}>PatientId:</Text>
            <TextInput
              style={styles.input}
              value={Patient_Id}
              onChangeText={setPatient_Id}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.label,]}>TherapyId:</Text>
            <TextInput
              style={styles.input}
              value={Therapy_Id}
              onChangeText={setTherapy_Id}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.label,]}>TherapyType:</Text>
            <TextInput
              style={styles.input}
              value={Therapy_Type}
              onChangeText={setTherapy_Type}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.label,]}>TherapyDate:</Text>
            <TextInput
              style={styles.input}
              value={Therapy_Date}
              onChangeText={setTherapy_Date}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.label,]}>TherapyStartTime:</Text>
            <TextInput
              style={styles.input}
              value={TherapyStart_Time}
              onChangeText={setTherapyStart_Time}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.label,]}>TherapyEndTime:</Text>
            <TextInput
              style={styles.input}
              value={TherapyEnd_Time}
              onChangeText={setTherapyEnd_Time}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, ]}>TherapyDuration:</Text>
            <TextInput
              style={styles.input}
              value={Therapy_Duration}
              onChangeText={setTherapy_Duration}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.label,]}>Remark:</Text>
            <TextInput
              style={styles.input}
              value={Remark}
              onChangeText={setRemark}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.label,]}>LifeSwitch_Conversation_Link:</Text>
            <TextInput
              style={styles.input}
              value={LifeSwitch_Conversation_Link}
              onChangeText={setLifeSwitch_Conversation_Link}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.label,]}>LifeSwitch_Contact_Link:</Text>
            <TextInput
              style={styles.input}
              value={LifeSwitch_Contact_Link}
              onChangeText={setLifeSwitch_Contact_Link}
            />
          </View>
          <View style={styles.btn}>
            <Button
              color="#264d73"
              title="Save"
              onPress={handleUpdatePatient}
            />
          </View>
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 30,

  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    width: "80%",
  },
  
  title: {
    fontSize: 30,
    marginBottom: 20,
    color: "#2a7fba",
    textAlign: "center",
    fontWeight:'bold'
  },
  inputout: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor:'white',
    flex:1,
  },

  labelText: {
    width: 120, // Set a fixed width for labels to align them
    textAlign: "right", // Align text to the right within the label container
   // Add some spacing between label and input
    marginBottom: 5,
    color: "white",
  },
  label: {
    width: "97%",
    color: "black",
    fontSize: 15,
    flex:1,
    marginBottom:5,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#d3eaf2",
    borderRadius: 5,
    color: "#333",
    width: "100%", // Take up full width
    marginBottom: 10,
  },
  btn: {
    marginTop: 10,
    width: "50%",
    marginLeft:80,
  },
});

export default TherapyHistory;
