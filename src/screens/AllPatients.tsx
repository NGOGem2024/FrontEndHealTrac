import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  ScaledSize,
  TextInput,
} from "react-native";
import axios from "axios";
import Icon from "react-native-vector-icons/FontAwesome";
import { NavigationProp, ParamListBase } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSession } from "../context/SessionContext";

interface Props {
  navigation: NavigationProp<ParamListBase>;
}

interface Patient {
  _id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string;
  patient_email: string;
  patient_registration_date: string;
}

const AllPatients: React.FC<Props> = ({ navigation }) => {
  const { session, refreshAllTokens } = useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [filterOption, setFilterOption] = useState("all");
  const [sortOption, setSortOption] = useState("date");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(
    Dimensions.get("window")
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    const updateDimensions = ({ window }: { window: ScaledSize }) => {
      setScreenDimensions(window);
    };

    const subscription = Dimensions.addEventListener(
      "change",
      updateDimensions
    );

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [session]);

  const fetchPatients = async (pageNumber = 1) => {
    if (!session) return;
    try {
      if (pageNumber === 1) setIsLoading(true);
      await refreshAllTokens();
      const response = await axios.get(
        `https://healtrackapp-production.up.railway.app/patient/getall?page=${pageNumber}&limit=20`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + session.tokens.idToken,
          },
        }
      );
      if (pageNumber === 1) {
        setPatients(response.data.patients);
        setFilteredPatients(response.data.patients);
      } else {
        setPatients((prevPatients) => [
          ...prevPatients,
          ...response.data.patients,
        ]);
        setFilteredPatients((prevFiltered) => [
          ...prevFiltered,
          ...response.data.patients,
        ]);
      }
      setTotalPages(response.data.totalPages);
      setPage(response.data.currentPage);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (page < totalPages && !isLoadingMore) {
      setIsLoadingMore(true);
      fetchPatients(page + 1);
    }
  };

  useEffect(() => {
    const filtered = patients.filter((patient) => {
      if (filterOption === "all") {
        return true;
      } else if (filterOption === "oneWeek") {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(patient.patient_registration_date) >= oneWeekAgo;
      } else if (filterOption === "oneMonth") {
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return new Date(patient.patient_registration_date) >= oneMonthAgo;
      } else if (filterOption === "oneYear") {
        const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        return new Date(patient.patient_registration_date) >= oneYearAgo;
      }
      return true;
    });

    const sorted =
      sortOption === "date"
        ? filtered.sort((a, b) => {
            const dateA = new Date(a.patient_registration_date);
            const dateB = new Date(b.patient_registration_date);
            if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
            if (isNaN(dateA.getTime())) return 1;
            if (isNaN(dateB.getTime())) return -1;
            return dateB.getTime() - dateA.getTime();
          })
        : filtered.sort((a, b) => {
            const fullName1 =
              `${a.patient_first_name} ${a.patient_last_name}`.toLowerCase();
            const fullName2 =
              `${b.patient_first_name} ${b.patient_last_name}`.toLowerCase();
            return fullName1.localeCompare(fullName2);
          });

    setFilteredPatients(sorted);
  }, [filterOption, sortOption, patients]);

  const handleAddPatient = () => {
    navigation.navigate("PatientRegister");
  };

  const handleSearch = () => {
    navigation.navigate("SearchPatients");
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    try {
      await fetchPatients(1);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const navigateToPatient = (patientId: string) => {
    if (patientId) {
      navigation.navigate("Patient", { patientId });
    } else {
      console.error("Invalid patient ID:", patientId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    return date.toLocaleDateString();
  };

  const renderFooter = () => {
    if (page >= totalPages) return null;

    return (
      <TouchableOpacity
        onPress={loadMore}
        style={styles.loadMoreButton}
        disabled={isLoadingMore}
      >
        <Text style={styles.loadMoreButtonText}>
          {isLoadingMore ? "Loading.." : "Load More"}
        </Text>
        {isLoadingMore && (
          <ActivityIndicator
            size="small"
            color="#FFFFFF"
            style={styles.loadingIndicator}
          />
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading && page === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#119FB3" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../assets/bac2.jpg")}
      style={styles.backgroundImage}
    >
      <View style={[styles.header, { height: screenDimensions.height * 0.1 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
      <View
        style={[styles.container, { height: screenDimensions.height * 0.9 }]}
      >
        <TouchableOpacity
          style={styles.searchContainer}
          onPress={handleSearch}
          activeOpacity={1}
        >
          <TextInput
            style={styles.searchBar}
            placeholder="Search by name"
            placeholderTextColor="rgba(255, 255, 255, 0.8)"
            editable={false}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Icon
              name="search"
              size={18}
              color="#333333"
              style={styles.searchIcon}
            />
          </TouchableOpacity>
        </TouchableOpacity>

        <View style={styles.filtersContainer1}>
          <View style={styles.filterContainer}>
            <Picker
              style={styles.picker}
              selectedValue={filterOption}
              onValueChange={(itemValue) => setFilterOption(itemValue)}
            >
              <Picker.Item label="All" value="all" />
              <Picker.Item label="One Week" value="oneWeek" />
              <Picker.Item label="One Month" value="oneMonth" />
              <Picker.Item label="One Year" value="oneYear" />
            </Picker>
          </View>
          <View style={styles.filterContainer}>
            <Picker
              style={styles.picker}
              selectedValue={sortOption}
              onValueChange={(itemValue) => setSortOption(itemValue)}
            >
              <Picker.Item label="Sort by Date" value="date" />
              <Picker.Item label="Sort by Name" value="name" />
            </Picker>
          </View>
        </View>
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigateToPatient(item._id)}>
              <View style={styles.patientCard}>
                <View
                  style={{ flexDirection: "row", justifyContent: "flex-start" }}
                >
                  <Image
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      marginTop: 10,
                      borderWidth: 3,
                      borderColor: "white",
                    }}
                    source={require("../assets/profile3.jpg")}
                  />
                  <View style={{ flexDirection: "column", marginLeft: 10 }}>
                    <Text style={styles.patientName}>
                      {item.patient_first_name} {item.patient_last_name}
                    </Text>
                    <View style={styles.microicon}>
                      <MaterialIcons name="call" size={12} color="#119FB3" />
                      <Text style={styles.patientPhone}>
                        {item.patient_phone}
                      </Text>
                    </View>
                    <View style={styles.microicon}>
                      <MaterialIcons name="email" size={12} color="#119FB3" />
                      <Text style={styles.patientPhone}>
                        {item.patient_email}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.patientDate}>
                  FV: {formatDate(item.patient_registration_date)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
        />
        <TouchableOpacity onPress={handleAddPatient} style={styles.addButton}>
          <Icon name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#119FB3",
  },
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#119FB3",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 16,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
    fontSize: 16,
    color: "#ffffff",
  },
  searchIcon: {
    marginLeft: 8,
    marginRight: 8,
    color: "#333333",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 20,
    padding: 10,
    marginBottom: 16,
  },

  loadingIndicator: {},
  footerContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginVertical: 10,
  },
  loadingText: {
    color: "#119FB3",
    marginTop: 5,
    fontSize: 12,
    textAlign: "center",
  },
  loadMoreButton: {
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 10,
  },
  loadMoreButtonText: {
    color: "#119FB3",
    fontWeight: "bold",
  },
  filtersContainer1: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  filterContainer: {
    flex: 1,
    marginRight: 8,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 20,
    padding: 0,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#ffffff",
    textAlign: "center",
  },
  picker: {
    backgroundColor: "transparent",
    color: "grey",
  },
  patientCard: {
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    elevation: 4,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  patientName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333333",
  },
  patientPhone: {
    fontSize: 12,
    marginTop: 0,
    marginBottom: 0,
    color: "#333333",
    textAlign: "left",
  },
  patientDate: {
    fontSize: 10,
    color: "#666666",
  },
  addButton: {
    backgroundColor: "#119FB3",
    borderRadius: 50,
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 20,
    right: 20,
    elevation: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#119FB3",
    justifyContent: "space-between",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 5,
    fontSize: 18,
  },
  searchButton: {
    padding: 10,
  },
  microicon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
});

export default AllPatients;
