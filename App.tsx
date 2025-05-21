import React, { useEffect, useState } from 'react';
import MapView, { Geojson} from 'react-native-maps';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
const customData = require('./data/reseau_cyclable_simple.geojson.json');

export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getCurrentLocation() {
      try {
        setIsLoading(true);
        
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          setIsLoading(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
      } catch (error) {
        console.error("Error getting location:", error);
        setErrorMsg('Failed to get location');
      } finally {
        setIsLoading(false);
      }
    }
    
    getCurrentLocation();
  }, []);
  

  // Render loading indicator while waiting for location
  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  // Render error message if there's an error
  if (errorMsg) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  // Only render the map when we have location data
  return (
    <View style={styles.container}>
      {location && (
        <MapView 
          style={styles.map} 
          showsUserLocation={true}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {customData && (
            <Geojson
              geojson={customData}
              strokeColor="#FF0000"
              strokeWidth={2}
            />
          )}
           </MapView>
        
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});