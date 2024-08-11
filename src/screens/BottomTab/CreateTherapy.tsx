import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  KeyboardTypeOptions,
  ActivityIndicator,
  ScrollView,
  TurboModuleRegistry,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../types/types";
import axios from "axios";
import { MaterialIcons, FontAwesome, AntDesign } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useSession } from "../../context/SessionContext";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AddNewTherapyScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "CreateTherapy">;
  route: { params: { patientId: string } };
};

const CreateTherapy: React.FC<AddNewTherapyScreenProps> = ({
  navigation,
  route,
}) => {
  const { session, refreshAllTokens } = useSession();
  const { patientId } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [therapyData, setTherapyData] = useState({
    therapy_type: "",
    therapy_remarks: "",
    therapy_cost: "",
  });

  const [selectedCategory, setSelectedCategory] = useState("");
  const [error, setError] = useState("");

  const categories = ["Virtual", "In Clinic", "InHome"];

  const [therapyDate, setTherapyDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(
    new Date(new Date().getTime() + 60 * 60 * 1000)
  ); // Default to 1 hour after start time
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [fadeAnim] = useState(new Animated.Value(1));

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTherapyDate(selectedDate);
    }
  };

  const onChangeStartTime = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      setStartTime(selectedTime);
      // Automatically set end time to 1 hour after start time
      setEndTime(new Date(selectedTime.getTime() + 60 * 60 * 1000));
    }
  };

  const onChangeEndTime = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      setEndTime(selectedTime);
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const showStartTimepicker = () => {
    setShowStartTimePicker(true);
  };

  const showEndTimepicker = () => {
    setShowEndTimePicker(true);
  };

  const handleAddTherapy = async () => {
    if (!session || !session.tokens || !session.tokens.idToken) {
      Alert.alert("Error", "Please log in to add a therapy.");
      return;
    }
    setIsLoading(true);
    try {
      const liveSwitchToken = await AsyncStorage.getItem("liveSwitchToken");
      console.log(liveSwitchToken);
      const formatTime = (date: Date) => {
        return date.toTimeString().split(" ")[0].substr(0, 5);
      };

      const requestBody = {
        contactId: patientId,
        message: "Please click the following LiveSwitch conversation link.",
        type: "LiveConversation",
        autoStartRecording: true,
        sendSmsNotification: true,
        remarks: therapyData.therapy_remarks,
        therepy_type: selectedCategory,
        therepy_date: therapyDate.toISOString().split("T")[0],
        therepy_start_time: formatTime(startTime),
        therepy_end_time: formatTime(endTime), // Added end time
      };
      const response = await axios.post(
        "https://healtrackapp-production.up.railway.app/therepy/create",
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.tokens.idToken}`,
            auth: `Bearer ${session.tokens.accessToken}`,
            "X-liveSwitch-token": liveSwitchToken,
          },
        }
      );
      console.log(requestBody);

      if (response.status === 200 || response.status === 201) {
        Alert.alert("Success", "Therapy added successfully");
        navigation.goBack();
      } else {
        setError("Failed to add therapy. Please try again.");
      }
    } catch (error) {
      setError("An error occurred while adding therapy.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scrollView}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Text style={styles.title}>Add New Therapy</Text>
        <Dropdown
          value={selectedCategory}
          onValueChange={(itemValue) => setSelectedCategory(itemValue)}
          items={categories}
        />

        <DatePickerField
          label="Therapy Date"
          date={therapyDate}
          showDatePicker={showDatePicker}
          onPress={showDatepicker}
          onChange={onChangeDate}
        />

        <TimePickerField
          label="Start Time"
          time={startTime}
          showTimePicker={showStartTimePicker}
          onPress={showStartTimepicker}
          onChange={onChangeStartTime}
        />

        <TimePickerField
          label="End Time"
          time={endTime}
          showTimePicker={showEndTimePicker}
          onPress={showEndTimepicker}
          onChange={onChangeEndTime}
        />

        <InputField
          icon={<MaterialIcons name="book" size={24} color="#119FB3" />}
          placeholder="Therapy Remarks (e.g., 3 times a week)"
          value={therapyData.therapy_remarks}
          onChangeText={(text) =>
            setTherapyData({ ...therapyData, therapy_remarks: text })
          }
        />
        <InputField
          icon={<FontAwesome name="money" size={24} color="#119FB3" />}
          placeholder="Therapy Cost"
          value={therapyData.therapy_cost}
          onChangeText={(text) =>
            setTherapyData({ ...therapyData, therapy_cost: text })
          }
          keyboardType="numeric"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleAddTherapy}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Add Therapy</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
};

const InputField = ({
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default" as KeyboardTypeOptions,
}) => (
  <View style={styles.inputContainer}>
    {icon}
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      placeholderTextColor="#A0A0A0"
    />
  </View>
);

const DatePickerField = ({
  label,
  date,
  showDatePicker,
  onPress,
  onChange,
}) => (
  <View style={styles.dateTimeBlock}>
    <Text style={styles.dateTimeLabel}>{label}</Text>
    <TouchableOpacity style={styles.dateTimeContainer} onPress={onPress}>
      <Text style={styles.dateTimeText}>{date.toLocaleDateString()}</Text>
      <FontAwesome name="calendar" size={24} color="#119FB3" />
    </TouchableOpacity>
    {showDatePicker && (
      <DateTimePicker
        value={date}
        mode="date"
        display="default"
        onChange={onChange}
      />
    )}
  </View>
);

const TimePickerField = ({
  label,
  time,
  showTimePicker,
  onPress,
  onChange,
}) => (
  <View style={styles.dateTimeBlock}>
    <Text style={styles.dateTimeLabel}>{label}</Text>
    <TouchableOpacity style={styles.dateTimeContainer} onPress={onPress}>
      <Text style={styles.dateTimeText}>{time.toLocaleTimeString()}</Text>
      <AntDesign name="clockcircle" size={24} color="#119FB3" />
    </TouchableOpacity>
    {showTimePicker && (
      <DateTimePicker
        value={time}
        mode="time"
        is24Hour={true}
        display="default"
        onChange={onChange}
      />
    )}
  </View>
);

const Dropdown = ({ value, onValueChange, items }) => (
  <View style={styles.inputContainer}>
    <MaterialIcons name="category" size={24} color="#119FB3" />
    <Picker
      selectedValue={value}
      onValueChange={onValueChange}
      style={styles.picker}
    >
      <Picker.Item label="Therapy Type" value="" />
      {items.map((item, index) => (
        <Picker.Item key={index} label={item} value={item} />
      ))}
    </Picker>
  </View>
);

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: "#F0F8FF",
  },
  container: {
    flex: 1,
    padding: 30,
    backgroundColor: "#F0F8FF",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#119FB3",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 25,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    elevation: 2,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: "#333333",
    fontSize: 16,
    paddingVertical: 12,
  },
  dateTimeBlock: {
    marginBottom: 20,
  },
  dateTimeLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#119FB3",
    marginBottom: 5,
  },
  dateTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 2,
  },
  dateTimeText: {
    fontSize: 16,
    color: "#333333",
  },
  saveButton: {
    backgroundColor: "#119FB3",
    paddingVertical: 12,
    borderRadius: 10,
    width: "50%",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  picker: {
    flex: 1,
    marginLeft: 10,
    color: "#333333",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
});

export default CreateTherapy;
