import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  NavigationProp,
  ParamListBase,
  useNavigation,
  useIsFocused,
} from "@react-navigation/native";
import axios from "axios";
import { useSession } from "../context/SessionContext";
import Icon from "react-native-vector-icons/FontAwesome";
import axiosInstance from "../utils/axiosConfig";
import BackTabTop from "./BackTopTab";

interface Patient {
  _id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string;
  patient_email: string;
}

interface Props {
  navigation: NavigationProp<ParamListBase>;
}

const SearchPatients: React.FC<Props> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [noResultsMessage, setNoResultsMessage] = useState("");
  const searchInputRef = useRef<TextInput>(null);
  const isFocused = useIsFocused();

  const { session } = useSession();

  // Auto-focus the search input when the screen is focused
  useEffect(() => {
    if (isFocused && searchInputRef.current) {
      // Small delay to ensure the keyboard shows up properly after navigation
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isFocused]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      handleSearch();
    } else {
      setSearchResults([]);
      setNoResultsMessage("");
    }
  }, [searchQuery]);

  const handleSearch = async () => {
    setIsLoading(true);
    setNoResultsMessage("");
    try {
      const response = await axiosInstance.get(
        `/search/patient?query=${searchQuery}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + session.idToken,
          },
        }
      );
      setSearchResults(response.data.patients);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setSearchResults([]);
        setNoResultsMessage("No patients found with this name.");
      } else {
        console.error("Error searching patients:", error);
        setNoResultsMessage("Type something Please...");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToPatient = (patientId: string) => {
    navigation.navigate("Patient", { patientId });
  };

  const renderPatientItem = ({ item }: { item: Patient }) => (
    <TouchableOpacity
      style={styles.patientItem}
      onPress={() => navigateToPatient(item._id)}
    >
      <Text style={styles.patientName}>
        {item.patient_first_name} {item.patient_last_name}
      </Text>
      <Text style={styles.patientDetails}>{item.patient_phone}</Text>
      <Text style={styles.patientDetails}>{item.patient_email}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={styles.searchContainer}>
        <TextInput
          ref={searchInputRef}
          style={styles.searchBar}
          placeholder="Search by name"
          placeholderTextColor="rgba(255, 255, 255, 0.8)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={true} // Enable auto-focus
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
          <Icon
            name="search"
            size={20}
            color="#333333"
            style={styles.searchIcon}
          />
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color="white" />
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderPatientItem}
          keyExtractor={(item) => item._id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            noResultsMessage ? (
              <Text style={styles.emptyText}>{noResultsMessage}</Text>
            ) : null
          }
        />
      )}
    </KeyboardAvoidingView>
  );
};

// Updated styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#119FB3",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 20,
    padding: 10,
    marginTop: 10,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    color: "#ffffff",
  },
  searchIcon: {
    marginLeft: 8,
    marginRight: 8,
    color: "#333333",
  },
  searchButton: {
    padding: 10,
  },
  patientItem: {
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  patientName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  patientDetails: {
    fontSize: 14,
    color: "#666666",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666666",
  },
});

export default SearchPatients;
